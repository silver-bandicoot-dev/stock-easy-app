/**
 * Service ML pour calculer le Revenu Potentiel basé sur :
 * - Historique des ventes (patterns, tendances)
 * - Vitesse de rotation actuelle et prévue
 * - Saisonnalités
 * - Prévisions ML (modèles de prévision de demande)
 * @module services/ml/revenueForecastService
 */

import { collectSalesHistory, getSalesStatistics } from './dataCollector';
import { DemandForecastModel } from './demandForecastModel';

// Facteurs de saisonnalité mensuels (basés sur des patterns généraux de commerce)
// Ces valeurs peuvent être ajustées avec l'historique réel
const SEASONALITY_FACTORS = {
  1: 0.85,  // Janvier (post-Noël, baisse)
  2: 0.80,  // Février
  3: 1.00,  // Mars
  4: 1.05,  // Avril
  5: 1.10,  // Mai
  6: 1.15,  // Juin (début été)
  7: 1.20,  // Juillet (été)
  8: 1.15,  // Août
  9: 1.00,  // Septembre
  10: 1.05, // Octobre
  11: 1.20, // Novembre (Black Friday)
  12: 1.50  // Décembre (Noël, pic)
};

/**
 * Calcule les facteurs de saisonnalité réels basés sur l'historique
 * @param {Array} salesHistory - Historique des ventes
 * @returns {Object} Facteurs de saisonnalité par mois
 */
function calculateSeasonalityFromHistory(salesHistory) {
  if (!salesHistory || salesHistory.length === 0) {
    return SEASONALITY_FACTORS;
  }

  // Regrouper par mois
  const monthlySales = {};
  salesHistory.forEach(sale => {
    const month = sale.month || new Date(sale.date).getMonth() + 1;
    if (!monthlySales[month]) {
      monthlySales[month] = { total: 0, count: 0 };
    }
    monthlySales[month].total += sale.quantity || 0;
    monthlySales[month].count += 1;
  });

  // Calculer la moyenne globale
  const totalSales = Object.values(monthlySales).reduce((sum, m) => sum + m.total, 0);
  const totalCount = Object.values(monthlySales).reduce((sum, m) => sum + m.count, 0);
  const globalAverage = totalCount > 0 ? totalSales / totalCount : 0;

  // Calculer les facteurs relatifs
  const factors = {};
  for (let month = 1; month <= 12; month++) {
    if (monthlySales[month] && monthlySales[month].count > 0) {
      const monthAverage = monthlySales[month].total / monthlySales[month].count;
      factors[month] = globalAverage > 0 ? monthAverage / globalAverage : SEASONALITY_FACTORS[month];
    } else {
      factors[month] = SEASONALITY_FACTORS[month];
    }
  }

  return factors;
}

/**
 * Analyse les tendances dans l'historique des ventes
 * @param {Array} salesHistory - Historique des ventes
 * @returns {Object} Tendance (up/down/stable) et taux de croissance
 */
function analyzeTrends(salesHistory) {
  if (!salesHistory || salesHistory.length < 7) {
    return { trend: 'stable', growthRate: 0, confidence: 0 };
  }

  // Trier par date
  const sorted = [...salesHistory].sort((a, b) => {
    const dateA = new Date(a.date || a.saleDate);
    const dateB = new Date(b.date || b.saleDate);
    return dateA - dateB;
  });

  // Diviser en deux périodes (première moitié vs seconde moitié)
  const midPoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midPoint);
  const secondHalf = sorted.slice(midPoint);

  const avgFirst = firstHalf.reduce((sum, s) => sum + (s.quantity || 0), 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, s) => sum + (s.quantity || 0), 0) / secondHalf.length;

  // Calculer le taux de croissance
  const growthRate = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;
  
  // Déterminer la tendance
  let trend = 'stable';
  if (growthRate > 5) trend = 'up';
  else if (growthRate < -5) trend = 'down';

  // Calculer la confiance basée sur la variance
  const allQuantities = sorted.map(s => s.quantity || 0);
  const variance = allQuantities.reduce((sum, qty) => {
    const avg = (avgFirst + avgSecond) / 2;
    return sum + Math.pow(qty - avg, 2);
  }, 0) / allQuantities.length;
  const stdDev = Math.sqrt(variance);
  const avg = (avgFirst + avgSecond) / 2;
  const coefficient = avg > 0 ? stdDev / avg : 1;
  const confidence = Math.max(0, Math.min(100, 100 - (coefficient * 100)));

  return { trend, growthRate: Math.round(growthRate * 100) / 100, confidence };
}

/**
 * Prédit la demande future avec le modèle ML
 * @param {Object} product - Produit
 * @param {Object} model - Modèle ML entraîné
 * @param {number} forecastDays - Nombre de jours à prédire
 * @param {Object} seasonalityFactors - Facteurs de saisonnalité
 * @returns {Promise<number>} Demande moyenne prédite par jour
 */
async function predictFutureDemand(product, model, forecastDays = 30, seasonalityFactors = SEASONALITY_FACTORS) {
  if (!model || !model.isReady()) {
    // Si pas de modèle, utiliser une estimation basique
    return product.salesPerDay || (product.sales30d ? product.sales30d / 30 : 0);
  }

  try {
    const today = new Date();
    const predictions = [];

    // Prédire pour chaque jour de la période
    for (let i = 0; i < Math.min(forecastDays, 90); i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);

      const month = futureDate.getMonth() + 1;
      const seasonalityFactor = seasonalityFactors[month] || 1;

      const prediction = await model.predict({
        dayOfWeek: futureDate.getDay(),
        month: month,
        isWeekend: [0, 6].includes(futureDate.getDay()),
        isHoliday: false,
        price: product.sellPrice || product.prixVente || 0,
        avgSales: product.salesPerDay || (product.sales30d ? product.sales30d / 30 : 0)
      });

      // Appliquer le facteur de saisonnalité
      predictions.push(prediction * seasonalityFactor);
    }

    // Retourner la moyenne
    const avgPrediction = predictions.reduce((sum, p) => sum + p, 0) / predictions.length;
    return Math.max(0, avgPrediction);
  } catch (error) {
    console.error('❌ Erreur prédiction ML:', error);
    // Fallback vers estimation basique
    return product.salesPerDay || (product.sales30d ? product.sales30d / 30 : 0);
  }
}

/**
 * Calcule le revenu potentiel basé sur ML pour un produit
 * @param {Object} product - Produit
 * @param {Object} salesHistory - Historique des ventes pour ce produit
 * @param {Object} model - Modèle ML (optionnel)
 * @param {Object} options - Options de calcul
 * @returns {Promise<Object>} Revenu potentiel et métriques associées
 */
export async function calculatePotentialRevenueML(product, salesHistory = [], model = null, options = {}) {
  const {
    forecastDays = 90, // Période de prévision en jours
    useSeasonality = true,
    useRotationRate = true,
    useMLPredictions = true
  } = options;

  try {
    // Prix de vente
    const sellPrice = product.sellPrice || product.prixVente || 0;
    if (sellPrice === 0) {
      return {
        potentialRevenue: 0,
        predictedDailySales: 0,
        rotationRate: 0,
        confidence: 0,
        method: 'no_price'
      };
    }

    // Stock actuel
    const currentStock = product.stock || product.stockActuel || 0;

    // Calculer les facteurs de saisonnalité
    const seasonalityFactors = useSeasonality 
      ? calculateSeasonalityFromHistory(salesHistory)
      : SEASONALITY_FACTORS;

    // Analyser les tendances
    const trendAnalysis = salesHistory.length > 0 
      ? analyzeTrends(salesHistory)
      : { trend: 'stable', growthRate: 0, confidence: 50 };

    // Ventes par jour de base
    let baseDailySales = product.salesPerDay || 0;
    
    // Si pas de salesPerDay, calculer depuis sales30d
    if (baseDailySales === 0 && product.sales30d) {
      baseDailySales = product.sales30d / 30;
    }

    // Si on a un historique, utiliser la moyenne réelle
    if (salesHistory.length > 0) {
      const stats = getSalesStatistics(salesHistory);
      if (stats.avgQuantity > 0) {
        baseDailySales = stats.avgQuantity;
      }
    }

    // Appliquer la tendance si elle est significative
    if (trendAnalysis.trend !== 'stable' && Math.abs(trendAnalysis.growthRate) > 3) {
      const trendFactor = 1 + (trendAnalysis.growthRate / 100);
      baseDailySales *= trendFactor;
    }

    // Prédiction ML de la demande future
    let predictedDailySales = baseDailySales;
    
    if (useMLPredictions && model && model.isReady() && salesHistory.length >= 30) {
      try {
        const mlPrediction = await predictFutureDemand(product, model, forecastDays, seasonalityFactors);
        // Mélanger prédiction ML (70%) et moyenne historique (30%)
        predictedDailySales = (mlPrediction * 0.7) + (baseDailySales * 0.3);
      } catch (error) {
        console.warn('⚠️ Erreur prédiction ML, utilisation de la moyenne:', error);
      }
    }

    // Appliquer le facteur de saisonnalité pour le mois actuel
    if (useSeasonality) {
      const currentMonth = new Date().getMonth() + 1;
      const seasonalityFactor = seasonalityFactors[currentMonth] || 1;
      predictedDailySales *= seasonalityFactor;
    }

    // Calculer la rotation actuelle
    const currentRotationRate = product.rotationRate || 0;
    
    // Calculer la rotation prévue basée sur les ventes prédites
    let predictedRotationRate = currentRotationRate;
    if (useRotationRate && currentStock > 0) {
      // Rotation = (Ventes annuelles prédites) / Stock
      const predictedAnnualSales = predictedDailySales * 365;
      predictedRotationRate = predictedAnnualSales / currentStock;
    }

    // Facteur de rotation (si rotation prévue > rotation actuelle, c'est positif)
    const rotationFactor = currentRotationRate > 0 && predictedRotationRate > 0
      ? Math.min(1.5, Math.max(0.7, predictedRotationRate / currentRotationRate))
      : 1.0;

    // Ajuster les ventes prédites selon le facteur de rotation
    const adjustedDailySales = predictedDailySales * rotationFactor;

    // Revenu potentiel sur la période de prévision
    // Considérer le minimum entre le stock disponible et la demande prédite
    const daysToSellOut = currentStock > 0 && adjustedDailySales > 0
      ? currentStock / adjustedDailySales
      : forecastDays;

    const effectiveDays = Math.min(daysToSellOut, forecastDays);
    const predictedUnits = adjustedDailySales * effectiveDays;
    const actualSellableUnits = Math.min(predictedUnits, currentStock);
    
    const potentialRevenue = actualSellableUnits * sellPrice;

    // Calculer la confiance globale
    let confidence = trendAnalysis.confidence || 50;
    
    // Ajuster selon la quantité de données
    const dataConfidence = Math.min(100, (salesHistory.length / 100) * 100);
    
    // Ajuster selon l'utilisation du ML
    if (useMLPredictions && model && model.isReady()) {
      confidence = (confidence * 0.5) + (dataConfidence * 0.5);
    } else {
      confidence = (confidence * 0.7) + (dataConfidence * 0.3);
    }

    return {
      potentialRevenue: Math.max(0, potentialRevenue),
      predictedDailySales: Math.max(0, adjustedDailySales),
      rotationRate: predictedRotationRate,
      confidence: Math.round(confidence),
      method: useMLPredictions && model && model.isReady() ? 'ml' : 'statistical',
      trend: trendAnalysis.trend,
      growthRate: trendAnalysis.growthRate,
      effectiveDays,
      actualSellableUnits,
      currentStock
    };

  } catch (error) {
    console.error('❌ Erreur calcul revenu potentiel ML:', error);
    
    // Fallback vers calcul simple
    const sellPrice = product.sellPrice || product.prixVente || 0;
    const currentStock = product.stock || product.stockActuel || 0;
    const baseRevenue = currentStock * sellPrice;

    return {
      potentialRevenue: baseRevenue,
      predictedDailySales: product.salesPerDay || (product.sales30d ? product.sales30d / 30 : 0),
      rotationRate: product.rotationRate || 0,
      confidence: 30,
      method: 'fallback',
      trend: 'stable',
      growthRate: 0,
      effectiveDays: forecastDays,
      actualSellableUnits: currentStock,
      currentStock
    };
  }
}

/**
 * Calcule le revenu potentiel total pour tous les produits avec ML
 * @param {Array} products - Liste des produits
 * @param {Object} model - Modèle ML (optionnel)
 * @param {Object} options - Options de calcul
 * @returns {Promise<Object>} Revenu potentiel total et détails par produit
 */
export async function calculateTotalPotentialRevenueML(products = [], model = null, options = {}) {
  try {
    console.log('📊 Calcul du Revenu Potentiel avec ML...');
    console.log(`📦 ${products.length} produits à analyser`);

    // Collecter l'historique des ventes pour tous les produits
    let allSalesHistory = [];
    try {
      allSalesHistory = await collectSalesHistory(products, { days: 180 });
      console.log(`📈 ${allSalesHistory.length} enregistrements d'historique collectés`);
    } catch (error) {
      console.warn('⚠️ Erreur collecte historique, utilisation des données disponibles:', error);
    }

    // Grouper l'historique par SKU
    const salesHistoryBySku = {};
    allSalesHistory.forEach(sale => {
      if (!salesHistoryBySku[sale.sku]) {
        salesHistoryBySku[sale.sku] = [];
      }
      salesHistoryBySku[sale.sku].push(sale);
    });

    // Calculer le revenu potentiel pour chaque produit
    const results = await Promise.all(
      products.map(async (product) => {
        const productHistory = salesHistoryBySku[product.sku] || [];
        const result = await calculatePotentialRevenueML(product, productHistory, model, options);
        return {
          sku: product.sku,
          ...result
        };
      })
    );

    // Calculer le total
    const totalRevenue = results.reduce((sum, r) => sum + (r.potentialRevenue || 0), 0);
    
    // Calculer la moyenne de confiance
    const avgConfidence = results.length > 0
      ? results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length
      : 0;

    // Compter les méthodes utilisées
    const methodCounts = results.reduce((acc, r) => {
      acc[r.method] = (acc[r.method] || 0) + 1;
      return acc;
    }, {});

    console.log(`✅ Revenu Potentiel calculé: ${totalRevenue.toFixed(2)}`);
    console.log(`📊 Confiance moyenne: ${Math.round(avgConfidence)}%`);
    console.log(`🤖 Méthodes utilisées:`, methodCounts);

    return {
      totalRevenue,
      avgConfidence: Math.round(avgConfidence),
      methodCounts,
      productDetails: results,
      dataQuality: {
        productsWithHistory: Object.keys(salesHistoryBySku).length,
        totalHistoryRecords: allSalesHistory.length,
        mlAvailable: model && model.isReady()
      }
    };

  } catch (error) {
    console.error('❌ Erreur calcul revenu potentiel total ML:', error);
    throw error;
  }
}


