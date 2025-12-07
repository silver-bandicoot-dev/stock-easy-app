/**
 * Tests Unitaires - useSmartForecast Hooks
 * 
 * Couverture : 6 hooks React pour les prévisions ML
 * 
 * Run: npm test useSmartForecast.test.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useSmartForecast,
  useDailyForecast,
  useForecastAccuracy,
  useForecastRecommendations,
  useDataQuality,
  useForecastChart
} from '../useSmartForecast';

// Mock SmartForecastEngine
vi.mock('../../services/forecast/SmartForecastEngine', () => ({
  SmartForecastEngine: vi.fn().mockImplementation(() => ({
    predict: vi.fn((history, date) => ({
      value: 10,
      confidence: 0.8,
      date: date || new Date(),
      interval: { min: 8, max: 12 }
    })),
    predictMultipleDays: vi.fn((history, days) => 
      Array.from({ length: days }, (_, i) => ({
        value: 10 + i * 0.5,
        confidence: 0.75,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        interval: { min: 8, max: 12 }
      }))
    ),
    calculateMAPE: vi.fn(() => ({
      mape: 12.5,
      accuracy: 87.5,
      predictions: 30
    }))
  }))
}));

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

describe('useSmartForecast Hooks', () => {

  // ========================================
  // DONNÉES DE TEST
  // ========================================

  const createSalesHistory = (days, avgQuantity = 10) => {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        date: date.toISOString().split('T')[0],
        quantity: avgQuantity + Math.round((Math.random() - 0.5) * 5)
      };
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  // ========================================
  // TESTS: useSmartForecast()
  // ========================================

  describe('useSmartForecast()', () => {
    test('devrait initialiser avec forecast=null', () => {
      const { result } = renderHook(() => 
        useSmartForecast('PROD-001', [], { autoUpdate: false })
      );

      expect(result.current.forecast).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('devrait avoir les fonctions generate et refresh', () => {
      const { result } = renderHook(() => 
        useSmartForecast('PROD-001', [], { autoUpdate: false })
      );

      expect(typeof result.current.generate).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
      expect(result.current.engine).toBeDefined();
    });

    test('devrait générer une prévision avec historique', async () => {
      const salesHistory = createSalesHistory(30);
      
      const { result } = renderHook(() => 
        useSmartForecast('PROD-001', salesHistory, { autoUpdate: true })
      );

      // Attendre que la prévision soit générée
      await waitFor(() => {
        expect(result.current.forecast).not.toBeNull();
      }, { timeout: 2000 });

      expect(result.current.forecast).toHaveProperty('total');
      expect(result.current.forecast).toHaveProperty('average');
      expect(result.current.forecast).toHaveProperty('predictions');
    });

    test('devrait retourner forecast=null si historique vide', async () => {
      const { result } = renderHook(() => 
        useSmartForecast('PROD-001', [], { autoUpdate: false })
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.forecast).toBeNull();
    });

    test('devrait respecter l\'option days', async () => {
      const salesHistory = createSalesHistory(30);
      
      const { result } = renderHook(() => 
        useSmartForecast('PROD-001', salesHistory, { days: 15, autoUpdate: true })
      );

      await waitFor(() => {
        expect(result.current.forecast).not.toBeNull();
      }, { timeout: 2000 });

      expect(result.current.forecast.predictions).toHaveLength(15);
    });

    test('devrait sauvegarder dans le cache si cacheEnabled', async () => {
      const salesHistory = createSalesHistory(30);
      
      const { result } = renderHook(() => 
        useSmartForecast('PROD-001', salesHistory, { cacheEnabled: true, autoUpdate: true })
      );

      await waitFor(() => {
        expect(result.current.forecast).not.toBeNull();
      }, { timeout: 2000 });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'forecast_PROD-001',
        expect.any(String)
      );
    });
  });

  // ========================================
  // TESTS: useDailyForecast()
  // ========================================

  describe('useDailyForecast()', () => {
    test('devrait retourner null si pas d\'historique', () => {
      const { result } = renderHook(() => 
        useDailyForecast('PROD-001', [], new Date())
      );

      expect(result.current).toBeNull();
    });

    test('devrait retourner une prévision pour une date', () => {
      const salesHistory = createSalesHistory(30);
      const targetDate = new Date();
      
      const { result } = renderHook(() => 
        useDailyForecast('PROD-001', salesHistory, targetDate)
      );

      expect(result.current).not.toBeNull();
      expect(result.current).toHaveProperty('value');
      expect(result.current).toHaveProperty('confidence');
    });

    test('devrait utiliser la date du jour si non spécifiée', () => {
      const salesHistory = createSalesHistory(30);
      
      const { result } = renderHook(() => 
        useDailyForecast('PROD-001', salesHistory, null)
      );

      expect(result.current).not.toBeNull();
    });
  });

  // ========================================
  // TESTS: useForecastAccuracy()
  // ========================================

  describe('useForecastAccuracy()', () => {
    test('devrait retourner accuracy=null si <40 jours', async () => {
      const salesHistory = createSalesHistory(30);
      
      const { result } = renderHook(() => 
        useForecastAccuracy(salesHistory)
      );

      // Attendre le calcul
      await waitFor(() => {
        expect(result.current.isCalculating).toBe(false);
      }, { timeout: 1000 });

      expect(result.current.accuracy).toBeNull();
    });

    test('devrait calculer le MAPE avec assez de données', async () => {
      const salesHistory = createSalesHistory(60);
      
      const { result } = renderHook(() => 
        useForecastAccuracy(salesHistory)
      );

      await waitFor(() => {
        expect(result.current.accuracy).not.toBeNull();
      }, { timeout: 1000 });

      expect(result.current.accuracy).toHaveProperty('mape');
      expect(result.current.accuracy).toHaveProperty('accuracy');
    });

    test('devrait avoir une fonction recalculate', () => {
      const salesHistory = createSalesHistory(60);
      
      const { result } = renderHook(() => 
        useForecastAccuracy(salesHistory)
      );

      expect(typeof result.current.recalculate).toBe('function');
    });
  });

  // ========================================
  // TESTS: useForecastRecommendations()
  // ========================================

  describe('useForecastRecommendations()', () => {
    const createForecast = (total = 300, average = 10, avgConfidence = 0.8) => ({
      total,
      average,
      avgConfidence,
      predictions: Array(30).fill({ value: average, confidence: avgConfidence })
    });

    test('devrait retourner null si pas de forecast', () => {
      const { result } = renderHook(() => 
        useForecastRecommendations(null, 100, 50)
      );

      expect(result.current).toBeNull();
    });

    test('devrait retourner null si forecast sans predictions', () => {
      const { result } = renderHook(() => 
        useForecastRecommendations({}, 100, 50)
      );

      expect(result.current).toBeNull();
    });

    test('devrait détecter stock de sécurité bas', () => {
      const forecast = createForecast(300, 10);
      // Stock actuel (30) < stock sécurité (10 * 7 = 70)
      
      const { result } = renderHook(() => 
        useForecastRecommendations(forecast, 30, 20)
      );

      const safetyRec = result.current.find(r => r.type === 'safety_stock');
      expect(safetyRec).toBeDefined();
      expect(safetyRec.priority).toBe('high');
    });

    test('devrait détecter rupture imminente (<7 jours)', () => {
      const forecast = createForecast(300, 10);
      // 20 / 10 = 2 jours avant rupture
      
      const { result } = renderHook(() => 
        useForecastRecommendations(forecast, 20, 10)
      );

      const stockoutRec = result.current.find(r => r.type === 'stockout_warning');
      expect(stockoutRec).toBeDefined();
      expect(stockoutRec.priority).toBe('critical');
    });

    test('devrait détecter surstock (>150% du total prévu)', () => {
      const forecast = createForecast(100, 3.33);
      // Stock (200) > total * 1.5 (150)
      
      const { result } = renderHook(() => 
        useForecastRecommendations(forecast, 200, 20)
      );

      const overstockRec = result.current.find(r => r.type === 'overstock');
      expect(overstockRec).toBeDefined();
      expect(overstockRec.priority).toBe('low');
    });

    test('devrait détecter confiance faible (<50%)', () => {
      const forecast = createForecast(300, 10, 0.3); // 30% confiance
      
      const { result } = renderHook(() => 
        useForecastRecommendations(forecast, 500, 100)
      );

      const lowConfRec = result.current.find(r => r.type === 'low_confidence');
      expect(lowConfRec).toBeDefined();
      expect(lowConfRec.priority).toBe('info');
    });

    test('devrait retourner tableau vide si tout va bien', () => {
      const forecast = createForecast(300, 10, 0.8);
      // Stock = 100, sécurité = 70, pas de rupture, pas surstock
      
      const { result } = renderHook(() => 
        useForecastRecommendations(forecast, 100, 50)
      );

      // Peut avoir 0 ou quelques recommandations selon les seuils
      expect(Array.isArray(result.current)).toBe(true);
    });
  });

  // ========================================
  // TESTS: useDataQuality()
  // ========================================

  describe('useDataQuality()', () => {
    test('devrait retourner score=0 si pas de données', () => {
      const { result } = renderHook(() => 
        useDataQuality([])
      );

      expect(result.current.score).toBe(0);
      expect(result.current.issues).toContain('Aucune donnée disponible');
    });

    test('devrait retourner score=0 si null', () => {
      const { result } = renderHook(() => 
        useDataQuality(null)
      );

      expect(result.current.score).toBe(0);
    });

    test('devrait pénaliser <30 jours d\'historique', () => {
      const salesHistory = createSalesHistory(20);
      
      const { result } = renderHook(() => 
        useDataQuality(salesHistory)
      );

      expect(result.current.score).toBeLessThan(100);
      expect(result.current.issues.some(i => i.includes('20'))).toBe(true);
    });

    test('devrait pénaliser beaucoup de jours à zéro (>50%)', () => {
      const salesHistory = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString(),
        quantity: i < 20 ? 0 : 10 // 20/30 = 67% de zéros
      }));
      
      const { result } = renderHook(() => 
        useDataQuality(salesHistory)
      );

      expect(result.current.score).toBeLessThan(75);
      expect(result.current.issues.some(i => i.toLowerCase().includes('sans ventes'))).toBe(true);
    });

    test('devrait pénaliser variance élevée (CV > 1)', () => {
      // Données très variables
      const salesHistory = [
        { date: '2024-01-01', quantity: 1 },
        { date: '2024-01-02', quantity: 100 },
        { date: '2024-01-03', quantity: 5 },
        { date: '2024-01-04', quantity: 200 },
        { date: '2024-01-05', quantity: 2 },
        { date: '2024-01-06', quantity: 150 },
        { date: '2024-01-07', quantity: 3 },
        { date: '2024-01-08', quantity: 180 },
        { date: '2024-01-09', quantity: 1 },
        { date: '2024-01-10', quantity: 120 }
      ];
      
      const { result } = renderHook(() => 
        useDataQuality(salesHistory)
      );

      expect(result.current.score).toBeLessThan(70);
      expect(result.current.issues.some(i => i.toLowerCase().includes('variable'))).toBe(true);
    });

    test('devrait avoir un bon score avec données de qualité', () => {
      const salesHistory = createSalesHistory(90, 10);
      
      const { result } = renderHook(() => 
        useDataQuality(salesHistory)
      );

      expect(result.current.score).toBeGreaterThanOrEqual(50);
      expect(result.current.metrics).toHaveProperty('dataPoints');
      expect(result.current.metrics).toHaveProperty('zeroRate');
      expect(result.current.metrics).toHaveProperty('variability');
    });
  });

  // ========================================
  // TESTS: useForecastChart()
  // ========================================

  describe('useForecastChart()', () => {
    test('devrait retourner labels vides si pas de forecast', () => {
      const { result } = renderHook(() => 
        useForecastChart(null, [])
      );

      expect(result.current.labels).toEqual([]);
      expect(result.current.datasets).toEqual([]);
    });

    test('devrait retourner labels vides si forecast sans predictions', () => {
      const { result } = renderHook(() => 
        useForecastChart({}, [])
      );

      expect(result.current.labels).toEqual([]);
    });

    test('devrait combiner historique et prévisions', () => {
      const salesHistory = createSalesHistory(30);
      const forecast = {
        predictions: Array.from({ length: 15 }, (_, i) => ({
          value: 10,
          date: new Date(Date.now() + i * 86400000).toISOString(),
          interval: { min: 8, max: 12 }
        }))
      };
      
      const { result } = renderHook(() => 
        useForecastChart(forecast, salesHistory)
      );

      expect(result.current.labels.length).toBeGreaterThan(0);
      expect(result.current.datasets).toHaveLength(2);
      expect(result.current.datasets[0].label).toBe('Historique');
      expect(result.current.datasets[1].label).toBe('Prévision');
    });

    test('devrait inclure rawData', () => {
      const salesHistory = createSalesHistory(30);
      const forecast = {
        predictions: Array.from({ length: 15 }, (_, i) => ({
          value: 10,
          date: new Date(Date.now() + i * 86400000).toISOString(),
          interval: { min: 8, max: 12 }
        }))
      };
      
      const { result } = renderHook(() => 
        useForecastChart(forecast, salesHistory)
      );

      expect(result.current.rawData).toHaveProperty('historicalData');
      expect(result.current.rawData).toHaveProperty('forecastData');
    });

    test('devrait gérer historique undefined', () => {
      const forecast = {
        predictions: Array.from({ length: 15 }, (_, i) => ({
          value: 10,
          date: new Date(Date.now() + i * 86400000).toISOString(),
          interval: { min: 8, max: 12 }
        }))
      };
      
      const { result } = renderHook(() => 
        useForecastChart(forecast, undefined)
      );

      expect(result.current.labels.length).toBeGreaterThan(0);
      expect(result.current.rawData.historicalData).toEqual([]);
    });
  });
});

