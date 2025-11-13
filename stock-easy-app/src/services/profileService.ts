import { supabase } from '../lib/supabaseClient';

// Récupérer le profil de l'utilisateur actuel
export async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur getCurrentUserProfile:', error);
    return { data: null, error };
  }
}

// Récupérer le profil utilisateur
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur getUserProfile:', error);
    return { data: null, error };
  }
}

// Mettre à jour le profil utilisateur
export async function updateUserProfile(userId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur updateUserProfile:', error);
    return { data: null, error };
  }
}

// Upload de photo de profil
export async function uploadProfilePhoto(userId: string, file: File) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { data: publicUrl, error: null };
  } catch (error) {
    console.error('Erreur uploadProfilePhoto:', error);
    return { data: null, error };
  }
}

// Récupérer les membres de l'équipe
export async function getTeamMembers(companyId?: string) {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], error: null };
    }

    // Si pas de companyId fourni, essayer de le récupérer depuis user_profiles
    let targetCompanyId = companyId;
    if (!targetCompanyId) {
      const { data: profile, error: profileFetchError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      targetCompanyId = profile?.company_id;

      if (profileFetchError && profileFetchError.code !== 'PGRST116') {
        console.error('Erreur récupération company_id utilisateur:', profileFetchError);
      }
    }

    // Si toujours pas de company_id, retourner juste l'utilisateur actuel
    if (!targetCompanyId) {
      return { 
        data: [{
          id: user.id,
          userId: user.id,
          firstName: user.email?.split('@')[0] || 'Utilisateur',
          lastName: '',
          email: user.email || '',
          photoUrl: user.user_metadata?.avatar_url || null,
          role: 'admin',
          companyId: null
        }], 
        error: null 
      };
    }

    // Récupérer tous les membres de la même entreprise
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('company_id', targetCompanyId);

    if (error) {
      console.error('Erreur récupération profiles:', error);
      // En cas d'erreur, retourner au moins l'utilisateur actuel
      return { 
        data: [{
          id: user.id,
          userId: user.id,
          firstName: user.email?.split('@')[0] || 'Utilisateur',
          lastName: '',
          email: user.email || '',
          photoUrl: user.user_metadata?.avatar_url || null,
          role: 'admin',
          companyId: targetCompanyId
        }], 
        error: null 
      };
    }

    // Mapper les données
    const mappedData = profiles?.map(profile => ({
      id: profile.id,
      userId: profile.id,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      email: profile.email || '',
      photoUrl: profile.photo_url || null,
      role: profile.role || 'member',
      companyId: profile.company_id
    })) || [];

    return { data: mappedData, error: null };
  } catch (error) {
    console.error('Erreur getTeamMembers:', error);
    return { data: [], error };
  }
}

// S'assurer que l'utilisateur a une entreprise
export async function ensureUserCompany() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // Si l'utilisateur a déjà une entreprise, retourner son ID
    if (profile?.company_id) {
      return { data: { companyId: profile.company_id }, error: null };
    }

    // Sinon, créer une nouvelle entreprise pour l'utilisateur
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: `${user.email?.split('@')[0]}'s Company`,
        owner_id: user.id
      })
      .select()
      .single();

    if (companyError) throw companyError;

    // Mettre à jour le profil utilisateur avec l'ID de l'entreprise
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ company_id: newCompany.id })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return { data: { companyId: newCompany.id }, error: null };
  } catch (error) {
    console.error('Erreur ensureUserCompany:', error);
    return { data: null, error };
  }
}

