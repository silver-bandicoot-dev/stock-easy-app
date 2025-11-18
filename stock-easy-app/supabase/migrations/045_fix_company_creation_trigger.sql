-- ============================================
-- Migration: Fix company creation trigger for new users
-- ============================================
-- Problème: Les nouveaux utilisateurs peuvent être assignés à une company existante
-- Solution: S'assurer que le trigger crée toujours une nouvelle company pour chaque nouvel utilisateur

BEGIN;

-- S'assurer que la fonction create_company_for_user existe et est correcte
CREATE OR REPLACE FUNCTION public.create_company_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  v_company_name TEXT;
  v_company_industry TEXT;
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
  v_company_industry := NULLIF(NEW.raw_user_meta_data->>'company_industry', '');
  v_employee_range := NULLIF(NEW.raw_user_meta_data->>'company_employee_count', '');
  v_revenue_range := NULLIF(NEW.raw_user_meta_data->>'company_average_revenue', '');
  v_sku_range := NULLIF(NEW.raw_user_meta_data->>'company_average_sku', '');
  
  -- Créer une nouvelle entreprise pour cet utilisateur
  INSERT INTO public.companies (
    name,
    owner_id,
    industry,
    size,
    employee_count_range,
    average_revenue_range,
    average_sku_range
  )
  VALUES (
    v_company_name,
    NEW.id,
    v_company_industry,
    v_employee_range,
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

-- S'assurer que le trigger existe et est correctement configuré
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_company_for_user();

-- Commentaire pour documentation
COMMENT ON FUNCTION public.create_company_for_user IS 
  'Crée automatiquement une nouvelle company pour chaque nouvel utilisateur lors de l''inscription. 
   Si un profil existe déjà (via invitation), ne crée pas de nouvelle company.';

COMMIT;

