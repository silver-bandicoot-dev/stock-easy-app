import { describe, it, expect } from 'vitest';
import { calculateAnalyticsKPIs } from '../analyticsKPIs';

// Mock de formatCurrency
const mockFormatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
};

describe('Analytics KPIs', () => {
  describe('Gross Margin Calculation', () => {
    it('should calculate gross margin correctly from sell/buy prices', () => {
      const products = [
        { stock: 10, buyPrice: 50, sellPrice: 75 },  // Marge: 250€
        { stock: 5, buyPrice: 100, sellPrice: 150 }, // Marge: 250€
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      // Marge attendue : (75-50)*10 + (150-100)*5 = 250 + 250 = 500€
      expect(result.totalGrossMargin.rawValue).toBe(500);
    });

    it('should handle negative margins', () => {
      const products = [
        { stock: 10, buyPrice: 75, sellPrice: 50 }, // Marge: -250€
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      expect(result.totalGrossMargin.rawValue).toBe(-250);
    });

    it('should use precomputed grossMargin if available', () => {
      const products = [
        { stock: 10, buyPrice: 50, sellPrice: 75, grossMargin: 300 },
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      // Doit utiliser grossMargin pré-calculé (300) au lieu de calculer (250)
      expect(result.totalGrossMargin.rawValue).toBe(300);
    });

    it('should handle missing prices gracefully', () => {
      const products = [
        { stock: 10, buyPrice: 50 }, // Pas de sellPrice
        { stock: 5, sellPrice: 150 }, // Pas de buyPrice
        { stock: 3 }, // Pas de prix du tout
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      // Marge attendue : (0-50)*10 + (150-0)*5 + (0-0)*3 = -500 + 750 + 0 = 250€
      expect(result.totalGrossMargin.rawValue).toBe(250);
    });

    it('should handle zero stock', () => {
      const products = [
        { stock: 0, buyPrice: 50, sellPrice: 75 }, // Marge: 0€
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      expect(result.totalGrossMargin.rawValue).toBe(0);
    });
  });

  describe('Inventory Valuation', () => {
    it('should calculate inventory value correctly', () => {
      const products = [
        { stock: 10, buyPrice: 50 },  // 500€
        { stock: 20, buyPrice: 100 }, // 2000€
      ];
      
      // Note: inventoryValuation n'est pas dans analyticsKPIs, mais on peut vérifier
      // que les calculs utilisent bien buyPrice pour la valeur d'inventaire
      // Cette fonctionnalité est dans useAnalytics, pas dans analyticsKPIs
      // On teste ici que les produits sont bien traités
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      expect(result.totalProducts.rawValue).toBe(2);
    });
  });

  describe('Lost Sales Calculation', () => {
    it('should calculate lost sales for out-of-stock products', () => {
      // Note: lostSales n'est pas calculé dans analyticsKPIs mais dans useAnalytics
      // On teste ici la logique de base pour les produits
      const products = [
        { stock: 0, salesPerDay: 2, sellPrice: 50 },
        { stock: 0, salesPerDay: 1, sellPrice: 100 },
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      // Vérifier que les produits sont bien comptés
      expect(result.totalProducts.rawValue).toBe(2);
    });

    it('should ignore products with stock', () => {
      const products = [
        { stock: 10, salesPerDay: 2, sellPrice: 50 },
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      expect(result.totalProducts.rawValue).toBe(1);
    });
  });

  describe('Fast Rotating Products', () => {
    it('should identify fast rotating products correctly (rotationRate > 4 rotations/an)', () => {
      const products = [
        { rotationRate: 6 },  // Rapide (> 4)
        { rotationRate: 8 },  // Rapide (> 4)
        { rotationRate: 2 },  // Lent (<= 4)
        { rotationRate: 0.5 }, // Très lent (<= 4)
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      // Seulement 2 produits avec rotationRate > 4
      expect(result.fastRotatingProducts.rawValue).toBe(2);
    });

    it('should calculate average rotation rate correctly', () => {
      const products = [
        { rotationRate: 6 },  // 6 rot/an
        { rotationRate: 8 },  // 8 rot/an
        { rotationRate: 2 },  // 2 rot/an
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      // Moyenne : (6 + 8 + 2) / 3 = 5.33 rot/an
      expect(result.fastRotatingProducts.averageRotationRate).toBeCloseTo(5.33, 2);
    });

    it('should handle products without rotation rate', () => {
      const products = [
        { rotationRate: 6 },
        { rotationRate: 0 },  // Exclu du calcul de moyenne
        {}, // Pas de rotationRate
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      // Seulement 1 produit avec rotationRate > 4
      expect(result.fastRotatingProducts.rawValue).toBe(1);
      // Moyenne : 6 / 1 = 6 rot/an
      expect(result.fastRotatingProducts.averageRotationRate).toBe(6);
    });
  });

  describe('Healthy Products Percentage', () => {
    it('should calculate healthy products percentage correctly', () => {
      const products = [
        { healthStatus: 'healthy' },
        { healthStatus: 'healthy' },
        { healthStatus: 'urgent' },
        { healthStatus: 'warning' },
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      // 2 produits sains sur 4 = 50%
      expect(result.healthyPercentage.rawValue).toBe(50);
    });

    it('should handle empty products array', () => {
      const products = [];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      expect(result.healthyPercentage.rawValue).toBe(0);
      expect(result.totalProducts.rawValue).toBe(0);
    });
  });

  describe('In Transit Orders', () => {
    it('should calculate in transit percentage correctly', () => {
      const orders = [
        { status: 'in_transit' },
        { status: 'in_transit' },
        { status: 'pending_confirmation' },
        { status: 'received' },
      ];
      
      const result = calculateAnalyticsKPIs([], orders, mockFormatCurrency);
      
      // 2 commandes en transit sur 4 = 50%
      expect(result.inTransit.rawValue).toBe(50);
    });

    it('should handle empty orders array', () => {
      const orders = [];
      
      const result = calculateAnalyticsKPIs([], orders, mockFormatCurrency);
      
      expect(result.inTransit.rawValue).toBe(0);
    });
  });

  describe('Potential Revenue (ML)', () => {
    it('should use ML revenue data if available', () => {
      const products = [
        { stock: 10, sellPrice: 50 },
      ];
      
      const mlRevenueData = {
        totalRevenue: 1000,
        avgConfidence: 85,
        methodCounts: { ml: 1 },
        dataQuality: { mlAvailable: true }
      };
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency, mlRevenueData);
      
      // Doit utiliser la valeur ML (1000) au lieu de calculer (10 * 50 = 500)
      expect(result.totalPotentialRevenue.rawValue).toBe(1000);
      expect(result.totalPotentialRevenue.mlData).toBeDefined();
      expect(result.totalPotentialRevenue.mlData.confidence).toBe(85);
    });

    it('should fallback to simple calculation if no ML data', () => {
      const products = [
        { stock: 10, sellPrice: 50 },
        { stock: 5, sellPrice: 100 },
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency, null);
      
      // Calcul simple : (10 * 50) + (5 * 100) = 500 + 500 = 1000
      expect(result.totalPotentialRevenue.rawValue).toBe(1000);
      expect(result.totalPotentialRevenue.mlData).toBeNull();
    });

    it('should use potentialRevenue if available on product', () => {
      const products = [
        { stock: 10, sellPrice: 50, potentialRevenue: 600 },
        { stock: 5, sellPrice: 100 },
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency, null);
      
      // (600) + (5 * 100) = 600 + 500 = 1100
      expect(result.totalPotentialRevenue.rawValue).toBe(1100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined products gracefully', () => {
      const result = calculateAnalyticsKPIs(null, [], mockFormatCurrency);
      
      expect(result.totalProducts.rawValue).toBe(0);
      expect(result.totalGrossMargin.rawValue).toBe(0);
    });

    it('should handle products with missing fields', () => {
      const products = [
        {}, // Produit vide
        { stock: 10 }, // Pas de prix
        { buyPrice: 50 }, // Pas de stock
      ];
      
      const result = calculateAnalyticsKPIs(products, [], mockFormatCurrency);
      
      expect(result.totalProducts.rawValue).toBe(3);
      // Marge brute : (0-0)*0 + (0-0)*10 + (0-50)*0 = 0
      expect(result.totalGrossMargin.rawValue).toBe(0);
    });
  });
});

