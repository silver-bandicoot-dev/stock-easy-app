-- Migration: 037_fix_remaining_order_comments_policies.sql
-- Objectif: Résoudre les 2 dernières politiques RLS dupliquées sur order_comments
-- 
-- Problème: Il reste 2 politiques dupliquées:
--   - DELETE: {allow_authenticated_all_comments, allow_own_delete_comments}
--   - UPDATE: {allow_authenticated_all_comments, allow_own_update_comments}
-- 
-- Solution: Vérifier si allow_authenticated_all_comments couvre déjà tous les cas.
-- Si oui, supprimer allow_own_*. Sinon, fusionner les deux.

-- ============================================================================
-- VÉRIFICATION ET FUSION DES POLITIQUES
-- ============================================================================

-- Option 1: Si allow_authenticated_all_comments couvre déjà tous les cas,
-- supprimer les politiques allow_own_* qui sont redondantes

DO $$
BEGIN
  -- Vérifier si allow_authenticated_all_comments existe et couvre DELETE
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_comments' 
      AND policyname = 'allow_authenticated_all_comments'
      AND cmd = 'DELETE'
  ) THEN
    -- Supprimer allow_own_delete_comments si elle est redondante
    DROP POLICY IF EXISTS allow_own_delete_comments ON public.order_comments;
    RAISE NOTICE 'Politique allow_own_delete_comments supprimée (redondante avec allow_authenticated_all_comments)';
  END IF;
  
  -- Vérifier si allow_authenticated_all_comments existe et couvre UPDATE
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_comments' 
      AND policyname = 'allow_authenticated_all_comments'
      AND cmd = 'UPDATE'
  ) THEN
    -- Supprimer allow_own_update_comments si elle est redondante
    DROP POLICY IF EXISTS allow_own_update_comments ON public.order_comments;
    RAISE NOTICE 'Politique allow_own_update_comments supprimée (redondante avec allow_authenticated_all_comments)';
  END IF;
END $$;

-- ============================================================================
-- ALTERNATIVE: Si allow_own_* a des restrictions spécifiques importantes
-- ============================================================================

-- Si les politiques allow_own_* ont des restrictions spécifiques (ex: user_id = auth.uid())
-- et que allow_authenticated_all_comments ne les a pas, alors il faut:
-- 1. Soit modifier allow_authenticated_all_comments pour inclure ces restrictions
-- 2. Soit supprimer allow_authenticated_all_comments et garder allow_own_*

-- Pour vérifier les restrictions actuelles:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'order_comments';

-- Si vous préférez garder les restrictions spécifiques, décommentez ceci:
-- DROP POLICY IF EXISTS allow_authenticated_all_comments ON public.order_comments;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- Cette migration supprime les politiques allow_own_* en supposant que
-- allow_authenticated_all_comments couvre déjà tous les cas.
-- 
-- Si vous avez besoin de restrictions spécifiques (ex: un utilisateur ne peut
-- modifier que ses propres commentaires), vous devrez:
-- 1. Vérifier la définition actuelle de allow_authenticated_all_comments
-- 2. La modifier pour inclure la restriction user_id = auth.uid() si nécessaire
-- 3. Ou garder allow_own_* et supprimer allow_authenticated_all_comments
-- 
-- Pour voir les politiques actuelles:
-- SELECT * FROM pg_policies WHERE tablename = 'order_comments';

