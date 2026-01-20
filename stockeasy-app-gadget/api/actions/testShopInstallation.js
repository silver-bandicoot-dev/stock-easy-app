import { createShopifyUserAndCompany, getSupabaseClient } from "../lib/supabase";

/** @type { ActionRun } */
export const run = async ({ params, logger, api }) => {
  try {
    logger.info({ shopId: params.shopId }, "Testing shop installation");

    // ═══════════════════════════════════════════════════════════════════════════
    // DIAGNOSTIC: Check environment configuration
    // ═══════════════════════════════════════════════════════════════════════════
    const diagnostics = {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPreview: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 50) + '...' : 'NOT SET',
      keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    };
    
    logger.info(diagnostics, '🔧 Environment diagnostics');
    
    if (!diagnostics.hasSupabaseUrl || !diagnostics.hasSupabaseKey) {
      return {
        success: false,
        error: 'Missing Supabase environment variables',
        diagnostics,
        fix: 'Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Gadget Production environment'
      };
    }

    // Test Supabase connection
    try {
      const supabase = getSupabaseClient();
      const { data: testData, error: testError } = await supabase
        .from('companies')
        .select('count')
        .limit(1);
      
      if (testError) {
        logger.error({ error: testError }, '❌ Supabase connection test failed');
        return {
          success: false,
          error: `Supabase connection failed: ${testError.message}`,
          diagnostics,
          fix: 'Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct for your production Supabase'
        };
      }
      logger.info('✅ Supabase connection test passed');
    } catch (connError) {
      return {
        success: false,
        error: `Supabase connection error: ${connError.message}`,
        diagnostics
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Get shop data
    // ═══════════════════════════════════════════════════════════════════════════
    const shop = await api.shopifyShop.findOne(params.shopId, {
      select: {
        id: true,
        domain: true,
        myshopifyDomain: true,
        name: true,
        email: true,
        shopOwner: true,
        stockEasyCompanyId: true
      }
    });

    // CRITICAL: Use myshopifyDomain, not domain!
    const shopifyShopId = shop.myshopifyDomain || shop.domain;
    const shopOwnerEmail = shop.email || shop.shopOwner || `${shopifyShopId.replace('.myshopify.com', '')}@shopify-placeholder.com`;
    const shopOwnerName = shop.shopOwner || null;

    logger.info({ 
      shopDomain: shop.domain,
      myshopifyDomain: shop.myshopifyDomain,
      shopifyShopIdUsed: shopifyShopId,
      shopOwnerEmail,
      shopOwnerName 
    }, "Creating user and company");

    const { userId, companyId } = await createShopifyUserAndCompany(
      shopifyShopId,  // FIXED: Use myshopifyDomain instead of domain
      shopOwnerEmail,
      shop.name,
      shopOwnerName
    );

    logger.info({ 
      userId,
      companyId 
    }, "User and company created, updating shop");

    await api.internal.shopifyShop.update(shop.id, {
      stockEasyCompanyId: companyId
    });

    logger.info({ shopId: shop.id }, "Enqueueing syncs");

    await api.enqueue(api.syncShopifyProducts, { shopId: shop.id });
    // syncSalesMetrics supprimé - ventes_totales_30j est maintenant calculé
    // automatiquement par les triggers PostgreSQL (migration 088)

    const result = {
      success: true,
      shopId: shop.id,
      shopDomain: shop.domain,
      myshopifyDomain: shop.myshopifyDomain,
      shopifyShopIdUsed: shopifyShopId,
      userId,
      companyId,
      email: shopOwnerEmail,
      syncsEnqueued: true,
      diagnostics
    };

    logger.info(result, "Shop installation test completed successfully");

    return result;
  } catch (error) {
    logger.error({ 
      error: error.message, 
      stack: error.stack,
      shopId: params.shopId 
    }, "Failed to test shop installation");
    return {
      success: false,
      error: error.message,
      errorStack: error.stack,
      shopId: params.shopId
    };
  }
};

export const params = {
  shopId: { type: "string" }
};
