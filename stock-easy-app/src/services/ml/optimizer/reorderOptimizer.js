/**
 * Optimiseur du point de commande basé sur l'historique de performance
 * @module services/ml/optimizer/reorderOptimizer
 */

/**
 * Paramètres optimisés
 * @typedef {Object} OptimizedParameters
 * @property {number} reorderPoint - Point de commande optimisé
 * @property {number} securityStock - Stock de sécurité optimisé (en jours)
 * @property {number} confidence - Score de confiance de l'optimisation (0-100)
 * @property {Object} reasoning - Explication des ajustements
 * @property {Object} costAnalysis - Analyse des coûts
 */

export class ReorderOptimizer {
  constructor(options = {}) {
    // Coûts par défaut
    this.stockoutCostMultiplier = options.stockoutCostMultiplier || 0.5; // 50% de la marge perdue
    this.holdingCostRate = options.holdingCostRate || 0.25; // 25% du prix d'achat par an
    
    // Seuils
    this.targetStockoutRate = options.targetStockoutRate || 0.05; // 5% max
    this.targetOverstockRate = options.targetOverstockRate || 0.2; // 20% max
    
    // Facteurs d'ajustement
    this.minSecurityStockDays = options.minSecurityStockDays || 3;
    this.maxSecurityStockDays = options.maxSecurityStockDays || 30;
  }

  /**
   * Optimise le point de commande pour un produit
   * @param {Object} product - Données du produit
   * @param {Object} performance - Performance historique du produit
   * @returns {OptimizedParameters}
   */
  optimizeReorderPoint(product, performance) {
    console.log(`🎯 Optimisation du point de commande pour ${product.sku}...`);
    
    // 1. Calculer les paramètres actuels
    const currentSettings = this.getCurrentSettings(product);
    
    // 2. Analyser la performance historique
    const performanceAnalysis = this.analyzePerformance(performance);
    
    // 3. Calculer le stock de sécurité optimal
    const optimalSecurityStock = this.calculateOptimalSafety(product, performance);
    
    // 4. Calculer le point de commande optimal
    const optimalReorderPoint = this.calculateOptimalReorder(
      product,
      optimalSecurityStock,
      performance
    );
    
    // 5. Calculer le score de confiance
    const confidence = this.calculateConfidence(performance);
    
    // 6. Analyser les économies potentielles
    const costAnalysis = this.estimateCostSavings(
      currentSettings,
      { reorderPoint: optimalReorderPoint, securityStock: optimalSecurityStock },
      performance
    );
    
    // 7. Générer l'explication
    const reasoning = this.generateReasoning(
      currentSettings,
      { reorderPoint: optimalReorderPoint, securityStock: optimalSecurityStock },
      performanceAnalysis
    );
    
    return {
      reorderPoint: Math.round(optimalReorderPoint),
      securityStock: Math.round(optimalSecurityStock),
      confidence: Math.round(confidence),
      reasoning,
      costAnalysis,
      currentSettings,
      performanceAnalysis
    };
  }

  /**
   * Récupère les paramètres actuels
   * @private
   */
  getCurrentSettings(product) {
    return {
      reorderPoint: product.reorderPoint || 0,
      securityStock: product.securityStock || 0,
      stock: product.stock || 0,
      salesPerDay: product.salesPerDay || 0,
      leadTimeDays: product.leadTimeDays || 0
    };
  }

  /**
   * Analyse la performance historique
   * @private
   */
  analyzePerformance(performance) {
    return {
      stockoutRate: performance.stockoutRate,
      overstockRate: performance.overstockRate,
      avgCoverageTime: performance.avgCoverageTime,
      hasFrequentStockouts: performance.stockoutRate > this.targetStockoutRate,
      hasExcessiveOverstock: performance.overstockRate > this.targetOverstockRate,
      isBalanced: performance.stockoutRate < this.targetStockoutRate && 
                  performance.overstockRate < this.targetOverstockRate
    };
  }

  /**
   * Calcule le stock de sécurité optimal
   * @param {Object} product
   * @param {Object} performance
   * @returns {number} Stock de sécurité en unités
   */
  calculateOptimalSafety(product, performance) {
    const { salesPerDay, leadTimeDays } = product;
    
    // Base : 20% du délai de livraison (comme actuellement)
    let securityDays = leadTimeDays * 0.2;
    
    // Ajustement 1 : Selon le taux de rupture
    if (performance.stockoutRate > this.targetStockoutRate) {
      // Trop de ruptures → augmenter la sécurité
      const stockoutAdjustment = (performance.stockoutRate / this.targetStockoutRate) - 1;
      securityDays *= (1 + stockoutAdjustment * 0.5); // +50% max
      console.log(`  ↑ Augmentation sécurité (+${(stockoutAdjustment * 50).toFixed(0)}%) : trop de ruptures`);
    }
    
    // Ajustement 2 : Selon le taux de surstock
    if (performance.overstockRate > this.targetOverstockRate) {
      // Trop de surstock → réduire la sécurité
      const overstockAdjustment = (performance.overstockRate / this.targetOverstockRate) - 1;
      securityDays *= (1 - overstockAdjustment * 0.3); // -30% max
      console.log(`  ↓ Réduction sécurité (-${(overstockAdjustment * 30).toFixed(0)}%) : trop de surstock`);
    }
    
    // Ajustement 3 : Variabilité de la demande
    const demandVariability = this.calculateDemandVariability(performance.events);
    if (demandVariability > 0.3) {
      // Forte variabilité → plus de sécurité
      securityDays *= (1 + demandVariability * 0.5);
      console.log(`  ↑ Augmentation sécurité : demande variable (${(demandVariability * 100).toFixed(0)}%)`);
    }
    
    // Contraintes min/max
    securityDays = Math.max(this.minSecurityStockDays, Math.min(this.maxSecurityStockDays, securityDays));
    
    // Convertir en unités
    const securityStock = securityDays * salesPerDay;
    
    console.log(`  ✓ Stock de sécurité optimisé : ${Math.round(securityStock)} unités (${securityDays.toFixed(1)} jours)`);
    
    return securityStock;
  }

  /**
   * Calcule le point de commande optimal
   * @private
   */
  calculateOptimalReorder(product, securityStock, performance) {
    const { salesPerDay, leadTimeDays, multiplier = 1 } = product;
    
    // Ventes ajustées pendant le délai de livraison
    const adjustedSales = salesPerDay * multiplier;
    const demandDuringLeadTime = adjustedSales * leadTimeDays;
    
    // Point de commande = demande pendant délai + stock de sécurité
    let reorderPoint = demandDuringLeadTime + securityStock;
    
    // Ajustement selon la fiabilité du fournisseur
    const supplierReliability = this.estimateSupplierReliability(performance);
    if (supplierReliability < 0.9) {
      // Fournisseur peu fiable → augmenter le point de commande
      const reliabilityAdjustment = (1 - supplierReliability) * 0.5;
      reorderPoint *= (1 + reliabilityAdjustment);
      console.log(`  ↑ Ajustement fiabilité fournisseur : +${(reliabilityAdjustment * 100).toFixed(0)}%`);
    }
    
    console.log(`  ✓ Point de commande optimisé : ${Math.round(reorderPoint)} unités`);
    
    return reorderPoint;
  }

  /**
   * Calcule la variabilité de la demande
   * @private
   */
  calculateDemandVariability(events) {
    if (!events || events.length === 0) return 0;
    
    const demands = events.map(e => e.demandLevel);
    const avgDemand = demands.reduce((a, b) => a + b, 0) / demands.length;
    
    if (avgDemand === 0) return 0;
    
    const variance = demands.reduce((sum, d) => sum + Math.pow(d - avgDemand, 2), 0) / demands.length;
    const stdDev = Math.sqrt(variance);
    
    // Coefficient de variation
    return stdDev / avgDemand;
  }

  /**
   * Estime la fiabilité du fournisseur
   * @private
   */
  estimateSupplierReliability(performance) {
    // Basé sur les ruptures : plus de ruptures = moins fiable
    // Taux de fiabilité = 1 - (taux de rupture * 2)
    return Math.max(0.5, 1 - (performance.stockoutRate * 2));
  }

  /**
   * Calcule le score de confiance de l'optimisation
   * @private
   */
  calculateConfidence(performance) {
    let confidence = 100;
    
    // Réduire si peu de données
    if (performance.events.length < 30) {
      confidence -= 30;
    } else if (performance.events.length < 60) {
      confidence -= 15;
    }
    
    // Réduire si performance très variable
    const variability = this.calculateDemandVariability(performance.events);
    if (variability > 0.5) {
      confidence -= 20;
    } else if (variability > 0.3) {
      confidence -= 10;
    }
    
    // Augmenter si performance équilibrée
    if (performance.stockoutRate < 0.05 && performance.overstockRate < 0.2) {
      confidence += 10;
    }
    
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Estime les économies potentielles
   * @param {Object} currentSettings
   * @param {Object} optimizedSettings
   * @param {Object} performance
   * @returns {Object}
   */
  estimateCostSavings(currentSettings, optimizedSettings, performance) {
    const product = performance.product;
    
    // Coût actuel
    const currentTotalCost = performance.stockoutCost + performance.overstockCost;
    
    // Estimer les nouveaux coûts avec paramètres optimisés
    const optimizedStockoutCost = this.estimateStockoutCostWithSettings(
      optimizedSettings,
      product,
      performance
    );
    
    const optimizedOverstockCost = this.estimateOverstockCostWithSettings(
      optimizedSettings,
      product,
      performance
    );
    
    const optimizedTotalCost = optimizedStockoutCost + optimizedOverstockCost;
    
    // Économies
    const savingsPerYear = Math.max(0, currentTotalCost - optimizedTotalCost);
    const savingsPercent = currentTotalCost > 0 ? (savingsPerYear / currentTotalCost) * 100 : 0;
    
    // ROI (si on considère un coût d'implémentation)
    const implementationCost = 0; // Gratuit car automatisé
    const roi = implementationCost > 0 ? (savingsPerYear / implementationCost) * 100 : Infinity;
    
    return {
      current: {
        stockoutCost: Math.round(performance.stockoutCost),
        overstockCost: Math.round(performance.overstockCost),
        totalCost: Math.round(currentTotalCost)
      },
      optimized: {
        stockoutCost: Math.round(optimizedStockoutCost),
        overstockCost: Math.round(optimizedOverstockCost),
        totalCost: Math.round(optimizedTotalCost)
      },
      savings: {
        perYear: Math.round(savingsPerYear),
        percent: savingsPercent.toFixed(1),
        roi: roi === Infinity ? '∞' : roi.toFixed(0)
      }
    };
  }

  /**
   * Estime le coût de rupture avec les nouveaux paramètres
   * @private
   */
  estimateStockoutCostWithSettings(settings, product, performance) {
    // Proportion de réduction des ruptures
    const currentStockoutRate = performance.stockoutRate;
    const improvement = Math.min(0.8, (settings.reorderPoint - performance.product.reorderPoint) / performance.product.reorderPoint);
    
    const newStockoutRate = Math.max(0, currentStockoutRate * (1 - improvement));
    
    return newStockoutRate * (product.salesPerDay * (product.sellPrice - product.buyPrice)) * 365;
  }

  /**
   * Estime le coût de surstock avec les nouveaux paramètres
   * @private
   */
  estimateOverstockCostWithSettings(settings, product, performance) {
    // Capital immobilisé moyen
    const avgStock = settings.reorderPoint / 2;
    const holdingCost = avgStock * product.buyPrice * this.holdingCostRate;
    
    return holdingCost;
  }

  /**
   * Génère l'explication des ajustements
   * @private
   */
  generateReasoning(current, optimized, analysis) {
    const reasons = [];
    
    // Changement du point de commande
    const reorderChange = optimized.reorderPoint - current.reorderPoint;
    const reorderChangePercent = ((reorderChange / current.reorderPoint) * 100).toFixed(0);
    
    if (Math.abs(reorderChange) > 5) {
      if (reorderChange > 0) {
        reasons.push({
          type: 'increase',
          parameter: 'reorderPoint',
          change: `+${Math.round(reorderChange)} unités (+${reorderChangePercent}%)`,
          reason: analysis.hasFrequentStockouts ? 
            'Trop de ruptures de stock détectées' : 
            'Amélioration de la couverture'
        });
      } else {
        reasons.push({
          type: 'decrease',
          parameter: 'reorderPoint',
          change: `${Math.round(reorderChange)} unités (${reorderChangePercent}%)`,
          reason: analysis.hasExcessiveOverstock ? 
            'Réduction du surstock excessif' : 
            'Optimisation du capital immobilisé'
        });
      }
    }
    
    // Changement du stock de sécurité
    const safetyChange = optimized.securityStock - current.securityStock;
    if (Math.abs(safetyChange) > 5) {
      reasons.push({
        type: safetyChange > 0 ? 'increase' : 'decrease',
        parameter: 'securityStock',
        change: `${safetyChange > 0 ? '+' : ''}${Math.round(safetyChange)} unités`,
        reason: safetyChange > 0 ? 
          'Protection contre la variabilité de la demande' : 
          'Réduction des coûts de stockage'
      });
    }
    
    // Si tout est optimal
    if (reasons.length === 0 && analysis.isBalanced) {
      reasons.push({
        type: 'optimal',
        parameter: 'all',
        change: 'Aucun changement',
        reason: 'Les paramètres actuels sont déjà optimaux'
      });
    }
    
    return reasons;
  }

  /**
   * Optimise tous les produits en batch
   * @param {Array} products
   * @param {Map} performanceMap
   * @returns {Map<string, OptimizedParameters>}
   */
  optimizeAllProducts(products, performanceMap) {
    console.log(`🎯 Optimisation de ${products.length} produits...`);
    
    const optimizations = new Map();
    
    for (const product of products) {
      const performance = performanceMap.get(product.sku);
      
      if (!performance) {
        console.warn(`⚠️ Pas de données de performance pour ${product.sku}`);
        continue;
      }
      
      try {
        const optimized = this.optimizeReorderPoint(product, performance);
        optimizations.set(product.sku, optimized);
      } catch (error) {
        console.error(`❌ Erreur optimisation ${product.sku}:`, error);
      }
    }
    
    console.log(`✅ ${optimizations.size} produits optimisés`);
    
    return optimizations;
  }
}

/**
 * Fonction helper pour optimiser un seul produit
 * @param {Object} product
 * @param {Object} performance
 * @returns {OptimizedParameters}
 */
export function optimizeSingleProduct(product, performance) {
  const optimizer = new ReorderOptimizer();
  return optimizer.optimizeReorderPoint(product, performance);
}

