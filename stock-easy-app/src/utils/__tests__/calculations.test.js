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
    };
    
    const result = calculateMetrics(product);
    expect(result.healthStatus).toBe('urgent');
    expect(result.healthPercentage).toBeLessThan(30);
  });

  it('should mark as urgent when stock is critically low', () => {
    const product = {
      stock: 5,
      salesPerDay: 10,
      leadTimeDays: 14,
    };
    
    const result = calculateMetrics(product);
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
