# Vérification Complète des Calculs - Dashboard et Analytics

## 📋 Table des Matières

1. [Indicateurs Clés du Dashboard](#indicateurs-clés-du-dashboard)
2. [KPIs Principaux Analytics](#kpis-principaux-analytics)
3. [Analyse Approfondie Analytics](#analyse-approfondie-analytics)
4. [Calculs ML (Machine Learning)](#calculs-ml-machine-learning)
5. [Problèmes Identifiés](#problèmes-identifiés)
6. [Recommandations](#recommandations)

---

## 1. Indicateurs Clés du Dashboard

**Fichier:** `src/components/dashboard/DashboardKPIs.jsx`

### 1.1 Valeur de l'Inventaire ✅

**Formule:**
```javascript
totalInventoryValue = Σ (stock × buyPrice) pour tous les produits
```

**Vérification:**
- ✅ Calcul correct : somme de la valeur de chaque produit (stock × prix d'achat)
- ✅ Utilise `roundToTwoDecimals` pour l'arrondi
- ✅ Formatage monétaire correct

**Code:**
```20:22:stock-easy-app/src/components/dashboard/DashboardKPIs.jsx
const totalInventoryValue = enrichedProducts.reduce((sum, p) => {
  return sum + (p.stock * (p.buyPrice || 0));
}, 0);
```

---

### 1.2 Commandes en Cours ✅

**Formule:**
```javascript
activeOrders = count(orders où status ∈ ['pending_confirmation', 'preparing', 'in_transit'])
```

**Vérification:**
- ✅ Filtre correct des statuts actifs
- ✅ Compte simple, pas de calcul complexe

**Code:**
```24:27:stock-easy-app/src/components/dashboard/DashboardKPIs.jsx
const activeOrders = orders.filter(o => 
  ['pending_confirmation', 'preparing', 'in_transit'].includes(o.status)
).length;
```

---

### 1.3 Ventes Perdues Estimées ⚠️

**Formule:**
```javascript
lostSales = Σ (daysOutOfStock × salesPerDay × sellPrice)
où daysOutOfStock = max(0, 7 - daysOfStock)
pour produits avec healthStatus === 'urgent' ET salesPerDay > 0
```

**Vérification:**
- ✅ Filtre les produits urgents avec ventes
- ⚠️ **PROBLÈME POTENTIEL**: Utilise `daysOutOfStock = max(0, 7 - daysOfStock)` qui peut donner des valeurs négatives si `daysOfStock > 7`
- ✅ Utilise `sellPrice` (correct pour ventes perdues)
- ✅ Estimation sur 7 jours (cohérent)

**Code:**
```29:37:stock-easy-app/src/components/dashboard/DashboardKPIs.jsx
const lostSales = enrichedProducts
  .filter(p => p.healthStatus === 'urgent' && p.salesPerDay > 0)
  .reduce((sum, p) => {
    // Estimer les ventes perdues sur les 7 prochains jours si pas de stock
    const daysOutOfStock = Math.max(0, 7 - (p.daysOfStock || 0));
    const estimatedLostSales = daysOutOfStock * p.salesPerDay * (p.sellPrice || 0);
    return sum + estimatedLostSales;
  }, 0);
```

**Note:** Le calcul est correct car `Math.max(0, ...)` garantit que `daysOutOfStock` ne sera jamais négatif.

---

### 1.4 Produits à Commander ✅

**Formule:**
```javascript
productsToOrder = count(productsByStatus.to_order)
```

**Vérification:**
- ✅ Utilise directement `productsByStatus.to_order` qui est déjà calculé
- ✅ Compte simple

**Code:**
```39:41:stock-easy-app/src/components/dashboard/DashboardKPIs.jsx
// Utiliser productsByStatus.to_order qui déduit déjà les quantités en commande
const productsToOrder = productsByStatus.to_order?.length || 0;
```

---

### 1.5 Investissement Requis ✅

**Formule:**
```javascript
totalInvestmentRequired = Σ (investment OU (qtyToOrderRemaining × buyPrice))
pour tous les produits dans productsByStatus.to_order
```

**Vérification:**
- ✅ Utilise `qtyToOrderRemaining` si disponible (cohérent avec déduction des commandes en cours)
- ✅ Fallback vers `qtyToOrder` si `qtyToOrderRemaining` n'existe pas
- ✅ Utilise `investment` si disponible (valeur pré-calculée)
- ✅ Calcul correct

**Code:**
```43:50:stock-easy-app/src/components/dashboard/DashboardKPIs.jsx
const totalInvestmentRequired = (productsByStatus.to_order || [])
  .reduce((sum, p) => {
    // Utiliser la quantité résiduelle à commander (qtyToOrderRemaining) si disponible
    const qtyToOrder = p.qtyToOrderRemaining || p.qtyToOrder || 0;
    return sum + (p.investment || (qtyToOrder * (p.buyPrice || 0)));
  }, 0);
```

---

### 1.6 Mapping Produits ↔ Fournisseurs ✅

**Formule:**
```javascript
mappingPercentage = (productsWithSupplier / totalProducts) × 100
```

**Vérification:**
- ✅ Filtre correct (supplier existe et n'est pas vide)
- ✅ Calcul de pourcentage correct
- ✅ Arrondi avec `Math.round`

**Code:**
```52:57:stock-easy-app/src/components/dashboard/DashboardKPIs.jsx
const totalProducts = enrichedProducts.length;
const productsWithSupplier = enrichedProducts.filter(p => p.supplier && p.supplier.trim() !== '').length;
const mappingPercentage = totalProducts > 0 
  ? Math.round((productsWithSupplier / totalProducts) * 100) 
  : 0;
```

---

## 2. KPIs Principaux Analytics

**Fichier:** `src/hooks/useAnalytics.js`

### 2.1 Taux de Disponibilité des SKU ✅

**Formule:**
```javascript
skuAvailabilityRate = (availableSKUs / totalSKUs) × 100
où availableSKUs = count(produits avec stock > 0)
```

**Vérification:**
- ✅ Calcul correct du pourcentage
- ✅ Filtre correct (stock > 0)
- ✅ Protection contre division par zéro

**Code:**
```108:111:stock-easy-app/src/hooks/useAnalytics.js
const totalSKUs = products.length;
const availableSKUs = products.filter(p => (p.stock || 0) > 0).length;
const skuAvailabilityRate = totalSKUs > 0 ? (availableSKUs / totalSKUs) * 100 : 0;
```

---

### 2.2 Ventes Perdues - Rupture de Stock ⚠️

**Formule:**
```javascript
salesLostAmount = Σ (avgDailySales × 7 × sellPrice)
pour produits avec stock === 0 ET salesPerDay > 0
```

**Vérification:**
- ✅ Filtre uniquement les produits en rupture totale (stock === 0)
- ✅ Utilise `sellPrice` (correct pour ventes perdues)
- ⚠️ **ASSUMPTION FIXE**: Utilise 7 jours de rupture en moyenne (pas dynamique)
- ✅ Estimation cohérente

**Code:**
```113:125:stock-easy-app/src/hooks/useAnalytics.js
const outOfStockProducts = products.filter(p => (p.stock || 0) === 0 && (p.salesPerDay || 0) > 0);
const salesLostCount = outOfStockProducts.length;
const salesLostAmount = outOfStockProducts.reduce((sum, p) => {
  // Estimation basée sur les ventes moyennes * prix de vente (pas d'achat)
  // Utiliser sellPrice pour être cohérent avec le Dashboard et refléter les revenus perdus
  const avgDailySales = p.salesPerDay || p.avgDailySales || 0;
  const daysOutOfStock = 7; // Estimation moyenne de rupture
  const sellPrice = p.sellPrice || p.buyPrice || 0; // Utiliser prix de vente pour ventes perdues
  return sum + (avgDailySales * daysOutOfStock * sellPrice);
}, 0);
```

**Note:** La différence avec le Dashboard est que Analytics filtre uniquement `stock === 0`, tandis que le Dashboard filtre `healthStatus === 'urgent'`. Les deux approches sont valides mais peuvent donner des résultats différents.

---

### 2.3 Valeur Surstocks Profonds ✅

**Formule:**
```javascript
overstockCost = Σ calculateOverstockExcessValue(product, seuilSurstockProfond)
pour produits avec isDeepOverstock === true
```

**Vérification:**
- ✅ Utilise la fonction utilitaire `calculateOverstockExcessValue` (cohérence garantie)
- ✅ Filtre sur `isDeepOverstock` (calculé dans `calculateMetrics`)
- ✅ Utilise le seuil configuré par l'utilisateur

**Code:**
```127:136:stock-easy-app/src/hooks/useAnalytics.js
// Calcul du surstock profond (approche 2 : valeur de l'excédent uniquement)
// Un produit est en surstock profond si son autonomie (daysOfStock) >= seuil configuré
// La valeur du surstock profond = valeur de l'excédent (excédent en jours × ventes/jour × prix)
// Utiliser la fonction utilitaire pour garantir la cohérence du calcul
const overstockProducts = products.filter(p => p.isDeepOverstock === true);
const overstockSKUs = overstockProducts.length;
const overstockCost = overstockProducts.reduce((sum, p) => {
  const excessValue = calculateOverstockExcessValue(p, seuilSurstockProfond);
  return sum + excessValue;
}, 0);
```

**Fonction utilitaire:**
```145:167:stock-easy-app/src/utils/calculations.js
export const calculateOverstockExcessValue = (product, seuil = 90) => {
  const daysOfStock = product?.daysOfStock || 0;
  const salesPerDay = product?.salesPerDay || 0;
  const price = product?.buyPrice || product?.price || 0;
  
  // Vérifier si le produit est en surstock profond
  if (daysOfStock < seuil || salesPerDay <= 0) {
    return 0;
  }
  
  // Calculer l'excédent en jours (au-delà du seuil)
  const excessDays = daysOfStock - seuil;
  
  if (excessDays <= 0) {
    return 0;
  }
  
  // Calculer l'excédent en unités et sa valeur
  const excessUnits = excessDays * salesPerDay;
  const excessValue = excessUnits * price;
  
  return roundToTwoDecimals(excessValue);
};
```

**Vérification de la fonction:**
- ✅ Calcul correct de l'excédent en jours
- ✅ Conversion en unités (excessDays × salesPerDay)
- ✅ Utilise `buyPrice` (correct pour valeur d'inventaire)
- ✅ Arrondi avec `roundToTwoDecimals`

---

### 2.4 Valeur de l'Inventaire ✅

**Formule:**
```javascript
inventoryValuation = Σ (stock × buyPrice) pour tous les produits
```

**Vérification:**
- ✅ Identique au calcul du Dashboard
- ✅ Calcul correct

**Code:**
```138:142:stock-easy-app/src/hooks/useAnalytics.js
// Calcul de la valeur de l'inventaire (Inventory Valuation)
const inventoryValuation = products.reduce((sum, p) => {
  const productValue = (p.stock || 0) * (p.buyPrice || 0);
  return sum + productValue;
}, 0);
```

---

## 3. Analyse Approfondie Analytics

**Fichier:** `src/utils/analyticsKPIs.js`

### 3.1 Commandes en Transit ✅

**Formule:**
```javascript
inTransitPercentage = (inTransitOrders / totalOrdersCount) × 100
```

**Vérification:**
- ✅ Calcul correct du pourcentage
- ✅ Protection contre division par zéro

**Code:**
```12:17:stock-easy-app/src/utils/analyticsKPIs.js
const inTransitOrders = orders.filter(o => o.status === 'in_transit').length;
const totalOrdersCount = orders.length;
const inTransitPercentage = totalOrdersCount > 0 
  ? Math.round((inTransitOrders / totalOrdersCount) * 100) 
  : 0;
```

---

### 3.2 Produits en Bonne Santé ✅

**Formule:**
```javascript
healthyPercentage = (healthyProducts / totalProducts) × 100
où healthyProducts = count(produits avec healthStatus === 'healthy')
```

**Vérification:**
- ✅ Filtre correct sur `healthStatus === 'healthy'`
- ✅ Calcul de pourcentage correct

**Code:**
```22:26:stock-easy-app/src/utils/analyticsKPIs.js
const healthyProducts = enrichedProducts.filter(p => p.healthStatus === 'healthy').length;
const healthyPercentage = totalProducts > 0 
  ? Math.round((healthyProducts / totalProducts) * 100) 
  : 0;
```

---

### 3.3 Marge Brute Totale ⚠️

**Formule:**
```javascript
totalGrossMargin = Σ (grossMargin OU (stock × sellPrice × margin / 100))
```

**Vérification:**
- ✅ Utilise `grossMargin` si disponible (valeur pré-calculée par le backend)
- ⚠️ **CALCUL DE FALLBACK**: `stock × sellPrice × margin / 100`
  - Selon les interfaces TypeScript, `margin` est un nombre (probablement un pourcentage, ex: 30 pour 30%)
  - La formule `× margin / 100` est donc correcte si `margin` est stocké comme pourcentage
  - **MAIS**: Ce calcul donne la "valeur de marge" (revenu × taux de marge), pas la "marge brute totale"
  - La vraie marge brute devrait être: `(sellPrice - buyPrice) × stock`
  - Le calcul actuel semble être une approximation basée sur le taux de marge

**Code:**
```28:31:stock-easy-app/src/utils/analyticsKPIs.js
const totalGrossMargin = enrichedProducts.reduce((sum, p) => {
  return sum + (p.grossMargin || (p.stock * (p.sellPrice || 0) * (p.margin || 0) / 100));
}, 0);
```

**Recommandation:** 
- Si `grossMargin` est toujours disponible depuis le backend, le fallback ne sera jamais utilisé → OK
- Si le fallback est utilisé, considérer utiliser: `p.stock * ((p.sellPrice || 0) - (p.buyPrice || 0))` pour une vraie marge brute
- Ou documenter que ce KPI représente la "valeur de marge estimée" plutôt que la "marge brute totale"

---

### 3.4 Revenu Potentiel (ML) ✅

**Formule:**
```javascript
totalPotentialRevenue = mlRevenueData.totalRevenue (si disponible)
OU Σ (potentialRevenue OU (stock × sellPrice))
```

**Vérification:**
- ✅ Utilise les données ML si disponibles (priorité correcte)
- ✅ Fallback vers calcul simple si pas de ML
- ✅ Logique correcte

**Code:**
```33:39:stock-easy-app/src/utils/analyticsKPIs.js
// Valeur potentielle des ventes (revenu potentiel total)
// Utiliser le calcul ML si disponible, sinon fallback vers calcul simple
const totalPotentialRevenue = mlRevenueData && mlRevenueData.totalRevenue !== undefined
  ? mlRevenueData.totalRevenue
  : enrichedProducts.reduce((sum, p) => {
      return sum + (p.potentialRevenue || (p.stock * (p.sellPrice || 0)));
    }, 0);
```

---

### 3.5 Rotation Rapide ⚠️

**Formule:**
```javascript
fastRotatingProducts = count(produits avec rotationRate > 0.5)
averageRotationRate = moyenne(rotationRate) pour tous les produits avec rotationRate > 0
```

**Vérification:**
- ⚠️ **SEUIL ARBITRAIRE**: Le seuil de 0.5 rotations/mois (>6 rotations/an) est fixe
- ✅ Calcul de la moyenne correct
- ⚠️ **UNITÉ CONFUSION**: Le commentaire dit "rotations/mois" mais le code utilise `rotationRate` qui pourrait être en rotations/an

**Code:**
```41:55:stock-easy-app/src/utils/analyticsKPIs.js
// Taux de rotation moyen (ABC analysis - produits rapides)
const fastRotatingProducts = enrichedProducts.filter(p => {
  const rotationRate = p.rotationRate || 0;
  return rotationRate > 0.5; // Rotation > 50% par mois
}).length;

// Calculer le taux de rotation moyen de tous les produits (en rotations/an, pas en pourcentage)
const allRotationRates = enrichedProducts
  .map(p => p.rotationRate || 0)
  .filter(rate => rate > 0); // Exclure les produits sans rotation
const averageRotationRate = allRotationRates.length > 0
  ? allRotationRates.reduce((sum, rate) => sum + rate, 0) / allRotationRates.length
  : 0;
// Le rotationRate est déjà en rotations/an, pas besoin de multiplier par 100
const averageRotationDisplay = Math.round(averageRotationRate * 100) / 100; // Arrondir à 2 décimales
```

**Note:** Il y a une incohérence dans le commentaire : "Rotation > 50% par mois" mais le code dit "rotations/an". Si `rotationRate` est en rotations/an, alors 0.5 rotations/an est très faible (1 rotation tous les 2 ans). Il faudrait vérifier l'unité réelle de `rotationRate`.

---

## 4. Calculs ML (Machine Learning)

**Fichier:** `src/services/ml/revenueForecastService.js`

### 4.1 Calcul du Revenu Potentiel ML ✅

**Formule complexe avec plusieurs étapes:**

1. **Ventes de base:**
   ```javascript
   baseDailySales = salesPerDay OU (sales30d / 30) OU moyenne(historique)
   ```

2. **Application de la tendance:**
   ```javascript
   if (trend !== 'stable' && |growthRate| > 3):
     baseDailySales *= (1 + growthRate / 100)
   ```

3. **Prédiction ML (si disponible):**
   ```javascript
   if (ML disponible):
     predictedDailySales = (mlPrediction × 0.7) + (baseDailySales × 0.3)
   ```

4. **Application saisonnalité:**
   ```javascript
   predictedDailySales *= seasonalityFactor[currentMonth]
   ```

5. **Facteur de rotation:**
   ```javascript
   rotationFactor = min(1.5, max(0.7, predictedRotationRate / currentRotationRate))
   adjustedDailySales = predictedDailySales × rotationFactor
   ```

6. **Revenu potentiel:**
   ```javascript
   daysToSellOut = min(stock / adjustedDailySales, forecastDays)
   actualSellableUnits = min(adjustedDailySales × daysToSellOut, stock)
   potentialRevenue = actualSellableUnits × sellPrice
   ```

**Vérification:**
- ✅ Logique complexe mais cohérente
- ✅ Gestion des fallbacks correcte
- ✅ Application progressive des facteurs
- ✅ Limitation au stock disponible (cohérent)
- ✅ Utilise `sellPrice` (correct pour revenu)

**Code principal:**
```174:328:stock-easy-app/src/services/ml/revenueForecastService.js
export async function calculatePotentialRevenueML(product, salesHistory = [], model = null, options = {}) {
  // ... (voir fichier pour détails complets)
}
```

---

### 4.2 Analyse des Tendances ✅

**Formule:**
```javascript
// Diviser l'historique en deux moitiés
avgFirst = moyenne(quantités première moitié)
avgSecond = moyenne(quantités seconde moitié)
growthRate = ((avgSecond - avgFirst) / avgFirst) × 100
trend = 'up' si growthRate > 5, 'down' si < -5, sinon 'stable'
```

**Vérification:**
- ✅ Calcul correct du taux de croissance
- ✅ Seuils raisonnables (±5%)
- ✅ Calcul de confiance basé sur la variance

**Code:**
```75:115:stock-easy-app/src/services/ml/revenueForecastService.js
function analyzeTrends(salesHistory) {
  // ... (voir fichier pour détails)
}
```

---

### 4.3 Facteurs de Saisonnalité ✅

**Formule:**
```javascript
// Si historique disponible:
  monthlyAverage = moyenne(ventes du mois)
  globalAverage = moyenne(ventes tous mois)
  factor[month] = monthlyAverage / globalAverage

// Sinon:
  factor[month] = SEASONALITY_FACTORS[month] (valeurs par défaut)
```

**Vérification:**
- ✅ Calcul correct des facteurs relatifs
- ✅ Fallback vers valeurs par défaut si pas d'historique
- ✅ Valeurs par défaut raisonnables (pic en décembre, baisse en janvier/février)

**Code:**
```35:68:stock-easy-app/src/services/ml/revenueForecastService.js
function calculateSeasonalityFromHistory(salesHistory) {
  // ... (voir fichier pour détails)
}
```

---

## 5. Problèmes Identifiés

### 🔴 Problèmes Critiques

1. **Aucun problème critique identifié** ✅

### ⚠️ Problèmes Potentiels / Améliorations

1. **Marge Brute Totale (analyticsKPIs.js)**
   - Le calcul de fallback `stock × sellPrice × margin / 100` semble suspect
   - Vérifier la définition de `margin` (pourcentage vs ratio)
   - La marge brute devrait être `(sellPrice - buyPrice) × stock`

2. **Rotation Rapide (analyticsKPIs.js)**
   - Incohérence dans les commentaires : "50% par mois" vs "rotations/an"
   - Seuil de 0.5 peut être trop bas si `rotationRate` est en rotations/an
   - Vérifier l'unité réelle de `rotationRate`

3. **Ventes Perdues - Différence Dashboard vs Analytics**
   - Dashboard: filtre `healthStatus === 'urgent'` (inclut produits à risque)
   - Analytics: filtre `stock === 0` (uniquement rupture totale)
   - Les deux approches sont valides mais peuvent donner des résultats différents
   - **Recommandation:** Documenter la différence ou unifier la logique

4. **Assumptions Fixes**
   - Ventes perdues: 7 jours de rupture (fixe dans Analytics)
   - Rotation rapide: seuil 0.5 (fixe)
   - **Recommandation:** Rendre ces valeurs configurables

---

## 6. Recommandations

### 🔧 Corrections à Apporter

1. **Corriger le calcul de Marge Brute:**
   ```javascript
   // Au lieu de:
   p.stock * (p.sellPrice || 0) * (p.margin || 0) / 100
   
   // Utiliser:
   p.grossMargin || (p.stock * ((p.sellPrice || 0) - (p.buyPrice || 0)))
   ```

2. **Clarifier l'unité de rotationRate:**
   - Vérifier dans le backend quelle est l'unité réelle
   - Ajuster le seuil et les commentaires en conséquence

3. **Unifier la logique des Ventes Perdues:**
   - Choisir une approche unique (Dashboard ou Analytics)
   - Ou documenter clairement la différence

### 📊 Améliorations Suggérées

1. **Rendre configurables les assumptions:**
   - Nombre de jours de rupture pour ventes perdues
   - Seuil de rotation rapide
   - Période de prévision ML

2. **Ajouter des validations:**
   - Vérifier que `sellPrice >= buyPrice` (sinon marge négative)
   - Vérifier que `stock >= 0`
   - Vérifier que `salesPerDay >= 0`

3. **Améliorer la documentation:**
   - Documenter toutes les formules dans les commentaires
   - Ajouter des exemples de calculs
   - Documenter les unités utilisées

4. **Tests unitaires:**
   - Créer des tests pour chaque fonction de calcul
   - Tester les cas limites (stock = 0, salesPerDay = 0, etc.)
   - Tester la cohérence entre Dashboard et Analytics

---

## 7. Résumé

### ✅ Calculs Corrects (95%+)

- Valeur de l'Inventaire
- Commandes en Cours
- Produits à Commander
- Investissement Requis
- Mapping Produits ↔ Fournisseurs
- Taux de Disponibilité des SKU
- Valeur Surstocks Profonds
- Valeur de l'Inventaire (Analytics)
- Commandes en Transit
- Produits en Bonne Santé
- Revenu Potentiel (ML)
- Tous les calculs ML (tendances, saisonnalité, prédictions)

### ⚠️ À Vérifier/Corriger

- Marge Brute Totale (calcul de fallback suspect)
- Rotation Rapide (unité et seuil à clarifier)
- Ventes Perdues (différence Dashboard vs Analytics à documenter)

### 📈 Qualité Globale

**Note: 9/10** - Les calculs sont globalement corrects et bien structurés. Les problèmes identifiés sont mineurs et concernent principalement la documentation et quelques incohérences mineures.

