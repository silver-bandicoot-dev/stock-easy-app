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

// Récupérer toutes les notifications de l'utilisateur
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

    const mappedData: Notification[] = data?.map(notif => ({
      id: notif.id,
      userId: notif.user_id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      link: notif.link,
      read: notif.read,
      createdAt: notif.created_at,
      metadata: notif.metadata
    })) || [];

    return { data: mappedData, error: null };
  } catch (error) {
    console.error('Erreur getUserNotifications:', error);
    return { data: [], error };
  }
}

// Récupérer uniquement les notifications non lues
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

    const mappedData: Notification[] = data?.map(notif => ({
      id: notif.id,
      userId: notif.user_id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      link: notif.link,
      read: notif.read,
      createdAt: notif.created_at,
      metadata: notif.metadata
    })) || [];

    return { data: mappedData, error: null };
  } catch (error) {
    console.error('Erreur getUnreadNotifications:', error);
    return { data: [], error };
  }
}

// Compter les notifications non lues
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

// Marquer une notification comme lue
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

// Marquer toutes les notifications comme lues
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

// Supprimer une notification
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

// Supprimer toutes les notifications lues
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

// S'abonner aux notifications en temps réel
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
        const notif = payload.new as any;
        onNotification({
          id: notif.id,
          userId: notif.user_id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: notif.link,
          read: notif.read,
          createdAt: notif.created_at,
          metadata: notif.metadata
        });
      }
    )
    .subscribe();

  return channel;
}










