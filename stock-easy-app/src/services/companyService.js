import { supabase } from '../lib/supabaseClient';

/**
 * Service pour la gestion des entreprises et du multi-tenant
 */

// ============================================
// GESTION DES ENTREPRISES
// ============================================

/**
 * Récupérer l'entreprise de l'utilisateur actuel
 */
export async function getCurrentUserCompany() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    if (!profile?.company_id) {
      return { data: null, error: null };
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    if (companyError) throw companyError;

    return { data: company, error: null };
  } catch (error) {
    console.error('Erreur getCurrentUserCompany:', error);
    return { data: null, error };
  }
}

/**
 * Mettre à jour les informations de l'entreprise
 */
export async function updateCompany(companyId, updates) {
  try {
    const { data, error } = await supabase
      .from('companies')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur updateCompany:', error);
    return { data: null, error };
  }
}

// ============================================
// GESTION DES INVITATIONS
// ============================================

/**
 * Inviter un membre à rejoindre l'équipe
 */
export async function inviteTeamMember(email, role = 'member', permissions = null) {
  try {
    const { data, error } = await supabase.rpc('invite_team_member', {
      p_email: email.toLowerCase(),
      p_role: role,
      p_permissions: permissions
    });

    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de l\'invitation');
    }

    return { data: data, error: null };
  } catch (error) {
    console.error('Erreur inviteTeamMember:', error);
    return { data: null, error };
  }
}

/**
 * Accepter une invitation via son token
 */
export async function acceptInvitation(token) {
  try {
    const { data, error } = await supabase.rpc('accept_invitation', {
      p_token: token
    });

    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de l\'acceptation de l\'invitation');
    }

    return { data: data, error: null };
  } catch (error) {
    console.error('Erreur acceptInvitation:', error);
    return { data: null, error };
  }
}

/**
 * Récupérer les invitations en attente
 */
export async function getPendingInvitations() {
  try {
    const { data, error } = await supabase.rpc('get_pending_invitations');

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.warn('getPendingInvitations indisponible:', error?.message || error);
    return { data: [], error };
  }
}

/**
 * Révoquer une invitation
 */
export async function revokeInvitation(invitationId) {
  try {
    const { data, error } = await supabase.rpc('revoke_invitation', {
      p_invitation_id: invitationId
    });

    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la révocation');
    }

    return { data: data, error: null };
  } catch (error) {
    console.error('Erreur revokeInvitation:', error);
    return { data: null, error };
  }
}

// ============================================
// GESTION DES MEMBRES
// ============================================

/**
 * Récupérer tous les membres de l'équipe
 */
export async function getTeamMembers() {
  try {
    const { data, error } = await supabase.rpc('get_team_members');

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur getTeamMembers:', error);
    return { data: [], error };
  }
}

/**
 * Retirer un membre de l'équipe
 */
export async function removeTeamMember(userId) {
  try {
    const { data, error } = await supabase.rpc('remove_team_member', {
      p_user_id: userId
    });

    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la suppression');
    }

    return { data: data, error: null };
  } catch (error) {
    console.error('Erreur removeTeamMember:', error);
    return { data: null, error };
  }
}

/**
 * Supprimer complètement un membre de l'équipe (supprime le compte utilisateur)
 * Cette fonction supprime le profil utilisateur et toutes les données associées
 */
export async function deleteTeamMember(userId) {
  console.log('🚀 deleteTeamMember: FONCTION APPELÉE avec userId:', userId);
  try {
    // Vérifier que l'utilisateur est authentifié
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    console.log('🚀 deleteTeamMember: Appel de la fonction RPC delete_team_member_rpc...');
    
    // Appeler directement la fonction RPC qui fait toutes les vérifications
    // Cette fonction utilise SECURITY DEFINER pour contourner RLS
    // Elle vérifie :
    // - Que l'utilisateur actuel est authentifié
    // - Que l'utilisateur actuel est admin ou owner
    // - Que l'utilisateur cible n'est pas le propriétaire
    // - Qu'ils sont dans la même entreprise (ou que l'utilisateur cible est orphelin)
    // - Qu'on ne supprime pas soi-même
    const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_team_member_rpc', {
      p_target_user_id: userId
    });

    console.log('🔍 deleteTeamMember: Résultat de la fonction RPC:', { rpcResult, rpcError });

    if (rpcError) {
      console.error('❌ deleteTeamMember: Erreur lors de l\'appel RPC:', rpcError);
      throw new Error(rpcError.message || 'Erreur lors de la suppression du profil utilisateur');
    }

    // Vérifier le résultat de la fonction RPC
    if (!rpcResult || !rpcResult.success) {
      const errorMessage = rpcResult?.error || 'Erreur inconnue lors de la suppression';
      console.error('❌ deleteTeamMember: La fonction RPC a retourné une erreur:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ deleteTeamMember: Suppression réussie via RPC');

    return { 
      data: { 
        success: true, 
        message: rpcResult.message || 'Membre supprimé avec succès. Le compte d\'authentification peut nécessiter une suppression manuelle par un administrateur Supabase.' 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Erreur deleteTeamMember:', error);
    // Extraire le message d'erreur de manière sécurisée
    const errorMessage = error?.message || error?.error || error?.toString() || 'Erreur inconnue lors de la suppression';
    return { data: null, error: new Error(errorMessage) };
  }
}

/**
 * Mettre à jour le rôle d'un membre
 */
export async function updateMemberRole(userId, newRole) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur updateMemberRole:', error);
    return { data: null, error };
  }
}

/**
 * Mettre à jour les permissions d'un membre
 */
export async function updateMemberPermissions(userId, permissions) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur updateMemberPermissions:', error);
    return { data: null, error };
  }
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Vérifier si l'utilisateur a une permission spécifique
 */
export async function hasPermission(permissionKey) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role, permissions')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    // Les owners et admins ont toutes les permissions
    if (profile.role === 'owner' || profile.role === 'admin') {
      return true;
    }

    // Vérifier la permission spécifique
    return profile.permissions?.[permissionKey] === true;
  } catch (error) {
    console.error('Erreur hasPermission:', error);
    return false;
  }
}

/**
 * Récupérer le profil complet de l'utilisateur actuel
 */
export async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    return { 
      data: {
        ...profile,
        email: user.email
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Erreur getCurrentUserProfile:', error);
    return { data: null, error };
  }
}

/**
 * Mettre à jour le profil utilisateur
 */
export async function updateUserProfile(updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur updateUserProfile:', error);
    return { data: null, error };
  }
}

/**
 * Upload d'une photo de profil
 */
export async function uploadProfilePhoto(file) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/profile-photos/${fileName}`;

    // Upload du fichier
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Erreur uploadProfilePhoto:', error);
    throw error;
  }
}

/**
 * Envoyer un email d'invitation (utilise Supabase Edge Functions ou service externe)
 */
export async function sendInvitationEmail(email, token, inviterName, companyName) {
  try {
    // Pour l'instant, générer juste le lien
    // Dans un vrai système, vous utiliseriez Supabase Edge Functions ou un service comme SendGrid
    
    const invitationLink = `${window.location.origin}/accept-invitation?token=${token}`;
    
    console.log('📧 Email d\'invitation à envoyer:');
    console.log('To:', email);
    console.log('From:', inviterName);
    console.log('Company:', companyName);
    console.log('Link:', invitationLink);
    
    // TODO: Implémenter l'envoi réel d'email via Edge Function
    // const { error } = await supabase.functions.invoke('send-invitation-email', {
    //   body: { email, token, inviterName, companyName }
    // });
    
    return { 
      data: { invitationLink }, 
      error: null 
    };
  } catch (error) {
    console.error('Erreur sendInvitationEmail:', error);
    return { data: null, error };
  }
}

export default {
  getCurrentUserCompany,
  updateCompany,
  inviteTeamMember,
  acceptInvitation,
  getPendingInvitations,
  revoqueInvitation: revokeInvitation, // Alias français
  revokeInvitation,
  getTeamMembers,
  removeTeamMember,
  deleteTeamMember,
  updateMemberRole,
  updateMemberPermissions,
  hasPermission,
  getCurrentUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  sendInvitationEmail
};

