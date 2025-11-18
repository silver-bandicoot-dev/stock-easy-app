import React, { useMemo } from 'react';
import { ShoppingCart, TrendingUp, DollarSign, Clock, TrendingDown, BarChart3, Boxes } from 'lucide-react';
import { KPICard } from '../features/KPICard';
import { useCurrency } from '../../contexts/CurrencyContext';
import { roundToTwoDecimals } from '../../utils/decimalUtils';
import { calculateOverstockExcessValue } from '../../utils/calculations';
import { calculatePeriodComparison } from '../../services/kpiHistoryService';

/**
 * Composant DashboardKPIs - Affiche les KPIs principaux du dashboard
 */
export function DashboardKPIs({ 
  enrichedProducts = [], 
  orders = [], 
  productsByStatus = {},
  seuilSurstockProfond = 90,
  analyticsData = null
}) {
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

    // Générer des données de graphique simulées pour chaque KPI (tendance sur 7 jours)
    const generateChartData = (baseValue, variation = 0.1) => {
      const data = [];
      for (let i = 0; i < 7; i++) {
        const variationAmount = baseValue * variation * (Math.random() * 2 - 1);
        const value = Math.max(0, baseValue + variationAmount);
        // Normaliser pour affichage (0-100)
        data.push(Math.min(100, (value / Math.max(baseValue * 1.2, 1)) * 100));
      }
      return data;
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
          comparisonPeriod: analyticsData.skuAvailability.comparisonPeriod || 'semaine dernière'
        }
      : getComparison(skuAvailabilityRate, skuAvailabilityRate * 0.98); // Fallback avec simulation légère

    const inventoryValuationComparison = analyticsData?.inventoryValuation
      ? {
          change: analyticsData.inventoryValuation.change || 0,
          changePercent: analyticsData.inventoryValuation.changePercent || 0,
          trend: analyticsData.inventoryValuation.trend || 'neutral',
          comparisonPeriod: analyticsData.inventoryValuation.comparisonPeriod || 'semaine dernière'
        }
      : getComparison(totalInventoryValue, totalInventoryValue * 0.95);

    const salesLostRealComparison = analyticsData?.salesLost
      ? {
          change: analyticsData.salesLost.change || 0,
          changePercent: analyticsData.salesLost.changePercent || 0,
          trend: analyticsData.salesLost.trend || 'neutral',
          comparisonPeriod: analyticsData.salesLost.comparisonPeriod || 'semaine dernière'
        }
      : getComparison(salesLostAmount, salesLostAmount * 1.1);

    const overstockComparison = analyticsData?.overstockCost
      ? {
          change: analyticsData.overstockCost.change || 0,
          changePercent: analyticsData.overstockCost.changePercent || 0,
          trend: analyticsData.overstockCost.trend || 'neutral',
          comparisonPeriod: analyticsData.overstockCost.comparisonPeriod || 'semaine dernière'
        }
      : getComparison(overstockCost, overstockCost * 0.92);

    // Pour les KPIs qui n'ont pas de correspondance directe dans analyticsData, utiliser des calculs basés sur l'historique si disponible
    // Sinon, utiliser des valeurs par défaut
    const defaultComparisonPeriod = analyticsData?.skuAvailability?.comparisonPeriod || 'semaine dernière';

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
        title: 'Taux de Disponibilité des SKU',
        value: `${skuAvailabilityRate}%`,
        change: skuAvailabilityComparison.change,
        changePercent: skuAvailabilityComparison.changePercent,
        trend: normalizeTrend(skuAvailabilityComparison.trend, 'up'),
        description: `${availableSKUs} SKUs disponibles sur ${totalSKUs}`,
        icon: BarChart3,
        chartData: generateChartData(skuAvailabilityRate, 0.05),
        isCritical: skuAvailabilityRate < 60,
        comparisonPeriod: skuAvailabilityComparison.comparisonPeriod
      },
      {
        title: 'Valeur de l\'Inventaire',
        value: formatCurrency(roundToTwoDecimals(totalInventoryValue)),
        change: inventoryValuationComparison.change,
        changePercent: inventoryValuationComparison.changePercent,
        trend: normalizeTrend(inventoryValuationComparison.trend, 'up'),
        description: 'Valeur totale du stock actuel (prix d\'achat)',
        icon: DollarSign,
        chartData: generateChartData(totalInventoryValue, 0.05),
        comparisonPeriod: inventoryValuationComparison.comparisonPeriod
      },
      {
        title: 'Investissement Requis',
        value: formatCurrency(roundToTwoDecimals(totalInvestmentRequired)),
        change: 0,
        changePercent: 0,
        trend: 'neutral',
        description: 'Montant total à investir pour les produits à commander',
        icon: TrendingDown,
        chartData: generateChartData(totalInvestmentRequired, 0.1),
        isCritical: totalInvestmentRequired > 5000,
        comparisonPeriod: defaultComparisonPeriod
      },
      {
        title: 'À Commander',
        value: productsToOrder,
        change: 0,
        changePercent: 0,
        trend: 'neutral',
        description: 'Nombre de produits nécessitant une commande urgente',
        icon: ShoppingCart,
        chartData: generateChartData(productsToOrder * 10, 0.2),
        isCritical: productsToOrder > 5,
        comparisonPeriod: defaultComparisonPeriod
      },
      {
        title: 'Commandes en Cours',
        value: activeOrders,
        change: 0,
        changePercent: 0,
        trend: 'neutral',
        description: 'Nombre de commandes en attente, préparation ou transit',
        icon: Clock,
        chartData: generateChartData(activeOrders * 10, 0.15),
        comparisonPeriod: defaultComparisonPeriod
      },
      {
        title: 'Ventes Perdues - Ruptures Réelles',
        value: formatCurrency(roundToTwoDecimals(salesLostAmount)),
        change: salesLostRealComparison.change,
        changePercent: salesLostRealComparison.changePercent,
        trend: normalizeTrend(salesLostRealComparison.trend, 'down'),
        description: `⚠️ ATTENTION : Différent de "Ventes Perdues Estimées" ! Compte UNIQUEMENT les produits EN RUPTURE TOTALE (stock = 0). Mesure les pertes RÉELLES actuelles, pas les risques futurs. ${salesLostCount} SKU(s) en rupture. Pour voir les produits à risque, consultez "Ventes Perdues Estimées".`,
        icon: TrendingDown,
        chartData: generateChartData(salesLostAmount, 0.1),
        isCritical: salesLostAmount > 1000,
        comparisonPeriod: salesLostRealComparison.comparisonPeriod
      },
      {
        title: 'Ventes Perdues Estimées',
        value: formatCurrency(roundToTwoDecimals(lostSales)),
        change: 0,
        changePercent: 0,
        trend: 'neutral',
        description: '⚠️ ATTENTION : Différent d\'Analytics ! Inclut TOUS les produits à risque (ruptures actuelles + produits qui vont manquer bientôt). Permet d\'anticiper les pertes avant la rupture totale. Pour voir uniquement les ruptures réelles, consultez Analytics.',
        icon: TrendingUp,
        chartData: generateChartData(lostSales, 0.1),
        isCritical: lostSales > 1000,
        comparisonPeriod: defaultComparisonPeriod
      },
      {
        title: 'Valeur Surstocks Profonds',
        value: formatCurrency(roundToTwoDecimals(overstockCost)),
        change: overstockComparison.change,
        changePercent: overstockComparison.changePercent,
        trend: normalizeTrend(overstockComparison.trend, 'up'),
        description: `${overstockSKUs} SKU(s) en surstock profond${overstockSKUList && overstockSKUList.length > 0 ? ` : ${overstockSKUList.join(', ')}${overstockSKUs > 10 ? ` (+ ${overstockSKUs - 10} autres)` : ''}` : ''}`,
        icon: Boxes,
        chartData: generateChartData(overstockCost, 0.05),
        isCritical: overstockCost > 2000,
        comparisonPeriod: overstockComparison.comparisonPeriod
      }
    ];
  }, [enrichedProducts, orders, productsByStatus, formatCurrency, seuilSurstockProfond, analyticsData]);

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
          comparisonPeriod={kpi.comparisonPeriod || 'semaine dernière'}
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

