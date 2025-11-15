import React, { useMemo } from 'react';
import { ShoppingCart, TrendingUp, DollarSign, Clock, TrendingDown, Link } from 'lucide-react';
import { KPICard } from '../features/KPICard';
import { useCurrency } from '../../contexts/CurrencyContext';
import { roundToTwoDecimals } from '../../utils/decimalUtils';

/**
 * Composant DashboardKPIs - Affiche les KPIs principaux du dashboard
 */
export function DashboardKPIs({ 
  enrichedProducts = [], 
  orders = [], 
  productsByStatus = {} 
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
    const lostSales = enrichedProducts
      .filter(p => p.healthStatus === 'urgent' && p.salesPerDay > 0)
      .reduce((sum, p) => {
        // Estimer les ventes perdues sur les 7 prochains jours si pas de stock
        const daysOutOfStock = Math.max(0, 7 - (p.daysOfStock || 0));
        const estimatedLostSales = daysOutOfStock * p.salesPerDay * (p.sellPrice || 0);
        return sum + estimatedLostSales;
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

    // 6. Pourcentage de mapping Produits ↔ Fournisseurs
    const totalProducts = enrichedProducts.length;
    const productsWithSupplier = enrichedProducts.filter(p => p.supplier && p.supplier.trim() !== '').length;
    const mappingPercentage = totalProducts > 0 
      ? Math.round((productsWithSupplier / totalProducts) * 100) 
      : 0;

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

    // Dashboard KPIs (6 KPIs critiques pour actions immédiates)
    // Ordre: Ligne 1: Valeur de l'Inventaire, Investissement Requis, Ventes Perdues Estimées
    //        Ligne 2: À Commander, Commandes en Cours, Mapping Produits ↔ Fournisseurs
    return [
      {
        title: 'Valeur de l\'Inventaire',
        value: formatCurrency(roundToTwoDecimals(totalInventoryValue)),
        change: 0,
        changePercent: 5.2,
        trend: 'up',
        description: 'Valeur totale du stock actuel (prix d\'achat)',
        icon: DollarSign,
        chartData: generateChartData(totalInventoryValue, 0.05)
      },
      {
        title: 'Investissement Requis',
        value: formatCurrency(roundToTwoDecimals(totalInvestmentRequired)),
        change: 0,
        changePercent: 12.3,
        trend: 'up',
        description: 'Montant total à investir pour les produits à commander',
        icon: TrendingDown,
        chartData: generateChartData(totalInvestmentRequired, 0.1),
        isCritical: totalInvestmentRequired > 5000
      },
      {
        title: 'Ventes Perdues Estimées',
        value: formatCurrency(roundToTwoDecimals(lostSales)),
        change: 0,
        changePercent: -15.0,
        trend: 'down',
        description: 'Forecast des ventes perdues sur 7 jours pour produits en rupture (stock = 0) et produits à risque (autonomie < stock de sécurité). Estimation basée sur les ventes/jour et le prix de vente.',
        icon: TrendingUp,
        chartData: generateChartData(lostSales, 0.1),
        isCritical: lostSales > 1000
      },
      {
        title: 'À Commander',
        value: productsToOrder,
        change: 0,
        changePercent: -8.0,
        trend: 'down',
        description: 'Nombre de produits nécessitant une commande urgente',
        icon: ShoppingCart,
        chartData: generateChartData(productsToOrder * 10, 0.2),
        isCritical: productsToOrder > 5
      },
      {
        title: 'Commandes en Cours',
        value: activeOrders,
        change: 0,
        changePercent: -12.5,
        trend: 'down',
        description: 'Nombre de commandes en attente, préparation ou transit',
        icon: Clock,
        chartData: generateChartData(activeOrders * 10, 0.15)
      },
      {
        title: 'Mapping Produits ↔ Fournisseurs',
        value: `${mappingPercentage}%`,
        change: 0,
        changePercent: mappingPercentage < 80 ? -5.0 : 2.5,
        trend: mappingPercentage < 80 ? 'down' : 'up',
        description: `Pourcentage de produits avec un fournisseur assigné (${productsWithSupplier}/${totalProducts})`,
        icon: Link,
        chartData: generateChartData(mappingPercentage, 0.05),
        isCritical: mappingPercentage < 70
      }
    ];
  }, [enrichedProducts, orders, productsByStatus, formatCurrency]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
          comparisonPeriod="semaine dernière"
          isCritical={
            kpi.isCritical ||
            (kpi.title.includes('Perdues') && (typeof kpi.value === 'string' ? parseFloat(kpi.value.replace(/[^0-9.]/g, '')) > 0 : kpi.value > 0)) ||
            (kpi.title.includes('En Transit') && typeof kpi.value === 'string' && kpi.value.includes('%') && parseInt(kpi.value) > 50) ||
            (kpi.title.includes('À Commander') && typeof kpi.value === 'number' && kpi.value > 5)
          }
          icon={kpi.icon}
        />
      ))}
    </div>
  );
}

export default DashboardKPIs;

