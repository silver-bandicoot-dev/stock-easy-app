import { ActionOptions } from "gadget-server";

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections, config }) => {
  const { shopId } = params;
  
  logger.info({ shopId }, 'Starting initial inventory sync from Shopify to Supabase');
  
  // Load the shop with defaultLocationId
  const shop = await api.shopifyShop.findOne(shopId, {
    select: {
      id: true,
      name: true,
      defaultLocationId: true
    }
  });
  
  // Validate that a default location is configured
  if (!shop.defaultLocationId) {
    logger.error({ shopId }, "No defaultLocationId configured for this shop. Please set the default location in Gadget.");
    return {
      success: false,
      error: "No default location configured for this shop",
      syncedCount: 0,
      errorCount: 1,
      totalMappings: 0
    };
  }
  
  // Construct the location GID
  const locationGid = shop.defaultLocationId.startsWith('gid://') 
    ? shop.defaultLocationId 
    : `gid://shopify/Location/${shop.defaultLocationId}`;
  
  logger.info({ shopId, shopName: shop.name, defaultLocationId: shop.defaultLocationId, locationGid }, 'Using single location for initial sync (Plan Basic)');
  
  // Get all product mappings for this shop
  const mappings = await api.productMapping.findMany({
    filter: {
      shopId: { equals: shopId }
    },
    select: {
      id: true,
      shopifyVariantId: true,
      shopifyInventoryItemId: true,
      stockEasySku: true,
      shopId: true
    }
  });
  
  logger.info({ count: mappings.length }, 'Found product mappings');
  
  let successCount = 0;
  let errorCount = 0;
  
  // Get Shopify connection once for all mappings
  const shopify = await connections.shopify.forShopId(shopId);
  
  for (const mapping of mappings) {
    try {
      // Construct the inventory item GID
      const rawInventoryItemId = String(mapping.shopifyInventoryItemId || '');
      
      if (!rawInventoryItemId) {
        logger.warn({ mappingId: mapping.id, sku: mapping.stockEasySku }, 'No shopifyInventoryItemId, skipping');
        errorCount++;
        continue;
      }
      
      const inventoryItemGid = rawInventoryItemId.startsWith('gid://') 
        ? rawInventoryItemId 
        : `gid://shopify/InventoryItem/${rawInventoryItemId}`;
      
      // Get inventory level for the SPECIFIC location only (Plan Basic = 1 location)
      const inventoryResponse = await shopify.graphql(`
        query GetInventoryLevelAtLocation($inventoryItemId: ID!, $locationId: ID!) {
          inventoryItem(id: $inventoryItemId) {
            id
            inventoryLevel(locationId: $locationId) {
              id
              quantities(names: ["available"]) {
                name
                quantity
              }
              location {
                id
                name
              }
            }
          }
        }
      `, {
        inventoryItemId: inventoryItemGid,
        locationId: locationGid
      });
      
      // Extract the quantity at the specific location
      const inventoryLevel = inventoryResponse.inventoryItem?.inventoryLevel;
      const availableQuantity = inventoryLevel?.quantities?.find(q => q.name === "available")?.quantity || 0;
      
      if (!inventoryLevel) {
        logger.warn({ 
          sku: mapping.stockEasySku, 
          inventoryItemGid,
          locationGid
        }, 'Inventory item not stocked at this location, setting quantity to 0');
      }
      
      logger.info({ 
        sku: mapping.stockEasySku, 
        availableQuantity,
        locationId: shop.defaultLocationId,
        locationName: inventoryLevel?.location?.name || "N/A"
      }, '📦 Retrieved inventory for single location');
      
      // Update Supabase with sync_source = 'shopify' to prevent trigger
      const supabaseUrl = config.SUPABASE_URL;
      const supabaseKey = config.SUPABASE_SERVICE_ROLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/produits?sku=eq.${mapping.stockEasySku}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          stock_actuel: availableQuantity,
          sync_source: 'shopify'
        })
      });
      
      if (response.ok) {
        successCount++;
        logger.info({ sku: mapping.stockEasySku, quantity: availableQuantity, locationId: shop.defaultLocationId }, '✅ Synced inventory from single location');
      } else {
        errorCount++;
        logger.error({ sku: mapping.stockEasySku, status: response.status }, 'Failed to sync inventory');
      }
      
    } catch (error) {
      errorCount++;
      logger.error({ error: error.message, mappingId: mapping.id, sku: mapping.stockEasySku }, 'Error syncing inventory for mapping');
    }
  }
  
  logger.info({ successCount, errorCount, total: mappings.length, locationId: shop.defaultLocationId }, 'Completed initial inventory sync (single location)');
  
  return {
    success: true,
    syncedCount: successCount,
    errorCount: errorCount,
    totalMappings: mappings.length,
    locationId: shop.defaultLocationId
  };
};

/** @type { ActionOptions } */
export const options = {
  triggers: {
    api: true
  },
  timeoutMS: 300000
};

export const params = {
  shopId: { type: 'string' }
};
