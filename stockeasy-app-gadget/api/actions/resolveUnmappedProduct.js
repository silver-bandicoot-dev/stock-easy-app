import { getSupabaseClient } from "../lib/supabase";

/**
 * Action to mark an unmapped product as resolved (mapped)
 * Called when a user manually creates a mapping for a product
 * 
 * @type { ActionRun }
 */
export const run = async ({ params, logger, api }) => {
  const { shopId, shopifyVariantId, stockEasySku, createMapping = true } = params;

  if (!shopId) {
    throw new Error("shopId is required");
  }

  if (!shopifyVariantId) {
    throw new Error("shopifyVariantId is required");
  }

  logger.info({ shopId, shopifyVariantId, stockEasySku, createMapping }, "Resolving unmapped product");

  // Get shop to retrieve company ID
  const shop = await api.shopifyShop.findOne(shopId, {
    select: {
      id: true,
      stockEasyCompanyId: true
    }
  });

  if (!shop.stockEasyCompanyId) {
    throw new Error(`Shop ${shopId} does not have a stockEasyCompanyId configured`);
  }

  const companyId = shop.stockEasyCompanyId;
  const supabase = getSupabaseClient();

  // If createMapping is true and stockEasySku is provided, create the mapping
  if (createMapping && stockEasySku) {
    // Get the variant info from Shopify
    const variant = await api.shopifyProduct.maybeFindFirst({
      filter: {
        shopId: { equals: shopId }
      }
    });

    // Create the product mapping in Gadget
    try {
      await api.productMapping.create({
        shop: { _link: shopId },
        shopifyVariantId: shopifyVariantId,
        shopifyProductId: "unknown", // We might not have this info
        stockEasySku: stockEasySku,
        syncSource: "manual"
      });
      logger.info({ shopifyVariantId, stockEasySku }, "Created product mapping");
    } catch (error) {
      // Might already exist
      if (!error.message.includes("unique")) {
        throw error;
      }
      logger.info({ shopifyVariantId }, "Product mapping already exists");
    }
  }

  // Delete from unmapped_products table
  const { data, error } = await supabase
    .from("unmapped_products")
    .delete()
    .eq("company_id", companyId)
    .eq("shopify_variant_id", shopifyVariantId)
    .select();

  if (error) {
    logger.error({ error }, "Failed to delete unmapped product");
    throw new Error(`Failed to resolve unmapped product: ${error.message}`);
  }

  const deletedCount = data?.length || 0;
  logger.info({ deletedCount, shopifyVariantId }, "Resolved unmapped product");

  return {
    success: true,
    resolved: deletedCount > 0,
    shopifyVariantId,
    stockEasySku: stockEasySku || null,
    mappingCreated: createMapping && !!stockEasySku
  };
};

export const params = {
  shopId: { type: "string" },
  shopifyVariantId: { type: "string" },
  stockEasySku: { type: "string" },
  createMapping: { type: "boolean" }
};

/** @type { ActionOptions } */
export const options = {
  triggers: {
    api: true
  }
};


