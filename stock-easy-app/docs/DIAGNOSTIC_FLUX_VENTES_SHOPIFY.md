# Diagnostic : Flux des Ventes Shopify vers Prédictions StockEasy

## 🎯 Objectif

Ce document vous guide pour diagnostiquer pourquoi les ventes Shopify ne semblent pas être utilisées dans vos calculs et prédictions StockEasy.

## 📊 Architecture du Flux de Données

### Vue d'ensemble

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Shopify Store  │     │  Gadget (Backend)│     │  Supabase DB    │
│                 │     │                  │     │                 │
│  Commande créée │────►│  shopifyOrder    │────►│  sales_history  │
│                 │     │  /create.js      │     │                 │
│                 │     │        │         │     │       │         │
│                 │     │        ▼         │     │       ▼         │
│                 │     │  syncOrderTo     │     │  TRIGGER:       │
│                 │     │  Supabase        │     │  calcul ventes  │
│                 │     │        │         │     │       │         │
│                 │     │        ▼         │     │       ▼         │
│                 │     │  product_mapping │     │  produits:      │
│                 │     │  lookup          │     │  ventes_jour_   │
│                 │     │                  │     │  moy_30j        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                   ┌─────────────────┐
                                                   │  Frontend       │
                                                   │  salesPerDay    │
                                                   │  Prédictions ML │
                                                   └─────────────────┘
```

### Flux détaillé

1. **Shopify → Gadget** : Webhook `orders/create`
   - Fichier : `stockeasy-app-gadget/api/models/shopifyOrder/actions/create.js`
   - Action : Enqueue `syncOrderToSupabase`

2. **Gadget → Supabase** : Synchronisation des ventes
   - Fichier : `stockeasy-app-gadget/api/actions/syncOrderToSupabase.js`
   - Lookup : Cherche le SKU StockEasy dans `product_mapping`
   - Insert : Ajoute la vente dans `sales_history`

3. **Supabase** : Calculs automatiques (Triggers PostgreSQL)
   - Trigger : `trigger_update_ventes_jour_moy_30j_on_sales`
   - Migration : `052_calculate_ventes_jour_moy_30j_from_sales_history.sql`
   - Calcul : `ventes_jour_moy_30j` = moyenne des 30 derniers jours
   - Calcul : `ventes_jour_ajustees` = `ventes_jour_moy_30j × multiplicateur`

4. **Frontend** : Utilisation pour prédictions
   - `salesPerDay` = `ventes_jour_ajustees` (depuis Supabase)
   - Services ML utilisent `salesPerDay` pour les prévisions

---

## 🔍 Étape 1 : Diagnostic Supabase (BASE DE DONNÉES)

### 1.1 Exécuter le script SQL de diagnostic

Un script complet a été créé : `scripts/sql/diagnostic_ventes_shopify.sql`

**Comment l'exécuter :**

1. Ouvrez Supabase Dashboard : https://app.supabase.com
2. Sélectionnez votre projet StockEasy
3. Allez dans "SQL Editor"
4. Copiez-collez le contenu du fichier `scripts/sql/diagnostic_ventes_shopify.sql`
5. Cliquez sur "Run"

### 1.2 Interpréter les résultats

#### ✅ Scénario SAIN (tout fonctionne)

```
Total ventes dans sales_history: > 0
Ventes Shopify uniquement: > 0
Total mappings produits: > 0
Produits avec ventes > 0: > 0
```

#### ❌ Problème 1 : Aucune vente enregistrée

```
Total ventes dans sales_history: 0
```

**Cause probable :**
- Pas de commandes Shopify depuis l'installation
- Webhooks Shopify non configurés
- `stockEasyCompanyId` manquant sur le shop

**Solution :** Passer à l'Étape 2 (Gadget)

#### ❌ Problème 2 : Ventes présentes mais pas de produits avec ventes calculées

```
Total ventes dans sales_history: 150
Produits avec ventes > 0: 0
```

**Cause probable :**
- SKUs dans `sales_history` ne correspondent pas aux SKUs dans `produits`
- Triggers Supabase désactivés ou en erreur

**Solution :**
```sql
-- Vérifier les SKUs orphelins
SELECT DISTINCT sh.sku
FROM sales_history sh
LEFT JOIN produits p ON sh.sku = p.sku AND sh.company_id = p.company_id
WHERE p.sku IS NULL
LIMIT 20;
```

#### ❌ Problème 3 : Produits unmapped

```
Produits non mappés: > 0
```

**Cause probable :**
- Les produits Shopify ne sont pas synchronisés avec StockEasy
- Le mapping initial n'a pas été fait

**Solution :** Passer à l'Étape 3 (Product Mapping)

---

## 🔍 Étape 2 : Diagnostic Gadget (BACKEND)

### 2.1 Vérifier les logs Gadget

1. Allez sur https://stockeasy-app.gadget.app
2. Cliquez sur "Logs" dans la sidebar
3. Filtrez par :
   - Model : `shopifyOrder`
   - Action : `create`

**Ce que vous devriez voir :**
```
✅ New order created - enqueued sync to Supabase
📦 Order: #1234
```

**Si vous ne voyez rien :**
- Les webhooks Shopify ne sont pas actifs
- Aucune commande n'a été passée depuis l'installation
- Passez à l'Étape 2.3 (Webhooks Shopify)

### 2.2 Vérifier le `stockEasyCompanyId`

1. Dans Gadget, allez dans "Data" > "shopifyShop"
2. Cliquez sur votre shop
3. Vérifiez que le champ `stockEasyCompanyId` est rempli

**Si vide :**
- L'installation n'a pas créé le company_id dans Supabase
- Re-installer l'app ou créer manuellement le lien

**Code de vérification manuelle dans Supabase :**
```sql
-- Trouver le company_id lié au shop Shopify
SELECT * FROM companies 
WHERE shopify_shop_domain = 'votre-shop.myshopify.com';
```

### 2.3 Vérifier les webhooks Shopify

**Dans Shopify Admin :**
1. Settings > Notifications
2. Scroll vers le bas : "Webhooks"
3. Vérifiez que ces webhooks existent :
   - `orders/create`
   - `orders/updated`
   - `products/create`
   - `products/update`
   - `inventory_levels/update`

**URL de destination :** Devrait pointer vers Gadget (https://stockeasy-app.gadget.app/webhooks/...)

**Si absents :** Les webhooks ne sont pas configurés
- Réinstaller l'app Shopify
- Ou les créer manuellement via Shopify API

---

## 🔍 Étape 3 : Diagnostic Product Mapping

### 3.1 Vérifier les mappings dans Gadget

1. Dans Gadget, allez dans "Data" > "productMapping"
2. Vérifiez qu'il y a des entrées

**Si vide :**
- La synchronisation initiale des produits n'a pas été faite

**Solution : Lancer la sync initiale**

Dans Gadget, créer une action ou exécuter :
```javascript
// Dans Gadget Console ou via API
await api.enqueue(api.syncShopifyProducts, {
  shopId: "gid://shopify/Shop/YOUR_SHOP_ID"
});
```

### 3.2 Vérifier les mappings dans Supabase

```sql
-- Compter les mappings
SELECT COUNT(*) FROM product_mapping;

-- Voir des exemples
SELECT 
  shopify_variant_id,
  shopify_sku,
  stockeasy_sku,
  product_title
FROM product_mapping
LIMIT 10;
```

### 3.3 Synchroniser manuellement si nécessaire

**Option 1 : Via Gadget Action**

Créer un Background Action dans Gadget pour forcer la sync :
```javascript
// api/actions/forceSyncProducts.js
export const run = async ({ logger, api }) => {
  const shops = await api.shopifyShop.findMany();
  
  for (const shop of shops) {
    await api.enqueue(api.syncShopifyProducts, {
      shopId: shop.id
    });
    logger.info({ shopId: shop.id }, "Sync enqueued");
  }
};
```

**Option 2 : Via Frontend StockEasy**

Ajouter un bouton dans l'interface :
```javascript
// Appeler l'endpoint Gadget
await fetch('https://stockeasy-app.gadget.app/sync-products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🔍 Étape 4 : Vérifier les Triggers Supabase

### 4.1 Vérifier que les triggers existent

```sql
-- Liste des triggers actifs
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (
    trigger_name LIKE '%ventes_jour%'
    OR event_object_table IN ('sales_history', 'produits')
  )
ORDER BY trigger_name;
```

**Triggers attendus :**
- `trigger_calculate_ventes_jour_moy_30j` sur `produits`
- `trigger_update_ventes_jour_moy_30j_on_sales` sur `sales_history`
- `trigger_calculate_ventes_jour_ajustees` sur `produits`

### 4.2 Vérifier que les fonctions existent

```sql
-- Liste des fonctions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%ventes_jour%'
ORDER BY routine_name;
```

**Fonctions attendues :**
- `calculate_ventes_jour_moy_30j()`
- `update_ventes_jour_moy_30j_on_sales_change()`
- `calculate_ventes_jour_ajustees()`

### 4.3 Tester manuellement le calcul

```sql
-- Forcer le recalcul pour un produit spécifique
UPDATE produits
SET updated_at = NOW()
WHERE sku = 'VOTRE-SKU'
RETURNING sku, ventes_jour_moy_30j, ventes_jour_ajustees;
```

---

## ✅ Checklist Complète

### Supabase
- [ ] `sales_history` contient des ventes (COUNT > 0)
- [ ] `product_mapping` contient des mappings (COUNT > 0)
- [ ] `produits` a des `ventes_jour_moy_30j > 0`
- [ ] Triggers actifs et fonctionnels
- [ ] Pas de SKUs orphelins

### Gadget
- [ ] `shopifyShop.stockEasyCompanyId` est rempli
- [ ] `productMapping` contient des entrées
- [ ] Logs montrent des `syncOrderToSupabase` réussis
- [ ] Pas de produits dans `unmapped_products`

### Shopify
- [ ] Webhooks `orders/create` configuré
- [ ] Webhooks `products/create` configuré
- [ ] Webhooks `inventory_levels/update` configuré
- [ ] App StockEasy installée et active

### Frontend
- [ ] Les produits affichent `salesPerDay > 0`
- [ ] Les prédictions ML fonctionnent
- [ ] Aucune erreur dans la console

---

## 🚑 Solutions aux Problèmes Courants

### Problème : "Aucune vente ne remonte"

**Diagnostic :**
```sql
SELECT COUNT(*) FROM sales_history;
-- Si = 0, les ventes ne sont pas synchronisées
```

**Solutions :**
1. Vérifier `stockEasyCompanyId` dans Gadget
2. Vérifier les webhooks Shopify
3. Créer une commande test dans Shopify
4. Vérifier les logs Gadget

### Problème : "Les ventes sont dans sales_history mais ventes_jour_moy_30j = 0"

**Diagnostic :**
```sql
-- Vérifier les SKUs
SELECT sh.sku, COUNT(*) as sales_count
FROM sales_history sh
LEFT JOIN produits p ON sh.sku = p.sku AND sh.company_id = p.company_id
WHERE p.sku IS NULL
GROUP BY sh.sku;
```

**Solutions :**
1. Les SKUs ne correspondent pas
2. Créer les produits manquants dans `produits`
3. Corriger les mappings dans `product_mapping`

### Problème : "Les produits ne sont pas mappés"

**Diagnostic :**
```sql
SELECT COUNT(*) FROM unmapped_products;
-- Si > 0, des produits Shopify ne sont pas liés
```

**Solutions :**
1. Lancer `syncShopifyProducts` action dans Gadget
2. Créer manuellement les mappings
3. Vérifier que les SKUs Shopify correspondent aux SKUs StockEasy

---

## 📝 Script de Validation Finale

Exécutez ce script pour confirmer que tout fonctionne :

```sql
-- VALIDATION FINALE
WITH stats AS (
  SELECT
    (SELECT COUNT(*) FROM sales_history) as total_sales,
    (SELECT COUNT(*) FROM sales_history WHERE source = 'shopify') as shopify_sales,
    (SELECT COUNT(*) FROM product_mapping) as mappings,
    (SELECT COUNT(*) FROM unmapped_products) as unmapped,
    (SELECT COUNT(*) FROM produits WHERE ventes_jour_moy_30j > 0) as products_with_sales,
    (SELECT COUNT(*) FROM produits) as total_products
)
SELECT 
  CASE 
    WHEN total_sales > 0 
      AND mappings > 0 
      AND products_with_sales > 0 
      AND unmapped = 0 
    THEN '✅ TOUT FONCTIONNE CORRECTEMENT'
    WHEN total_sales = 0 THEN '❌ AUCUNE VENTE - Vérifier webhooks Shopify et Gadget logs'
    WHEN mappings = 0 THEN '❌ AUCUN MAPPING - Lancer syncShopifyProducts'
    WHEN products_with_sales = 0 THEN '❌ VENTES NON CALCULÉES - Vérifier triggers Supabase'
    WHEN unmapped > 0 THEN '⚠️ PRODUITS NON MAPPÉS - Résoudre unmapped_products'
    ELSE '⚠️ PROBLÈME INCONNU - Contacter support'
  END as status,
  total_sales,
  shopify_sales,
  mappings,
  unmapped,
  products_with_sales,
  total_products
FROM stats;
```

---

## 📞 Support

Si après ces diagnostics le problème persiste :

1. **Exporter les résultats du script SQL** : Copier les résultats
2. **Capturer les logs Gadget** : Screenshots des logs d'erreur
3. **Vérifier les webhooks Shopify** : Screenshot de la configuration

---

## 📚 Références

- **Migration 052** : `supabase/migrations/052_calculate_ventes_jour_moy_30j_from_sales_history.sql`
- **Migration 030** : `supabase/migrations/030_calculate_ventes_jour_ajustees.sql`
- **Migration 076** : `supabase/migrations/076_add_shopify_columns_to_sales_history.sql`
- **Sync Orders** : `stockeasy-app-gadget/api/actions/syncOrderToSupabase.js`
- **Sync Products** : `stockeasy-app-gadget/api/actions/syncShopifyProducts.js`

---

**Date de création** : 2025-01-28
**Version** : 1.0

