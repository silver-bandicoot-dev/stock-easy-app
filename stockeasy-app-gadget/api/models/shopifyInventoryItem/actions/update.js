import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";
import { getSupabaseClient } from "../../../lib/supabase";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
  try {
    // Get the unit cost from the record
    const unitCost = record.unitCost?.amount ? parseFloat(record.unitCost.amount) : null;
    
    if (unitCost === null) {
      logger.debug({ inventoryItemId: record.id }, 'No unit cost on inventory item, skipping sync');
      return;
    }

    // Find the product mapping for this inventory item
    const mapping = await api.productMapping.maybeFindFirst({
      filter: {
        shopifyInventoryItemId: { equals: String(record.id) },
        shopId: { equals: record.shopId }
      },
      select: {
        stockEasySku: true,
        stockEasyCompanyId: true
      }
    });

    if (!mapping) {
      logger.debug({ inventoryItemId: record.id }, 'No product mapping found for inventory item');
      return;
    }

    // Get company ID from shop
    const shop = await api.shopifyShop.findOne(record.shopId, {
      select: { stockEasyCompanyId: true }
    });

    if (!shop?.stockEasyCompanyId) {
      logger.debug({ shopId: record.shopId }, 'Shop has no stockEasyCompanyId');
      return;
    }

    // Update prix_achat in Supabase
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('produits')
      .update({ prix_achat: unitCost })
      .eq('sku', mapping.stockEasySku)
      .eq('company_id', shop.stockEasyCompanyId);

    if (error) {
      logger.error({ error: error.message, sku: mapping.stockEasySku }, 'Failed to update prix_achat');
    } else {
      logger.info({ 
        sku: mapping.stockEasySku, 
        prix_achat: unitCost 
      }, '✅ Updated prix_achat in Supabase');
    }

  } catch (error) {
    logger.error({ error: error.message, inventoryItemId: record.id }, 'Error syncing inventory item cost');
  }
};

/** @type { ActionOptions } */
export const options = { actionType: "update" };
