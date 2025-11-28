import { deleteRecord, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections, config }) => {
  await preventCrossShopDataAccess(params, record);
  
  const startTime = Date.now();
  
  // Delete from Supabase before deleting from Gadget
  if (config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabaseUrl = `${config.SUPABASE_URL}/rest/v1/sales_history?metadata->>shopify_order_id=eq.${record.id}`;
      
      const response = await fetch(supabaseUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": config.SUPABASE_SERVICE_ROLE_KEY
        }
      });
      
      const processingTime = Date.now() - startTime;
      
      if (response.ok) {
        logger.info({ orderId: record.id }, "Successfully deleted order from Supabase sales_history");
        
        await api.syncLog.create({
          shop: { _link: record.shopId },
          entity: "order",
          operation: "delete",
          direction: "shopify_to_stockeasy",
          status: "success",
          shopifyId: record.id,
          message: `Deleted order ${record.id} from Supabase sales_history`,
          processingTimeMs: processingTime
        });
      } else {
        const errorText = await response.text();
        logger.error({ orderId: record.id, status: response.status, error: errorText }, "Failed to delete order from Supabase");
        
        await api.syncLog.create({
          shop: { _link: record.shopId },
          entity: "order",
          operation: "delete",
          direction: "shopify_to_stockeasy",
          status: "error",
          shopifyId: record.id,
          message: `Failed to delete order from Supabase: ${errorText}`,
          processingTimeMs: processingTime
        });
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error({ orderId: record.id, error: error.message }, "Error deleting order from Supabase");
      
      await api.syncLog.create({
        shop: { _link: record.shopId },
        entity: "order",
        operation: "delete",
        direction: "shopify_to_stockeasy",
        status: "error",
        shopifyId: record.id,
        message: `Error deleting order from Supabase: ${error.message}`,
        processingTimeMs: processingTime
      });
    }
  }
  
  // Delete the record from Gadget
  await deleteRecord(record);
};

/** @type { ActionOptions } */
export const options = { actionType: "delete" };
