import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  // CRITICAL: Completely disable Shopify → Supabase sync
  // Supabase is the source of truth, sync only goes Supabase → Shopify
  logger.info({ inventoryItemId: record.inventoryItemId }, 'Inventory level create SKIPPED - Supabase is source of truth');
  return; // Exit immediately without saving anything
  
  // Original code below is never executed
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger }) => {
  // Stock sync disabled - Supabase is the source of truth
  // Use Supabase → Shopify sync only (via trigger)
  logger.info({ inventoryItemId: record.inventoryItemId, available: record.available }, 'Inventory level created in Gadget (Supabase sync disabled)');
};

/** @type { ActionOptions } */
export const options = {
  actionType: "create",
  triggers: {
    // Disable ALL triggers including Shopify webhooks
  }
};
