-- Migration: 033_optimize_rls_auth_calls.sql
-- Objectif: Optimiser les appels auth.uid() dans les politiques RLS
-- 
-- Problème: Les appels auth.uid() et current_setting() sont réévalués pour chaque ligne
-- Solution: Utiliser (select auth.uid()) pour forcer l'évaluation une seule fois

-- ============================================================================
-- ORDER_COMMENTS
-- ============================================================================

-- Optimiser allow_authenticated_insert_comments
-- Note: Si cette politique n'existe plus (supprimée par migration 032), 
-- cette partie peut être ignorée ou adaptée
DO $$
BEGIN
  -- Vérifier si la politique existe avant de la modifier
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_comments' 
      AND policyname = 'allow_authenticated_insert_comments'
  ) THEN
    -- Recréer la politique avec l'optimisation
    DROP POLICY IF EXISTS allow_authenticated_insert_comments ON public.order_comments;
    
    CREATE POLICY allow_authenticated_insert_comments ON public.order_comments
      FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

-- Optimiser allow_own_delete_comments
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_comments' 
      AND policyname = 'allow_own_delete_comments'
  ) THEN
    DROP POLICY IF EXISTS allow_own_delete_comments ON public.order_comments;
    
    CREATE POLICY allow_own_delete_comments ON public.order_comments
      FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- Optimiser allow_own_update_comments
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_comments' 
      AND policyname = 'allow_own_update_comments'
  ) THEN
    DROP POLICY IF EXISTS allow_own_update_comments ON public.order_comments;
    
    CREATE POLICY allow_own_update_comments ON public.order_comments
      FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Optimiser allow_delete_own_notifications
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'notifications' 
      AND policyname = 'allow_delete_own_notifications'
  ) THEN
    DROP POLICY IF EXISTS allow_delete_own_notifications ON public.notifications;
    
    CREATE POLICY allow_delete_own_notifications ON public.notifications
      FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- Optimiser allow_read_own_notifications
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'notifications' 
      AND policyname = 'allow_read_own_notifications'
  ) THEN
    DROP POLICY IF EXISTS allow_read_own_notifications ON public.notifications;
    
    CREATE POLICY allow_read_own_notifications ON public.notifications
      FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- Optimiser allow_update_own_notifications
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'notifications' 
      AND policyname = 'allow_update_own_notifications'
  ) THEN
    DROP POLICY IF EXISTS allow_update_own_notifications ON public.notifications;
    
    CREATE POLICY allow_update_own_notifications ON public.notifications
      FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- Cette migration utilise des blocs DO pour vérifier l'existence des politiques
-- avant de les modifier, ce qui évite les erreurs si certaines politiques
-- ont déjà été supprimées par la migration 032.
-- 
-- L'optimisation (select auth.uid()) force PostgreSQL à évaluer auth.uid()
-- une seule fois au début de la requête plutôt que pour chaque ligne.

