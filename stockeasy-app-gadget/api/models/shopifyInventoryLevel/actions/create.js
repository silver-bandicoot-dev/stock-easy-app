import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger }) => {
  // Log inventory level creation for debugging
  logger.info({ 
    inventoryItemId: record.inventoryItemId, 
    locationId: record.locationId,
    available: record.available 
  }, '📦 Inventory level created in Gadget');
  // Note: Stock sync is handled by inventory_levels/update webhook, not create
};

/** @type { ActionOptions } */
export const options = {
  actionType: "create"
};
