-- ============================================
-- Migration 056: Corriger les Security et Performance Advisors
-- ============================================
-- Cette migration corrige les 20 problèmes détectés par Supabase Advisors:
-- 
-- SÉCURITÉ (14 problèmes):
-- - 13 fonctions avec search_path mutable
-- - 1 protection contre les mots de passe divulgués désactivée (action manuelle requise)
--
-- PERFORMANCE (11 problèmes):
-- - 6 politiques RLS qui réévaluent auth.uid() pour chaque ligne
-- - 11 index non utilisés (documentés mais non supprimés automatiquement)
--
-- Références:
-- - Security: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- - Performance: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================

-- ============================================
-- 1. CORRIGER LES FONCTIONS AVEC SEARCH_PATH MUTABLE
-- ============================================
-- Ces fonctions ont SET search_path dans leur définition mais n'ont pas été
-- configurées avec ALTER FUNCTION ... SET search_path = public

-- Fonction trigger pour auto-set company_id
ALTER FUNCTION public.auto_set_company_id() SET search_path = public;

-- Fonctions de calcul des ventes
ALTER FUNCTION public.calculate_ventes_jour_ajustees() SET search_path = public;
ALTER FUNCTION public.calculate_ventes_jour_moy_30j() SET search_path = public;
ALTER FUNCTION public.update_ventes_jour_moy_30j_on_sales_change() SET search_path = public;

-- Fonction de création d'entreprise
ALTER FUNCTION public.create_company_for_user() SET search_path = public;

-- Fonction de récupération de données
ALTER FUNCTION public.get_all_data() SET search_path = public;

-- Fonctions de gestion des membres d'équipe
ALTER FUNCTION public.delete_team_member(p_user_id uuid) SET search_path = public;
ALTER FUNCTION public.delete_team_member_rpc(p_target_user_id uuid) SET search_path = public;
ALTER FUNCTION public.can_admin_delete_user(p_target_user_id uuid) SET search_path = public;

-- Fonctions de recalcul des produits
ALTER FUNCTION public.recalculate_products_on_parameter_change() SET search_path = public;
ALTER FUNCTION public.recalculate_products_on_supplier_change() SET search_path = public;

-- Fonction de notifications
ALTER FUNCTION public.notify_mentioned_users() SET search_path = public;

-- Fonction de calcul de métriques avancées
ALTER FUNCTION public.calculate_advanced_product_metrics() SET search_path = public;

-- ============================================
-- 2. OPTIMISER LES POLITIQUES RLS POUR LA PERFORMANCE
-- ============================================
-- Remplacer auth.uid() par (select auth.uid()) pour éviter la réévaluation
-- pour chaque ligne. Cela force PostgreSQL à évaluer auth.uid() une seule fois.

-- ============================================
-- 2.1. POLITIQUES ORDER_COMMENTS
-- ============================================

-- Optimiser "Users can only insert comments for their company"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_comments' 
      AND policyname = 'Users can only insert comments for their company'
  ) THEN
    DROP POLICY IF EXISTS "Users can only insert comments for their company" ON public.order_comments;
    
    CREATE POLICY "Users can only insert comments for their company"
      ON public.order_comments FOR INSERT
      WITH CHECK (
        company_id = public.get_current_user_company_id()
        AND (select auth.uid()) = user_id
      );
  END IF;
END $$;

-- Optimiser "Users can only update their own comments in their company"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_comments' 
      AND policyname = 'Users can only update their own comments in their company'
  ) THEN
    DROP POLICY IF EXISTS "Users can only update their own comments in their company" ON public.order_comments;
    
    CREATE POLICY "Users can only update their own comments in their company"
      ON public.order_comments FOR UPDATE
      USING (
        company_id = public.get_current_user_company_id()
        AND (select auth.uid()) = user_id
      )
      WITH CHECK (
        company_id = public.get_current_user_company_id()
        AND (select auth.uid()) = user_id
      );
  END IF;
END $$;

-- Optimiser "Users can only delete their own comments in their company"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_comments' 
      AND policyname = 'Users can only delete their own comments in their company'
  ) THEN
    DROP POLICY IF EXISTS "Users can only delete their own comments in their company" ON public.order_comments;
    
    CREATE POLICY "Users can only delete their own comments in their company"
      ON public.order_comments FOR DELETE
      USING (
        company_id = public.get_current_user_company_id()
        AND (select auth.uid()) = user_id
      );
  END IF;
END $$;

-- ============================================
-- 2.2. POLITIQUES NOTIFICATIONS
-- ============================================

-- Optimiser "Users can only see notifications for their company"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'notifications' 
      AND policyname = 'Users can only see notifications for their company'
  ) THEN
    DROP POLICY IF EXISTS "Users can only see notifications for their company" ON public.notifications;
    
    CREATE POLICY "Users can only see notifications for their company"
      ON public.notifications FOR SELECT
      USING (
        company_id = public.get_current_user_company_id()
        AND (select auth.uid()) = user_id
      );
  END IF;
END $$;

-- Optimiser "Users can only update their own notifications in their company"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'notifications' 
      AND policyname = 'Users can only update their own notifications in their company'
  ) THEN
    DROP POLICY IF EXISTS "Users can only update their own notifications in their company" ON public.notifications;
    
    CREATE POLICY "Users can only update their own notifications in their company"
      ON public.notifications FOR UPDATE
      USING (
        company_id = public.get_current_user_company_id()
        AND (select auth.uid()) = user_id
      )
      WITH CHECK (
        company_id = public.get_current_user_company_id()
        AND (select auth.uid()) = user_id
      );
  END IF;
END $$;

-- Optimiser "Users can only delete their own notifications in their company"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'notifications' 
      AND policyname = 'Users can only delete their own notifications in their company'
  ) THEN
    DROP POLICY IF EXISTS "Users can only delete their own notifications in their company" ON public.notifications;
    
    CREATE POLICY "Users can only delete their own notifications in their company"
      ON public.notifications FOR DELETE
      USING (
        company_id = public.get_current_user_company_id()
        AND (select auth.uid()) = user_id
      );
  END IF;
END $$;

-- ============================================
-- 3. INDEX NON UTILISÉS (DOCUMENTATION)
-- ============================================
-- Les index suivants n'ont pas été utilisés selon les statistiques PostgreSQL.
-- Ils sont documentés ici mais ne sont PAS supprimés automatiquement car:
-- 1. Ils pourraient être utiles pour des requêtes futures
-- 2. Ils pourraient être utilisés par des requêtes qui ne sont pas encore exécutées
-- 3. La suppression doit être décidée manuellement après analyse
--
-- Index non utilisés détectés:
-- - idx_articles_commande_sku sur articles_commande
-- - idx_commandes_reconciliation_confirmed_by sur commandes
-- - idx_companies_owner_id sur companies
-- - idx_commandes_warehouse_id sur commandes
-- - idx_order_comments_user_id sur order_comments
-- - idx_produits_fournisseur sur produits
-- - idx_user_profiles_company_id sur user_profiles
-- - idx_order_comments_company_id sur order_comments
-- - idx_fournisseurs_company_id sur fournisseurs
-- - idx_warehouses_company_id sur warehouses
-- - idx_parametres_company_id sur parametres
-- - idx_sku_fournisseurs_company_id sur sku_fournisseurs
--
-- Pour analyser l'utilisation d'un index:
-- SELECT * FROM pg_stat_user_indexes WHERE indexrelname = 'nom_index';
--
-- Pour supprimer un index non utilisé (après vérification):
-- DROP INDEX IF EXISTS public.nom_index;

-- ============================================
-- 4. PROTECTION CONTRE LES MOTS DE PASSE DIVULGUÉS
-- ============================================
-- Cette protection doit être activée manuellement dans le Supabase Dashboard:
-- 1. Aller dans Authentication → Settings → Password Strength
-- 2. Activer "Check for leaked passwords"
-- 
-- Cette fonctionnalité vérifie les mots de passe contre la base de données HaveIBeenPwned
-- pour empêcher l'utilisation de mots de passe compromis.
--
-- Référence: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

-- ============================================
-- 5. COMMENTAIRES ET VALIDATION
-- ============================================

COMMENT ON SCHEMA public IS 'Migration 056: Toutes les fonctions ont maintenant SET search_path = public pour la sécurité, et les politiques RLS sont optimisées pour la performance';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 056 terminée:';
  RAISE NOTICE '   - 13 fonctions corrigées pour search_path mutable';
  RAISE NOTICE '   - 6 politiques RLS optimisées pour la performance';
  RAISE NOTICE '   - 11 index non utilisés documentés (non supprimés)';
  RAISE NOTICE '⚠️  Action manuelle requise: Activer la protection contre les mots de passe divulgués dans Supabase Dashboard';
END $$;


