import { createClient } from "@supabase/supabase-js";

/** @type { ActionRun } */
export const run = async ({ params, logger, api, config, connections }) => {
  const { productId, shopId } = params;

  logger.info({ productId, shopId }, "Starting product sync to Supabase");

  // Load shop from Gadget
  const shop = await api.shopifyShop.findOne(shopId, {
    select: { domain: true }
  });

  if (!shop) {
    throw new Error(`Shop not found with id: ${shopId}`);
  }

  if (!shop.domain) {
    throw new Error(`Shop ${shopId} is missing domain field`);
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
  const { data: companyData, error: companyError } = await supabase.rpc(
    "get_company_by_shopify_shop_id",
    { p_shopify_shop_id: shop.domain }
  );

  if (companyError) {
    throw new Error(`Failed to get company for shop ${shop.domain}: ${companyError.message}`);
  }

  if (!companyData) {
    throw new Error(`No company found for Shopify shop: ${shop.domain}`);
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

    // Fetch inventory levels for this variant
    let stockActuel = 0;
    if (variant.inventoryItem?.id) {
      try {
        const inventoryResponse = await shopify.graphql(`
          query getInventoryLevels($id: ID!) {
            inventoryItem(id: $id) {
              inventoryLevels(first: 50) {
                edges {
                  node {
                    quantities(names: ["available"]) {
                      name
                      quantity
                    }
                  }
                }
              }
            }
          }
        `, { id: variant.inventoryItem.id });
        
        const levels = inventoryResponse.inventoryItem?.inventoryLevels?.edges || [];
        stockActuel = levels.reduce((sum, level) => {
          const availableQty = level.node.quantities?.find(q => q.name === 'available');
          return sum + (availableQty?.quantity || 0);
        }, 0);
      } catch (err) {
        logger.warn({ variantId: variant.id, error: err.message }, 'Failed to fetch inventory levels');
      }
    }
    
    // UPSERT into produits table
    const nomProduit = shopifyResponse.product.title || variant.title;
    const imageUrl = variant.image?.url || shopifyResponse.product.featuredImage?.url;
    const prixVente = parseFloat(variant.price) || 0;
    const prixAchat = variant.inventoryItem?.unitCost?.amount 
      ? parseFloat(variant.inventoryItem.unitCost.amount) 
      : null;
    
    try {
      const { error: productError } = await supabase
        .from('produits')
        .upsert({
          sku: variantSku,
          company_id: companyId,
          nom_produit: nomProduit,
          image_url: imageUrl,
          stock_actuel: stockActuel,
          prix_vente: prixVente,
          prix_achat: prixAchat
        }, {
          onConflict: 'sku,company_id',
          ignoreDuplicates: false
        });
      
      if (productError) {
        logger.error(
          { variantId: variant.id, sku: variantSku, error: productError.message },
          'Failed to upsert product in produits table'
        );
      } else {
        logger.info(
          { variantId: variant.id, sku: variantSku, stockActuel, prixVente },
          'Successfully synced product to produits table'
        );
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
