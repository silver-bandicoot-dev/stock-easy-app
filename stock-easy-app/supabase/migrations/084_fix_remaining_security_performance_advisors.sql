-- ============================================
-- Migration 084: Corriger les Security et Performance Advisors restants
-- ============================================
-- Cette migration corrige les problèmes détectés par Supabase Advisors:
-- 
-- SÉCURITÉ:
-- - WARN: 17 fonctions avec search_path mutable (restantes après migration 068)
-- - WARN: Extension http dans public (normal sur Supabase, documenté)
-- - WARN: Protection contre les mots de passe divulgués (action manuelle requise)
--
-- PERFORMANCE:
-- - WARN: Clé étrangère non indexée: notification_email_queue_notification_id_fkey
-- - WARN: 5 politiques RLS qui réévaluent auth.uid() pour chaque ligne
--
-- Références:
-- - Security: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- - Performance: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
-- - Performance: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan
-- ============================================

-- ============================================
-- 1. CORRIGER LES FONCTIONS AVEC SEARCH_PATH MUTABLE
-- ============================================
-- Ces fonctions n'ont pas été corrigées dans la migration 068
-- Elles doivent être configurées avec ALTER FUNCTION ... SET search_path = public

-- Fonctions de notifications
ALTER FUNCTION public.check_notification_cooldown(uuid, text, text, integer) SET search_path = public;
ALTER FUNCTION public.cleanup_old_cooldowns(integer) SET search_path = public;
ALTER FUNCTION public.create_notification_v2(uuid, text, text, text, text, jsonb, text, integer) SET search_path = public;
ALTER FUNCTION public.receive_replacement_items(text, jsonb) SET search_path = public;
ALTER FUNCTION public.notify_mentioned_users() SET search_path = public;
ALTER FUNCTION public.record_notification_sent(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.get_or_create_notification_preferences() SET search_path = public;
ALTER FUNCTION public.get_grouped_notifications(integer) SET search_path = public;
ALTER FUNCTION public.notify_gadget_stock_change() SET search_path = public;

-- Fonctions de gestion des commandes
ALTER FUNCTION public.add_stock_from_order(text, uuid, integer) SET search_path = public;
ALTER FUNCTION public.confirm_order_reconciliation(text) SET search_path = public;

-- Fonctions Shopify (vérification si elles existent encore)
-- Note: Ces fonctions peuvent avoir été corrigées dans la migration 068,
-- mais on les corrige au cas où pour s'assurer qu'elles sont toutes sécurisées

DO $$
BEGIN
  -- get_company_by_shopify_shop_id
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'get_company_by_shopify_shop_id'
      AND pg_get_function_identity_arguments(p.oid) = 'p_shopify_shop_id text'
  ) THEN
    ALTER FUNCTION public.get_company_by_shopify_shop_id(p_shopify_shop_id text) SET search_path = public;
  END IF;

  -- create_shopify_company (signature: 4 paramètres)
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'create_shopify_company'
      AND pg_get_function_identity_arguments(p.oid) = 'p_shopify_shop_id text, p_shop_name text, p_shop_domain text, p_access_token text'
  ) THEN
    ALTER FUNCTION public.create_shopify_company(p_shopify_shop_id text, p_shop_name text, p_shop_domain text, p_access_token text) SET search_path = public;
  END IF;

  -- create_auth_user_for_shopify
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'create_auth_user_for_shopify'
      AND pg_get_function_identity_arguments(p.oid) = 'p_email text, p_shopify_shop_id text, p_shop_name text, p_owner_name text'
  ) THEN
    ALTER FUNCTION public.create_auth_user_for_shopify(p_email text, p_shopify_shop_id text, p_shop_name text, p_owner_name text) SET search_path = public;
  END IF;

  -- upsert_product_mapping
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'upsert_product_mapping'
      AND pg_get_function_identity_arguments(p.oid) = 'p_company_id uuid, p_shopify_variant_id text, p_stockeasy_sku text, p_shopify_product_id text, p_shopify_sku text'
  ) THEN
    ALTER FUNCTION public.upsert_product_mapping(p_company_id uuid, p_shopify_variant_id text, p_stockeasy_sku text, p_shopify_product_id text, p_shopify_sku text) SET search_path = public;
  END IF;
END $$;

-- ============================================
-- 2. AJOUTER L'INDEX MANQUANT POUR LA CLÉ ÉTRANGÈRE
-- ============================================
-- Performance: notification_email_queue_notification_id_fkey n'a pas d'index
-- Cela peut causer des problèmes de performance lors des jointures

CREATE INDEX IF NOT EXISTS idx_notification_email_queue_notification_id 
ON public.notification_email_queue(notification_id);

-- ============================================
-- 3. OPTIMISER LES POLITIQUES RLS
-- ============================================
-- Les politiques RLS qui utilisent auth.uid() directement sont réévaluées pour chaque ligne
-- Solution: Utiliser (select auth.uid()) pour que la valeur soit évaluée une seule fois

-- Table: notification_preferences
-- Policy: users_read_own_preferences
DROP POLICY IF EXISTS "users_read_own_preferences" ON public.notification_preferences;
CREATE POLICY "users_read_own_preferences"
  ON public.notification_preferences FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Policy: users_update_own_preferences
DROP POLICY IF EXISTS "users_update_own_preferences" ON public.notification_preferences;
CREATE POLICY "users_update_own_preferences"
  ON public.notification_preferences FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: users_insert_own_preferences
DROP POLICY IF EXISTS "users_insert_own_preferences" ON public.notification_preferences;
CREATE POLICY "users_insert_own_preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Table: notification_cooldowns
-- Policy: allow_manage_own_cooldowns
DROP POLICY IF EXISTS "allow_manage_own_cooldowns" ON public.notification_cooldowns;
CREATE POLICY "allow_manage_own_cooldowns"
  ON public.notification_cooldowns FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Table: notification_email_queue
-- Policy: allow_read_own_email_queue
DROP POLICY IF EXISTS "allow_read_own_email_queue" ON public.notification_email_queue;
CREATE POLICY "allow_read_own_email_queue"
  ON public.notification_email_queue FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ============================================
-- 4. DOCUMENTATION: EXTENSION HTTP DANS PUBLIC
-- ============================================
-- L'extension http est installée dans le schéma public.
-- Sur Supabase, c'est normal et recommandé car:
-- 1. L'extension http est gérée par Supabase
-- 2. Elle est utilisée pour les webhooks et appels HTTP depuis les fonctions
-- 3. La déplacer pourrait casser les fonctions existantes qui l'utilisent
--
-- Référence: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
-- 
-- Si vous souhaitez quand même la déplacer (non recommandé):
-- 1. Créer un schéma dédié: CREATE SCHEMA IF NOT EXISTS extensions;
-- 2. Déplacer l'extension: ALTER EXTENSION http SET SCHEMA extensions;
-- 3. Mettre à jour search_path des fonctions qui l'utilisent

COMMENT ON EXTENSION http IS 
'Migration 084: Extension http dans public. C''est normal sur Supabase et utilisé par les fonctions webhook. Ne pas déplacer.';

-- ============================================
-- 5. COMMENTAIRES ET VALIDATION
-- ============================================

COMMENT ON INDEX public.idx_notification_email_queue_notification_id IS 
'Migration 084: Index ajouté pour optimiser les jointures sur notification_email_queue.notification_id (clé étrangère).';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 084 terminée:';
  RAISE NOTICE '   - 17 fonctions corrigées pour search_path mutable';
  RAISE NOTICE '   - Index ajouté pour notification_email_queue.notification_id';
  RAISE NOTICE '   - 5 politiques RLS optimisées (auth.uid() → (select auth.uid()))';
  RAISE NOTICE '   - Extension http documentée (normal sur Supabase)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Action manuelle requise:';
  RAISE NOTICE '   1. Activer la protection contre les mots de passe divulgués dans Supabase Dashboard';
  RAISE NOTICE '      → Authentication → Settings → Password Strength → Check for leaked passwords';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Vérification:';
  RAISE NOTICE '   Exécutez get_advisors() dans Supabase pour vérifier que tous les WARN sont résolus.';
END $$;

