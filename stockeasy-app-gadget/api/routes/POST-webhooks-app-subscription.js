import { RouteHandler } from "gadget-server";
import { updateCompanyBillingByShopifyId } from "../lib/supabase";

/**
 * Webhook handler for Shopify APP_SUBSCRIPTIONS_UPDATE webhook
 * Called when subscription status changes (activated, cancelled, frozen, etc.)
 * 
 * Webhook topic: app_subscriptions/update
 */

const route = async ({ request, reply, api, logger, connections }) => {
  try {
    // Get the webhook payload
    const payload = request.body;
    
    logger.info({ 
      webhookTopic: request.headers["x-shopify-topic"],
      shopDomain: request.headers["x-shopify-shop-domain"]
    }, "Received app subscription webhook");

    // Verify webhook is from Shopify
    const shopDomain = request.headers["x-shopify-shop-domain"];
    if (!shopDomain) {
      logger.error("Missing shop domain in webhook");
      return reply.status(401).send({ error: "Unauthorized" });
    }

    // Find the shop by domain
    const shops = await api.shopifyShop.findMany({
      filter: {
        OR: [
          { domain: { equals: shopDomain } },
          { myshopifyDomain: { equals: shopDomain } }
        ]
      },
      first: 1,
      select: {
        id: true,
        domain: true,
        shopifySubscriptionId: true
      }
    });

    if (!shops || shops.length === 0) {
      logger.error({ shopDomain }, "Shop not found for webhook");
      // Return 200 to acknowledge receipt (Shopify will retry otherwise)
      return reply.status(200).send({ received: true, error: "Shop not found" });
    }

    const shop = shops[0];
    
    // Parse the subscription status from payload
    const subscriptionData = payload.app_subscription || payload;
    
    if (!subscriptionData) {
      logger.warn({ payload }, "No subscription data in webhook payload");
      return reply.status(200).send({ received: true });
    }

    logger.info({ 
      shopId: shop.id,
      subscriptionId: subscriptionData.id,
      status: subscriptionData.status 
    }, "Processing subscription update");

    // Map Shopify status to our status
    let newStatus = "pending";
    switch (subscriptionData.status?.toUpperCase()) {
      case "ACTIVE":
        newStatus = "active";
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

    // Update shop subscription status
    await api.shopifyShop.update(shop.id, {
      subscriptionStatus: newStatus,
      shopifySubscriptionId: subscriptionData.admin_graphql_api_id || shop.shopifySubscriptionId
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // SYNC BILLING INFO TO SUPABASE
    // ═══════════════════════════════════════════════════════════════════════════
    try {
      const updated = await updateCompanyBillingByShopifyId(shopDomain, {
        subscriptionStatus: newStatus,
        shopifySubscriptionId: subscriptionData.admin_graphql_api_id || shop.shopifySubscriptionId
      });
      
      if (updated) {
        logger.info({ shopDomain, status: newStatus }, "✅ Billing webhook synced to Supabase");
      } else {
        logger.warn({ shopDomain }, "⚠️ Company not found in Supabase for webhook sync");
      }
    } catch (supabaseError) {
      logger.error({ error: supabaseError.message }, "❌ Failed to sync webhook to Supabase (non-blocking)");
    }

    // Log the event
    await api.syncLog.create({
      shop: { _link: shop.id },
      entity: "billing",
      operation: "update",
      direction: "shopify_to_stockeasy",
      status: "success",
      message: `Subscription status updated via webhook: ${newStatus}`,
      payload: {
        subscriptionId: subscriptionData.id,
        status: subscriptionData.status,
        ourStatus: newStatus
      }
    });

    logger.info({ 
      shopId: shop.id, 
      newStatus 
    }, "Subscription status updated successfully");

    return reply.status(200).send({ 
      received: true,
      shopId: shop.id,
      status: newStatus
    });

  } catch (error) {
    logger.error({ error: error.message }, "Error processing subscription webhook");
    // Return 200 to prevent Shopify retries for processing errors
    return reply.status(200).send({ 
      received: true, 
      error: error.message 
    });
  }
};

export default route;

