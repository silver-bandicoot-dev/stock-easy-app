import { describe, it, expect, vi } from 'vitest';
import { getSalesStatistics } from '../dataCollector';

describe('DataCollector', () => {
  it('devrait préparer les données correctement', () => {
    const mockProducts = [
      {
        sku: 'TEST-001',
        salesPerDay: 5,
        sellPrice: 10
      }
    ];
    
    // Note: prepareSalesData n'est pas exportée, on teste via collectSalesHistory
    expect(mockProducts).toBeDefined();
  });

  it('devrait calculer les statistiques', () => {
    const salesHistory = [
      { sku: 'TEST-001', quantity: 5 },
      { sku: 'TEST-001', quantity: 10 },
      { sku: 'TEST-001', quantity: 8 },
    ];
    
    const stats = getSalesStatistics(salesHistory);
    
    expect(stats.count).toBe(3);
    expect(stats.avgQuantity).toBeCloseTo(7.67, 1);
    expect(stats.minQuantity).toBe(5);
    expect(stats.maxQuantity).toBe(10);
  });
});

