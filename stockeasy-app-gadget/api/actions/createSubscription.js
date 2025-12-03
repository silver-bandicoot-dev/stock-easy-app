import { ActionOptions } from "gadget-server";
import { updateCompanyBillingByShopifyId } from "../lib/supabase";

/**
 * Creates a Shopify subscription for the Basic plan
 * 
 * Plan: Basic - 29$/month
 * - 14 days free trial
 * - Unlimited SKUs
 * - Real-time Shopify sync
 * - Complete supplier order management
 * - Full dashboard
 * - AI predictions
 * - Advanced reports
 * - 1 stock sync location
 */

// Plan configuration
const BASIC_PLAN = {
  name: "StockEasy Basic",
  price: "29.00",
  currencyCode: "USD",
  interval: "EVERY_30_DAYS",
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

  // Check if already has active subscription
  if (shop.subscriptionStatus === "active" && shop.shopifySubscriptionId) {
    logger.info({ shopId, status: shop.subscriptionStatus }, "Shop already has active subscription");
    return {
      success: true,
      alreadySubscribed: true,
      subscriptionId: shop.shopifySubscriptionId
    };
  }

  logger.info({ shopId, domain: shop.domain }, "Creating Shopify subscription");

  // Get Shopify connection for this shop
  const shopify = await connections.shopify.forShopId(shopId);

  // Detect environment - use test mode for development stores
  // Check multiple signals to determine if we're in development
  const isDevelopment = process.env.GADGET_ENV === "development" || 
                        process.env.GADGET_PUBLIC_APP_ENV === "development" ||
                        process.env.NODE_ENV === "development";
  
  // Check if this is a dev store (myshopify.com domains with certain patterns)
  const isDevStore = shop.domain?.includes("development-") || 
                     shop.myshopifyDomain?.includes("development-") ||
                     shop.domain?.includes("-dev.") ||
                     shop.myshopifyDomain?.includes("-dev.");
  
  // Use test mode if either the environment is development OR it's a dev store
  const useTestMode = isDevelopment || isDevStore;
  
  // Build the return URL based on environment
  const baseUrl = isDevelopment 
    ? "https://stockeasy-app--development.gadget.app"
    : "https://stockeasy-app.gadget.app";
  const returnUrl = `${baseUrl}/billing/callback?shop_id=${shopId}`;

  logger.info({ 
    isDevelopment, 
    isDevStore,
    useTestMode,
    returnUrl,
    shopDomain: shop.domain
  }, "Creating subscription with config");

  // Create the subscription via Shopify GraphQL
  // Use test: true for development stores, test: false for production
  const result = await shopify.graphql(`
    mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $trialDays: Int!, $test: Boolean!, $lineItems: [AppSubscriptionLineItemInput!]!) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        trialDays: $trialDays
        test: $test
        lineItems: $lineItems
      ) {
        appSubscription {
          id
          status
          createdAt
          trialDays
          currentPeriodEnd
        }
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }
  `, {
    name: BASIC_PLAN.name,
    returnUrl: returnUrl,
    trialDays: BASIC_PLAN.trialDays,
    test: useTestMode,
    lineItems: [{
      plan: {
        appRecurringPricingDetails: {
          price: {
            amount: BASIC_PLAN.price,
            currencyCode: BASIC_PLAN.currencyCode
          },
          interval: BASIC_PLAN.interval
        }
      }
    }]
  });

  const { appSubscriptionCreate } = result;
  
  // Check for errors
  if (appSubscriptionCreate.userErrors && appSubscriptionCreate.userErrors.length > 0) {
    const errorMessages = appSubscriptionCreate.userErrors.map(e => e.message).join(", ");
    logger.error({ errors: appSubscriptionCreate.userErrors }, "Subscription creation failed");
    throw new Error(`Subscription creation failed: ${errorMessages}`);
  }

  const subscription = appSubscriptionCreate.appSubscription;
  const confirmationUrl = appSubscriptionCreate.confirmationUrl;

  if (!subscription || !confirmationUrl) {
    throw new Error("No subscription or confirmation URL returned from Shopify");
  }

  // Calculate trial end date
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + BASIC_PLAN.trialDays);

  // Update shop with pending subscription info
  await api.shopifyShop.update(shopId, {
    subscriptionStatus: "pending",
    subscriptionPlan: "basic",
    shopifySubscriptionId: subscription.id,
    trialStartedAt: new Date(),
    trialEndsAt: trialEndsAt
  });

  logger.info({ 
    shopId, 
    subscriptionId: subscription.id,
    confirmationUrl 
  }, "Subscription created, awaiting merchant approval");

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC BILLING INFO TO SUPABASE
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const shopifyShopId = shop.myshopifyDomain || shop.domain;
    const updated = await updateCompanyBillingByShopifyId(shopifyShopId, {
      subscriptionPlan: "basic",
      subscriptionStatus: "pending",
      shopifySubscriptionId: subscription.id,
      trialStartedAt: new Date(),
      trialEndsAt: trialEndsAt,
      maxSyncLocations: 1 // Basic plan = 1 location
    });
    
    if (updated) {
      logger.info({ shopifyShopId }, "✅ Billing info synced to Supabase");
    } else {
      logger.warn({ shopifyShopId }, "⚠️ Company not found in Supabase - billing not synced");
    }
  } catch (supabaseError) {
    // Don't fail the subscription creation if Supabase sync fails
    logger.error({ error: supabaseError.message }, "❌ Failed to sync billing to Supabase (non-blocking)");
  }

  // Log the event
  await api.syncLog.create({
    shop: { _link: shopId },
    entity: "billing",
    operation: "create",
    direction: "stockeasy_to_shopify",
    status: "pending",
    message: `Subscription created: ${BASIC_PLAN.name} - awaiting approval`,
    payload: {
      subscriptionId: subscription.id,
      plan: BASIC_PLAN.name,
      price: BASIC_PLAN.price,
      trialDays: BASIC_PLAN.trialDays
    }
  });

  return {
    success: true,
    subscriptionId: subscription.id,
    confirmationUrl: confirmationUrl,
    plan: BASIC_PLAN
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

