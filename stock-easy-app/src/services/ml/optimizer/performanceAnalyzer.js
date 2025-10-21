/**
 * Analyseur de performance des stocks
 * Collecte et analyse l'historique pour optimiser les points de commande
 * @module services/ml/optimizer/performanceAnalyzer
 */

import { getAllData } from '../../apiService';

/**
 * Événement de performance du stock
 * @typedef {Object} StockEvent
 * @property {string} date - Date de l'événement
 * @property {string} type - 'stockout' | 'overstock' | 'optimal'
 * @property {number} stockLevel - Niveau de stock à ce moment
 * @property {number} demandLevel - Demande à ce moment
 * @property {number} daysOfStock - Jours de couverture
 */

/**
 * Performance d'un produit
 * @typedef {Object} ProductPerformance
 * @property {string} sku
 * @property {number} stockoutRate - Taux de rupture (0-1)
 * @property {number} overstockRate - Taux de surstock (0-1)
 * @property {number} avgCoverageTime - Temps de couverture moyen (jours)
 * @property {number} stockoutCost - Coût estimé des ruptures
 * @property {number} overstockCost - Coût estimé du surstock
 * @property {StockEvent[]} events - Historique des événements
 */

export class PerformanceAnalyzer {
  constructor() {
    this.overstockThreshold = 90; // Jours par défaut
  }

  /**
   * Collecte l'historique de performance pour tous les produits
   * @returns {Promise<Map<string, ProductPerformance>>} Map SKU -> Performance
   */
  async collectPerformanceHistory() {
    try {
      console.log('📊 Collecte de l\'historique de performance...');
      
      const allData = await getAllData();
      const performanceMap = new Map();
      
      // Analyser chaque produit
      for (const product of allData.products) {
        const performance = await this.analyzeProductPerformance(product, allData.orders);
        performanceMap.set(product.sku, performance);
      }
      
      console.log(`✅ Performance analysée pour ${performanceMap.size} produits`);
      return performanceMap;
      
    } catch (error) {
      console.error('❌ Erreur lors de la collecte de performance:', error);
      throw error;
    }
  }

  /**
   * Analyse la performance d'un produit spécifique
   * @param {Object} product - Données du produit
   * @param {Array} orders - Historique des commandes
   * @returns {ProductPerformance}
   */
  async analyzeProductPerformance(product, orders = []) {
    // Simuler l'historique sur 90 jours
    const events = this.generateHistoricalEvents(product, orders);
    
    // Calculer les métriques
    const stockouts = events.filter(e => e.type === 'stockout');
    const overstocks = events.filter(e => e.type === 'overstock');
    const optimal = events.filter(e => e.type === 'optimal');
    
    const stockoutRate = stockouts.length / events.length;
    const overstockRate = overstocks.length / events.length;
    
    // Temps de couverture moyen
    const avgCoverageTime = events.reduce((sum, e) => sum + e.daysOfStock, 0) / events.length;
    
    // Coûts estimés
    const stockoutCost = this.calculateStockoutCost(stockouts, product);
    const overstockCost = this.calculateOverstockCost(overstocks, product);
    
    return {
      sku: product.sku,
      stockoutRate,
      overstockRate,
      avgCoverageTime,
      stockoutCost,
      overstockCost,
      optimalRate: optimal.length / events.length,
      events,
      product // Garder référence au produit
    };
  }

  /**
   * Génère l'historique simulé des événements de stock
   * @private
   */
  generateHistoricalEvents(product, orders) {
    const events = [];
    const today = new Date();
    
    // Paramètres de simulation
    let currentStock = product.stock || 0;
    const dailySales = product.salesPerDay || 1;
    const salesVariance = dailySales * 0.3; // 30% de variation
    
    // Générer 90 jours d'historique
    for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      
      // Ventes quotidiennes avec variation aléatoire
      const daySales = Math.max(0, Math.round(
        dailySales + (Math.random() - 0.5) * salesVariance
      ));
      
      // Mettre à jour le stock
      currentStock -= daySales;
      
      // Vérifier si une commande arrive ce jour
      const orderArriving = this.checkOrderArrival(date, orders, product.sku);
      if (orderArriving) {
        currentStock += orderArriving.quantity;
      }
      
      // Calculer jours de stock restants
      const daysOfStock = currentStock / (dailySales || 1);
      
      // Déterminer le type d'événement
      let eventType = 'optimal';
      if (currentStock <= 0) {
        eventType = 'stockout';
        currentStock = 0; // Pas de stock négatif
      } else if (daysOfStock > this.overstockThreshold) {
        eventType = 'overstock';
      }
      
      events.push({
        date: date.toISOString().split('T')[0],
        type: eventType,
        stockLevel: currentStock,
        demandLevel: daySales,
        daysOfStock: daysOfStock,
        orderReceived: orderArriving ? orderArriving.quantity : 0
      });
    }
    
    return events;
  }

  /**
   * Vérifie si une commande arrive à cette date
   * @private
   */
  checkOrderArrival(date, orders, sku) {
    // Simplification : on suppose que les commandes arrivent régulièrement
    // Dans une vraie app, on utiliserait l'historique réel des commandes
    
    // Simuler une commande tous les leadTimeDays
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Ordre arrive environ tous les 30 jours (simplifié)
    if (dayOfYear % 30 === 0) {
      return {
        quantity: Math.round(Math.random() * 50 + 20), // 20-70 unités
        sku
      };
    }
    
    return null;
  }

  /**
   * Calcule le coût des ruptures de stock
   * @private
   */
  calculateStockoutCost(stockouts, product) {
    // Coût = ventes perdues * marge
    const lostSalesPerDay = product.salesPerDay || 0;
    const margin = (product.sellPrice - product.buyPrice) || 0;
    
    return stockouts.reduce((total, event) => {
      // Supposer 1 jour de rupture par événement
      return total + (lostSalesPerDay * margin);
    }, 0);
  }

  /**
   * Calcule le coût du surstock
   * @private
   */
  calculateOverstockCost(overstocks, product) {
    // Coût = capital immobilisé * taux de holding (25% annuel)
    const holdingCostRate = 0.25 / 365; // Par jour
    
    return overstocks.reduce((total, event) => {
      const excessStock = event.stockLevel - (product.salesPerDay * this.overstockThreshold);
      const holdingCost = excessStock * product.buyPrice * holdingCostRate;
      return total + holdingCost;
    }, 0);
  }

  /**
   * Obtient un résumé des performances
   * @param {Map<string, ProductPerformance>} performanceMap
   * @returns {Object}
   */
  getPerformanceSummary(performanceMap) {
    const performances = Array.from(performanceMap.values());
    
    const totalStockoutCost = performances.reduce((sum, p) => sum + p.stockoutCost, 0);
    const totalOverstockCost = performances.reduce((sum, p) => sum + p.overstockCost, 0);
    const avgStockoutRate = performances.reduce((sum, p) => sum + p.stockoutRate, 0) / performances.length;
    const avgOverstockRate = performances.reduce((sum, p) => sum + p.overstockRate, 0) / performances.length;
    
    return {
      totalProducts: performances.length,
      totalStockoutCost: Math.round(totalStockoutCost),
      totalOverstockCost: Math.round(totalOverstockCost),
      totalCost: Math.round(totalStockoutCost + totalOverstockCost),
      avgStockoutRate: (avgStockoutRate * 100).toFixed(1),
      avgOverstockRate: (avgOverstockRate * 100).toFixed(1),
      productsWithStockouts: performances.filter(p => p.stockoutRate > 0.05).length,
      productsWithOverstock: performances.filter(p => p.overstockRate > 0.3).length
    };
  }

  /**
   * Identifie les produits les plus problématiques
   * @param {Map<string, ProductPerformance>} performanceMap
   * @param {number} topN - Nombre de produits à retourner
   * @returns {Array}
   */
  getProblematicProducts(performanceMap, topN = 5) {
    const performances = Array.from(performanceMap.values());
    
    // Calculer un score de problème (plus élevé = plus problématique)
    const scored = performances.map(p => ({
      ...p,
      problemScore: (p.stockoutRate * 100) + (p.overstockRate * 50) + 
                    (p.stockoutCost + p.overstockCost) / 100
    }));
    
    // Trier par score décroissant
    scored.sort((a, b) => b.problemScore - a.problemScore);
    
    return scored.slice(0, topN);
  }
}

/**
 * Fonction helper pour obtenir la performance d'un produit
 * @param {string} sku
 * @returns {Promise<ProductPerformance>}
 */
export async function getProductPerformance(sku) {
  const analyzer = new PerformanceAnalyzer();
  const allData = await getAllData();
  const product = allData.products.find(p => p.sku === sku);
  
  if (!product) {
    throw new Error(`Produit ${sku} introuvable`);
  }
  
  return analyzer.analyzeProductPerformance(product, allData.orders);
}

