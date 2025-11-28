import { getSupabaseClient } from "../lib/supabase";

/**
 * Connects a Shopify shop to Stockeasy by creating a company.
 * Simplified version for reliability.
 */
export const run = async ({ params, logger, api }) => {
  const { shopId } = params;
  
  logger.info({ shopId }, '🚀 Starting connectShopToCompany');
  
  if (!shopId) {
    return { success: false, message: 'shopId is required' };
  }

  try {
    // Get the shop
    const shop = await api.shopifyShop.findOne(shopId, {
      select: {
        id: true,
        name: true,
        domain: true,
        email: true,
        shopOwner: true,
        myshopifyDomain: true,
        stockEasyCompanyId: true
      }
    });

    if (!shop) {
      return { success: false, message: 'Shop not found' };
    }

    logger.info({ shop: shop.myshopifyDomain }, '📍 Found shop');

    // Already connected?
    if (shop.stockEasyCompanyId) {
      logger.info({ companyId: shop.stockEasyCompanyId }, '✅ Already connected');
      return {
        success: true,
        companyId: shop.stockEasyCompanyId,
        alreadyConnected: true
      };
    }

    // Connect to Supabase
    const supabase = getSupabaseClient();
    
    // Check if company exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('shopify_shop_id', shop.myshopifyDomain)
      .maybeSingle();

    let companyId = existingCompany?.id;

    if (!companyId) {
      logger.info('🏢 Creating new company...');
      
      // Create company directly (simple insert)
      const { data: newCompany, error: insertError } = await supabase
        .from('companies')
        .insert({
          name: shop.name || shop.myshopifyDomain.replace('.myshopify.com', ''),
          shopify_shop_id: shop.myshopifyDomain,
          settings: {
            owner_email: shop.email,
            owner_name: shop.shopOwner,
            source: 'shopify',
            installed_at: new Date().toISOString()
          }
        })
        .select('id')
        .single();

      if (insertError) {
        logger.error({ error: insertError }, '❌ Failed to create company');
        return { success: false, message: `Database error: ${insertError.message}` };
      }

      companyId = newCompany.id;
      logger.info({ companyId }, '✅ Company created');
    }

    // Update shop with company ID
    await api.shopifyShop.update(shopId, {
      stockEasyCompanyId: companyId
    });

    logger.info({ companyId }, '🔗 Shop connected!');

    return {
      success: true,
      companyId,
      alreadyConnected: false
    };

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, '❌ Error');
    return { success: false, message: error.message };
  }
};

export const params = {
  shopId: { type: "string" }
};

