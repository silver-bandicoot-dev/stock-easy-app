-- ============================================
-- Migration 062: Mapping Shopify Shop ID → Company UUID
-- ============================================
-- Objectif : Permettre le mapping entre l'identifiant Shopify (texte)
--            et l'UUID de la table companies
--
-- IMPORTANT pour Gadget.dev :
-- - stockEasyCompanyId (Shopify) = TEXT (shop domain ou shop ID)
-- - companies.id (StockEasy) = UUID (généré automatiquement)
-- - Cette migration crée le mapping entre les deux

-- ============================================
-- 1. AJOUTER COLONNE POUR SHOPIFY SHOP ID
-- ============================================

-- Ajouter une colonne pour stocker l'identifiant Shopify
-- Cette colonne permet de mapper le shop_id Shopify (texte) à l'UUID de companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS shopify_shop_id TEXT UNIQUE;

-- Index pour recherche rapide par shop_id Shopify
CREATE INDEX IF NOT EXISTS idx_companies_shopify_shop_id 
ON public.companies(shopify_shop_id) 
WHERE shopify_shop_id IS NOT NULL;

-- Commentaire pour clarifier l'usage
COMMENT ON COLUMN public.companies.shopify_shop_id IS 
'Identifiant unique du shop Shopify (shop domain ou shop ID). 
Permet de mapper le stockEasyCompanyId de Gadget vers l''UUID de companies.';

-- ============================================
-- 2. FONCTION : CRÉER COMPANY POUR SHOPIFY
-- ============================================

CREATE OR REPLACE FUNCTION public.create_shopify_company(
  p_shopify_shop_id TEXT,  -- Le stockEasyCompanyId de Gadget (TEXT, pas UUID)
  p_shop_name TEXT DEFAULT NULL,
  p_shop_domain TEXT DEFAULT NULL,
  p_access_token TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_settings JSONB;
BEGIN
  SET search_path = public;
  
  -- Vérifier si une company existe déjà pour ce shop_id Shopify
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE shopify_shop_id = p_shopify_shop_id
  LIMIT 1;
  
  -- Si la company existe déjà, retourner son UUID
  IF v_company_id IS NOT NULL THEN
    -- Mettre à jour le token d'accès si fourni
    IF p_access_token IS NOT NULL THEN
      UPDATE public.companies
      SET settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{shopify_access_token}',
        to_jsonb(p_access_token)
      ),
      updated_at = NOW()
      WHERE id = v_company_id;
    END IF;
    
    RETURN v_company_id;
  END IF;
  
  -- Construire les settings JSONB avec les infos Shopify
  v_settings := jsonb_build_object(
    'shopify_shop_domain', COALESCE(p_shop_domain, p_shopify_shop_id),
    'shopify_access_token', COALESCE(p_access_token, ''),
    'source', 'shopify',
    'installed_at', NOW()
  );
  
  -- Créer la nouvelle company
  -- Le UUID sera généré AUTOMATIQUEMENT par gen_random_uuid()
  INSERT INTO public.companies (
    name,
    owner_id, -- Pour Shopify, on peut utiliser un user système
    shopify_shop_id,  -- Le stockEasyCompanyId de Gadget
    settings
  )
  VALUES (
    COALESCE(p_shop_name, p_shopify_shop_id),
    -- Utiliser un user système pour les companies Shopify
    (SELECT id FROM auth.users WHERE email = 'system@stockeasy.app' LIMIT 1),
    p_shopify_shop_id,  -- Stocker le shop_id Shopify ici
    v_settings
  )
  RETURNING id INTO v_company_id;
  
  -- Le UUID est maintenant généré et stocké dans v_company_id
  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_shopify_company IS 
'Crée une company StockEasy pour un shop Shopify.
Paramètres:
- p_shopify_shop_id: Le stockEasyCompanyId de Gadget (TEXT, ex: "mystore.myshopify.com" ou "12345678")
- Retourne: L''UUID de la company créée (généré automatiquement par PostgreSQL)';

-- ============================================
-- 3. FONCTION : TROUVER COMPANY PAR SHOP ID
-- ============================================

CREATE OR REPLACE FUNCTION public.get_company_by_shopify_shop_id(
  p_shopify_shop_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE shopify_shop_id = p_shopify_shop_id
  LIMIT 1;
  
  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_company_by_shopify_shop_id IS 
'Mappe le stockEasyCompanyId (TEXT) vers l''UUID de la company.
Utilisé par Gadget pour trouver la company StockEasy à partir du shop_id Shopify.';

-- ============================================
-- 4. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.create_shopify_company TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_by_shopify_shop_id TO authenticated;

-- ============================================
-- 5. EXEMPLE D'UTILISATION
-- ============================================

-- Exemple 1: Créer une company lors de l'installation Shopify
-- SELECT public.create_shopify_company(
--   'mystore.myshopify.com',  -- stockEasyCompanyId (TEXT)
--   'My Store',                -- Nom du shop
--   'mystore.myshopify.com',   -- Domain
--   'shpat_xxxxx'              -- Access token
-- );
-- Retourne: UUID (ex: '550e8400-e29b-41d4-a716-446655440000')

-- Exemple 2: Trouver l'UUID à partir du shop_id
-- SELECT public.get_company_by_shopify_shop_id('mystore.myshopify.com');
-- Retourne: UUID de la company

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 062: Mapping Shopify Shop ID → Company UUID créée avec succès';
  RAISE NOTICE '📝 Le stockEasyCompanyId (TEXT) peut maintenant être mappé vers companies.id (UUID)';
END $$;

