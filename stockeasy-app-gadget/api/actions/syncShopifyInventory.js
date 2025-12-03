/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections, config }) => {
  const { shopId } = params;
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
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
        inventoriesSynced: 0,
        errors: 1
      };
    }
    
    // Construct the location GID
    const locationGid = shop.defaultLocationId.startsWith('gid://') 
      ? shop.defaultLocationId 
      : `gid://shopify/Location/${shop.defaultLocationId}`;
    
    logger.info({ shopId, shopName: shop.name, defaultLocationId: shop.defaultLocationId, locationGid }, "Starting inventory sync for shop (single location mode)");

    // Get all productMappings for this shop
    const mappings = await api.productMapping.findMany({
      filter: { shop: { equals: shopId } },
      select: {
        id: true,
        stockEasySku: true,
        shopifyInventoryItemId: true,
        shopifyVariantId: true
      }
    });

    logger.info({ mappingCount: mappings.length }, "Found product mappings to sync");

    if (mappings.length === 0) {
      return {
        success: true,
        inventoriesSynced: 0,
        errors: 0,
        message: "No product mappings found for this shop"
      };
    }

    // Get Shopify API client
    const shopify = await connections.shopify.forShopId(shopId);

    // Process each mapping
    for (const mapping of mappings) {
      try {
        if (!mapping.shopifyInventoryItemId) {
          logger.warn({ mappingId: mapping.id }, "Mapping has no shopifyInventoryItemId, skipping");
          continue;
        }

        // Construct Shopify GID for inventory item
        const rawInventoryItemId = String(mapping.shopifyInventoryItemId);
        const inventoryItemGid = rawInventoryItemId.startsWith('gid://') 
          ? rawInventoryItemId 
          : `gid://shopify/InventoryItem/${rawInventoryItemId}`;

        // Fetch inventory level for the SPECIFIC location only (Plan Basic = 1 location)
        const query = `
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
        `;

        const response = await shopify.graphql(query, {
          inventoryItemId: inventoryItemGid,
          locationId: locationGid
        });

        if (!response?.inventoryItem) {
          logger.warn({ 
            mappingId: mapping.id, 
            inventoryItemId: mapping.shopifyInventoryItemId,
            locationGid
          }, "Inventory item not found in Shopify");
          
          await api.syncLog.create({
            shop: { _link: shopId },
            entity: "inventory",
            operation: "sync",
            status: "error",
            direction: "shopify_to_stockeasy",
            shopifyId: mapping.shopifyInventoryItemId,
            stockEasySku: mapping.stockEasySku,
            message: "Inventory item not found in Shopify"
          });
          
          errorCount++;
          errors.push({
            sku: mapping.stockEasySku,
            error: "Inventory item not found"
          });
          continue;
        }

        // Get the quantity at the specific location only
        const inventoryLevel = response.inventoryItem.inventoryLevel;
        
        if (!inventoryLevel) {
          logger.warn({ 
            mappingId: mapping.id, 
            inventoryItemId: mapping.shopifyInventoryItemId,
            locationGid
          }, "Inventory item is not stocked at the selected location");
          
          await api.syncLog.create({
            shop: { _link: shopId },
            entity: "inventory",
            operation: "sync",
            status: "warning",
            direction: "shopify_to_stockeasy",
            shopifyId: mapping.shopifyInventoryItemId,
            stockEasySku: mapping.stockEasySku,
            message: `Inventory item not stocked at location ${locationGid}`
          });
          
          // Continue with quantity 0 for items not stocked at this location
          // This is intentional - if the item isn't at this location, stock should be 0
        }
        
        // Extract "available" quantity from the quantities array
        const availableQuantity = inventoryLevel?.quantities?.find(q => q.name === "available")?.quantity || 0;

        logger.info({ 
          sku: mapping.stockEasySku, 
          availableQuantity,
          locationId: shop.defaultLocationId,
          locationName: inventoryLevel?.location?.name || "N/A"
        }, "📦 Retrieved inventory for single location (Plan Basic)");

        // Update Supabase with inventory from the SINGLE selected location
        const supabaseResponse = await fetch(
          `${config.SUPABASE_URL}/rest/v1/produits?sku=eq.${encodeURIComponent(mapping.stockEasySku)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.STOCKEASY_INTERNAL_API_KEY}`,
              'apikey': config.STOCKEASY_INTERNAL_API_KEY,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ 
              stock_actuel: availableQuantity,
              sync_source: 'shopify'  // CRITICAL: Prevent trigger from firing
            })
          }
        );

        if (!supabaseResponse.ok) {
          const errorText = await supabaseResponse.text();
          logger.error({ 
            sku: mapping.stockEasySku, 
            status: supabaseResponse.status,
            error: errorText
          }, "Failed to update Stockeasy");
          
          await api.syncLog.create({
            shop: { _link: shopId },
            entity: "inventory",
            operation: "sync",
            status: "error",
            direction: "shopify_to_stockeasy",
            shopifyId: mapping.shopifyInventoryItemId,
            stockEasySku: mapping.stockEasySku,
            message: `Failed to update Stockeasy: ${errorText}`,
            payload: { availableQuantity, locationId: shop.defaultLocationId }
          });
          
          errorCount++;
          errors.push({
            sku: mapping.stockEasySku,
            error: `Supabase update failed: ${errorText}`
          });
          continue;
        }

        // Log success
        await api.syncLog.create({
          shop: { _link: shopId },
          entity: "inventory",
          operation: "sync",
          status: "success",
          direction: "shopify_to_stockeasy",
          shopifyId: mapping.shopifyInventoryItemId,
          stockEasySku: mapping.stockEasySku,
          message: `✅ Synced inventory from location ${shop.defaultLocationId}: ${availableQuantity}`,
          payload: { availableQuantity, locationId: shop.defaultLocationId }
        });

        successCount++;

      } catch (error) {
        logger.error({ 
          error: error.message, 
          mappingId: mapping.id,
          sku: mapping.stockEasySku 
        }, "Error processing mapping");
        
        await api.syncLog.create({
          shop: { _link: shopId },
          entity: "inventory",
          operation: "sync",
          status: "error",
          direction: "shopify_to_stockeasy",
          shopifyId: mapping.shopifyInventoryItemId || "",
          stockEasySku: mapping.stockEasySku,
          message: `Error: ${error.message}`,
          payload: { error: error.stack }
        });
        
        errorCount++;
        errors.push({
          sku: mapping.stockEasySku,
          error: error.message
        });
      }
    }

    logger.info({ 
      successCount, 
      errorCount, 
      total: mappings.length 
    }, "Inventory sync completed");

    return {
      success: true,
      inventoriesSynced: successCount,
      errors: errorCount,
      total: mappings.length,
      errorDetails: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    logger.error({ error: error.message, shopId }, "Fatal error during inventory sync");
    
    await api.syncLog.create({
      shop: { _link: shopId },
      entity: "inventory",
      operation: "sync",
      status: "error",
      direction: "shopify_to_stockeasy",
      message: `Fatal error: ${error.message}`,
      payload: { error: error.stack }
    });

    throw error;
  }
};

/** @type { import("gadget-server").ActionOptions } */
export const options = {
  timeoutMS: 300000,
  returnType: true
};

export const params = {
  shopId: { type: "string" }
};
