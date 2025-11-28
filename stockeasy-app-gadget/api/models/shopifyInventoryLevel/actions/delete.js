import { deleteRecord, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  // CRITICAL: Completely disable Shopify → Supabase sync
  // Supabase is the source of truth, sync only goes Supabase → Shopify
  logger.info({ inventoryItemId: record.inventoryItemId }, 'Inventory level delete SKIPPED - Supabase is source of truth');
  return; // Exit immediately without deleting anything
  
  // Original code below is never executed
  await preventCrossShopDataAccess(params, record);
  await deleteRecord(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger }) => {
  // Stock sync disabled - Supabase is the source of truth
  // Use Supabase → Shopify sync only (via trigger)
  logger.info({ inventoryItemId: record.inventoryItemId }, 'Inventory level deleted in Gadget (Supabase sync disabled)');
};

/** @type { ActionOptions } */
export const options = {
  actionType: "delete",
  triggers: {
    // Disable ALL triggers including Shopify webhooks
  }
};
