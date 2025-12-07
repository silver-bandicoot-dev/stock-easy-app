/**
 * Feature Store - Cache pré-calculé des features ML par produit
 * 
 * Stocke les caractéristiques calculées (saisonnalité, tendance, volatilité)
 * pour éviter les recalculs coûteux à chaque prédiction.
 * 
 * @module services/ml/featureStore
 */

import { mlCache } from './mlCache';

// ========================================
// CONFIGURATION
// ========================================

const FEATURE_STORE_KEY = 'ml_feature_store';
const FEATURE_TTL = 24 * 60 * 60 * 1000; // 24 heures
const VERSION = '1.0';

// ========================================
// FEATURE STORE CLASS
// ========================================

class FeatureStore {
  constructor() {
    this.features = new Map();
    this.metadata = {
      version: VERSION,
      lastUpdate: null,
      productsCount: 0
    };
    this.stats = {
      hits: 0,
      misses: 0,
      computations: 0
    };
    
    // Charger depuis localStorage au démarrage
    this._loadFromStorage();
  }

  // ========================================
  // STOCKAGE PERSISTANT
  // ========================================

  /**
   * Charge les features depuis localStorage
   * @private
   */
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(FEATURE_STORE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      // Vérifier la version
      if (data.version !== VERSION) {
        console.log('🔄 Feature Store: version mismatch, clearing cache');
        this._clearStorage();
        return;
      }

      // Vérifier l'expiration
      if (data.expiresAt && Date.now() > data.expiresAt) {
        console.log('⏰ Feature Store: cache expired, clearing');
        this._clearStorage();
        return;
      }

      // Restaurer les features
      if (data.features && typeof data.features === 'object') {
        this.features = new Map(Object.entries(data.features));
        this.metadata = data.metadata || this.metadata;
        console.log(`✅ Feature Store: ${this.features.size} features loaded from cache`);
      }
    } catch (error) {
      console.warn('⚠️ Feature Store: error loading from storage', error);
      this._clearStorage();
    }
  }

  /**
   * Sauvegarde les features dans localStorage
   * @private
   */
  _saveToStorage() {
    try {
      const data = {
        version: VERSION,
        expiresAt: Date.now() + FEATURE_TTL,
        metadata: this.metadata,
        features: Object.fromEntries(this.features)
      };
      localStorage.setItem(FEATURE_STORE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Feature Store: error saving to storage', error);
    }
  }

  /**
   * Vide le localStorage
   * @private
   */
  _clearStorage() {
    try {
      localStorage.removeItem(FEATURE_STORE_KEY);
    } catch (error) {
      // Ignorer les erreurs de storage
    }
  }

  // ========================================
  // CALCUL DES FEATURES
  // ========================================

  /**
   * Calcule les features pour un produit
   * @param {Object} product - Le produit
   * @param {Array} salesHistory - L'historique des ventes
   * @returns {Object} Features calculées
   */
  computeFeatures(product, salesHistory = []) {
    this.stats.computations++;
    
    const features = {
      sku: product.sku,
      computedAt: Date.now(),
      
      // Données de base
      basic: this._computeBasicFeatures(product),
      
      // Saisonnalité
      seasonality: this._computeSeasonality(salesHistory),
      
      // Tendance
      trend: this._computeTrend(salesHistory),
      
      // Volatilité
      volatility: this._computeVolatility(salesHistory),
      
      // Patterns
      patterns: this._computePatterns(salesHistory),
      
      // Qualité des données
      dataQuality: this._computeDataQuality(salesHistory)
    };

    return features;
  }

  /**
   * Calcule les features de base du produit
   * @private
   */
  _computeBasicFeatures(product) {
    return {
      hasStock: (product.stock || 0) > 0,
      stockLevel: product.stock || 0,
      avgSalesPerDay: product.salesPerDay || (product.sales30d ? product.sales30d / 30 : 0),
      price: product.sellPrice || product.prixVente || 0,
      leadTime: product.leadTimeDays || product.leadTime || 30,
      rotationRate: product.rotationRate || 0,
      category: product.category || 'unknown'
    };
  }

  /**
   * Calcule les facteurs de saisonnalité
   * @private
   */
  _computeSeasonality(salesHistory) {
    if (!salesHistory || salesHistory.length < 30) {
      return {
        detected: false,
        factors: {},
        peakMonths: [],
        lowMonths: []
      };
    }

    // Regrouper par mois
    const monthlyData = {};
    salesHistory.forEach(sale => {
      const month = new Date(sale.date).getMonth() + 1;
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, count: 0 };
      }
      monthlyData[month].total += sale.quantity || 0;
      monthlyData[month].count++;
    });

    // Calculer la moyenne globale
    const totalQuantity = Object.values(monthlyData).reduce((sum, m) => sum + m.total, 0);
    const totalCount = Object.values(monthlyData).reduce((sum, m) => sum + m.count, 0);
    const globalAvg = totalCount > 0 ? totalQuantity / totalCount : 0;

    // Calculer les facteurs par mois
    const factors = {};
    const peakMonths = [];
    const lowMonths = [];

    for (let month = 1; month <= 12; month++) {
      if (monthlyData[month] && monthlyData[month].count > 0) {
        const monthAvg = monthlyData[month].total / monthlyData[month].count;
        factors[month] = globalAvg > 0 ? monthAvg / globalAvg : 1;
        
        if (factors[month] > 1.3) peakMonths.push(month);
        if (factors[month] < 0.7) lowMonths.push(month);
      } else {
        factors[month] = 1;
      }
    }

    return {
      detected: peakMonths.length > 0 || lowMonths.length > 0,
      factors,
      peakMonths,
      lowMonths,
      currentMonthFactor: factors[new Date().getMonth() + 1] || 1
    };
  }

  /**
   * Calcule la tendance
   * @private
   */
  _computeTrend(salesHistory) {
    if (!salesHistory || salesHistory.length < 14) {
      return {
        detected: false,
        direction: 'stable',
        changePercent: 0,
        confidence: 0
      };
    }

    // Trier par date
    const sorted = [...salesHistory].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Diviser en deux moitiés
    const midPoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midPoint);
    const secondHalf = sorted.slice(midPoint);

    const avgFirst = firstHalf.reduce((sum, s) => sum + (s.quantity || 0), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, s) => sum + (s.quantity || 0), 0) / secondHalf.length;

    const changePercent = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

    let direction = 'stable';
    if (changePercent > 10) direction = 'increasing';
    else if (changePercent < -10) direction = 'decreasing';

    return {
      detected: Math.abs(changePercent) > 10,
      direction,
      changePercent: Math.round(changePercent * 10) / 10,
      avgFirst: Math.round(avgFirst * 10) / 10,
      avgSecond: Math.round(avgSecond * 10) / 10,
      confidence: Math.min(100, salesHistory.length)
    };
  }

  /**
   * Calcule la volatilité
   * @private
   */
  _computeVolatility(salesHistory) {
    if (!salesHistory || salesHistory.length < 7) {
      return {
        level: 'unknown',
        coefficientOfVariation: 0,
        std: 0,
        mean: 0
      };
    }

    const quantities = salesHistory.map(s => s.quantity || 0);
    const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    
    if (mean === 0) {
      return {
        level: 'zero',
        coefficientOfVariation: 0,
        std: 0,
        mean: 0
      };
    }

    const variance = quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / quantities.length;
    const std = Math.sqrt(variance);
    const cv = std / mean;

    let level = 'medium';
    if (cv > 0.5) level = 'high';
    else if (cv < 0.2) level = 'low';

    return {
      level,
      coefficientOfVariation: Math.round(cv * 100) / 100,
      std: Math.round(std * 10) / 10,
      mean: Math.round(mean * 10) / 10
    };
  }

  /**
   * Calcule les patterns (jour de la semaine, etc.)
   * @private
   */
  _computePatterns(salesHistory) {
    if (!salesHistory || salesHistory.length < 14) {
      return {
        dayOfWeekFactors: {},
        weekendFactor: 1,
        detected: false
      };
    }

    // Pattern par jour de la semaine
    const dayData = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    
    salesHistory.forEach(sale => {
      const day = new Date(sale.date).getDay();
      dayData[day].push(sale.quantity || 0);
    });

    const dayOfWeekFactors = {};
    const allAvg = salesHistory.reduce((sum, s) => sum + (s.quantity || 0), 0) / salesHistory.length;

    Object.entries(dayData).forEach(([day, quantities]) => {
      if (quantities.length > 0) {
        const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;
        dayOfWeekFactors[day] = allAvg > 0 ? Math.round((avg / allAvg) * 100) / 100 : 1;
      } else {
        dayOfWeekFactors[day] = 1;
      }
    });

    // Weekend factor
    const weekendAvg = ([...dayData[0], ...dayData[6]].reduce((a, b) => a + b, 0) || 0) / 
      (dayData[0].length + dayData[6].length || 1);
    const weekdayAvg = ([...dayData[1], ...dayData[2], ...dayData[3], ...dayData[4], ...dayData[5]]
      .reduce((a, b) => a + b, 0) || 0) / 
      (dayData[1].length + dayData[2].length + dayData[3].length + dayData[4].length + dayData[5].length || 1);

    const weekendFactor = weekdayAvg > 0 ? weekendAvg / weekdayAvg : 1;

    return {
      dayOfWeekFactors,
      weekendFactor: Math.round(weekendFactor * 100) / 100,
      detected: Math.abs(weekendFactor - 1) > 0.2
    };
  }

  /**
   * Calcule la qualité des données
   * @private
   */
  _computeDataQuality(salesHistory) {
    if (!salesHistory || salesHistory.length === 0) {
      return {
        score: 0,
        dataPoints: 0,
        issues: ['no_data']
      };
    }

    let score = 100;
    const issues = [];

    // Pénalité pour peu de données
    if (salesHistory.length < 30) {
      score -= 30;
      issues.push('insufficient_data');
    } else if (salesHistory.length < 60) {
      score -= 15;
      issues.push('limited_data');
    }

    // Pénalité pour beaucoup de zéros
    const zeroRate = salesHistory.filter(s => (s.quantity || 0) === 0).length / salesHistory.length;
    if (zeroRate > 0.5) {
      score -= 25;
      issues.push('high_zero_rate');
    } else if (zeroRate > 0.3) {
      score -= 10;
      issues.push('moderate_zero_rate');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      dataPoints: salesHistory.length,
      zeroRate: Math.round(zeroRate * 100),
      issues: issues.length > 0 ? issues : ['none']
    };
  }

  // ========================================
  // API PUBLIQUE
  // ========================================

  /**
   * Obtient les features pour un produit (depuis cache ou calcul)
   * @param {string} sku - SKU du produit
   * @param {Object} product - Le produit (pour calcul si nécessaire)
   * @param {Array} salesHistory - L'historique (pour calcul si nécessaire)
   * @returns {Object|null} Features ou null
   */
  get(sku, product = null, salesHistory = null) {
    const cached = this.features.get(sku);
    
    if (cached) {
      // Vérifier l'expiration
      if (Date.now() - cached.computedAt < FEATURE_TTL) {
        this.stats.hits++;
        return cached;
      }
    }
    
    this.stats.misses++;
    
    // Calculer si on a les données
    if (product && salesHistory) {
      return this.compute(sku, product, salesHistory);
    }
    
    return cached || null;
  }

  /**
   * Calcule et stocke les features pour un produit
   * @param {string} sku - SKU du produit
   * @param {Object} product - Le produit
   * @param {Array} salesHistory - L'historique des ventes
   * @returns {Object} Features calculées
   */
  compute(sku, product, salesHistory) {
    const features = this.computeFeatures(product, salesHistory);
    this.features.set(sku, features);
    this.metadata.lastUpdate = Date.now();
    this.metadata.productsCount = this.features.size;
    
    // Sauvegarder périodiquement (pas à chaque calcul pour performance)
    if (this.stats.computations % 10 === 0) {
      this._saveToStorage();
    }
    
    return features;
  }

  /**
   * Calcule les features pour tous les produits (batch)
   * @param {Array} products - Liste des produits
   * @param {Object} salesHistoryBySku - Historique groupé par SKU
   * @returns {Object} Résumé du calcul
   */
  computeAll(products, salesHistoryBySku = {}) {
    console.log(`🔄 Feature Store: computing features for ${products.length} products...`);
    const start = performance.now();
    
    let computed = 0;
    let skipped = 0;
    
    products.forEach(product => {
      const sku = product.sku;
      const history = salesHistoryBySku[sku] || [];
      
      // Vérifier si on a déjà des features récentes
      const existing = this.features.get(sku);
      if (existing && Date.now() - existing.computedAt < FEATURE_TTL / 2) {
        skipped++;
        return;
      }
      
      this.compute(sku, product, history);
      computed++;
    });
    
    const duration = performance.now() - start;
    this._saveToStorage();
    
    console.log(`✅ Feature Store: ${computed} computed, ${skipped} skipped in ${duration.toFixed(0)}ms`);
    
    return {
      computed,
      skipped,
      total: products.length,
      duration: Math.round(duration)
    };
  }

  /**
   * Invalide les features pour un SKU
   * @param {string} sku - SKU à invalider
   */
  invalidate(sku) {
    this.features.delete(sku);
  }

  /**
   * Vide complètement le Feature Store
   */
  clear() {
    this.features.clear();
    this.metadata.productsCount = 0;
    this._clearStorage();
    console.log('🗑️ Feature Store cleared');
  }

  /**
   * Obtient les statistiques du Feature Store
   * @returns {Object} Statistiques
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(1) : 0;
    
    return {
      size: this.features.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      computations: this.stats.computations,
      lastUpdate: this.metadata.lastUpdate,
      version: VERSION
    };
  }

  /**
   * Exporte toutes les features (pour debug)
   * @returns {Object} Toutes les features
   */
  export() {
    return {
      metadata: this.metadata,
      stats: this.getStats(),
      features: Object.fromEntries(this.features)
    };
  }
}

// ========================================
// EXPORT SINGLETON
// ========================================

export const featureStore = new FeatureStore();

export default featureStore;

