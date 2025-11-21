# Indicateurs Clés de l'Inventaire - Documentation Technique

## Vue d'ensemble

La section "Indicateurs Clés de l'Inventaire" affiche les KPIs ayant un impact direct sur les résultats financiers. Elle permet de sélectionner une période (Hier, 7d, 30d, 90d, 1y, ou personnalisée) et un type de comparaison (Période précédente, Même période l'an dernier).

## Architecture et Flux de Données

```
AnalyticsTab (Composant Principal)
    ↓
    ├─→ DateRangePicker (Sélection période)
    ├─→ ComparisonSelector (Sélection comparaison)
    └─→ useAnalytics Hook (Calcul des KPIs)
            ↓
            ├─→ currentKPIs (Valeurs temps réel)
            ├─→ getKPIHistory (Récupération historique)
            ├─→ periodCurrentKPIs (Moyenne période actuelle)
            ├─→ comparisonKPIs (Moyenne période comparaison)
            └─→ analytics (Objet final avec KPIs formatés)
                    ↓
                    └─→ KPICard (Affichage)
```

## Code de la Section "Indicateurs Clés de l'Inventaire"

### 1. Composant Principal : AnalyticsTab.jsx

**Localisation** : `stock-easy-app/src/components/analytics/AnalyticsTab.jsx`

#### En-tête avec Contrôles

```jsx
{/* En-tête avec contrôles - Version compacte */}
<div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4 relative z-50">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-xl font-bold text-[#191919]">Indicateurs Clés de l'Inventaire</h2>
      <p className="text-sm text-[#666663] mt-1">
        KPIs ayant un impact direct sur vos résultats financiers
      </p>
    </div>
  </div>

  <div className="flex flex-col lg:flex-row gap-4">
    <div className="flex-1 relative z-50">
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />
    </div>
    
    <div className="flex-1 relative z-50">
      <ComparisonSelector
        value={comparisonType}
        onChange={setComparisonType}
        disabled={dateRange === 'custom'}
      />
    </div>
  </div>
</div>
```

#### États Locaux

```jsx
// États locaux pour les contrôles d'analytics
const [dateRange, setDateRange] = useState('30d');
const [customRange, setCustomRange] = useState({ start: '', end: '' });
const [comparisonType, setComparisonType] = useState('same_last_year');
```

#### Appel du Hook useAnalytics

```jsx
// Utiliser le hook useAnalytics pour calculer les KPIs
const analyticsData = useAnalytics(
  products, 
  orders, 
  dateRange, 
  customRange, 
  comparisonType, 
  seuilSurstockProfond
);
```

#### Affichage des KPIs Principaux

```jsx
{/* Indicateurs Clés de l'Inventaire - KPIs principaux */}
<div>
  <h3 className="text-lg font-bold text-[#191919] mb-4 flex items-center gap-2">
    <div className="w-1 h-5 bg-purple-500 rounded-full" />
    KPIs Principaux
  </h3>
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
    <KPICard
      title="Taux de Disponibilité des SKU"
      value={analyticsData.skuAvailability.value}
      change={analyticsData.skuAvailability.change}
      changePercent={analyticsData.skuAvailability.changePercent}
      trend={analyticsData.skuAvailability.trend}
      description={analyticsData.skuAvailability.description}
      chartData={analyticsData.skuAvailability.chartData}
      comparisonPeriod={analyticsData.skuAvailability.comparisonPeriod}
      onClick={() => openChartModal('skuAvailability')}
    />
    
    <KPICard
      title="Valeur de l'Inventaire"
      value={analyticsData.inventoryValuation.value}
      change={analyticsData.inventoryValuation.change}
      changePercent={analyticsData.inventoryValuation.changePercent}
      trend={analyticsData.inventoryValuation.trend}
      description={analyticsData.inventoryValuation.description}
      chartData={analyticsData.inventoryValuation.chartData}
      comparisonPeriod={analyticsData.inventoryValuation.comparisonPeriod}
      onClick={() => openChartModal('inventoryValuation')}
    />
    
    <KPICard
      title="Ventes Perdues - Ruptures Réelles"
      value={analyticsData.salesLost.value}
      change={analyticsData.salesLost.change}
      changePercent={analyticsData.salesLost.changePercent}
      trend={analyticsData.salesLost.trend}
      description={analyticsData.salesLost.description}
      chartData={analyticsData.salesLost.chartData}
      comparisonPeriod={analyticsData.salesLost.comparisonPeriod}
      onClick={() => openChartModal('salesLost')}
    />
    
    <KPICard
      title="Valeur Surstocks Profonds"
      value={analyticsData.overstockCost.value}
      change={analyticsData.overstockCost.change}
      changePercent={analyticsData.overstockCost.changePercent}
      trend={analyticsData.overstockCost.trend}
      description={analyticsData.overstockCost.description}
      chartData={analyticsData.overstockCost.chartData}
      comparisonPeriod={analyticsData.overstockCost.comparisonPeriod}
      onClick={() => openChartModal('overstockCost')}
    />
  </div>
</div>
```

### 2. Composant DateRangePicker

**Localisation** : `stock-easy-app/src/components/analytics/DateRangePicker.jsx`

```jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';

export const DateRangePicker = ({ 
  value, 
  onChange, 
  customRange, 
  onCustomRangeChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const ranges = [
    { value: 'yesterday', label: 'Hier' },
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '90d', label: '3 derniers mois' },
    { value: '1y', label: '1 an' },
    { value: 'custom', label: 'Période personnalisée' }
  ];

  const selectedRange = ranges.find(range => range.value === value);

  const handleSelect = (rangeValue) => {
    onChange(rangeValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#191919]" />
          <h3 className="text-sm font-semibold text-[#191919]">Période</h3>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-sm text-[#191919] flex items-center justify-between hover:border-[#D1D0CB] transition-colors"
          >
            <span>{selectedRange?.label || 'Sélectionner une période'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E4DF] rounded-lg shadow-lg z-[100]"
            >
              {ranges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleSelect(range.value)}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-[#FAFAF7] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    value === range.value ? 'bg-[#F0F0EB] text-[#191919]' : 'text-[#666663]'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {value === 'custom' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#666663] mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={customRange.start}
                onChange={(e) => onCustomRangeChange({ ...customRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666663] mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={customRange.end}
                onChange={(e) => onCustomRangeChange({ ...customRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
```

### 3. Composant ComparisonSelector

**Localisation** : `stock-easy-app/src/components/analytics/ComparisonSelector.jsx`

```jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

export const ComparisonSelector = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const comparisons = [
    { value: 'previous', label: 'Période précédente', icon: TrendingUp },
    { value: 'same_last_year', label: 'Même période l\'an dernier', icon: TrendingDown }
  ];

  const selectedComparison = comparisons.find(comparison => comparison.value === value);

  const handleSelect = (comparisonValue) => {
    onChange(comparisonValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#191919]" />
          <h3 className="text-sm font-semibold text-[#191919]">Comparaison</h3>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-sm flex items-center justify-between transition-colors ${
              disabled 
                ? 'text-gray-400 cursor-not-allowed border-gray-200' 
                : 'text-[#191919] hover:border-[#D1D0CB]'
            }`}
          >
            <span>{selectedComparison?.label || 'Sélectionner une comparaison'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-gray-400' : ''}`} />
          </button>

          {isOpen && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E4DF] rounded-lg shadow-lg z-[100]"
            >
              {comparisons.map((comparison) => {
                const Icon = comparison.icon;
                return (
                  <button
                    key={comparison.value}
                    onClick={() => handleSelect(comparison.value)}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-[#FAFAF7] transition-colors flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg ${
                      value === comparison.value 
                        ? 'bg-[#F0F0EB] text-[#191919]' 
                        : 'text-[#666663]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {comparison.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
```

## Communication avec useAnalytics Hook

### Hook useAnalytics

**Localisation** : `stock-easy-app/src/hooks/useAnalytics.js`

#### Signature

```javascript
export function useAnalytics(
  products, 
  orders, 
  dateRange = '30d', 
  customRange = null, 
  comparisonType = 'previous', 
  seuilSurstockProfond = 90
)
```

#### Calcul des Dates de Période

```javascript
const { startDate, endDate, comparisonPeriod, fetchStartDate } = useMemo(() => {
  let start, end;
  
  // Gérer le mode custom
  if (dateRange === 'custom' && (customRange?.startDate && customRange?.endDate) || (customRange?.start && customRange?.end)) {
    if (customRange.startDate && customRange.endDate) {
      start = new Date(customRange.startDate);
      end = new Date(customRange.endDate);
    } else if (customRange.start && customRange.end) {
      start = new Date(customRange.start);
      end = new Date(customRange.end);
    }
  } else {
    // Mode preset
    if (dateRange === 'yesterday') {
      // Hier : du début de la journée d'hier à la fin de la journée d'hier
      end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      
      start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
    } else {
      end = new Date();
      start = new Date();
      
      let days = 30;
      if (dateRange === '7d') days = 7;
      else if (dateRange === '30d') days = 30;
      else if (dateRange === '90d') days = 90;
      else if (dateRange === '1y') days = 365;
      
      start.setDate(end.getDate() - days);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }
  }
  
  // Calculer la période de comparaison selon le type
  const comparison = getComparisonPeriod(start, end, comparisonType);
  
  return {
    startDate: start,
    endDate: end,
    comparisonPeriod: comparison,
    fetchStartDate: fetchStart
  };
}, [dateRange, customRange, comparisonType]);
```

#### Calcul des KPIs Actuels (Temps Réel)

```javascript
const currentKPIs = useMemo(() => {
  // Calcul de la disponibilité SKU
  const totalSKUs = products.length;
  const availableSKUs = products.filter(p => (p.stock || 0) > 0).length;
  const skuAvailabilityRate = totalSKUs > 0 ? (availableSKUs / totalSKUs) * 100 : 0;

  // Calcul des ventes perdues (ruptures réelles)
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0 && (p.salesPerDay || 0) > 0);
  const salesLostCount = outOfStockProducts.length;
  const salesLostAmount = outOfStockProducts.reduce((sum, p) => {
    const avgDailySales = p.salesPerDay || p.avgDailySales || 0;
    const daysOutOfStock = 7;
    const sellPrice = p.sellPrice || p.buyPrice || 0;
    return sum + (avgDailySales * daysOutOfStock * sellPrice);
  }, 0);

  // Calcul du surstock profond
  const overstockProducts = products.filter(p => p.isDeepOverstock === true);
  const overstockSKUs = overstockProducts.length;
  const overstockCost = overstockProducts.reduce((sum, p) => {
    const excessValue = calculateOverstockExcessValue(p, seuilSurstockProfond);
    return sum + excessValue;
  }, 0);

  // Calcul de la valeur de l'inventaire
  const inventoryValuation = products.reduce((sum, p) => {
    const productValue = (p.stock || 0) * (p.buyPrice || 0);
    return sum + productValue;
  }, 0);

  // Calculer les KPIs supplémentaires en temps réel
  const additionalKPIs = calculateAnalyticsKPIs(products, orders, null, null);
  
  return {
    skuAvailabilityRate,
    availableSKUs,
    totalSKUs,
    salesLostAmount,
    salesLostCount,
    overstockCost,
    overstockSKUs,
    inventoryValuation,
    // KPIs supplémentaires
    mappingPercentage: additionalKPIs.mappingPercentage?.rawValue || 0,
    totalProducts: additionalKPIs.totalProducts?.rawValue || 0,
    healthyPercentage: additionalKPIs.healthyPercentage?.rawValue || 0,
    totalGrossMargin: additionalKPIs.totalGrossMargin?.rawValue || 0,
    totalPotentialRevenue: additionalKPIs.totalPotentialRevenue?.rawValue || 0,
    fastRotatingProducts: additionalKPIs.fastRotatingProducts?.rawValue || 0
  };
}, [products, orders, seuilSurstockProfond]);
```

#### Récupération de l'Historique

```javascript
useEffect(() => {
  async function loadHistory() {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Récupérer l'historique pour la période actuelle ET de comparaison
      const allHistory = await getKPIHistory(
        currentUser.uid,
        fetchStartDate,
        endDate
      );
      
      setHistory(allHistory);
    } catch (err) {
      console.error('❌ Erreur chargement historique:', err);
      setError(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  loadHistory();
}, [currentUser?.uid, fetchStartDate, endDate]);
```

#### Calcul des Comparaisons

```javascript
// Utiliser les valeurs actuelles (temps réel) pour les comparaisons
const skuAvailabilityComparison = comparisonKPIs 
  ? calculatePeriodComparison(currentKPIs.skuAvailabilityRate, comparisonKPIs.skuAvailabilityRate)
  : { change: 0, changePercent: 0, trend: 'neutral' };

const salesLostComparison = comparisonKPIs
  ? calculatePeriodComparison(currentKPIs.salesLostAmount, comparisonKPIs.salesLostAmount)
  : { change: 0, changePercent: 0, trend: 'neutral' };

const overstockComparison = comparisonKPIs
  ? calculatePeriodComparison(currentKPIs.overstockCost, comparisonKPIs.overstockCost)
  : { change: 0, changePercent: 0, trend: 'neutral' };

const inventoryValuationComparison = comparisonKPIs
  ? calculatePeriodComparison(currentKPIs.inventoryValuation, comparisonKPIs.inventoryValuation)
  : { change: 0, changePercent: 0, trend: 'neutral' };
```

#### Construction de l'Objet Analytics Final

```javascript
const analytics = useMemo(() => {
  // Utiliser les valeurs actuelles (temps réel) au lieu de la moyenne de la période
  const currentValue = currentKPIs.skuAvailabilityRate;
  const currentInventoryValue = currentKPIs.inventoryValuation;
  const currentSalesLost = currentKPIs.salesLostAmount;
  const currentOverstock = currentKPIs.overstockCost;

  const result = {
    skuAvailability: {
      value: `${currentValue.toFixed(1)}%`,
      rawValue: currentValue,
      change: skuAvailabilityComparison.change,
      changePercent: skuAvailabilityComparison.changePercent,
      trend: skuAvailabilityComparison.trend,
      chartData: chartData.skuAvailability,
      description: `${currentKPIs.availableSKUs} SKUs disponibles sur ${currentKPIs.totalSKUs}`,
      comparisonPeriod: comparisonPeriodLabel,
      comparisonValue: comparisonKPIs?.skuAvailabilityRate.toFixed(1) || null
    },
    salesLost: {
      value: formatCurrencyNoDecimals(currentSalesLost),
      rawValue: currentSalesLost,
      change: salesLostComparison.change,
      changePercent: salesLostComparison.changePercent,
      trend: salesLostComparison.trend,
      chartData: chartData.salesLost,
      description: `⚠️ ATTENTION : Différent du Dashboard ! Compte UNIQUEMENT les produits EN RUPTURE TOTALE (stock = 0). Mesure les pertes RÉELLES actuelles, pas les risques futurs. ${currentKPIs.salesLostCount} SKU(s) en rupture.`,
      comparisonPeriod: comparisonPeriodLabel,
      comparisonValue: comparisonKPIs?.salesLostAmount !== undefined
        ? formatCurrencyNoDecimals(comparisonKPIs.salesLostAmount)
        : null
    },
    overstockCost: {
      value: formatCurrencyNoDecimals(currentOverstock),
      rawValue: currentOverstock,
      change: overstockComparison.change,
      changePercent: overstockComparison.changePercent,
      trend: overstockComparison.trend,
      chartData: chartData.overstock,
      description: `${currentKPIs.overstockSKUs} SKU(s) en surstock profond`,
      comparisonPeriod: comparisonPeriodLabel,
      comparisonValue: comparisonKPIs?.overstockCost !== undefined
        ? formatCurrencyNoDecimals(comparisonKPIs.overstockCost)
        : null
    },
    inventoryValuation: {
      value: formatCurrency(currentInventoryValue, { minimumFractionDigits: 0 }),
      rawValue: currentInventoryValue,
      change: inventoryValuationComparison.change,
      changePercent: inventoryValuationComparison.changePercent,
      trend: inventoryValuationComparison.trend,
      chartData: chartData.inventoryValuation,
      description: `Valeur monétaire totale de votre inventaire (stock × coût unitaire)`,
      comparisonPeriod: comparisonPeriodLabel,
      comparisonValue: comparisonKPIs?.inventoryValuation !== undefined
        ? formatCurrency(comparisonKPIs.inventoryValuation, { minimumFractionDigits: 0 })
        : null
    },
    loading,
    error
  };

  return result;
}, [currentKPIs, comparisonKPIs, chartData, loading, error, history.length, comparisonType, startDate, comparisonPeriod]);
```

## Flux de Données Complet

### 1. Initialisation

1. **AnalyticsTab** se monte avec les props `products`, `orders`, `seuilSurstockProfond`
2. États locaux initialisés :
   - `dateRange = '30d'` (par défaut)
   - `comparisonType = 'same_last_year'` (par défaut)
   - `customRange = { start: '', end: '' }`

### 2. Calcul des KPIs

1. **useAnalytics** est appelé avec les paramètres
2. **currentKPIs** est calculé en temps réel depuis `products` et `orders`
3. Les dates de période sont calculées selon `dateRange`
4. La période de comparaison est calculée selon `comparisonType`
5. L'historique est récupéré depuis Supabase via `getKPIHistory`
6. Les moyennes sont calculées pour `periodCurrentKPIs` et `comparisonKPIs`
7. Les comparaisons sont calculées avec `calculatePeriodComparison`
8. Les graphiques sont générés depuis l'historique
9. L'objet `analytics` final est construit

### 3. Affichage

1. **AnalyticsTab** reçoit `analyticsData` depuis `useAnalytics`
2. Les **KPICard** sont rendus avec les données de `analyticsData`
3. Chaque KPI affiche :
   - **Valeur actuelle** (temps réel)
   - **Variation** (change, changePercent, trend)
   - **Graphique** (depuis l'historique)
   - **Période de comparaison** (formatée)

### 4. Interactions Utilisateur

1. **Changement de période** (`dateRange`) :
   - Recalcule les dates dans `useAnalytics`
   - Recharge l'historique depuis Supabase
   - Recalcule les moyennes et comparaisons
   - Met à jour les KPICards

2. **Changement de comparaison** (`comparisonType`) :
   - Recalcule la période de comparaison
   - Recalcule les comparaisons
   - Met à jour les variations dans les KPICards

3. **Clic sur un KPICard** :
   - Ouvre le `ChartModal` avec les données du graphique
   - Affiche l'historique complet du KPI

## Points Clés

### Valeurs Affichées

- **Temps réel** : Les valeurs affichées dans les KPICards sont calculées en temps réel depuis les produits actuels (`currentKPIs`)
- **Historique** : Utilisé uniquement pour les comparaisons et les graphiques

### Comparaisons

- **Période précédente** : Compare avec la période équivalente précédente
- **Même période l'an dernier** : Compare avec la même période il y a un an
- Les comparaisons utilisent les moyennes de l'historique pour la période de comparaison

### Graphiques

- Générés depuis l'historique réel (pas de simulation)
- Normalisés entre 0-100 pour l'affichage
- Limités à 12 points maximum pour une meilleure visualisation

### Performance

- Utilisation de `useMemo` pour éviter les recalculs inutiles
- Chargement asynchrone de l'historique
- Gestion des états de chargement et d'erreur

## Fichiers Concernés

1. **AnalyticsTab.jsx** : Composant principal
2. **DateRangePicker.jsx** : Sélecteur de période
3. **ComparisonSelector.jsx** : Sélecteur de comparaison
4. **useAnalytics.js** : Hook de calcul des KPIs
5. **kpiHistoryService.js** : Service de récupération de l'historique
6. **KPICard.jsx** : Composant d'affichage d'un KPI
7. **analyticsKPIs.js** : Calcul des KPIs supplémentaires




