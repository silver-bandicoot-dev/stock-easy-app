import { getSupabaseClient } from "../lib/supabase";

/**
 * Generates a Magic Link URL for a Shopify shop owner to login to Stockeasy.
 * Uses Supabase Admin API to generate the link directly without sending email.
 */
export const run = async ({ params, logger }) => {
  const { email, shopName, shopifyShopId } = params;
  
  logger.info({ email, shopName, shopifyShopId }, '🔗 Generating Magic Link');
  
  if (!email) {
    return { success: false, message: 'Email is required' };
  }

  try {
    const supabase = getSupabaseClient();
    
    // Use 'signup' type which creates user if doesn't exist
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: 'https://stockeasy.app/app',
        data: {
          source: 'shopify_magic_link',
          shop_name: shopName || null,
          shopify_shop_id: shopifyShopId || null
        }
      }
    });

    // If user already exists, try magiclink type instead
    if (error && error.message.includes('already been registered')) {
      logger.info({ email }, '👤 User exists, generating magic link...');
      
      const { data: mlData, error: mlError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: 'https://stockeasy.app/app'
        }
      });
      
      if (mlError) {
        logger.error({ error: mlError.message }, '❌ Failed to generate Magic Link');
        return { success: false, message: mlError.message };
      }
      
      if (!mlData?.properties?.action_link) {
        logger.error({ data: JSON.stringify(mlData) }, '❌ No action_link in response');
        return { success: false, message: 'Failed to generate Magic Link' };
      }
      
      logger.info({ email }, '✅ Magic Link generated for existing user');
      return {
        success: true,
        magicLinkUrl: mlData.properties.action_link,
        email: email
      };
    }

    if (error) {
      logger.error({ error: error.message, code: error.code }, '❌ Failed to generate link');
      return { success: false, message: error.message };
    }

    if (!data?.properties?.action_link) {
      logger.error({ data: JSON.stringify(data) }, '❌ No action_link in response');
      return { success: false, message: 'Failed to generate link - no URL returned' };
    }

    logger.info({ email }, '✅ Signup link generated for new user');
    return {
      success: true,
      magicLinkUrl: data.properties.action_link,
      email: email
    };

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, '❌ Error generating Magic Link');
    return { success: false, message: error.message };
  }
};

export const params = {
  email: { type: "string" },
  shopName: { type: "string", required: false },
  shopifyShopId: { type: "string", required: false }
};

export const options = {
  actionType: "custom"
};
