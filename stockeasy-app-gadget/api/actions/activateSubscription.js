import { ActionOptions } from "gadget-server";
import { updateCompanyBillingByShopifyId } from "../lib/supabase";

/**
 * Activates a subscription after merchant approves it
 * Called from the billing callback route
 */

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  const { shopId, chargeId } = params;

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
      subscriptionPlan: true,
      shopifySubscriptionId: true,
      trialStartedAt: true,
      trialEndsAt: true
    }
  });

  if (!shop) {
    throw new Error(`Shop not found: ${shopId}`);
  }

  logger.info({ shopId, chargeId, currentStatus: shop.subscriptionStatus }, "Activating subscription");

  // Get Shopify connection
  const shopify = await connections.shopify.forShopId(shopId);

  // Query the current subscription status from Shopify
  const subscriptionId = chargeId || shop.shopifySubscriptionId;
  
  if (!subscriptionId) {
    throw new Error("No subscription ID available");
  }

  // Verify subscription status with Shopify
  const result = await shopify.graphql(`
    query getAppSubscription($id: ID!) {
      node(id: $id) {
        ... on AppSubscription {
          id
          status
          createdAt
          trialDays
          currentPeriodEnd
          lineItems {
            id
            plan {
              pricingDetails {
                ... on AppRecurringPricing {
                  price {
                    amount
                    currencyCode
                  }
                  interval
                }
              }
            }
          }
        }
      }
    }
  `, {
    id: subscriptionId
  });

  const subscription = result.node;

  if (!subscription) {
    logger.error({ subscriptionId }, "Subscription not found in Shopify");
    throw new Error(`Subscription not found: ${subscriptionId}`);
  }

  logger.info({ 
    subscriptionId, 
    status: subscription.status 
  }, "Retrieved subscription from Shopify");

  // Map Shopify status to our status
  let newStatus = "pending";
  switch (subscription.status) {
    case "ACTIVE":
      // Check if in trial period
      const now = new Date();
      const trialEnds = shop.trialEndsAt ? new Date(shop.trialEndsAt) : null;
      if (trialEnds && now < trialEnds) {
        newStatus = "trial";
      } else {
        newStatus = "active";
      }
      break;
    case "CANCELLED":
      newStatus = "cancelled";
      break;
    case "FROZEN":
      newStatus = "frozen";
      break;
    case "PENDING":
      newStatus = "pending";
      break;
    default:
      newStatus = "pending";
  }

  // Update shop with subscription info
  const updateData = {
    subscriptionStatus: newStatus,
    shopifySubscriptionId: subscription.id
  };

  // Set billing activated date if becoming active
  if (newStatus === "active" || newStatus === "trial") {
    updateData.billingActivatedAt = new Date();
  }

  await api.shopifyShop.update(shopId, updateData);

  logger.info({ 
    shopId, 
    subscriptionId: subscription.id,
    status: newStatus
  }, "Subscription activated successfully");

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC BILLING INFO TO SUPABASE
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const shopifyShopId = shop.myshopifyDomain || shop.domain;
    const billingData = {
      subscriptionPlan: shop.subscriptionPlan || "basic",
      subscriptionStatus: newStatus,
      shopifySubscriptionId: subscription.id,
      maxSyncLocations: 1 // Basic plan = 1 location
    };

    // Add billing activated date if becoming active
    if (newStatus === "active" || newStatus === "trial") {
      billingData.billingActivatedAt = new Date();
    }

    // Include trial dates if available
    if (shop.trialStartedAt) {
      billingData.trialStartedAt = shop.trialStartedAt;
    }
    if (shop.trialEndsAt) {
      billingData.trialEndsAt = shop.trialEndsAt;
    }

    const updated = await updateCompanyBillingByShopifyId(shopifyShopId, billingData);
    
    if (updated) {
      logger.info({ shopifyShopId, status: newStatus }, "✅ Billing info synced to Supabase");
    } else {
      logger.warn({ shopifyShopId }, "⚠️ Company not found in Supabase - billing not synced");
    }
  } catch (supabaseError) {
    // Don't fail the activation if Supabase sync fails
    logger.error({ error: supabaseError.message }, "❌ Failed to sync billing to Supabase (non-blocking)");
  }

  // Log the event
  await api.syncLog.create({
    shop: { _link: shopId },
    entity: "billing",
    operation: "update",
    direction: "shopify_to_stockeasy",
    status: "success",
    message: `Subscription ${newStatus}: ${subscription.id}`,
    payload: {
      subscriptionId: subscription.id,
      shopifyStatus: subscription.status,
      ourStatus: newStatus
    }
  });

  return {
    success: true,
    subscriptionId: subscription.id,
    status: newStatus,
    shopifyStatus: subscription.status
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
  shopId: { type: "string" },
  chargeId: { type: "string" }
};

