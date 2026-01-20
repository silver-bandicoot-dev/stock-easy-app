import { getSupabaseClient } from "../lib/supabase";

/**
 * Generates a Magic Link URL for a Shopify shop owner to login to Stockeasy.
 * Creates user if doesn't exist, then generates magic link.
 */
export const run = async ({ params, logger }) => {
  const { email, shopName, shopifyShopId } = params;
  
  logger.info({ email, shopName, shopifyShopId }, '🔗 Generating Magic Link');
  
  if (!email) {
    return { success: false, message: 'Email is required' };
  }

  try {
    const supabase = getSupabaseClient();
    
    // First, try to generate magic link directly
    let { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: 'https://stockeasy.app/app'
      }
    });

    // If user doesn't exist, create them first
    if (error) {
      logger.info({ email, error: error.message }, '👤 Creating user first...');
      
      // Generate a random password (user will use magic link, not password)
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      
      // Create user with admin API
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          source: 'shopify_magic_link',
          shop_name: shopName || null,
          shopify_shop_id: shopifyShopId || null
        }
      });
      
      if (createError) {
        // If user already exists, that's fine - continue to generate magic link
        if (!createError.message.includes('already been registered')) {
          logger.error({ error: createError.message }, '❌ Failed to create user');
          return { success: false, message: createError.message };
        }
        logger.info({ email }, '👤 User already exists, continuing...');
      } else {
        logger.info({ userId: newUser?.user?.id }, '✅ User created');
      }
      
      // Now try magic link again
      const retry = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: 'https://stockeasy.app/app'
        }
      });
      
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      logger.error({ error: error.message }, '❌ Failed to generate Magic Link');
      return { success: false, message: error.message };
    }

    if (!data?.properties?.action_link) {
      logger.error({ data: JSON.stringify(data) }, '❌ No action_link in response');
      return { success: false, message: 'Failed to generate Magic Link' };
    }

    logger.info({ email }, '✅ Magic Link generated');
    return {
      success: true,
      magicLinkUrl: data.properties.action_link,
      email: email
    };

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, '❌ Error');
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
