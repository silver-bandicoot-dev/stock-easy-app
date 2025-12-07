/**
 * Tests pour useMLMonitoring
 * @module hooks/__tests__/useMLMonitoring.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMLMonitoring, useMLAlerts, useMLHealth, useMLCacheStats } from '../useMLMonitoring';

// Mock des dépendances
vi.mock('../../services/ml/featureStore', () => ({
  featureStore: {
    getStats: vi.fn(() => ({
      size: 50,
      hits: 100,
      misses: 20,
      hitRate: '83.3%',
      computations: 150
    })),
    clear: vi.fn()
  }
}));

vi.mock('../../services/ml/mlCache', () => ({
  mlCache: {
    getStats: vi.fn(() => ({
      size: 25,
      hits: 200,
      misses: 50,
      hitRate: '80%'
    })),
    clear: vi.fn()
  }
}));

vi.mock('../../services/ml/autoRetraining', () => ({
  autoRetraining: {
    getStatus: vi.fn(() => ({
      currentMAPE: 12.5,
      currentAccuracy: 87.5,
      lastEvaluation: Date.now() - 3600000,
      lastRetraining: Date.now() - 86400000,
      status: 'idle',
      isEnabled: true,
      needsRetraining: false,
      canRetrain: true
    })),
    getHistory: vi.fn(() => [
      { timestamp: Date.now() - 86400000, success: true, newMAPE: 15 },
      { timestamp: Date.now() - 172800000, success: true, newMAPE: 18 }
    ]),
    getRecommendations: vi.fn(() => [
      { type: 'good_performance', priority: 'info', message: 'Model performing well' }
    ]),
    evaluateModel: vi.fn(async () => ({ success: true, mape: 12 })),
    retrain: vi.fn(async () => ({ success: true, duration: 1500 }))
  }
}));

describe('useMLMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('devrait charger les métriques initiales', async () => {
      const { result } = renderHook(() => useMLMonitoring({ autoRefresh: false }));

      await waitFor(() => {
        expect(result.current.metrics.isLoading).toBe(false);
      });

      expect(result.current.metrics.mape).toBe(12.5);
      expect(result.current.metrics.accuracy).toBe(87.5);
      expect(result.current.metrics.featuresCount).toBe(50);
      expect(result.current.metrics.cacheHitRate).toBe(80);
    });

    it('devrait calculer le score de santé', async () => {
      const { result } = renderHook(() => useMLMonitoring({ autoRefresh: false }));

      await waitFor(() => {
        expect(result.current.metrics.isLoading).toBe(false);
      });

      expect(result.current.metrics.healthScore).toBeGreaterThan(0);
      expect(result.current.metrics.healthStatus).toBeDefined();
    });

    it('devrait déterminer si le système est healthy', async () => {
      const { result } = renderHook(() => useMLMonitoring({ autoRefresh: false }));

      await waitFor(() => {
        expect(result.current.metrics.isLoading).toBe(false);
      });

      expect(result.current.isHealthy).toBe(true);
    });
  });

  describe('Alerts Generation', () => {
    it('devrait générer une alerte pour MAPE élevé', async () => {
      const { autoRetraining } = await import('../../services/ml/autoRetraining');
      autoRetraining.getStatus.mockReturnValue({
        currentMAPE: 30, // Au-dessus du seuil de 25%
        currentAccuracy: 70,
        status: 'idle',
        lastEvaluation: Date.now(),
        needsRetraining: true,
        canRetrain: true
      });

      const { result } = renderHook(() => useMLMonitoring({ autoRefresh: false }));

      await waitFor(() => {
        expect(result.current.metrics.isLoading).toBe(false);
      });

      const mapeAlert = result.current.metrics.alerts.find(a => a.id === 'high_mape');
      expect(mapeAlert).toBeDefined();
      expect(mapeAlert.type).toBe('error');
    });

    it('devrait générer une alerte si pas d\'évaluation', async () => {
      const { autoRetraining } = await import('../../services/ml/autoRetraining');
      autoRetraining.getStatus.mockReturnValue({
        currentMAPE: null,
        currentAccuracy: null,
        status: 'idle',
        lastEvaluation: null,
        needsRetraining: false,
        canRetrain: true
      });

      const { result } = renderHook(() => useMLMonitoring({ autoRefresh: false }));

      await waitFor(() => {
        expect(result.current.metrics.isLoading).toBe(false);
      });

      const noEvalAlert = result.current.metrics.alerts.find(a => a.id === 'no_evaluation');
      expect(noEvalAlert).toBeDefined();
      expect(noEvalAlert.action).toBe('evaluate');
    });

    it('devrait générer une alerte pour cache inefficace', async () => {
      const { autoRetraining } = await import('../../services/ml/autoRetraining');
      const { mlCache } = await import('../../services/ml/mlCache');
      
      autoRetraining.getStatus.mockReturnValue({
        currentMAPE: 15,
        currentAccuracy: 85,
        status: 'idle',
        lastEvaluation: Date.now(),
        needsRetraining: false,
        canRetrain: true
      });
      
      mlCache.getStats.mockReturnValue({
        size: 10,
        hits: 5,
        misses: 15,
        hitRate: '25%'
      });

      const { result } = renderHook(() => useMLMonitoring({ autoRefresh: false }));

      await waitFor(() => {
        expect(result.current.metrics.isLoading).toBe(false);
      });

      const cacheAlert = result.current.metrics.alerts.find(a => a.id === 'low_cache_hit');
      expect(cacheAlert).toBeDefined();
      expect(cacheAlert.type).toBe('warning');
    });
  });

  describe('Health Score Calculation', () => {
    it('devrait donner un score excellent pour de bonnes performances', async () => {
      const { autoRetraining } = await import('../../services/ml/autoRetraining');
      const { mlCache } = await import('../../services/ml/mlCache');
      
      autoRetraining.getStatus.mockReturnValue({
        currentMAPE: 8, // Excellent
        currentAccuracy: 92,
        status: 'idle',
        lastEvaluation: Date.now(),
        needsRetraining: false,
        canRetrain: true
      });
      
      mlCache.getStats.mockReturnValue({
        size: 50,
        hits: 90,
        misses: 10,
        hitRate: '90%'
      });

      const { result } = renderHook(() => useMLMonitoring({ autoRefresh: false }));

      await waitFor(() => {
        expect(result.current.metrics.isLoading).toBe(false);
      });

      expect(result.current.metrics.healthScore).toBeGreaterThanOrEqual(85);
      expect(result.current.metrics.healthStatus).toBe('excellent');
    });

    it('devrait donner un score critique pour de mauvaises performances', async () => {
      const { autoRetraining } = await import('../../services/ml/autoRetraining');
      const { mlCache } = await import('../../services/ml/mlCache');
      
      autoRetraining.getStatus.mockReturnValue({
        currentMAPE: 35, // Très mauvais
        currentAccuracy: 65,
        status: 'idle',
        lastEvaluation: Date.now(),
        needsRetraining: true,
        canRetrain: true
      });
      
      mlCache.getStats.mockReturnValue({
        size: 5,
        hits: 2,
        misses: 18,
        hitRate: '10%'
      });

      const { result } = renderHook(() => useMLMonitoring({ autoRefresh: false }));

      await waitFor(() => {
        expect(result.current.metrics.isLoading).toBe(false);
      });

      expect(result.current.metrics.healthScore).toBeLessThan(50);
      expect(result.current.metrics.healthStatus).toBe('critical');
    });
  });

  describe('Functions', () => {
    it('devrait exposer la fonction refresh', async () => {
      const { result } = renderHook(() => useMLMonitoring({ autoRefresh: false }));

      await waitFor(() => {
        expect(result.current.metrics.isLoading).toBe(false);
      });

      expect(typeof result.current.refresh).toBe('function');
    });

    it('devrait exposer la fonction clearAllCaches', async () => {
      const { result } = renderHook(() => useMLMonitoring({ autoRefresh: false }));

      await waitFor(() => {
        expect(result.current.metrics.isLoading).toBe(false);
      });

      expect(typeof result.current.clearAllCaches).toBe('function');
    });

    it('devrait exposer les fonctions d\'évaluation et retraining', async () => {
      const { result } = renderHook(() => useMLMonitoring({ autoRefresh: false }));

      await waitFor(() => {
        expect(result.current.metrics.isLoading).toBe(false);
      });

      expect(typeof result.current.triggerEvaluation).toBe('function');
      expect(typeof result.current.triggerRetraining).toBe('function');
    });
  });
});

describe('useMLAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner les alertes et leur count', async () => {
    const { autoRetraining } = await import('../../services/ml/autoRetraining');
    autoRetraining.getStatus.mockReturnValue({
      currentMAPE: 30,
      currentAccuracy: 70,
      status: 'idle',
      lastEvaluation: Date.now(),
      needsRetraining: true,
      canRetrain: true
    });

    const { result } = renderHook(() => useMLAlerts());

    await waitFor(() => {
      expect(result.current.hasAlerts).toBeDefined();
    });

    expect(result.current.hasAlerts).toBe(true);
    expect(result.current.criticalCount).toBeGreaterThanOrEqual(0);
    expect(result.current.warningCount).toBeGreaterThanOrEqual(0);
  });
});

describe('useMLHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner le statut de santé simplifié', async () => {
    const { autoRetraining } = await import('../../services/ml/autoRetraining');
    autoRetraining.getStatus.mockReturnValue({
      currentMAPE: 12.5,
      currentAccuracy: 87.5,
      status: 'idle',
      lastEvaluation: Date.now(),
      needsRetraining: false,
      canRetrain: true
    });

    const { result } = renderHook(() => useMLHealth());

    await waitFor(() => {
      expect(result.current.score).toBeDefined();
    });

    expect(result.current.score).toBeGreaterThan(0);
    expect(result.current.status).toBeDefined();
    expect(result.current.isHealthy).toBeDefined();
    expect(result.current.mape).toBe(12.5);
    expect(result.current.accuracy).toBe(87.5);
  });
});

describe('useMLCacheStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner les stats des caches', async () => {
    const { result } = renderHook(() => useMLCacheStats());

    await waitFor(() => {
      expect(result.current.mlCache).toBeDefined();
    });

    expect(result.current.mlCache.size).toBeDefined();
    expect(result.current.mlCache.hitRate).toBeDefined();
    expect(result.current.featureStore.size).toBeDefined();
    expect(result.current.featureStore.hitRate).toBeDefined();
  });
});
