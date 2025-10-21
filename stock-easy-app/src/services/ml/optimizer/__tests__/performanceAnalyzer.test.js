import { describe, it, expect } from 'vitest';
import { PerformanceAnalyzer } from '../performanceAnalyzer';

describe('PerformanceAnalyzer', () => {
  it('devrait créer une instance', () => {
    const analyzer = new PerformanceAnalyzer();
    expect(analyzer).toBeDefined();
  });

  it('devrait analyser la performance d\'un produit', async () => {
    const analyzer = new PerformanceAnalyzer();
    
    const mockProduct = {
      sku: 'TEST-001',
      stock: 50,
      salesPerDay: 5,
      buyPrice: 10,
      sellPrice: 15
    };
    
    const performance = await analyzer.analyzeProductPerformance(mockProduct, []);
    
    expect(performance.sku).toBe('TEST-001');
    expect(performance.stockoutRate).toBeGreaterThanOrEqual(0);
    expect(performance.overstockRate).toBeGreaterThanOrEqual(0);
    expect(performance.events.length).toBe(91); // 90 jours + aujourd'hui
  });

  it('devrait calculer les coûts correctement', async () => {
    const analyzer = new PerformanceAnalyzer();
    
    const mockProduct = {
      sku: 'TEST-001',
      stock: 10,
      salesPerDay: 20, // Plus de ventes que de stock = ruptures
      buyPrice: 10,
      sellPrice: 15
    };
    
    const performance = await analyzer.analyzeProductPerformance(mockProduct, []);
    
    expect(performance.stockoutCost).toBeGreaterThan(0);
    expect(performance.events.some(e => e.type === 'stockout')).toBe(true);
  });

  it('devrait générer un résumé de performance', async () => {
    const analyzer = new PerformanceAnalyzer();
    const performanceMap = new Map();
    
    performanceMap.set('TEST-001', {
      sku: 'TEST-001',
      stockoutRate: 0.1,
      overstockRate: 0.2,
      stockoutCost: 100,
      overstockCost: 50
    });
    
    const summary = analyzer.getPerformanceSummary(performanceMap);
    
    expect(summary.totalProducts).toBe(1);
    expect(summary.totalStockoutCost).toBe(100);
    expect(summary.totalOverstockCost).toBe(50);
    expect(summary.totalCost).toBe(150);
  });
});

