-- Migration: 034_remove_unused_indexes.sql
-- Objectif: Supprimer les index non utilisés pour améliorer les performances d'écriture
-- 
-- ⚠️ ATTENTION: Cette migration supprime des index qui n'ont jamais été utilisés.
-- Vérifiez d'abord avec EXPLAIN ANALYZE que ces index ne sont pas nécessaires
-- pour vos requêtes actuelles ou futures.
-- 
-- Pour vérifier l'utilisation des index:
-- SELECT indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public' AND tablename = 'nom_table';

-- ============================================================================
-- PRODUITS - Index non utilisés (13 index)
-- ============================================================================

-- Supprimer les index non utilisés sur produits
-- ⚠️ Vérifier d'abord que ces colonnes ne sont pas utilisées dans des requêtes fréquentes

DROP INDEX IF EXISTS public.idx_produits_risque_rupture;
DROP INDEX IF EXISTS public.idx_produits_priorite_commande;
DROP INDEX IF EXISTS public.idx_produits_categorie_abc;
DROP INDEX IF EXISTS public.idx_produits_tendance_ventes;
DROP INDEX IF EXISTS public.idx_produits_autonomie_jours;
DROP INDEX IF EXISTS public.idx_produits_qte_a_commander;
DROP INDEX IF EXISTS public.idx_produits_derniere_vente;
DROP INDEX IF EXISTS public.idx_produits_date_rupture_estimee;

-- ⚠️ ATTENTION: Les index suivants sur produits pourraient être utiles pour des recherches
-- Vérifier avant de supprimer:
-- - idx_produits_sku (recherche par SKU)
-- - idx_produits_nom (recherche par nom)
-- - idx_produits_fournisseur (filtrage par fournisseur)
-- - idx_produits_statut (filtrage par statut)

-- Optionnel: Commenter ces lignes si vous voulez garder ces index
DROP INDEX IF EXISTS public.idx_produits_sku;
DROP INDEX IF EXISTS public.idx_produits_nom;
DROP INDEX IF EXISTS public.idx_produits_fournisseur;
DROP INDEX IF EXISTS public.idx_produits_statut;

-- ============================================================================
-- ARTICLES_COMMANDE - Index non utilisés (3 index)
-- ============================================================================

-- Ces index sont déjà gérés par la migration 036 (index dupliqués)
-- Si les index dupliqués sont supprimés, ces index restants pourraient être utiles
-- Vérifier avant de supprimer

-- DROP INDEX IF EXISTS public.idx_articles_commande_sku;
-- DROP INDEX IF EXISTS public.idx_articles_commande_order_id;

-- ============================================================================
-- COMMANDES - Index non utilisés (5 index)
-- ============================================================================

-- ⚠️ ATTENTION: Ces index pourraient être utiles pour filtrer les commandes
-- Vérifier avant de supprimer si vous filtrez souvent par:
-- - status (statut de la commande)
-- - supplier (fournisseur)
-- - warehouse (entrepôt)
-- - reconciliation_confirmed (réconciliation confirmée)
-- - reconciliation_status (statut de réconciliation)

DROP INDEX IF EXISTS public.idx_commandes_status;
DROP INDEX IF EXISTS public.idx_commandes_supplier;
DROP INDEX IF EXISTS public.idx_commandes_warehouse;
DROP INDEX IF EXISTS public.idx_commandes_reconciliation_confirmed;
DROP INDEX IF EXISTS public.idx_commandes_reconciliation_status;

-- ============================================================================
-- AUTRES TABLES - Index non utilisés (8 index)
-- ============================================================================

-- Warehouses
DROP INDEX IF EXISTS public.idx_warehouses_name;

-- Fournisseurs
DROP INDEX IF EXISTS public.idx_fournisseurs_nom;

-- KPI Snapshots
DROP INDEX IF EXISTS public.idx_kpi_snapshots_date;

-- KPI History
DROP INDEX IF EXISTS public.idx_kpi_history_date;

-- User Profiles
-- ⚠️ ATTENTION: Cet index pourrait être utile pour filtrer par company_id
DROP INDEX IF EXISTS public.idx_user_profiles_company_id;

-- Order Comments
-- ⚠️ ATTENTION: Cet index pourrait être utile pour filtrer par user_id
DROP INDEX IF EXISTS public.idx_order_comments_user_id;

-- Notifications
-- ⚠️ ATTENTION: Cet index pourrait être utile pour filtrer par read status
DROP INDEX IF EXISTS public.idx_notifications_read;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- 1. AVANT D'APPLIQUER CETTE MIGRATION:
--    - Exécutez ANALYZE sur toutes les tables concernées
--    - Vérifiez l'utilisation des index avec pg_stat_user_indexes
--    - Testez vos requêtes critiques avec EXPLAIN ANALYZE
--    - Vérifiez que les index ne sont pas utilisés dans des requêtes fréquentes
-- 
-- 2. APRÈS SUPPRESSION:
--    - Surveillez les performances des requêtes
--    - Recréez les index si nécessaire
-- 
-- 3. INDEX À GARDER (commentés dans le code):
--    - Les index sur les colonnes fréquemment utilisées dans WHERE/JOIN
--    - Les index sur les clés étrangères (gérés par migration 035)
--    - Les index sur les colonnes utilisées pour ORDER BY
-- 
-- 4. Si vous n'êtes pas sûr, commentez les lignes DROP INDEX correspondantes
--    et testez d'abord avec les index supprimés dans un environnement de test.

