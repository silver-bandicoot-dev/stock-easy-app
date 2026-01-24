import { getSupabaseClient } from "../lib/supabase";

/**
 * Sends an invitation email to a new Shopify merchant after app installation.
 * Uses custom RPC generate_recovery_link + Resend for reliable email delivery.
 * The user was already created by create_auth_user_for_shopify RPC.
 */
export const run = async ({ params, logger }) => {
  const { email, shopName, shopifyShopId, ownerName } = params;
  
  logger.info({ email, shopName, shopifyShopId }, '📧 Sending invitation email to Shopify merchant');
  
  if (!email) {
    return { success: false, message: 'Email is required' };
  }

  try {
    const supabase = getSupabaseClient();
    
    // Generate recovery link using custom RPC (bypasses Auth API issues)
    const { data, error } = await supabase.rpc('generate_recovery_link', {
      p_email: email
    });

    if (error) {
      logger.error({ error: error.message }, '❌ Failed to generate recovery link');
      return { success: false, message: error.message };
    }

    if (!data || data.length === 0) {
      logger.error({}, '❌ No data returned from generate_recovery_link');
      return { success: false, message: 'Failed to generate recovery link' };
    }

    const result = data[0];
    const recoveryLink = result.recovery_link;
    const userId = result.user_id;

    logger.info({ email, userId }, '✅ Recovery link generated');

    // Send welcome email with Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      logger.warn({}, '⚠️ RESEND_API_KEY not configured - email not sent');
      return {
        success: true,
        message: 'Recovery link generated (email not sent - RESEND_API_KEY missing)',
        email: email,
        userId: userId,
        recoveryLink: recoveryLink
      };
    }

    // Send email via Resend API
    const displayName = ownerName || shopName || 'there';
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Stockeasy <hello@stockeasy.app>',
        to: [email],
        subject: '🎉 Bienvenue sur Stockeasy - Configurez votre mot de passe',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    
    <!-- Header with Logo -->
    <div style="background: #000; padding: 32px; text-align: center;">
      <img src="https://stockeasy.app/logos/stockeasy-cube.svg" alt="Stockeasy" width="48" height="48" style="display: inline-block; vertical-align: middle; margin-right: 12px;">
      <span style="color: white; font-size: 28px; font-weight: 600; vertical-align: middle;">stockeasy</span>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 32px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: #1a1a1a;">
        Bienvenue ${displayName} ! 👋
      </h2>
      
      <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Votre boutique <strong>${shopName || 'Shopify'}</strong> est maintenant connectée à Stockeasy. 
        Pour accéder à votre tableau de bord, configurez d'abord votre mot de passe.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${recoveryLink}" 
           style="display: inline-block; background: #000; color: white; padding: 14px 32px; 
                  border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Configurer mon mot de passe →
        </a>
      </div>
      
      <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
        Ce lien expire dans 24 heures. Si vous n'avez pas demandé cet email, ignorez-le.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #fafafa; padding: 24px 32px; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
        Stockeasy - Gestion de stock intelligente<br>
        <a href="https://stockeasy.app" style="color: #666;">stockeasy.app</a>
      </p>
    </div>
    
  </div>
</body>
</html>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json().catch(() => ({}));
      logger.error({ status: emailResponse.status, error: errorData }, '❌ Failed to send email via Resend');
      return {
        success: true,
        message: 'Recovery link generated but email failed to send',
        email: email,
        userId: userId,
        recoveryLink: recoveryLink,
        emailError: errorData
      };
    }

    const emailResult = await emailResponse.json();
    logger.info({ email, emailId: emailResult.id }, '✅ Invitation email sent via Resend');

    return {
      success: true,
      message: 'Invitation email sent successfully',
      email: email,
      userId: userId,
      emailId: emailResult.id
    };

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, '❌ Error sending invitation');
    return { success: false, message: error.message };
  }
};

export const params = {
  email: { type: "string" },
  shopName: { type: "string", required: false },
  shopifyShopId: { type: "string", required: false },
  ownerName: { type: "string", required: false }
};

export const options = {
  actionType: "custom"
};
