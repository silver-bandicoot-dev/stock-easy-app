/**
 * Service ML pour optimiser le multiplicateur de prévision
 * Analyse les données historiques et suggère un multiplicateur optimal
 * 
 * @module services/ml/multiplierOptimizer
 */

import { getSalesHistory } from '../../services/supabaseApiService';

/**
 * Classe pour optimiser le multiplicateur de prévision basé sur l'analyse ML
 */
export class MultiplierOptimizer {
  constructor() {
    this.minMultiplier = 0.5;
    this.maxMultiplier = 5.0;
    this.defaultMultiplier = 1.2;
  }

  /**
   * Analyse un produit et suggère un multiplicateur optimal
   * @param {Object} product - Le produit à analyser
   * @param {Array} salesHistory - Historique des ventes (optionnel, sera récupéré si absent)
   * @returns {Promise<Object>} Suggestion avec multiplicateur, confiance et raisonnement
   */
  async suggestOptimalMultiplier(product, salesHistory = null) {
    try {
      // Récupérer l'historique si non fourni
      if (!salesHistory) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6); // 6 mois d'historique
        
        salesHistory = await getSalesHistory({
          sku: product.sku,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });
      }

      // Si pas assez de données, retourner le multiplicateur actuel ou par défaut
      if (!salesHistory || salesHistory.length < 7) {
        return {
          suggestedMultiplier: product.multiplicateur_prevision || this.defaultMultiplier,
          confidence: 30,
          reasoning: 'Données insuffisantes pour une analyse fiable. Utilisation du multiplicateur actuel.',
          factors: {
            dataPoints: salesHistory?.length || 0,
            minimumRequired: 7
          }
        };
      }

      // Analyser différents facteurs
      const factors = {
        seasonality: this.detectSeasonality(salesHistory),
        trend: this.analyzeTrend(salesHistory),
        volatility: this.calculateVolatility(salesHistory),
        events: this.detectEvents(salesHistory),
        currentMultiplier: product.multiplicateur_prevision || this.defaultMultiplier
      };

      // Calculer le multiplicateur suggéré
      let suggestedMultiplier = factors.currentMultiplier;
      let adjustments = [];
      let confidence = 50; // Base de confiance

      // Ajustement saisonnier
      if (factors.seasonality.detected) {
        if (factors.seasonality.isPeakSeason) {
          const adjustment = 1.3; // +30% en saison haute
          suggestedMultiplier *= adjustment;
          adjustments.push(`Saison haute détectée (+${((adjustment - 1) * 100).toFixed(0)}%)`);
          confidence += 15;
        } else if (factors.seasonality.isLowSeason) {
          const adjustment = 0.75; // -25% en saison basse
          suggestedMultiplier *= adjustment;
          adjustments.push(`Saison basse détectée (-${((1 - adjustment) * 100).toFixed(0)}%)`);
          confidence += 15;
        }
      }

      // Ajustement tendance
      if (factors.trend.detected) {
        if (factors.trend.direction === 'increasing' && factors.trend.strength > 0.2) {
          const adjustment = 1 + (factors.trend.strength * 0.5); // Jusqu'à +50% selon la force
          suggestedMultiplier *= adjustment;
          adjustments.push(`Tendance haussière (+${((adjustment - 1) * 100).toFixed(0)}%)`);
          confidence += 10;
        } else if (factors.trend.direction === 'decreasing' && factors.trend.strength > 0.2) {
          const adjustment = 1 - (factors.trend.strength * 0.4); // Jusqu'à -40% selon la force
          suggestedMultiplier *= adjustment;
          adjustments.push(`Tendance baissière (-${((1 - adjustment) * 100).toFixed(0)}%)`);
          confidence += 10;
        }
      }

      // Ajustement volatilité
      if (factors.volatility.high) {
        const adjustment = 1.15; // +15% pour produits volatiles (plus de sécurité)
        suggestedMultiplier *= adjustment;
        adjustments.push(`Volatilité élevée détectée (+15% pour sécurité)`);
        confidence += 5;
      } else if (factors.volatility.low) {
        // Produit stable, pas d'ajustement nécessaire
        confidence += 5;
      }

      // Ajustement événements
      if (factors.events.detected && factors.events.upcoming) {
        const adjustment = 1.5; // +50% pour événements à venir
        suggestedMultiplier *= adjustment;
        adjustments.push(`Événement majeur à venir (+50%)`);
        confidence += 10;
      }

      // Limiter entre min et max
      suggestedMultiplier = Math.max(
        this.minMultiplier,
        Math.min(this.maxMultiplier, suggestedMultiplier)
      );

      // Arrondir à 1 décimale
      suggestedMultiplier = Math.round(suggestedMultiplier * 10) / 10;

      // Générer le raisonnement
      const reasoning = this.generateReasoning(factors, adjustments, suggestedMultiplier);

      // Calculer la confiance finale (max 95%)
      confidence = Math.min(95, confidence);

      return {
        suggestedMultiplier,
        confidence: Math.round(confidence),
        reasoning,
        factors: {
          seasonality: factors.seasonality.detected,
          trend: factors.trend.direction,
          volatility: factors.volatility.level,
          dataPoints: salesHistory.length,
          currentMultiplier: factors.currentMultiplier
        },
        adjustments: adjustments.length > 0 ? adjustments : ['Aucun ajustement nécessaire']
      };
    } catch (error) {
      console.error('❌ Erreur analyse ML multiplicateur:', error);
      return {
        suggestedMultiplier: product.multiplicateur_prevision || this.defaultMultiplier,
        confidence: 0,
        reasoning: `Erreur lors de l'analyse : ${error.message}`,
        error: true
      };
    }
  }

  /**
   * Détecte la saisonnalité dans les ventes
   * @private
   */
  detectSeasonality(salesHistory) {
    if (!salesHistory || salesHistory.length < 30) {
      return { detected: false };
    }

    // Grouper par mois
    const monthlySales = {};
    salesHistory.forEach(sale => {
      const month = new Date(sale.date || sale.sale_date).getMonth();
      if (!monthlySales[month]) {
        monthlySales[month] = { total: 0, count: 0 };
      }
      monthlySales[month].total += sale.quantity || sale.quantity_sold || 0;
      monthlySales[month].count += 1;
    });

    // Calculer les moyennes mensuelles
    const monthlyAverages = Object.keys(monthlySales).map(month => ({
      month: parseInt(month),
      average: monthlySales[month].total / monthlySales[month].count
    }));

    if (monthlyAverages.length < 3) {
      return { detected: false };
    }

    const overallAverage = monthlyAverages.reduce((sum, m) => sum + m.average, 0) / monthlyAverages.length;
    const currentMonth = new Date().getMonth();

    // Trouver le mois actuel dans les données
    const currentMonthData = monthlyAverages.find(m => m.month === currentMonth);
    
    if (!currentMonthData) {
      return { detected: false };
    }

    const ratio = currentMonthData.average / overallAverage;
    const isPeakSeason = ratio > 1.3; // +30% par rapport à la moyenne
    const isLowSeason = ratio < 0.7; // -30% par rapport à la moyenne

    return {
      detected: isPeakSeason || isLowSeason,
      isPeakSeason,
      isLowSeason,
      ratio: ratio.toFixed(2)
    };
  }

  /**
   * Analyse la tendance des ventes
   * @private
   */
  analyzeTrend(salesHistory) {
    if (!salesHistory || salesHistory.length < 14) {
      return { detected: false };
    }

    // Trier par date
    const sorted = [...salesHistory].sort((a, b) => {
      const dateA = new Date(a.date || a.sale_date);
      const dateB = new Date(b.date || b.sale_date);
      return dateA - dateB;
    });

    // Diviser en deux périodes
    const midPoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midPoint);
    const secondHalf = sorted.slice(midPoint);

    const avgFirst = firstHalf.reduce((sum, s) => sum + (s.quantity || s.quantity_sold || 0), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, s) => sum + (s.quantity || s.quantity_sold || 0), 0) / secondHalf.length;

    if (avgFirst === 0) {
      return { detected: false };
    }

    const change = (avgSecond - avgFirst) / avgFirst;
    const strength = Math.abs(change);

    return {
      detected: strength > 0.1, // Changement de plus de 10%
      direction: change > 0 ? 'increasing' : 'decreasing',
      strength: Math.min(1, strength), // Normaliser entre 0 et 1
      changePercent: (change * 100).toFixed(1)
    };
  }

  /**
   * Calcule la volatilité des ventes
   * @private
   */
  calculateVolatility(salesHistory) {
    if (!salesHistory || salesHistory.length < 7) {
      return { high: false, low: false, level: 'unknown' };
    }

    const quantities = salesHistory.map(s => s.quantity || s.quantity_sold || 0);
    const average = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;

    if (average === 0) {
      return { high: false, low: true, level: 'zero' };
    }

    // Calculer l'écart-type
    const variance = quantities.reduce((sum, q) => sum + Math.pow(q - average, 2), 0) / quantities.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient de variation
    const coefficientOfVariation = stdDev / average;

    const high = coefficientOfVariation > 0.5; // CV > 50% = volatilité élevée
    const low = coefficientOfVariation < 0.2; // CV < 20% = volatilité faible

    return {
      high,
      low,
      level: high ? 'high' : (low ? 'low' : 'medium'),
      coefficientOfVariation: coefficientOfVariation.toFixed(2)
    };
  }

  /**
   * Détecte les événements (pics de ventes)
   * @private
   */
  detectEvents(salesHistory) {
    if (!salesHistory || salesHistory.length < 7) {
      return { detected: false, upcoming: false };
    }

    const quantities = salesHistory.map(s => s.quantity || s.quantity_sold || 0);
    const average = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const stdDev = Math.sqrt(
      quantities.reduce((sum, q) => sum + Math.pow(q - average, 2), 0) / quantities.length
    );

    // Détecter les pics (ventes > moyenne + 2 écarts-types)
    const peaks = quantities.filter(q => q > average + (2 * stdDev));

    // Vérifier s'il y a un pic récent (derniers 30 jours)
    const recentSales = salesHistory
      .filter(s => {
        const saleDate = new Date(s.date || s.sale_date);
        const daysAgo = (new Date() - saleDate) / (1000 * 60 * 60 * 24);
        return daysAgo <= 30;
      })
      .map(s => s.quantity || s.quantity_sold || 0);

    const recentAverage = recentSales.length > 0
      ? recentSales.reduce((sum, q) => sum + q, 0) / recentSales.length
      : 0;

    const upcoming = recentAverage > average * 1.3; // +30% dans les 30 derniers jours

    return {
      detected: peaks.length > 0,
      upcoming,
      peakCount: peaks.length
    };
  }

  /**
   * Génère un raisonnement lisible pour la suggestion
   * @private
   */
  generateReasoning(factors, adjustments, suggestedMultiplier) {
    const parts = [];

    if (adjustments.length > 0) {
      parts.push(`Ajustements détectés : ${adjustments.join(', ')}.`);
    }

    if (factors.seasonality.detected) {
      parts.push(`Saisonnalité : ${factors.seasonality.isPeakSeason ? 'saison haute' : 'saison basse'} détectée.`);
    }

    if (factors.trend.detected) {
      parts.push(`Tendance : ${factors.trend.direction === 'increasing' ? 'haussière' : 'baissière'} (${factors.trend.changePercent}%).`);
    }

    if (factors.volatility.high) {
      parts.push(`Volatilité élevée : ajustement pour plus de sécurité.`);
    }

    if (parts.length === 0) {
      return `Multiplicateur suggéré : ${suggestedMultiplier.toFixed(1)}. Produit stable, multiplicateur par défaut approprié.`;
    }

    return `Multiplicateur suggéré : ${suggestedMultiplier.toFixed(1)}. ${parts.join(' ')}`;
  }

  /**
   * Applique le multiplicateur suggéré (nécessite confirmation)
   * @param {string} sku - SKU du produit
   * @param {number} multiplier - Multiplicateur à appliquer
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async applySuggestedMultiplier(sku, multiplier) {
    try {
      // Utiliser l'API via apiAdapter au lieu d'importer supabase directement
      const api = await import('../../services/apiAdapter');
      
      const result = await api.default.updateProductMultiplier(sku, multiplier);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: `Multiplicateur mis à jour à ${multiplier.toFixed(1)}`
        };
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('❌ Erreur application multiplicateur ML:', error);
      return {
        success: false,
        error: error?.message || error?.toString() || 'Erreur inconnue'
      };
    }
  }
}

// Export d'une instance singleton
export const multiplierOptimizer = new MultiplierOptimizer();

