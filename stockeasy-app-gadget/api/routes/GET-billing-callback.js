import { RouteHandler } from "gadget-server";

/**
 * Billing callback route - called after merchant approves/declines subscription
 * URL: /billing/callback?shop_id=xxx&charge_id=xxx
 */

const route = async ({ request, reply, api, logger, connections }) => {
  const url = new URL(request.url, `https://${request.headers.host}`);
  const shopId = url.searchParams.get("shop_id");
  const chargeId = url.searchParams.get("charge_id");

  logger.info({ shopId, chargeId }, "Billing callback received");

  if (!shopId) {
    return reply.status(400).send({ error: "Missing shop_id parameter" });
  }

  try {
    // Get shop to verify it exists and get the Shopify domain
    const shop = await api.shopifyShop.findOne(shopId, {
      select: {
        id: true,
        domain: true,
        myshopifyDomain: true,
        shopifySubscriptionId: true
      }
    });

    if (!shop) {
      logger.error({ shopId }, "Shop not found");
      return reply.status(404).send({ error: "Shop not found" });
    }

    // Activate the subscription
    const result = await api.activateSubscription({
      shopId: shopId,
      chargeId: chargeId || shop.shopifySubscriptionId
    });

    logger.info({ shopId, result }, "Subscription activation result");

    // Redirect back to the app in Shopify Admin
    const redirectUrl = `https://${shop.myshopifyDomain || shop.domain}/admin/apps/stockeasy-app`;
    
    return reply
      .header("Location", redirectUrl)
      .status(302)
      .send();

  } catch (error) {
    logger.error({ shopId, error: error.message }, "Billing callback error");
    
    // Still redirect to the app, but log the error
    // The app will handle showing appropriate status to the user
    try {
      const shop = await api.shopifyShop.findOne(shopId, {
        select: { myshopifyDomain: true, domain: true }
      });
      
      if (shop) {
        const redirectUrl = `https://${shop.myshopifyDomain || shop.domain}/admin/apps/stockeasy-app?billing_error=1`;
        return reply
          .header("Location", redirectUrl)
          .status(302)
          .send();
      }
    } catch {
      // Fall through to error response
    }

    return reply.status(500).send({ 
      error: "Failed to process billing callback",
      details: error.message 
    });
  }
};

export default route;

