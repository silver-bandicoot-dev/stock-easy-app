/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections, config }) => {
  const { shopId } = params;
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
    // Load the shop
    const shop = await api.shopifyShop.findOne(shopId);
    logger.info({ shopId, shopName: shop.name }, "Starting inventory sync for shop");

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

        // Construct Shopify GID
        const inventoryItemGid = `gid://shopify/InventoryItem/${mapping.shopifyInventoryItemId}`;

        // Fetch inventory levels from Shopify
        const query = `
          query GetInventoryLevels($id: ID!) {
            inventoryItem(id: $id) {
              id
              inventoryLevels(first: 50) {
                edges {
                  node {
                    available
                    location {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await shopify.graphql(query, {
          id: inventoryItemGid
        });

        if (!response?.inventoryItem) {
          logger.warn({ 
            mappingId: mapping.id, 
            inventoryItemId: mapping.shopifyInventoryItemId 
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

        // Sum all locations' inventory
        const inventoryLevels = response.inventoryItem.inventoryLevels.edges.map(edge => edge.node);
        const totalAvailable = inventoryLevels.reduce((sum, level) => sum + (level.available || 0), 0);

        logger.info({ 
          sku: mapping.stockEasySku, 
          totalAvailable, 
          locationCount: inventoryLevels.length 
        }, "Calculated total inventory");

        // Update Supabase
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
              stock_actuel: totalAvailable,
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
            payload: { totalAvailable, locationCount: inventoryLevels.length }
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
          message: `Successfully synced inventory: ${totalAvailable}`,
          payload: { totalAvailable, locationCount: inventoryLevels.length }
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
