import { getSupabaseClient } from "../lib/supabase";

/**
 * Generates a Magic Link URL for a Shopify shop owner to login to Stockeasy.
 * Uses Supabase Admin API to generate the link directly without sending email.
 */
export const run = async ({ params, logger }) => {
  const { email } = params;
  
  logger.info({ email }, '🔗 Generating Magic Link');
  
  if (!email) {
    return { success: false, message: 'Email is required' };
  }

  try {
    const supabase = getSupabaseClient();
    
    // Use Admin API to generate Magic Link URL directly
    // This requires SERVICE_ROLE_KEY which we have in getSupabaseClient
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
      logger.error('❌ No action_link in response');
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
    logger.error({ error: error.message }, '❌ Error generating Magic Link');
    return { success: false, message: error.message };
  }
};

export const params = {
  email: { type: "string" }
};

export const options = {
  actionType: "custom"
};
