/**
 * SmartForecastEngine - Prévisions Intelligentes Sans ML Complexe
 * 
 * Utilise des règles statistiques éprouvées pour générer des prévisions
 * précises, rapides et fiables. Performance: <100ms vs 30-120s avec TensorFlow.
 * 
 * Algorithmes:
 * - Weighted Moving Average (WMA) : Tendance de base
 * - Day of Week Pattern : Saisonnalité hebdomadaire
 * - Trend Analysis : Détection de croissance/décroissance
 * - Seasonality : Patterns mensuels
 * - Confidence Score : Qualité de la prédiction
 * 
 * @module services/forecast/SmartForecastEngine
 */

export class SmartForecastEngine {
    constructor(options = {}) {
      // Configuration des poids (ajustables selon les données réelles)
      this.config = {
        wmaWindow: options.wmaWindow || 30,           // Fenêtre moyenne mobile
        trendWeight: options.trendWeight || 0.3,       // Influence de la tendance
        minHistoryDays: options.minHistoryDays || 14,  // Minimum pour prédire
        ...options
      };
    }
  
    /**
     * Génère une prévision pour un produit
     * 
     * @param {Array} salesHistory - Historique des ventes [{date, quantity}]
     * @param {Date} targetDate - Date cible pour la prévision
     * @returns {Object} Prévision avec confiance et détails
     */
    predict(salesHistory, targetDate = new Date()) {
      // Validation basique
      if (!salesHistory || salesHistory.length < this.config.minHistoryDays) {
        return this.lowConfidenceFallback(salesHistory);
      }
  
      // Tri chronologique (au cas où)
      const sortedHistory = this.sortByDate(salesHistory);
  
      // Calcul des composantes
      const base = this.weightedMovingAverage(sortedHistory);
      const dayMultiplier = this.dayOfWeekMultiplier(sortedHistory, targetDate);
      const trend = this.trendAdjustment(sortedHistory);
      const seasonality = this.seasonalityMultiplier(sortedHistory, targetDate);
  
      // Prédiction finale
      const rawPrediction = base * dayMultiplier * (1 + trend * this.config.trendWeight) * seasonality;
      const prediction = Math.max(0, Math.round(rawPrediction));
  
      // Score de confiance
      const confidence = this.calculateConfidence(sortedHistory);
  
      // Intervalle de prédiction (min/max probable)
      const interval = this.predictionInterval(prediction, confidence, sortedHistory);
  
      return {
        value: prediction,
        confidence,
        interval,
        breakdown: {
          base: Math.round(base * 10) / 10,
          dayMultiplier: Math.round(dayMultiplier * 100) / 100,
          trend: Math.round(trend * 1000) / 1000,
          seasonality: Math.round(seasonality * 100) / 100
        },
        metadata: {
          dataPoints: sortedHistory.length,
          lastUpdate: new Date(),
          algorithm: 'SmartForecast v1.0'
        }
      };
    }
  
    /**
     * Génère des prévisions pour plusieurs jours
     * 
     * @param {Array} salesHistory - Historique des ventes
     * @param {number} days - Nombre de jours à prévoir (défaut: 30)
     * @returns {Array} Prévisions par jour
     */
    predictMultipleDays(salesHistory, days = 30) {
      const predictions = [];
      const today = new Date();
  
      for (let i = 1; i <= days; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
  
        const prediction = this.predict(salesHistory, targetDate);
        
        predictions.push({
          date: targetDate.toISOString().split('T')[0],
          ...prediction
        });
      }
  
      return predictions;
    }
  
    /**
     * Moyenne mobile pondérée (les jours récents comptent plus)
     * 
     * Formule: WMA = Σ(quantity[i] * weight[i]) / Σ(weight[i])
     * où weight[i] = i + 1 (les jours récents ont plus de poids)
     */
    weightedMovingAverage(history) {
      const window = Math.min(this.config.wmaWindow, history.length);
      const recentData = history.slice(-window);
  
      // Poids: 1, 2, 3, ..., n (les derniers jours comptent plus)
      const weights = Array.from({ length: window }, (_, i) => i + 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
  
      const weightedSum = recentData.reduce((sum, sale, i) => {
        return sum + (sale.quantity * weights[i]);
      }, 0);
  
      return weightedSum / totalWeight;
    }
  
    /**
     * Multiplicateur basé sur le jour de la semaine
     * 
     * Exemple: Si les lundis font 20% plus de ventes que la moyenne,
     * le multiplicateur pour lundi sera 1.2
     */
    dayOfWeekMultiplier(history, targetDate) {
      const targetDay = targetDate.getDay(); // 0-6 (Dimanche-Samedi)
  
      // Grouper par jour de la semaine
      const dayStats = this.groupByDayOfWeek(history);
      
      // Moyenne globale
      const globalAvg = this.average(history.map(s => s.quantity));
  
      // Si pas assez de données pour ce jour, retourner 1
      if (!dayStats[targetDay] || dayStats[targetDay].count < 2) {
        return 1;
      }
  
      // Ratio: moyenne du jour / moyenne globale
      const dayAvg = dayStats[targetDay].avg;
      return dayAvg / globalAvg;
    }
  
    /**
     * Détection de tendance (croissance ou décroissance)
     * 
     * Compare les 2 dernières semaines aux 2 semaines précédentes
     * Retourne un pourcentage de changement
     */
    trendAdjustment(history) {
      if (history.length < 28) {
        return 0; // Pas assez de données
      }
  
      // Dernières 2 semaines
      const recent = history.slice(-14);
      const recentAvg = this.average(recent.map(s => s.quantity));
  
      // 2 semaines avant
      const previous = history.slice(-28, -14);
      const previousAvg = this.average(previous.map(s => s.quantity));
  
      // Éviter division par zéro
      if (previousAvg === 0) return 0;
  
      // Pourcentage de changement
      const change = (recentAvg - previousAvg) / previousAvg;
  
      // Limiter à ±50% pour éviter les prédictions folles
      return Math.max(-0.5, Math.min(0.5, change));
    }
  
    /**
     * Multiplicateur de saisonnalité (patterns mensuels)
     * 
     * Exemple: Décembre fait souvent 30% plus que la moyenne
     */
    seasonalityMultiplier(history, targetDate) {
      const targetMonth = targetDate.getMonth(); // 0-11
  
      // Grouper par mois
      const monthStats = this.groupByMonth(history);
  
      // Moyenne globale
      const globalAvg = this.average(history.map(s => s.quantity));
  
      // Si pas assez de données pour ce mois
      if (!monthStats[targetMonth] || monthStats[targetMonth].count < 3) {
        return 1;
      }
  
      // Ratio: moyenne du mois / moyenne globale
      const monthAvg = monthStats[targetMonth].avg;
      return monthAvg / globalAvg;
    }
  
    /**
     * Calcul du score de confiance (0-1)
     * 
     * Basé sur:
     * - Quantité d'historique
     * - Régularité des ventes
     * - Variance (stabilité)
     */
    calculateConfidence(history) {
      let score = 0;
  
      // 1. Quantité de données (40% du score)
      if (history.length >= 90) score += 0.4;
      else if (history.length >= 60) score += 0.3;
      else if (history.length >= 30) score += 0.2;
      else score += 0.1;
  
      // 2. Régularité (30% du score)
      const quantities = history.map(s => s.quantity);
      const zeroRate = quantities.filter(q => q === 0).length / history.length;
      
      if (zeroRate < 0.1) score += 0.3;      // <10% de jours à zéro
      else if (zeroRate < 0.3) score += 0.2; // <30%
      else if (zeroRate < 0.5) score += 0.1; // <50%
      else score += 0.05;                    // >50%
  
      // 3. Stabilité/Variance (30% du score)
      const cv = this.coefficientOfVariation(quantities);
      
      if (cv < 0.3) score += 0.3;      // Très stable
      else if (cv < 0.5) score += 0.2; // Assez stable
      else if (cv < 0.8) score += 0.1; // Variable
      else score += 0.05;              // Très variable
  
      return Math.min(1, Math.max(0, score));
    }
  
    /**
     * Intervalle de prédiction (min/max probable)
     * 
     * Plus la confiance est faible, plus l'intervalle est large
     */
    predictionInterval(prediction, confidence, history) {
      const quantities = history.map(s => s.quantity);
      const std = this.standardDeviation(quantities);
  
      // Facteur d'élargissement basé sur la confiance
      // Confiance élevée = intervalle étroit
      // Confiance faible = intervalle large
      const factor = 2 * (1 - confidence) + 0.5;
  
      return {
        min: Math.max(0, Math.round(prediction - std * factor)),
        max: Math.round(prediction + std * factor)
      };
    }
  
    /**
     * Fallback pour données insuffisantes
     */
    lowConfidenceFallback(history) {
      if (!history || history.length === 0) {
        return {
          value: 0,
          confidence: 0,
          interval: { min: 0, max: 0 },
          breakdown: null,
          metadata: {
            warning: 'Aucune donnée disponible',
            algorithm: 'Fallback'
          }
        };
      }
  
      // Utiliser juste la moyenne simple
      const avg = this.average(history.map(s => s.quantity));
      const prediction = Math.round(avg);
  
      return {
        value: prediction,
        confidence: 0.3,
        interval: {
          min: Math.round(prediction * 0.5),
          max: Math.round(prediction * 1.5)
        },
        breakdown: {
          base: prediction,
          dayMultiplier: 1,
          trend: 0,
          seasonality: 1
        },
        metadata: {
          dataPoints: history.length,
          warning: 'Données insuffisantes - précision limitée',
          algorithm: 'Simple Average Fallback'
        }
      };
    }
  
    // ========================================
    // UTILITAIRES
    // ========================================
  
    /**
     * Groupe les ventes par jour de la semaine
     */
    groupByDayOfWeek(history) {
      const groups = {};
  
      history.forEach(sale => {
        const day = new Date(sale.date).getDay();
        if (!groups[day]) {
          groups[day] = { sum: 0, count: 0, avg: 0 };
        }
        groups[day].sum += sale.quantity;
        groups[day].count++;
      });
  
      // Calculer les moyennes
      Object.keys(groups).forEach(day => {
        groups[day].avg = groups[day].sum / groups[day].count;
      });
  
      return groups;
    }
  
    /**
     * Groupe les ventes par mois
     */
    groupByMonth(history) {
      const groups = {};
  
      history.forEach(sale => {
        const month = new Date(sale.date).getMonth();
        if (!groups[month]) {
          groups[month] = { sum: 0, count: 0, avg: 0 };
        }
        groups[month].sum += sale.quantity;
        groups[month].count++;
      });
  
      // Calculer les moyennes
      Object.keys(groups).forEach(month => {
        groups[month].avg = groups[month].sum / groups[month].count;
      });
  
      return groups;
    }
  
    /**
     * Trie par date (ordre chronologique)
     */
    sortByDate(history) {
      return [...history].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
    }
  
    /**
     * Moyenne simple
     */
    average(values) {
      if (values.length === 0) return 0;
      return values.reduce((a, b) => a + b, 0) / values.length;
    }
  
    /**
     * Écart-type
     */
    standardDeviation(values) {
      if (values.length === 0) return 0;
      const avg = this.average(values);
      const squareDiffs = values.map(value => Math.pow(value - avg, 2));
      const avgSquareDiff = this.average(squareDiffs);
      return Math.sqrt(avgSquareDiff);
    }
  
    /**
     * Coefficient de variation (écart-type / moyenne)
     * Mesure la variabilité relative
     */
    coefficientOfVariation(values) {
      const avg = this.average(values);
      if (avg === 0) return 0;
      const std = this.standardDeviation(values);
      return std / avg;
    }
  
    /**
     * Calcule la précision moyenne (MAPE) sur l'historique
     * Utile pour backtesting
     */
    calculateMAPE(history, windowSize = 30) {
      if (history.length < windowSize + 7) {
        return null; // Pas assez de données pour tester
      }
  
      const errors = [];
  
      // Prendre les 30 derniers jours comme test
      for (let i = history.length - windowSize; i < history.length; i++) {
        const trainData = history.slice(0, i);
        const actualValue = history[i].quantity;
        
        if (actualValue === 0) continue; // Éviter division par zéro
  
        const prediction = this.predict(trainData, new Date(history[i].date));
        const error = Math.abs(prediction.value - actualValue) / actualValue;
        
        errors.push(error);
      }
  
      if (errors.length === 0) return null;

      const mape = this.average(errors) * 100; // Convertir en pourcentage
      
      // Vérifier que mape n'est pas NaN
      if (isNaN(mape) || !isFinite(mape)) {
        return null;
      }
      
      // Calculer la précision (100 - MAPE)
      // Si MAPE > 100%, cela signifie que l'erreur moyenne est supérieure à 100%
      // Dans ce cas, on limite l'accuracy à 0% minimum
      const rawAccuracy = 100 - mape;
      const accuracy = Math.max(0, Math.min(100, rawAccuracy)); // Limiter entre 0% et 100%
      
      // Vérifier que accuracy n'est pas NaN
      if (isNaN(accuracy) || !isFinite(accuracy)) {
        return null;
      }
      
      return {
        mape: mape,
        accuracy: accuracy,
        rawAccuracy: rawAccuracy, // Précision non limitée (peut être négative)
        tested: errors.length,
        quality: mape <= 10 ? 'excellent' : 
                 mape <= 20 ? 'good' : 
                 mape <= 30 ? 'acceptable' : 
                 mape <= 50 ? 'poor' : 'very_poor'
      };
    }
  }
  
  /**
   * Factory pour créer une instance préconfigurée
   */
  export function createSmartForecast(config = {}) {
    return new SmartForecastEngine(config);
  }
  
  /**
   * Prévision rapide (helper)
   */
  export function quickForecast(salesHistory, days = 30) {
    const engine = new SmartForecastEngine();
    
    if (days === 1) {
      return engine.predict(salesHistory);
    }
    
    return engine.predictMultipleDays(salesHistory, days);
  }

