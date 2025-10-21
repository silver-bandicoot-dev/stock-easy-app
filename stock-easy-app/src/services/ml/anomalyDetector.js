/**
 * Détecteur d'anomalies en temps réel pour les stocks
 * @module services/ml/anomalyDetector
 */

import { collectSalesHistory } from './dataCollector';

/**
 * Types d'anomalies
 */
export const ANOMALY_TYPES = {
  DEMAND_SPIKE: 'demand-spike',        // Pic de ventes inattendu
  DEMAND_DROP: 'demand-drop',          // Chute brutale des ventes
  SUPPLIER_DELAY: 'supplier-delay',    // Délai fournisseur anormal
  SUPPLIER_QUALITY: 'supplier-quality', // Problème qualité (items endommagés)
  STOCK_DISCREPANCY: 'stock-discrepancy' // Écart inventaire
};

/**
 * Niveaux de sévérité
 */
export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',  // Action immédiate requise
  HIGH: 'high',          // Attention urgente
  MEDIUM: 'medium',      // À surveiller
  LOW: 'low'            // Information
};

export class AnomalyDetector {
  constructor(options = {}) {
    this.zScoreThreshold = options.zScoreThreshold || 2.5; // Seuil Z-score pour anomalie
    this.supplierDelayThreshold = options.supplierDelayThreshold || 0.2; // 20% de dépassement
    this.qualityThreshold = options.qualityThreshold || 0.1; // 10% d'items endommagés
    this.minDataPoints = options.minDataPoints || 14; // Minimum 14 jours de données
  }

  /**
   * Détecte toutes les anomalies pour un ensemble de produits
   * @param {Array} products - Liste des produits
   * @param {Array} orders - Historique des commandes
   * @returns {Promise<Array>} Liste d'anomalies
   */
  async detectAllAnomalies(products, orders = []) {
    console.log('🔍 Détection des anomalies en cours...');
    
    const anomalies = [];
    
    try {
      // Collecter l'historique des ventes
      const salesHistory = await collectSalesHistory();
      
      // Pour chaque produit, détecter les anomalies
      for (const product of products) {
        // Anomalies de demande
        const demandAnomalies = await this.detectDemandAnomalies(product, salesHistory);
        anomalies.push(...demandAnomalies);
        
        // Anomalies fournisseur
        const supplierAnomalies = this.detectSupplierAnomalies(product, orders);
        anomalies.push(...supplierAnomalies);
      }
      
      // Trier par sévérité et date
      anomalies.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.date) - new Date(a.date);
      });
      
      console.log(`✅ ${anomalies.length} anomalies détectées`);
      return anomalies;
      
    } catch (error) {
      console.error('❌ Erreur lors de la détection d\'anomalies:', error);
      throw error;
    }
  }

  /**
   * Détecte les anomalies de demande (pics/chutes) avec Z-score
   * @param {Object} product - Produit
   * @param {Array} salesHistory - Historique des ventes
   * @returns {Array} Anomalies de demande
   */
  async detectDemandAnomalies(product, salesHistory) {
    const anomalies = [];
    
    // Filtrer les ventes pour ce produit
    const productSales = salesHistory.filter(s => s.sku === product.sku);
    
    if (productSales.length < this.minDataPoints) {
      return []; // Pas assez de données
    }
    
    // Calculer moyenne et écart-type
    const quantities = productSales.map(s => s.quantity);
    const stats = this.calculateStats(quantities);
    
    // Analyser les 7 derniers jours
    const recentSales = productSales.slice(-7);
    
    recentSales.forEach((sale, index) => {
      // Calculer le Z-score
      const zScore = (sale.quantity - stats.mean) / stats.stdDev;
      
      // Pic de ventes
      if (zScore > this.zScoreThreshold) {
        const expectedSales = Math.round(stats.mean);
        const actualSales = sale.quantity;
        const percentageIncrease = ((actualSales - expectedSales) / expectedSales * 100).toFixed(0);
        
        anomalies.push({
          id: `spike-${product.sku}-${sale.date}`,
          type: ANOMALY_TYPES.DEMAND_SPIKE,
          severity: zScore > 3.5 ? SEVERITY_LEVELS.CRITICAL : SEVERITY_LEVELS.HIGH,
          sku: product.sku,
          productName: product.name,
          date: sale.date,
          zScore: zScore.toFixed(2),
          message: `Pic de ventes inattendu pour ${product.name}`,
          details: `Ventes attendues: ${expectedSales}/jour, Ventes réelles: ${actualSales}/jour (+${percentageIncrease}%)`,
          metrics: {
            expected: expectedSales,
            actual: actualSales,
            increase: percentageIncrease
          },
          recommendations: this.generateSpikeRecommendations(product, actualSales, expectedSales)
        });
      }
      
      // Chute de ventes
      if (zScore < -this.zScoreThreshold) {
        const expectedSales = Math.round(stats.mean);
        const actualSales = sale.quantity;
        const percentageDecrease = ((expectedSales - actualSales) / expectedSales * 100).toFixed(0);
        
        anomalies.push({
          id: `drop-${product.sku}-${sale.date}`,
          type: ANOMALY_TYPES.DEMAND_DROP,
          severity: zScore < -3.5 ? SEVERITY_LEVELS.HIGH : SEVERITY_LEVELS.MEDIUM,
          sku: product.sku,
          productName: product.name,
          date: sale.date,
          zScore: zScore.toFixed(2),
          message: `Chute brutale des ventes pour ${product.name}`,
          details: `Ventes attendues: ${expectedSales}/jour, Ventes réelles: ${actualSales}/jour (-${percentageDecrease}%)`,
          metrics: {
            expected: expectedSales,
            actual: actualSales,
            decrease: percentageDecrease
          },
          recommendations: this.generateDropRecommendations(product, actualSales, expectedSales)
        });
      }
    });
    
    return anomalies;
  }

  /**
   * Détecte les anomalies fournisseur
   * @param {Object} product - Produit
   * @param {Array} orders - Historique des commandes
   * @returns {Array} Anomalies fournisseur
   */
  detectSupplierAnomalies(product, orders) {
    const anomalies = [];
    
    // Filtrer les commandes pour ce produit
    const productOrders = orders.filter(order => 
      order.items && order.items.some(item => item.sku === product.sku)
    );
    
    if (productOrders.length === 0) return [];
    
    productOrders.forEach(order => {
      const item = order.items.find(i => i.sku === product.sku);
      if (!item) return;
      
      // Anomalie 1: Délai de livraison anormal
      if (order.status === 'received' && order.receivedDate && order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const receivedDate = new Date(order.receivedDate);
        const actualDelay = Math.floor((receivedDate - orderDate) / (1000 * 60 * 60 * 24));
        const expectedDelay = product.leadTimeDays || 7;
        
        const delayDifference = actualDelay - expectedDelay;
        const delayPercent = (delayDifference / expectedDelay);
        
        if (delayPercent > this.supplierDelayThreshold) {
          anomalies.push({
            id: `delay-${product.sku}-${order.id}`,
            type: ANOMALY_TYPES.SUPPLIER_DELAY,
            severity: delayPercent > 0.5 ? SEVERITY_LEVELS.CRITICAL : SEVERITY_LEVELS.HIGH,
            sku: product.sku,
            productName: product.name,
            date: order.receivedDate,
            orderId: order.id,
            supplier: order.supplier || product.supplier,
            message: `Délai de livraison anormal pour ${product.name}`,
            details: `Délai attendu: ${expectedDelay} jours, Délai réel: ${actualDelay} jours (+${Math.round(delayPercent * 100)}%)`,
            metrics: {
              expected: expectedDelay,
              actual: actualDelay,
              difference: delayDifference
            },
            recommendations: this.generateDelayRecommendations(product, delayDifference)
          });
        }
      }
      
      // Anomalie 2: Problème de qualité (items endommagés)
      if (item.damagedQuantity && item.receivedQuantity) {
        const damageRate = item.damagedQuantity / (item.receivedQuantity + item.damagedQuantity);
        
        if (damageRate > this.qualityThreshold) {
          anomalies.push({
            id: `quality-${product.sku}-${order.id}`,
            type: ANOMALY_TYPES.SUPPLIER_QUALITY,
            severity: damageRate > 0.2 ? SEVERITY_LEVELS.CRITICAL : SEVERITY_LEVELS.HIGH,
            sku: product.sku,
            productName: product.name,
            date: order.receivedDate || order.createdAt,
            orderId: order.id,
            supplier: order.supplier || product.supplier,
            message: `Taux élevé d'items endommagés pour ${product.name}`,
            details: `${item.damagedQuantity} unités endommagées sur ${item.receivedQuantity + item.damagedQuantity} reçues (${(damageRate * 100).toFixed(0)}%)`,
            metrics: {
              damaged: item.damagedQuantity,
              total: item.receivedQuantity + item.damagedQuantity,
              rate: damageRate
            },
            recommendations: this.generateQualityRecommendations(product, damageRate)
          });
        }
      }
    });
    
    return anomalies;
  }

  /**
   * Calcule moyenne et écart-type
   * @private
   */
  calculateStats(values) {
    if (!values || values.length === 0) {
      return { mean: 0, stdDev: 0 };
    }
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev };
  }

  /**
   * Génère des recommandations pour un pic de ventes
   * @private
   */
  generateSpikeRecommendations(product, actual, expected) {
    const recommendations = [];
    const surplus = actual - expected;
    
    recommendations.push({
      action: 'urgent_order',
      description: `Commander d'urgence ${Math.round(surplus * 7)} unités`,
      reason: 'Anticiper la demande élevée des 7 prochains jours'
    });
    
    recommendations.push({
      action: 'analyze_cause',
      description: 'Analyser la cause du pic',
      reason: 'Promotion en cours? Concurrent en rupture? Saisonnalité?'
    });
    
    if (surplus > expected) {
      recommendations.push({
        action: 'update_forecasts',
        description: 'Mettre à jour les prévisions ML',
        reason: 'Réentraîner le modèle avec ces nouvelles données'
      });
    }
    
    return recommendations;
  }

  /**
   * Génère des recommandations pour une chute de ventes
   * @private
   */
  generateDropRecommendations(product, actual, expected) {
    const recommendations = [];
    
    recommendations.push({
      action: 'investigate',
      description: 'Enquêter sur la cause de la chute',
      reason: 'Problème qualité? Nouveau concurrent? Prix trop élevé?'
    });
    
    recommendations.push({
      action: 'reduce_orders',
      description: 'Réduire les commandes prévues',
      reason: 'Éviter le surstock si la tendance persiste'
    });
    
    recommendations.push({
      action: 'check_reviews',
      description: 'Vérifier les avis clients',
      reason: 'Détecter d\'éventuels problèmes de satisfaction'
    });
    
    return recommendations;
  }

  /**
   * Génère des recommandations pour un délai fournisseur
   * @private
   */
  generateDelayRecommendations(product, delayDifference) {
    const recommendations = [];
    
    if (delayDifference > 7) {
      recommendations.push({
        action: 'find_alternative',
        description: 'Chercher un fournisseur alternatif',
        reason: 'Délais chroniquement longs affectent la disponibilité'
      });
    }
    
    recommendations.push({
      action: 'increase_safety',
      description: `Augmenter le stock de sécurité de ${Math.ceil(delayDifference * product.salesPerDay)} unités`,
      reason: 'Compenser les délais allongés du fournisseur'
    });
    
    recommendations.push({
      action: 'contact_supplier',
      description: 'Contacter le fournisseur',
      reason: 'Clarifier les délais et négocier une amélioration'
    });
    
    return recommendations;
  }

  /**
   * Génère des recommandations pour un problème qualité
   * @private
   */
  generateQualityRecommendations(product, damageRate) {
    const recommendations = [];
    
    recommendations.push({
      action: 'contact_supplier',
      description: 'Contacter le fournisseur immédiatement',
      reason: `Taux de dommages inacceptable (${(damageRate * 100).toFixed(0)}%)`
    });
    
    if (damageRate > 0.2) {
      recommendations.push({
        action: 'find_alternative',
        description: 'Chercher un fournisseur de remplacement',
        reason: 'Qualité chroniquement problématique'
      });
    }
    
    recommendations.push({
      action: 'adjust_orders',
      description: `Commander ${Math.ceil(damageRate * 100)}% supplémentaire`,
      reason: 'Compenser le taux de dommages'
    });
    
    return recommendations;
  }

  /**
   * Détecte les anomalies en temps réel (dernières 24h)
   * @param {Array} products
   * @param {Array} orders
   * @returns {Promise<Array>} Anomalies récentes
   */
  async detectRealTimeAnomalies(products, orders) {
    const allAnomalies = await this.detectAllAnomalies(products, orders);
    
    // Filtrer sur les dernières 24h
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentAnomalies = allAnomalies.filter(anomaly => 
      new Date(anomaly.date) >= yesterday
    );
    
    console.log(`🔴 ${recentAnomalies.length} anomalies détectées dans les dernières 24h`);
    
    return recentAnomalies;
  }

  /**
   * Obtient les statistiques d'anomalies
   * @param {Array} anomalies
   * @returns {Object}
   */
  getAnomalyStats(anomalies) {
    const byType = {};
    const bySeverity = {};
    
    anomalies.forEach(anomaly => {
      // Par type
      byType[anomaly.type] = (byType[anomaly.type] || 0) + 1;
      
      // Par sévérité
      bySeverity[anomaly.severity] = (bySeverity[anomaly.severity] || 0) + 1;
    });
    
    return {
      total: anomalies.length,
      byType,
      bySeverity,
      critical: bySeverity.critical || 0,
      high: bySeverity.high || 0,
      medium: bySeverity.medium || 0,
      low: bySeverity.low || 0
    };
  }

  /**
   * Filtre les anomalies par type
   * @param {Array} anomalies
   * @param {string} type
   * @returns {Array}
   */
  filterByType(anomalies, type) {
    return anomalies.filter(a => a.type === type);
  }

  /**
   * Filtre les anomalies par sévérité
   * @param {Array} anomalies
   * @param {string} severity
   * @returns {Array}
   */
  filterBySeverity(anomalies, severity) {
    return anomalies.filter(a => a.severity === severity);
  }

  /**
   * Obtient les anomalies pour un produit
   * @param {Array} anomalies
   * @param {string} sku
   * @returns {Array}
   */
  getAnomaliesForProduct(anomalies, sku) {
    return anomalies.filter(a => a.sku === sku);
  }
}

/**
 * Fonction helper pour détecter rapidement les anomalies d'un produit
 * @param {Object} product
 * @param {Array} salesHistory
 * @param {Array} orders
 * @returns {Promise<Array>}
 */
export async function detectProductAnomalies(product, salesHistory, orders = []) {
  const detector = new AnomalyDetector();
  
  const demandAnomalies = await detector.detectDemandAnomalies(product, salesHistory);
  const supplierAnomalies = detector.detectSupplierAnomalies(product, orders);
  
  return [...demandAnomalies, ...supplierAnomalies];
}

export default AnomalyDetector;

