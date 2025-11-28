import { deleteRecord, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections, config }) => {
  await preventCrossShopDataAccess(params, record);

  try {
    // Load the shop to get stockEasyCompanyId
    const shop = await api.shopifyShop.findOne(record.shopId, {
      select: { id: true, stockEasyCompanyId: true }
    });

    logger.info({ shopId: shop.id, productId: record.id }, "Processing product deletion");

    // Find all productMapping records for this product
    const mappings = await api.productMapping.findMany({
      filter: {
        AND: [
          { shopifyProductId: { equals: record.id } },
          { shopId: { equals: record.shopId } }
        ]
      },
      select: {
        id: true,
        shopifySku: true,
        stockEasySku: true,
        shopifyVariantId: true
      }
    });

    logger.info({ mappingCount: mappings.length }, "Found product mappings to delete");

    // Process each mapping
    for (const mapping of mappings) {
      const startTime = Date.now();
      let supabaseSuccess = false;
      let supabaseError = null;

      try {
        // Delete from Supabase if configured
        if (config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY && shop.stockEasyCompanyId) {
          const supabaseUrl = `${config.SUPABASE_URL}/rest/v1/produits?sku=eq.${mapping.shopifySku}&company_id=eq.${shop.stockEasyCompanyId}`;
          
          const response = await fetch(supabaseUrl, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': config.SUPABASE_SERVICE_ROLE_KEY
            }
          });

          if (response.ok) {
            supabaseSuccess = true;
            logger.info({ sku: mapping.shopifySku }, "Successfully deleted product from Supabase");
          } else {
            const errorText = await response.text();
            supabaseError = `Supabase delete failed: ${response.status} - ${errorText}`;
            logger.error({ sku: mapping.shopifySku, status: response.status, error: errorText }, "Failed to delete product from Supabase");
          }
        }

        const processingTime = Date.now() - startTime;

        // Log to syncLog
        await api.syncLog.create({
          direction: "shopify_to_stockeasy",
          entity: "product",
          operation: "delete",
          shop: { _link: record.shopId },
          status: supabaseSuccess ? "success" : (supabaseError ? "error" : "skipped"),
          stockEasySku: mapping.stockEasySku,
          shopifyId: mapping.shopifyVariantId,
          processingTimeMs: processingTime,
          message: supabaseError || (supabaseSuccess ? "Product deleted from Supabase" : "Supabase not configured"),
          payload: {
            sku: mapping.shopifySku,
            productId: record.id,
            companyId: shop.stockEasyCompanyId
          }
        });

      } catch (error) {
        const processingTime = Date.now() - startTime;
        logger.error({ error: error.message, sku: mapping.shopifySku }, "Error processing product deletion");
        
        // Log error to syncLog
        await api.syncLog.create({
          direction: "shopify_to_stockeasy",
          entity: "product",
          operation: "delete",
          shop: { _link: record.shopId },
          status: "error",
          stockEasySku: mapping.stockEasySku,
          shopifyId: mapping.shopifyVariantId,
          processingTimeMs: processingTime,
          message: `Error: ${error.message}`,
          payload: {
            sku: mapping.shopifySku,
            productId: record.id,
            error: error.message
          }
        });
      }

      // Delete the productMapping record
      try {
        await api.productMapping.delete(mapping.id);
        logger.info({ mappingId: mapping.id }, "Deleted product mapping");
      } catch (error) {
        logger.error({ error: error.message, mappingId: mapping.id }, "Failed to delete product mapping");
      }
    }

  } catch (error) {
    logger.error({ error: error.message, productId: record.id }, "Error in product deletion process");
    // Continue with deletion even if sync fails
  }

  // Delete the product record
  await deleteRecord(record);
};

/** @type { ActionOptions } */
export const options = { actionType: "delete" };
