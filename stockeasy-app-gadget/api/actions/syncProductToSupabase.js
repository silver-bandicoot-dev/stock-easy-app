import { createClient } from "@supabase/supabase-js";

/** @type { ActionRun } */
export const run = async ({ params, logger, api, config, connections }) => {
  const { productId, shopId } = params;

  logger.info({ productId, shopId }, "Starting product sync to Supabase");

  // Load shop from Gadget with defaultLocationId
  // IMPORTANT: Use myshopifyDomain (not domain) because companies are keyed by myshopifyDomain
  const shop = await api.shopifyShop.findOne(shopId, {
    select: { myshopifyDomain: true, defaultLocationId: true }
  });

  if (!shop) {
    throw new Error(`Shop not found with id: ${shopId}`);
  }

  if (!shop.myshopifyDomain) {
    throw new Error(`Shop ${shopId} is missing myshopifyDomain field`);
  }

  // Load product from Gadget
  const product = await api.shopifyProduct.findOne(productId, {
    select: {
      id: true,
      title: true
    }
  });

  if (!product) {
    logger.warn({ productId }, "Product not found, skipping sync");
    return;
  }

  // Fetch variants from Shopify API
  const shopify = await connections.shopify.forShopId(shopId);

  const shopifyResponse = await shopify.graphql(`
    query getProduct($id: ID!) {
      product(id: $id) {
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
            }
          }
        }
      }
    }
  `, {
    id: `gid://shopify/Product/${productId}`
  });

  // Initialize Supabase client
  const supabase = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get company UUID from Supabase
  // Use myshopifyDomain because that's what connectShopToCompany uses to create the company
  const { data: companyData, error: companyError } = await supabase.rpc(
    "get_company_by_shopify_shop_id",
    { p_shopify_shop_id: shop.myshopifyDomain }
  );

  if (companyError) {
    throw new Error(`Failed to get company for shop ${shop.myshopifyDomain}: ${companyError.message}`);
  }

  if (!companyData) {
    throw new Error(`No company found for Shopify shop: ${shop.myshopifyDomain}`);
  }

  const companyId = companyData;

  // Extract variants from Shopify API response
  const variants = shopifyResponse.product?.variants?.edges || [];

  logger.info({ productId, variantCount: variants.length }, "Processing product variants");

  // Loop through each variant and sync to Supabase
  for (const edge of variants) {
    const variant = edge.node;
    const variantSku = variant.sku || `GEN-${variant.id}`;

    try {
      const { error: upsertError } = await supabase.rpc(
        "upsert_product_mapping",
        {
          p_company_id: companyId,
          p_shopify_variant_id: variant.id,
          p_stockeasy_sku: variantSku,
          p_shopify_product_id: productId,
          p_shopify_sku: variant.sku
        }
      );

      if (upsertError) {
        logger.error(
          { variantId: variant.id, error: upsertError.message },
          "Failed to upsert product mapping"
        );
      } else {
        logger.info(
          { variantId: variant.id, sku: variantSku },
          "Successfully synced variant to Supabase"
        );
      }
    } catch (error) {
      logger.error(
        { variantId: variant.id, error: error.message },
        "Error during variant sync"
      );
    }

    // UPSERT into produits table - METADATA ONLY (no stock_actuel for existing products)
    // ⚠️ IMPORTANT: stock_actuel is NOT included here to prevent infinite sync loops!
    // Stock is managed exclusively by:
    //   - inventory_levels/update webhook → Supabase (via shopifyInventoryLevel/actions/update.js)
    //   - Supabase webhook → Shopify (via POST-stock-update.js)
    // These use the anti-loop mechanism (lastSyncDirection/lastSyncedAt) to prevent loops.
    const nomProduit = shopifyResponse.product.title || variant.title;
    const imageUrl = variant.image?.url || shopifyResponse.product.featuredImage?.url;
    const prixVente = parseFloat(variant.price) || 0;
    const prixAchat = variant.inventoryItem?.unitCost?.amount 
      ? parseFloat(variant.inventoryItem.unitCost.amount) 
      : null;
    
    try {
      // First, check if product already exists
      // Using maybeSingle() to avoid error when no row found (returns null instead of error)
      // Note: produits uses 'sku' as primary key, not 'id'
      const { data: existingProduct, error: selectError } = await supabase
        .from('produits')
        .select('sku, stock_actuel')
        .eq('sku', variantSku)
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (selectError) {
        logger.warn({ sku: variantSku, error: selectError.message }, 'Error checking if product exists, will try INSERT');
      }
      
      if (existingProduct) {
        // Product exists → UPDATE metadata ONLY (preserve stock_actuel)
        const { error: updateError } = await supabase
          .from('produits')
          .update({
            nom_produit: nomProduit,
            image_url: imageUrl,
            prix_vente: prixVente,
            prix_achat: prixAchat
          })
          .eq('sku', variantSku)
          .eq('company_id', companyId);
        
        if (updateError) {
          logger.error(
            { variantId: variant.id, sku: variantSku, error: updateError.message },
            'Failed to update product metadata in produits table'
          );
        } else {
          logger.info(
            { variantId: variant.id, sku: variantSku, prixVente, preservedStock: existingProduct.stock_actuel },
            '✅ Updated product metadata (stock preserved to prevent loop)'
          );
        }
      } else {
        // Product doesn't exist → INSERT with initial stock from Shopify
        // Fetch inventory ONLY for new products (not for updates to prevent loops)
        let stockActuel = 0;
        if (variant.inventoryItem?.id && shop.defaultLocationId) {
          try {
            const locationGid = shop.defaultLocationId.startsWith('gid://') 
              ? shop.defaultLocationId 
              : `gid://shopify/Location/${shop.defaultLocationId}`;
            
            const inventoryResponse = await shopify.graphql(`
              query getInventoryLevelAtLocation($id: ID!, $locationId: ID!) {
                inventoryItem(id: $id) {
                  inventoryLevel(locationId: $locationId) {
                    quantities(names: ["available"]) {
                      name
                      quantity
                    }
                  }
                }
              }
            `, { 
              id: variant.inventoryItem.id,
              locationId: locationGid
            });
            
            stockActuel = inventoryResponse.inventoryItem?.inventoryLevel?.quantities?.find(q => q.name === 'available')?.quantity || 0;
          } catch (err) {
            logger.warn({ variantId: variant.id, error: err.message }, 'Failed to fetch inventory at location for new product');
          }
        }
        
        const { error: insertError } = await supabase
          .from('produits')
          .insert({
            sku: variantSku,
            company_id: companyId,
            nom_produit: nomProduit,
            image_url: imageUrl,
            stock_actuel: stockActuel,
            prix_vente: prixVente,
            prix_achat: prixAchat
          });
        
        if (insertError) {
          logger.error(
            { variantId: variant.id, sku: variantSku, error: insertError.message },
            'Failed to insert product in produits table'
          );
        } else {
          logger.info(
            { variantId: variant.id, sku: variantSku, stockActuel, prixVente },
            '✅ Inserted NEW product with initial stock'
          );
        }
      }
    } catch (error) {
      logger.error(
        { variantId: variant.id, error: error.message },
        'Error syncing product to produits table'
      );
    }
  }

  logger.info({ productId, shopId }, "Completed product sync to Supabase");
};

/** @type { ActionOptions } */
export const options = {
  timeoutMS: 60000,
  triggers: {
    api: true
  }
};

export const params = {
  productId: { type: "string" },
  shopId: { type: "string" }
};
