import React, { useMemo } from 'react';
import { ShoppingCart, TrendingUp, DollarSign, Clock, TrendingDown, BarChart3, Boxes } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { KPICard } from '../features/KPICard';
import { useCurrency } from '../../contexts/CurrencyContext';
import { roundToTwoDecimals } from '../../utils/decimalUtils';
import { calculateOverstockExcessValue } from '../../utils/calculations';
import { calculatePeriodComparison } from '../../services/kpiHistoryService';

/**
 * Convertit les données historiques au format chartData pour KPICard
 * @param {Array} historyData - Tableau de {date, value} depuis useAnalytics
 * @param {number} currentValue - Valeur actuelle pour normalisation
 * @param {boolean} isPercentage - Si la valeur est déjà un pourcentage (0-100)
 * @returns {Array} Tableau de nombres normalisés 0-100
 */
function convertToChartData(historyData, currentValue, isPercentage = false) {
  // Si pas de données historiques, retourner un tableau vide
  if (!historyData || !Array.isArray(historyData) || historyData.length === 0) {
    return [];
  }

  // Extraire les valeurs
  const values = historyData.map(d => d.value || d);
  
  // Si c'est déjà un pourcentage, retourner directement
  if (isPercentage) {
    return values.map(v => Math.min(100, Math.max(0, v)));
  }
  
  // Sinon, normaliser par rapport à la valeur max
  const maxValue = Math.max(...values, currentValue || 1);
  return values.map(v => Math.min(100, (v / maxValue) * 100));
}

/**
 * Génère des données de graphique placeholder quand pas d'historique disponible
 * Affiche une ligne plate avec la valeur actuelle (plus honnête que des données aléatoires)
 * @param {number} currentValue - Valeur actuelle
 * @param {number} points - Nombre de points à générer (défaut: 7)
 * @returns {Array} Tableau de nombres normalisés
 */
function generatePlaceholderChart(currentValue, points = 7) {
  // Si pas de valeur, retourner une ligne à zéro
  if (!currentValue || currentValue === 0) {
    return Array(points).fill(0);
  }
  
  // Ligne plate à 50% (représentation neutre en attendant les vraies données)
  return Array(points).fill(50);
}

/**
 * Composant DashboardKPIs - Affiche les KPIs principaux du dashboard
 * Utilise les vraies données historiques depuis useAnalytics quand disponibles
 */
export function DashboardKPIs({ 
  enrichedProducts = [], 
  orders = [], 
  productsByStatus = {},
  seuilSurstockProfond = 90,
  analyticsData = null
}) {
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  // Calcul des KPIs
  const kpis = useMemo(() => {
    // 1. Valeur totale de l'inventaire
    const totalInventoryValue = enrichedProducts.reduce((sum, p) => {
      return sum + (p.stock * (p.buyPrice || 0));
    }, 0);

    // 2. Commandes en cours
    const activeOrders = orders.filter(o => 
      ['pending_confirmation', 'preparing', 'in_transit'].includes(o.status)
    ).length;

    // 3. Ventes perdues potentielles (produits en rupture avec ventes/jour)
    // 📊 VENTES PERDUES - APPROCHE PROACTIVE (DASHBOARD)
    // Cette estimation inclut tous les produits en statut "urgent" (risque de rupture)
    // pour donner une vision anticipative des pertes potentielles.
    // Note : Diffère de la valeur Analytics qui compte uniquement les ruptures réelles (stock = 0)
    const lostSales = enrichedProducts
      .filter(p => p.healthStatus === 'urgent' && p.salesPerDay > 0)
      .reduce((sum, p) => {
        // Estimer les ventes perdues sur les 7 prochains jours si pas de stock
        const daysOutOfStock = Math.max(0, 7 - (p.daysOfStock || 0));
        const estimatedLostSales = daysOutOfStock * p.salesPerDay * (p.sellPrice || 0);
        return sum + estimatedLostSales;
      }, 0);

    // 3b. Ventes perdues - Ruptures réelles (approche factuelle comme Analytics)
    // 📊 VENTES PERDUES - APPROCHE FACTUELLE (DASHBOARD)
    // Cette estimation compte uniquement les produits en rupture totale (stock = 0)
    // pour refléter les pertes réelles actuelles, pas les risques futurs.
    const outOfStockProducts = enrichedProducts.filter(p => (p.stock || 0) === 0 && (p.salesPerDay || 0) > 0);
    const salesLostCount = outOfStockProducts.length;
    const salesLostAmount = outOfStockProducts.reduce((sum, p) => {
      // Estimation basée sur les ventes moyennes * prix de vente (pas d'achat)
      // Utiliser sellPrice pour être cohérent avec le Dashboard et refléter les revenus perdus
      const avgDailySales = p.salesPerDay || p.avgDailySales || 0;
      const daysOutOfStock = 7; // Estimation moyenne de rupture
      const sellPrice = p.sellPrice || p.buyPrice || 0; // Utiliser prix de vente pour ventes perdues
      return sum + (avgDailySales * daysOutOfStock * sellPrice);
    }, 0);

    // 4. Produits à commander
    // Utiliser productsByStatus.to_order qui déduit déjà les quantités en commande
    const productsToOrder = productsByStatus.to_order?.length || 0;

    // 5. Investissement total requis pour les produits à commander
    // Utiliser productsByStatus.to_order pour ne compter que les produits vraiment à commander
    const totalInvestmentRequired = (productsByStatus.to_order || [])
      .reduce((sum, p) => {
        // Utiliser la quantité résiduelle à commander (qtyToOrderRemaining) si disponible
        const qtyToOrder = p.qtyToOrderRemaining || p.qtyToOrder || 0;
        return sum + (p.investment || (qtyToOrder * (p.buyPrice || 0)));
      }, 0);

    // 6. Taux de disponibilité des SKU
    const totalSKUs = enrichedProducts.length;
    const availableSKUs = enrichedProducts.filter(p => (p.stock || 0) > 0).length;
    const skuAvailabilityRate = totalSKUs > 0 ? Math.round((availableSKUs / totalSKUs) * 100) : 0;

    // 7. Valeur des surstocks profonds
    const overstockProducts = enrichedProducts.filter(p => p.isDeepOverstock === true);
    const overstockSKUs = overstockProducts.length;
    const overstockSKUList = overstockProducts.map(p => p.sku || p.name || 'N/A').slice(0, 10); // Limiter à 10 SKU pour la lisibilité
    const overstockCost = overstockProducts.reduce((sum, p) => {
      const excessValue = calculateOverstockExcessValue(p, seuilSurstockProfond);
      return sum + excessValue;
    }, 0);

    // ========================================
    // DONNÉES DE GRAPHIQUES - Vraies données historiques
    // ========================================
    // Utiliser les données de useAnalytics si disponibles, sinon placeholder
    const hasRealHistory = analyticsData && !analyticsData.loading && analyticsData.skuAvailability?.chartData?.length > 0;
    
    // Fonction pour obtenir les vraies données ou un placeholder
    const getChartDataFor = (kpiKey, currentValue, isPercentage = false) => {
      if (hasRealHistory && analyticsData[kpiKey]?.chartData?.length > 0) {
        return convertToChartData(analyticsData[kpiKey].chartData, currentValue, isPercentage);
      }
      // Pas d'historique disponible - afficher un placeholder honnête
      return generatePlaceholderChart(currentValue);
    };

    // Fonction helper pour calculer les comparaisons basées sur l'historique
    const getComparison = (currentValue, previousValue) => {
      if (analyticsData && previousValue !== undefined && previousValue !== null) {
        return calculatePeriodComparison(currentValue, previousValue);
      }
      // Fallback si pas d'historique disponible
      return { change: 0, changePercent: 0, trend: 'neutral' };
    };

    // Récupérer les valeurs de comparaison depuis analyticsData si disponible
    const skuAvailabilityComparison = analyticsData?.skuAvailability
      ? { 
          change: analyticsData.skuAvailability.change || 0,
          changePercent: analyticsData.skuAvailability.changePercent || 0,
          trend: analyticsData.skuAvailability.trend || 'neutral',
          comparisonPeriod: analyticsData.skuAvailability.comparisonPeriod || t('dashboard.vsLastWeek')
        }
      : getComparison(skuAvailabilityRate, skuAvailabilityRate * 0.98); // Fallback avec simulation légère

    const inventoryValuationComparison = analyticsData?.inventoryValuation
      ? {
          change: analyticsData.inventoryValuation.change || 0,
          changePercent: analyticsData.inventoryValuation.changePercent || 0,
          trend: analyticsData.inventoryValuation.trend || 'neutral',
          comparisonPeriod: analyticsData.inventoryValuation.comparisonPeriod || t('dashboard.vsLastWeek')
        }
      : getComparison(totalInventoryValue, totalInventoryValue * 0.95);

    const salesLostRealComparison = analyticsData?.salesLost
      ? {
          change: analyticsData.salesLost.change || 0,
          changePercent: analyticsData.salesLost.changePercent || 0,
          trend: analyticsData.salesLost.trend || 'neutral',
          comparisonPeriod: analyticsData.salesLost.comparisonPeriod || t('dashboard.vsLastWeek')
        }
      : getComparison(salesLostAmount, salesLostAmount * 1.1);

    const overstockComparison = analyticsData?.overstockCost
      ? {
          change: analyticsData.overstockCost.change || 0,
          changePercent: analyticsData.overstockCost.changePercent || 0,
          trend: analyticsData.overstockCost.trend || 'neutral',
          comparisonPeriod: analyticsData.overstockCost.comparisonPeriod || t('dashboard.vsLastWeek')
        }
      : getComparison(overstockCost, overstockCost * 0.92);

    // Pour les KPIs qui n'ont pas de correspondance directe dans analyticsData, utiliser des calculs basés sur l'historique si disponible
    // Sinon, utiliser des valeurs par défaut
    const defaultComparisonPeriod = analyticsData?.skuAvailability?.comparisonPeriod || t('dashboard.vsLastWeek');

    // Helper pour normaliser le trend (neutral -> up ou down selon le contexte)
    const normalizeTrend = (trend, defaultTrend = 'up') => {
      if (trend === 'neutral') return defaultTrend;
      return (trend === 'up' || trend === 'down') ? trend : defaultTrend;
    };

    // Dashboard KPIs (8 KPIs critiques pour actions immédiates)
    // Ordre: Ligne 1: Taux de Disponibilité des SKU, Valeur de l'Inventaire, Investissement Requis, À Commander
    //        Ligne 2: Commandes en Cours, Ventes Perdues - Ruptures Réelles, Ventes Perdues Estimées, Valeur Surstocks Profonds
    return [
      {
        title: t('dashboard.skuAvailability'),
        value: `${skuAvailabilityRate}%`,
        change: skuAvailabilityComparison.change,
        changePercent: skuAvailabilityComparison.changePercent,
        trend: normalizeTrend(skuAvailabilityComparison.trend, 'up'),
        description: `${t('dashboard.kpiDescriptions.skuAvailability', { available: availableSKUs, total: totalSKUs })}${!hasRealHistory ? ` • ⏳ ${t('dashboard.kpiDescriptions.waitingHistory')}` : ''}`,
        icon: BarChart3,
        chartData: getChartDataFor('skuAvailability', skuAvailabilityRate, true),
        isCritical: skuAvailabilityRate < 60,
        comparisonPeriod: skuAvailabilityComparison.comparisonPeriod
      },
      {
        title: t('dashboard.inventoryValue'),
        value: formatCurrency(roundToTwoDecimals(totalInventoryValue)),
        change: inventoryValuationComparison.change,
        changePercent: inventoryValuationComparison.changePercent,
        trend: normalizeTrend(inventoryValuationComparison.trend, 'up'),
        description: `${t('dashboard.kpiDescriptions.inventoryValue')}${!hasRealHistory ? ` • ⏳ ${t('dashboard.kpiDescriptions.waitingHistory')}` : ''}`,
        icon: DollarSign,
        chartData: getChartDataFor('inventoryValuation', totalInventoryValue, false),
        comparisonPeriod: inventoryValuationComparison.comparisonPeriod
      },
      {
        title: t('dashboard.investmentRequired'),
        value: formatCurrency(roundToTwoDecimals(totalInvestmentRequired)),
        change: 0,
        changePercent: 0,
        trend: 'neutral',
        description: `${t('dashboard.kpiDescriptions.investmentRequired')} (${t('dashboard.kpiDescriptions.noHistory')})`,
        icon: TrendingDown,
        chartData: generatePlaceholderChart(totalInvestmentRequired),
        isCritical: totalInvestmentRequired > 5000,
        comparisonPeriod: defaultComparisonPeriod
      },
      {
        title: t('dashboard.toOrder'),
        value: productsToOrder,
        change: 0,
        changePercent: 0,
        trend: 'neutral',
        description: `${t('dashboard.kpiDescriptions.toOrder')} (${t('dashboard.kpiDescriptions.noHistory')})`,
        icon: ShoppingCart,
        chartData: generatePlaceholderChart(productsToOrder),
        isCritical: productsToOrder > 5,
        comparisonPeriod: defaultComparisonPeriod
      },
      {
        title: t('dashboard.activeOrders'),
        value: activeOrders,
        change: 0,
        changePercent: 0,
        trend: 'neutral',
        description: `${t('dashboard.kpiDescriptions.activeOrders')} (${t('dashboard.kpiDescriptions.noHistory')})`,
        icon: Clock,
        chartData: generatePlaceholderChart(activeOrders),
        comparisonPeriod: defaultComparisonPeriod
      },
      {
        title: t('dashboard.lostSalesReal'),
        value: formatCurrency(roundToTwoDecimals(salesLostAmount)),
        change: salesLostRealComparison.change,
        changePercent: salesLostRealComparison.changePercent,
        trend: normalizeTrend(salesLostRealComparison.trend, 'down'),
        description: `${t('dashboard.kpiDescriptions.lostSalesReal')}. ${salesLostCount} SKU(s).${!hasRealHistory ? ` • ⏳ ${t('dashboard.kpiDescriptions.waitingHistory')}` : ''}`,
        icon: TrendingDown,
        chartData: getChartDataFor('salesLost', salesLostAmount, false),
        isCritical: salesLostAmount > 1000,
        comparisonPeriod: salesLostRealComparison.comparisonPeriod
      },
      {
        title: t('dashboard.lostSalesEstimated'),
        value: formatCurrency(roundToTwoDecimals(lostSales)),
        change: 0,
        changePercent: 0,
        trend: 'neutral',
        description: `${t('dashboard.kpiDescriptions.lostSalesEstimated')} (${t('dashboard.kpiDescriptions.noHistory')})`,
        icon: TrendingUp,
        chartData: generatePlaceholderChart(lostSales),
        isCritical: lostSales > 1000,
        comparisonPeriod: defaultComparisonPeriod
      },
      {
        title: t('dashboard.overstockValue'),
        value: formatCurrency(roundToTwoDecimals(overstockCost)),
        change: overstockComparison.change,
        changePercent: overstockComparison.changePercent,
        trend: normalizeTrend(overstockComparison.trend, 'up'),
        description: `${t('dashboard.kpiDescriptions.overstockValue', { count: overstockSKUs })}${overstockSKUList && overstockSKUList.length > 0 ? ` : ${overstockSKUList.join(', ')}${overstockSKUs > 10 ? ` (+ ${overstockSKUs - 10})` : ''}` : ''}${!hasRealHistory ? ` • ⏳ ${t('dashboard.kpiDescriptions.waitingHistory')}` : ''}`,
        icon: Boxes,
        chartData: getChartDataFor('overstockCost', overstockCost, false),
        isCritical: overstockCost > 2000,
        comparisonPeriod: overstockComparison.comparisonPeriod
      }
    ];
  }, [enrichedProducts, orders, productsByStatus, formatCurrency, seuilSurstockProfond, analyticsData, t]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <KPICard
          key={index}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change}
          changePercent={kpi.changePercent}
          trend={kpi.trend}
          description={kpi.description}
          chartData={kpi.chartData}
          comparisonPeriod={kpi.comparisonPeriod || t('dashboard.vsLastWeek')}
          isCritical={
            kpi.isCritical ||
            (kpi.title.includes('Perdues') && (typeof kpi.value === 'string' ? parseFloat(kpi.value.replace(/[^0-9.]/g, '')) > 0 : kpi.value > 0)) ||
            (kpi.title.includes('En Transit') && typeof kpi.value === 'string' && kpi.value.includes('%') && parseInt(kpi.value) > 50) ||
            (kpi.title.includes('À Commander') && typeof kpi.value === 'number' && kpi.value > 5)
          }
        />
      ))}
    </div>
  );
}

export default DashboardKPIs;

