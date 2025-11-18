# 🔄 Système de Synchronisation Dynamique - StockEasy

## Vue d'ensemble

StockEasy est maintenant un système **complètement dynamique et synchronisé en temps réel**. Tous les composants (ML, Analytics, Dashboard) se mettent à jour automatiquement quand les données changent.

## 🎯 Objectifs

- ✅ Synchronisation en temps réel de toutes les données
- ✅ Recalcul automatique de toutes les métriques
- ✅ Mise à jour automatique du ML quand de nouveaux produits sont ajoutés
- ✅ Mise à jour automatique des Analytics quand les données changent
- ✅ Mise à jour automatique du Dashboard en temps réel
- ✅ Recalcul automatique quand les paramètres changent (MultiplicateurDefaut, seuilSurstockProfond, etc.)
- ✅ Recalcul automatique quand les fournisseurs changent (MOQ, leadTimeDays, etc.)

## 🔧 Architecture

### 1. Synchronisation en Temps Réel (Frontend)

#### Hook `useSupabaseSync`
Écoute les changements sur **toutes les tables critiques** :

- ✅ **produits** - Changements de produits (ajout, modification, suppression)
- ✅ **commandes** - Changements de commandes
- ✅ **articles_commande** - Changements d'articles de commande
- ✅ **fournisseurs** - Changements de fournisseurs (MOQ, leadTimeDays, etc.)
- ✅ **warehouses** - Changements d'entrepôts
- ✅ **sales_history** - **NOUVEAU** - Changements d'historique de ventes (impact direct sur rotation, ML)
- ✅ **parametres** - **NOUVEAU** - Changements de paramètres (MultiplicateurDefaut, seuilSurstockProfond, etc.)

**Fichier**: `src/hooks/useSupabaseSync.js`

**Utilisation**:
```javascript
// Dans StockEasy.jsx
useSupabaseSync(() => {
  console.log('🔄 Real-time: Changement détecté, rechargement des données...');
  loadData();
}, true);
```

### 2. Recalcul Automatique (Backend - PostgreSQL)

#### Triggers PostgreSQL

**Migration 052**: Calcul automatique de `ventes_jour_moy_30j`
- Calcule automatiquement `ventes_jour_moy_30j` à partir de `sales_history` (30 derniers jours)
- Met à jour automatiquement quand de nouvelles ventes sont ajoutées
- Recalcule pour tous les produits existants

**Migration 053**: Recalcul automatique sur changements
- **Trigger sur `parametres`**: Recalcule tous les produits quand un paramètre critique change
  - MultiplicateurDefaut → impacte `ventes_jour_ajustees`
  - seuilSurstockProfond → impacte les calculs de surstock
- **Trigger sur `fournisseurs`**: Recalcule tous les produits d'un fournisseur quand MOQ ou leadTimeDays change
- **Activation Realtime** sur `sales_history` et `parametres`

### 3. Mise à Jour Automatique du ML

#### Hook `useDemandForecast`
- ✅ Se met à jour automatiquement quand de nouveaux produits sont ajoutés
- ✅ Génère des prévisions pour tous les produits, y compris les nouveaux
- ✅ Utilise `useMemo` avec dépendances sur `products` pour recalculer automatiquement

**Fichier**: `src/hooks/ml/useDemandForecast.js`

**Changements**:
- Le `useEffect` dépend maintenant de `products` au lieu d'être exécuté une seule fois
- Génère automatiquement les prévisions pour tous les produits quand ils changent

### 4. Mise à Jour Automatique des Analytics

#### Hook `useAnalytics`
- ✅ Utilise `useMemo` avec dépendances sur `products`, `orders`, `seuilSurstockProfond`
- ✅ Recalcule automatiquement tous les KPIs quand les données changent
- ✅ Recalcule automatiquement quand les paramètres changent

**Fichier**: `src/hooks/useAnalytics.js`

**Dépendances**:
```javascript
const currentKPIs = useMemo(() => {
  // Calcul des KPIs
}, [products, orders, seuilSurstockProfond]);
```

### 5. Mise à Jour Automatique du Dashboard

#### Composants Dashboard
- ✅ Utilisent les données de `useStockData` qui se mettent à jour automatiquement
- ✅ Utilisent `useMemo` pour recalculer les métriques quand les données changent
- ✅ Réagissent automatiquement aux changements via la synchronisation en temps réel

**Exemple**: `enrichedProducts` dans `StockEasy.jsx`
```javascript
const enrichedProducts = useMemo(() => 
  products.map(p => calculateMetrics(p, seuilSurstockProfond)), 
  [products, seuilSurstockProfond]
);
```

## 📊 Flux de Synchronisation

```
┌─────────────────────────────────────────────────────────────┐
│                    CHANGEMENT DE DONNÉES                     │
│  (Produit, Commande, Vente, Paramètre, Fournisseur, etc.)    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE REALTIME (PostgreSQL)                  │
│  - Trigger PostgreSQL recalcule les métriques                │
│  - Realtime publie l'événement                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              useSupabaseSync (Frontend)                       │
│  - Détecte le changement                                      │
│  - Appelle loadData()                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              useStockData.loadData()                          │
│  - Recharge toutes les données depuis Supabase                │
│  - Met à jour products, orders, suppliers, etc.              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              COMPOSANTS REACT                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ useDemandForecast                                    │    │
│  │ - Détecte changement de products                    │    │
│  │ - Génère nouvelles prévisions ML                    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ useAnalytics                                         │    │
│  │ - Détecte changement de products/orders              │    │
│  │ - Recalcule tous les KPIs                           │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Dashboard Components                                │    │
│  │ - Détectent changement de données                   │    │
│  │ - Se mettent à jour automatiquement                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Cas d'Usage

### Cas 1: Ajout d'un Nouveau Produit
1. ✅ Produit créé dans Supabase
2. ✅ Trigger PostgreSQL calcule `ventes_jour_moy_30j` (0 si pas de ventes)
3. ✅ Trigger calcule `ventes_jour_ajustees` (0 si pas de ventes)
4. ✅ Trigger calcule rotation (0 si pas de ventes)
5. ✅ Realtime publie l'événement
6. ✅ `useSupabaseSync` détecte le changement
7. ✅ `loadData()` recharge les données
8. ✅ `useDemandForecast` génère des prévisions pour le nouveau produit
9. ✅ `useAnalytics` recalcule les KPIs
10. ✅ Dashboard se met à jour

### Cas 2: Ajout d'une Vente
1. ✅ Vente ajoutée dans `sales_history`
2. ✅ Trigger PostgreSQL recalcule `ventes_jour_moy_30j` pour le produit
3. ✅ Trigger recalcule `ventes_jour_ajustees` (ventes_jour_moy_30j × multiplicateur)
4. ✅ Trigger recalcule rotation (ventes_jour_ajustees × 365 / stock)
5. ✅ Realtime publie l'événement
6. ✅ `useSupabaseSync` détecte le changement
7. ✅ `loadData()` recharge les données
8. ✅ ML se met à jour avec nouvelles données de ventes
9. ✅ Analytics se mettent à jour
10. ✅ Dashboard se met à jour

### Cas 3: Changement de Paramètre (MultiplicateurDefaut)
1. ✅ Paramètre mis à jour dans `parametres`
2. ✅ Trigger PostgreSQL détecte le changement
3. ✅ Trigger recalcule `ventes_jour_ajustees` pour tous les produits
4. ✅ Trigger recalcule rotation, points de commande, etc.
5. ✅ Realtime publie l'événement
6. ✅ `useSupabaseSync` détecte le changement
7. ✅ `loadData()` recharge les données
8. ✅ ML se met à jour avec nouvelles prévisions
9. ✅ Analytics se mettent à jour
10. ✅ Dashboard se met à jour

### Cas 4: Changement de Fournisseur (MOQ, leadTimeDays)
1. ✅ Fournisseur mis à jour dans `fournisseurs`
2. ✅ Trigger PostgreSQL détecte le changement
3. ✅ Trigger recalcule tous les produits de ce fournisseur
4. ✅ Recalcule points de commande, quantités à commander, etc.
5. ✅ Realtime publie l'événement
6. ✅ `useSupabaseSync` détecte le changement
7. ✅ `loadData()` recharge les données
8. ✅ ML se met à jour
9. ✅ Analytics se mettent à jour
10. ✅ Dashboard se met à jour

## 📝 Migrations SQL

### Migration 052: Calcul automatique de ventes_jour_moy_30j
**Fichier**: `supabase/migrations/052_calculate_ventes_jour_moy_30j_from_sales_history.sql`

**Fonctionnalités**:
- Calcule `ventes_jour_moy_30j` à partir de `sales_history` (30 derniers jours)
- Met à jour automatiquement quand de nouvelles ventes sont ajoutées
- Recalcule pour tous les produits existants

### Migration 053: Activation Realtime et Recalcul Automatique
**Fichier**: `supabase/migrations/053_enable_realtime_and_auto_recalculation.sql`

**Fonctionnalités**:
- Active Realtime sur `sales_history` et `parametres`
- Crée un trigger pour recalculer tous les produits quand un paramètre change
- Crée un trigger pour recalculer les produits quand un fournisseur change (MOQ, leadTimeDays)

## ✅ Checklist de Vérification

- [x] Realtime activé sur toutes les tables critiques
- [x] Triggers PostgreSQL pour recalcul automatique
- [x] `useSupabaseSync` écoute tous les changements
- [x] ML se met à jour automatiquement
- [x] Analytics se recalculent automatiquement
- [x] Dashboard se met à jour automatiquement
- [x] Synchronisation périodique réduite à 2 minutes (backup)
- [x] Tous les composants utilisent `useMemo` avec bonnes dépendances

## 🚀 Résultat

Le système est maintenant **complètement dynamique et synchronisé**. Tous les changements sont détectés en temps réel et toutes les métriques sont recalculées automatiquement. Les utilisateurs voient toujours les données les plus récentes sans avoir besoin de rafraîchir la page.

