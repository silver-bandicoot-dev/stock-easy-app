/**
 * React Hooks pour SmartForecast
 * 
 * Hooks pour intégrer facilement les prévisions dans tes composants React
 * 
 * @module hooks/useSmartForecast
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SmartForecastEngine } from '../services/forecast/SmartForecastEngine';

/**
 * Hook principal pour les prévisions
 * 
 * @param {string} productId - ID du produit
 * @param {Array} salesHistory - Historique des ventes
 * @param {Object} options - Options de configuration
 * @returns {Object} État et fonctions de prévision
 */
export function useSmartForecast(productId, salesHistory, options = {}) {
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configuration par défaut
  const config = useMemo(() => ({
    days: options.days || 30,
    autoUpdate: options.autoUpdate !== false,
    cacheEnabled: options.cacheEnabled !== false,
    ...options
  }), [options]);

  // Instance du moteur de prévision
  const engine = useMemo(() => new SmartForecastEngine(config), [config]);

  /**
   * Génère une nouvelle prévision
   */
  const generateForecast = useCallback(async () => {
    if (!salesHistory || salesHistory.length === 0) {
      setForecast(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Petit délai artificiel pour smooth UX (optionnel)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Générer les prévisions
      const predictions = engine.predictMultipleDays(salesHistory, config.days);

      // Agrégations utiles
      const summary = {
        total: predictions.reduce((sum, p) => sum + p.value, 0),
        average: predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length,
        avgConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
        predictions
      };

      setForecast(summary);

      // Cache local (optionnel)
      if (config.cacheEnabled) {
        localStorage.setItem(
          `forecast_${productId}`,
          JSON.stringify({
            summary,
            timestamp: Date.now()
          })
        );
      }
    } catch (err) {
      console.error('Erreur génération prévision:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [salesHistory, config.days, config.cacheEnabled, productId, engine]);

  /**
   * Charge depuis le cache si disponible
   */
  const loadFromCache = useCallback(() => {
    if (!config.cacheEnabled) return false;

    try {
      const cached = localStorage.getItem(`forecast_${productId}`);
      if (!cached) return false;

      const { summary, timestamp } = JSON.parse(cached);

      // Cache valide pendant 1 heure
      const isValid = Date.now() - timestamp < 60 * 60 * 1000;
      
      if (isValid) {
        setForecast(summary);
        return true;
      }
    } catch (err) {
      console.warn('Erreur chargement cache:', err);
    }

    return false;
  }, [config.cacheEnabled, productId]);

  /**
   * Auto-génération au chargement
   */
  useEffect(() => {
    if (!config.autoUpdate) return;

    // Essayer le cache d'abord
    const fromCache = loadFromCache();

    // Sinon générer
    if (!fromCache) {
      generateForecast();
    }
  }, [config.autoUpdate, loadFromCache, generateForecast]);

  /**
   * Régénérer quand les données changent
   */
  useEffect(() => {
    if (config.autoUpdate && salesHistory && salesHistory.length > 0) {
      generateForecast();
    }
  }, [salesHistory?.length, config.autoUpdate]); // Seulement si la taille change

  return {
    forecast,
    isLoading,
    error,
    generate: generateForecast,
    refresh: generateForecast,
    engine
  };
}

/**
 * Hook pour prévision d'une seule journée
 */
export function useDailyForecast(productId, salesHistory, targetDate) {
  const [prediction, setPrediction] = useState(null);
  const engine = useMemo(() => new SmartForecastEngine(), []);

  useEffect(() => {
    if (!salesHistory || salesHistory.length === 0) {
      setPrediction(null);
      return;
    }

    const date = targetDate || new Date();
    const result = engine.predict(salesHistory, date);
    setPrediction(result);
  }, [salesHistory, targetDate, engine]);

  return prediction;
}

/**
 * Hook pour comparer prévision vs réalité (backtesting)
 */
export function useForecastAccuracy(salesHistory) {
  const [accuracy, setAccuracy] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculate = useCallback(() => {
    if (!salesHistory || salesHistory.length < 40) {
      setAccuracy(null);
      return;
    }

    setIsCalculating(true);

    setTimeout(() => {
      const engine = new SmartForecastEngine();
      const result = engine.calculateMAPE(salesHistory);
      setAccuracy(result);
      setIsCalculating(false);
    }, 50);
  }, [salesHistory]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return {
    accuracy,
    isCalculating,
    recalculate: calculate
  };
}

/**
 * Hook pour obtenir des recommandations basées sur les prévisions
 * Retourne des clés de traduction pour permettre l'internationalisation
 * 
 * @param {Object} forecast - Prévisions générées
 * @param {number} currentStock - Stock actuel
 * @param {number} reorderPoint - Point de commande
 * @param {Object} options - Options supplémentaires
 * @param {number} options.securityStock - Stock de sécurité du produit (en unités)
 * @param {number} options.leadTimeDays - Délai de livraison en jours
 */
export function useForecastRecommendations(forecast, currentStock, reorderPoint, options = {}) {
  return useMemo(() => {
    if (!forecast || !forecast.predictions) {
      return null;
    }

    const recommendations = [];
    const { total, average, avgConfidence } = forecast;
    
    // Utiliser le securityStock du produit si fourni, sinon calculer avec la formule standard
    // Formule cohérente avec le backend: salesPerDay × leadTime × 0.2
    const leadTimeDays = options.leadTimeDays || 30; // Délai par défaut si non fourni
    let safetyStock;
    
    if (options.securityStock !== undefined && options.securityStock > 0) {
      // Utiliser le securityStock du produit (déjà en unités)
      safetyStock = options.securityStock;
    } else {
      // Calculer avec la formule standard: average × leadTime × 0.2
      // Où average est la moyenne des ventes prédites par jour
      safetyStock = Math.ceil(average * leadTimeDays * 0.2);
    }
    
    // Recommandation 1: Stock de sécurité
    if (currentStock < safetyStock) {
      recommendations.push({
        type: 'safety_stock',
        priority: 'high',
        messageKey: 'analytics.forecast.recommendations.safetyStock',
        messageParams: { current: currentStock, recommended: safetyStock },
        actionKey: 'analytics.forecast.recommendations.safetyStockAction',
        actionParams: { quantity: safetyStock - currentStock },
        // Fallback messages pour la compatibilité
        message: `Stock actuel (${currentStock}) en dessous du stock de sécurité recommandé (${safetyStock})`,
        action: `Commander au moins ${safetyStock - currentStock} unités`,
        icon: '⚠️'
      });
    }

    // Recommandation 2: Rupture prévue
    const daysUntilStockout = Math.floor(currentStock / average);
    if (daysUntilStockout < 7) {
      recommendations.push({
        type: 'stockout_warning',
        priority: 'critical',
        messageKey: 'analytics.forecast.recommendations.stockoutWarning',
        messageParams: { days: daysUntilStockout },
        actionKey: 'analytics.forecast.recommendations.stockoutAction',
        actionParams: {},
        message: `Rupture de stock prévue dans ${daysUntilStockout} jour(s)`,
        action: 'Commander immédiatement',
        icon: '🚨'
      });
    }

    // Recommandation 3: Opportunité de commande
    if (currentStock > reorderPoint && currentStock < safetyStock) {
      const optimalOrder = Math.ceil(total - currentStock);
      recommendations.push({
        type: 'optimal_order',
        priority: 'medium',
        messageKey: 'analytics.forecast.recommendations.optimalOrder',
        messageParams: {},
        actionKey: 'analytics.forecast.recommendations.optimalOrderAction',
        actionParams: { quantity: optimalOrder },
        message: 'Bon moment pour commander',
        action: `Quantité optimale: ${optimalOrder} unités pour les 30 prochains jours`,
        icon: '💡'
      });
    }

    // Recommandation 4: Confiance faible
    if (avgConfidence < 0.5) {
      recommendations.push({
        type: 'low_confidence',
        priority: 'info',
        messageKey: 'analytics.forecast.recommendations.lowConfidence',
        messageParams: {},
        actionKey: 'analytics.forecast.recommendations.lowConfidenceAction',
        actionParams: {},
        message: 'Prévisions peu fiables (historique limité)',
        action: 'Augmenter la marge de sécurité de 50%',
        icon: 'ℹ️'
      });
    }

    // Recommandation 5: Surstock
    if (currentStock > total * 1.5) {
      recommendations.push({
        type: 'overstock',
        priority: 'low',
        messageKey: 'analytics.forecast.recommendations.overstock',
        messageParams: {},
        actionKey: 'analytics.forecast.recommendations.overstockAction',
        actionParams: {},
        message: 'Stock potentiellement excessif',
        action: 'Envisager une promotion ou réduire les commandes',
        icon: '📦'
      });
    }

    return recommendations;
  }, [forecast, currentStock, reorderPoint, options]);
}

/**
 * Hook pour statistiques de qualité de données
 */
export function useDataQuality(salesHistory) {
  return useMemo(() => {
    if (!salesHistory || salesHistory.length === 0) {
      return {
        score: 0,
        issues: ['Aucune donnée disponible'],
        recommendations: ['Commencer à enregistrer les ventes']
      };
    }

    const issues = [];
    const recommendations = [];
    let score = 100;

    // Vérifier la quantité de données
    if (salesHistory.length < 30) {
      score -= 30;
      issues.push(`Seulement ${salesHistory.length} jours d'historique`);
      recommendations.push('Collecter au moins 30 jours de données pour de meilleures prévisions');
    } else if (salesHistory.length < 60) {
      score -= 15;
      issues.push('Historique limité');
      recommendations.push('60+ jours d\'historique recommandés pour une précision optimale');
    }

    // Vérifier les jours à zéro
    const zeroRate = salesHistory.filter(s => s.quantity === 0).length / salesHistory.length;
    if (zeroRate > 0.5) {
      score -= 25;
      issues.push('Beaucoup de jours sans ventes');
      recommendations.push('Vérifier si le produit est toujours actif');
    } else if (zeroRate > 0.3) {
      score -= 10;
      issues.push('Ventes irrégulières');
    }

    // Vérifier la variance
    const quantities = salesHistory.map(s => s.quantity);
    const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const variance = quantities.reduce((sum, q) => sum + Math.pow(q - avg, 2), 0) / quantities.length;
    const std = Math.sqrt(variance);
    const cv = std / avg;

    if (cv > 1.0) {
      score -= 20;
      issues.push('Ventes très variables');
      recommendations.push('Augmenter le stock de sécurité');
    } else if (cv < 0.1) {
      score -= 10;
      issues.push('Ventes trop uniformes');
      recommendations.push('Vérifier la qualité des données');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues: issues.length > 0 ? issues : ['Aucun problème détecté'],
      recommendations: recommendations.length > 0 ? recommendations : ['Continuer la collecte de données'],
      metrics: {
        dataPoints: salesHistory.length,
        zeroRate: (zeroRate * 100).toFixed(1) + '%',
        variability: cv > 0.5 ? 'Élevée' : cv > 0.3 ? 'Moyenne' : 'Faible'
      }
    };
  }, [salesHistory]);
}

/**
 * Hook pour graphique de prévisions
 */
export function useForecastChart(forecast, salesHistory) {
  return useMemo(() => {
    if (!forecast || !forecast.predictions) {
      return { labels: [], datasets: [] };
    }

    // Données historiques (30 derniers jours)
    const historicalData = salesHistory
      ?.slice(-30)
      .map(sale => ({
        date: new Date(sale.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        value: sale.quantity,
        type: 'historical'
      })) || [];

    // Données de prévision
    const forecastData = forecast.predictions.map(pred => ({
      date: new Date(pred.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      value: pred.value,
      min: pred.interval.min,
      max: pred.interval.max,
      type: 'forecast'
    }));

    // Combiner pour le graphique
    return {
      labels: [...historicalData, ...forecastData].map(d => d.date),
      datasets: [
        {
          label: 'Historique',
          data: historicalData.map(d => d.value),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          type: 'historical'
        },
        {
          label: 'Prévision',
          data: Array(historicalData.length).fill(null).concat(forecastData.map(d => d.value)),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderDash: [5, 5],
          type: 'forecast'
        }
      ],
      rawData: { historicalData, forecastData }
    };
  }, [forecast, salesHistory]);
}

