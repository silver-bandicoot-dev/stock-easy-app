-- Migration: 035_add_foreign_key_indexes.sql
-- Objectif: Ajouter des index sur les clés étrangères non indexées
-- 
-- Problème: Les clés étrangères sans index ralentissent les opérations DELETE/UPDATE
-- Solution: Créer des index sur les colonnes de clés étrangères

-- ============================================================================
-- COMMANDES.reconciliation_confirmed_by
-- ============================================================================

-- Vérifier si la colonne existe et créer l'index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'commandes' 
      AND column_name = 'reconciliation_confirmed_by'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_commandes_reconciliation_confirmed_by 
      ON public.commandes(reconciliation_confirmed_by)
      WHERE reconciliation_confirmed_by IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- COMPANIES.owner_id
-- ============================================================================

-- Vérifier si la colonne existe et créer l'index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'companies' 
      AND column_name = 'owner_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_companies_owner_id 
      ON public.companies(owner_id)
      WHERE owner_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- SALES_HISTORY.sku
-- ============================================================================

-- Vérifier si la colonne existe et créer l'index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'sales_history' 
      AND column_name = 'sku'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_sales_history_sku 
      ON public.sales_history(sku)
      WHERE sku IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- Les index partiels (WHERE ... IS NOT NULL) sont utilisés car:
-- 1. Ils sont plus petits et plus rapides
-- 2. Les valeurs NULL ne sont généralement pas recherchées via ces colonnes
-- 3. Les clés étrangères peuvent être NULL dans certains cas
-- 
-- Si vous avez besoin de rechercher les valeurs NULL, supprimez la clause WHERE.

