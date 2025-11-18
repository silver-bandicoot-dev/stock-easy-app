import { roundToTwoDecimals } from './decimalUtils';

/**
 * Calcule tous les KPIs pour Analytics (analyse approfondie)
 * @param {Array} enrichedProducts - Produits enrichis
 * @param {Array} orders - Commandes
 * @param {Function} formatCurrency - Fonction de formatage de devise
 * @param {Object} mlRevenueData - Données de revenu potentiel ML (optionnel)
 * @returns {Object} Objet contenant tous les KPIs calculés
 */
export function calculateAnalyticsKPIs(enrichedProducts = [], orders = [], formatCurrency, mlRevenueData = null) {
  // Gérer les cas null/undefined
  const safeProducts = Array.isArray(enrichedProducts) ? enrichedProducts : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  // Total produits
  const totalProducts = safeProducts.length;

  // Pourcentage de mapping Produits ↔ Fournisseurs
  const productsWithSupplier = safeProducts.filter(p => p.supplier && p.supplier.trim() !== '').length;
  const mappingPercentage = totalProducts > 0 
    ? Math.round((productsWithSupplier / totalProducts) * 100) 
    : 0;

  // Produits en bonne santé
  const healthyProducts = safeProducts.filter(p => p.healthStatus === 'healthy').length;
  const healthyPercentage = totalProducts > 0 
    ? Math.round((healthyProducts / totalProducts) * 100) 
    : 0;

  // Marge brute totale
  // Si grossMargin est pré-calculé par le backend, l'utiliser
  // Sinon, calculer la vraie marge brute : (prix de vente - prix d'achat) × stock
  const totalGrossMargin = safeProducts.reduce((sum, p) => {
    // Si grossMargin est pré-calculé par le backend, l'utiliser
    if (p.grossMargin !== undefined && p.grossMargin !== null) {
      return sum + p.grossMargin;
    }
    
    // Sinon, calculer la vraie marge brute : (prix de vente - prix d'achat) × stock
    const marginPerUnit = (p.sellPrice || 0) - (p.buyPrice || 0);
    const totalMargin = marginPerUnit * (p.stock || 0);
    
    return sum + totalMargin;
  }, 0);

  // Valeur potentielle des ventes (revenu potentiel total)
  // Utiliser le calcul ML si disponible, sinon fallback vers calcul simple
  const totalPotentialRevenue = mlRevenueData && mlRevenueData.totalRevenue !== undefined
    ? mlRevenueData.totalRevenue
    : safeProducts.reduce((sum, p) => {
        return sum + (p.potentialRevenue || (p.stock * (p.sellPrice || 0)));
      }, 0);

  // Taux de rotation moyen (ABC analysis - produits rapides)
  // rotationRate est en rotations/an (confirmé dans StockTab.jsx)
  // Seuil de rotation rapide : > 4 rotations/an (équivalent à > 0.33 rotations/mois)
  const FAST_ROTATION_THRESHOLD = 4; // Minimum 4 rotations/an = rotation rapide
  const fastRotatingProducts = safeProducts.filter(p => {
    const rotationRate = p.rotationRate || 0;
    return rotationRate > FAST_ROTATION_THRESHOLD; // 4+ rotations/an
  }).length;

  // Calculer le taux de rotation moyen de tous les produits (en rotations/an)
  const allRotationRates = safeProducts
    .map(p => p.rotationRate || 0)
    .filter(rate => rate > 0); // Exclure les produits sans rotation
  const averageRotationRate = allRotationRates.length > 0
    ? allRotationRates.reduce((sum, rate) => sum + rate, 0) / allRotationRates.length
    : 0;
  // Le rotationRate est déjà en rotations/an, pas besoin de multiplier par 100
  const averageRotationDisplay = Math.round(averageRotationRate * 100) / 100; // Arrondir à 2 décimales

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

  return {
    mappingPercentage: {
      title: 'Mapping Produits ↔ Fournisseurs',
      value: `${mappingPercentage}%`,
      rawValue: mappingPercentage,
      change: 0,
      changePercent: mappingPercentage < 80 ? -5.0 : 2.5,
      trend: mappingPercentage < 80 ? 'down' : 'up',
      description: `Pourcentage de produits avec un fournisseur assigné (${productsWithSupplier}/${totalProducts})`,
      icon: 'Link',
      chartData: generateChartData(mappingPercentage, 0.05)
    },
    totalProducts: {
      title: 'Total Produits',
      value: totalProducts,
      rawValue: totalProducts,
      change: 0,
      changePercent: 2.5,
      trend: 'up',
      description: 'Nombre total de produits dans l\'inventaire',
      icon: 'Package',
      chartData: generateChartData(totalProducts, 0.05)
    },
    healthyPercentage: {
      title: 'En Bonne Santé',
      value: `${healthyPercentage}%`,
      rawValue: healthyPercentage,
      change: 0,
      changePercent: 4.2,
      trend: 'up',
      description: 'Pourcentage de produits avec un stock optimal',
      icon: 'Zap',
      chartData: generateChartData(healthyPercentage, 0.1)
    },
    totalGrossMargin: {
      title: 'Marge Brute Totale',
      value: formatCurrency ? formatCurrency(roundToTwoDecimals(totalGrossMargin)) : totalGrossMargin,
      rawValue: totalGrossMargin,
      change: 0,
      changePercent: 6.8,
      trend: 'up',
      description: 'Marge brute totale sur l\'inventaire actuel',
      icon: 'TrendingUp',
      chartData: generateChartData(totalGrossMargin, 0.05)
    },
    totalPotentialRevenue: {
      title: 'Revenu Potentiel (ML)',
      value: formatCurrency ? formatCurrency(roundToTwoDecimals(totalPotentialRevenue)) : totalPotentialRevenue,
      rawValue: totalPotentialRevenue,
      change: 0,
      changePercent: 5.5,
      trend: 'up',
      description: mlRevenueData 
        ? `Valeur potentielle de vente basée sur les prévisions ML (confiance: ${mlRevenueData.avgConfidence || 0}%). Calculé avec historique des ventes, rotation, saisonnalité et modèles de prévision.`
        : 'Valeur potentielle de vente de tout l\'inventaire',
      icon: 'DollarSign',
      chartData: generateChartData(totalPotentialRevenue, 0.05),
      mlData: mlRevenueData ? {
        confidence: mlRevenueData.avgConfidence,
        method: mlRevenueData.methodCounts,
        dataQuality: mlRevenueData.dataQuality
      } : null
    },
    fastRotatingProducts: {
      title: 'Rotation Rapide',
      value: fastRotatingProducts,
      rawValue: fastRotatingProducts,
      averageRotationRate: averageRotationDisplay,
      change: 0,
      changePercent: 3.7,
      trend: 'up',
      description: `Nombre de produits avec une rotation élevée (>${FAST_ROTATION_THRESHOLD} rotations/an). La rotation moyenne (${averageRotationDisplay} rot/an) représente la moyenne de tous vos produits : c'est le nombre moyen de fois que chaque stock se renouvelle en une année. Par exemple, 16.86 rot/an signifie que le stock se renouvelle en moyenne tous les 21 jours environ. Une rotation élevée (>${FAST_ROTATION_THRESHOLD} rot/an) indique une bonne dynamique commerciale.`,
      icon: 'Boxes',
      chartData: generateChartData(fastRotatingProducts * 10, 0.15)
    }
  };
}

