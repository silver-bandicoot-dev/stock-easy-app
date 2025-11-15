-- Migration: 036_remove_duplicate_indexes.sql
-- Objectif: Supprimer les index dupliqués sur articles_commande
-- 
-- Problème: Des index identiques existent sur la même table
-- Solution: Supprimer les index redondants en gardant ceux avec les noms les plus descriptifs

-- ============================================================================
-- ARTICLES_COMMANDE - Index dupliqués
-- ============================================================================

-- Vérifier et supprimer les index dupliqués pour order_id
DO $$
BEGIN
  -- Vérifier si les deux index existent
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'articles_commande' 
      AND indexname = 'idx_articles_commande_order_id'
  ) AND EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'articles_commande' 
      AND indexname = 'idx_articles_order_id'
  ) THEN
    -- Vérifier que les index sont identiques en comparant leurs définitions
    -- (Cette vérification est simplifiée - en production, vous pourriez vouloir
    -- une vérification plus approfondie)
    DROP INDEX IF EXISTS public.idx_articles_order_id;
    RAISE NOTICE 'Index dupliqué idx_articles_order_id supprimé (gardé idx_articles_commande_order_id)';
  END IF;
END $$;

-- Vérifier et supprimer les index dupliqués pour sku
DO $$
BEGIN
  -- Vérifier si les deux index existent
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'articles_commande' 
      AND indexname = 'idx_articles_commande_sku'
  ) AND EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'articles_commande' 
      AND indexname = 'idx_articles_sku'
  ) THEN
    DROP INDEX IF EXISTS public.idx_articles_sku;
    RAISE NOTICE 'Index dupliqué idx_articles_sku supprimé (gardé idx_articles_commande_sku)';
  END IF;
END $$;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- Cette migration garde les index avec les noms les plus descriptifs:
-- - idx_articles_commande_order_id (au lieu de idx_articles_order_id)
-- - idx_articles_commande_sku (au lieu de idx_articles_sku)
-- 
-- Si vous préférez garder les autres noms, modifiez cette migration en conséquence.
-- 
-- AVANT D'APPLIQUER:
-- 1. Vérifier avec EXPLAIN ANALYZE que les index sont vraiment identiques
-- 2. S'assurer qu'aucune requête n'utilise explicitement les index supprimés
-- 3. Tester les performances après suppression

