import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/**
 * After the order is created, enqueue sync to Supabase sales_history
 * This ensures real-time sales tracking when new orders come in
 * 
 * @type { ActionOnSuccess }
 */
export const onSuccess = async ({ record, logger, api }) => {
  try {
    // Enqueue sales history sync to Supabase
    await api.enqueue(api.syncOrderToSupabase, { 
      orderId: record.id,
      shopId: record.shopId 
    }, {
      retries: {
        retryCount: 3,
        backoffFactor: 2,
        initialInterval: 1000
      }
    });
    
    logger.info({ 
      orderId: record.id, 
      orderName: record.name 
    }, '📦 New order created - enqueued sync to Supabase');
    
  } catch (error) {
    // Log but don't throw - we don't want to fail the Shopify webhook
    logger.error({ 
      error: error.message, 
      orderId: record.id 
    }, '❌ Failed to enqueue order sync');
  }
};

/** @type { ActionOptions } */
export const options = { actionType: "create" };
