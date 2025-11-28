import { RouteHandler } from "gadget-server";
import { 
  SyncDirection, 
  shouldSkipSync, 
  updateSyncMetadata, 
  logSyncDecision 
} from "../lib/syncUtils.js";
import { validateStockUpdate, isValidNumber, isNonEmptyString } from "../lib/validation.js";

/**
 * Route handler for receiving stock updates from Supabase webhook
 * Direction: Supabase (StockEasy) → Shopify
 * 
 * Anti-loop mechanism:
 * 1. Check if this update is a response to a recent Shopify → Supabase sync
 * 2. If yes, skip to prevent infinite loop
 * 3. If no, proceed and mark direction as supabase_to_shopify
 * 
 * @type {RouteHandler<{ Body: { type: string, table: string, record: any, old_record: any } }>}
 */
const route = async ({ request, reply, api, logger, connections, config }) => {
  try {
    // Authenticate the request
    const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');

    if (apiKey !== config.STOCKEASY_INTERNAL_API_KEY) {
      logger.warn('Unauthorized webhook request attempt');
      await reply.code(401).send({ error: 'Unauthorized' });
      return;
    }

    // Extract data from webhook payload
    const { record, old_record } = request.body;
    
    if (!record) {
      logger.error({ body: request.body }, 'Invalid webhook payload: missing record');
      await reply.code(400).send({ error: 'Invalid payload: missing record' });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🔍 VALIDATION: Validate incoming data
    // ═══════════════════════════════════════════════════════════════════
    const validationErrors = [];

    // Validate SKU
    if (!record.sku || !isNonEmptyString(record.sku)) {
      validationErrors.push('sku est obligatoire et ne peut pas être vide');
    }

    // Validate stock_actuel
    if (record.stock_actuel === undefined || record.stock_actuel === null) {
      validationErrors.push('stock_actuel est obligatoire');
    } else if (!isValidNumber(record.stock_actuel)) {
      validationErrors.push(`stock_actuel invalide: ${record.stock_actuel}`);
    }

    // Validate company_id (if provided)
    if (record.company_id && typeof record.company_id !== 'string') {
      validationErrors.push(`company_id format invalide: ${record.company_id}`);
    }

    if (validationErrors.length > 0) {
      logger.error({ 
        errors: validationErrors, 
        record 
      }, '❌ Validation failed for stock update webhook');
      await reply.code(400).send({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
      return;
    }

    const sku = record.sku.trim();
    const newStock = Math.floor(Number(record.stock_actuel)); // Ensure integer
    const oldStock = old_record?.stock_actuel !== undefined ? Math.floor(Number(old_record.stock_actuel)) : null;
    const companyId = record.company_id;

    logger.info({ sku, oldStock, newStock, companyId }, 'Received stock update from Supabase (validated)');

    // Skip if stock hasn't changed
    if (newStock === oldStock) {
      logger.info({ sku }, 'Stock unchanged, skipping update');
      await reply.send({ success: true, message: 'Stock unchanged, skipping' });
      return;
    }

    // Find product mapping by SKU (include sync metadata for anti-loop check)
    let mapping;
    try {
      mapping = await api.productMapping.findFirst({
        filter: {
          stockEasySku: { equals: sku }
        },
        select: {
          id: true,
          shopifyVariantId: true,
          shopId: true,
          stockEasySku: true,
          productTitle: true,
          lastSyncDirection: true,
          lastSyncedAt: true
        }
      });
    } catch (error) {
      if (error.message && error.message.includes('no productMapping found')) {
        logger.warn({ sku, companyId }, 'No product mapping found for SKU');
        await reply.code(404).send({ error: 'Product mapping not found' });
        return;
      }
      throw error;
    }

    logger.info({ mappingId: mapping.id, shopId: mapping.shopId, variantId: mapping.shopifyVariantId }, 'Found product mapping');

    // ═══════════════════════════════════════════════════════════════════
    // 🔄 ANTI-LOOP CHECK: Is this update a response to Shopify → Supabase?
    // ═══════════════════════════════════════════════════════════════════
    const syncCheck = shouldSkipSync(mapping, SyncDirection.SUPABASE_TO_SHOPIFY);
    
    logSyncDecision(logger, {
      action: 'supabase_webhook_stock_update',
      sku,
      shopId: mapping.shopId,
      direction: SyncDirection.SUPABASE_TO_SHOPIFY,
      decision: syncCheck.shouldSkip ? 'skip' : 'proceed',
      reason: syncCheck.reason,
      timeSinceLastSync: syncCheck.timeSinceLastSync,
      lastSyncDirection: mapping.lastSyncDirection,
      newStock,
      oldStock
    });

    if (syncCheck.shouldSkip) {
      logger.info({ sku, reason: syncCheck.reason }, '🔄 SKIPPING Supabase→Shopify sync to prevent loop');
      await reply.send({ 
        success: true, 
        message: 'Skipped to prevent sync loop',
        reason: syncCheck.reason,
        sku 
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📝 MARK SYNC DIRECTION BEFORE calling Shopify API
    // This prevents the resulting Shopify webhook from triggering a reverse sync
    // ═══════════════════════════════════════════════════════════════════
    await updateSyncMetadata(api, mapping.id, SyncDirection.SUPABASE_TO_SHOPIFY);
    logger.info({ mappingId: mapping.id, direction: SyncDirection.SUPABASE_TO_SHOPIFY }, '📝 Marked sync direction');

    // Get Shopify connection for this shop
    const shopify = await connections.shopify.forShopId(mapping.shopId);

    // Handle both formats: with and without gid:// prefix
    const variantGid = mapping.shopifyVariantId.startsWith('gid://') 
      ? mapping.shopifyVariantId 
      : `gid://shopify/ProductVariant/${mapping.shopifyVariantId}`;

    // Get variant's inventory item ID
    const variantResponse = await shopify.graphql(`
      query getVariant($id: ID!) {
        productVariant(id: $id) {
          inventoryItem {
            id
          }
        }
      }
    `, {
      id: variantGid
    });

    const inventoryItemId = variantResponse.productVariant?.inventoryItem?.id;

    if (!inventoryItemId) {
      logger.error({ variantId: mapping.shopifyVariantId }, 'No inventory item found for variant');
      await reply.code(500).send({ error: 'Inventory item not found' });
      return;
    }

    logger.info({ inventoryItemId }, 'Found inventory item');

    // Get the shop's default location for stock sync
    const shop = await api.shopifyShop.findOne(mapping.shopId, {
      select: {
        id: true,
        defaultLocationId: true
      }
    });

    if (!shop.defaultLocationId) {
      logger.error({ shopId: mapping.shopId }, 'No default location configured for this shop');
      await reply.code(500).send({ error: 'No default location configured. Please configure a default location in shop settings.' });
      return;
    }

    const locationId = shop.defaultLocationId;
    logger.info({ locationId, shopId: mapping.shopId }, 'Using default location for inventory update');

    // Update Shopify inventory using GraphQL mutation
    const updateResponse = await shopify.graphql(`
      mutation inventorySetOnHandQuantities($input: InventorySetOnHandQuantitiesInput!) {
        inventorySetOnHandQuantities(input: $input) {
          userErrors {
            field
            message
          }
          inventoryAdjustmentGroup {
            createdAt
            reason
            changes {
              name
              delta
            }
          }
        }
      }
    `, {
      input: {
        reason: "correction",
        setQuantities: [
          {
            inventoryItemId: inventoryItemId,
            locationId: `gid://shopify/Location/${locationId}`,
            quantity: Math.floor(newStock)
          }
        ]
      }
    });

    const userErrors = updateResponse.inventorySetOnHandQuantities?.userErrors;

    if (userErrors && userErrors.length > 0) {
      logger.error({ userErrors, sku }, 'Failed to update Shopify inventory');
      await reply.code(500).send({ error: 'Failed to update Shopify', details: userErrors });
      return;
    }

    logger.info(
      { 
        sku, 
        oldStock, 
        newStock, 
        variantId: mapping.shopifyVariantId,
        productTitle: mapping.productTitle,
        locationId 
      }, 
      'Successfully updated Shopify inventory from StockEasy'
    );

    await reply.send({ 
      success: true, 
      sku, 
      oldStock, 
      newStock,
      shopifyVariantId: mapping.shopifyVariantId,
      productTitle: mapping.productTitle
    });

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Error processing stock update webhook');
    await reply.code(500).send({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};

// Set route options including CORS
route.options = {
  cors: {
    origin: true,
    methods: ['POST']
  },
  schema: {
    body: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        table: { type: 'string' },
        record: {
          type: 'object',
          properties: {
            sku: { type: 'string' },
            stock_actuel: { type: 'number' },
            company_id: { type: 'string' }
          },
          required: ['sku', 'stock_actuel']
        },
        old_record: {
          type: 'object',
          properties: {
            sku: { type: 'string' },
            stock_actuel: { type: 'number' },
            company_id: { type: 'string' }
          }
        }
      },
      required: ['record']
    }
  }
};

export default route;