# 🎯 Colonnes Critiques Ajoutées pour la Gestion Intelligente des Stocks

## 📊 Vue d'Ensemble

Cette migration ajoute **25 nouvelles colonnes essentielles** pour transformer votre application en un système de gestion intelligente des stocks de niveau professionnel.

## ✅ Nouvelles Colonnes Ajoutées

### 🔢 Métriques de Calcul de Base

| Colonne | Type | Description | Calcul Auto |
|---------|------|-------------|-------------|
| `stock_securite` | INTEGER | Stock de sécurité en unités | ✅ |
| `autonomie_jours` | INTEGER | Nombre de jours de ventes couvert par le stock actuel | ✅ |
| `stock_max` | INTEGER | Stock maximum recommandé pour éviter le surstock | ✅ |

### ⚠️ Gestion des Risques

| Colonne | Type | Description | Valeurs |
|---------|------|-------------|---------|
| `risque_rupture` | INTEGER | Risque de rupture de stock (0-100) | 0 = Aucun risque<br>50 = Risque modéré<br>100 = Critique |
| `risque_surstock` | INTEGER | Risque de surstock (0-100) | 0 = Aucun risque<br>50 = Modéré<br>100 = Surstock important |
| `priorite_commande` | INTEGER | Priorité de commande (1-10) | 1-3 = Faible<br>4-7 = Moyenne<br>8-10 = Urgente |
| `notes_alertes` | TEXT | Messages d'alerte automatiques pour l'utilisateur | Générées automatiquement |

### 💰 Métriques Financières

| Colonne | Type | Description | Calcul |
|---------|------|-------------|--------|
| `cout_stockage_unitaire` | NUMERIC(10,4) | Coût de stockage par unité par jour | Default: 0.01€ |
| `cout_stockage_total` | NUMERIC(10,2) | Coût total de stockage actuel | stock_actuel × cout_stockage_unitaire |
| `revenu_potentiel` | NUMERIC(10,2) | Revenu si tout le stock est vendu | stock_actuel × prix_vente |
| `marge_brute` | NUMERIC(10,2) | Marge brute totale du stock | stock_actuel × marge_unitaire |

### 📈 Performance et Analyse

| Colonne | Type | Description | Utilisation |
|---------|------|-------------|-------------|
| `taux_rotation` | NUMERIC(10,2) | Nombre de fois que le stock est renouvelé par an | Indicateur de performance clé |
| `score_performance` | INTEGER | Score global de performance (0-100) | Basé sur rotation, marge, risques |
| `categorie_abc` | TEXT | Catégorie ABC du produit | A = Haute valeur<br>B = Moyenne<br>C = Faible |
| `tendance_ventes` | TEXT | Tendance des ventes | hausse, baisse, stable |
| `variation_ventes_pct` | NUMERIC(10,2) | Variation % des ventes sur 30j | Pour détection tendances |

### 📅 Dates et Temporalité

| Colonne | Type | Description | Usage |
|---------|------|-------------|-------|
| `derniere_vente` | TIMESTAMP | Date de la dernière vente | Identifier produits dormants |
| `derniere_commande` | TIMESTAMP | Date de la dernière commande | Suivi réapprovisionnement |
| `date_rupture_estimee` | TIMESTAMP | Date estimée de rupture de stock | Planification proactive |

### 🚚 Logistique et Transit

| Colonne | Type | Description | Impact |
|---------|------|-------------|--------|
| `qte_en_transit` | INTEGER | Quantité commandée mais pas encore reçue | Pour calcul stock projeté |
| `commandes_en_cours` | INTEGER | Nombre de commandes en cours | Vue d'ensemble logistique |
| `stock_projete` | INTEGER | Stock futur estimé | stock_actuel + en_transit - ventes projetées |

### 🔮 Prévisions et Optimisation

| Colonne | Type | Description | Bénéfice |
|---------|------|-------------|----------|
| `coefficient_saisonnalite` | NUMERIC(10,2) | Coefficient pour ajuster les prévisions saisonnières | Default: 1.0 |
| `fiabilite_fournisseur` | INTEGER | Score de fiabilité du fournisseur (0-100) | Default: 80 |

## 🎨 Mapping Frontend ↔ Backend

### Conversion dans `apiAdapter.js`

```javascript
// Backend (snake_case) → Frontend (camelCase)

// ✅ Correction critique
qtyToOrder: p.qteACommander  // ⚠️ NOM CORRECT!

// Nouvelles métriques
daysOfStock: p.autonomieJours
stockoutRisk: p.risqueRupture
overstockRisk: p.risqueSurstock
orderPriority: p.prioriteCommande
alerts: p.notesAlertes
performanceScore: p.scorePerformance
abcCategory: p.categorieAbc
rotationRate: p.tauxRotation
salesTrend: p.tendanceVentes
salesVariation: p.variationVentesPct
qtyInTransit: p.qteEnTransit
ordersInProgress: p.commandesEnCours
projectedStock: p.stockProjecte
stockoutDate: p.dateRuptureEstimee
lastSaleDate: p.derniereVente
lastOrderDate: p.derniereCommande
storageCostPerUnit: p.coutStockageUnitaire
totalStorageCost: p.coutStockageTotal
potentialRevenue: p.revenuPotentiel
grossMargin: p.margeBrute
seasonalityCoefficient: p.coefficientSaisonnalite
supplierReliability: p.fiabiliteFournisseur
```

## 🔄 Calculs Automatiques

Toutes ces métriques sont calculées **automatiquement** par le trigger `trigger_calculate_advanced_metrics` lors de :
- ✅ Insertion d'un nouveau produit
- ✅ Mise à jour d'un produit existant
- ✅ Modification du stock
- ✅ Mise à jour des ventes

### Exemples de Calculs

#### 1. Risque de Rupture
```
Si autonomie_jours = 0          → risque = 100 (CRITIQUE)
Si autonomie_jours ≤ lead_time × 0.5 → risque = 80 (ÉLEVÉ)
Si autonomie_jours ≤ lead_time       → risque = 50 (MODÉRÉ)
Sinon                                → risque = 0-20 (FAIBLE)
```

#### 2. Priorité de Commande
```
Si risque_rupture ≥ 80 → priorité = 10 (URGENT)
Si risque_rupture ≥ 50 → priorité = 8
Si qte_à_commander > 0 → priorité = 6
+ Bonus si marge_unitaire > 20€ → +2 priorité
```

#### 3. Score de Performance
```
Base: 50/100
+ Bonus rotation élevée (>10): +20
+ Bonus marge élevée (>20€): +15
- Malus risque rupture: -risque/5
- Malus risque surstock: -risque/5
Résultat limité entre 0 et 100
```

#### 4. Catégorie ABC
```
Si revenu_potentiel > 10 000€ → Catégorie A (haute valeur)
Si revenu_potentiel > 3 000€  → Catégorie B (moyenne)
Sinon                         → Catégorie C (faible)
```

## 🚨 Alertes Automatiques

Le système génère automatiquement des alertes dans `notes_alertes` :

| Condition | Alerte Générée |
|-----------|----------------|
| Risque rupture ≥ 80 | 🚨 CRITIQUE: Risque de rupture imminent! Commander en urgence. |
| Risque rupture ≥ 50 | ⚠️ ATTENTION: Stock faible. Planifier une commande rapidement. |
| Risque surstock ≥ 70 | 📦 SURSTOCK: Stock excessif. Réduire les commandes futures. |
| Rotation < 2 avec stock > 0 | ⏸️ ROTATION LENTE: Envisager une promotion ou réduire le stock. |

## 📊 Cas d'Usage dans l'Interface

### Dashboard Principal
- **Indicateur de risque**: Afficher `risque_rupture` avec code couleur
- **Priorités**: Trier les produits par `priorite_commande`
- **Alertes**: Afficher `notes_alertes` en bannière

### Page Produit Détaillée
- **Performance**: Afficher `score_performance` et `categorie_abc`
- **Autonomie**: "Stock suffisant pour `autonomie_jours` jours"
- **Prévisions**: "Rupture estimée le `date_rupture_estimee`"

### Analytics
- **Rotation**: Comparer `taux_rotation` entre produits
- **Tendances**: Graphiques basés sur `tendance_ventes` et `variation_ventes_pct`
- **Coûts**: Analyser `cout_stockage_total` par catégorie

### Commandes
- **Urgence**: Filtrer par `priorite_commande` ≥ 8
- **Transit**: Afficher `qte_en_transit` et `commandes_en_cours`
- **Prévisions**: Utiliser `stock_projete` pour optimiser

## 🎯 Index Créés pour Performance

```sql
-- Index simples
idx_produits_risque_rupture
idx_produits_priorite_commande
idx_produits_categorie_abc
idx_produits_tendance_ventes
idx_produits_autonomie_jours
idx_produits_qte_a_commander
idx_produits_derniere_vente
idx_produits_date_rupture_estimee

-- Index composites
idx_produits_statut_risque (statut, risque_rupture)
idx_produits_company_priorite (company_id, priorite_commande)
```

## 🚀 Fonctions RPC Disponibles

### 1. Recalculer tous les produits
```javascript
const { data } = await supabase.rpc('recalculate_company_products');
```

### 2. Recalculer un produit spécifique
```javascript
const { data } = await supabase.rpc('recalculate_product', {
  p_sku: 'SKU-001'
});
```

### 3. Obtenir les détails de calcul (debug)
```javascript
const { data } = await supabase.rpc('get_product_calculation_details', {
  p_sku: 'SKU-001'
});
// Retourne toutes les formules et valeurs intermédiaires
```

## 📝 Étapes de Déploiement

### 1. Appliquer la Migration 013 v3 (Correction des noms de colonnes)
```sql
-- Dans Supabase SQL Editor
-- Exécuter: 013_implement_qty_to_order_calculation_v3.sql
```

### 2. Appliquer la Migration 015 (Nouvelles colonnes)
```sql
-- Dans Supabase SQL Editor
-- Exécuter: 015_add_critical_missing_columns.sql
```

### 3. Vérifier les Résultats
```sql
-- Voir un exemple avec toutes les métriques
SELECT 
  sku,
  nom_produit,
  stock_actuel,
  autonomie_jours,
  risque_rupture,
  priorite_commande,
  score_performance,
  categorie_abc,
  notes_alertes
FROM produits
WHERE ventes_jour_ajustees > 0
ORDER BY priorite_commande DESC
LIMIT 5;
```

### 4. Test Frontend
- Ouvrir l'application
- Vérifier que toutes les nouvelles métriques s'affichent
- Confirmer que `qtyToOrder` apparaît correctement pour SKU-003

## 💡 Recommandations d'Utilisation

### Pour les Utilisateurs Finaux
1. **Prioriser** les commandes par `priorite_commande`
2. **Surveiller** les produits avec `risque_rupture` ≥ 50
3. **Optimiser** le stock des produits catégorie A
4. **Réagir** aux `notes_alertes` affichées

### Pour les Développeurs
1. Utiliser `apiAdapter.js` pour accéder aux métriques
2. Créer des vues filtrées par `categorie_abc`
3. Afficher des graphiques de `taux_rotation`
4. Implémenter des notifications basées sur `notes_alertes`

## ✨ Bénéfices

- 🎯 **Précision**: Calculs automatiques basés sur des formules éprouvées
- ⚡ **Réactivité**: Alertes automatiques pour actions urgentes
- 📊 **Visibilité**: Métriques claires pour décisions éclairées
- 💰 **Rentabilité**: Optimisation des coûts de stockage
- 🔮 **Prévision**: Anticipation des ruptures et surstock
- 🏆 **Performance**: Système de scoring pour identifier les produits clés

---

**🎉 Votre application est maintenant une plateforme de gestion intelligente des stocks de niveau professionnel !**

