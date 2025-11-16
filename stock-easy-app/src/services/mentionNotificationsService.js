/**
 * Service pour les notifications de mentions dans les commentaires
 * Gère la création de notifications lorsqu'un utilisateur est tagué (@user)
 */

import { supabase } from '../lib/supabaseClient';
import { createNotification } from './autoNotificationsService';

/**
 * Crée des notifications pour les utilisateurs mentionnés dans un commentaire
 * @param {string} orderId - ID de la commande
 * @param {string} authorId - ID de l'auteur du commentaire
 * @param {string} content - Contenu du commentaire
 * @param {Array<string>} mentionedUserIds - IDs des utilisateurs mentionnés
 */
export async function notifyMentionedUsers(orderId, authorId, content, mentionedUserIds) {
  if (!mentionedUserIds || mentionedUserIds.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    // Récupérer les infos de l'auteur
    const { data: authorProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('id', authorId)
      .single();

    const authorName = authorProfile?.first_name && authorProfile?.last_name
      ? `${authorProfile.first_name} ${authorProfile.last_name}`
      : authorProfile?.email?.split('@')[0] || 'Un utilisateur';

    // Créer le preview du commentaire (max 100 caractères)
    const commentPreview = content.length > 100
      ? content.substring(0, 97) + '...'
      : content;

    // Créer une notification pour chaque utilisateur mentionné
    const notificationPromises = mentionedUserIds
      .filter(userId => userId !== authorId) // Ne pas notifier l'auteur
      .map(userId =>
        createNotification(
          userId,
          'mention',
          `💬 ${authorName} vous a mentionné`,
          `Dans la commande ${orderId}: "${commentPreview}"`,
          `/track?order=${orderId}`,
          {
            orderId,
            authorId,
            authorName,
            commentPreview: content
          }
        )
      );

    await Promise.all(notificationPromises);

    return { success: true, count: mentionedUserIds.length };
  } catch (error) {
    console.error('Erreur création notifications de mentions:', error);
    return { success: false, error, count: 0 };
  }
}

/**
 * Extrait les mentions (@user) d'un texte et retourne les IDs utilisateurs
 * @param {string} content - Contenu du commentaire
 * @param {string} companyId - ID de l'entreprise
 * @returns {Promise<Array<string>>} Liste des IDs utilisateurs mentionnés
 */
export async function extractMentions(content, companyId) {
  if (!content) return [];

  // Regex pour détecter les mentions: @email ou @prénom.nom
  const mentionRegex = /@([\w.-]+(?:@[\w.-]+)?)/g;
  const matches = [...content.matchAll(mentionRegex)];
  
  if (matches.length === 0) return [];

  const mentionTexts = matches.map(m => m[1]);

  try {
    // Récupérer les utilisateurs de l'entreprise dont l'email ou le nom correspond
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name')
      .eq('company_id', companyId);

    if (!profiles) return [];

    // Matcher les mentions avec les profils
    const mentionedUserIds = [];
    
    mentionTexts.forEach(mention => {
      const matchedProfile = profiles.find(profile => {
        const email = profile.email?.toLowerCase() || '';
        const fullName = `${profile.first_name || ''}.${profile.last_name || ''}`.toLowerCase();
        const mentionLower = mention.toLowerCase();
        
        // Match par email complet, début d'email, ou prénom.nom
        return email === mentionLower || 
               email.startsWith(mentionLower + '@') ||
               fullName === mentionLower;
      });

      if (matchedProfile && !mentionedUserIds.includes(matchedProfile.id)) {
        mentionedUserIds.push(matchedProfile.id);
      }
    });

    return mentionedUserIds;
  } catch (error) {
    console.error('Erreur extraction mentions:', error);
    return [];
  }
}

/**
 * Récupère tous les utilisateurs d'une entreprise pour l'autocomplétion
 * @param {string} companyId - ID de l'entreprise
 * @returns {Promise<Array>} Liste des utilisateurs {id, email, firstName, lastName, displayName}
 */
export async function getCompanyUsersForMention(companyId) {
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name, photo_url')
      .eq('company_id', companyId)
      .order('first_name', { ascending: true });

    if (error) throw error;

    return (profiles || []).map(profile => ({
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      displayName: profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.email?.split('@')[0] || 'Utilisateur',
      photoUrl: profile.photo_url
    }));
  } catch (error) {
    console.error('Erreur récupération utilisateurs pour mentions:', error);
    return [];
  }
}

