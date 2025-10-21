import { describe, it, expect } from 'vitest';
import { PerformanceAnalyzer } from '../performanceAnalyzer';
import { ReorderOptimizer } from '../reorderOptimizer';

describe('Performance Tests', () => {
  it('devrait analyser 100 produits en moins de 5 secondes', async () => {
    const analyzer = new PerformanceAnalyzer();
    
    // Créer 100 produits mock
    const products = Array(100).fill(null).map((_, i) => ({
      sku: `TEST-${String(i).padStart(3, '0')}`,
      stock: 50,
      salesPerDay: Math.random() * 10,
      buyPrice: 10,
      sellPrice: 15
    }));
    
    const startTime = Date.now();
    
    const performanceMap = new Map();
    for (const product of products) {
      const perf = await analyzer.analyzeProductPerformance(product, []);
      performanceMap.set(product.sku, perf);
    }
    
    const duration = Date.now() - startTime;
    
    expect(performanceMap.size).toBe(100);
    expect(duration).toBeLessThan(5000); // < 5 secondes
    
    console.log(`✅ Analysé ${products.length} produits en ${duration}ms`);
  }, 10000); // Timeout 10s

  it('devrait optimiser 100 produits en moins de 3 secondes', () => {
    const optimizer = new ReorderOptimizer();
    
    // Créer 100 produits avec performance
    const products = Array(100).fill(null).map((_, i) => ({
      sku: `TEST-${String(i).padStart(3, '0')}`,
      stock: 50,
      salesPerDay: 5,
      leadTimeDays: 10,
      reorderPoint: 60,
      securityStock: 10,
      buyPrice: 10,
      sellPrice: 15,
      multiplier: 1
    }));
    
    const performanceMap = new Map();
    products.forEach(p => {
      performanceMap.set(p.sku, {
        sku: p.sku,
        stockoutRate: Math.random() * 0.2,
        overstockRate: Math.random() * 0.3,
        avgCoverageTime: 12,
        stockoutCost: 100,
        overstockCost: 50,
        events: [],
        product: p
      });
    });
    
    const startTime = Date.now();
    const optimizations = optimizer.optimizeAllProducts(products, performanceMap);
    const duration = Date.now() - startTime;
    
    expect(optimizations.size).toBe(100);
    expect(duration).toBeLessThan(3000); // < 3 secondes
    
    console.log(`✅ Optimisé ${products.length} produits en ${duration}ms`);
  });
});

