-- Migration: 032_merge_duplicate_rls_policies.sql
-- Objectif: Fusionner les politiques RLS dupliquées pour améliorer les performances
-- 
-- Problème: Plusieurs politiques permissives existent pour le même rôle et la même action
-- Solution: Supprimer les politiques redondantes et garder une seule politique complète

-- ============================================================================
-- ARTICLES_COMMANDE
-- ============================================================================

-- Supprimer les politiques redondantes pour articles_commande
DROP POLICY IF EXISTS auth_order_items_select ON public.articles_commande;
DROP POLICY IF EXISTS allow_authenticated_all_articles ON public.articles_commande;

-- Garder uniquement auth_order_items_all qui devrait couvrir tous les cas
-- (Vérifier d'abord que cette politique existe et fonctionne correctement)

-- ============================================================================
-- COMMANDES
-- ============================================================================

-- Supprimer les politiques redondantes pour commandes
DROP POLICY IF EXISTS auth_orders_select ON public.commandes;
DROP POLICY IF EXISTS allow_authenticated_all_commandes ON public.commandes;

-- Garder uniquement auth_orders_all

-- ============================================================================
-- FOURNISSEURS
-- ============================================================================

-- Supprimer les politiques redondantes pour fournisseurs
DROP POLICY IF EXISTS auth_suppliers_select ON public.fournisseurs;
DROP POLICY IF EXISTS allow_authenticated_all_fournisseurs ON public.fournisseurs;

-- Garder uniquement auth_suppliers_all

-- ============================================================================
-- ORDER_COMMENTS
-- ============================================================================

-- Supprimer les politiques redondantes pour order_comments
-- Note: Garder les politiques spécifiques (allow_own_*) si elles sont nécessaires
-- et fusionner avec allow_authenticated_all_comments si possible
DROP POLICY IF EXISTS allow_authenticated_insert_comments ON public.order_comments;
DROP POLICY IF EXISTS allow_authenticated_read_comments ON public.order_comments;

-- Garder allow_authenticated_all_comments et allow_own_* si nécessaire

-- ============================================================================
-- PARAMETRES
-- ============================================================================

-- Supprimer les politiques redondantes pour parametres
DROP POLICY IF EXISTS auth_parameters_select ON public.parametres;
DROP POLICY IF EXISTS allow_authenticated_all_parametres ON public.parametres;

-- Garder uniquement auth_parameters_all

-- ============================================================================
-- PRODUITS
-- ============================================================================

-- Supprimer les politiques redondantes pour produits
DROP POLICY IF EXISTS auth_products_select ON public.produits;
DROP POLICY IF EXISTS allow_authenticated_all_produits ON public.produits;

-- Garder uniquement auth_products_all

-- ============================================================================
-- SKU_FOURNISSEURS
-- ============================================================================

-- Supprimer les politiques redondantes pour sku_fournisseurs
DROP POLICY IF EXISTS auth_sku_suppliers_select ON public.sku_fournisseurs;
DROP POLICY IF EXISTS allow_authenticated_all_sku_fournisseurs ON public.sku_fournisseurs;

-- Garder uniquement auth_sku_suppliers_all

-- ============================================================================
-- WAREHOUSES
-- ============================================================================

-- Supprimer les politiques redondantes pour warehouses
DROP POLICY IF EXISTS auth_warehouses_select ON public.warehouses;
DROP POLICY IF EXISTS allow_authenticated_all_warehouses ON public.warehouses;

-- Garder uniquement auth_warehouses_all

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- AVANT D'APPLIQUER CETTE MIGRATION:
-- 1. Vérifier que les politiques gardées (auth_*_all) existent et fonctionnent
-- 2. Tester les requêtes critiques pour chaque table
-- 3. Vérifier que les permissions sont toujours correctes après suppression
-- 
-- Si les politiques auth_*_all n'existent pas ou ne couvrent pas tous les cas,
-- il faudra les créer ou modifier cette migration en conséquence.

