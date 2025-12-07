/**
 * Tests Unitaires - AutoRetrainingService
 * 
 * Couverture : Réentraînement automatique du modèle ML
 * 
 * Run: npm test autoRetraining.test.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

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

// Mock des dépendances
vi.mock('../featureStore', () => ({
  featureStore: {
    clear: vi.fn()
  }
}));

vi.mock('../mlCache', () => ({
  mlCache: {
    clear: vi.fn()
  }
}));

describe('AutoRetrainingService', () => {

  // ========================================
  // DONNÉES DE TEST
  // ========================================

  const createSalesHistory = (days, avgQuantity = 10) => {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        date: date.toISOString().split('T')[0],
        quantity: Math.max(1, Math.round(avgQuantity + (Math.random() - 0.5) * avgQuantity * 0.3))
      };
    });
  };

  const createMockModel = (predictValue = 10) => ({
    predict: vi.fn((history, date) => ({
      value: predictValue,
      confidence: 0.8
    })),
    train: vi.fn(() => Promise.resolve())
  });

  let autoRetraining;

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // Réimporter pour avoir une nouvelle instance
    vi.resetModules();
    const module = await import('../autoRetraining');
    autoRetraining = module.autoRetraining;
    autoRetraining.reset();
  });

  // ========================================
  // TESTS: État initial
  // ========================================

  describe('État initial', () => {
    test('devrait avoir un état idle au démarrage', () => {
      const status = autoRetraining.getStatus();
      
      expect(status.status).toBe('idle');
      expect(status.isEnabled).toBe(true);
    });

    test('devrait indiquer qu\'une évaluation est nécessaire', () => {
      const status = autoRetraining.getStatus();
      
      expect(status.needsEvaluation).toBe(true);
      expect(status.lastEvaluation).toBeNull();
    });

    test('devrait avoir un historique vide', () => {
      const history = autoRetraining.getHistory();
      
      expect(history).toEqual([]);
    });
  });

  // ========================================
  // TESTS: Évaluation du modèle
  // ========================================

  describe('evaluateModel()', () => {
    test('devrait échouer si pas assez de données', async () => {
      const model = createMockModel();
      const history = createSalesHistory(20); // Moins que MIN_VALIDATION_SAMPLES

      const result = await autoRetraining.evaluateModel(model, history);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('insufficient_data');
    });

    test('devrait calculer MAPE et accuracy', async () => {
      const model = createMockModel(10);
      const history = createSalesHistory(100, 10);

      const result = await autoRetraining.evaluateModel(model, history);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('mape');
      expect(result).toHaveProperty('accuracy');
      expect(result).toHaveProperty('mae');
      expect(result).toHaveProperty('rmse');
    });

    test('devrait mettre à jour l\'état après évaluation', async () => {
      const model = createMockModel(10);
      const history = createSalesHistory(100, 10);

      await autoRetraining.evaluateModel(model, history);

      const status = autoRetraining.getStatus();
      expect(status.lastEvaluation).not.toBeNull();
      expect(status.currentMAPE).not.toBeNull();
      expect(status.currentAccuracy).not.toBeNull();
    });

    test('devrait indiquer needsRetraining si MAPE élevé', async () => {
      // Modèle qui prédit très mal
      const model = createMockModel(100); // Prédit 100 au lieu de ~10
      const history = createSalesHistory(100, 10);

      const result = await autoRetraining.evaluateModel(model, history);

      expect(result.success).toBe(true);
      expect(result.needsRetraining).toBe(true);
    });
  });

  // ========================================
  // TESTS: Calculs de métriques
  // ========================================

  describe('Calculs de métriques', () => {
    test('MAPE devrait être 0 pour prédictions parfaites', async () => {
      // Créer un historique fixe
      const history = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(Date.now() - (100 - i) * 86400000).toISOString().split('T')[0],
        quantity: 10
      }));
      
      // Modèle qui prédit exactement 10
      const model = createMockModel(10);

      const result = await autoRetraining.evaluateModel(model, history);

      expect(result.success).toBe(true);
      expect(result.mape).toBe(0);
      expect(result.accuracy).toBe(100);
    });

    test('accuracy devrait être entre 0 et 100', async () => {
      const model = createMockModel(10);
      const history = createSalesHistory(100, 10);

      const result = await autoRetraining.evaluateModel(model, history);

      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(100);
    });
  });

  // ========================================
  // TESTS: Réentraînement
  // ========================================

  describe('retrain()', () => {
    test('devrait échouer si pas assez de données', async () => {
      const model = createMockModel();
      const history = createSalesHistory(50); // Moins que MIN_TRAINING_SAMPLES

      const result = await autoRetraining.retrain(model, history);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('insufficient_data');
    });

    test('devrait réentraîner le modèle avec succès', async () => {
      const model = createMockModel();
      const history = createSalesHistory(150);

      const result = await autoRetraining.retrain(model, history, { validateAfter: false });

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('sampleSize');
    });

    test('devrait respecter le cooldown entre réentraînements', async () => {
      const model = createMockModel();
      const history = createSalesHistory(150);

      // Premier réentraînement
      await autoRetraining.retrain(model, history, { force: true, validateAfter: false });

      // Deuxième réentraînement immédiat
      const result = await autoRetraining.retrain(model, history, { force: false });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('cooldown');
    });

    test('devrait permettre de forcer le réentraînement', async () => {
      const model = createMockModel();
      const history = createSalesHistory(150);

      // Premier réentraînement
      await autoRetraining.retrain(model, history, { force: true, validateAfter: false });

      // Deuxième réentraînement forcé
      const result = await autoRetraining.retrain(model, history, { force: true, validateAfter: false });

      expect(result.success).toBe(true);
    });

    test('devrait mettre à jour l\'historique après réentraînement', async () => {
      const model = createMockModel();
      const history = createSalesHistory(150);

      await autoRetraining.retrain(model, history, { force: true, validateAfter: false });

      const retrainHistory = autoRetraining.getHistory();
      expect(retrainHistory.length).toBe(1);
      expect(retrainHistory[0].success).toBe(true);
    });
  });

  // ========================================
  // TESTS: Workflow automatique
  // ========================================

  describe('runWorkflow()', () => {
    test('devrait exécuter le workflow complet', async () => {
      const model = createMockModel(10);
      const history = createSalesHistory(150, 10);

      const result = await autoRetraining.runWorkflow(model, history);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('evaluation');
      expect(result).toHaveProperty('currentState');
    });

    test('devrait skipper si désactivé', async () => {
      const model = createMockModel();
      const history = createSalesHistory(150);

      autoRetraining.setEnabled(false);
      const result = await autoRetraining.runWorkflow(model, history);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('disabled');
    });
  });

  // ========================================
  // TESTS: Configuration
  // ========================================

  describe('setEnabled()', () => {
    test('devrait activer/désactiver le service', () => {
      autoRetraining.setEnabled(false);
      expect(autoRetraining.getStatus().isEnabled).toBe(false);

      autoRetraining.setEnabled(true);
      expect(autoRetraining.getStatus().isEnabled).toBe(true);
    });
  });

  // ========================================
  // TESTS: Callbacks
  // ========================================

  describe('Callbacks', () => {
    test('devrait appeler onEvaluationComplete', async () => {
      const callback = vi.fn();
      autoRetraining.registerCallbacks({ onEvaluationComplete: callback });

      const model = createMockModel(10);
      const history = createSalesHistory(100, 10);

      await autoRetraining.evaluateModel(model, history);

      expect(callback).toHaveBeenCalled();
    });

    test('devrait appeler onRetrainingStart et onRetrainingComplete', async () => {
      const startCallback = vi.fn();
      const completeCallback = vi.fn();
      autoRetraining.registerCallbacks({
        onRetrainingStart: startCallback,
        onRetrainingComplete: completeCallback
      });

      const model = createMockModel();
      const history = createSalesHistory(150);

      await autoRetraining.retrain(model, history, { force: true, validateAfter: false });

      expect(startCallback).toHaveBeenCalled();
      expect(completeCallback).toHaveBeenCalled();
    });
  });

  // ========================================
  // TESTS: Recommandations
  // ========================================

  describe('getRecommendations()', () => {
    test('devrait recommander une évaluation si jamais faite', () => {
      const recommendations = autoRetraining.getRecommendations();

      const evalRec = recommendations.find(r => r.type === 'evaluation_needed');
      expect(evalRec).toBeDefined();
      expect(evalRec.priority).toBe('high');
    });

    test('devrait recommander un réentraînement si MAPE élevé', async () => {
      const model = createMockModel(100); // Prédit très mal
      const history = createSalesHistory(100, 10);

      await autoRetraining.evaluateModel(model, history);
      const recommendations = autoRetraining.getRecommendations();

      const retrainRec = recommendations.find(r => r.type === 'retraining_recommended');
      expect(retrainRec).toBeDefined();
    });

    test('devrait indiquer bonne performance si accuracy > 85%', async () => {
      const model = createMockModel(10);
      // Historique très stable
      const history = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(Date.now() - (100 - i) * 86400000).toISOString().split('T')[0],
        quantity: 10
      }));

      await autoRetraining.evaluateModel(model, history);
      const recommendations = autoRetraining.getRecommendations();

      const goodRec = recommendations.find(r => r.type === 'good_performance');
      expect(goodRec).toBeDefined();
      expect(goodRec.priority).toBe('info');
    });
  });

  // ========================================
  // TESTS: Reset
  // ========================================

  describe('reset()', () => {
    test('devrait réinitialiser l\'état', async () => {
      const model = createMockModel(10);
      const history = createSalesHistory(100, 10);

      await autoRetraining.evaluateModel(model, history);
      autoRetraining.reset();

      const status = autoRetraining.getStatus();
      expect(status.lastEvaluation).toBeNull();
      expect(status.currentMAPE).toBeNull();
      expect(status.currentAccuracy).toBeNull();
    });

    test('devrait vider l\'historique', async () => {
      const model = createMockModel();
      const history = createSalesHistory(150);

      await autoRetraining.retrain(model, history, { force: true, validateAfter: false });
      expect(autoRetraining.getHistory().length).toBeGreaterThan(0);

      autoRetraining.reset();
      expect(autoRetraining.getHistory().length).toBe(0);
    });
  });
});

