-- ============================================
-- Migration 076: Ajouter colonnes Shopify à sales_history et permettre les annulations
-- ============================================
-- Cette migration est CRITIQUE pour le fonctionnement de l'intégration Shopify:
-- 1. Ajoute les colonnes shopify_order_id et shopify_line_item_id pour éviter les doublons
-- 2. Modifie la contrainte CHECK pour permettre les quantités négatives (annulations/remboursements)
-- 3. Ajoute une contrainte unique pour éviter les doublons de synchronisation Shopify
-- ============================================

-- ============================================
-- 1. AJOUTER LES COLONNES SHOPIFY
-- ============================================

-- Colonne pour l'ID de la commande Shopify
ALTER TABLE public.sales_history 
ADD COLUMN IF NOT EXISTS shopify_order_id TEXT;

-- Colonne pour l'ID du line item Shopify
ALTER TABLE public.sales_history 
ADD COLUMN IF NOT EXISTS shopify_line_item_id TEXT;

-- Index pour améliorer les performances des requêtes sur les colonnes Shopify
CREATE INDEX IF NOT EXISTS idx_sales_history_shopify_order_id 
ON public.sales_history(shopify_order_id) WHERE shopify_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_history_shopify_line_item_id 
ON public.sales_history(shopify_line_item_id) WHERE shopify_line_item_id IS NOT NULL;

-- Index composite pour la contrainte unique
CREATE INDEX IF NOT EXISTS idx_sales_history_shopify_unique 
ON public.sales_history(company_id, shopify_order_id, shopify_line_item_id) 
WHERE shopify_order_id IS NOT NULL AND shopify_line_item_id IS NOT NULL;

-- ============================================
-- 2. MODIFIER LA CONTRAINTE CHECK POUR PERMETTRE LES QUANTITÉS NÉGATIVES
-- ============================================
-- Les quantités négatives sont nécessaires pour:
-- - Les annulations de commandes (orders/cancelled)
-- - Les remboursements (refunds/create)
-- - Les ajustements d'inventaire

-- Supprimer l'ancienne contrainte si elle existe
DO $$
BEGIN
  -- Trouver et supprimer la contrainte CHECK sur quantity
  IF EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_schema = 'public' 
      AND constraint_name LIKE '%sales_history%quantity%'
  ) THEN
    -- Essayer de supprimer la contrainte par son nom probable
    BEGIN
      ALTER TABLE public.sales_history DROP CONSTRAINT IF EXISTS sales_history_quantity_check;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Contrainte sales_history_quantity_check non trouvée';
    END;
    
    BEGIN
      ALTER TABLE public.sales_history DROP CONSTRAINT IF EXISTS sales_history_quantity_check1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Contrainte sales_history_quantity_check1 non trouvée';
    END;
  END IF;
END $$;

-- Rechercher et supprimer toute contrainte CHECK sur la colonne quantity
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN 
    SELECT con.conname
    FROM pg_catalog.pg_constraint con
    INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'sales_history'
      AND con.contype = 'c'  -- CHECK constraint
      AND pg_get_constraintdef(con.oid) LIKE '%quantity%'
  LOOP
    EXECUTE format('ALTER TABLE public.sales_history DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
    RAISE NOTICE 'Supprimée contrainte: %', constraint_rec.conname;
  END LOOP;
END $$;

-- Note: On ne remet PAS de contrainte CHECK sur quantity car:
-- - Les quantités négatives sont légitimes (annulations, remboursements)
-- - La validation est faite au niveau applicatif dans Gadget (validation.js)

-- ============================================
-- 3. AJOUTER LA CONTRAINTE UNIQUE POUR ÉVITER LES DOUBLONS SHOPIFY
-- ============================================
-- Cette contrainte empêche d'insérer deux fois la même ligne de commande Shopify
-- Note: On utilise une contrainte partielle car shopify_order_id et shopify_line_item_id
-- peuvent être NULL pour les entrées manuelles

DO $$
BEGIN
  -- Supprimer d'abord les potentiels doublons avant d'ajouter la contrainte
  -- Garde seulement la première entrée (la plus ancienne) pour chaque combinaison
  DELETE FROM public.sales_history a
  USING public.sales_history b
  WHERE a.id > b.id
    AND a.company_id = b.company_id
    AND a.shopify_order_id IS NOT NULL
    AND a.shopify_line_item_id IS NOT NULL
    AND a.shopify_order_id = b.shopify_order_id
    AND a.shopify_line_item_id = b.shopify_line_item_id;
    
  RAISE NOTICE 'Doublons supprimés';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Pas de doublons à supprimer ou erreur: %', SQLERRM;
END $$;

-- Créer la contrainte unique partielle (seulement pour les entrées Shopify)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sales_history_shopify_unique'
  ) THEN
    -- Utiliser un index unique partiel plutôt qu'une contrainte UNIQUE
    -- car on veut ignorer les NULL
    CREATE UNIQUE INDEX IF NOT EXISTS sales_history_shopify_unique 
    ON public.sales_history(company_id, shopify_order_id, shopify_line_item_id) 
    WHERE shopify_order_id IS NOT NULL AND shopify_line_item_id IS NOT NULL;
    
    RAISE NOTICE 'Index unique créé: sales_history_shopify_unique';
  END IF;
END $$;

-- ============================================
-- 4. AJOUTER COLONNE last_modified_by POUR LE TRACKING
-- ============================================

ALTER TABLE public.sales_history 
ADD COLUMN IF NOT EXISTS last_modified_by TEXT;

COMMENT ON COLUMN public.sales_history.last_modified_by IS 
'Source de la dernière modification: shopify, stockeasy, manual, gadget';

-- ============================================
-- 5. COMMENTAIRES DE DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.sales_history.shopify_order_id IS 
'ID de la commande Shopify. Peut inclure le suffixe "_cancel" pour les annulations.';

COMMENT ON COLUMN public.sales_history.shopify_line_item_id IS 
'ID du line item Shopify. Utilisé avec shopify_order_id pour éviter les doublons.';

COMMENT ON TABLE public.sales_history IS 
'Historique des ventes. Les quantités peuvent être négatives pour les annulations et remboursements. 
Les colonnes shopify_order_id et shopify_line_item_id permettent d''éviter les doublons lors de la synchro Shopify.';

-- ============================================
-- 6. VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  col_count INTEGER;
BEGIN
  -- Vérifier que les colonnes existent
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'sales_history'
    AND column_name IN ('shopify_order_id', 'shopify_line_item_id', 'last_modified_by');
    
  IF col_count = 3 THEN
    RAISE NOTICE '✅ Migration 076 terminée avec succès:';
    RAISE NOTICE '   - Colonnes shopify_order_id et shopify_line_item_id ajoutées';
    RAISE NOTICE '   - Contrainte CHECK sur quantity supprimée (quantités négatives autorisées)';
    RAISE NOTICE '   - Index unique pour éviter les doublons Shopify créé';
    RAISE NOTICE '   - Colonne last_modified_by ajoutée';
  ELSE
    RAISE WARNING '⚠️ Migration 076: Certaines colonnes sont manquantes (%/3)', col_count;
  END IF;
END $$;

