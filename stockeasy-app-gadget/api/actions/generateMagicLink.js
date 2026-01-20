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
    
    // First check if user exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      logger.error({ error: listError.message }, '❌ Failed to check existing users');
    }
    
    const userExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!userExists) {
      logger.info({ email }, '👤 User does not exist, creating...');
      
      // Create user first with a random password (they'll use magic link)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          source: 'shopify_magic_link',
          shop_name: shopName || null,
          shopify_shop_id: shopifyShopId || null
        }
      });
      
      if (createError) {
        logger.error({ error: createError.message }, '❌ Failed to create user');
        return { success: false, message: `User creation failed: ${createError.message}` };
      }
      
      logger.info({ userId: newUser?.user?.id }, '✅ User created');
    }
    
    // Now generate Magic Link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: 'https://stockeasy.app/app'
      }
    });

    if (error) {
      logger.error({ error: error.message }, '❌ Failed to generate Magic Link');
      return { success: false, message: error.message };
    }

    if (!data?.properties?.action_link) {
      logger.error({ data }, '❌ No action_link in response');
      return { success: false, message: 'Failed to generate Magic Link - no URL returned' };
    }

    const magicLinkUrl = data.properties.action_link;
    logger.info({ email, magicLinkUrl: magicLinkUrl.substring(0, 50) + '...' }, '✅ Magic Link generated');

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
