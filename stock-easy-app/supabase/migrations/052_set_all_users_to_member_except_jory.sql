-- ============================================
-- Migration 052: Mettre tous les utilisateurs en membre sauf Jory Cherief
-- ============================================
-- Objectif : Changer le statut de tous les utilisateurs en "member"
--            sauf Jory Cherief qui reste en "admin" (ou "owner" si c'est déjà son rôle)
--            UNIQUEMENT pour l'entreprise de Jory Cherief

-- S'assurer que la contrainte CHECK permet 'member', 'admin' et 'owner'
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  ALTER TABLE public.user_profiles 
    DROP CONSTRAINT IF EXISTS user_profiles_role_check;
  
  -- Recréer la contrainte avec les bonnes valeurs
  ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_role_check 
    CHECK (role IN ('owner', 'admin', 'member'));
    
  RAISE NOTICE 'Contrainte CHECK sur role mise à jour';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la mise à jour de la contrainte: %', SQLERRM;
END $$;

-- Trouver l'entreprise de Jory Cherief et effectuer les modifications uniquement pour cette entreprise
DO $$
DECLARE
  v_jory_id UUID;
  v_company_id UUID;
  v_invalid_roles TEXT[];
  v_total_users INTEGER;
  v_members_count INTEGER;
  v_jory_role TEXT;
BEGIN
  -- Trouver l'ID et l'entreprise de Jory Cherief
  SELECT id, company_id INTO v_jory_id, v_company_id
  FROM public.user_profiles
  WHERE LOWER(TRIM(COALESCE(first_name, ''))) = LOWER('Jory') 
    AND LOWER(TRIM(COALESCE(last_name, ''))) = LOWER('Cherief')
  LIMIT 1;

  -- Vérifier que Jory Cherief existe
  IF v_jory_id IS NULL THEN
    RAISE EXCEPTION 'Jory Cherief non trouvé dans la base de données';
  END IF;

  -- Vérifier que Jory Cherief a une entreprise
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Jory Cherief n''appartient à aucune entreprise';
  END IF;

  RAISE NOTICE 'Entreprise de Jory Cherief trouvée: %', v_company_id;

  -- Trouver les rôles invalides dans cette entreprise uniquement
  SELECT ARRAY_AGG(DISTINCT role) INTO v_invalid_roles
  FROM public.user_profiles
  WHERE company_id = v_company_id
    AND role NOT IN ('owner', 'admin', 'member')
    AND id != v_jory_id;

  -- Si des rôles invalides existent, les convertir en 'member'
  IF v_invalid_roles IS NOT NULL AND array_length(v_invalid_roles, 1) > 0 THEN
    RAISE NOTICE 'Rôles invalides trouvés et convertis en member: %', v_invalid_roles;
    UPDATE public.user_profiles
    SET role = 'member', updated_at = NOW()
    WHERE company_id = v_company_id
      AND role = ANY(v_invalid_roles)
      AND id != v_jory_id;
  END IF;

  -- Mettre tous les utilisateurs de cette entreprise en "member" sauf Jory Cherief
  UPDATE public.user_profiles
  SET 
    role = 'member',
    updated_at = NOW()
  WHERE 
    company_id = v_company_id
    -- Exclure Jory Cherief
    AND id != v_jory_id
    -- Ne modifier que si le rôle n'est pas déjà "member"
    AND role != 'member'
    -- S'assurer que le rôle actuel est valide avant de le changer
    AND role IN ('owner', 'admin');

  -- S'assurer que Jory Cherief est en "admin" (ou garder "owner" s'il l'est déjà)
  UPDATE public.user_profiles
  SET 
    role = CASE 
      WHEN role = 'owner' THEN 'owner'  -- Garder owner si c'est déjà le cas
      ELSE 'admin'  -- Sinon mettre en admin
    END,
    updated_at = NOW()
  WHERE 
    id = v_jory_id
    AND role NOT IN ('owner', 'admin');  -- Seulement si ce n'est pas déjà owner ou admin

  -- Afficher un résumé des modifications
  SELECT COUNT(*) INTO v_total_users 
  FROM public.user_profiles 
  WHERE company_id = v_company_id;
  
  SELECT COUNT(*) INTO v_members_count 
  FROM public.user_profiles 
  WHERE company_id = v_company_id 
    AND role = 'member';
  
  SELECT role INTO v_jory_role 
  FROM public.user_profiles 
  WHERE id = v_jory_id;
  
  RAISE NOTICE 'Migration terminée pour l''entreprise %:', v_company_id;
  RAISE NOTICE '  - Total d''utilisateurs dans l''entreprise : %', v_total_users;
  RAISE NOTICE '  - Utilisateurs en "member" : %', v_members_count;
  RAISE NOTICE '  - Rôle de Jory Cherief : %', COALESCE(v_jory_role, 'Non trouvé');
END $$;

