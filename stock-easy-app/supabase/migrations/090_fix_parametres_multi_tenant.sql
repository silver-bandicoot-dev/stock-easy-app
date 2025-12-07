-- Migration 090: Corriger le multi-tenant pour la table parametres
-- ============================================
-- PROBLÈME: La table parametres a une clé primaire sur param_name seul,
--           ce qui empêche plusieurs entreprises d'avoir leurs propres paramètres.
--           La fonction update_parameter ne filtre pas par company_id.
-- 
-- SOLUTION: 
--   1. Changer la clé primaire en (param_name, company_id)
--   2. Modifier la fonction update_parameter pour utiliser le company_id de l'utilisateur
-- ============================================

-- ============================================
-- 1. MODIFIER LA STRUCTURE DE LA TABLE
-- ============================================

-- D'abord, supprimer la clé primaire existante
ALTER TABLE public.parametres DROP CONSTRAINT IF EXISTS parametres_pkey;

-- Ajouter une contrainte UNIQUE sur (param_name, company_id)
-- Cela permet à chaque entreprise d'avoir ses propres paramètres
ALTER TABLE public.parametres 
ADD CONSTRAINT parametres_pkey PRIMARY KEY (param_name, company_id);

-- Ajouter un index pour les recherches par company_id
CREATE INDEX IF NOT EXISTS idx_parametres_company_id 
ON public.parametres(company_id);

-- ============================================
-- 2. METTRE À JOUR LA FONCTION update_parameter
-- ============================================

CREATE OR REPLACE FUNCTION public.update_parameter(
  p_param_name TEXT, 
  p_value TEXT
)
RETURNS JSON AS $$
DECLARE
  v_updated_count INTEGER;
  v_param_exists BOOLEAN;
  v_company_id UUID;
BEGIN
  -- Sécurité : définir le search_path
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur connecté
  v_company_id := get_current_user_company_id();
  
  -- Vérifier que l'utilisateur a un company_id
  IF v_company_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Company ID not found for current user',
      'param_name', p_param_name,
      'message', 'Impossible de déterminer l''entreprise de l''utilisateur'
    );
  END IF;
  
  -- Vérifier si le paramètre existe pour CETTE entreprise
  SELECT EXISTS(
    SELECT 1 FROM public.parametres 
    WHERE param_name = p_param_name 
      AND company_id = v_company_id
  ) INTO v_param_exists;
  
  IF NOT v_param_exists THEN
    -- Si le paramètre n'existe pas pour cette entreprise, le créer
    INSERT INTO public.parametres (param_name, value, company_id, updated_at)
    VALUES (p_param_name, p_value, v_company_id, NOW())
    RETURNING 1 INTO v_updated_count;
    
    RETURN json_build_object(
      'success', TRUE,
      'action', 'created',
      'param_name', p_param_name,
      'new_value', p_value,
      'company_id', v_company_id,
      'message', 'Paramètre créé avec succès'
    );
  ELSE
    -- Sinon, mettre à jour uniquement pour CETTE entreprise
    UPDATE public.parametres 
    SET 
      value = p_value,
      updated_at = NOW()
    WHERE param_name = p_param_name
      AND company_id = v_company_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN json_build_object(
      'success', TRUE,
      'action', 'updated',
      'param_name', p_param_name,
      'new_value', p_value,
      'company_id', v_company_id,
      'updated_count', v_updated_count,
      'message', 'Paramètre mis à jour avec succès'
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'param_name', p_param_name,
      'message', 'Erreur lors de la mise à jour du paramètre'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Ajouter un commentaire explicatif
COMMENT ON FUNCTION public.update_parameter(TEXT, TEXT) IS 
'Met à jour ou crée un paramètre pour l''entreprise de l''utilisateur connecté.
Utilise get_current_user_company_id() pour identifier l''entreprise.
Supporte le multi-tenant: chaque entreprise a ses propres paramètres.';

-- ============================================
-- 3. CRÉER UNE FONCTION POUR OBTENIR UN PARAMÈTRE
-- ============================================

CREATE OR REPLACE FUNCTION public.get_parameter(p_param_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur connecté
  v_company_id := get_current_user_company_id();
  
  -- Récupérer la valeur du paramètre pour cette entreprise
  SELECT value INTO v_value
  FROM public.parametres
  WHERE param_name = p_param_name
    AND company_id = v_company_id
  LIMIT 1;
  
  RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION public.get_parameter(TEXT) IS 
'Récupère la valeur d''un paramètre pour l''entreprise de l''utilisateur connecté.';

-- ============================================
-- 4. VÉRIFICATION
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Compter les paramètres par entreprise
  SELECT COUNT(DISTINCT company_id) INTO v_count FROM public.parametres;
  RAISE NOTICE '✅ Migration 090 appliquée avec succès';
  RAISE NOTICE '📊 Nombre d''entreprises avec des paramètres: %', v_count;
  RAISE NOTICE '🔒 Chaque entreprise peut maintenant avoir ses propres paramètres';
END $$;

