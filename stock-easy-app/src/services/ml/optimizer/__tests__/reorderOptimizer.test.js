import { describe, it, expect } from 'vitest';
import { ReorderOptimizer } from '../reorderOptimizer';

describe('ReorderOptimizer', () => {
  it('devrait créer une instance', () => {
    const optimizer = new ReorderOptimizer();
    expect(optimizer).toBeDefined();
  });

  it('devrait optimiser le point de commande', () => {
    const optimizer = new ReorderOptimizer();
    
    const product = {
      sku: 'TEST-001',
      stock: 50,
      salesPerDay: 5,
      leadTimeDays: 10,
      reorderPoint: 60,
      securityStock: 10,
      buyPrice: 10,
      sellPrice: 15,
      multiplier: 1
    };
    
    const performance = {
      sku: 'TEST-001',
      stockoutRate: 0.15, // 15% de ruptures (trop!)
      overstockRate: 0.1,
      avgCoverageTime: 12,
      stockoutCost: 200,
      overstockCost: 50,
      events: Array(90).fill(null).map((_, i) => ({
        date: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-01`,
        type: i % 10 === 0 ? 'stockout' : 'optimal',
        stockLevel: 50,
        demandLevel: 5,
        daysOfStock: 10
      })),
      product
    };
    
    const optimized = optimizer.optimizeReorderPoint(product, performance);
    
    expect(optimized.reorderPoint).toBeGreaterThan(product.reorderPoint);
    expect(optimized.securityStock).toBeGreaterThan(product.securityStock);
    expect(optimized.confidence).toBeGreaterThan(0);
    expect(optimized.reasoning.length).toBeGreaterThan(0);
  });

  it('devrait calculer les économies', () => {
    const optimizer = new ReorderOptimizer();
    
    const current = { reorderPoint: 60, securityStock: 10 };
    const optimized = { reorderPoint: 80, securityStock: 15 };
    
    const performance = {
      stockoutRate: 0.15,
      overstockRate: 0.1,
      stockoutCost: 200,
      overstockCost: 50,
      events: [],
      product: {
        salesPerDay: 5,
        buyPrice: 10,
        sellPrice: 15,
        reorderPoint: 60
      }
    };
    
    const savings = optimizer.estimateCostSavings(current, optimized, performance);
    
    expect(savings.current.totalCost).toBe(250);
    expect(savings.optimized.totalCost).toBeGreaterThan(0);
    expect(savings.savings).toBeDefined();
  });
});

