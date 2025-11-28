import { createShopifyUserAndCompany } from "../lib/supabase";

/** @type { ActionRun } */
export const run = async ({ params, logger, api }) => {
  try {
    logger.info({ shopId: params.shopId }, "Testing shop installation");

    const shop = await api.shopifyShop.findOne(params.shopId, {
      select: {
        id: true,
        domain: true,
        name: true,
        email: true,
        shopOwner: true,
        stockEasyCompanyId: true
      }
    });

    const shopOwnerEmail = shop.email || shop.shopOwner || `${shop.domain.replace('.myshopify.com', '')}@shopify-placeholder.com`;
    const shopOwnerName = shop.shopOwner || null;

    logger.info({ 
      shopDomain: shop.domain,
      shopOwnerEmail,
      shopOwnerName 
    }, "Creating user and company");

    const { userId, companyId } = await createShopifyUserAndCompany(
      shop.domain,
      shopOwnerEmail,
      shop.name,
      shopOwnerName
    );

    logger.info({ 
      userId,
      companyId 
    }, "User and company created, updating shop");

    await api.internal.shopifyShop.update(shop.id, {
      stockEasyCompanyId: companyId
    });

    logger.info({ shopId: shop.id }, "Enqueueing syncs");

    await api.enqueue(api.syncShopifyProducts, { shopId: shop.id });
    await api.enqueue(api.syncSalesMetrics, { shopId: shop.id });

    const result = {
      success: true,
      shopId: shop.id,
      shopDomain: shop.domain,
      userId,
      companyId,
      email: shopOwnerEmail,
      syncsEnqueued: true
    };

    logger.info(result, "Shop installation test completed successfully");

    return result;
  } catch (error) {
    logger.error({ error, shopId: params.shopId }, "Failed to test shop installation");
    return {
      success: false,
      error: error.message,
      shopId: params.shopId
    };
  }
};

export const params = {
  shopId: { type: "string" }
};
