-- Migration: 038_add_remaining_foreign_key_indexes.sql
-- Objectif: Ajouter des index sur les clés étrangères nouvellement détectées
-- 
-- Problème: 4 nouvelles clés étrangères sans index ont été détectées:
--   1. commandes.warehouse_id_fkey
--   2. order_comments.fk_user (user_id)
--   3. produits.fournisseur_fkey
--   4. user_profiles.company_id_fkey
-- 
-- Solution: Créer des index partiels sur ces colonnes

-- ============================================================================
-- COMMANDES.warehouse_id
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'commandes' 
      AND column_name = 'warehouse_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_commandes_warehouse_id 
      ON public.commandes(warehouse_id)
      WHERE warehouse_id IS NOT NULL;
    RAISE NOTICE 'Index créé: idx_commandes_warehouse_id';
  END IF;
END $$;

-- ============================================================================
-- ORDER_COMMENTS.user_id (fk_user)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'order_comments' 
      AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_order_comments_user_id 
      ON public.order_comments(user_id)
      WHERE user_id IS NOT NULL;
    RAISE NOTICE 'Index créé: idx_order_comments_user_id';
  END IF;
END $$;

-- ============================================================================
-- PRODUITS.fournisseur
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'produits' 
      AND column_name = 'fournisseur'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_produits_fournisseur 
      ON public.produits(fournisseur)
      WHERE fournisseur IS NOT NULL;
    RAISE NOTICE 'Index créé: idx_produits_fournisseur';
  END IF;
END $$;

-- ============================================================================
-- USER_PROFILES.company_id
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'company_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id 
      ON public.user_profiles(company_id)
      WHERE company_id IS NOT NULL;
    RAISE NOTICE 'Index créé: idx_user_profiles_company_id';
  END IF;
END $$;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- Ces index partiels (WHERE ... IS NOT NULL) sont optimisés car:
-- 1. Ils sont plus petits et plus rapides
-- 2. Les valeurs NULL ne sont généralement pas recherchées via ces colonnes
-- 3. Les clés étrangères peuvent être NULL dans certains cas
-- 
-- Si vous avez besoin de rechercher les valeurs NULL, supprimez la clause WHERE.
-- 
-- Ces index amélioreront les performances des opérations:
-- - DELETE sur les tables parentes (warehouses, users, fournisseurs, companies)
-- - UPDATE sur les tables parentes
-- - JOINs utilisant ces colonnes

