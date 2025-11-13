# 🔍 Analyse du Schéma de la Table Produits

## 📋 Structure Complète de la Table `produits`

### Colonnes Existantes dans la Base de Données

| # | Nom de Colonne | Type | Description |
|---|----------------|------|-------------|
| 1 | `sku` | string | Identifiant unique du produit (SKU) |
| 2 | `nom_produit` | string | Nom du produit |
| 3 | `fournisseur` | string | Nom du fournisseur |
| 4 | `stock_actuel` | number | Stock actuel en unités |
| 5 | `ventes_jour_ajustees` | number | Ventes par jour (ajustées) |
| 6 | `ventes_jour_moy_30j` | number | Moyenne des ventes/jour sur 30 jours |
| 7 | `ventes_totales_30j` | number | Total des ventes sur 30 jours |
| 8 | `lead_time_days` | number | Délai de livraison en jours |
| 9 | `moq` | number | Quantité minimum de commande (MOQ) |
| 10 | `prix_achat` | number | Prix d'achat unitaire |
| 11 | `prix_vente` | number | Prix de vente unitaire |
| 12 | `marge_unitaire` | number | Marge unitaire |
| 13 | `inventory_value` | number | Valeur du stock |
| 14 | `investissement` | number | Investissement total |
| 15 | `multiplicateur_prevision` | number | Multiplicateur pour les prévisions |
| 16 | `stock_secu_custom_jours` | number | Stock de sécurité personnalisé **EN JOURS** |
| 17 | `point_commande` | number | Point de commande (reorder point) |
| 18 | `qte_a_commander` | number | **Quantité à commander** ⚠️ |
| 19 | `statut` | string | Statut du produit (active, etc.) |
| 20 | `created_at` | timestamp | Date de création |
| 21 | `updated_at` | timestamp | Date de dernière mise à jour |

### ⚠️ Colonnes Importantes - Noms Corrects

**ATTENTION:** Les noms de colonnes dans la base de données sont différents de ce qui était supposé !

| Supposé (❌ FAUX) | Réel (✅ CORRECT) |
|-------------------|-------------------|
| `quantite_a_commander` | `qte_a_commander` |
| `stock_securite` | **N'EXISTE PAS** - doit être ajouté |
| `autonomie_jours` | **N'EXISTE PAS** - doit être ajouté |
| `stock_securite_personnalise` | `stock_secu_custom_jours` (en JOURS, pas en unités) |

## 📊 Colonnes Clés pour les Calculs

### Entrées (existantes)
- `stock_actuel` - Stock actuel en unités
- `ventes_jour_ajustees` - Ventes par jour
- `lead_time_days` - Délai de livraison en jours
- `moq` - Quantité minimum de commande
- `stock_secu_custom_jours` - Stock de sécurité personnalisé en jours (optionnel)

### Sorties Calculées
- `stock_securite` - Stock de sécurité en unités (À CRÉER)
- `point_commande` - Point de commande (EXISTE)
- `qte_a_commander` - Quantité à commander ⚠️ NOM CORRECT
- `autonomie_jours` - Autonomie en jours de stock (À CRÉER)

## 🔢 Formules de Calcul

### 1. Stock de Sécurité
```
SI stock_secu_custom_jours défini:
  stock_securite = ventes_jour_ajustees × stock_secu_custom_jours

SINON:
  stock_securite = MAX(1, CEIL(ventes_jour_ajustees × lead_time_days × 0.2))
```

### 2. Point de Commande
```
point_commande = (ventes_jour_ajustees × lead_time_days) + stock_securite
point_commande = MAX(point_commande, moq)
```

### 3. Quantité à Commander
```
SI stock_actuel ≤ point_commande:
  qte_brute = point_commande - stock_actuel + CEIL(ventes_jour_ajustees × 7)
  qte_a_commander = CEIL(qte_brute / moq) × moq
  qte_a_commander = MAX(qte_a_commander, moq)

SINON:
  qte_a_commander = 0
```

### 4. Autonomie en Jours
```
SI ventes_jour_ajustees > 0:
  autonomie_jours = FLOOR(stock_actuel / ventes_jour_ajustees)

SINON:
  autonomie_jours = 999  (stock théoriquement infini)
```

## 🛠️ Migration Corrigée

La migration `013_implement_qty_to_order_calculation_v3.sql` a été créée avec:

1. ✅ Ajout des colonnes manquantes (`stock_securite`, `autonomie_jours`)
2. ✅ Utilisation des **vrais noms de colonnes**
3. ✅ Fonction trigger `calculate_product_metrics()` avec formules précises
4. ✅ Fonctions RPC pour recalculer les produits
5. ✅ Fonction de debug `get_product_calculation_details()` pour vérifier les calculs

## 🔗 Mapping Frontend ↔ Backend

### Dans `apiAdapter.js`

```javascript
// Backend (snake_case) → Frontend (camelCase)
stock: p.stock_actuel
salesPerDay: p.ventes_jour_ajustees
leadTime: p.lead_time_days
reorderPoint: p.point_commande
qtyToOrder: p.qte_a_commander  // ⚠️ NOM CORRECT!
securityStock: p.stock_securite
customSecurityStock: p.stock_secu_custom_jours
```

## 🧪 Étapes de Test

1. **Appliquer la migration:**
   ```bash
   # Dans le SQL Editor de Supabase
   # Exécuter: 013_implement_qty_to_order_calculation_v3.sql
   ```

2. **Vérifier les calculs:**
   ```sql
   -- Vérifier qu'un produit a bien ses métriques calculées
   SELECT * FROM get_product_calculation_details('SKU-001');
   ```

3. **Tester le frontend:**
   - Ouvrir la section "Stock Level"
   - Vérifier que `salesPerDay`, `reorderPoint`, et `qtyToOrder` s'affichent correctement
   - Pour SKU-003: doit afficher `qtyToOrder = 50` (ou la valeur calculée)

## 📝 Notes Importantes

1. **Nommage des colonnes:** La base de données utilise des noms abrégés comme `qte_a_commander` au lieu de `quantite_a_commander`.

2. **Stock de sécurité personnalisé:** Stocké en JOURS (pas en unités), puis converti en unités lors du calcul.

3. **Trigger automatique:** Tous les calculs sont automatiques lors de l'insertion ou mise à jour d'un produit.

4. **RLS et Multi-tenant:** Les fonctions respectent la séparation des données entre entreprises.

## ✅ Résolution du Problème

Le problème initial était que le SQL utilisait `quantite_a_commander` alors que la vraie colonne s'appelle `qte_a_commander`. Cette analyse complète du schéma a permis d'identifier tous les noms corrects de colonnes.

