# Architecture Technique & Synchronisation StockEasy

> **Dernière mise à jour :** 24 Novembre 2025
> **État :** Opérationnel (v1.0)

## 🎯 Vue d'ensemble

StockEasy est une application Shopify qui synchronise bidirectionnellement les données entre Shopify et Supabase pour gérer :
- Les produits et leurs variantes
- Les niveaux d'inventaire
- Les commandes et historique des ventes
- Les emplacements/warehouses

L'application utilise **Gadget** comme framework backend/frontend et **Supabase** comme base de données principale.

---

## 🟢 Fonctionnalités Implémentées

### 1. Architecture de Base

#### 🔗 Connexions
*   **Shopify Connection** : Configurée avec les scopes nécessaires :
    *   `write_inventory`, `write_locations`, `write_orders`, `write_products`
    *   `read_products`, `read_orders`, `read_inventory`
*   **Supabase Connection** : Via `@supabase/supabase-js`
    *   Variables d'environnement : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
    *   Client API interne : `STOCKEASY_INTERNAL_API_KEY`

#### 📊 Modèles Gadget
*   **Shopify (Sync auto)** : `shopifyShop`, `shopifyProduct`, `shopifyInventoryItem`, `shopifyInventoryLevel`, `shopifyLocation`, `shopifyOrder`, `shopifyOrderLineItem`.
*   **Custom** :
    *   `productMapping` : Mapping entre variantes Shopify et SKUs StockEasy.
    *   `syncLog` : Logs de toutes les opérations de synchronisation.

#### 🗃️ Tables Supabase
*   **`companies`** : `id` (UUID), `shopify_shop_id` (Domaine), `owner_id` (Ref Auth).
*   **`warehouses`** : `id`, `company_id`, `name`, `address`, etc.
*   **`shopify_location_mapping`** : `id`, `company_id`, `shopify_location_id`, `warehouse_id`.
*   **`sales_history`** : `id`, `company_id`, `sku`, `sale_date`, `quantity`, `revenue`, `source` ('shopify'), `metadata` (JSONB).

### 2. Synchronisation Shopify → Supabase

#### ✅ Installation de Shop (`shopifyShop/actions/install.js`)
Lors de l'installation :
1.  Crée un utilisateur Supabase Auth via `create_auth_user_for_shopify()`.
2.  Crée une company dans Supabase via `create_shopify_company()`.
3.  Synchronise les emplacements Shopify → warehouses Supabase.
4.  Synchronise l'historique des commandes (30 derniers jours).

#### ✅ Synchronisation des Emplacements
*   **Action globale** : `syncShopifyLocations`.
*   **Webhooks** : `locations/create` → `shopifyLocation/actions/create.js`, `locations/update` → `update.js`.
*   **Logique** : Appelle la fonction PostgreSQL `sync_shopify_location()` pour créer/mettre à jour `warehouses` et `shopify_location_mapping`.

#### ✅ Synchronisation des Commandes (`sales_history`)
*   **Webhook** : `orders/create` → `shopifyOrder/actions/create.js`.
*   **Logique** :
    *   Récupère la company UUID via `stockEasyCompanyId`.
    *   Pour chaque `shopifyOrderLineItem`, cherche le mapping via `shopifyVariantId`.
    *   Insère dans `sales_history` :
        ```javascript
        {
          company_id: companyUuid,
          sku: mapping.stockEasySku,
          sale_date: "YYYY-MM-DD",
          quantity: lineItem.quantity,
          revenue: lineItem.price * lineItem.quantity,
          source: "shopify",
          metadata: { shopify_order_id, shopify_line_item_id, ... }
        }
        ```
*   **Actions liées** : `syncOrdersToSupabase` (manuel), `scheduledOrderSync` (cron quotidien), `generateTestOrders`.

### 3. Synchronisation Supabase → Shopify

#### ✅ Mise à jour de l'inventaire Shopify
*   **Action globale** : `updateShopifyInventory`
    *   Paramètres : `shopId`, `sku`, `newQuantity`, `locationId` (opt).
*   **Logique** :
    *   Trouve le mapping via SKU.
    *   Récupère `shopifyInventoryItemId`.
    *   Appelle la mutation GraphQL `inventorySetQuantities` via `writeToShopify` (queue background).

### 4. Helpers & Utilitaires (`api/lib/supabase.js`)
*   `getSupabaseClient()`
*   `getCompanyUuidByShopifyId(shopifyShopId)`
*   `createShopifyCompany(...)`
*   `insertSalesHistory(salesData[])`
*   `syncShopifyLocation(...)`

---

## 🟡 Mapping de Données

### Modèle `productMapping`
Indispensable pour la liaison bidirectionnelle.
*   **Champs clés** : `shopifyVariantId` (Unique par shop), `stockEasySku` (Requis).
*   **Note** : On mappe sur le `VariantId`, pas le `ProductId` ni le `LineItemId`.

### Modèle `syncLog`
Utilisé pour l'audit trail.
*   **Champs** : `entity` (order, inventory...), `operation`, `status` (success, error), `message`, `payload`.

---

## ⚠️ Problèmes Connus & Roadmap

### 🔴 Priorité HAUTE (Critique)

1.  **Unicité des données `sales_history`**
    *   *Problème* : Risque de doublons (webhook reçu 2x, cron + webhook).
    *   *Solution* : Ajouter une contrainte UNIQUE sur `(company_id, sku, sale_date, source, metadata->>'shopify_line_item_id')`.

2.  **Gestion des Remboursements/Annulations**
    *   *Problème* : Les ventes annulées restent comptabilisées comme revenus.
    *   *Solution* : Gérer les webhooks `orders/cancelled` et `refunds/create` pour insérer des lignes avec quantités et revenus **négatifs**.

3.  **Mises à jour de commandes (`orders/updated`)**
    *   *Problème* : Changement de quantité ou d'items après commande non reflété.
    *   *Solution* : Sur update, supprimer les anciennes entrées de cette commande et recréer les nouvelles.

4.  **Validations Manquantes**
    *   *Problème* : Pas de garde-fou sur `sales_history` (quantités négatives non intentionnelles, SKU vide).

### 🟡 Priorité MOYENNE

5.  **Timezones**
    *   *Problème* : Dates stockées en UTC, faussant les rapports journaliers locaux.
    *   *Solution* : Utiliser `luxon` pour convertir le `createdAt` UTC vers la timezone du shop avant insertion.

6.  **Produits non mappés**
    *   *Problème* : "Silence" si un produit n'a pas de mapping.
    *   *Solution* : Dashboard ou Alertes email pour les produits détectés sans mapping.

### 🟢 Améliorations Futures

*   **Webhook Supabase → Gadget** : Pour trigger l'update Shopify dès que la DB change.
*   **Retry Logic** : Backoff exponentiel pour les erreurs de sync.
*   **Monitoring** : Dashboard de santé des synchronisations.

---

## 📦 Structure des Fichiers Clés

```
api/
├── actions/
│   ├── syncOrdersToSupabase.js      # Sync manuelle
│   ├── syncShopifyLocations.js      # Sync locations
│   ├── updateShopifyInventory.js    # Supabase -> Shopify
│   └── writeToShopify.js            # Queue GraphQL
├── lib/
│   └── supabase.js                  # Client & Helpers
├── models/
│   ├── shopifyLocation/
│   │   ├── actions/create.js
│   │   └── actions/update.js
│   ├── shopifyOrder/
│   │   └── actions/create.js        # Webhook Orders
│   └── shopifyShop/
│       └── actions/install.js       # Setup initial
```









