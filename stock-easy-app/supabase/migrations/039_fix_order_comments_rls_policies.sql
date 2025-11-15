-- Migration: 039_fix_order_comments_rls_policies.sql
-- Objectif: Résoudre les 2 dernières politiques RLS dupliquées sur order_comments
-- 
-- Problème: 
--   - allow_authenticated_all_comments couvre ALL (SELECT, INSERT, UPDATE, DELETE) avec qual=true
--   - allow_own_delete_comments et allow_own_update_comments sont redondantes
-- 
-- Solution: 
--   Modifier allow_authenticated_all_comments pour qu'elle ne couvre que SELECT et INSERT
--   Garder allow_own_delete_comments et allow_own_update_comments pour les restrictions

-- ============================================================================
-- MODIFIER allow_authenticated_all_comments
-- ============================================================================

-- Supprimer l'ancienne politique ALL qui cause les duplications
DROP POLICY IF EXISTS allow_authenticated_all_comments ON public.order_comments;

-- Créer une politique pour SELECT uniquement (si elle n'existe pas déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_comments' 
      AND policyname = 'allow_authenticated_read_comments'
  ) THEN
    CREATE POLICY allow_authenticated_read_comments ON public.order_comments
      FOR SELECT
      TO authenticated
      USING (true);
    RAISE NOTICE 'Politique allow_authenticated_read_comments créée';
  ELSE
    RAISE NOTICE 'Politique allow_authenticated_read_comments existe déjà';
  END IF;
END $$;

-- Créer ou mettre à jour la politique pour INSERT
-- Note: On garde la restriction user_id = auth.uid() pour la sécurité
-- (un utilisateur ne peut créer que des commentaires avec son propre user_id)
DO $$
BEGIN
  -- Supprimer l'ancienne si elle existe
  DROP POLICY IF EXISTS allow_authenticated_insert_comments ON public.order_comments;
  
  -- Créer une nouvelle politique INSERT avec restriction user_id
  CREATE POLICY allow_authenticated_insert_comments ON public.order_comments
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);
  RAISE NOTICE 'Politique allow_authenticated_insert_comments créée (avec restriction user_id)';
END $$;

-- ============================================================================
-- VÉRIFIER ET GARDER LES POLITIQUES RESTRICTIVES
-- ============================================================================

-- Les politiques allow_own_delete_comments et allow_own_update_comments
-- sont déjà optimisées avec (select auth.uid()) et doivent être gardées
-- car elles restreignent DELETE et UPDATE aux commentaires de l'utilisateur

-- Vérifier que allow_own_delete_comments existe et est optimisée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_comments' 
      AND policyname = 'allow_own_delete_comments'
  ) THEN
    -- Recréer si elle n'existe pas
    CREATE POLICY allow_own_delete_comments ON public.order_comments
      FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
    RAISE NOTICE 'Politique allow_own_delete_comments créée';
  ELSE
    RAISE NOTICE 'Politique allow_own_delete_comments existe déjà';
  END IF;
END $$;

-- Vérifier que allow_own_update_comments existe et est optimisée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_comments' 
      AND policyname = 'allow_own_update_comments'
  ) THEN
    -- Recréer si elle n'existe pas
    CREATE POLICY allow_own_update_comments ON public.order_comments
      FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
    RAISE NOTICE 'Politique allow_own_update_comments créée';
  ELSE
    RAISE NOTICE 'Politique allow_own_update_comments existe déjà';
  END IF;
END $$;

-- ============================================================================
-- RÉSUMÉ DES POLITIQUES FINALES
-- ============================================================================
-- 
-- Après cette migration, order_comments aura les politiques suivantes:
-- 
-- 1. allow_authenticated_read_comments (SELECT)
--    - Permet à tous les utilisateurs authentifiés de lire tous les commentaires
-- 
-- 2. allow_authenticated_insert_comments (INSERT)
--    - Permet à tous les utilisateurs authentifiés de créer des commentaires
-- 
-- 3. allow_own_delete_comments (DELETE)
--    - Permet uniquement de supprimer ses propres commentaires
--    - Optimisée avec (select auth.uid())
-- 
-- 4. allow_own_update_comments (UPDATE)
--    - Permet uniquement de mettre à jour ses propres commentaires
--    - Optimisée avec (select auth.uid())
-- 
-- Plus de duplications ! Chaque action a une seule politique.

