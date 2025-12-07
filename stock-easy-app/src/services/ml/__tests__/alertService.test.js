/**
 * Tests Unitaires - AlertService
 * 
 * Couverture : Alertes ML, score de criticité, recommandations auto
 * 
 * Run: npm test alertService.test.js
 */

import { describe, test, expect } from 'vitest';
import { 
  generateMLAlerts, 
  calculateCriticalityScore, 
  generateAutoRecommendations 
} from '../alertService';

describe('AlertService', () => {
  // ========================================
  // DONNÉES DE TEST
  // ========================================

  const createProduct = (overrides = {}) => ({
    sku: 'TEST-001',
    name: 'Produit Test',
    stock: 100,
    salesPerDay: 10,
    leadTimeDays: 7,
    supplier: 'Fournisseur Test',
    buyPrice: 5,
    sellPrice: 10,
    ...overrides
  });

  const createForecast = (overrides = {}) => ({
    next7Days: [10, 10, 10, 10, 10, 10, 10],
    next30Days: Array(30).fill(10),
    avg30Days: 10,
    averagePredicted: 10,
    trend: 'stable',
    confidence: 80,
    recommendedOrder: 50,
    ...overrides
  });

  // ========================================
  // TESTS: generateMLAlerts()
  // ========================================

  describe('generateMLAlerts()', () => {
    test('devrait générer une alerte stockout-risk si rupture dans ≤14 jours', () => {
      const products = [createProduct({ stock: 50, salesPerDay: 10 })];
      const forecasts = {
        'TEST-001': createForecast({
          next30Days: Array(30).fill(10) // 50 stock / 10/jour = 5 jours
        })
      };

      const alerts = generateMLAlerts(products, forecasts);

      const stockoutAlerts = alerts.filter(a => a.type === 'stockout-risk');
      expect(stockoutAlerts.length).toBe(1);
      expect(stockoutAlerts[0].daysUntilStockout).toBeLessThanOrEqual(14);
    });

    test('devrait classifier critical si rupture dans ≤3 jours', () => {
      const products = [createProduct({ stock: 20, salesPerDay: 10 })];
      const forecasts = {
        'TEST-001': createForecast({
          next30Days: Array(30).fill(10) // 20 stock / 10/jour = 2 jours
        })
      };

      const alerts = generateMLAlerts(products, forecasts);

      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);
    });

    test('devrait classifier high si rupture dans 4-7 jours', () => {
      const products = [createProduct({ stock: 50, salesPerDay: 10 })];
      const forecasts = {
        'TEST-001': createForecast({
          next30Days: Array(30).fill(10) // 50 stock / 10/jour = 5 jours
        })
      };

      const alerts = generateMLAlerts(products, forecasts);

      const highAlerts = alerts.filter(a => a.severity === 'high' && a.type === 'stockout-risk');
      expect(highAlerts.length).toBe(1);
    });

    test('devrait générer une alerte demand-surge si tendance +30%', () => {
      const products = [createProduct({ salesPerDay: 10 })];
      const forecasts = {
        'TEST-001': createForecast({
          trend: 'up',
          confidence: 80,
          avg30Days: 15 // +50% par rapport à salesPerDay
        })
      };

      const alerts = generateMLAlerts(products, forecasts);

      const surgeAlerts = alerts.filter(a => a.type === 'demand-surge');
      expect(surgeAlerts.length).toBe(1);
      expect(surgeAlerts[0].increasePercent).toBeGreaterThan(30);
    });

    test('devrait générer une alerte demand-drop si tendance -30%', () => {
      const products = [createProduct({ salesPerDay: 10, stock: 50 })];
      const forecasts = {
        'TEST-001': createForecast({
          trend: 'down',
          confidence: 80,
          avg30Days: 5 // -50% par rapport à salesPerDay
        })
      };

      const alerts = generateMLAlerts(products, forecasts);

      const dropAlerts = alerts.filter(a => a.type === 'demand-drop');
      expect(dropAlerts.length).toBe(1);
      expect(dropAlerts[0].decreasePercent).toBeGreaterThan(30);
    });

    test('devrait générer une alerte overstock-risk si >60 jours de stock', () => {
      const products = [createProduct({ stock: 1000, salesPerDay: 10 })];
      const forecasts = {
        'TEST-001': createForecast({
          averagePredicted: 10 // 1000 / 10 = 100 jours
        })
      };

      const alerts = generateMLAlerts(products, forecasts);

      const overstockAlerts = alerts.filter(a => a.type === 'overstock-risk');
      expect(overstockAlerts.length).toBe(1);
      expect(overstockAlerts[0].daysOfStock).toBeGreaterThan(60);
    });

    test('devrait générer une alerte lead-time-warning si marge faible', () => {
      const products = [createProduct({ 
        stock: 100, 
        salesPerDay: 10, 
        leadTimeDays: 7 
      })];
      const forecasts = {
        'TEST-001': createForecast({
          next30Days: Array(30).fill(10) // 100 / 10 = 10 jours, marge = 10 - 7 = 3
        })
      };

      const alerts = generateMLAlerts(products, forecasts);

      const leadTimeAlerts = alerts.filter(a => a.type === 'lead-time-warning');
      expect(leadTimeAlerts.length).toBe(1);
      expect(leadTimeAlerts[0].safetyMargin).toBeLessThanOrEqual(3);
    });

    test('devrait retourner [] si pas de forecasts', () => {
      const products = [createProduct()];
      const forecasts = {};

      const alerts = generateMLAlerts(products, forecasts);

      expect(alerts).toEqual([]);
    });

    test('devrait retourner [] si forecasts est null', () => {
      const products = [createProduct()];

      const alerts = generateMLAlerts(products, null);

      expect(alerts).toEqual([]);
    });

    test('devrait trier par sévérité (critical > high > medium > low)', () => {
      const products = [
        createProduct({ sku: 'SKU-1', stock: 20 }),  // Critical
        createProduct({ sku: 'SKU-2', stock: 1000 }), // Low (overstock)
        createProduct({ sku: 'SKU-3', stock: 50 })   // High
      ];
      const forecasts = {
        'SKU-1': createForecast({ next30Days: Array(30).fill(10) }),
        'SKU-2': createForecast({ averagePredicted: 10 }),
        'SKU-3': createForecast({ next30Days: Array(30).fill(10) })
      };

      const alerts = generateMLAlerts(products, forecasts);

      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      for (let i = 1; i < alerts.length; i++) {
        expect(severityOrder[alerts[i - 1].severity])
          .toBeLessThanOrEqual(severityOrder[alerts[i].severity]);
      }
    });

    test('devrait inclure les informations produit dans les alertes', () => {
      const products = [createProduct({ stock: 30 })];
      const forecasts = {
        'TEST-001': createForecast({ next30Days: Array(30).fill(10) })
      };

      const alerts = generateMLAlerts(products, forecasts);

      expect(alerts[0]).toHaveProperty('sku', 'TEST-001');
      expect(alerts[0]).toHaveProperty('productName', 'Produit Test');
      expect(alerts[0]).toHaveProperty('message');
      expect(alerts[0]).toHaveProperty('details');
    });

    test('devrait inclure recommendedOrder pour stockout-risk', () => {
      const products = [createProduct({ stock: 30 })];
      const forecasts = {
        'TEST-001': createForecast({ next30Days: Array(30).fill(10) })
      };

      const alerts = generateMLAlerts(products, forecasts);

      const stockoutAlert = alerts.find(a => a.type === 'stockout-risk');
      expect(stockoutAlert).toHaveProperty('recommendedOrder');
      expect(stockoutAlert.recommendedOrder).toBeGreaterThan(0);
    });
  });

  // ========================================
  // TESTS: calculateCriticalityScore()
  // ========================================

  describe('calculateCriticalityScore()', () => {
    test('devrait retourner 0 si pas de forecast', () => {
      const product = createProduct();

      const score = calculateCriticalityScore(product, null);

      expect(score).toBe(0);
    });

    test('devrait scorer 40pts si stock ≤3 jours', () => {
      const product = createProduct({ stock: 20, salesPerDay: 10 });
      const forecast = createForecast({ averagePredicted: 10 }); // 20/10 = 2 jours

      const score = calculateCriticalityScore(product, forecast);

      expect(score).toBeGreaterThanOrEqual(40);
    });

    test('devrait scorer 30pts si stock ≤7 jours', () => {
      const product = createProduct({ stock: 50, salesPerDay: 10 });
      const forecast = createForecast({ averagePredicted: 10 }); // 50/10 = 5 jours

      const score = calculateCriticalityScore(product, forecast);

      expect(score).toBeGreaterThanOrEqual(30);
    });

    test('devrait scorer 30pts si tendance hausse >50%', () => {
      const product = createProduct({ stock: 500, salesPerDay: 10 });
      const forecast = createForecast({ 
        trend: 'up', 
        avg30Days: 16, // +60%
        averagePredicted: 10 
      });

      const score = calculateCriticalityScore(product, forecast);

      expect(score).toBeGreaterThanOrEqual(30);
    });

    test('devrait scorer 15pts si volume >20/jour', () => {
      const product = createProduct({ stock: 1000, salesPerDay: 25 });
      const forecast = createForecast({ averagePredicted: 25 });

      const score = calculateCriticalityScore(product, forecast);

      expect(score).toBeGreaterThanOrEqual(15);
    });

    test('devrait scorer 15pts si délai >14 jours', () => {
      const product = createProduct({ stock: 1000, salesPerDay: 5, leadTimeDays: 20 });
      const forecast = createForecast({ averagePredicted: 5 });

      const score = calculateCriticalityScore(product, forecast);

      expect(score).toBeGreaterThanOrEqual(15);
    });

    test('score maximum devrait être 100', () => {
      const product = createProduct({ 
        stock: 20, 
        salesPerDay: 25, 
        leadTimeDays: 20 
      });
      const forecast = createForecast({ 
        trend: 'up', 
        avg30Days: 50, // +100%
        averagePredicted: 10 
      });

      const score = calculateCriticalityScore(product, forecast);

      expect(score).toBeLessThanOrEqual(100);
    });

    test('devrait calculer score cumulatif', () => {
      // Produit avec plusieurs facteurs de risque
      const product = createProduct({ 
        stock: 30,        // ~3 jours = 40pts
        salesPerDay: 10,
        leadTimeDays: 5
      });
      const forecast = createForecast({ 
        averagePredicted: 10
      });

      const score = calculateCriticalityScore(product, forecast);

      // Au moins 40 pts pour le stock faible
      expect(score).toBeGreaterThanOrEqual(40);
    });
  });

  // ========================================
  // TESTS: generateAutoRecommendations()
  // ========================================

  describe('generateAutoRecommendations()', () => {
    test('devrait recommander si criticité >30', () => {
      const products = [createProduct({ stock: 50, salesPerDay: 10 })];
      const forecasts = {
        'TEST-001': createForecast({
          next30Days: Array(30).fill(10),
          averagePredicted: 10
        })
      };

      const recommendations = generateAutoRecommendations(products, forecasts);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].criticalityScore).toBeGreaterThan(30);
    });

    test('devrait recommander si rupture prévue', () => {
      const products = [createProduct({ stock: 50, salesPerDay: 10 })];
      const forecasts = {
        'TEST-001': createForecast({
          next30Days: Array(30).fill(10),
          recommendedOrder: 100
        })
      };

      const recommendations = generateAutoRecommendations(products, forecasts);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('quantity');
    });

    test('devrait marquer urgent si rupture ≤7 jours', () => {
      const products = [createProduct({ stock: 50, salesPerDay: 10 })];
      const forecasts = {
        'TEST-001': createForecast({
          next30Days: Array(30).fill(10) // 50/10 = 5 jours
        })
      };

      const recommendations = generateAutoRecommendations(products, forecasts);

      const urgentRecs = recommendations.filter(r => r.urgency === 'urgent');
      expect(urgentRecs.length).toBeGreaterThan(0);
    });

    test('devrait marquer urgent si délai > jours jusqu\'à rupture', () => {
      const products = [createProduct({ 
        stock: 60, 
        salesPerDay: 10, 
        leadTimeDays: 10 
      })];
      const forecasts = {
        'TEST-001': createForecast({
          next30Days: Array(30).fill(10) // 60/10 = 6 jours, mais leadTime = 10
        })
      };

      const recommendations = generateAutoRecommendations(products, forecasts);

      const urgentRecs = recommendations.filter(r => r.urgency === 'urgent');
      expect(urgentRecs.length).toBeGreaterThan(0);
      expect(urgentRecs[0].reason).toContain('critique');
    });

    test('devrait trier par urgence puis criticité', () => {
      const products = [
        createProduct({ sku: 'SKU-1', stock: 30, salesPerDay: 10 }),  // Urgent
        createProduct({ sku: 'SKU-2', stock: 100, salesPerDay: 10 }), // Normal
        createProduct({ sku: 'SKU-3', stock: 50, salesPerDay: 10 })   // Urgent
      ];
      const forecasts = {
        'SKU-1': createForecast({ next30Days: Array(30).fill(10) }),
        'SKU-2': createForecast({ next30Days: Array(30).fill(10), averagePredicted: 10 }),
        'SKU-3': createForecast({ next30Days: Array(30).fill(10) })
      };

      const recommendations = generateAutoRecommendations(products, forecasts);

      // Urgent d'abord
      let foundNormal = false;
      recommendations.forEach(rec => {
        if (rec.urgency === 'normal') foundNormal = true;
        if (foundNormal && rec.urgency === 'urgent') {
          // Un urgent après un normal = mauvais tri
          expect(rec.urgency).not.toBe('urgent');
        }
      });
    });

    test('devrait inclure estimatedCost', () => {
      const products = [createProduct({ stock: 30, buyPrice: 5 })];
      const forecasts = {
        'TEST-001': createForecast({
          next30Days: Array(30).fill(10),
          recommendedOrder: 100
        })
      };

      const recommendations = generateAutoRecommendations(products, forecasts);

      expect(recommendations[0]).toHaveProperty('estimatedCost');
      expect(recommendations[0].estimatedCost).toBeGreaterThan(0);
    });

    test('devrait inclure supplier', () => {
      const products = [createProduct({ stock: 30, supplier: 'Mon Fournisseur' })];
      const forecasts = {
        'TEST-001': createForecast({
          next30Days: Array(30).fill(10)
        })
      };

      const recommendations = generateAutoRecommendations(products, forecasts);

      expect(recommendations[0]).toHaveProperty('supplier', 'Mon Fournisseur');
    });

    test('devrait retourner [] si aucun produit critique', () => {
      const products = [createProduct({ stock: 1000, salesPerDay: 1 })];
      const forecasts = {
        'TEST-001': createForecast({
          next30Days: Array(30).fill(1),
          averagePredicted: 1
        })
      };

      const recommendations = generateAutoRecommendations(products, forecasts);

      // Pas de recommandation car stock très élevé
      expect(recommendations.length).toBe(0);
    });
  });

  // ========================================
  // TESTS: Cas limites
  // ========================================

  describe('Cas limites', () => {
    test('devrait gérer salesPerDay = 0', () => {
      const products = [createProduct({ salesPerDay: 0 })];
      const forecasts = {
        'TEST-001': createForecast({ averagePredicted: 0 })
      };

      expect(() => generateMLAlerts(products, forecasts)).not.toThrow();
      expect(() => calculateCriticalityScore(products[0], forecasts['TEST-001'])).not.toThrow();
    });

    test('devrait gérer stock = 0', () => {
      const products = [createProduct({ stock: 0 })];
      const forecasts = {
        'TEST-001': createForecast()
      };

      const alerts = generateMLAlerts(products, forecasts);

      // Devrait générer une alerte critique
      expect(alerts.some(a => a.severity === 'critical')).toBe(true);
    });

    test('devrait gérer forecast sans next30Days', () => {
      const products = [createProduct({ stock: 30 })];
      const forecasts = {
        'TEST-001': {
          next7Days: [10, 10, 10, 10, 10, 10, 10],
          averagePredicted: 10
        }
      };

      expect(() => generateMLAlerts(products, forecasts)).not.toThrow();
    });

    test('devrait gérer produit sans SKU dans forecasts', () => {
      const products = [createProduct({ sku: 'UNKNOWN' })];
      const forecasts = {
        'TEST-001': createForecast()
      };

      const alerts = generateMLAlerts(products, forecasts);

      // Pas d'alerte pour un produit sans forecast
      expect(alerts.filter(a => a.sku === 'UNKNOWN').length).toBe(0);
    });
  });
});

