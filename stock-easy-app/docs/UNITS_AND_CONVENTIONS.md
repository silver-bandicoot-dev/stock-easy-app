# Unités et Conventions - Stock Easy

## 📏 Unités Standard

### Stock et Quantités
- `stock` : unités (pièces, articles, etc.)
- `qtyToOrder` : unités à commander
- `qtyToOrderRemaining` : unités à commander après déduction des commandes en cours
- `securityStock` : unités de stock de sécurité (en unités, pas en jours)
- `customSecurityStock` : stock de sécurité personnalisé (en unités)

### Temps et Périodes
- `daysOfStock` : jours d'autonomie restants (calculé comme `stock / salesPerDay`)
- `salesPerDay` : unités vendues par jour (moyenne)
- `rotationRate` : **rotations par an** (confirmé dans StockTab.jsx)
  - Exemple : 6 rot/an = le stock se renouvelle 6 fois par an (tous les ~60 jours)
  - Seuil de rotation rapide : > 4 rotations/an
- `leadTime` / `leadTimeDays` : jours de délai fournisseur
- `securityStockDays` : jours de stock de sécurité (pour affichage, calculé depuis `securityStock`)

### Prix et Valeurs Monétaires
- `buyPrice` : prix d'achat unitaire (€)
- `sellPrice` : prix de vente unitaire (€)
- `margin` : taux de marge (%, ex: 30 pour 30%)
- `grossMargin` : marge brute totale (€) = `(sellPrice - buyPrice) × stock`
- Toutes les valeurs monétaires sont arrondies à 2 décimales

### Taux et Pourcentages
- `rotationRate` : ratio en rotations/an (ex: 4.5 = 4.5 rotations par an)
- `margin` : pourcentage (ex: 30 = 30%)
- `skuAvailabilityRate` : pourcentage (0-100)
- `healthyPercentage` : pourcentage de produits en bonne santé (0-100)
- `inTransitPercentage` : pourcentage de commandes en transit (0-100)

## 🔢 Formules Clés

### Valeur de l'Inventaire
```
inventoryValue = Σ (stock × buyPrice)
```

### Marge Brute Totale
```
grossMargin = Σ ((sellPrice - buyPrice) × stock)
```
**Note:** Si `grossMargin` est pré-calculé par le backend, il est utilisé directement. Sinon, le calcul ci-dessus est appliqué.

### Ventes Perdues (Dashboard - Proactif)
```
lostSales = Σ (daysOutOfStock × salesPerDay × sellPrice)
où daysOutOfStock = max(0, 7 - daysOfStock)
pour produits avec healthStatus = 'urgent'
```
**Approche:** Inclut tous les produits à risque (statut urgent) pour une vision anticipative.

### Ventes Perdues (Analytics - Factuel)
```
lostSales = Σ (7 × salesPerDay × sellPrice)
pour produits avec stock = 0
```
**Approche:** Compte uniquement les ruptures réelles (stock = 0) pour refléter les pertes actuelles.

### Surstock Profond
```
overstockCost = Σ calculateOverstockExcessValue(product, seuil)
où excessDays = daysOfStock - seuil
excessUnits = excessDays × salesPerDay
excessValue = excessUnits × buyPrice
```
**Note:** Seule la valeur de l'excédent est comptée, pas la valeur totale du stock.

### Point de Réapprovisionnement
```
reorderPoint = (salesPerDay × leadTime) + securityStock
où securityStock = salesPerDay × (leadTime × 0.2) (en unités)
```

### Rotation des Stocks
```
rotationRate = (Ventes annuelles) / Stock
où Ventes annuelles = salesPerDay × 365
```

## ⚙️ Constantes Configurables

- `seuilSurstockProfond` : 90 jours (configurable par utilisateur dans les paramètres)
  - Un produit est en surstock profond si `daysOfStock >= seuilSurstockProfond`
- `FAST_ROTATION_THRESHOLD` : 4 rotations/an (défini dans `analyticsKPIs.js`)
  - Produits avec `rotationRate > 4` sont considérés comme "rotation rapide"
- `estimatedOutOfStockDays` : 7 jours (estimation moyenne de rupture pour calcul ventes perdues)

## 📊 Différences entre Dashboard et Analytics

### Ventes Perdues
- **Dashboard** : Approche proactive - inclut tous les produits avec `healthStatus === 'urgent'`
  - Permet d'anticiper les pertes potentielles avant la rupture totale
- **Analytics** : Approche factuelle - inclut uniquement les produits avec `stock === 0`
  - Reflète les pertes réelles actuelles

**Les deux approches sont valides** et complémentaires :
- Dashboard = vision anticipative pour actions préventives
- Analytics = vision factuelle pour analyse historique

## ✅ Validations Runtime

Le système de validation (`validators.js`) vérifie automatiquement :

- ✅ `sellPrice >= buyPrice` (pas de marge négative)
- ✅ `stock >= 0` (pas de stock négatif)
- ✅ `salesPerDay >= 0` (pas de ventes négatives)
- ✅ `buyPrice >= 0` et `sellPrice >= 0` (pas de prix négatifs)
- ✅ `daysOfStock >= 0` (pas de jours négatifs)
- ✅ `rotationRate >= 0` (pas de rotation négative)
- ✅ `leadTimeDays >= 0` (pas de délai négatif)

Les warnings sont loggés en mode développement uniquement.

## 🔍 Notes Importantes

1. **Stock de Sécurité** : Toujours en **unités**, pas en jours
   - Backend : `stock_securite = salesPerDay × (leadTime × 0.2)` (unités)
   - Pour affichage : `securityStockDays = securityStock / salesPerDay` (jours)

2. **Rotation Rate** : Toujours en **rotations/an**
   - Confirmé dans `StockTab.jsx` : `> 6 rotations/an = rapide`
   - Seuil utilisé dans Analytics : `> 4 rotations/an`

3. **Marge Brute** : Toujours calculée comme `(sellPrice - buyPrice) × stock`
   - Si `grossMargin` est pré-calculé par le backend, il est utilisé directement
   - Sinon, le calcul ci-dessus est appliqué

4. **Arrondis** :
   - Prix et valeurs monétaires : 2 décimales (`roundToTwoDecimals`)
   - Ventes par jour : 1 décimale (`roundToOneDecimal`)
   - Quantités et jours : entiers (`roundToInteger`)

## 📚 Références

- `src/utils/calculations.js` : Fonctions de calcul principales
- `src/utils/analyticsKPIs.js` : Calculs des KPIs Analytics
- `src/utils/decimalUtils.js` : Utilitaires d'arrondi avec précision
- `src/utils/validators.js` : Système de validation des données
- `src/hooks/useAnalytics.js` : Hook pour calculs Analytics avec historique
- `src/components/dashboard/DashboardKPIs.jsx` : KPIs du Dashboard

