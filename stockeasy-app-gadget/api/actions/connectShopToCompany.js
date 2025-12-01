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
            installed_at: new Date().toISOString(),
            default_location_id: locationId,
            default_location_name: location.name
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

