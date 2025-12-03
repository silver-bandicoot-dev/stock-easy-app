import { RouteHandler } from "gadget-server";

// ============================================
// INLINE SYNC UTILITIES (évite les problèmes d'import)
// ============================================
const SyncDirection = {
  SUPABASE_TO_SHOPIFY: "supabase_to_shopify",
  SHOPIFY_TO_SUPABASE: "shopify_to_supabase",
};

const updateSyncMetadata = async (api, mappingId, direction) => {
  await api.productMapping.update(mappingId, {
    lastSyncDirection: direction,
    lastSyncedAt: new Date(),
  });
};
// ============================================

/**
 * Route handler to update Shopify inventory from Stockeasy
 * @type {RouteHandler<{ Body: { company_id: string; updates: Array<{ sku: string; stock_actuel: number }> } }>}
 */
const route = async ({ request, reply, api, logger, config, connections }) => {
  const startTime = Date.now();

  // Set CORS headers manually (route.options.cors doesn't work reliably)
  const allowedOrigins = [
    'https://stockeasy.app',
    'https://www.stockeasy.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
  ];
  const origin = request.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
  }
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  reply.header('Access-Control-Allow-Credentials', 'true');

  try {
    // 1. Authenticate the request
    const authHeader = request.headers.authorization;
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey || apiKey !== config.STOCKEASY_INTERNAL_API_KEY) {
      logger.warn({ authHeader }, 'Unauthorized access attempt to update-shopify-inventory');
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    // 2. Extract and validate request body
    const { company_id, updates } = request.body;

    if (!company_id) {
      return reply.code(400).send({ error: 'company_id is required' });
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return reply.code(400).send({ error: 'updates must be a non-empty array' });
    }

    // Validate each update
    for (const update of updates) {
      if (!update.sku || typeof update.sku !== 'string') {
        return reply.code(400).send({ error: 'Each update must have a sku (string)' });
      }
      if (typeof update.stock_actuel !== 'number' || update.stock_actuel < 0) {
        return reply.code(400).send({ error: 'Each update must have a stock_actuel (number >= 0)' });
      }
    }

    logger.info({ company_id, updateCount: updates.length }, 'Processing inventory updates from Stockeasy');

    // 3. Find the shop by company_id
    logger.info({ company_id }, '🔍 Searching for shop with company_id');
    
    let shop;
    try {
      shop = await api.shopifyShop.findFirst({
        filter: { stockEasyCompanyId: { equals: company_id } },
        select: { id: true, domain: true, defaultLocationId: true }
      });
      logger.info({ shop }, '📦 Shop query result');
    } catch (shopError) {
      logger.error({ shopError: shopError.message, company_id }, '❌ Error finding shop');
      return reply.code(500).send({ error: 'Error finding shop', details: shopError.message });
    }

    if (!shop) {
      logger.warn({ company_id }, 'Shop not found for company_id');
      return reply.code(404).send({ error: 'Shop not found for company_id' });
    }

    // 4. Use the shop's default location for inventory updates
    const locationId = shop.defaultLocationId;
    logger.info({ shopId: shop.id, domain: shop.domain, defaultLocationId: shop.defaultLocationId }, '🏪 Shop found');

    if (!locationId) {
      logger.error({ shopId: shop.id }, 'No default location configured for shop');
      return reply.code(500).send({ error: 'No default location configured. Please configure a default location in shop settings.' });
    }

    logger.info({ locationId, shopId: shop.id }, '📍 Using default location for inventory updates');

    // 5. Process each update
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const update of updates) {
      const { sku, stock_actuel } = update;
      const updateStartTime = Date.now();

      try {
        // a. Find productMapping by SKU
        logger.info({ sku, shopId: shop.id }, '🔍 Searching for product mapping');
        
        const mapping = await api.productMapping.findFirst({
          filter: {
            shopId: { equals: shop.id },
            stockEasySku: { equals: sku }
          },
          select: {
            id: true,
            shopifyInventoryItemId: true,
            shopifyVariantId: true
          }
        });
        
        logger.info({ sku, mapping }, '📦 Product mapping result');

        // b. If mapping not found, skip and log
        if (!mapping || !mapping.shopifyInventoryItemId) {
          logger.warn({ sku, shopId: shop.id }, 'Product mapping not found for SKU');
          skippedCount++;

          await api.syncLog.create({
            direction: 'stockeasy_to_shopify',
            entity: 'inventory',
            operation: 'update',
            status: 'skipped',
            shop: { _link: shop.id },
            stockEasySku: sku,
            message: `No mapping found for SKU: ${sku}`,
            processingTimeMs: Date.now() - updateStartTime
          });

          continue;
        }

        // b2. ANTI-LOOP: Mark sync direction BEFORE updating Shopify
        // This prevents the Shopify webhook from triggering a reverse sync
        await updateSyncMetadata(api, mapping.id, SyncDirection.SUPABASE_TO_SHOPIFY);
        logger.info({ 
          mappingId: mapping.id, 
          direction: SyncDirection.SUPABASE_TO_SHOPIFY 
        }, '📝 Marked sync direction to prevent loop');

        // c. Update inventory in Shopify using direct Shopify connection
        logger.info({ shopId: shop.id }, '🔗 Getting Shopify connection');
        
        let shopify;
        try {
          shopify = await connections.shopify.forShopId(shop.id);
          logger.info({ hasConnection: !!shopify }, '✅ Shopify connection obtained');
        } catch (connError) {
          logger.error({ connError: connError.message, shopId: shop.id }, '❌ Error getting Shopify connection');
          throw connError;
        }
        
        // Normaliser les IDs - éviter les doubles préfixes GID
        const rawInventoryItemId = String(mapping.shopifyInventoryItemId);
        const inventoryItemGid = rawInventoryItemId.startsWith('gid://') 
          ? rawInventoryItemId 
          : `gid://shopify/InventoryItem/${rawInventoryItemId}`;
        
        const rawLocationId = String(locationId);
        const locationGid = rawLocationId.startsWith('gid://') 
          ? rawLocationId 
          : `gid://shopify/Location/${rawLocationId}`;
        
        const quantityToSet = Math.floor(stock_actuel);
        
        logger.info({ 
          inventoryItemGid, 
          locationGid, 
          quantity: quantityToSet,
          rawInventoryItemId,
          rawLocationId
        }, '📤 Sending GraphQL mutation to Shopify');
        
        // Utiliser la nouvelle mutation inventorySetQuantities (recommandée par Shopify)
        // inventorySetOnHandQuantities est DÉPRÉCIÉ
        const result = await shopify.graphql(`
          mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
            inventorySetQuantities(input: $input) {
              userErrors {
                field
                message
                code
              }
              inventoryAdjustmentGroup {
                createdAt
                reason
                changes {
                  name
                  delta
                  quantityAfterChange
                }
              }
            }
          }
        `, {
          input: {
            ignoreCompareQuantity: true,  // Stockeasy est la source de vérité
            name: "available",            // Définir la quantité "available"
            reason: "correction",
            quantities: [
              {
                inventoryItemId: inventoryItemGid,
                locationId: locationGid,
                quantity: quantityToSet
              }
            ]
          }
        });

        logger.info({ 
          result: JSON.stringify(result, null, 2),
          hasInventorySetQuantities: !!result?.inventorySetQuantities,
          hasAdjustmentGroup: !!result?.inventorySetQuantities?.inventoryAdjustmentGroup
        }, '📥 GraphQL mutation result (detailed)');
        
        // d. Check for errors in the mutation result
        // Note: Using inventorySetQuantities (new API) instead of inventorySetOnHandQuantities (deprecated)
        const mutationResult = result?.inventorySetQuantities;
        const userErrors = mutationResult?.userErrors;
        const adjustmentGroup = mutationResult?.inventoryAdjustmentGroup;

        // Vérifier si la mutation a retourné un résultat valide
        if (!mutationResult) {
          logger.error({ sku, result }, '❌ Mutation did not return inventorySetOnHandQuantities');
          errorCount++;

          await api.syncLog.create({
            direction: 'stockeasy_to_shopify',
            entity: 'inventory',
            operation: 'update',
            status: 'error',
            shop: { _link: shop.id },
            stockEasySku: sku,
            shopifyId: mapping.shopifyInventoryItemId,
            message: 'Mutation returned invalid result - no inventorySetOnHandQuantities',
            payload: { sku, stock_actuel, result },
            processingTimeMs: Date.now() - updateStartTime
          });
          continue;
        }

        if (userErrors && userErrors.length > 0) {
          logger.error({ sku, userErrors }, '❌ Shopify mutation returned userErrors');
          errorCount++;

          await api.syncLog.create({
            direction: 'stockeasy_to_shopify',
            entity: 'inventory',
            operation: 'update',
            status: 'error',
            shop: { _link: shop.id },
            stockEasySku: sku,
            shopifyId: mapping.shopifyInventoryItemId,
            message: `Shopify errors: ${userErrors.map(e => `${e.message} (${e.code || 'no code'})`).join(', ')}`,
            payload: { sku, stock_actuel, userErrors, inventoryItemGid, locationGid },
            processingTimeMs: Date.now() - updateStartTime
          });
        } else if (!adjustmentGroup) {
          // Pas d'erreurs mais pas de groupe d'ajustement = rien n'a changé
          // Cela peut arriver si le stock était déjà à cette valeur
          logger.warn({ 
            sku, 
            stock_actuel,
            inventoryItemGid,
            locationGid
          }, '⚠️ No adjustment group returned - stock might already be at this value or item is not tracked');
          
          // On considère cela comme un succès (stock déjà à jour)
          successCount++;

          await api.syncLog.create({
            direction: 'stockeasy_to_shopify',
            entity: 'inventory',
            operation: 'update',
            status: 'success',
            shop: { _link: shop.id },
            stockEasySku: sku,
            shopifyId: mapping.shopifyInventoryItemId,
            message: `Stock set to ${stock_actuel} (no change needed or item untracked)`,
            payload: { sku, stock_actuel, note: 'No adjustment group returned' },
            processingTimeMs: Date.now() - updateStartTime
          });
        } else {
          // Succès avec des changements
          const changes = adjustmentGroup.changes || [];
          const delta = changes.length > 0 ? changes[0].delta : 'unknown';
          const quantityAfter = changes.length > 0 ? changes[0].quantityAfterChange : stock_actuel;
          
          logger.info({ 
            sku, 
            stock_actuel, 
            delta,
            quantityAfter,
            reason: adjustmentGroup.reason
          }, '✅ Successfully updated inventory in Shopify');
          successCount++;

          await api.syncLog.create({
            direction: 'stockeasy_to_shopify',
            entity: 'inventory',
            operation: 'update',
            status: 'success',
            shop: { _link: shop.id },
            stockEasySku: sku,
            shopifyId: mapping.shopifyInventoryItemId,
            message: `Updated inventory to ${quantityAfter} (delta: ${delta})`,
            payload: { sku, stock_actuel, delta, quantityAfter, adjustmentGroup },
            processingTimeMs: Date.now() - updateStartTime
          });
        }
      } catch (error) {
        logger.error({ sku, error }, 'Error processing inventory update');
        errorCount++;

        await api.syncLog.create({
          direction: 'stockeasy_to_shopify',
          entity: 'inventory',
          operation: 'update',
          status: 'error',
          shop: { _link: shop.id },
          stockEasySku: sku,
          message: `Error: ${error.message}`,
          payload: { sku, stock_actuel, error: error.message },
          processingTimeMs: Date.now() - updateStartTime
        });
      }
    }

    // 6. Return summary
    const totalTime = Date.now() - startTime;
    logger.info(
      { successCount, errorCount, skippedCount, totalTime },
      'Completed inventory update batch from Stockeasy'
    );

    return reply.code(200).send({
      success: true,
      processed: successCount,
      errors: errorCount,
      skipped: skippedCount
    });
  } catch (error) {
    logger.error({ error }, 'Unexpected error in update-shopify-inventory route');
    return reply.code(500).send({ error: 'Internal server error' });
  }
};

route.options = {
  schema: {
    body: {
      type: 'object',
      properties: {
        company_id: { type: 'string' },
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string' },
              stock_actuel: { type: 'number', minimum: 0 }
            },
            required: ['sku', 'stock_actuel']
          }
        }
      },
      required: ['company_id', 'updates']
    }
  }
  // CORS géré par OPTIONS-update-shopify-inventory.js et headers manuels
};

export default route;