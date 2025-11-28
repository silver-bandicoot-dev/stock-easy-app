import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";
import { getCompanyUuidByShopifyId, syncShopifyLocation } from "../../../lib/supabase";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
  try {
    // Get the shop to retrieve stockEasyCompanyId
    const shop = await api.shopifyShop.findOne(record.shopId, {
      select: {
        id: true,
        domain: true,
        stockEasyCompanyId: true
      }
    });

    if (!shop) {
      logger.warn({ locationId: record.id }, 'Shop not found for location');
      return;
    }

    if (!shop.stockEasyCompanyId) {
      logger.warn({ 
        shopId: shop.id, 
        locationId: record.id 
      }, 'Shop has no stockEasyCompanyId - skipping location sync');
      return;
    }

    // Check if stockEasyCompanyId is already a UUID or needs to be looked up
    let companyUuid;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shop.stockEasyCompanyId);

    if (isUuid) {
      // stockEasyCompanyId is already a UUID, use it directly
      companyUuid = shop.stockEasyCompanyId;
    } else {
      // stockEasyCompanyId is a domain/identifier, look it up in Supabase
      companyUuid = await getCompanyUuidByShopifyId(shop.stockEasyCompanyId);
      
      if (!companyUuid) {
        logger.warn({ 
          stockEasyCompanyId: shop.stockEasyCompanyId,
          locationId: record.id
        }, 'Company not found in Supabase - skipping location sync');
        return;
      }
    }

    // Sync the location to Supabase warehouse
    const warehouseId = await syncShopifyLocation(
      companyUuid,
      record.id,
      {
        name: record.name,
        address1: record.address1,
        address2: record.address2,
        city: record.city,
        zip: record.zipCode,
        country: record.country,
        active: record.active
      }
    );

    logger.info({ 
      shopifyLocationId: record.id,
      warehouseId: warehouseId,
      name: record.name
    }, 'Synced Shopify location to warehouse');

    await api.syncLog.create({
      shop: { _link: record.shopId },
      entity: 'warehouse',
      operation: 'update',
      direction: 'shopify_to_stockeasy',
      status: 'success',
      shopifyId: record.id,
      message: `Updated warehouse for location ${record.name}`,
      payload: {
        shopifyLocationId: record.id,
        warehouseId: warehouseId,
        name: record.name,
        city: record.city,
        country: record.country
      }
    });

  } catch (error) {
    logger.error({ 
      error: error,
      locationId: record.id,
      locationName: record.name
    }, 'Failed to sync Shopify location to warehouse');

    await api.syncLog.create({
      shop: { _link: record.shopId },
      entity: 'warehouse',
      operation: 'update',
      direction: 'shopify_to_stockeasy',
      status: 'error',
      shopifyId: record.id,
      message: `Failed to sync location ${record.name}: ${error.message}`,
      payload: {
        shopifyLocationId: record.id,
        error: error.message
      }
    });
  }
};

/** @type { ActionOptions } */
export const options = { actionType: "update" };
