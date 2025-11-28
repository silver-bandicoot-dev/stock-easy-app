import { ActionOptions } from "gadget-server";

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections, config }) => {
  const { shopId } = params;
  
  logger.info({ shopId }, 'Starting initial inventory sync from Shopify to Supabase');
  
  // Get all product mappings for this shop
  const mappings = await api.productMapping.findMany({
    filter: {
      shopId: { equals: shopId }
    },
    select: {
      id: true,
      shopifyVariantId: true,
      stockEasySku: true,
      shopId: true
    }
  });
  
  logger.info({ count: mappings.length }, 'Found product mappings');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const mapping of mappings) {
    try {
      // Get Shopify connection
      const shopify = await connections.shopify.forShopId(shopId);
      
      // Handle both GID formats
      const variantGid = mapping.shopifyVariantId.startsWith('gid://') 
        ? mapping.shopifyVariantId 
        : `gid://shopify/ProductVariant/${mapping.shopifyVariantId}`;
      
      // Get inventory item for this variant
      const variantResponse = await shopify.graphql(`
        query getVariant($id: ID!) {
          productVariant(id: $id) {
            inventoryItem {
              id
            }
            inventoryQuantity
          }
        }
      `, {
        id: variantGid
      });
      
      const inventoryQuantity = variantResponse.productVariant?.inventoryQuantity || 0;
      
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
          stock_actuel: inventoryQuantity,
          sync_source: 'shopify'
        })
      });
      
      if (response.ok) {
        successCount++;
        logger.info({ sku: mapping.stockEasySku, quantity: inventoryQuantity }, 'Synced inventory');
      } else {
        errorCount++;
        logger.error({ sku: mapping.stockEasySku, status: response.status }, 'Failed to sync inventory');
      }
      
    } catch (error) {
      errorCount++;
      logger.error({ error, mappingId: mapping.id }, 'Error syncing inventory for mapping');
    }
  }
  
  logger.info({ successCount, errorCount, total: mappings.length }, 'Completed initial inventory sync');
  
  return {
    success: true,
    syncedCount: successCount,
    errorCount: errorCount,
    totalMappings: mappings.length
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
