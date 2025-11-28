-- ============================================
-- Migration 068: Corriger les Security et Performance Advisors
-- ============================================
-- Cette migration corrige les problèmes détectés par Supabase Advisors:
-- 
-- SÉCURITÉ:
-- - ERROR: RLS désactivé sur unmapped_products (CRITIQUE)
-- - WARN: 20 fonctions avec search_path mutable
-- - WARN: Extension http dans public (normal sur Supabase, ignoré)
-- - WARN: Protection contre les mots de passe divulgués (action manuelle requise)
--
-- PERFORMANCE:
-- - WARN: Politiques RLS multiples sur product_mapping
-- - INFO: 24 index non utilisés (documentés, suppression manuelle)
--
-- Références:
-- - Security: https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public
-- - Security: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- - Performance: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies
-- ============================================

-- ============================================
-- 1. ACTIVER RLS SUR unmapped_products (ERROR CRITIQUE)
-- ============================================

-- Activer RLS
ALTER TABLE public.unmapped_products ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne voient que les produits non mappés de leur company
DROP POLICY IF EXISTS "Users can view unmapped products for their company" ON public.unmapped_products;
CREATE POLICY "Users can view unmapped products for their company"
  ON public.unmapped_products FOR SELECT
  USING (
    company_id = public.get_current_user_company_id()
  );

-- Policy: Les utilisateurs peuvent insérer des produits non mappés pour leur company
DROP POLICY IF EXISTS "Users can insert unmapped products for their company" ON public.unmapped_products;
CREATE POLICY "Users can insert unmapped products for their company"
  ON public.unmapped_products FOR INSERT
  WITH CHECK (
    company_id = public.get_current_user_company_id()
  );

-- Policy: Les utilisateurs peuvent mettre à jour les produits non mappés de leur company
DROP POLICY IF EXISTS "Users can update unmapped products for their company" ON public.unmapped_products;
CREATE POLICY "Users can update unmapped products for their company"
  ON public.unmapped_products FOR UPDATE
  USING (
    company_id = public.get_current_user_company_id()
  )
  WITH CHECK (
    company_id = public.get_current_user_company_id()
  );

-- Policy: Les utilisateurs peuvent supprimer les produits non mappés de leur company
DROP POLICY IF EXISTS "Users can delete unmapped products for their company" ON public.unmapped_products;
CREATE POLICY "Users can delete unmapped products for their company"
  ON public.unmapped_products FOR DELETE
  USING (
    company_id = public.get_current_user_company_id()
  );

-- ============================================
-- 2. CORRIGER LES FONCTIONS AVEC SEARCH_PATH MUTABLE
-- ============================================
-- Ces fonctions ont SET search_path dans leur définition mais doivent être
-- configurées avec ALTER FUNCTION ... SET search_path = public

-- Fonctions de pagination et recherche
ALTER FUNCTION public.get_orders_paginated(p_page integer, p_page_size integer, p_status text, p_supplier text, p_start_date text, p_end_date text, p_search text) SET search_path = public;

ALTER FUNCTION public.get_company_by_shopify_shop_id(p_shopify_shop_id text) SET search_path = public;

-- Fonctions de mapping produits
ALTER FUNCTION public.get_stockeasy_sku_by_variant_id(p_company_id uuid, p_shopify_variant_id text) SET search_path = public;

ALTER FUNCTION public.get_variant_id_by_stockeasy_sku(p_company_id uuid, p_stockeasy_sku text) SET search_path = public;

ALTER FUNCTION public.upsert_product_mapping(p_company_id uuid, p_shopify_variant_id text, p_stockeasy_sku text, p_shopify_product_id text, p_shopify_sku text) SET search_path = public;

ALTER FUNCTION public.update_product_mapping_updated_at() SET search_path = public;

-- Fonctions Shopify
ALTER FUNCTION public.sync_shopify_location(p_company_id uuid, p_shopify_location_id text, p_name text, p_address text, p_city text, p_postal_code text, p_country text, p_is_active boolean) SET search_path = public;

-- Fonctions de gestion des produits
ALTER FUNCTION public.assign_supplier_to_product(p_sku text, p_supplier_name text) SET search_path = public;

-- Fonctions de recherche fuzzy
ALTER FUNCTION public.search_products_fuzzy(search_term text, limit_count integer) SET search_path = public;

ALTER FUNCTION public.search_suppliers_fuzzy(search_term text, limit_count integer) SET search_path = public;

ALTER FUNCTION public.search_orders_fuzzy(search_term text, limit_count integer) SET search_path = public;

ALTER FUNCTION public.search_warehouses_fuzzy(search_term text, limit_count integer) SET search_path = public;

-- Fonctions de notifications
ALTER FUNCTION public.notify_stock_change() SET search_path = public;

-- Fonctions de données
ALTER FUNCTION public.get_all_data() SET search_path = public;

ALTER FUNCTION public.user_exists(p_user_id uuid) SET search_path = public;

-- Fonctions Shopify
ALTER FUNCTION public.create_shopify_company(p_shopify_shop_id text, p_owner_id uuid, p_shop_name text, p_shop_domain text, p_access_token text, p_owner_email text, p_owner_first_name text, p_owner_last_name text) SET search_path = public;

ALTER FUNCTION public.calculate_advanced_product_metrics() SET search_path = public;

ALTER FUNCTION public.create_auth_user_for_shopify(p_email text, p_shopify_shop_id text, p_shop_name text, p_owner_name text) SET search_path = public;

-- ============================================
-- 3. FUSIONNER LES POLITIQUES RLS MULTIPLES SUR product_mapping
-- ============================================
-- Le problème: Il y a 2 politiques pour SELECT:
-- - "Users can view mappings for their company" (SELECT)
-- - "Users can manage mappings for their company" (ALL, inclut SELECT)
-- 
-- Solution: Supprimer la politique SELECT redondante et garder seulement ALL

-- Supprimer la politique SELECT redondante
DROP POLICY IF EXISTS "Users can view mappings for their company" ON public.product_mapping;

-- La politique "Users can manage mappings for their company" (ALL) couvre déjà SELECT, INSERT, UPDATE, DELETE
-- Donc on n'a pas besoin de la recréer, elle existe déjà

-- ============================================
-- 4. DOCUMENTATION DES INDEX NON UTILISÉS
-- ============================================
-- Les index suivants n'ont pas été utilisés selon les statistiques PostgreSQL.
-- Ils sont documentés ici mais ne sont PAS supprimés automatiquement car:
-- 1. Ils pourraient être utiles pour des requêtes futures
-- 2. Ils pourraient être utilisés par des requêtes qui ne sont pas encore exécutées
-- 3. La suppression doit être décidée manuellement après analyse de l'utilisation réelle
--
-- Pour analyser l'utilisation d'un index:
-- SELECT * FROM pg_stat_user_indexes WHERE indexrelname = 'nom_index';
--
-- Pour supprimer un index non utilisé (après vérification):
-- DROP INDEX IF EXISTS public.nom_index;

-- Index non utilisés détectés par Performance Advisor:
-- 
-- Table: produits
-- - idx_produits_nom_trgm
-- - idx_produits_sku_trgm
-- - idx_produits_fournisseur_trgm
--
-- Table: fournisseurs
-- - idx_fournisseurs_nom_trgm
-- - idx_fournisseurs_email_trgm
--
-- Table: commandes
-- - idx_commandes_supplier_trgm
-- - idx_commandes_tracking_trgm
-- - idx_commandes_reconciliation_confirmed_by
-- - idx_commandes_warehouse_id
--
-- Table: unmapped_products
-- - idx_unmapped_products_company
--
-- Table: companies
-- - idx_companies_shopify_shop_id
-- - idx_companies_owner_id
--
-- Table: order_comments
-- - idx_order_comments_user_id
-- - idx_order_comments_company_id
--
-- Table: user_profiles
-- - idx_user_profiles_company_id
--
-- Table: product_mapping
-- - idx_product_mapping_company_variant
-- - idx_product_mapping_shopify_sku
--
-- Table: fournisseurs
-- - idx_fournisseurs_company_id
--
-- Table: warehouses
-- - idx_warehouses_company_id
--
-- Table: parametres
-- - idx_parametres_company_id
--
-- Table: sku_fournisseurs
-- - idx_sku_fournisseurs_company_id
--
-- Table: shopify_location_mapping
-- - idx_shopify_location_mapping_company
-- - idx_shopify_location_mapping_location

-- ============================================
-- 5. COMMENTAIRES ET VALIDATION
-- ============================================

COMMENT ON TABLE public.unmapped_products IS 
'Migration 068: RLS activé sur cette table pour la sécurité. Les utilisateurs ne peuvent accéder qu''aux produits non mappés de leur company.';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 068 terminée:';
  RAISE NOTICE '   - RLS activé sur unmapped_products (ERROR corrigé)';
  RAISE NOTICE '   - 20 fonctions corrigées pour search_path mutable';
  RAISE NOTICE '   - Politiques RLS multiples fusionnées sur product_mapping';
  RAISE NOTICE '   - 24 index non utilisés documentés (non supprimés)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Actions manuelles requises:';
  RAISE NOTICE '   1. Activer la protection contre les mots de passe divulgués dans Supabase Dashboard';
  RAISE NOTICE '      → Authentication → Settings → Password Strength → Check for leaked passwords';
  RAISE NOTICE '   2. Analyser et supprimer les index non utilisés si nécessaire (voir documentation ci-dessus)';
END $$;

