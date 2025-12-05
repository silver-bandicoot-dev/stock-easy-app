import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";
import { getSupabaseClient } from "../../../lib/supabase";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections, config }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ record, api, logger }) => {
  try {
    await api.enqueue(api.syncProductToSupabase, {
      productId: record.id,
      shopId: record.shopId
    }, {
      retries: {
        retryCount: 5,
        backoffFactor: 2,
        initialInterval: 1000
      }
    });
    logger.info({ productId: record.id }, 'Enqueued Supabase sync background job');
  } catch (error) {
    logger.error({ error, productId: record.id }, 'Failed to enqueue Supabase sync');
  }
};

/** @type { ActionOptions } */
export const options = { 
  actionType: "create"
};
