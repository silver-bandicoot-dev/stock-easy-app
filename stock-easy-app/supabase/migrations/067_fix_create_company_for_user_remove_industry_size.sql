-- ============================================
-- Migration 067: Corriger create_company_for_user() pour Shopify
-- ============================================
-- Objectif : Retirer les colonnes industry et size de l'INSERT
--            pour permettre la création de companies Shopify sans ces métadonnées
--
-- Problème : La fonction essaie d'insérer dans industry et size
--            qui peuvent avoir des contraintes ou causer des erreurs
--
-- Solution : Simplifier l'INSERT pour ne garder que les colonnes essentielles
-- ============================================

BEGIN;

-- Mettre à jour la fonction pour retirer industry et size
CREATE OR REPLACE FUNCTION public.create_company_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  v_company_name TEXT;
  v_employee_range TEXT;
  v_revenue_range TEXT;
  v_sku_range TEXT;
  existing_profile_count INTEGER;
BEGIN
  SET search_path = public;
  
  -- Vérifier si un profil existe déjà pour cet utilisateur
  -- (peut arriver si l'utilisateur a été créé manuellement ou via une invitation)
  SELECT COUNT(*) INTO existing_profile_count
  FROM public.user_profiles
  WHERE id = NEW.id;
  
  -- Si un profil existe déjà, ne pas créer de nouvelle company
  -- (cela signifie que l'utilisateur a été invité à rejoindre une company existante)
  IF existing_profile_count > 0 THEN
    RETURN NEW;
  END IF;
  
  -- Extraire les métadonnées de l'entreprise depuis raw_user_meta_data
  v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', (NEW.email)::text || '''s Company');
  v_employee_range := NULLIF(NEW.raw_user_meta_data->>'company_employee_count', '');
  v_revenue_range := NULLIF(NEW.raw_user_meta_data->>'company_average_revenue', '');
  v_sku_range := NULLIF(NEW.raw_user_meta_data->>'company_average_sku', '');
  
  -- Créer une nouvelle entreprise pour cet utilisateur
  -- SANS industry et size (pour compatibilité Shopify)
  INSERT INTO public.companies (
    name,
    owner_id,
    employee_count_range,
    average_revenue_range,
    average_sku_range
  )
  VALUES (
    v_company_name,
    NEW.id,
    v_employee_range,
    v_revenue_range,
    v_sku_range
  )
  RETURNING id INTO new_company_id;
  
  -- Créer le profil propriétaire avec le company_id de la nouvelle company
  INSERT INTO public.user_profiles (
    id,
    company_id,
    first_name,
    last_name,
    role,
    permissions
  )
  VALUES (
    NEW.id,
    new_company_id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'owner',
    '{"can_view": true, "can_edit": true, "can_delete": true, "can_invite": true}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING; -- Ne pas écraser si le profil existe déjà
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour le commentaire
COMMENT ON FUNCTION public.create_company_for_user IS 
'Crée automatiquement une nouvelle company pour chaque nouvel utilisateur lors de l''inscription. 
 Si un profil existe déjà (via invitation), ne crée pas de nouvelle company.
 Compatible avec les installations Shopify (sans industry et size).';

COMMIT;

-- ============================================
-- Vérification
-- ============================================
-- 
-- Vérifier que la fonction a été mise à jour :
-- SELECT pg_get_functiondef(oid) 
-- FROM pg_proc 
-- WHERE proname = 'create_company_for_user';
--
-- L'INSERT ne doit plus contenir industry et size
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 067: Fonction create_company_for_user() corrigée';
  RAISE NOTICE '📝 Colonnes industry et size retirées de l''INSERT';
  RAISE NOTICE '📝 Compatible avec les installations Shopify';
END $$;







