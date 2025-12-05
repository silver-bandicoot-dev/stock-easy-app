import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";
import { getSupabaseClient } from "../../../lib/supabase.js";
import { 
  SyncDirection, 
  shouldSkipSync, 
  updateSyncMetadata, 
  logSyncDecision,
  stockValuesAreEqual 
} from "../../../lib/syncUtils.js";

/**
 * Shopify Inventory Level Update Action
 * Direction: Shopify → Supabase (Stockeasy)
 * 
 * Triggered by: Shopify webhook inventory_levels/update
 * 
 * Anti-loop mechanism:
 * 1. Check if this webhook is a response to a recent Supabase → Shopify sync
 * 2. If yes (within 30s window), skip to prevent infinite loop
 * 3. If no (manual change in Shopify), sync to Supabase
 * 
 * @type { ActionRun }
 */
export const run = async ({ params, record, logger, api }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/**
 * After the record is saved, sync to Supabase if this is a genuine change
 * (not a response to our own Supabase → Shopify sync)
 * 
 * @type { ActionOnSuccess }
 */
export const onSuccess = async ({ record, api, logger, connections }) => {
  const inventoryItemId = record.inventoryItemId;
  const shopId = record.shopId;
  const locationId = record.locationId; // The location this update is for
  const available = record.available; // Current stock in Shopify
  
  logger.info({ 
    inventoryItemId, 
    shopId,
    locationId,
    available 
  }, '📥 Received Shopify inventory_levels/update webhook');

  try {
    // ═══════════════════════════════════════════════════════════════════
    // 0. CHECK IF THIS IS THE USER'S SELECTED LOCATION
    // Only sync inventory changes from the defaultLocationId
    // ═══════════════════════════════════════════════════════════════════
    const shop = await api.shopifyShop.findOne(shopId, {
      select: {
        id: true,
        defaultLocationId: true,
        stockEasyCompanyId: true
      }
    });

    if (!shop.defaultLocationId) {
      logger.info({ shopId }, 'No default location configured - skipping sync');
      return;
    }

    // Compare location IDs (handle both string and number formats)
    const webhookLocationId = String(locationId);
    const defaultLocationId = String(shop.defaultLocationId);

    if (webhookLocationId !== defaultLocationId) {
      logger.info({ 
        webhookLocationId, 
        defaultLocationId, 
        shopId 
      }, '🏭 Ignoring inventory update from non-default location');
      return;
    }

    logger.info({ 
      locationId: webhookLocationId, 
      defaultLocationId 
    }, '✅ Inventory update is from the default location - proceeding with sync');

    // ═══════════════════════════════════════════════════════════════════
    // 1. Find the product mapping for this inventory item
    // ═══════════════════════════════════════════════════════════════════
    let mapping;
    try {
      mapping = await api.productMapping.findFirst({
        filter: {
          shopifyInventoryItemId: { equals: String(inventoryItemId) },
          shopId: { equals: shopId }
        },
        select: {
          id: true,
          stockEasySku: true,
          shopifyVariantId: true,
          productTitle: true,
          lastSyncDirection: true,
          lastSyncedAt: true,
          lastSyncedStockValue: true
        }
      });
    } catch (error) {
      // No mapping found - this is expected for unmapped products
      if (error.message && error.message.includes('no productMapping found')) {
        logger.info({ inventoryItemId }, 'No mapping found - product not synced to Stockeasy');
        return;
      }
      throw error;
    }

    if (!mapping) {
      logger.info({ inventoryItemId }, 'No mapping found - product not synced to Stockeasy');
      return;
    }

    const sku = mapping.stockEasySku;
    const companyId = shop.stockEasyCompanyId;

    if (!companyId) {
      logger.warn({ 
        shopId, 
        sku 
      }, 'Shop has no stockEasyCompanyId configured - cannot sync to Supabase');
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. 🔄 ANTI-LOOP CHECK: Is this webhook a response to Supabase → Shopify?
    // AMÉLIORATION v2: On passe la valeur de stock pour détecter les vraies actions
    // ═══════════════════════════════════════════════════════════════════
    const syncCheck = shouldSkipSync(mapping, SyncDirection.SHOPIFY_TO_SUPABASE, available);
    
    logSyncDecision(logger, {
      action: 'shopify_inventory_level_update',
      sku,
      shopId,
      inventoryItemId,
      direction: SyncDirection.SHOPIFY_TO_SUPABASE,
      decision: syncCheck.shouldSkip ? 'skip' : 'proceed',
      reason: syncCheck.reason,
      timeSinceLastSync: syncCheck.timeSinceLastSync,
      lastSyncDirection: mapping.lastSyncDirection,
      lastSyncedStockValue: mapping.lastSyncedStockValue,
      newStock: available
    });

    if (syncCheck.shouldSkip) {
      logger.info({ 
        sku, 
        reason: syncCheck.reason,
        timeSinceLastSync: syncCheck.timeSinceLastSync,
        lastSyncedStockValue: mapping.lastSyncedStockValue,
        incomingStock: available
      }, '🔄 SKIPPING Shopify→Supabase sync to prevent loop');
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Check current stock in Supabase to avoid unnecessary updates
    // ═══════════════════════════════════════════════════════════════════
    const supabase = getSupabaseClient();
    
    const { data: currentProduct, error: fetchError } = await supabase
      .from('produits')
      .select('stock_actuel')
      .eq('sku', sku)
      .eq('company_id', companyId)
      .single();

    if (fetchError) {
      logger.warn({ 
        sku, 
        companyId, 
        error: fetchError.message 
      }, 'Could not fetch current stock from Supabase');
      // Continue anyway - we'll try to update
    }

    const currentStock = currentProduct?.stock_actuel;
    
    if (stockValuesAreEqual(currentStock, available)) {
      logger.info({ 
        sku, 
        stock: available 
      }, 'Stock already in sync - skipping update');
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. 📝 MARK SYNC DIRECTION + STOCK VALUE BEFORE updating Supabase
    // This prevents the resulting Supabase webhook from triggering a reverse sync
    // ═══════════════════════════════════════════════════════════════════
    await updateSyncMetadata(api, mapping.id, SyncDirection.SHOPIFY_TO_SUPABASE, available);
    logger.info({ 
      mappingId: mapping.id, 
      direction: SyncDirection.SHOPIFY_TO_SUPABASE,
      stockValue: available
    }, '📝 Marked sync direction with stock value');

    // ═══════════════════════════════════════════════════════════════════
    // 5. Update stock in Supabase
    // ═══════════════════════════════════════════════════════════════════
    const { error: updateError } = await supabase
      .from('produits')
      .update({ 
        stock_actuel: available,
        last_modified_by: 'shopify',
        last_modified_at: new Date().toISOString()
      })
      .eq('sku', sku)
      .eq('company_id', companyId);

    if (updateError) {
      logger.error({ 
        sku, 
        companyId, 
        error: updateError.message 
      }, '❌ Failed to update stock in Supabase');
      return;
    }

    logger.info({ 
      sku, 
      oldStock: currentStock, 
      newStock: available,
      companyId,
      productTitle: mapping.productTitle
    }, '✅ Successfully synced Shopify inventory to Supabase');

  } catch (error) {
    logger.error({ 
      error: error.message, 
      stack: error.stack,
      inventoryItemId,
      shopId 
    }, '❌ Error in shopifyInventoryLevel update onSuccess');
  }
};

/** @type { ActionOptions } */
export const options = {
  actionType: "update",
  triggers: {
    api: true,
    shopify: true  // Trigger for Shopify inventory_levels/update webhook
  }
};
