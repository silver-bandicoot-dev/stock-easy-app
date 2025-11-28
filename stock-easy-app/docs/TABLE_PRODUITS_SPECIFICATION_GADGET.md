# Spécification de la Table `produits` pour Gadget

> **Date de création :** 2025-01-27  
> **Objectif :** Définir clairement quels champs de la table `produits` doivent être remplis par Gadget depuis Shopify et lesquels ne doivent **PAS** être modifiés.

---

## 📋 Structure Complète de la Table `produits`

La table `produits` contient **52 colonnes** au total. Voici la liste complète avec leurs caractéristiques :

### 🔑 Colonnes Identifiantes

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `sku` | TEXT | **NO** | Identifiant unique du produit (clé primaire) |
| `company_id` | UUID | **NO** | ID de l'entreprise (multi-tenant) |

---

## ✅ CHAMPS À REMPLIR PAR GADGET (Depuis Shopify)

Ces champs doivent être synchronisés depuis Shopify vers Supabase par Gadget :

### 📦 Informations Produit de Base (Shopify)

| Colonne | Type | Source Shopify | Description |
|---------|------|---------------|-------------|
| `nom_produit` | TEXT | `product.title` ou `variant.title` | Nom du produit/variant |
| `image_url` | TEXT | `product.featuredImage` ou `variant.image` | URL de l'image principale |
| `stock_actuel` | NUMERIC | `inventoryLevel.available` | Stock disponible actuel dans Shopify |
| `prix_vente` | NUMERIC | `variant.price` | Prix de vente du variant |

### 📊 Métriques de Ventes (Calculées depuis `sales_history`)

| Colonne | Type | Source | Description |
|---------|------|--------|-------------|
| `ventes_totales_30j` | INTEGER | Calculé depuis `sales_history` | Total des ventes sur 30 jours |
| `ventes_jour_moy_30j` | NUMERIC | Calculé depuis `sales_history` | Moyenne des ventes par jour sur 30 jours |
| `derniere_vente` | TIMESTAMP | `sales_history.sale_date` (MAX) | Date de la dernière vente |

**Note importante :** Ces métriques de ventes sont calculées automatiquement par les triggers/fonctions PostgreSQL à partir de la table `sales_history` qui est alimentée par Gadget lors de la synchronisation des commandes Shopify.

---

## 🚫 CHAMPS À NE PAS MODIFIER PAR GADGET

Ces champs sont gérés par l'application StockEasy (utilisateurs, calculs automatiques, ou triggers PostgreSQL) et ne doivent **JAMAIS** être modifiés par Gadget :

### 👤 Paramètres Utilisateur (Gérés par l'Interface)

| Colonne | Type | Géré par | Description |
|---------|------|----------|-------------|
| `fournisseur` | TEXT | Utilisateur | Nom du fournisseur assigné |
| `prix_achat` | NUMERIC | Utilisateur | Prix d'achat unitaire |
| `lead_time_days` | INTEGER | Utilisateur | Délai de livraison en jours |
| `moq` | INTEGER | Utilisateur/Fournisseur | Quantité minimum de commande |
| `moq_source` | TEXT | Système | Source du MOQ ('user', 'supplier', etc.) |
| `stock_secu_custom_jours` | INTEGER | Utilisateur | Jours de stock de sécurité personnalisés |
| `multiplicateur_prevision` | NUMERIC | Utilisateur | Multiplicateur de sécurité pour prévisions |
| `statut` | TEXT | Système | Statut du produit ('active', 'inactive', etc.) |

### 🧮 Champs Calculés Automatiquement (Triggers PostgreSQL)

Ces champs sont calculés automatiquement par le trigger `trigger_calculate_advanced_metrics` et ne doivent **JAMAIS** être modifiés manuellement :

| Colonne | Type | Calcul | Description |
|---------|------|--------|-------------|
| `ventes_jour_ajustees` | NUMERIC | `ventes_jour_moy_30j × multiplicateur_prevision` | Ventes ajustées avec multiplicateur |
| `stock_securite` | INTEGER | Calculé selon `stock_secu_custom_jours` ou formule par défaut | Stock de sécurité |
| `point_commande` | NUMERIC | `(ventes_jour_ajustees × lead_time_days) + stock_securite` | Point de réapprovisionnement |
| `qte_a_commander` | INTEGER | Calculé selon stock actuel vs point de commande | Quantité à commander |
| `marge_unitaire` | NUMERIC | `prix_vente - prix_achat` | Marge unitaire |
| `investissement` | NUMERIC | `stock_actuel × prix_achat` | Valeur du stock actuel |
| `inventory_value` | NUMERIC | `stock_actuel × prix_achat` | Valeur d'inventaire |
| `autonomie_jours` | INTEGER | `stock_actuel / ventes_jour_ajustees` | Jours d'autonomie |
| `stock_max` | INTEGER | `point_commande + (moq × 1.5)` | Stock maximum recommandé |
| `taux_rotation` | NUMERIC | `(ventes_jour_ajustees × 365) / stock_actuel` | Taux de rotation annuel |
| `cout_stockage_total` | NUMERIC | `stock_actuel × cout_stockage_unitaire` | Coût total de stockage |
| `risque_rupture` | INTEGER | 0-100 selon autonomie vs lead_time | Risque de rupture (0-100) |
| `risque_surstock` | INTEGER | 0-100 selon stock vs stock_max | Risque de surstock (0-100) |
| `tendance_ventes` | TEXT | Calculé depuis historique | Tendance ('hausse', 'baisse', 'stable') |
| `variation_ventes_pct` | NUMERIC | Calculé depuis historique | Pourcentage de variation |
| `marge_brute` | NUMERIC | `stock_actuel × marge_unitaire` | Marge brute totale |
| `revenu_potentiel` | NUMERIC | `stock_actuel × prix_vente` | Revenu si tout le stock est vendu |
| `priorite_commande` | INTEGER | 1-10 selon risque et marge | Priorité de commande (1-10) |
| `stock_projete` | INTEGER | `stock_actuel + qte_en_transit - (ventes_jour_ajustees × lead_time)` | Stock projeté |
| `date_rupture_estimee` | TIMESTAMP | Calculé selon stock et ventes | Date estimée de rupture |
| `score_performance` | INTEGER | 0-100 selon plusieurs facteurs | Score de performance (0-100) |
| `categorie_abc` | TEXT | 'A', 'B', ou 'C' selon revenu | Catégorie ABC |
| `notes_alertes` | TEXT | Généré automatiquement | Alertes automatiques |
| `health_status` | TEXT | 'healthy', 'warning', 'critical' | Statut de santé |
| `health_percentage` | INTEGER | 0-100 | Pourcentage de santé |

### 📅 Champs de Dates et Métadonnées

| Colonne | Type | Géré par | Description |
|---------|------|----------|-------------|
| `created_at` | TIMESTAMP | PostgreSQL (DEFAULT NOW()) | Date de création |
| `updated_at` | TIMESTAMP | Trigger automatique | Date de dernière mise à jour |
| `derniere_commande` | TIMESTAMP | Système (commandes) | Date de dernière commande |
| `commandes_en_cours` | INTEGER | Système (commandes) | Nombre de commandes en cours |
| `qte_en_transit` | INTEGER | Système (commandes) | Quantité en transit |

### ⚙️ Paramètres Système

| Colonne | Type | Géré par | Description |
|---------|------|----------|-------------|
| `coefficient_saisonnalite` | NUMERIC | Utilisateur/Système | Coefficient de saisonnalité (défaut: 1.0) |
| `cout_stockage_unitaire` | NUMERIC | Paramètres entreprise | Coût de stockage par unité (défaut: 0.01) |
| `fiabilite_fournisseur` | INTEGER | Système/Utilisateur | Fiabilité du fournisseur (0-100, défaut: 80) |

---

## 📝 Règles de Synchronisation Gadget → Supabase

### ✅ Ce que Gadget DOIT faire :

1. **Créer/Mettre à jour les produits** lors de la synchronisation Shopify :
   - `sku` : Utiliser le SKU du variant Shopify (ou générer un identifiant unique)
   - `nom_produit` : Depuis `product.title` ou `variant.title`
   - `image_url` : Depuis `product.featuredImage` ou `variant.image`
   - `stock_actuel` : Depuis `inventoryLevel.available` (somme sur tous les emplacements)
   - `prix_vente` : Depuis `variant.price`
   - `company_id` : Récupérer via `get_company_by_shopify_shop_id(shopify_shop_id)`

2. **Alimenter `sales_history`** lors de la synchronisation des commandes :
   - Insérer les ventes dans `sales_history` (qui déclenchera les recalculs automatiques)
   - Les métriques `ventes_totales_30j`, `ventes_jour_moy_30j`, etc. seront calculées automatiquement

3. **Respecter le mapping** :
   - Utiliser la table `product_mapping` pour mapper `shopify_variant_id` → `stockeasy_sku`
   - Créer le mapping si nécessaire via `upsert_product_mapping()`

### 🚫 Ce que Gadget NE DOIT PAS faire :

1. **Ne jamais modifier** les champs calculés automatiquement (liste ci-dessus)
2. **Ne jamais modifier** les paramètres utilisateur (`fournisseur`, `prix_achat`, `lead_time_days`, `moq`, etc.)
3. **Ne jamais modifier** les champs de dates système (`created_at`, `updated_at` est géré par trigger)
4. **Ne jamais écraser** les valeurs existantes des champs utilisateur lors d'une synchronisation

### ⚠️ Comportement Recommandé pour Gadget :

```sql
-- Exemple de logique UPSERT sécurisée pour Gadget
INSERT INTO public.produits (
  sku,
  company_id,
  nom_produit,
  image_url,
  stock_actuel,
  prix_vente
)
VALUES (
  :shopify_sku,
  :company_id,
  :product_title,
  :image_url,
  :inventory_available,
  :variant_price
)
ON CONFLICT (sku, company_id) 
DO UPDATE SET
  nom_produit = EXCLUDED.nom_produit,  -- ✅ OK : vient de Shopify
  image_url = EXCLUDED.image_url,      -- ✅ OK : vient de Shopify
  stock_actuel = EXCLUDED.stock_actuel, -- ✅ OK : vient de Shopify
  prix_vente = EXCLUDED.prix_vente,    -- ✅ OK : vient de Shopify
  updated_at = NOW()                   -- ✅ OK : trigger gère automatiquement
  -- ❌ NE PAS modifier : fournisseur, prix_achat, lead_time_days, moq, etc.
  -- ❌ NE PAS modifier : tous les champs calculés (stock_securite, point_commande, etc.)
```

---

## 🔄 Flux de Synchronisation Recommandé

### 1. Synchronisation Initiale (Installation)

1. Gadget crée la company via `create_shopify_company(shopify_shop_id)`
2. Gadget synchronise les produits Shopify → `produits`
3. Gadget crée les mappings via `upsert_product_mapping()`
4. Gadget synchronise l'historique des commandes → `sales_history`

### 2. Synchronisation Continue (Webhooks)

1. **Produit créé/modifié** (`products/create`, `products/update`) :
   - UPSERT dans `produits` (uniquement champs Shopify)
   - Créer/mettre à jour le mapping si nécessaire

2. **Inventaire modifié** (`inventory_levels/update`) :
   - Mettre à jour uniquement `stock_actuel`

3. **Commande créée** (`orders/create`) :
   - Insérer dans `sales_history` (les métriques seront recalculées automatiquement)

---

## 📊 Résumé Visuel

```
┌─────────────────────────────────────────────────────────────┐
│                    TABLE PRODUITS                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ GADGET PEUT MODIFIER (Depuis Shopify) :                 │
│     • sku, company_id                                         │
│     • nom_produit, image_url                                 │
│     • stock_actuel, prix_vente                               │
│     • ventes_totales_30j, ventes_jour_moy_30j (via sales)  │
│                                                               │
│  🚫 GADGET NE DOIT PAS MODIFIER :                            │
│     • fournisseur, prix_achat, lead_time_days, moq         │
│     • Tous les champs calculés (stock_securite, etc.)       │
│     • Paramètres utilisateur                                 │
│     • Dates système (created_at, updated_at)                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Vérification

Pour vérifier qu'un champ ne doit pas être modifié par Gadget, consultez :
- Les triggers PostgreSQL : `trigger_calculate_advanced_metrics`
- La fonction : `calculate_advanced_product_metrics()`
- Les migrations : `015_add_critical_missing_columns.sql`

Si un champ est calculé dans ces fonctions, il ne doit **JAMAIS** être modifié par Gadget.

---

**Dernière mise à jour :** 2025-01-27



