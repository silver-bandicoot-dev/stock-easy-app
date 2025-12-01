import { supabase } from '../lib/supabaseClient';

/**
 * Interface pour le statut d'onboarding
 */
export interface OnboardingStatus {
  main_tour_completed: boolean;
  completed_at: string | null;
}

/**
 * Récupérer le statut d'onboarding de l'utilisateur actuel
 */
export async function getOnboardingStatus(): Promise<{ data: OnboardingStatus | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('Utilisateur non authentifié') };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('onboarding_status')
      .eq('id', user.id)
      .single();

    if (error) {
      // Si la colonne n'existe pas encore ou le profil n'existe pas, retourner le défaut
      if (error.code === 'PGRST116' || error.code === '42703') {
        return { 
          data: { main_tour_completed: false, completed_at: null }, 
          error: null 
        };
      }
      throw error;
    }

    // Si pas de statut, retourner le défaut
    if (!data?.onboarding_status) {
      return { 
        data: { main_tour_completed: false, completed_at: null }, 
        error: null 
      };
    }

    return { data: data.onboarding_status as OnboardingStatus, error: null };
  } catch (error) {
    console.error('Erreur getOnboardingStatus:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Marquer un tour comme complété
 * @param tourId - L'identifiant du tour (ex: 'main_tour')
 */
export async function markTourCompleted(tourId: string = 'main_tour'): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: new Error('Utilisateur non authentifié') };
    }

    // Récupérer le statut actuel
    const { data: currentData } = await supabase
      .from('user_profiles')
      .select('onboarding_status')
      .eq('id', user.id)
      .single();

    const currentStatus = currentData?.onboarding_status || {};
    
    // Mettre à jour avec le nouveau statut
    const updatedStatus = {
      ...currentStatus,
      [`${tourId}_completed`]: true,
      completed_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_profiles')
      .update({ onboarding_status: updatedStatus })
      .eq('id', user.id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur markTourCompleted:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Réinitialiser un tour (pour tests/debug)
 * @param tourId - L'identifiant du tour (ex: 'main_tour')
 */
export async function resetTour(tourId: string = 'main_tour'): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: new Error('Utilisateur non authentifié') };
    }

    // Récupérer le statut actuel
    const { data: currentData } = await supabase
      .from('user_profiles')
      .select('onboarding_status')
      .eq('id', user.id)
      .single();

    const currentStatus = currentData?.onboarding_status || {};
    
    // Réinitialiser le tour spécifié
    const updatedStatus = {
      ...currentStatus,
      [`${tourId}_completed`]: false,
      completed_at: null
    };

    const { error } = await supabase
      .from('user_profiles')
      .update({ onboarding_status: updatedStatus })
      .eq('id', user.id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur resetTour:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Vérifier si le tour principal a été complété
 */
export async function hasCompletedMainTour(): Promise<boolean> {
  const { data } = await getOnboardingStatus();
  return data?.main_tour_completed ?? false;
}

