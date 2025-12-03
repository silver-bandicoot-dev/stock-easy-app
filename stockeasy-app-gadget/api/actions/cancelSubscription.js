import { ActionOptions } from "gadget-server";
import { updateCompanyBillingByShopifyId } from "../lib/supabase";

/**
 * Cancels a Shopify subscription
 */

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  const { shopId } = params;

  if (!shopId) {
    throw new Error("shopId is required");
  }

  // Get the shop record
  const shop = await api.shopifyShop.findOne(shopId, {
    select: {
      id: true,
      domain: true,
      myshopifyDomain: true,
      subscriptionStatus: true,
      shopifySubscriptionId: true
    }
  });

  if (!shop) {
    throw new Error(`Shop not found: ${shopId}`);
  }

  if (!shop.shopifySubscriptionId) {
    logger.warn({ shopId }, "No subscription to cancel");
    return {
      success: true,
      message: "No active subscription"
    };
  }

  logger.info({ shopId, subscriptionId: shop.shopifySubscriptionId }, "Cancelling subscription");

  // Get Shopify connection
  const shopify = await connections.shopify.forShopId(shopId);

  // Cancel the subscription via Shopify GraphQL
  const result = await shopify.graphql(`
    mutation appSubscriptionCancel($id: ID!) {
      appSubscriptionCancel(id: $id) {
        appSubscription {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    id: shop.shopifySubscriptionId
  });

  const { appSubscriptionCancel } = result;

  // Check for errors
  if (appSubscriptionCancel.userErrors && appSubscriptionCancel.userErrors.length > 0) {
    const errorMessages = appSubscriptionCancel.userErrors.map(e => e.message).join(", ");
    logger.error({ errors: appSubscriptionCancel.userErrors }, "Subscription cancellation failed");
    throw new Error(`Subscription cancellation failed: ${errorMessages}`);
  }

  // Update shop status
  await api.shopifyShop.update(shopId, {
    subscriptionStatus: "cancelled"
  });

  logger.info({ shopId, subscriptionId: shop.shopifySubscriptionId }, "Subscription cancelled successfully");

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC BILLING INFO TO SUPABASE
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const shopifyShopId = shop.myshopifyDomain || shop.domain;
    const updated = await updateCompanyBillingByShopifyId(shopifyShopId, {
      subscriptionStatus: "cancelled"
    });
    
    if (updated) {
      logger.info({ shopifyShopId }, "✅ Billing cancellation synced to Supabase");
    } else {
      logger.warn({ shopifyShopId }, "⚠️ Company not found in Supabase - cancellation not synced");
    }
  } catch (supabaseError) {
    // Don't fail the cancellation if Supabase sync fails
    logger.error({ error: supabaseError.message }, "❌ Failed to sync cancellation to Supabase (non-blocking)");
  }

  // Log the event
  await api.syncLog.create({
    shop: { _link: shopId },
    entity: "billing",
    operation: "delete",
    direction: "stockeasy_to_shopify",
    status: "success",
    message: `Subscription cancelled: ${shop.shopifySubscriptionId}`
  });

  return {
    success: true,
    subscriptionId: shop.shopifySubscriptionId,
    status: "cancelled"
  };
};

/** @type { ActionOptions } */
export const options = {
  actionType: "custom",
  triggers: {
    api: true
  }
};

export const params = {
  shopId: { type: "string" }
};

