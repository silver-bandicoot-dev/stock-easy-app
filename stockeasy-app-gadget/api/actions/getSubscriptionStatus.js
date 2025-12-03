import { ActionOptions } from "gadget-server";

/**
 * Gets the current subscription status for a shop
 * Used by the frontend to display billing information
 */

const BASIC_PLAN = {
  name: "StockEasy Basic",
  price: "29.00",
  currencyCode: "USD",
  interval: "monthly",
  trialDays: 14,
  features: [
    "SKUs illimités",
    "Sync Shopify temps réel",
    "Gestion complète des commandes fournisseurs",
    "Dashboard complet",
    "Prédictions IA",
    "Rapports avancés",
    "1 emplacement de sync des stocks"
  ]
};

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  const { shopId } = params;

  if (!shopId) {
    throw new Error("shopId is required");
  }

  // Get the shop record with subscription info
  const shop = await api.shopifyShop.findOne(shopId, {
    select: {
      id: true,
      domain: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      shopifySubscriptionId: true,
      trialStartedAt: true,
      trialEndsAt: true,
      billingActivatedAt: true
    }
  });

  if (!shop) {
    throw new Error(`Shop not found: ${shopId}`);
  }

  // Calculate trial info
  const now = new Date();
  const trialEnds = shop.trialEndsAt ? new Date(shop.trialEndsAt) : null;
  const isInTrial = trialEnds && now < trialEnds && 
    (shop.subscriptionStatus === "trial" || shop.subscriptionStatus === "active");
  
  let trialDaysRemaining = 0;
  if (isInTrial && trialEnds) {
    trialDaysRemaining = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Determine if subscription is required (no active subscription)
  const requiresSubscription = !shop.subscriptionStatus || 
    shop.subscriptionStatus === "pending" || 
    shop.subscriptionStatus === "cancelled";

  return {
    shopId: shop.id,
    domain: shop.domain,
    status: shop.subscriptionStatus || "none",
    plan: shop.subscriptionPlan || null,
    planDetails: BASIC_PLAN,
    subscriptionId: shop.shopifySubscriptionId,
    isInTrial,
    trialDaysRemaining,
    trialEndsAt: shop.trialEndsAt,
    billingActivatedAt: shop.billingActivatedAt,
    requiresSubscription,
    canAccessApp: !requiresSubscription
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

