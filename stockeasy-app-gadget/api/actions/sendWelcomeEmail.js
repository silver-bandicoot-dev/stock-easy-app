import { getSupabaseClient } from "../lib/supabase";

/**
 * Sends a welcome email with Magic Link to a new Shopify merchant after app installation.
 * Magic Link = one click to login, no password required initially.
 */
export const run = async ({ params, logger }) => {
  const { email, shopName, ownerName } = params;
  
  logger.info({ email, shopName }, '📧 Sending welcome Magic Link email');
  
  if (!email) {
    return { success: false, message: 'Email is required' };
  }

  try {
    const supabase = getSupabaseClient();
    
    // Send Magic Link email - user clicks and is logged in automatically
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: 'https://stock-easy-app.vercel.app/?welcome=true',
        shouldCreateUser: false // User already exists from installation
      }
    });

    if (error) {
      logger.error({ error: error.message }, '❌ Failed to send Magic Link');
      return { success: false, message: error.message };
    }

    logger.info({ email, shopName }, '✅ Magic Link email sent successfully');

    return {
      success: true,
      message: 'Magic Link email sent',
      email: email
    };

  } catch (error) {
    logger.error({ error: error.message }, '❌ Error sending Magic Link email');
    return { success: false, message: error.message };
  }
};

export const params = {
  email: { type: "string" },
  shopName: { type: "string", required: false },
  ownerName: { type: "string", required: false }
};

export const options = {
  actionType: "global"
};

