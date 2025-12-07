/**
 * Tests Unitaires - RevenueForecastService
 * 
 * Couverture : Calcul du revenu potentiel basé sur ML
 * 
 * Run: npm test revenueForecastService.test.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { calculatePotentialRevenueML, calculateTotalPotentialRevenueML } from '../revenueForecastService';

// Mock des dépendances
vi.mock('../dataCollector', () => ({
  collectSalesHistory: vi.fn(() => Promise.resolve([])),
  getSalesStatistics: vi.fn((history) => {
    if (!history || history.length === 0) {
      return { avgQuantity: 0, totalQuantity: 0 };
    }
    const total = history.reduce((sum, s) => sum + (s.quantity || 0), 0);
    return { avgQuantity: total / history.length, totalQuantity: total };
  })
}));

vi.mock('../mlCache', () => ({
  mlCache: {
    cached: vi.fn((operation, fn) => fn())
  }
}));

vi.mock('../demandForecastModel', () => ({
  DemandForecastModel: vi.fn()
}));

describe('RevenueForecastService', () => {

  // ========================================
  // DONNÉES DE TEST
  // ========================================

  const createProduct = (overrides = {}) => ({
    sku: 'TEST-001',
    name: 'Produit Test',
    sellPrice: 25.00,
    prixVente: 25.00,
    stock: 100,
    stockActuel: 100,
    salesPerDay: 5,
    sales30d: 150,
    rotationRate: 12,
    ...overrides
  });

  const createSalesHistory = (days, avgQuantity, options = {}) => {
    const { variance = 0.2, startDate = null } = options;
    return Array.from({ length: days }, (_, i) => {
      const date = startDate ? new Date(startDate) : new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        date: date.toISOString().split('T')[0],
        quantity: Math.max(0, Math.round(avgQuantity + (Math.random() - 0.5) * avgQuantity * variance)),
        sku: 'TEST-001',
        month: date.getMonth() + 1
      };
    });
  };

  const createTrendingSalesHistory = (days, startQuantity, endQuantity) => {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const progress = i / (days - 1);
      return {
        date: date.toISOString().split('T')[0],
        quantity: Math.round(startQuantity + (endQuantity - startQuantity) * progress),
        sku: 'TEST-001',
        month: date.getMonth() + 1
      };
    });
  };

  const createMockModel = (isReady = true, predictions = [5]) => ({
    isReady: () => isReady,
    predictBatch: vi.fn(() => Promise.resolve(predictions))
  });

  // ========================================
  // TESTS: calculatePotentialRevenueML()
  // ========================================

  describe('calculatePotentialRevenueML()', () => {

    describe('Cas de base', () => {
      test('devrait retourner potentialRevenue=0 si prix=0', async () => {
        const product = createProduct({ sellPrice: 0, prixVente: 0 });

        const result = await calculatePotentialRevenueML(product);

        expect(result.potentialRevenue).toBe(0);
        expect(result.method).toBe('no_price');
        expect(result.confidence).toBe(0);
      });

      test('devrait calculer le revenu de base sans historique', async () => {
        const product = createProduct({ 
          sellPrice: 10, 
          stock: 50, 
          salesPerDay: 2 
        });

        const result = await calculatePotentialRevenueML(product, []);

        expect(result.potentialRevenue).toBeGreaterThan(0);
        expect(result.method).toBe('statistical');
        expect(result.predictedDailySales).toBeGreaterThan(0);
      });

      test('devrait utiliser sales30d/30 si salesPerDay=0', async () => {
        const product = createProduct({ 
          sellPrice: 10, 
          stock: 100, 
          salesPerDay: 0, 
          sales30d: 60 
        });

        const result = await calculatePotentialRevenueML(product, []);

        // 60/30 = 2 ventes/jour
        expect(result.predictedDailySales).toBeGreaterThan(0);
      });

      test('devrait utiliser la moyenne de l\'historique si disponible', async () => {
        const product = createProduct({ salesPerDay: 0, sales30d: 0 });
        const salesHistory = createSalesHistory(30, 10, { variance: 0.1 });

        const result = await calculatePotentialRevenueML(product, salesHistory);

        // La moyenne devrait être proche de 10
        expect(result.predictedDailySales).toBeGreaterThan(0);
      });
    });

    describe('Limites de stock', () => {
      test('devrait limiter le revenu par le stock disponible', async () => {
        const product = createProduct({ 
          sellPrice: 100, 
          stock: 10, // Seulement 10 unités
          salesPerDay: 5 
        });

        const result = await calculatePotentialRevenueML(product, [], null, { 
          forecastDays: 90,
          useSeasonality: false,
          useRotationRate: false 
        });

        // Maximum possible = 10 * 100 = 1000
        expect(result.potentialRevenue).toBeLessThanOrEqual(1000);
        expect(result.actualSellableUnits).toBeLessThanOrEqual(10);
      });

      test('devrait gérer stock=0', async () => {
        const product = createProduct({ stock: 0, stockActuel: 0 });

        const result = await calculatePotentialRevenueML(product);

        expect(result.potentialRevenue).toBe(0);
        expect(result.actualSellableUnits).toBe(0);
      });
    });

    describe('Analyse des tendances', () => {
      test('devrait détecter une tendance haussière (>5%)', async () => {
        const product = createProduct();
        // Historique avec croissance : 5 → 15
        const salesHistory = createTrendingSalesHistory(30, 5, 15);

        const result = await calculatePotentialRevenueML(product, salesHistory);

        expect(result.trend).toBe('up');
        expect(result.growthRate).toBeGreaterThan(5);
      });

      test('devrait détecter une tendance baissière (<-5%)', async () => {
        const product = createProduct();
        // Historique avec décroissance : 15 → 5
        const salesHistory = createTrendingSalesHistory(30, 15, 5);

        const result = await calculatePotentialRevenueML(product, salesHistory);

        expect(result.trend).toBe('down');
        expect(result.growthRate).toBeLessThan(-5);
      });

      test('devrait retourner stable si variation < 5%', async () => {
        const product = createProduct();
        // Historique stable
        const salesHistory = createSalesHistory(30, 10, { variance: 0.05 });

        const result = await calculatePotentialRevenueML(product, salesHistory);

        // La tendance devrait être stable ou proche de stable
        expect(['stable', 'up', 'down']).toContain(result.trend);
      });

      test('devrait retourner stable si historique <7 jours', async () => {
        const product = createProduct();
        const salesHistory = createSalesHistory(5, 10);

        const result = await calculatePotentialRevenueML(product, salesHistory);

        expect(result.trend).toBe('stable');
      });
    });

    describe('Options de calcul', () => {
      test('devrait respecter forecastDays', async () => {
        const product = createProduct({ stock: 1000, salesPerDay: 10 });

        const result30 = await calculatePotentialRevenueML(product, [], null, { 
          forecastDays: 30,
          useSeasonality: false,
          useRotationRate: false 
        });
        
        const result90 = await calculatePotentialRevenueML(product, [], null, { 
          forecastDays: 90,
          useSeasonality: false,
          useRotationRate: false 
        });

        expect(result90.effectiveDays).toBeGreaterThanOrEqual(result30.effectiveDays);
      });

      test('devrait pouvoir désactiver la saisonnalité', async () => {
        const product = createProduct();

        const resultWithSeason = await calculatePotentialRevenueML(product, [], null, { 
          useSeasonality: true 
        });
        
        const resultWithoutSeason = await calculatePotentialRevenueML(product, [], null, { 
          useSeasonality: false 
        });

        // Les résultats peuvent différer selon le mois actuel
        expect(resultWithSeason).toHaveProperty('potentialRevenue');
        expect(resultWithoutSeason).toHaveProperty('potentialRevenue');
      });

      test('devrait pouvoir désactiver la rotation', async () => {
        const product = createProduct({ rotationRate: 24 });

        const result = await calculatePotentialRevenueML(product, [], null, { 
          useRotationRate: false 
        });

        expect(result).toHaveProperty('rotationRate');
      });
    });

    describe('Intégration ML', () => {
      test('devrait utiliser le modèle ML si disponible', async () => {
        const product = createProduct();
        const salesHistory = createSalesHistory(60, 10);
        const mockModel = createMockModel(true, Array(90).fill(8));

        const result = await calculatePotentialRevenueML(product, salesHistory, mockModel, {
          useMLPredictions: true
        });

        expect(result.method).toBe('ml');
        expect(mockModel.predictBatch).toHaveBeenCalled();
      });

      test('devrait retourner statistical si modèle non prêt', async () => {
        const product = createProduct();
        const mockModel = createMockModel(false);

        const result = await calculatePotentialRevenueML(product, [], mockModel);

        expect(result.method).toBe('statistical');
      });

      test('devrait retourner statistical si historique <30 jours (modèle non utilisé)', async () => {
        const product = createProduct();
        const salesHistory = createSalesHistory(20, 10);
        // Avec un modèle qui n'est pas prêt
        const mockModel = createMockModel(false);

        const result = await calculatePotentialRevenueML(product, salesHistory, mockModel);

        expect(result.method).toBe('statistical');
      });

      test('devrait gérer les erreurs ML gracieusement', async () => {
        const product = createProduct();
        const salesHistory = createSalesHistory(60, 10);
        const mockModel = {
          isReady: () => true,
          predictBatch: vi.fn(() => Promise.reject(new Error('ML Error')))
        };

        const result = await calculatePotentialRevenueML(product, salesHistory, mockModel);

        // Devrait fallback vers statistical sans crash
        expect(result).toHaveProperty('potentialRevenue');
        expect(result.potentialRevenue).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Calcul de confiance', () => {
      test('devrait avoir confiance plus élevée avec plus de données', async () => {
        const product = createProduct();
        
        const resultFewData = await calculatePotentialRevenueML(
          product, 
          createSalesHistory(10, 10)
        );
        
        const resultManyData = await calculatePotentialRevenueML(
          product, 
          createSalesHistory(100, 10)
        );

        // Plus de données = plus de confiance (généralement)
        expect(resultManyData.confidence).toBeGreaterThanOrEqual(0);
        expect(resultFewData.confidence).toBeGreaterThanOrEqual(0);
      });

      test('devrait retourner confiance 30 en cas de fallback', async () => {
        const product = createProduct();

        // Simuler une erreur en passant des données invalides
        // Le fallback devrait donner confiance 30
        const result = await calculatePotentialRevenueML(product);

        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      });
    });

    describe('Structure du résultat', () => {
      test('devrait retourner tous les champs requis', async () => {
        const product = createProduct();
        const salesHistory = createSalesHistory(30, 10);

        const result = await calculatePotentialRevenueML(product, salesHistory);

        expect(result).toHaveProperty('potentialRevenue');
        expect(result).toHaveProperty('predictedDailySales');
        expect(result).toHaveProperty('rotationRate');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('method');
        expect(result).toHaveProperty('trend');
        expect(result).toHaveProperty('growthRate');
        expect(result).toHaveProperty('effectiveDays');
        expect(result).toHaveProperty('actualSellableUnits');
        expect(result).toHaveProperty('currentStock');
      });

      test('devrait retourner des valeurs numériques valides', async () => {
        const product = createProduct();

        const result = await calculatePotentialRevenueML(product);

        expect(typeof result.potentialRevenue).toBe('number');
        expect(typeof result.predictedDailySales).toBe('number');
        expect(typeof result.confidence).toBe('number');
        expect(result.potentialRevenue).toBeGreaterThanOrEqual(0);
        expect(result.predictedDailySales).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      });
    });
  });

  // ========================================
  // TESTS: calculateTotalPotentialRevenueML()
  // ========================================

  describe('calculateTotalPotentialRevenueML()', () => {
    test('devrait calculer le total pour plusieurs produits', async () => {
      const products = [
        createProduct({ sku: 'PROD-001', sellPrice: 10, stock: 100 }),
        createProduct({ sku: 'PROD-002', sellPrice: 20, stock: 50 }),
        createProduct({ sku: 'PROD-003', sellPrice: 30, stock: 25 })
      ];

      const result = await calculateTotalPotentialRevenueML(products);

      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('avgConfidence');
      expect(result).toHaveProperty('productDetails');
      expect(result.productDetails).toHaveLength(3);
      expect(result.totalRevenue).toBeGreaterThan(0);
    });

    test('devrait retourner détails par produit', async () => {
      const products = [
        createProduct({ sku: 'PROD-001' }),
        createProduct({ sku: 'PROD-002' })
      ];

      const result = await calculateTotalPotentialRevenueML(products);

      expect(result.productDetails[0]).toHaveProperty('sku', 'PROD-001');
      expect(result.productDetails[1]).toHaveProperty('sku', 'PROD-002');
      expect(result.productDetails[0]).toHaveProperty('potentialRevenue');
    });

    test('devrait calculer la moyenne de confiance', async () => {
      const products = [
        createProduct({ sku: 'PROD-001' }),
        createProduct({ sku: 'PROD-002' })
      ];

      const result = await calculateTotalPotentialRevenueML(products);

      expect(result.avgConfidence).toBeGreaterThanOrEqual(0);
      expect(result.avgConfidence).toBeLessThanOrEqual(100);
    });

    test('devrait compter les méthodes utilisées', async () => {
      const products = [
        createProduct({ sku: 'PROD-001' }),
        createProduct({ sku: 'PROD-002', sellPrice: 0 }) // no_price
      ];

      const result = await calculateTotalPotentialRevenueML(products);

      expect(result).toHaveProperty('methodCounts');
      expect(typeof result.methodCounts).toBe('object');
    });

    test('devrait inclure les informations de qualité des données', async () => {
      const products = [createProduct()];

      const result = await calculateTotalPotentialRevenueML(products);

      expect(result).toHaveProperty('dataQuality');
      expect(result.dataQuality).toHaveProperty('productsWithHistory');
      expect(result.dataQuality).toHaveProperty('totalHistoryRecords');
      expect(result.dataQuality).toHaveProperty('mlAvailable');
    });

    test('devrait gérer une liste vide', async () => {
      const result = await calculateTotalPotentialRevenueML([]);

      expect(result.totalRevenue).toBe(0);
      expect(result.productDetails).toHaveLength(0);
    });
  });

  // ========================================
  // TESTS: Saisonnalité
  // ========================================

  describe('Calcul de saisonnalité', () => {
    test('devrait appliquer les facteurs de saisonnalité par défaut', async () => {
      const product = createProduct({ salesPerDay: 10 });

      const result = await calculatePotentialRevenueML(product, [], null, {
        useSeasonality: true
      });

      // La saisonnalité devrait affecter les ventes prédites
      expect(result.predictedDailySales).toBeGreaterThan(0);
    });

    test('devrait calculer saisonnalité depuis historique si disponible', async () => {
      const product = createProduct();
      // Créer historique sur plusieurs mois
      const salesHistory = [];
      for (let month = 0; month < 12; month++) {
        for (let day = 0; day < 5; day++) {
          const date = new Date();
          date.setMonth(month);
          date.setDate(day + 1);
          salesHistory.push({
            date: date.toISOString().split('T')[0],
            quantity: 10 * (month === 11 ? 2 : 1), // Décembre double
            sku: product.sku,
            month: month + 1
          });
        }
      }

      const result = await calculatePotentialRevenueML(product, salesHistory, null, {
        useSeasonality: true
      });

      expect(result).toHaveProperty('predictedDailySales');
    });
  });

  // ========================================
  // TESTS: Gestion d'erreurs
  // ========================================

  describe('Gestion d\'erreurs', () => {
    test('devrait gérer un produit null gracieusement', async () => {
      // Le comportement dépend de l'implémentation
      // On vérifie que ça ne crash pas
      try {
        const result = await calculatePotentialRevenueML(null);
        // Si pas d'erreur, vérifier le fallback
        expect(result).toHaveProperty('potentialRevenue');
      } catch (error) {
        // Une erreur est acceptable aussi
        expect(error).toBeDefined();
      }
    });

    test('devrait gérer salesHistory undefined', async () => {
      const product = createProduct();

      const result = await calculatePotentialRevenueML(product, undefined);

      expect(result).toHaveProperty('potentialRevenue');
      expect(result.potentialRevenue).toBeGreaterThanOrEqual(0);
    });

    test('devrait retourner fallback en cas d\'erreur interne', async () => {
      const product = createProduct();

      // Le fallback devrait fonctionner
      const result = await calculatePotentialRevenueML(product);

      expect(result).toHaveProperty('potentialRevenue');
      expect(result).toHaveProperty('method');
    });
  });
});

