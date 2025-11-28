import { supabase } from '../lib/supabaseClient';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export interface GroupedNotification {
  groupId: string;
  type: string;
  count: number;
  latestTitle: string;
  latestMessage: string;
  latestLink?: string;
  latestCreatedAt: string;
  isRead: boolean;
  notificationIds: string[];
  metadata?: any;
}

// ============================================
// Utilitaire de mapping réutilisable
// ============================================

/**
 * Mappe une notification de la DB vers l'interface TypeScript
 */
export function mapNotification(notif: any): Notification {
  return {
    id: notif.id,
    userId: notif.user_id,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    link: notif.link,
    read: notif.read,
    createdAt: notif.created_at,
    metadata: notif.metadata
  };
}

/**
 * Mappe une notification groupée de la DB
 */
export function mapGroupedNotification(group: any): GroupedNotification {
  return {
    groupId: group.group_id,
    type: group.notification_type,
    count: group.notification_count,
    latestTitle: group.latest_title,
    latestMessage: group.latest_message,
    latestLink: group.latest_link,
    latestCreatedAt: group.latest_created_at,
    isRead: group.is_read,
    notificationIds: group.notification_ids || [],
    metadata: group.metadata
  };
}

// ============================================
// Fonctions de récupération
// ============================================

/**
 * Récupère les notifications de l'utilisateur
 */
export async function getUserNotifications(limit: number = 50) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: (data || []).map(mapNotification), error: null };
  } catch (error) {
    console.error('Erreur getUserNotifications:', error);
    return { data: [], error };
  }
}

/**
 * Récupère les notifications groupées de l'utilisateur
 */
export async function getGroupedNotifications(limit: number = 50) {
  try {
    const { data, error } = await supabase.rpc('get_grouped_notifications', {
      p_limit: limit
    });

    if (error) throw error;

    return { 
      data: (data || []).map(mapGroupedNotification), 
      error: null 
    };
  } catch (error) {
    console.error('Erreur getGroupedNotifications:', error);
    // Fallback vers les notifications non groupées
    const { data: fallbackData } = await getUserNotifications(limit);
    const grouped: GroupedNotification[] = fallbackData.map(n => ({
      groupId: n.id,
      type: n.type,
      count: 1,
      latestTitle: n.title,
      latestMessage: n.message,
      latestLink: n.link,
      latestCreatedAt: n.createdAt,
      isRead: n.read,
      notificationIds: [n.id],
      metadata: n.metadata
    }));
    return { data: grouped, error: null };
  }
}

/**
 * Récupère uniquement les notifications non lues
 */
export async function getUnreadNotifications() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: (data || []).map(mapNotification), error: null };
  } catch (error) {
    console.error('Erreur getUnreadNotifications:', error);
    return { data: [], error };
  }
}

/**
 * Compte les notifications non lues
 */
export async function getUnreadCount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Erreur getUnreadCount:', error);
    return { count: 0, error };
  }
}

// ============================================
// Fonctions de modification
// ============================================

/**
 * Marque une notification comme lue
 */
export async function markAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur markAsRead:', error);
    return { success: false, error };
  }
}

/**
 * Marque plusieurs notifications comme lues (pour les groupes)
 */
export async function markMultipleAsRead(notificationIds: string[]) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', notificationIds);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur markMultipleAsRead:', error);
    return { success: false, error };
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllAsRead() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur markAllAsRead:', error);
    return { success: false, error };
  }
}

/**
 * Supprime une notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur deleteNotification:', error);
    return { success: false, error };
  }
}

/**
 * Supprime plusieurs notifications (pour les groupes)
 */
export async function deleteMultipleNotifications(notificationIds: string[]) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur deleteMultipleNotifications:', error);
    return { success: false, error };
  }
}

/**
 * Supprime toutes les notifications lues
 */
export async function deleteReadNotifications() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('read', true);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur deleteReadNotifications:', error);
    return { success: false, error };
  }
}

// ============================================
// Temps réel
// ============================================

/**
 * S'abonne aux nouvelles notifications en temps réel
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  const channel = supabase
    .channel('notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNotification(mapNotification(payload.new));
      }
    )
    .subscribe();

  return channel;
}

// ============================================
// Création de notifications (v2 avec déduplication)
// ============================================

export interface CreateNotificationOptions {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
  dedupKey?: string;
  cooldownHours?: number;
}

/**
 * Crée une notification avec vérification des préférences et déduplication
 */
export async function createNotificationV2(options: CreateNotificationOptions) {
  try {
    const { data, error } = await supabase.rpc('create_notification_v2', {
      p_user_id: options.userId,
      p_type: options.type,
      p_title: options.title,
      p_message: options.message,
      p_link: options.link || null,
      p_metadata: options.metadata || {},
      p_dedup_key: options.dedupKey || null,
      p_cooldown_hours: options.cooldownHours || 24
    });

    if (error) throw error;

    return { notificationId: data, success: data !== null, error: null };
  } catch (error) {
    console.error('Erreur createNotificationV2:', error);
    return { notificationId: null, success: false, error };
  }
}

/**
 * Crée des notifications pour plusieurs utilisateurs avec déduplication
 */
export async function createNotificationsForUsersV2(
  userIds: string[],
  type: string,
  title: string,
  message: string,
  link?: string,
  metadata?: any,
  dedupKey?: string,
  cooldownHours?: number
) {
  const results = await Promise.all(
    userIds.map(userId =>
      createNotificationV2({
        userId,
        type,
        title,
        message,
        link,
        metadata,
        dedupKey: dedupKey ? `${dedupKey}_${userId}` : undefined,
        cooldownHours
      })
    )
  );

  const successCount = results.filter(r => r.success).length;
  return { success: successCount > 0, successCount, total: userIds.length };
}
