import { getCompanyUuidByShopifyId, syncShopifyLocation } from "../lib/supabase";

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  if (!params.shopId) {
    throw new Error('shopId is required');
  }

  const shop = await api.shopifyShop.findOne(params.shopId, {
    select: {
      id: true,
      domain: true,
      myshopifyDomain: true,
      stockEasyCompanyId: true
    }
  });

  if (!shop) {
    throw new Error(`Shop not found: ${params.shopId}`);
  }

  if (!shop.stockEasyCompanyId) {
    throw new Error(`Shop ${shop.domain} has no stockEasyCompanyId configured`);
  }

  // Check if stockEasyCompanyId is already a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  // or if it's a domain that needs to be looked up
  let companyUuid;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shop.stockEasyCompanyId);

  if (isUuid) {
    // stockEasyCompanyId is already a UUID, use it directly
    companyUuid = shop.stockEasyCompanyId;
    logger.info({ companyUuid }, 'Using stockEasyCompanyId as company UUID directly');
  } else {
    // stockEasyCompanyId is a domain/identifier, look it up in Supabase
    companyUuid = await getCompanyUuidByShopifyId(shop.stockEasyCompanyId);
    
    if (!companyUuid) {
      throw new Error(`No company found in Supabase for stockEasyCompanyId: ${shop.stockEasyCompanyId}`);
    }
    
    logger.info({ companyUuid, stockEasyCompanyId: shop.stockEasyCompanyId }, 'Looked up company UUID from stockEasyCompanyId');
  }

  const locations = await api.shopifyLocation.findMany({
    filter: {
      shopId: { equals: params.shopId }
    },
    select: {
      id: true,
      name: true,
      address1: true,
      address2: true,
      city: true,
      zipCode: true,
      country: true,
      active: true
    }
  });

  logger.info({ shopId: params.shopId, locationCount: locations.length }, 'Fetched Shopify locations');

  const results = {
    success: [],
    errors: []
  };

  for (const location of locations) {
    try {
      const warehouseId = await syncShopifyLocation(
        companyUuid,
        location.id,
        {
          name: location.name,
          address1: location.address1,
          address2: location.address2,
          city: location.city,
          zip: location.zipCode,
          country: location.country,
          active: location.active
        }
      );

      results.success.push({
        shopifyLocationId: location.id,
        warehouseId: warehouseId,
        name: location.name
      });

      logger.info({ 
        shopifyLocationId: location.id, 
        warehouseId: warehouseId,
        name: location.name
      }, 'Synced Shopify location to warehouse');

    } catch (error) {
      results.errors.push({
        shopifyLocationId: location.id,
        name: location.name,
        error: error.message
      });

      logger.error({ 
        error: error,
        shopifyLocationId: location.id,
        name: location.name
      }, 'Failed to sync Shopify location');
    }
  }

  const status = results.errors.length === 0 ? 'success' : (results.success.length > 0 ? 'success' : 'error');
  const message = `Synced ${results.success.length}/${locations.length} locations. ${results.errors.length} errors.`;

  await api.syncLog.create({
    shop: { _link: params.shopId },
    entity: 'warehouse',
    operation: 'sync',
    direction: 'shopify_to_stockeasy',
    status: status,
    message: message,
    payload: {
      totalLocations: locations.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      results: results
    }
  });

  return {
    shopId: params.shopId,
    companyId: companyUuid,
    totalLocations: locations.length,
    synced: results.success.length,
    failed: results.errors.length,
    results: results
  };
};

export const params = {
  shopId: { type: "string" }
};
