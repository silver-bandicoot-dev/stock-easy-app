import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  
  // Mark shop as inactive
  record.isActive = false;
  record.syncStatus = 'paused';
  
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
  // Log the uninstallation event
  await api.syncLog.create({
    shop: { _link: record.id },
    entity: 'webhook',
    operation: 'delete',
    direction: 'shopify_to_stockeasy',
    status: 'success',
    message: `Shop ${record.domain} uninstalled app`
  });
};

/** @type { ActionOptions } */
export const options = { actionType: "update" };
