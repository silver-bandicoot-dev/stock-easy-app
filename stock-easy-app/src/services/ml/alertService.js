/**
 * Service d'alertes intelligentes basées sur les prévisions ML
 * @module services/ml/alertService
 */

/**
 * Génère des alertes basées sur les prévisions ML
 * @param {Array} products - Liste des produits avec stock actuel
 * @param {Object} forecasts - Prévisions ML par SKU
 * @returns {Array} Liste d'alertes {type, severity, sku, message, action, daysUntilStockout}
 */
export function generateMLAlerts(products, forecasts) {
  const alerts = [];
  
  if (!forecasts || Object.keys(forecasts).length === 0) {
    return alerts;
  }

  products.forEach(product => {
    const forecast = forecasts[product.sku];
    if (!forecast) return;

    // Calculer quand le stock sera épuisé
    const stockoutAnalysis = predictStockout(
      product.stock,
      forecast.next30Days || forecast.next7Days
    );

    // ALERTE 1: Rupture de stock prévue
    if (stockoutAnalysis.willRunOut && stockoutAnalysis.daysUntil <= 14) {
      alerts.push({
        id: `stockout-${product.sku}`,
        type: 'stockout-risk',
        severity: stockoutAnalysis.daysUntil <= 3 ? 'critical' : stockoutAnalysis.daysUntil <= 7 ? 'high' : 'medium',
        sku: product.sku,
        productName: product.name,
        message: `Rupture de stock prévue dans ${stockoutAnalysis.daysUntil} jours pour ${product.name}`,
        details: `Stock actuel: ${product.stock} unités. Demande prévue: ${stockoutAnalysis.totalDemand} unités.`,
        daysUntilStockout: stockoutAnalysis.daysUntil,
        recommendedOrder: stockoutAnalysis.recommendedOrder,
        action: 'order_now'
      });
    }

    // ALERTE 2: Tendance à la hausse significative
    if (forecast.trend === 'up' && forecast.confidence > 70) {
      const increase = ((forecast.avg30Days - product.salesPerDay) / product.salesPerDay) * 100;
      
      if (increase > 30) {
        alerts.push({
          id: `trend-up-${product.sku}`,
          type: 'demand-surge',
          severity: 'medium',
          sku: product.sku,
          productName: product.name,
          message: `Forte hausse de demande prévue: +${increase.toFixed(0)}% pour ${product.name}`,
          details: `Demande actuelle: ${product.salesPerDay?.toFixed(1)} → Prévision: ${forecast.avg30Days?.toFixed(1)} unités/jour`,
          increasePercent: increase,
          action: 'increase_stock'
        });
      }
    }

    // ALERTE 3: Tendance à la baisse
    if (forecast.trend === 'down' && forecast.confidence > 70) {
      const decrease = ((product.salesPerDay - forecast.avg30Days) / product.salesPerDay) * 100;
      
      if (decrease > 30 && product.stock > 0) {
        alerts.push({
          id: `trend-down-${product.sku}`,
          type: 'demand-drop',
          severity: 'low',
          sku: product.sku,
          productName: product.name,
          message: `Baisse de demande prévue: -${decrease.toFixed(0)}% pour ${product.name}`,
          details: `Demande actuelle: ${product.salesPerDay?.toFixed(1)} → Prévision: ${forecast.avg30Days?.toFixed(1)} unités/jour. Risque de surstock.`,
          decreasePercent: decrease,
          action: 'reduce_stock'
        });
      }
    }

    // ALERTE 4: Stock excédentaire prévu
    const daysOfStock = product.stock / (forecast.averagePredicted || 1);
    if (daysOfStock > 60 && product.stock > 0) {
      alerts.push({
        id: `overstock-${product.sku}`,
        type: 'overstock-risk',
        severity: 'low',
        sku: product.sku,
        productName: product.name,
        message: `Stock excédentaire pour ${product.name}`,
        details: `${daysOfStock.toFixed(0)} jours de stock prévus. Considérez réduire les commandes.`,
        daysOfStock: daysOfStock,
        action: 'reduce_orders'
      });
    }

    // ALERTE 5: Délai de livraison risqué
    if (product.leadTimeDays && stockoutAnalysis.daysUntil > 0) {
      const safetyMargin = stockoutAnalysis.daysUntil - product.leadTimeDays;
      
      if (safetyMargin <= 3 && safetyMargin > 0) {
        alerts.push({
          id: `lead-time-${product.sku}`,
          type: 'lead-time-warning',
          severity: 'high',
          sku: product.sku,
          productName: product.name,
          message: `Commandez MAINTENANT ${product.name} - Marge de sécurité faible`,
          details: `Rupture prévue dans ${stockoutAnalysis.daysUntil}j, délai fournisseur: ${product.leadTimeDays}j. Marge: ${safetyMargin}j seulement.`,
          safetyMargin: safetyMargin,
          action: 'urgent_order'
        });
      }
    }
  });

  // Trier par sévérité
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

/**
 * Prédit quand le stock sera épuisé
 * @param {number} currentStock - Stock actuel
 * @param {Array} forecastedDemand - Demande prévue par jour
 * @returns {Object} {willRunOut, daysUntil, totalDemand, recommendedOrder}
 */
function predictStockout(currentStock, forecastedDemand) {
  if (!forecastedDemand || forecastedDemand.length === 0) {
    return { willRunOut: false, daysUntil: Infinity, totalDemand: 0, recommendedOrder: 0 };
  }

  let remainingStock = currentStock;
  let daysUntilStockout = -1;
  let totalDemand = 0;

  for (let i = 0; i < forecastedDemand.length; i++) {
    remainingStock -= forecastedDemand[i];
    totalDemand += forecastedDemand[i];
    
    if (remainingStock <= 0 && daysUntilStockout === -1) {
      daysUntilStockout = i + 1;
      break;
    }
  }

  const willRunOut = daysUntilStockout !== -1;
  const recommendedOrder = willRunOut 
    ? Math.ceil(totalDemand * 1.2) // 20% de marge
    : 0;

  return {
    willRunOut,
    daysUntil: willRunOut ? daysUntilStockout : Infinity,
    totalDemand: Math.round(totalDemand),
    recommendedOrder
  };
}

/**
 * Calcule le score de criticité global d'un produit
 * @param {Object} product - Produit
 * @param {Object} forecast - Prévisions
 * @returns {number} Score de 0 (pas critique) à 100 (très critique)
 */
export function calculateCriticalityScore(product, forecast) {
  if (!forecast) return 0;

  let score = 0;

  // Facteur 1: Ratio stock/demande (40 points)
  const daysOfStock = product.stock / (forecast.averagePredicted || 1);
  if (daysOfStock <= 3) score += 40;
  else if (daysOfStock <= 7) score += 30;
  else if (daysOfStock <= 14) score += 20;
  else if (daysOfStock <= 30) score += 10;

  // Facteur 2: Tendance à la hausse (30 points)
  if (forecast.trend === 'up') {
    const increase = ((forecast.avg30Days - product.salesPerDay) / product.salesPerDay) * 100;
    if (increase > 50) score += 30;
    else if (increase > 30) score += 20;
    else if (increase > 15) score += 10;
  }

  // Facteur 3: Volume de ventes (15 points)
  if (product.salesPerDay > 20) score += 15;
  else if (product.salesPerDay > 10) score += 10;
  else if (product.salesPerDay > 5) score += 5;

  // Facteur 4: Délai de livraison long (15 points)
  if (product.leadTimeDays > 14) score += 15;
  else if (product.leadTimeDays > 7) score += 10;
  else if (product.leadTimeDays > 3) score += 5;

  return Math.min(100, score);
}

/**
 * Génère des recommandations automatiques de commande
 * @param {Array} products - Produits
 * @param {Object} forecasts - Prévisions
 * @returns {Array} Recommandations {sku, quantity, reason, urgency}
 */
export function generateAutoRecommendations(products, forecasts) {
  const recommendations = [];

  products.forEach(product => {
    const forecast = forecasts[product.sku];
    if (!forecast) return;

    const stockoutAnalysis = predictStockout(product.stock, forecast.next30Days || forecast.next7Days);
    const criticalityScore = calculateCriticalityScore(product, forecast);

    // Recommandation si criticité > 30 ou rupture prévue
    if (criticalityScore > 30 || stockoutAnalysis.willRunOut) {
      let reason = [];
      let urgency = 'normal';

      if (stockoutAnalysis.willRunOut && stockoutAnalysis.daysUntil <= 7) {
        reason.push(`Rupture dans ${stockoutAnalysis.daysUntil}j`);
        urgency = 'urgent';
      }
      
      if (forecast.trend === 'up' && forecast.confidence > 70) {
        reason.push('Tendance hausse confirmée');
      }

      if (product.leadTimeDays > stockoutAnalysis.daysUntil) {
        reason.push('Délai fournisseur critique');
        urgency = 'urgent';
      }

      recommendations.push({
        sku: product.sku,
        productName: product.name,
        quantity: stockoutAnalysis.recommendedOrder || forecast.recommendedOrder,
        reason: reason.join(', '),
        urgency,
        criticalityScore,
        supplier: product.supplier,
        estimatedCost: (stockoutAnalysis.recommendedOrder || forecast.recommendedOrder) * (product.buyPrice || 0)
      });
    }
  });

  // Trier par urgence et criticité
  recommendations.sort((a, b) => {
    if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
    if (a.urgency !== 'urgent' && b.urgency === 'urgent') return 1;
    return b.criticalityScore - a.criticalityScore;
  });

  return recommendations;
}

export default {
  generateMLAlerts,
  calculateCriticalityScore,
  generateAutoRecommendations
};

