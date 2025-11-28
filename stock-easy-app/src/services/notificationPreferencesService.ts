/**
 * Service de gestion des préférences de notifications
 * Permet aux utilisateurs de configurer leurs notifications
 */

import { supabase } from '../lib/supabaseClient';

export interface NotificationPreferences {
  id: string;
  userId: string;
  
  // Préférences in-app par type
  mentionEnabled: boolean;
  mlAlertEnabled: boolean;
  mlWeeklyEnabled: boolean;
  mlRecommendationEnabled: boolean;
  stockAlertEnabled: boolean;
  orderUpdateEnabled: boolean;
  
  // Préférences email
  emailEnabled: boolean;
  emailFrequency: 'instant' | 'daily' | 'weekly' | 'never';
  emailMentionEnabled: boolean;
  emailMlAlertEnabled: boolean;
  emailDigestHour: number;
  emailDigestDay: number;
  
  // Groupement
  groupSimilarEnabled: boolean;
  groupTimeWindowMinutes: number;
  
  createdAt: string;
  updatedAt: string;
}

// Mapping des colonnes DB vers l'interface TypeScript
function mapDbToPreferences(data: any): NotificationPreferences {
  return {
    id: data.id,
    userId: data.user_id,
    mentionEnabled: data.mention_enabled,
    mlAlertEnabled: data.ml_alert_enabled,
    mlWeeklyEnabled: data.ml_weekly_enabled,
    mlRecommendationEnabled: data.ml_recommendation_enabled,
    stockAlertEnabled: data.stock_alert_enabled,
    orderUpdateEnabled: data.order_update_enabled,
    emailEnabled: data.email_enabled,
    emailFrequency: data.email_frequency,
    emailMentionEnabled: data.email_mention_enabled,
    emailMlAlertEnabled: data.email_ml_alert_enabled,
    emailDigestHour: data.email_digest_hour,
    emailDigestDay: data.email_digest_day,
    groupSimilarEnabled: data.group_similar_enabled,
    groupTimeWindowMinutes: data.group_time_window_minutes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

// Mapping inverse pour les mises à jour
function mapPreferencesToDb(prefs: Partial<NotificationPreferences>): Record<string, any> {
  const mapping: Record<string, string> = {
    mentionEnabled: 'mention_enabled',
    mlAlertEnabled: 'ml_alert_enabled',
    mlWeeklyEnabled: 'ml_weekly_enabled',
    mlRecommendationEnabled: 'ml_recommendation_enabled',
    stockAlertEnabled: 'stock_alert_enabled',
    orderUpdateEnabled: 'order_update_enabled',
    emailEnabled: 'email_enabled',
    emailFrequency: 'email_frequency',
    emailMentionEnabled: 'email_mention_enabled',
    emailMlAlertEnabled: 'email_ml_alert_enabled',
    emailDigestHour: 'email_digest_hour',
    emailDigestDay: 'email_digest_day',
    groupSimilarEnabled: 'group_similar_enabled',
    groupTimeWindowMinutes: 'group_time_window_minutes'
  };

  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(prefs)) {
    const dbKey = mapping[key];
    if (dbKey && value !== undefined) {
      result[dbKey] = value;
    }
  }
  
  return result;
}

/**
 * Récupère les préférences de notification de l'utilisateur
 * Crée les préférences par défaut si elles n'existent pas
 */
export async function getNotificationPreferences(): Promise<{ data: NotificationPreferences | null; error: any }> {
  try {
    const { data, error } = await supabase.rpc('get_or_create_notification_preferences');

    if (error) throw error;

    return { data: data ? mapDbToPreferences(data) : null, error: null };
  } catch (error) {
    console.error('Erreur getNotificationPreferences:', error);
    return { data: null, error };
  }
}

/**
 * Met à jour les préférences de notification
 */
export async function updateNotificationPreferences(
  updates: Partial<NotificationPreferences>
): Promise<{ success: boolean; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const dbUpdates = mapPreferencesToDb(updates);
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('notification_preferences')
      .update(dbUpdates)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur updateNotificationPreferences:', error);
    return { success: false, error };
  }
}

/**
 * Types de notifications disponibles avec leurs labels
 */
export const NOTIFICATION_TYPES = {
  mention: {
    key: 'mention',
    label: 'Mentions (@user)',
    description: 'Recevoir une notification quand quelqu\'un vous mentionne',
    icon: '💬',
    prefKey: 'mentionEnabled' as const,
    emailPrefKey: 'emailMentionEnabled' as const
  },
  ml_alert: {
    key: 'ml_alert',
    label: 'Alertes ML critiques',
    description: 'Alertes de rupture de stock prévues par l\'IA',
    icon: '🚨',
    prefKey: 'mlAlertEnabled' as const,
    emailPrefKey: 'emailMlAlertEnabled' as const
  },
  ml_weekly: {
    key: 'ml_weekly',
    label: 'Rapport ML hebdomadaire',
    description: 'Résumé des analyses ML chaque lundi',
    icon: '🧠',
    prefKey: 'mlWeeklyEnabled' as const,
    emailPrefKey: null
  },
  ml_recommendation: {
    key: 'ml_recommendation',
    label: 'Recommandations ML',
    description: 'Suggestions de commandes basées sur l\'IA',
    icon: '🤖',
    prefKey: 'mlRecommendationEnabled' as const,
    emailPrefKey: null
  },
  stock_alert: {
    key: 'stock_alert',
    label: 'Alertes de stock',
    description: 'Notifications de rupture ou stock bas',
    icon: '📦',
    prefKey: 'stockAlertEnabled' as const,
    emailPrefKey: null
  },
  order_update: {
    key: 'order_update',
    label: 'Mises à jour commandes',
    description: 'Changements de statut des commandes',
    icon: '🚚',
    prefKey: 'orderUpdateEnabled' as const,
    emailPrefKey: null
  }
} as const;

/**
 * Options de fréquence d'email
 */
export const EMAIL_FREQUENCY_OPTIONS = [
  { value: 'instant', label: 'Instantané', description: 'Recevoir un email pour chaque notification' },
  { value: 'daily', label: 'Quotidien', description: 'Un résumé chaque jour à l\'heure choisie' },
  { value: 'weekly', label: 'Hebdomadaire', description: 'Un résumé une fois par semaine' },
  { value: 'never', label: 'Jamais', description: 'Ne pas recevoir d\'emails' }
] as const;

/**
 * Jours de la semaine pour le digest
 */
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' }
] as const;

/**
 * Vérifie si un type de notification est activé pour l'utilisateur
 */
export async function isNotificationTypeEnabled(type: string): Promise<boolean> {
  try {
    const { data: prefs } = await getNotificationPreferences();
    
    if (!prefs) return true; // Par défaut, tout est activé
    
    const typeConfig = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES];
    if (!typeConfig) return true;
    
    return prefs[typeConfig.prefKey] ?? true;
  } catch (error) {
    console.error('Erreur isNotificationTypeEnabled:', error);
    return true; // En cas d'erreur, on autorise
  }
}

/**
 * Récupère les préférences de groupement
 */
export async function getGroupingPreferences(): Promise<{ enabled: boolean; timeWindowMinutes: number }> {
  try {
    const { data: prefs } = await getNotificationPreferences();
    
    return {
      enabled: prefs?.groupSimilarEnabled ?? true,
      timeWindowMinutes: prefs?.groupTimeWindowMinutes ?? 60
    };
  } catch (error) {
    console.error('Erreur getGroupingPreferences:', error);
    return { enabled: true, timeWindowMinutes: 60 };
  }
}

