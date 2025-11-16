import { supabase } from '../lib/supabaseClient';
import { notifyMentionedUsers, extractMentions } from './mentionNotificationsService';

// Récupérer les commentaires d'une commande
export async function getOrderComments(orderId: string) {
  try {
    const { data, error } = await supabase
      .from('order_comments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Récupérer les infos utilisateurs pour chaque commentaire
    const userIds = [...new Set(data?.map(c => c.user_id) || [])];
    const usersData: any = {};

    // Essayer de récupérer depuis user_profiles d'abord
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email, photo_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Erreur récupération profils utilisateurs:', profilesError);
      } else {
        profiles?.forEach(profile => {
          usersData[profile.id] = {
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            email: profile.email || '',
            photoUrl: profile.photo_url || null
          };
        });
      }
    }

    // Pour les utilisateurs non trouvés, essayer auth.users
    const missingUserIds = userIds.filter(id => !usersData[id]);
    if (missingUserIds.length > 0) {
      // Fallback: utiliser l'email de l'utilisateur actuel si c'est son commentaire
      const { data: { user } } = await supabase.auth.getUser();
      if (user && missingUserIds.includes(user.id)) {
        usersData[user.id] = {
          firstName: user.email?.split('@')[0] || 'Utilisateur',
          lastName: '',
          email: user.email || '',
          photoUrl: user.user_metadata?.avatar_url || null
        };
      }
    }

    // Mapper les données avec les infos utilisateur
    const mappedData = data?.map(comment => ({
      id: comment.id,
      orderId: comment.order_id,
      userId: comment.user_id,
      content: comment.content,
      mentionedUsers: comment.mentioned_users || [],
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      user: usersData[comment.user_id]
        ? {
          id: comment.user_id,
          firstName: usersData[comment.user_id].firstName,
          lastName: usersData[comment.user_id].lastName,
          email: usersData[comment.user_id].email,
          photoUrl: usersData[comment.user_id].photoUrl
        }
        : {
        id: comment.user_id,
        firstName: 'Utilisateur',
        lastName: '',
        email: '',
        photoUrl: null
      }
    }));

    return { data: mappedData || [], error: null };
  } catch (error) {
    console.error('Erreur getOrderComments:', error);
    return { data: [], error };
  }
}

// Ajouter un commentaire
export async function addComment(orderId: string, content: string, mentions: string[] = []) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    // Récupérer l'ID de l'entreprise de l'utilisateur
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    const companyId = profile?.company_id;

    // Si pas de mentions fournies, extraire automatiquement du contenu
    let mentionedUserIds = mentions;
    if (mentionedUserIds.length === 0 && companyId) {
      mentionedUserIds = await extractMentions(content, companyId);
    }

    // Créer le commentaire
    const { data, error } = await supabase
      .from('order_comments')
      .insert({
        order_id: orderId,
        user_id: user.id,
        content: content,
        mentioned_users: mentionedUserIds
      })
      .select()
      .single();

    if (error) throw error;

    // Créer des notifications pour les utilisateurs mentionnés
    if (mentionedUserIds.length > 0) {
      await notifyMentionedUsers(orderId, user.id, content, mentionedUserIds);
      console.log(`✅ ${mentionedUserIds.length} notification(s) de mention créée(s)`);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erreur addComment:', error);
    return { data: null, error };
  }
}

// Mettre à jour un commentaire
export async function updateComment(commentId: string, content: string) {
  try {
    const { data, error } = await supabase
      .from('order_comments')
      .update({ 
        content: content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur updateComment:', error);
    return { data: null, error };
  }
}

// Supprimer un commentaire
export async function deleteComment(commentId: string) {
  try {
    const { error } = await supabase
      .from('order_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Erreur deleteComment:', error);
    return { error };
  }
}

// S'abonner aux changements de commentaires
export function subscribeToComments(orderId: string, callback: (comments: any[]) => void) {
  const channel = supabase
    .channel(`order_comments_${orderId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'order_comments', filter: `order_id=eq.${orderId}` },
      () => {
        // Recharger les commentaires
        getOrderComments(orderId).then(({ data }) => {
          if (data) callback(data);
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Alias pour compatibilité
export const subscribeToOrderComments = subscribeToComments;

