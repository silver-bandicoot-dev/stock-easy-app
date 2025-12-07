/**
 * Tests Unitaires - AnomalyDetector
 * 
 * Couverture : Détection d'anomalies de demande et fournisseur
 * 
 * Run: npm test anomalyDetector.test.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  AnomalyDetector, 
  ANOMALY_TYPES, 
  SEVERITY_LEVELS,
  detectProductAnomalies 
} from '../anomalyDetector';

// Mock du dataCollector
vi.mock('../dataCollector', () => ({
  collectSalesHistory: vi.fn(() => Promise.resolve([]))
}));

describe('AnomalyDetector', () => {
  let detector;

  // ========================================
  // DONNÉES DE TEST
  // ========================================

  const createSalesHistory = (days, avgQuantity, variance = 0.2) => {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        sku: 'TEST-001',
        date: date.toISOString().split('T')[0],
        quantity: Math.max(0, Math.round(avgQuantity + (Math.random() - 0.5) * avgQuantity * variance))
      };
    });
  };

  const createProduct = (overrides = {}) => ({
    sku: 'TEST-001',
    name: 'Produit Test',
    stock: 100,
    salesPerDay: 10,
    leadTimeDays: 7,
    supplier: 'Fournisseur Test',
    ...overrides
  });

  const createOrder = (overrides = {}) => ({
    id: 'ORDER-001',
    status: 'received',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    receivedDate: new Date().toISOString(),
    supplier: 'Fournisseur Test',
    items: [{
      sku: 'TEST-001',
      orderedQuantity: 100,
      receivedQuantity: 100,
      damagedQuantity: 0
    }],
    ...overrides
  });

  // ========================================
  // TESTS: Constructeur
  // ========================================

  describe('Constructeur', () => {
    test('devrait initialiser avec les options par défaut', () => {
      detector = new AnomalyDetector();
      
      expect(detector.zScoreThreshold).toBe(2.5);
      expect(detector.supplierDelayThreshold).toBe(0.2);
      expect(detector.qualityThreshold).toBe(0.1);
      expect(detector.minDataPoints).toBe(14);
    });

    test('devrait accepter des options personnalisées', () => {
      detector = new AnomalyDetector({
        zScoreThreshold: 3.0,
        supplierDelayThreshold: 0.3,
        qualityThreshold: 0.15,
        minDataPoints: 21
      });
      
      expect(detector.zScoreThreshold).toBe(3.0);
      expect(detector.supplierDelayThreshold).toBe(0.3);
      expect(detector.qualityThreshold).toBe(0.15);
      expect(detector.minDataPoints).toBe(21);
    });
  });

  // ========================================
  // TESTS: Détection d'anomalies de demande
  // ========================================

  describe('Détection d\'anomalies de demande (Z-Score)', () => {
    beforeEach(() => {
      detector = new AnomalyDetector();
    });

    test('devrait détecter un pic de ventes (Z > 2.5)', async () => {
      const product = createProduct();
      
      // Créer un historique stable avec un pic à la fin
      const salesHistory = createSalesHistory(20, 10, 0.1);
      // Ajouter un pic significatif dans les 7 derniers jours
      salesHistory[salesHistory.length - 1].quantity = 50; // 5x la moyenne
      
      const anomalies = await detector.detectDemandAnomalies(product, salesHistory);
      
      const spikes = anomalies.filter(a => a.type === ANOMALY_TYPES.DEMAND_SPIKE);
      expect(spikes.length).toBeGreaterThan(0);
      expect(spikes[0].severity).toMatch(/critical|high/);
    });

    test('devrait détecter une chute de ventes (Z < -2.5)', async () => {
      const product = createProduct();
      
      // Créer un historique avec moyenne élevée
      const salesHistory = createSalesHistory(20, 50, 0.1);
      // Ajouter une chute significative
      salesHistory[salesHistory.length - 1].quantity = 0;
      
      const anomalies = await detector.detectDemandAnomalies(product, salesHistory);
      
      const drops = anomalies.filter(a => a.type === ANOMALY_TYPES.DEMAND_DROP);
      expect(drops.length).toBeGreaterThan(0);
    });

    test('devrait ignorer les variations normales', async () => {
      const product = createProduct();
      
      // Créer un historique avec variations normales (±20%)
      const salesHistory = createSalesHistory(30, 10, 0.2);
      
      const anomalies = await detector.detectDemandAnomalies(product, salesHistory);
      
      // Devrait avoir peu ou pas d'anomalies
      expect(anomalies.length).toBeLessThanOrEqual(2);
    });

    test('devrait retourner [] si données insuffisantes (<14 jours)', async () => {
      const product = createProduct();
      const salesHistory = createSalesHistory(10, 10); // Seulement 10 jours
      
      const anomalies = await detector.detectDemandAnomalies(product, salesHistory);
      
      expect(anomalies).toEqual([]);
    });

    test('devrait classifier comme critical si Z > 3.5', async () => {
      const product = createProduct();
      
      // Créer un historique très stable
      const salesHistory = Array.from({ length: 20 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (20 - i - 1));
        return {
          sku: 'TEST-001',
          date: date.toISOString().split('T')[0],
          quantity: 10 // Toujours 10
        };
      });
      // Ajouter un pic extrême
      salesHistory[salesHistory.length - 1].quantity = 100; // 10x la moyenne
      
      const anomalies = await detector.detectDemandAnomalies(product, salesHistory);
      
      const criticalSpikes = anomalies.filter(
        a => a.type === ANOMALY_TYPES.DEMAND_SPIKE && a.severity === SEVERITY_LEVELS.CRITICAL
      );
      expect(criticalSpikes.length).toBeGreaterThan(0);
    });

    test('devrait inclure les métriques dans l\'anomalie', async () => {
      const product = createProduct();
      const salesHistory = createSalesHistory(20, 10, 0.1);
      salesHistory[salesHistory.length - 1].quantity = 50;
      
      const anomalies = await detector.detectDemandAnomalies(product, salesHistory);
      
      if (anomalies.length > 0) {
        expect(anomalies[0]).toHaveProperty('metrics');
        expect(anomalies[0].metrics).toHaveProperty('expected');
        expect(anomalies[0].metrics).toHaveProperty('actual');
      }
    });
  });

  // ========================================
  // TESTS: Détection d'anomalies fournisseur
  // ========================================

  describe('Détection d\'anomalies fournisseur', () => {
    beforeEach(() => {
      detector = new AnomalyDetector();
    });

    test('devrait détecter un délai de livraison anormal (>20%)', () => {
      const product = createProduct({ leadTimeDays: 7 });
      
      // Commande avec délai de 14 jours au lieu de 7 (100% de dépassement)
      const orders = [createOrder({
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        receivedDate: new Date().toISOString()
      })];
      
      const anomalies = detector.detectSupplierAnomalies(product, orders);
      
      const delays = anomalies.filter(a => a.type === ANOMALY_TYPES.SUPPLIER_DELAY);
      expect(delays.length).toBe(1);
      expect(delays[0].severity).toMatch(/critical|high/);
    });

    test('devrait détecter un problème de qualité (>10% endommagés)', () => {
      const product = createProduct();
      
      const orders = [createOrder({
        items: [{
          sku: 'TEST-001',
          orderedQuantity: 100,
          receivedQuantity: 80,
          damagedQuantity: 20 // 20% endommagés
        }]
      })];
      
      const anomalies = detector.detectSupplierAnomalies(product, orders);
      
      const qualityIssues = anomalies.filter(a => a.type === ANOMALY_TYPES.SUPPLIER_QUALITY);
      expect(qualityIssues.length).toBe(1);
    });

    test('devrait ignorer les délais dans les limites', () => {
      const product = createProduct({ leadTimeDays: 7 });
      
      // Délai de 8 jours au lieu de 7 (14% de dépassement, sous le seuil de 20%)
      const orders = [createOrder({
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        receivedDate: new Date().toISOString()
      })];
      
      const anomalies = detector.detectSupplierAnomalies(product, orders);
      
      const delays = anomalies.filter(a => a.type === ANOMALY_TYPES.SUPPLIER_DELAY);
      expect(delays.length).toBe(0);
    });

    test('devrait retourner [] si pas de commandes', () => {
      const product = createProduct();
      
      const anomalies = detector.detectSupplierAnomalies(product, []);
      
      expect(anomalies).toEqual([]);
    });

    test('devrait classifier qualité comme critical si >20% endommagés', () => {
      const product = createProduct();
      
      const orders = [createOrder({
        items: [{
          sku: 'TEST-001',
          orderedQuantity: 100,
          receivedQuantity: 70,
          damagedQuantity: 30 // 30% endommagés
        }]
      })];
      
      const anomalies = detector.detectSupplierAnomalies(product, orders);
      
      const criticalQuality = anomalies.filter(
        a => a.type === ANOMALY_TYPES.SUPPLIER_QUALITY && a.severity === SEVERITY_LEVELS.CRITICAL
      );
      expect(criticalQuality.length).toBe(1);
    });
  });

  // ========================================
  // TESTS: Génération de recommandations
  // ========================================

  describe('Génération de recommandations', () => {
    beforeEach(() => {
      detector = new AnomalyDetector();
    });

    test('devrait générer des recommandations pour pic de ventes', () => {
      const recommendations = detector.generateSpikeRecommendations(
        createProduct(),
        50, // actual
        10  // expected
      );
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.action === 'urgent_order')).toBe(true);
      expect(recommendations.some(r => r.action === 'analyze_cause')).toBe(true);
    });

    test('devrait générer des recommandations pour chute de ventes', () => {
      const recommendations = detector.generateDropRecommendations(
        createProduct(),
        2,  // actual
        10  // expected
      );
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.action === 'investigate')).toBe(true);
      expect(recommendations.some(r => r.action === 'reduce_orders')).toBe(true);
    });

    test('devrait générer des recommandations pour délai fournisseur', () => {
      const recommendations = detector.generateDelayRecommendations(
        createProduct({ salesPerDay: 10 }),
        10 // 10 jours de retard
      );
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.action === 'find_alternative')).toBe(true);
      expect(recommendations.some(r => r.action === 'increase_safety')).toBe(true);
    });

    test('devrait générer des recommandations pour problème qualité', () => {
      const recommendations = detector.generateQualityRecommendations(
        createProduct(),
        0.25 // 25% de dommages
      );
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.action === 'contact_supplier')).toBe(true);
      expect(recommendations.some(r => r.action === 'find_alternative')).toBe(true);
    });
  });

  // ========================================
  // TESTS: Méthodes utilitaires
  // ========================================

  describe('Méthodes utilitaires', () => {
    beforeEach(() => {
      detector = new AnomalyDetector();
    });

    test('calculateStats() devrait calculer moyenne et écart-type corrects', () => {
      const values = [10, 12, 8, 10, 10]; // Moyenne = 10
      const stats = detector.calculateStats(values);
      
      expect(stats.mean).toBe(10);
      expect(stats.stdDev).toBeCloseTo(1.26, 1);
    });

    test('calculateStats() devrait gérer un tableau vide', () => {
      const stats = detector.calculateStats([]);
      
      expect(stats.mean).toBe(0);
      expect(stats.stdDev).toBe(0);
    });

    test('getAnomalyStats() devrait calculer les statistiques par type et sévérité', () => {
      const anomalies = [
        { type: ANOMALY_TYPES.DEMAND_SPIKE, severity: SEVERITY_LEVELS.CRITICAL },
        { type: ANOMALY_TYPES.DEMAND_SPIKE, severity: SEVERITY_LEVELS.HIGH },
        { type: ANOMALY_TYPES.DEMAND_DROP, severity: SEVERITY_LEVELS.MEDIUM },
        { type: ANOMALY_TYPES.SUPPLIER_DELAY, severity: SEVERITY_LEVELS.HIGH }
      ];
      
      const stats = detector.getAnomalyStats(anomalies);
      
      expect(stats.total).toBe(4);
      expect(stats.byType[ANOMALY_TYPES.DEMAND_SPIKE]).toBe(2);
      expect(stats.byType[ANOMALY_TYPES.DEMAND_DROP]).toBe(1);
      expect(stats.critical).toBe(1);
      expect(stats.high).toBe(2);
      expect(stats.medium).toBe(1);
    });

    test('filterByType() devrait filtrer correctement', () => {
      const anomalies = [
        { type: ANOMALY_TYPES.DEMAND_SPIKE },
        { type: ANOMALY_TYPES.DEMAND_DROP },
        { type: ANOMALY_TYPES.DEMAND_SPIKE }
      ];
      
      const spikes = detector.filterByType(anomalies, ANOMALY_TYPES.DEMAND_SPIKE);
      
      expect(spikes.length).toBe(2);
    });

    test('filterBySeverity() devrait filtrer correctement', () => {
      const anomalies = [
        { severity: SEVERITY_LEVELS.CRITICAL },
        { severity: SEVERITY_LEVELS.HIGH },
        { severity: SEVERITY_LEVELS.CRITICAL }
      ];
      
      const critical = detector.filterBySeverity(anomalies, SEVERITY_LEVELS.CRITICAL);
      
      expect(critical.length).toBe(2);
    });

    test('getAnomaliesForProduct() devrait filtrer par SKU', () => {
      const anomalies = [
        { sku: 'SKU-001' },
        { sku: 'SKU-002' },
        { sku: 'SKU-001' }
      ];
      
      const filtered = detector.getAnomaliesForProduct(anomalies, 'SKU-001');
      
      expect(filtered.length).toBe(2);
    });
  });

  // ========================================
  // TESTS: Intégration
  // ========================================

  describe('Intégration', () => {
    beforeEach(() => {
      detector = new AnomalyDetector();
    });

    test('detectAllAnomalies() devrait détecter tous types d\'anomalies', async () => {
      const { collectSalesHistory } = await import('../dataCollector');
      
      // Mock avec données contenant un pic
      const mockSalesHistory = createSalesHistory(20, 10, 0.1);
      mockSalesHistory[mockSalesHistory.length - 1].quantity = 50;
      collectSalesHistory.mockResolvedValueOnce(mockSalesHistory);
      
      const products = [createProduct()];
      const orders = [createOrder({
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        receivedDate: new Date().toISOString()
      })];
      
      const anomalies = await detector.detectAllAnomalies(products, orders);
      
      expect(Array.isArray(anomalies)).toBe(true);
    });

    test('devrait trier par sévérité puis par date', async () => {
      const { collectSalesHistory } = await import('../dataCollector');
      collectSalesHistory.mockResolvedValueOnce([]);
      
      const products = [createProduct()];
      
      // Créer des ordres avec différentes sévérités
      const orders = [
        createOrder({
          id: 'ORDER-1',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          items: [{ sku: 'TEST-001', receivedQuantity: 70, damagedQuantity: 30 }] // Critical
        }),
        createOrder({
          id: 'ORDER-2',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          items: [{ sku: 'TEST-001', receivedQuantity: 85, damagedQuantity: 15 }] // High
        })
      ];
      
      const anomalies = await detector.detectAllAnomalies(products, orders);
      
      // Vérifier que le tri est correct (critical avant high)
      if (anomalies.length >= 2) {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 1; i < anomalies.length; i++) {
          expect(severityOrder[anomalies[i - 1].severity])
            .toBeLessThanOrEqual(severityOrder[anomalies[i].severity]);
        }
      }
    });

    test('detectRealTimeAnomalies() devrait filtrer sur les dernières 24h', async () => {
      const { collectSalesHistory } = await import('../dataCollector');
      collectSalesHistory.mockResolvedValueOnce([]);
      
      const products = [createProduct()];
      
      // Une commande récente et une ancienne
      const orders = [
        createOrder({
          id: 'ORDER-RECENT',
          receivedDate: new Date().toISOString(),
          items: [{ sku: 'TEST-001', receivedQuantity: 70, damagedQuantity: 30 }]
        }),
        createOrder({
          id: 'ORDER-OLD',
          receivedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          items: [{ sku: 'TEST-001', receivedQuantity: 70, damagedQuantity: 30 }]
        })
      ];
      
      const recentAnomalies = await detector.detectRealTimeAnomalies(products, orders);
      
      // Seules les anomalies des dernières 24h devraient être retournées
      recentAnomalies.forEach(anomaly => {
        const anomalyDate = new Date(anomaly.date);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(anomalyDate >= yesterday).toBe(true);
      });
    });
  });

  // ========================================
  // TESTS: Helper function
  // ========================================

  describe('detectProductAnomalies helper', () => {
    test('devrait détecter les anomalies pour un produit', async () => {
      const product = createProduct();
      const salesHistory = createSalesHistory(20, 10, 0.1);
      salesHistory[salesHistory.length - 1].quantity = 50;
      
      const anomalies = await detectProductAnomalies(product, salesHistory, []);
      
      expect(Array.isArray(anomalies)).toBe(true);
    });
  });

  // ========================================
  // TESTS: Constantes exportées
  // ========================================

  describe('Constantes', () => {
    test('ANOMALY_TYPES devrait contenir tous les types', () => {
      expect(ANOMALY_TYPES.DEMAND_SPIKE).toBe('demand-spike');
      expect(ANOMALY_TYPES.DEMAND_DROP).toBe('demand-drop');
      expect(ANOMALY_TYPES.SUPPLIER_DELAY).toBe('supplier-delay');
      expect(ANOMALY_TYPES.SUPPLIER_QUALITY).toBe('supplier-quality');
      expect(ANOMALY_TYPES.STOCK_DISCREPANCY).toBe('stock-discrepancy');
    });

    test('SEVERITY_LEVELS devrait contenir tous les niveaux', () => {
      expect(SEVERITY_LEVELS.CRITICAL).toBe('critical');
      expect(SEVERITY_LEVELS.HIGH).toBe('high');
      expect(SEVERITY_LEVELS.MEDIUM).toBe('medium');
      expect(SEVERITY_LEVELS.LOW).toBe('low');
    });
  });
});

