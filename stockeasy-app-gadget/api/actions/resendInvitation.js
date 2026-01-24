import { getSupabaseClient } from "../lib/supabase";

/**
 * Resends an invitation to a shop that already installed the app.
 * Use this for merchants who:
 * - Installed before the invitation flow was implemented
 * - Never received or lost their invitation email
 * - Need to reset their password setup
 * 
 * Can be called from Gadget console or API with the shop's myshopify domain.
 */
export const run = async ({ params, logger, api }) => {
  const { shopDomain } = params;
  
  logger.info({ shopDomain }, '🔄 Resending invitation for existing shop');
  
  if (!shopDomain) {
    return { success: false, message: 'shopDomain is required (e.g., "my-shop.myshopify.com")' };
  }

  try {
    // Find the shop in Gadget
    const shops = await api.shopifyShop.findMany({
      filter: {
        OR: [
          { myshopifyDomain: { equals: shopDomain } },
          { domain: { equals: shopDomain } }
        ]
      },
      first: 1,
      select: {
        id: true,
        name: true,
        email: true,
        myshopifyDomain: true,
        domain: true,
        shopOwner: true,
        stockEasyCompanyId: true
      }
    });

    if (shops.length === 0) {
      logger.error({ shopDomain }, '❌ Shop not found');
      return { success: false, message: `Shop not found: ${shopDomain}` };
    }

    const shop = shops[0];
    logger.info({ shop }, '✅ Shop found');

    if (!shop.email) {
      logger.error({ shopDomain }, '❌ Shop has no email');
      return { success: false, message: 'Shop has no email address configured' };
    }

    const supabase = getSupabaseClient();
    
    // Check if user already exists and has password configured
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users?.users?.find(u => 
      u.email?.toLowerCase() === shop.email.toLowerCase()
    );
    
    const hasPasswordConfigured = existingUser?.user_metadata?.password_configured === true;
    
    logger.info({ 
      email: shop.email,
      userExists: !!existingUser,
      hasPasswordConfigured
    }, '👤 User status');

    if (hasPasswordConfigured) {
      return {
        success: true,
        message: `L'utilisateur ${shop.email} a déjà configuré son mot de passe. Il peut se connecter directement sur stockeasy.app`,
        action: 'already_configured',
        email: shop.email
      };
    }

    // Generate and send invitation
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: shop.email,
      options: {
        redirectTo: 'https://stockeasy.app/setup-password',
        data: {
          shop_name: shop.name || shop.domain,
          shopify_shop_id: shop.myshopifyDomain || shop.domain,
          owner_name: shop.shopOwner || null,
          source: 'manual_resend',
          password_configured: false
        }
      }
    });

    if (error) {
      logger.error({ error: error.message }, '❌ Failed to generate invitation');
      return { success: false, message: error.message };
    }

    logger.info({ email: shop.email }, '✅ Invitation sent successfully');

    return {
      success: true,
      message: `Invitation envoyée à ${shop.email}`,
      action: 'invitation_sent',
      email: shop.email,
      shopName: shop.name,
      userId: data?.user?.id
    };

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, '❌ Error');
    return { success: false, message: error.message };
  }
};

export const params = {
  shopDomain: { type: "string" }
};

export const options = {
  actionType: "custom"
};
