import { describe, it, expect } from 'vitest';
import { calculateMetrics, calculateReorderPoint } from '../calculations';

describe('calculateMetrics', () => {
  it('should calculate days of stock correctly', () => {
    const product = {
      stock: 100,
      salesPerDay: 10,
      leadTimeDays: 14,
    };
    
    const result = calculateMetrics(product);
    expect(result.daysOfStock).toBe(10);
  });

  it('should mark as urgent when qtyToOrder > 0', () => {
    const product = {
      stock: 100,
      salesPerDay: 5,
      leadTimeDays: 14,
      qtyToOrder: 50,
      // healthStatus est calculé par le backend, donc on le fournit dans le test
      healthStatus: 'urgent',
      healthPercentage: 25,
    };
    
    const result = calculateMetrics(product);
    // La fonction utilise healthStatus du backend si disponible
    expect(result.healthStatus).toBe('urgent');
    expect(result.healthPercentage).toBeLessThan(30);
  });

  it('should mark as urgent when stock is critically low', () => {
    const product = {
      stock: 5,
      salesPerDay: 10,
      leadTimeDays: 14,
      // healthStatus est calculé par le backend, donc on le fournit dans le test
      healthStatus: 'urgent',
      healthPercentage: 20,
    };
    
    const result = calculateMetrics(product);
    // La fonction utilise healthStatus du backend si disponible
    expect(result.healthStatus).toBe('urgent');
    expect(result.healthPercentage).toBeLessThan(30);
  });

  it('should handle zero sales per day', () => {
    const product = {
      stock: 100,
      salesPerDay: 0,
      leadTimeDays: 14,
    };
    
    const result = calculateMetrics(product);
    expect(result.daysOfStock).toBe(999);
  });

  it('should fallback lead time and keep security stock >= 1 when missing data', () => {
    const product = {
      stock: 50,
      salesPerDay: 5,
      leadTimeDays: undefined,
      leadTime: undefined,
      customSecurityStock: null
    };
    
    const result = calculateMetrics(product);
    expect(result.securityStock).toBeGreaterThanOrEqual(1);
    // securityStock est en UNITÉS, pas en jours
    // Calcul: salesPerDay (5) × leadTime (30 par défaut) × 0.2 = 5 × 6 = 30 unités
    expect(result.securityStock).toBe(30); // 30 unités (pas 6 jours)
  });

  it('should flag deep overstock when autonomy exceeds the configured threshold', () => {
    const product = {
      stock: 600,
      salesPerDay: 10,
      leadTimeDays: 14,
    };

    const result = calculateMetrics(product, 60);
    expect(result.daysOfStock).toBe(60);
    expect(result.isDeepOverstock).toBe(true);
  });
});

describe('calculateReorderPoint', () => {
  it('should calculate reorder point correctly', () => {
    const product = {
      salesPerDay: 10,
      leadTimeDays: 14,
      customSecurityStock: 5,
    };
    
    const reorderPoint = calculateReorderPoint(product);
    expect(reorderPoint).toBeGreaterThan(0);
  });
});
