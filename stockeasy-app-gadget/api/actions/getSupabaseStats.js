/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  const { shopId } = params;
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return { 
      success: false, 
      error: "Supabase not configured",
      syncedSkus: 0,
      totalProducts: 0,
      unsyncedItems: []
    };
  }
  
  try {
    // Get shop to find company_id
    const shop = await api.shopifyShop.findOne(shopId, {
      select: { stockEasyCompanyId: true }
    });
    
    if (!shop?.stockEasyCompanyId) {
      return { 
        success: false, 
        error: "Shop not connected to Stockeasy",
        syncedSkus: 0,
        totalProducts: 0,
        unsyncedItems: []
      };
    }
    
    const companyId = shop.stockEasyCompanyId;
    
    // Get products from Supabase (with SKU list)
    const produitsResponse = await fetch(
      `${supabaseUrl}/rest/v1/produits?company_id=eq.${companyId}&select=sku`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'count=exact'
        }
      }
    );
    
    const totalProducts = parseInt(produitsResponse.headers.get('content-range')?.split('/')[1] || '0');
    const produitsData = await produitsResponse.json();
    
    // Create set of synced SKUs
    const syncedSkuSet = new Set((produitsData || []).map(p => p.sku));
    
    // Get ALL products with variants from Shopify via GraphQL
    const shopify = await connections.shopify.forShopId(shopId);
    
    const query = `
      query {
        products(first: 250) {
          edges {
            node {
              id
              title
              status
              variants(first: 100) {
                edges {
                  node {
                    id
                    sku
                    title
                    inventoryItem {
                      tracked
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const shopifyData = await shopify.graphql(query);
    const products = shopifyData?.products?.edges || [];
    
    // Find unsynced items (variants not in Supabase)
    const unsyncedItems = [];
    let totalShopifySkus = 0;
    
    for (const productEdge of products) {
      const product = productEdge.node;
      const variants = product.variants?.edges || [];
      
      for (const variantEdge of variants) {
        const variant = variantEdge.node;
        totalShopifySkus++;
        
        const sku = variant.sku;
        const isTracked = variant.inventoryItem?.tracked;
        
        // Check if NOT synced
        if (!sku || !syncedSkuSet.has(sku)) {
          unsyncedItems.push({
            productTitle: product.title,
            variantTitle: variant.title !== 'Default Title' ? variant.title : null,
            sku: sku || null,
            status: product.status,
            tracked: isTracked,
            reason: !sku ? 'no_sku' : (!isTracked ? 'not_tracked' : 'not_synced')
          });
        }
      }
    }
    
    logger.info({ 
      companyId, 
      totalProducts, 
      totalShopifySkus,
      unsyncedCount: unsyncedItems.length 
    }, "Fetched sync stats");
    
    return {
      success: true,
      syncedSkus: totalProducts,
      totalShopifySkus,
      totalProducts,
      companyId,
      unsyncedItems
    };
    
  } catch (error) {
    logger.error({ error: error.message }, "Failed to get Supabase stats");
    return { 
      success: false, 
      error: error.message,
      syncedSkus: 0,
      totalProducts: 0,
      unsyncedItems: []
    };
  }
};

export const params = {
  shopId: { type: "string" }
};

export const options = {
  actionType: "global"
};

