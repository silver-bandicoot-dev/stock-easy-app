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
    
    // Prepare Shopify connection (needed for parallel execution)
    const shopify = await connections.shopify.forShopId(shopId);
    
    const shopifyQuery = `
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
    
    // 🚀 Execute Supabase and Shopify requests IN PARALLEL
    const [produitsResponse, shopifyData] = await Promise.all([
      // Supabase request
      fetch(
        `${supabaseUrl}/rest/v1/produits?company_id=eq.${companyId}&select=sku`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'count=exact'
          }
        }
      ),
      // Shopify GraphQL request
      shopify.graphql(shopifyQuery)
    ]);
    
    // Process Supabase response
    const totalProducts = parseInt(produitsResponse.headers.get('content-range')?.split('/')[1] || '0');
    const produitsData = await produitsResponse.json();
    
    // Create set of synced SKUs
    const syncedSkuSet = new Set((produitsData || []).map(p => p.sku));
    const products = shopifyData?.products?.edges || [];
    
    // Find unsynced items (variants not in Supabase)
    // ⚡ Optimization: limit details to first 50 items for UI performance
    const MAX_UNSYNCED_DETAILS = 50;
    const unsyncedItems = [];
    let totalShopifySkus = 0;
    let unsyncedCount = 0;
    let syncedFromShopifyCount = 0; // ← Count synced SKUs from Shopify side for consistency
    
    for (const productEdge of products) {
      const product = productEdge.node;
      const variants = product.variants?.edges || [];
      
      for (const variantEdge of variants) {
        const variant = variantEdge.node;
        totalShopifySkus++;
        
        const sku = variant.sku;
        const isTracked = variant.inventoryItem?.tracked;
        
        // Check if synced (has SKU and exists in Supabase)
        if (sku && syncedSkuSet.has(sku)) {
          syncedFromShopifyCount++;
        } else {
          // NOT synced
          unsyncedCount++;
          
          // Only store details for first N items (optimization)
          if (unsyncedItems.length < MAX_UNSYNCED_DETAILS) {
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
    }
    
    logger.info({ 
      companyId, 
      totalProducts,
      syncedFromShopifyCount,
      totalShopifySkus,
      unsyncedCount
    }, "Fetched sync stats");
    
    // ✅ Use syncedFromShopifyCount for consistency: synced + unsynced = total
    return {
      success: true,
      syncedSkus: syncedFromShopifyCount,
      totalShopifySkus,
      totalProducts, // Still useful to know Supabase count
      companyId,
      unsyncedItems,
      unsyncedCount // ← Total count (may be > unsyncedItems.length)
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
  actionType: "custom"
};

