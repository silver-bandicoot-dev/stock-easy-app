-- ============================================
-- Migration 063: Table de Mapping Produits Shopify ↔ StockEasy
-- ============================================
-- Objectif : Créer la table de mapping entre les variants Shopify
--            et les produits StockEasy (SKU)
--
-- IMPORTANT :
-- - shopifyVariantId = variant_id du variant Shopify (PAS lineItem.id)
-- - lineItem.id change à chaque commande (unique par ligne)
-- - lineItem.variant_id est stable (même variant = même variant_id)
-- - On mappe variant_id → SKU StockEasy

-- ============================================
-- 1. CRÉER TABLE DE MAPPING
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Identifiants Shopify
  shopify_variant_id TEXT NOT NULL,  -- variant_id du variant Shopify (PAS lineItem.id)
  shopify_product_id TEXT,           -- product_id du produit Shopify (optionnel)
  shopify_sku TEXT,                   -- SKU du variant Shopify (optionnel, pour référence)
  
  -- Identifiant StockEasy
  stockeasy_sku TEXT NOT NULL,       -- SKU du produit dans StockEasy
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte d'unicité : un variant Shopify = un SKU StockEasy par company
  UNIQUE(company_id, shopify_variant_id)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_product_mapping_company_variant 
ON public.product_mapping(company_id, shopify_variant_id);

CREATE INDEX IF NOT EXISTS idx_product_mapping_company_sku 
ON public.product_mapping(company_id, stockeasy_sku);

CREATE INDEX IF NOT EXISTS idx_product_mapping_shopify_sku 
ON public.product_mapping(company_id, shopify_sku) 
WHERE shopify_sku IS NOT NULL;

-- Commentaires
COMMENT ON TABLE public.product_mapping IS 
'Table de mapping entre les variants Shopify et les produits StockEasy.
Mappe shopify_variant_id (variant_id du variant) vers stockeasy_sku (SKU StockEasy).';

COMMENT ON COLUMN public.product_mapping.shopify_variant_id IS 
'ID du variant Shopify (variant_id). 
IMPORTANT: Utiliser lineItem.variant_id, PAS lineItem.id.
Le variant_id est stable et identifie le variant du produit.';

COMMENT ON COLUMN public.product_mapping.shopify_product_id IS 
'ID du produit Shopify (product_id). Optionnel, pour référence.';

COMMENT ON COLUMN public.product_mapping.shopify_sku IS 
'SKU du variant Shopify. Optionnel, pour référence et recherche.';

COMMENT ON COLUMN public.product_mapping.stockeasy_sku IS 
'SKU du produit dans StockEasy. C''est cet identifiant qui est utilisé dans la table produits.';

-- ============================================
-- 2. FONCTION : CRÉER/METTRE À JOUR MAPPING
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_product_mapping(
  p_company_id UUID,
  p_shopify_variant_id TEXT,
  p_stockeasy_sku TEXT,
  p_shopify_product_id TEXT DEFAULT NULL,
  p_shopify_sku TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_mapping_id UUID;
BEGIN
  SET search_path = public;
  
  -- Upsert (insert or update)
  INSERT INTO public.product_mapping (
    company_id,
    shopify_variant_id,
    stockeasy_sku,
    shopify_product_id,
    shopify_sku
  )
  VALUES (
    p_company_id,
    p_shopify_variant_id,
    p_stockeasy_sku,
    p_shopify_product_id,
    p_shopify_sku
  )
  ON CONFLICT (company_id, shopify_variant_id) 
  DO UPDATE SET
    stockeasy_sku = EXCLUDED.stockeasy_sku,
    shopify_product_id = COALESCE(EXCLUDED.shopify_product_id, product_mapping.shopify_product_id),
    shopify_sku = COALESCE(EXCLUDED.shopify_sku, product_mapping.shopify_sku),
    updated_at = NOW()
  RETURNING id INTO v_mapping_id;
  
  RETURN v_mapping_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.upsert_product_mapping IS 
'Crée ou met à jour un mapping entre un variant Shopify et un SKU StockEasy.
Paramètres:
- p_company_id: UUID de la company
- p_shopify_variant_id: variant_id du variant Shopify (PAS lineItem.id)
- p_stockeasy_sku: SKU du produit StockEasy
Retourne: UUID du mapping créé/mis à jour';

-- ============================================
-- 3. FONCTION : TROUVER SKU PAR VARIANT ID
-- ============================================

CREATE OR REPLACE FUNCTION public.get_stockeasy_sku_by_variant_id(
  p_company_id UUID,
  p_shopify_variant_id TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_sku TEXT;
BEGIN
  SET search_path = public;
  
  SELECT stockeasy_sku INTO v_sku
  FROM public.product_mapping
  WHERE company_id = p_company_id
    AND shopify_variant_id = p_shopify_variant_id
  LIMIT 1;
  
  RETURN v_sku;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_stockeasy_sku_by_variant_id IS 
'Trouve le SKU StockEasy à partir du variant_id Shopify.
Utilisé lors du traitement des commandes Shopify pour mapper les line items.
Paramètres:
- p_company_id: UUID de la company
- p_shopify_variant_id: variant_id du line item (lineItem.variant_id)
Retourne: SKU StockEasy ou NULL si non trouvé';

-- ============================================
-- 4. FONCTION : TROUVER VARIANT ID PAR SKU
-- ============================================

CREATE OR REPLACE FUNCTION public.get_variant_id_by_stockeasy_sku(
  p_company_id UUID,
  p_stockeasy_sku TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_variant_id TEXT;
BEGIN
  SET search_path = public;
  
  SELECT shopify_variant_id INTO v_variant_id
  FROM public.product_mapping
  WHERE company_id = p_company_id
    AND stockeasy_sku = p_stockeasy_sku
  LIMIT 1;
  
  RETURN v_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_variant_id_by_stockeasy_sku IS 
'Trouve le variant_id Shopify à partir du SKU StockEasy.
Utilisé pour synchroniser les stocks StockEasy → Shopify.';

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.product_mapping ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne voient que les mappings de leur company
DROP POLICY IF EXISTS "Users can view mappings for their company" ON public.product_mapping;
CREATE POLICY "Users can view mappings for their company"
  ON public.product_mapping FOR SELECT
  USING (
    company_id = public.get_current_user_company_id()
  );

-- Policy: Les utilisateurs peuvent créer/mettre à jour les mappings de leur company
DROP POLICY IF EXISTS "Users can manage mappings for their company" ON public.product_mapping;
CREATE POLICY "Users can manage mappings for their company"
  ON public.product_mapping FOR ALL
  USING (
    company_id = public.get_current_user_company_id()
  )
  WITH CHECK (
    company_id = public.get_current_user_company_id()
  );

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_mapping TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_product_mapping TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stockeasy_sku_by_variant_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_variant_id_by_stockeasy_sku TO authenticated;

-- ============================================
-- 7. TRIGGER POUR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_product_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_mapping_updated_at ON public.product_mapping;
CREATE TRIGGER trigger_update_product_mapping_updated_at
  BEFORE UPDATE ON public.product_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_mapping_updated_at();

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 063: Table product_mapping créée avec succès';
  RAISE NOTICE '📝 IMPORTANT: Utiliser lineItem.variant_id, PAS lineItem.id pour le mapping';
END $$;

















