-- ============================================
-- Migration 051: Fonction pour supprimer complètement un membre de l'équipe
-- ============================================
-- Objectif : Permettre aux administrateurs de supprimer définitivement
--            un membre de l'équipe (profil et données associées)

-- Fonction pour supprimer complètement un membre de l'équipe
CREATE OR REPLACE FUNCTION public.delete_team_member(
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_current_user_id UUID;
  v_current_profile RECORD;
  v_target_profile RECORD;
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Récupérer l'utilisateur actuel
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Utilisateur non authentifié'
    );
  END IF;
  
  -- Récupérer le profil de l'utilisateur actuel
  SELECT role, company_id INTO v_current_profile
  FROM public.user_profiles
  WHERE id = v_current_user_id;
  
  IF v_current_profile IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Profil utilisateur introuvable'
    );
  END IF;
  
  -- Vérifier que l'utilisateur actuel est admin ou owner
  IF v_current_profile.role NOT IN ('owner', 'admin') THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Seuls les administrateurs peuvent supprimer des membres'
    );
  END IF;
  
  -- Récupérer le profil de l'utilisateur à supprimer
  SELECT role, company_id INTO v_target_profile
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  IF v_target_profile IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Utilisateur à supprimer introuvable'
    );
  END IF;
  
  -- Vérifier que l'utilisateur à supprimer n'est pas le propriétaire
  IF v_target_profile.role = 'owner' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Impossible de supprimer le propriétaire de l''entreprise'
    );
  END IF;
  
  -- Vérifier qu'ils sont dans la même entreprise
  IF v_current_profile.company_id IS NULL OR 
     v_target_profile.company_id IS NULL OR
     v_current_profile.company_id != v_target_profile.company_id THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'L''utilisateur n''appartient pas à votre entreprise'
    );
  END IF;
  
  -- Vérifier qu'on ne supprime pas soi-même
  IF v_current_user_id = p_user_id THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Vous ne pouvez pas supprimer votre propre compte'
    );
  END IF;
  
  -- Supprimer le profil utilisateur (cascade supprimera les données associées)
  DELETE FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- Note: La suppression du compte auth.users nécessite des privilèges admin Supabase
  -- et doit être effectuée via l'API Admin ou le dashboard Supabase
  
  RETURN json_build_object(
    'success', TRUE,
    'message', 'Membre supprimé avec succès. Le compte d''authentification peut nécessiter une suppression manuelle.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.delete_team_member(UUID) IS 
'Supprime définitivement un membre de l''équipe. Seuls les administrateurs peuvent utiliser cette fonction.';

