-- ============================================
-- Script de Diagnostic : Flux des Ventes Shopify
-- ============================================
-- Ce script vérifie si les ventes Shopify sont correctement
-- synchronisées et utilisées pour les prédictions

-- ============================================
-- 1. VÉRIFIER LA TABLE sales_history
-- ============================================

-- Nombre total de ventes enregistrées
SELECT 
  'Total ventes dans sales_history' AS check_type,
  COUNT(*) AS count
FROM sales_history;

-- Dernières ventes enregistrées (toutes sources)
SELECT 
  'Dernières ventes (toutes sources)' AS check_type,
  id,
  sku,
  sale_date,
  quantity,
  revenue,
  source,
  shopify_order_id,
  created_at
FROM sales_history
ORDER BY created_at DESC
LIMIT 10;

-- Ventes Shopify spécifiquement
SELECT 
  'Ventes Shopify uniquement' AS check_type,
  COUNT(*) AS shopify_sales_count
FROM sales_history
WHERE source = 'shopify' 
   OR shopify_order_id IS NOT NULL;

-- Distribution des ventes par source
SELECT 
  'Distribution par source' AS check_type,
  source,
  COUNT(*) AS count,
  SUM(quantity) AS total_quantity,
  SUM(revenue) AS total_revenue
FROM sales_history
GROUP BY source
ORDER BY count DESC;

-- ============================================
-- 2. VÉRIFIER LA TABLE product_mapping
-- ============================================

-- Nombre de mappings configurés
SELECT 
  'Total mappings produits' AS check_type,
  COUNT(*) AS mapping_count
FROM product_mapping;

-- Mappings par source
SELECT 
  'Mappings par source' AS check_type,
  sync_source,
  COUNT(*) AS count
FROM product_mapping
GROUP BY sync_source;

-- Mappings récents
SELECT 
  'Mappings récents' AS check_type,
  shopify_variant_id,
  shopify_sku,
  stockeasy_sku,
  product_title,
  sync_source,
  last_synced_at
FROM product_mapping
ORDER BY last_synced_at DESC NULLS LAST
LIMIT 10;

-- ============================================
-- 3. VÉRIFIER LES PRODUITS UNMAPPED
-- ============================================

-- Produits Shopify non mappés
SELECT 
  'Produits non mappés' AS check_type,
  COUNT(*) AS unmapped_count
FROM unmapped_products;

-- Détail des produits unmapped
SELECT 
  'Détail produits unmapped' AS check_type,
  shopify_variant_id,
  shopify_sku,
  product_title,
  last_seen_at,
  occurrence_count
FROM unmapped_products
ORDER BY last_seen_at DESC
LIMIT 10;

-- ============================================
-- 4. VÉRIFIER LES CALCULS DE VENTES (produits)
-- ============================================

-- Produits avec ventes calculées
SELECT 
  'Produits avec ventes > 0' AS check_type,
  COUNT(*) AS count
FROM produits
WHERE ventes_jour_moy_30j > 0;

-- Top 10 produits par ventes
SELECT 
  'Top 10 produits par ventes' AS check_type,
  sku,
  nom_produit,
  ventes_jour_moy_30j,
  ventes_jour_ajustees,
  stock_actuel,
  multiplicateur_prevision
FROM produits
WHERE ventes_jour_moy_30j > 0
ORDER BY ventes_jour_moy_30j DESC
LIMIT 10;

-- Produits sans ventes mais avec stock
SELECT 
  'Produits avec stock mais sans ventes' AS check_type,
  COUNT(*) AS count
FROM produits
WHERE stock_actuel > 0 
  AND (ventes_jour_moy_30j = 0 OR ventes_jour_moy_30j IS NULL);

-- ============================================
-- 5. VÉRIFIER LA COHÉRENCE DES DONNÉES
-- ============================================

-- SKUs dans sales_history mais pas dans produits
SELECT 
  'SKUs dans sales_history absents de produits' AS check_type,
  COUNT(DISTINCT sh.sku) AS orphan_skus
FROM sales_history sh
LEFT JOIN produits p ON sh.sku = p.sku AND sh.company_id = p.company_id
WHERE p.sku IS NULL;

-- Exemple de SKUs orphelins
SELECT 
  'Exemples SKUs orphelins' AS check_type,
  DISTINCT sh.sku,
  sh.company_id,
  MAX(sh.sale_date) AS last_sale_date,
  SUM(sh.quantity) AS total_quantity
FROM sales_history sh
LEFT JOIN produits p ON sh.sku = p.sku AND sh.company_id = p.company_id
WHERE p.sku IS NULL
GROUP BY sh.sku, sh.company_id
LIMIT 10;

-- Vérifier les ventes des 30 derniers jours
SELECT 
  'Ventes des 30 derniers jours' AS check_type,
  COUNT(*) AS sales_count,
  SUM(quantity) AS total_quantity,
  COUNT(DISTINCT sku) AS unique_products,
  COUNT(DISTINCT sale_date) AS days_with_sales
FROM sales_history
WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
  AND sale_date < CURRENT_DATE;

-- ============================================
-- 6. VÉRIFIER LES TRIGGERS
-- ============================================

-- Vérifier que les triggers existent et sont actifs
SELECT 
  'Triggers actifs' AS check_type,
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%ventes_jour%'
ORDER BY trigger_name;

-- ============================================
-- 7. RÉSUMÉ GLOBAL
-- ============================================

-- Statistiques globales
SELECT 
  'RÉSUMÉ GLOBAL' AS check_type,
  (SELECT COUNT(*) FROM sales_history) AS total_sales,
  (SELECT COUNT(*) FROM sales_history WHERE source = 'shopify') AS shopify_sales,
  (SELECT COUNT(*) FROM product_mapping) AS mapped_products,
  (SELECT COUNT(*) FROM unmapped_products) AS unmapped_products,
  (SELECT COUNT(*) FROM produits WHERE ventes_jour_moy_30j > 0) AS products_with_sales,
  (SELECT COUNT(*) FROM produits) AS total_products;

-- ============================================
-- FIN DU DIAGNOSTIC
-- ============================================



