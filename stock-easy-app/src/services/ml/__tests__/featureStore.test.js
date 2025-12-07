/**
 * Tests Unitaires - FeatureStore
 * 
 * Couverture : Cache pré-calculé des features ML par produit
 * 
 * Run: npm test featureStore.test.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { FeatureStore } from '../featureStore';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Re-import pour obtenir la classe
const createFeatureStore = () => {
  // Créer une nouvelle instance
  const FeatureStoreClass = class {
    constructor() {
      this.features = new Map();
      this.metadata = { version: '1.0', lastUpdate: null, productsCount: 0 };
      this.stats = { hits: 0, misses: 0, computations: 0 };
    }
  };
  
  // Importer le module frais
  return import('../featureStore').then(m => new m.featureStore.constructor());
};

describe('FeatureStore', () => {

  // ========================================
  // DONNÉES DE TEST
  // ========================================

  const createProduct = (overrides = {}) => ({
    sku: 'TEST-001',
    name: 'Produit Test',
    stock: 100,
    salesPerDay: 5,
    sales30d: 150,
    sellPrice: 25.00,
    leadTimeDays: 14,
    rotationRate: 12,
    category: 'electronics',
    ...overrides
  });

  const createSalesHistory = (days, avgQuantity = 10) => {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        date: date.toISOString().split('T')[0],
        quantity: Math.max(0, Math.round(avgQuantity + (Math.random() - 0.5) * avgQuantity * 0.3)),
        sku: 'TEST-001'
      };
    });
  };

  let store;

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // Importer une nouvelle instance
    const module = await import('../featureStore');
    store = module.featureStore;
    store.features.clear();
    store.stats = { hits: 0, misses: 0, computations: 0 };
  });

  // ========================================
  // TESTS: Calcul des features de base
  // ========================================

  describe('computeFeatures()', () => {
    test('devrait calculer les features de base du produit', () => {
      const product = createProduct();
      const features = store.computeFeatures(product, []);

      expect(features.basic).toBeDefined();
      expect(features.basic.hasStock).toBe(true);
      expect(features.basic.stockLevel).toBe(100);
      expect(features.basic.avgSalesPerDay).toBe(5);
      expect(features.basic.price).toBe(25);
    });

    test('devrait calculer salesPerDay depuis sales30d si absent', () => {
      const product = createProduct({ salesPerDay: 0, sales30d: 60 });
      const features = store.computeFeatures(product, []);

      expect(features.basic.avgSalesPerDay).toBe(2); // 60/30
    });

    test('devrait inclure le timestamp de calcul', () => {
      const product = createProduct();
      const features = store.computeFeatures(product, []);

      expect(features.computedAt).toBeDefined();
      expect(features.computedAt).toBeLessThanOrEqual(Date.now());
    });
  });

  // ========================================
  // TESTS: Calcul de la saisonnalité
  // ========================================

  describe('Saisonnalité', () => {
    test('devrait retourner detected=false si <30 jours', () => {
      const product = createProduct();
      const history = createSalesHistory(20);
      const features = store.computeFeatures(product, history);

      expect(features.seasonality.detected).toBe(false);
    });

    test('devrait calculer les facteurs mensuels', () => {
      const product = createProduct();
      const history = createSalesHistory(90, 10);
      const features = store.computeFeatures(product, history);

      expect(features.seasonality.factors).toBeDefined();
      expect(Object.keys(features.seasonality.factors).length).toBe(12);
    });

    test('devrait identifier le facteur du mois actuel', () => {
      const product = createProduct();
      const history = createSalesHistory(60, 10);
      const features = store.computeFeatures(product, history);

      expect(features.seasonality.currentMonthFactor).toBeDefined();
      expect(typeof features.seasonality.currentMonthFactor).toBe('number');
    });
  });

  // ========================================
  // TESTS: Calcul de la tendance
  // ========================================

  describe('Tendance', () => {
    test('devrait retourner detected=false si <14 jours', () => {
      const product = createProduct();
      const history = createSalesHistory(10);
      const features = store.computeFeatures(product, history);

      expect(features.trend.detected).toBe(false);
    });

    test('devrait détecter une tendance haussière', () => {
      const product = createProduct();
      // Créer un historique avec tendance croissante
      const history = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split('T')[0],
        quantity: 5 + i * 0.5 // Croissance linéaire
      }));
      
      const features = store.computeFeatures(product, history);

      expect(features.trend.direction).toBe('increasing');
      expect(features.trend.changePercent).toBeGreaterThan(0);
    });

    test('devrait détecter une tendance baissière', () => {
      const product = createProduct();
      // Créer un historique avec tendance décroissante
      const history = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split('T')[0],
        quantity: 20 - i * 0.5 // Décroissance linéaire
      }));
      
      const features = store.computeFeatures(product, history);

      expect(features.trend.direction).toBe('decreasing');
      expect(features.trend.changePercent).toBeLessThan(0);
    });
  });

  // ========================================
  // TESTS: Calcul de la volatilité
  // ========================================

  describe('Volatilité', () => {
    test('devrait retourner level=unknown si <7 jours', () => {
      const product = createProduct();
      const history = createSalesHistory(5);
      const features = store.computeFeatures(product, history);

      expect(features.volatility.level).toBe('unknown');
    });

    test('devrait détecter volatilité élevée', () => {
      const product = createProduct();
      // Historique très variable
      const history = [
        { date: '2024-01-01', quantity: 5 },
        { date: '2024-01-02', quantity: 50 },
        { date: '2024-01-03', quantity: 2 },
        { date: '2024-01-04', quantity: 100 },
        { date: '2024-01-05', quantity: 3 },
        { date: '2024-01-06', quantity: 80 },
        { date: '2024-01-07', quantity: 1 }
      ];
      
      const features = store.computeFeatures(product, history);

      expect(features.volatility.level).toBe('high');
    });

    test('devrait détecter volatilité basse', () => {
      const product = createProduct();
      // Historique très stable
      const history = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        quantity: 10 // Toujours 10
      }));
      
      const features = store.computeFeatures(product, history);

      expect(features.volatility.level).toBe('low');
    });

    test('devrait gérer mean=0', () => {
      const product = createProduct();
      const history = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        quantity: 0
      }));
      
      const features = store.computeFeatures(product, history);

      expect(features.volatility.level).toBe('zero');
    });
  });

  // ========================================
  // TESTS: Calcul des patterns
  // ========================================

  describe('Patterns', () => {
    test('devrait retourner detected=false si <14 jours', () => {
      const product = createProduct();
      const history = createSalesHistory(10);
      const features = store.computeFeatures(product, history);

      expect(features.patterns.detected).toBe(false);
    });

    test('devrait calculer les facteurs par jour de semaine', () => {
      const product = createProduct();
      const history = createSalesHistory(30, 10);
      const features = store.computeFeatures(product, history);

      expect(features.patterns.dayOfWeekFactors).toBeDefined();
      expect(Object.keys(features.patterns.dayOfWeekFactors).length).toBe(7);
    });

    test('devrait calculer le facteur weekend', () => {
      const product = createProduct();
      const history = createSalesHistory(30, 10);
      const features = store.computeFeatures(product, history);

      expect(features.patterns.weekendFactor).toBeDefined();
      expect(typeof features.patterns.weekendFactor).toBe('number');
    });
  });

  // ========================================
  // TESTS: Qualité des données
  // ========================================

  describe('Data Quality', () => {
    test('devrait retourner score=0 si pas de données', () => {
      const product = createProduct();
      const features = store.computeFeatures(product, []);

      expect(features.dataQuality.score).toBe(0);
      expect(features.dataQuality.issues).toContain('no_data');
    });

    test('devrait pénaliser <30 jours de données', () => {
      const product = createProduct();
      const history = createSalesHistory(20);
      const features = store.computeFeatures(product, history);

      expect(features.dataQuality.score).toBeLessThan(100);
      expect(features.dataQuality.issues).toContain('insufficient_data');
    });

    test('devrait avoir un bon score avec assez de données', () => {
      const product = createProduct();
      const history = createSalesHistory(90, 10);
      const features = store.computeFeatures(product, history);

      expect(features.dataQuality.score).toBeGreaterThanOrEqual(70);
    });
  });

  // ========================================
  // TESTS: API get/compute
  // ========================================

  describe('get() et compute()', () => {
    test('get devrait retourner null si pas en cache', () => {
      const result = store.get('UNKNOWN-SKU');
      expect(result).toBeNull();
    });

    test('compute devrait stocker et retourner les features', () => {
      const product = createProduct();
      const history = createSalesHistory(30);
      
      const features = store.compute('TEST-001', product, history);

      expect(features).toBeDefined();
      expect(features.sku).toBe('TEST-001');
      expect(store.features.has('TEST-001')).toBe(true);
    });

    test('get devrait retourner depuis le cache après compute', () => {
      const product = createProduct();
      const history = createSalesHistory(30);
      
      store.compute('TEST-001', product, history);
      const cached = store.get('TEST-001');

      expect(cached).toBeDefined();
      expect(cached.sku).toBe('TEST-001');
    });

    test('get devrait compter les hits/misses', () => {
      const product = createProduct();
      const history = createSalesHistory(30);
      
      store.get('UNKNOWN'); // miss
      store.compute('TEST-001', product, history);
      store.get('TEST-001'); // hit

      expect(store.stats.misses).toBe(1);
      expect(store.stats.hits).toBe(1);
    });
  });

  // ========================================
  // TESTS: computeAll (batch)
  // ========================================

  describe('computeAll()', () => {
    test('devrait calculer les features pour plusieurs produits', () => {
      const products = [
        createProduct({ sku: 'PROD-001' }),
        createProduct({ sku: 'PROD-002' }),
        createProduct({ sku: 'PROD-003' })
      ];
      const historyBySku = {
        'PROD-001': createSalesHistory(30),
        'PROD-002': createSalesHistory(30),
        'PROD-003': createSalesHistory(30)
      };

      const result = store.computeAll(products, historyBySku);

      expect(result.computed).toBe(3);
      expect(result.total).toBe(3);
      expect(store.features.size).toBe(3);
    });

    test('devrait skipper les features récentes', () => {
      const products = [createProduct({ sku: 'PROD-001' })];
      const history = createSalesHistory(30);

      // Premier calcul
      store.compute('PROD-001', products[0], history);

      // Deuxième calcul batch
      const result = store.computeAll(products, { 'PROD-001': history });

      expect(result.skipped).toBe(1);
      expect(result.computed).toBe(0);
    });
  });

  // ========================================
  // TESTS: invalidate et clear
  // ========================================

  describe('invalidate() et clear()', () => {
    test('invalidate devrait supprimer un SKU', () => {
      const product = createProduct();
      const history = createSalesHistory(30);
      
      store.compute('TEST-001', product, history);
      expect(store.features.has('TEST-001')).toBe(true);
      
      store.invalidate('TEST-001');
      expect(store.features.has('TEST-001')).toBe(false);
    });

    test('clear devrait vider tout le store', () => {
      const products = [
        createProduct({ sku: 'PROD-001' }),
        createProduct({ sku: 'PROD-002' })
      ];
      
      products.forEach(p => store.compute(p.sku, p, []));
      expect(store.features.size).toBe(2);
      
      store.clear();
      expect(store.features.size).toBe(0);
    });
  });

  // ========================================
  // TESTS: getStats
  // ========================================

  describe('getStats()', () => {
    test('devrait retourner les statistiques correctes', () => {
      const product = createProduct();
      const history = createSalesHistory(30);
      
      store.get('MISS-1'); // miss
      store.get('MISS-2'); // miss
      store.compute('TEST-001', product, history); // computation
      store.get('TEST-001'); // hit

      const stats = store.getStats();

      expect(stats.size).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.computations).toBeGreaterThanOrEqual(1);
      expect(stats.hitRate).toBeDefined();
    });
  });

  // ========================================
  // TESTS: export
  // ========================================

  describe('export()', () => {
    test('devrait exporter toutes les données', () => {
      const product = createProduct();
      store.compute('TEST-001', product, []);

      const exported = store.export();

      expect(exported.metadata).toBeDefined();
      expect(exported.stats).toBeDefined();
      expect(exported.features).toBeDefined();
      expect(exported.features['TEST-001']).toBeDefined();
    });
  });
});

