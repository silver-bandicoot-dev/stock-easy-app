/**
 * Service de gestion des emails digest
 * Permet l'envoi de résumés de notifications par email
 * 
 * NOTE: Ce service prépare les données pour l'envoi d'emails.
 * L'envoi réel doit être effectué via:
 * - Supabase Edge Functions (recommandé)
 * - Un service d'email externe (SendGrid, Resend, etc.)
 * - Un job CRON côté serveur
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Types de fréquence d'email
 */
export const EMAIL_FREQUENCIES = {
  INSTANT: 'instant',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  NEVER: 'never'
};

/**
 * Récupère les notifications en attente d'envoi par email pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} emailType - Type d'email ('instant' ou 'digest')
 */
export async function getPendingEmailNotifications(userId, emailType = 'digest') {
  try {
    const { data, error } = await supabase
      .from('notification_email_queue')
      .select(`
        id,
        notification_id,
        email_type,
        status,
        scheduled_at,
        notifications (
          id,
          type,
          title,
          message,
          link,
          created_at,
          metadata
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .eq('email_type', emailType)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur getPendingEmailNotifications:', error);
    return { data: [], error };
  }
}

/**
 * Marque des emails comme envoyés
 * @param {string[]} queueIds - IDs des entrées dans la queue
 */
export async function markEmailsAsSent(queueIds) {
  try {
    const { error } = await supabase
      .from('notification_email_queue')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .in('id', queueIds);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur markEmailsAsSent:', error);
    return { success: false, error };
  }
}

/**
 * Marque un email comme échoué
 * @param {string} queueId - ID de l'entrée dans la queue
 * @param {string} errorMessage - Message d'erreur
 */
export async function markEmailAsFailed(queueId, errorMessage) {
  try {
    const { error } = await supabase
      .from('notification_email_queue')
      .update({ 
        status: 'failed',
        error_message: errorMessage
      })
      .eq('id', queueId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur markEmailAsFailed:', error);
    return { success: false, error };
  }
}

/**
 * Récupère les utilisateurs qui doivent recevoir un digest maintenant
 * @param {string} frequency - 'daily' ou 'weekly'
 */
export async function getUsersForDigest(frequency) {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    let query = supabase
      .from('notification_preferences')
      .select(`
        user_id,
        email_enabled,
        email_frequency,
        email_digest_hour,
        email_digest_day,
        user_profiles!inner (
          email,
          first_name,
          last_name
        )
      `)
      .eq('email_enabled', true)
      .eq('email_frequency', frequency)
      .eq('email_digest_hour', currentHour);

    // Pour les digests hebdomadaires, filtrer aussi par jour
    if (frequency === 'weekly') {
      query = query.eq('email_digest_day', currentDay);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { 
      data: (data || []).map(d => ({
        userId: d.user_id,
        email: d.user_profiles?.email,
        firstName: d.user_profiles?.first_name,
        lastName: d.user_profiles?.last_name,
        preferences: {
          frequency: d.email_frequency,
          digestHour: d.email_digest_hour,
          digestDay: d.email_digest_day
        }
      })),
      error: null 
    };
  } catch (error) {
    console.error('Erreur getUsersForDigest:', error);
    return { data: [], error };
  }
}

/**
 * Génère le contenu HTML d'un email digest
 * @param {Object} user - Informations utilisateur
 * @param {Array} notifications - Liste des notifications
 * @param {string} frequency - 'daily' ou 'weekly'
 */
export function generateDigestEmailContent(user, notifications, frequency) {
  const userName = user.firstName || user.email?.split('@')[0] || 'Utilisateur';
  const periodLabel = frequency === 'daily' ? 'aujourd\'hui' : 'cette semaine';
  
  // Grouper par type
  const byType = notifications.reduce((acc, n) => {
    const type = n.notifications?.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(n.notifications);
    return acc;
  }, {});

  const typeLabels = {
    mention: { label: 'Mentions', icon: '💬', color: '#3B82F6' },
    ml_alert: { label: 'Alertes ML', icon: '🚨', color: '#EF4444' },
    ml_recommendation: { label: 'Recommandations ML', icon: '🤖', color: '#8B5CF6' },
    ml_weekly: { label: 'Rapports ML', icon: '🧠', color: '#6366F1' },
    stock_alert: { label: 'Alertes Stock', icon: '📦', color: '#F59E0B' },
    order_update: { label: 'Commandes', icon: '🚚', color: '#10B981' }
  };

  // Construction du HTML
  let sectionsHtml = '';
  
  for (const [type, items] of Object.entries(byType)) {
    const typeInfo = typeLabels[type] || { label: 'Notifications', icon: '🔔', color: '#6B7280' };
    
    let itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB;">
          <div style="font-weight: 600; color: #1F2937; margin-bottom: 4px;">
            ${item?.title || 'Notification'}
          </div>
          <div style="color: #6B7280; font-size: 14px;">
            ${item?.message || ''}
          </div>
          ${item?.link ? `
            <a href="${process.env.APP_URL || 'https://stockeasy.app'}${item.link}" 
               style="display: inline-block; margin-top: 8px; color: ${typeInfo.color}; text-decoration: none; font-size: 14px;">
              Voir les détails →
            </a>
          ` : ''}
        </td>
      </tr>
    `).join('');

    sectionsHtml += `
      <div style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid ${typeInfo.color};">
          <span style="font-size: 20px; margin-right: 8px;">${typeInfo.icon}</span>
          <span style="font-weight: 600; color: #1F2937; font-size: 16px;">
            ${typeInfo.label} (${items.length})
          </span>
        </div>
        <table style="width: 100%; border-collapse: collapse; background: #F9FAFB; border-radius: 8px; overflow: hidden;">
          ${itemsHtml}
        </table>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Résumé StockEasy</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F3F4F6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1F2937 0%, #374151 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
            📊 StockEasy
          </h1>
          <p style="margin: 8px 0 0; color: #D1D5DB; font-size: 14px;">
            Votre résumé ${frequency === 'daily' ? 'quotidien' : 'hebdomadaire'}
          </p>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px;">
            Bonjour ${userName},
          </p>
          <p style="margin: 0 0 24px; color: #4B5563; font-size: 15px;">
            Voici ce qui s'est passé ${periodLabel} sur StockEasy :
          </p>
          
          ${notifications.length === 0 ? `
            <div style="text-align: center; padding: 32px; background: #F9FAFB; border-radius: 8px;">
              <p style="color: #6B7280; margin: 0;">
                ✨ Aucune nouvelle notification ${periodLabel}.
              </p>
            </div>
          ` : sectionsHtml}
          
          <!-- CTA -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.APP_URL || 'https://stockeasy.app'}" 
               style="display: inline-block; background: #1F2937; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Ouvrir StockEasy
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 24px; color: #9CA3AF; font-size: 12px;">
          <p style="margin: 0 0 8px;">
            Vous recevez cet email car vous avez activé les notifications par email.
          </p>
          <p style="margin: 0;">
            <a href="${process.env.APP_URL || 'https://stockeasy.app'}/notifications?settings=true" 
               style="color: #6B7280; text-decoration: underline;">
              Modifier mes préférences
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
StockEasy - Résumé ${frequency === 'daily' ? 'quotidien' : 'hebdomadaire'}

Bonjour ${userName},

Voici ce qui s'est passé ${periodLabel} :

${notifications.length === 0 
  ? 'Aucune nouvelle notification.'
  : notifications.map(n => `- ${n.notifications?.title}: ${n.notifications?.message}`).join('\n')
}

Ouvrez StockEasy pour plus de détails : ${process.env.APP_URL || 'https://stockeasy.app'}
  `.trim();

  return { html, text };
}

/**
 * Prépare et retourne les données pour l'envoi d'un digest
 * Cette fonction est prête à être appelée par une Edge Function ou un job CRON
 * @param {string} frequency - 'daily' ou 'weekly'
 */
export async function prepareDigestBatch(frequency) {
  try {
    // 1. Récupérer les utilisateurs éligibles
    const { data: users, error: usersError } = await getUsersForDigest(frequency);
    
    if (usersError) throw usersError;
    if (users.length === 0) {
      return { success: true, count: 0, emails: [] };
    }

    const emails = [];

    // 2. Pour chaque utilisateur, préparer l'email
    for (const user of users) {
      const { data: notifications } = await getPendingEmailNotifications(user.userId, 'digest');
      
      if (notifications.length === 0) continue;

      const { html, text } = generateDigestEmailContent(user, notifications, frequency);

      emails.push({
        to: user.email,
        subject: `📊 StockEasy - Résumé ${frequency === 'daily' ? 'quotidien' : 'hebdomadaire'}`,
        html,
        text,
        userId: user.userId,
        queueIds: notifications.map(n => n.id)
      });
    }

    return { success: true, count: emails.length, emails };
  } catch (error) {
    console.error('Erreur prepareDigestBatch:', error);
    return { success: false, error, count: 0, emails: [] };
  }
}

/**
 * Exemple d'intégration avec une Edge Function Supabase
 * Cette fonction doit être appelée depuis une Edge Function
 */
export async function sendDigestEmails(frequency) {
  const { emails, error } = await prepareDigestBatch(frequency);
  
  if (error) {
    console.error('Erreur préparation digest:', error);
    return { success: false, error, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      // ICI: Appeler votre service d'email (Resend, SendGrid, etc.)
      // Exemple avec fetch vers une API:
      // await fetch('https://api.resend.com/emails', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${RESEND_API_KEY}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     from: 'StockEasy <notifications@stockeasy.app>',
      //     to: email.to,
      //     subject: email.subject,
      //     html: email.html,
      //     text: email.text
      //   })
      // });

      // Marquer comme envoyé
      await markEmailsAsSent(email.queueIds);
      sent++;
    } catch (err) {
      console.error(`Erreur envoi email à ${email.to}:`, err);
      // Marquer comme échoué pour chaque notification
      for (const queueId of email.queueIds) {
        await markEmailAsFailed(queueId, err.message);
      }
      failed++;
    }
  }

  console.log(`📧 Digest ${frequency}: ${sent} envoyé(s), ${failed} échoué(s)`);
  return { success: true, sent, failed };
}

