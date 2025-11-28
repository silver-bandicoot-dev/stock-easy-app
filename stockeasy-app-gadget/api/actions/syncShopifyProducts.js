/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  const shopId = params.shopId;
  
  // Helper function to extract numeric ID from Shopify GID
  function extractNumericId(gid) {
    if (!gid) return null;
    return gid.split('/').pop();
  }
  
  // Initialize counters
  let productsProcessed = 0;
  let variantsSynced = 0;
  let errors = 0;
  
  try {
    // Load the shop
    const shop = await api.shopifyShop.findOne(shopId);
    logger.info({ shopId, domain: shop.domain }, "Starting product sync for shop");
    
    // Check if shop has stockEasyCompanyId
    if (!shop.stockEasyCompanyId) {
      logger.warn({ shopId }, "Shop has no stockEasyCompanyId, will skip Supabase sync");
    }
    
    // Get Shopify API client
    const shopify = await connections.shopify.forShopId(shopId);
    
    // Supabase configuration
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Pagination variables
    let hasNextPage = true;
    let cursor = null;
    
    // Fetch products with pagination
    while (hasNextPage) {
      const query = `
        query ($cursor: String) {
          products(first: 250, after: $cursor) {
            edges {
              node {
                id
                title
                featuredImage {
                  url
                }
                variants(first: 100) {
                  edges {
                    node {
                      id
                      sku
                      title
                      price
                      image {
                        url
                      }
                      inventoryItem {
                        id
                        unitCost {
                          amount
                        }
                      }
                      inventoryQuantity
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      
      let productsData;
      try {
        const response = await shopify.graphql(query, { cursor });
        productsData = response;
      } catch (error) {
        logger.error({ error: error.message }, "Failed to fetch products from Shopify");
        errors++;
        break;
      }
      
      const products = productsData.products.edges;
      
      // Process each product
      for (const productEdge of products) {
        const product = productEdge.node;
        productsProcessed++;
        
        const productGid = product.id;
        const productNumericId = extractNumericId(productGid);
        const productTitle = product.title;
        
        // Process each variant
        for (const variantEdge of product.variants.edges) {
          const variant = variantEdge.node;
          
          // Skip if no SKU
          if (!variant.sku) {
            continue;
          }
          
          const variantGid = variant.id;
          const variantNumericId = extractNumericId(variantGid);
          const inventoryItemGid = variant.inventoryItem?.id;
          const inventoryItemNumericId = extractNumericId(inventoryItemGid);
          const variantTitle = variant.title || "";
          const price = parseFloat(variant.price) || 0;
          const stock = variant.inventoryQuantity || 0;
          
          // Get image URL - prefer variant image, fallback to product image
          const imageUrl = variant.image?.url || product.featuredImage?.url || null;
          
          // Get unit cost (prix_achat)
          const unitCost = variant.inventoryItem?.unitCost?.amount 
            ? parseFloat(variant.inventoryItem.unitCost.amount) 
            : null;
          
          // Log missing fields
          if (!unitCost) {
            logger.debug({ sku: variant.sku }, "No unit cost configured in Shopify");
          }
          if (!imageUrl) {
            logger.debug({ sku: variant.sku }, "No image found for product");
          }
          
          try {
            // Upsert productMapping
            const existingMapping = await api.productMapping.maybeFindFirst({
              filter: {
                shopifyVariantId: { equals: variantNumericId },
                shopId: { equals: shopId }
              }
            });
            
            if (existingMapping) {
              await api.productMapping.update(existingMapping.id, {
                shopifyProductId: productNumericId,
                shopifyInventoryItemId: inventoryItemNumericId,
                shopifySku: variant.sku,
                stockEasySku: variant.sku,
                productTitle: productTitle,
                variantTitle: variantTitle,
                syncSource: "shopify",
                lastSyncedAt: new Date()
              });
            } else {
              await api.productMapping.create({
                shop: { _link: shopId },
                shopifyProductId: productNumericId,
                shopifyVariantId: variantNumericId,
                shopifyInventoryItemId: inventoryItemNumericId,
                shopifySku: variant.sku,
                stockEasySku: variant.sku,
                productTitle: productTitle,
                variantTitle: variantTitle,
                syncSource: "shopify",
                lastSyncedAt: new Date()
              });
            }
            
            // Upsert to Supabase
            const productName = variantTitle ? `${productTitle} - ${variantTitle}` : productTitle;
            
            // Only sync to Supabase if company_id exists and environment is configured
            if (shop.stockEasyCompanyId && supabaseUrl && supabaseKey) {
              const supabaseData = {
                sku: variant.sku,
                nom_produit: productName,
                prix_vente: price,
                prix_achat: unitCost,
                stock_actuel: stock,
                image_url: imageUrl,
                company_id: shop.stockEasyCompanyId
              };
              
                const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/produits`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(supabaseData)
              });
              
              if (!supabaseResponse.ok) {
                const errorText = await supabaseResponse.text();
                logger.error({ sku: variant.sku, error: errorText }, "Failed to sync product to Supabase");
                errors++;
              } else {
                // Also sync to product_mapping table
                const mappingData = {
                  company_id: shop.stockEasyCompanyId,
                  shopify_variant_id: variantGid,
                  shopify_product_id: productGid,
                  shopify_sku: variant.sku,
                  stockeasy_sku: variant.sku,
                  updated_at: new Date().toISOString()
                };
                
                const mappingResponse = await fetch(`${supabaseUrl}/rest/v1/product_mapping`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Prefer': 'resolution=merge-duplicates,return=minimal'
                  },
                  body: JSON.stringify(mappingData)
                });
                
                if (!mappingResponse.ok) {
                  const mappingError = await mappingResponse.text();
                  logger.warn({ sku: variant.sku, error: mappingError }, "Failed to sync mapping to Supabase");
                } else {
                  logger.debug({ sku: variant.sku }, "Synced mapping to Supabase product_mapping");
                }
                
                variantsSynced++;
              }
            } else {
              logger.debug({ sku: variant.sku }, "Skipped Supabase sync (no company_id or missing config)");
            }
            
            // Log success
            await api.syncLog.create({
              shop: { _link: shopId },
              direction: "shopify_to_stockeasy",
              entity: "product",
              operation: "sync",
              status: "success",
              shopifyId: variantNumericId,
              stockEasySku: variant.sku,
              message: `Synced product variant: ${productName}`
            });
            
          } catch (error) {
            logger.error({ sku: variant.sku, error: error.message }, "Failed to process variant");
            errors++;
            
            // Log error
            try {
              await api.syncLog.create({
                shop: { _link: shopId },
                direction: "shopify_to_stockeasy",
                entity: "product",
                operation: "error",
                status: "error",
                shopifyId: variantNumericId,
                stockEasySku: variant.sku,
                message: `Error: ${error.message}`
              });
            } catch (logError) {
              logger.error({ error: logError.message }, "Failed to log error");
            }
          }
        }
      }
      
      // Check pagination
      hasNextPage = productsData.products.pageInfo.hasNextPage;
      cursor = productsData.products.pageInfo.endCursor;
    }
    
    logger.info({ productsProcessed, variantsSynced, errors }, "Product sync completed");
    
    return {
      success: true,
      productsProcessed,
      variantsSynced,
      errors
    };
    
  } catch (error) {
    logger.error({ error: error.message }, "Product sync failed");
    return {
      success: false,
      productsProcessed,
      variantsSynced,
      errors: errors + 1,
      errorMessage: error.message
    };
  }
};

export const params = {
  shopId: { type: "string" }
};

export const options = {
  timeoutMS: 300000 // 5 minutes timeout
};
