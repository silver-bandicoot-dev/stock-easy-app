/**
 * Analyseur de performance des stocks
 * Collecte et analyse l'historique pour optimiser les points de commande
 * @module services/ml/optimizer/performanceAnalyzer
 */

import { getAllData, getSalesHistory } from '../../apiAdapter';

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
      console.log("📊 Collecte de l'historique de performance...");

      const allData = await getAllData();
      const products = allData.products || [];
      const salesHistory = await getSalesHistory();

      const historyBySku = new Map();
      (salesHistory || []).forEach((row) => {
        if (!row?.sku) return;
        if (!historyBySku.has(row.sku)) {
          historyBySku.set(row.sku, []);
        }
        historyBySku.get(row.sku).push(row);
      });

      const performanceMap = new Map();

      for (const product of products) {
        const productHistory = historyBySku.get(product.sku) || [];
        const performance = this.analyzeProductPerformance(product, productHistory);
        performanceMap.set(product.sku, performance);
      }

      console.log(`✅ Performance analysée pour ${performanceMap.size} produits`);
      return performanceMap;
    } catch (error) {
      console.error('❌ Erreur lors de la collecte de performance:', error);
      throw error;
    }
  }

  analyzeProductPerformance(product, history) {
    const { events, avgDemand } = this.createEventsFromHistory(product, history);
    const stockouts = events.filter((event) => event.type === 'stockout');
    const overstocks = events.filter((event) => event.type === 'overstock');
    const eventCount = events.length || 1;

    const stockoutRate = stockouts.length / eventCount;
    const overstockRate = overstocks.length / eventCount;
    const avgCoverageTime =
      events.length > 0
        ? events.reduce((sum, event) => sum + event.daysOfStock, 0) / eventCount
        : (product.daysOfStock ?? 0);

    const stockoutCost = this.calculateStockoutCost(stockouts, product, avgDemand);
    const overstockCost = this.calculateOverstockCost(overstocks, product);

    return {
      sku: product.sku,
      stockoutRate,
      overstockRate,
      avgCoverageTime,
      stockoutCost,
      overstockCost,
      optimalRate: events.length > 0 ? 1 - stockoutRate - overstockRate : 0,
      events,
      product
    };
  }

  createEventsFromHistory(product, history) {
    const normalizedHistory =
      history && history.length > 0
        ? this.normalizeHistory(history)
        : this.buildFallbackHistory(product);

    const demandLevels = normalizedHistory.map((row) => Number(row.quantity) || 0);
    const stats = this.calculateDemandStats(demandLevels, product);
    const highThreshold = stats.avg + stats.std;
    const lowThreshold = Math.max(0, stats.avg - stats.std);

    const events = normalizedHistory.map((row) => {
      const demand = Number(row.quantity) || 0;
      let type = 'optimal';
      if (demand >= highThreshold && highThreshold > 0) {
        type = 'stockout';
      } else if (demand <= lowThreshold) {
        type = 'overstock';
      }

      return {
        date: row.saleDate,
        type,
        stockLevel: Number(product.stock ?? 0),
        demandLevel: demand,
        daysOfStock: stats.avg > 0 ? Number(product.stock ?? 0) / stats.avg : Number(product.stock ?? 0)
      };
    });

    return { events, avgDemand: stats.avg };
  }

  normalizeHistory(history) {
    return [...history]
      .map((row) => ({
        saleDate: row.saleDate,
        quantity: Number(row.quantity) || 0
      }))
      .sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate));
  }

  buildFallbackHistory(product) {
    const avg =
      Number(product.salesPerDay ?? 0) ||
      (Number(product.sales30d ?? 0) / 30) ||
      0;
    const days = Math.max(30, Number(product.leadTimeDays ?? 0) || 30);
    const today = new Date();
    const history = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      history.push({
        saleDate: date.toISOString().split('T')[0],
        quantity: avg
      });
    }

    return history;
  }

  calculateDemandStats(demandLevels, product) {
    if (!demandLevels || demandLevels.length === 0) {
      const fallback =
        Number(product.salesPerDay ?? 0) ||
        (Number(product.sales30d ?? 0) / 30) ||
        0;
      return { avg: fallback, std: 0 };
    }

    const avg = demandLevels.reduce((sum, value) => sum + value, 0) / demandLevels.length;
    const variance =
      demandLevels.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / demandLevels.length;
    const std = Math.sqrt(variance);
    return { avg, std };
  }

  calculateStockoutCost(stockouts, product, avgDemand) {
    if (!stockouts.length) return 0;
    const margin =
      Number(product.sellPrice ?? 0) - Number(product.buyPrice ?? 0);
    const effectiveMargin = Number.isFinite(margin) ? Math.max(margin, 0) : 0;
    const dailyDemand = avgDemand || Number(product.salesPerDay ?? 0) || 0;
    return stockouts.length * dailyDemand * effectiveMargin;
  }

  calculateOverstockCost(overstocks, product) {
    if (!overstocks.length) return 0;
    const holdingRate = Number(product.storageCostPerUnit ?? 0.01);
    const avgStock = Number(product.stock ?? 0);
    return overstocks.length * avgStock * holdingRate;
  }

  getPerformanceSummary(performanceMap) {
    const performances = Array.from(performanceMap.values());

    const totalStockoutCost = performances.reduce((sum, p) => sum + p.stockoutCost, 0);
    const totalOverstockCost = performances.reduce((sum, p) => sum + p.overstockCost, 0);
    const avgStockoutRate =
      performances.length > 0
        ? performances.reduce((sum, p) => sum + p.stockoutRate, 0) / performances.length
        : 0;
    const avgOverstockRate =
      performances.length > 0
        ? performances.reduce((sum, p) => sum + p.overstockRate, 0) / performances.length
        : 0;

    return {
      totalProducts: performances.length,
      totalStockoutCost: Math.round(totalStockoutCost),
      totalOverstockCost: Math.round(totalOverstockCost),
      totalCost: Math.round(totalStockoutCost + totalOverstockCost),
      avgStockoutRate: (avgStockoutRate * 100).toFixed(1),
      avgOverstockRate: (avgOverstockRate * 100).toFixed(1),
      productsWithStockouts: performances.filter((p) => p.stockoutRate > 0.05).length,
      productsWithOverstock: performances.filter((p) => p.overstockRate > 0.3).length
    };
  }

  getProblematicProducts(performanceMap, topN = 5) {
    const performances = Array.from(performanceMap.values());

    const scored = performances.map((p) => ({
      ...p,
      problemScore:
        p.stockoutRate * 100 +
        p.overstockRate * 50 +
        (p.stockoutCost + p.overstockCost) / 100
    }));

    scored.sort((a, b) => b.problemScore - a.problemScore);

    return scored.slice(0, topN);
  }
}

export async function getProductPerformance(sku) {
  const analyzer = new PerformanceAnalyzer();
  const allData = await getAllData();
  const product = allData.products.find((p) => p.sku === sku);

  if (!product) {
    throw new Error(`Produit ${sku} introuvable`);
  }

  const salesHistory = await getSalesHistory({ sku });
  return analyzer.analyzeProductPerformance(product, salesHistory);
}
