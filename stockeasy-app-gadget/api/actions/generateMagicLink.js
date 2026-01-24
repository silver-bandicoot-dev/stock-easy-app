import { getSupabaseClient } from "../lib/supabase";

/**
 * Generates a Magic Link URL for a Shopify shop owner to login to Stockeasy.
 * 
 * Uses custom SQL RPCs to bypass Supabase Auth Admin API issues.
 * 
 * BEHAVIOR:
 * - If user has password_configured: true → Generate Magic Link for instant login
 * - If user doesn't have password configured → Generate recovery link to setup password
 */
export const run = async ({ params, logger, api }) => {
  const { email, shopName, shopifyShopId } = params;
  
  logger.info({ email, shopName, shopifyShopId }, '🔗 Processing login request');
  
  if (!email) {
    return { success: false, message: 'Email is required' };
  }

  try {
    const supabase = getSupabaseClient();
    
    // Check if user exists and has password configured (via RPC)
    const { data: userStatus, error: statusError } = await supabase.rpc('get_user_auth_status', {
      p_email: email
    });
    
    if (statusError) {
      logger.error({ error: statusError.message }, '❌ Failed to check user status');
      return { success: false, message: statusError.message };
    }
    
    const existingUser = userStatus && userStatus.length > 0 ? userStatus[0] : null;
    const hasPasswordConfigured = existingUser?.has_password_configured === true;
    
    logger.info({ 
      email, 
      userExists: !!existingUser, 
      hasPasswordConfigured 
    }, '👤 User status check');

    // CASE 1: User has password configured → Generate Magic Link
    if (existingUser && hasPasswordConfigured) {
      logger.info({ email }, '🔗 User has password, generating Magic Link...');
      
      const { data: magicData, error: magicError } = await supabase.rpc('generate_magic_link', {
        p_email: email
      });

      if (magicError) {
        logger.error({ error: magicError.message }, '❌ Failed to generate Magic Link');
        return { success: false, message: magicError.message };
      }

      if (!magicData || magicData.length === 0 || !magicData[0].magic_link) {
        logger.error({}, '❌ No magic_link in response');
        return { success: false, message: 'Failed to generate Magic Link' };
      }

      logger.info({ email }, '✅ Magic Link generated');
      return {
        success: true,
        magicLinkUrl: magicData[0].magic_link,
        email: email,
        action: 'magic_link'
      };
    }
    
    // CASE 2: User doesn't exist → They need to install the app first
    if (!existingUser) {
      logger.warn({ email }, '⚠️ User not found - app may not be installed');
      return {
        success: false,
        message: 'Utilisateur non trouvé. Veuillez d\'abord installer l\'application Shopify.',
        action: 'user_not_found'
      };
    }
    
    // CASE 3: User exists but hasn't configured password → Generate recovery link
    logger.info({ email }, '📧 User needs to configure password, generating recovery link...');
    
    const { data: recoveryData, error: recoveryError } = await supabase.rpc('generate_recovery_link', {
      p_email: email
    });

    if (recoveryError) {
      logger.error({ error: recoveryError.message }, '❌ Failed to generate recovery link');
      return { success: false, message: recoveryError.message };
    }

    if (!recoveryData || recoveryData.length === 0 || !recoveryData[0].recovery_link) {
      logger.error({}, '❌ No recovery_link in response');
      return { success: false, message: 'Failed to generate recovery link' };
    }

    logger.info({ email }, '✅ Recovery link generated');
    
    // Return the recovery link directly so user can configure password
    return {
      success: true,
      magicLinkUrl: recoveryData[0].recovery_link,
      email: email,
      action: 'setup_password',
      message: 'Vous allez être redirigé pour configurer votre mot de passe.'
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
