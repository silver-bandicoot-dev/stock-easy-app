-- ============================================
-- Migration: Enrich company data captured at signup
-- ============================================

BEGIN;

-- Ajouter les colonnes nécessaires pour stocker les métadonnées internes
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS employee_count_range TEXT,
  ADD COLUMN IF NOT EXISTS average_revenue_range TEXT,
  ADD COLUMN IF NOT EXISTS average_sku_range TEXT;

-- Mettre à jour la fonction de création automatique d'entreprise pour capturer les nouvelles métadonnées
CREATE OR REPLACE FUNCTION public.create_company_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  v_company_name TEXT;
  v_company_industry TEXT;
  v_employee_range TEXT;
  v_revenue_range TEXT;
  v_sku_range TEXT;
BEGIN
  SET search_path = public;
  
  v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', (NEW.email)::text || '''s Company');
  v_company_industry := NULLIF(NEW.raw_user_meta_data->>'company_industry', '');
  v_employee_range := NULLIF(NEW.raw_user_meta_data->>'company_employee_count', '');
  v_revenue_range := NULLIF(NEW.raw_user_meta_data->>'company_average_revenue', '');
  v_sku_range := NULLIF(NEW.raw_user_meta_data->>'company_average_sku', '');
  
  -- Créer une entreprise avec les métadonnées internes
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
  
  -- Créer le profil propriétaire
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
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

