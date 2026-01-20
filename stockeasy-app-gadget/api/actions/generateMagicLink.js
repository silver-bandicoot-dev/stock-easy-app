import { getSupabaseClient } from "../lib/supabase";

/**
 * Generates a Magic Link URL for a Shopify shop owner to login to Stockeasy.
 * Uses Supabase Admin API to generate the link directly without sending email.
 * If the user doesn't exist, creates them first.
 */
export const run = async ({ params, logger }) => {
  const { email, shopName, shopifyShopId } = params;
  
  logger.info({ email, shopName, shopifyShopId }, '🔗 Generating Magic Link');
  
  if (!email) {
    return { success: false, message: 'Email is required' };
  }

  try {
    const supabase = getSupabaseClient();
    
    // Try to generate Magic Link directly first
    // This will fail if user doesn't exist
    let { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: 'https://stockeasy.app/app'
      }
    });

    // If user doesn't exist, create them first then retry
    if (error && (error.message.includes('User not found') || error.message.includes('Unable to validate'))) {
      logger.info({ email, originalError: error.message }, '👤 User does not exist, creating...');
      
      // Create user first
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          source: 'shopify_magic_link',
          shop_name: shopName || null,
          shopify_shop_id: shopifyShopId || null
        }
      });
      
      if (createError && !createError.message.includes('already been registered')) {
        logger.error({ error: createError.message }, '❌ Failed to create user');
        return { success: false, message: `User creation failed: ${createError.message}` };
      }
      
      if (newUser?.user) {
        logger.info({ userId: newUser.user.id }, '✅ User created');
      }
      
      // Retry generating Magic Link
      const retryResult = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: 'https://stockeasy.app/app'
        }
      });
      
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      logger.error({ error: error.message, code: error.code }, '❌ Failed to generate Magic Link');
      return { success: false, message: error.message };
    }

    if (!data?.properties?.action_link) {
      logger.error({ data: JSON.stringify(data) }, '❌ No action_link in response');
      return { success: false, message: 'Failed to generate Magic Link - no URL returned' };
    }

    const magicLinkUrl = data.properties.action_link;
    logger.info({ email }, '✅ Magic Link generated successfully');

    return {
      success: true,
      magicLinkUrl: magicLinkUrl,
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
