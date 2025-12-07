# 🔒 Rapport d'Audit Multi-Tenant - StockEasy

**Date:** 7 décembre 2025  
**Statut:** 🔴 CRITIQUE - Corrections requises

---

## 📊 Résumé Exécutif

| Catégorie | État | Détails |
|-----------|------|---------|
| **Tables avec company_id** | ✅ 17/22 | La plupart des tables métier sont correctes |
| **RLS activé** | ✅ 22/22 | Toutes les tables ont RLS activé |
| **Politiques RLS** | ⚠️ Partielles | Certaines policies filtrent par user_id seulement |
| **Fonctions RPC** | 🔴 34 à risque | Fonctions SECURITY DEFINER sans filtrage company_id |

---

## 1️⃣ AUDIT DES TABLES

### ✅ Tables avec company_id (17 tables)

| Table | company_id | Nullable | FK vers companies |
|-------|------------|----------|-------------------|
| produits | ✅ | NO | ✅ |
| commandes | ✅ | NO | ✅ |
| fournisseurs | ✅ | NO | ✅ |
| warehouses | ✅ | NO | ✅ |
| parametres | ✅ | NO | ✅ |
| articles_commande | ✅ | YES ⚠️ | ✅ |
| fournisseur_contacts | ✅ | NO | ✅ |
| kpi_history | ✅ | NO | ✅ |
| kpi_snapshots | ✅ | NO | ✅ |
| notifications | ✅ | NO | ✅ |
| order_comments | ✅ | NO | ✅ |
| product_mapping | ✅ | NO | ✅ |
| sales_history | ✅ | NO | ✅ |
| shopify_location_mapping | ✅ | NO | ✅ |
| sku_fournisseurs | ✅ | NO | ✅ |
| unmapped_products | ✅ | NO | ✅ |
| user_profiles | ✅ | YES | ✅ |

### ⚠️ Tables sans company_id (5 tables)

| Table | Raison | Risque |
|-------|--------|--------|
| companies | Table parente | ✅ OK |
| waitlist | Pré-inscription globale | ✅ OK |
| notification_cooldowns | Filtre par user_id | ⚠️ Acceptable |
| notification_email_queue | Filtre par user_id | ⚠️ Acceptable |
| notification_preferences | Filtre par user_id | ⚠️ Acceptable |

---

## 2️⃣ AUDIT DES POLITIQUES RLS

### ✅ Tables avec isolation company_id correcte (13 tables)

- `produits` - `company_id = get_current_user_company_id()`
- `commandes` - `company_id = get_current_user_company_id()`
- `fournisseurs` - `company_id = get_current_user_company_id()`
- `warehouses` - `company_id = get_current_user_company_id()`
- `parametres` - `company_id = get_current_user_company_id()`
- `articles_commande` - Via relation commandes
- `fournisseur_contacts` - `company_id = get_current_user_company_id()`
- `kpi_history` - `company_id = get_current_user_company_id()`
- `kpi_snapshots` - `company_id = get_current_user_company_id()`
- `notifications` - `company_id AND user_id`
- `order_comments` - `company_id = get_current_user_company_id()`
- `product_mapping` - `company_id = get_current_user_company_id()`
- `sales_history` - `company_id = get_current_user_company_id()`
- `shopify_location_mapping` - `company_id = get_current_user_company_id()`
- `sku_fournisseurs` - `company_id = get_current_user_company_id()`
- `unmapped_products` - `company_id = get_current_user_company_id()`

### ⚠️ Tables avec isolation user_id seulement (4 tables)

Ces tables sont par utilisateur, pas par entreprise. C'est acceptable pour des préférences personnelles.

- `notification_cooldowns` - user_id = auth.uid()
- `notification_email_queue` - user_id = auth.uid()
- `notification_preferences` - user_id = auth.uid()
- `user_profiles` - id = auth.uid()

---

## 3️⃣ AUDIT DES FONCTIONS RPC

### 🔴 FONCTIONS CRITIQUES SANS FILTRAGE company_id (34)

Ces fonctions utilisent `SECURITY DEFINER` et accèdent à des tables métier sans filtrer par `company_id`. 
**RISQUE: Un marchand peut voir/modifier les données d'autres marchands !**

#### Accès à `produits` (23 fonctions) - CRITIQUE

| Fonction | Opération | Risque |
|----------|-----------|--------|
| `search_products_fuzzy` | SELECT | 🔴 Fuite de données |
| `update_product` | UPDATE | 🔴 Modification cross-tenant |
| `update_product_multiplier` | UPDATE | 🔴 Modification cross-tenant |
| `bulk_update_product_multipliers` | UPDATE | 🔴 Modification cross-tenant |
| `bulk_reset_product_multipliers` | UPDATE | 🔴 Modification cross-tenant |
| `reset_product_multiplier_to_default` | UPDATE | 🔴 Modification cross-tenant |
| `assign_supplier_to_product` | UPDATE | 🔴 Modification cross-tenant |
| `add_stock_from_order` | UPDATE | ⚠️ Accepte company_id en param |
| `recalculate_product` | UPDATE | 🔴 Calcul cross-tenant |
| `recalculate_all_investments` | UPDATE | 🔴 Calcul cross-tenant |
| `recalculate_company_products` | UPDATE | ⚠️ Accepte company_id en param |
| `get_product_calculation_details` | SELECT | 🔴 Fuite de données |
| `calculate_advanced_product_metrics` | UPDATE | 🔴 Calcul cross-tenant |
| `process_order_reconciliation` | UPDATE | 🔴 Modification cross-tenant |
| `confirm_order_reconciliation` | UPDATE | ⚠️ Vérifie company_id |
| `receive_replacement_items` | UPDATE | ⚠️ Vérifie company_id |
| `notify_gadget_stock_change` | Trigger | ⚠️ Vérifie company_id |
| `remove_supplier_from_product` | UPDATE | ⚠️ Vérifie company_id |
| `sync_moq_from_supplier` | UPDATE | 🔴 Modification cross-tenant |
| `delete_supplier` | DELETE | 🔴 Cascade cross-tenant |
| `recalculate_products_on_parameter_change` | Trigger | ⚠️ Vérifie company_id |
| `recalculate_products_on_supplier_change` | Trigger | ⚠️ Vérifie company_id |
| `update_ventes_jour_moy_30j_on_sales_change` | Trigger | ⚠️ Vérifie company_id |

#### Accès à `commandes` (6 fonctions)

| Fonction | Opération | Risque |
|----------|-----------|--------|
| `search_orders_fuzzy` | SELECT | 🔴 Fuite de données |
| `update_order_status` | UPDATE | 🔴 Modification cross-tenant |
| `update_order_items_reconciliation` | UPDATE | 🔴 Modification cross-tenant |
| `sync_all_discrepancy_data` | UPDATE | 🔴 Modification cross-tenant |
| `sync_articles_commande_from_reconciliation` | UPDATE | 🔴 Modification cross-tenant |
| `sync_discrepancy_data_from_reconciliation` | UPDATE | 🔴 Modification cross-tenant |

#### Accès à `fournisseurs` (3 fonctions)

| Fonction | Opération | Risque |
|----------|-----------|--------|
| `create_supplier` | INSERT | 🔴 Pas de company_id |
| `update_supplier` | UPDATE | 🔴 Modification cross-tenant |
| `search_suppliers_fuzzy` | SELECT | 🔴 Fuite de données |

#### Accès à `warehouses` (1 fonction)

| Fonction | Opération | Risque |
|----------|-----------|--------|
| `search_warehouses_fuzzy` | SELECT | 🔴 Fuite de données |

#### Accès à `sales_history` (1 fonction)

| Fonction | Opération | Risque |
|----------|-----------|--------|
| `calculate_ventes_jour_ajustees` | UPDATE | 🔴 Calcul cross-tenant |

---

## 4️⃣ ACTIONS CORRECTIVES

### Migration 091: Correction Multi-Tenant des Fonctions Critiques

Les fonctions suivantes doivent être corrigées en PRIORITÉ HAUTE:

1. **Recherches** (SELECT) - Fuite de données
   - `search_products_fuzzy`
   - `search_orders_fuzzy`
   - `search_suppliers_fuzzy`
   - `search_warehouses_fuzzy`
   - `get_product_calculation_details`

2. **Modifications** (UPDATE/INSERT/DELETE) - Corruption cross-tenant
   - `update_product`
   - `update_product_multiplier`
   - `bulk_update_product_multipliers`
   - `bulk_reset_product_multipliers`
   - `create_supplier`
   - `update_supplier`
   - `delete_supplier`
   - `update_order_status`

3. **Calculs globaux** - Calculs incorrects
   - `recalculate_product`
   - `recalculate_all_investments`
   - `calculate_advanced_product_metrics`

---

## 5️⃣ CONCLUSION

### Niveau de Risque Actuel: 🔴 ÉLEVÉ

Avec la structure actuelle, si plusieurs marchands utilisent l'application:
- Un marchand peut **voir** les produits, commandes, fournisseurs des autres
- Un marchand peut **modifier** les données d'autres marchands
- Les **calculs** peuvent mélanger les données de plusieurs marchands

### Recommandation

Appliquer immédiatement la migration 091 pour corriger les fonctions critiques.

---

*Rapport généré automatiquement - Audit Multi-Tenant StockEasy*

