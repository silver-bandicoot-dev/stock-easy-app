import { getSupabaseClient } from "../lib/supabase";

/**
 * Connects a Shopify shop to Stockeasy by creating a company.
 * Includes location selection for inventory sync.
 */
export const run = async ({ params, logger, api }) => {
  const { shopId, locationId } = params;
  
  logger.info({ shopId, locationId }, '🚀 Starting connectShopToCompany');
  
  if (!shopId) {
    return { success: false, message: 'shopId is required' };
  }

  if (!locationId) {
    return { success: false, message: 'locationId is required' };
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
        stockEasyCompanyId: true,
        defaultLocationId: true
      }
    });

    if (!shop) {
      return { success: false, message: 'Shop not found' };
    }

    logger.info({ shop: shop.myshopifyDomain }, '📍 Found shop');

    // Verify the location exists and belongs to this shop
    const location = await api.shopifyLocation.findOne(locationId, {
      select: {
        id: true,
        name: true,
        active: true,
        shop: { id: true }
      }
    });

    if (!location) {
      return { success: false, message: 'Location not found' };
    }

    if (location.shop?.id !== shopId) {
      return { success: false, message: 'Location does not belong to this shop' };
    }

    if (!location.active) {
      return { success: false, message: 'Selected location is not active' };
    }

    logger.info({ locationId, locationName: location.name }, '📍 Location verified');

    // Already connected?
    if (shop.stockEasyCompanyId) {
      logger.info({ companyId: shop.stockEasyCompanyId }, '✅ Already connected, updating location');
      
      // Update the location even if already connected
      await api.shopifyShop.update(shopId, {
        defaultLocationId: locationId
      });
      
      return {
        success: true,
        companyId: shop.stockEasyCompanyId,
        locationId: locationId,
        locationName: location.name,
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
      
      // Use the RPC function to create company (consistent with other parts of the codebase)
      const { data: newCompanyId, error: rpcError } = await supabase.rpc('create_shopify_company', {
        p_shopify_shop_id: shop.myshopifyDomain,
        p_shop_name: shop.name || shop.myshopifyDomain.replace('.myshopify.com', ''),
        p_shop_domain: shop.domain || shop.myshopifyDomain,
        p_owner_email: shop.email,
        p_owner_first_name: shop.shopOwner?.split(' ')[0] || null,
        p_owner_last_name: shop.shopOwner?.split(' ').slice(1).join(' ') || null
      });

      if (rpcError) {
        logger.error({ error: rpcError }, '❌ Failed to create company via RPC');
        return { success: false, message: `Database error: ${rpcError.message}` };
      }

      if (!newCompanyId) {
        logger.error('❌ RPC returned no company ID');
        return { success: false, message: 'Failed to create company - no ID returned' };
      }

      companyId = newCompanyId;
      logger.info({ companyId }, '✅ Company created via RPC');
    }

    // Update shop with company ID and location ID
    await api.shopifyShop.update(shopId, {
      stockEasyCompanyId: companyId,
      defaultLocationId: locationId
    });

    logger.info({ companyId, locationId }, '🔗 Shop connected with location!');

    return {
      success: true,
      companyId,
      locationId: locationId,
      locationName: location.name,
      alreadyConnected: false
    };

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, '❌ Error');
    return { success: false, message: error.message };
  }
};

export const params = {
  shopId: { type: "string" },
  locationId: { type: "string" }
};

