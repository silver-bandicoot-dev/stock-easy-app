-- ============================================
-- Migration 069: Mettre à jour la structure de unmapped_products
-- ============================================
-- Cette migration met à jour la table unmapped_products pour correspondre
-- aux spécifications de Gadget.
--
-- Changements:
-- - Renommer 'sku' en 'shopify_sku'
-- - Rendre 'product_title' NOT NULL
-- - Ajouter 'first_seen_at'
-- - Ajouter 'created_at' et 'updated_at'
-- - Supprimer 'occurrence_count' (non utilisé)
-- - Ajouter les index manquants
-- - Simplifier les politiques RLS en une seule politique ALL
-- ============================================

-- ============================================
-- 1. AJOUTER LES COLONNES MANQUANTES
-- ============================================

-- Ajouter first_seen_at (utilise last_seen_at comme valeur par défaut si existe)
ALTER TABLE public.unmapped_products 
ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Mettre à jour first_seen_at avec last_seen_at pour les enregistrements existants
UPDATE public.unmapped_products 
SET first_seen_at = COALESCE(last_seen_at, NOW())
WHERE first_seen_at IS NULL;

-- Ajouter created_at
ALTER TABLE public.unmapped_products 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Mettre à jour created_at pour les enregistrements existants
UPDATE public.unmapped_products 
SET created_at = COALESCE(first_seen_at, NOW())
WHERE created_at IS NULL;

-- Ajouter updated_at
ALTER TABLE public.unmapped_products 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Mettre à jour updated_at pour les enregistrements existants
UPDATE public.unmapped_products 
SET updated_at = COALESCE(last_seen_at, NOW())
WHERE updated_at IS NULL;

-- ============================================
-- 2. RENOMMER 'sku' EN 'shopify_sku'
-- ============================================

-- Renommer la colonne si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'unmapped_products' 
      AND column_name = 'sku'
  ) THEN
    ALTER TABLE public.unmapped_products RENAME COLUMN sku TO shopify_sku;
  END IF;
END $$;

-- ============================================
-- 3. MODIFIER LES CONTRAINTES
-- ============================================

-- Rendre product_title NOT NULL (après avoir vérifié qu'il n'y a pas de NULL)
DO $$
BEGIN
  -- Mettre une valeur par défaut pour les product_title NULL
  UPDATE public.unmapped_products 
  SET product_title = 'Produit sans titre'
  WHERE product_title IS NULL;
  
  -- Maintenant on peut rendre la colonne NOT NULL
  ALTER TABLE public.unmapped_products 
  ALTER COLUMN product_title SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Impossible de rendre product_title NOT NULL: %', SQLERRM;
END $$;

-- S'assurer que last_seen_at a une valeur par défaut
ALTER TABLE public.unmapped_products 
ALTER COLUMN last_seen_at SET DEFAULT NOW();

-- S'assurer que first_seen_at a une valeur par défaut
ALTER TABLE public.unmapped_products 
ALTER COLUMN first_seen_at SET DEFAULT NOW();

-- S'assurer que created_at a une valeur par défaut
ALTER TABLE public.unmapped_products 
ALTER COLUMN created_at SET DEFAULT NOW();

-- S'assurer que updated_at a une valeur par défaut
ALTER TABLE public.unmapped_products 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- ============================================
-- 4. SUPPRIMER LA COLONNE occurrence_count (non utilisée)
-- ============================================

ALTER TABLE public.unmapped_products 
DROP COLUMN IF EXISTS occurrence_count;

-- ============================================
-- 5. CRÉER LES INDEX MANQUANTS
-- ============================================

-- Index sur shopify_variant_id
CREATE INDEX IF NOT EXISTS idx_unmapped_products_variant 
ON public.unmapped_products(shopify_variant_id);

-- Index sur last_seen_at (DESC pour trier par plus récent)
CREATE INDEX IF NOT EXISTS idx_unmapped_products_last_seen 
ON public.unmapped_products(last_seen_at DESC);

-- ============================================
-- 6. CRÉER UN TRIGGER POUR UPDATED_AT
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_unmapped_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_unmapped_products_updated_at ON public.unmapped_products;
CREATE TRIGGER trigger_update_unmapped_products_updated_at
  BEFORE UPDATE ON public.unmapped_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_unmapped_products_updated_at();

-- ============================================
-- 7. SIMPLIFIER LES POLITIQUES RLS
-- ============================================
-- Remplacer les 4 politiques séparées par une seule politique ALL

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view unmapped products for their company" ON public.unmapped_products;
DROP POLICY IF EXISTS "Users can insert unmapped products for their company" ON public.unmapped_products;
DROP POLICY IF EXISTS "Users can update unmapped products for their company" ON public.unmapped_products;
DROP POLICY IF EXISTS "Users can delete unmapped products for their company" ON public.unmapped_products;

-- Créer une seule politique ALL (comme demandé par Gadget)
CREATE POLICY "Users can only see unmapped products for their company"
  ON public.unmapped_products FOR ALL
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- ============================================
-- 8. CORRIGER LE SEARCH_PATH DE LA FONCTION
-- ============================================

ALTER FUNCTION public.update_unmapped_products_updated_at() SET search_path = public;

-- ============================================
-- 9. COMMENTAIRES
-- ============================================

COMMENT ON TABLE public.unmapped_products IS 
'Table des produits Shopify non mappés vers StockEasy. Structure conforme aux spécifications Gadget.';

COMMENT ON COLUMN public.unmapped_products.shopify_variant_id IS 
'ID du variant Shopify (variant_id). Identifiant unique par company.';

COMMENT ON COLUMN public.unmapped_products.shopify_sku IS 
'SKU du variant Shopify (optionnel).';

COMMENT ON COLUMN public.unmapped_products.product_title IS 
'Titre du produit Shopify (obligatoire).';

COMMENT ON COLUMN public.unmapped_products.variant_title IS 
'Titre du variant Shopify (optionnel).';

COMMENT ON COLUMN public.unmapped_products.first_seen_at IS 
'Date de première détection du produit non mappé.';

COMMENT ON COLUMN public.unmapped_products.last_seen_at IS 
'Date de dernière détection du produit non mappé.';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 069 terminée:';
  RAISE NOTICE '   - Colonne sku renommée en shopify_sku';
  RAISE NOTICE '   - product_title rendu NOT NULL';
  RAISE NOTICE '   - Colonnes first_seen_at, created_at, updated_at ajoutées';
  RAISE NOTICE '   - Colonne occurrence_count supprimée';
  RAISE NOTICE '   - Index idx_unmapped_products_variant et idx_unmapped_products_last_seen créés';
  RAISE NOTICE '   - Trigger updated_at créé';
  RAISE NOTICE '   - Fonction update_unmapped_products_updated_at avec search_path corrigé';
  RAISE NOTICE '   - Politiques RLS simplifiées en une seule politique ALL';
END $$;

