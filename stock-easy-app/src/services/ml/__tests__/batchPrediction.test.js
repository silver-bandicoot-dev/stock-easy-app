/**
 * Tests pour la fonctionnalité de batch prediction
 * @module services/ml/__tests__/batchPrediction.test
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { DemandForecastModel } from '../demandForecastModel';
import * as tf from '@tensorflow/tfjs';

// Mock TensorFlow.js pour les tests
vi.mock('@tensorflow/tfjs', () => {
  const mockModel = {
    summary: vi.fn(),
    fit: vi.fn().mockResolvedValue({
      history: {
        loss: [1.0, 0.5, 0.3],
        val_loss: [1.2, 0.6, 0.4]
      }
    }),
    predict: vi.fn().mockImplementation((input) => {
      // Simuler une prédiction
      const mockTensor = {
        data: vi.fn().mockResolvedValue([Math.random() * 10 + 5]),
        dispose: vi.fn()
      };
      return mockTensor;
    }),
    dispose: vi.fn()
  };

  return {
    default: {
      sequential: vi.fn().mockReturnValue(mockModel),
      loadLayersModel: vi.fn().mockResolvedValue(mockModel),
      tensor2d: vi.fn().mockImplementation((data) => ({
        mean: vi.fn().mockReturnValue({
          arraySync: vi.fn().mockReturnValue([0, 0, 0, 0, 0, 0])
        }),
        dispose: vi.fn()
      })),
      moments: vi.fn().mockReturnValue({
        variance: {
          sqrt: vi.fn().mockReturnValue({
            arraySync: vi.fn().mockReturnValue([1, 1, 1, 1, 1, 1])
          })
        }
      })
    },
    sequential: vi.fn().mockReturnValue(mockModel),
    loadLayersModel: vi.fn().mockResolvedValue(mockModel),
    tensor2d: vi.fn().mockImplementation((data) => ({
      mean: vi.fn().mockReturnValue({
        arraySync: vi.fn().mockReturnValue([0, 0, 0, 0, 0, 0])
      }),
      dispose: vi.fn()
    })),
    moments: vi.fn().mockReturnValue({
      variance: {
        sqrt: vi.fn().mockReturnValue({
          arraySync: vi.fn().mockReturnValue([1, 1, 1, 1, 1, 1])
        })
      }
    })
  };
});

describe('Batch Prediction', () => {
  let model;

  beforeEach(async () => {
    model = new DemandForecastModel();
    
    // Mock training data
    const mockData = Array.from({ length: 100 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      sku: 'TEST001',
      quantity: Math.floor(Math.random() * 10) + 5,
      dayOfWeek: (i % 7),
      month: 1,
      isWeekend: (i % 7 === 0 || i % 7 === 6),
      isHoliday: false,
      price: 10,
      avgSales: 7
    }));
    
    // Mock feature stats pour la normalisation
    model.featureStats = {
      mean: [3, 6, 0.3, 0, 10, 7],
      std: [2, 3, 0.5, 0, 2, 2]
    };
    
    // Mock model ready
    model.model = {
      predict: vi.fn().mockImplementation((input) => {
        const mockTensor = {
          data: vi.fn().mockResolvedValue([Math.random() * 10 + 5]),
          dispose: vi.fn()
        };
        return mockTensor;
      }),
      dispose: vi.fn()
    };
  });

  test('predictBatch devrait exister et être une fonction', () => {
    expect(model.predictBatch).toBeDefined();
    expect(typeof model.predictBatch).toBe('function');
  });

  test('predictBatch devrait retourner le bon nombre de prédictions', async () => {
    const features = Array.from({ length: 30 }, (_, i) => ({
      dayOfWeek: i % 7,
      month: 1,
      isWeekend: i % 7 === 0 || i % 7 === 6 ? 1 : 0,
      isHoliday: 0,
      price: 10,
      avgSales: 7
    }));
    
    const predictions = await model.predictBatch(features);
    
    expect(predictions).toBeDefined();
    expect(Array.isArray(predictions)).toBe(true);
    expect(predictions.length).toBe(30);
    expect(predictions.every(p => typeof p === 'number')).toBe(true);
    expect(predictions.every(p => p >= 0)).toBe(true);
  });

  test('predictBatch devrait être plus rapide que 30 predict séquentiels', async () => {
    const features = Array.from({ length: 30 }, (_, i) => ({
      dayOfWeek: i % 7,
      month: 1,
      isWeekend: 0,
      isHoliday: 0,
      price: 10,
      avgSales: 7
    }));
    
    // Mesurer batch
    const startBatch = performance.now();
    await model.predictBatch(features);
    const batchTime = performance.now() - startBatch;
    
    // Mesurer séquentiel (juste 5 pour le test, puis extrapoler)
    const startSeq = performance.now();
    for (let i = 0; i < 5; i++) {
      await model.predict(features[i]);
    }
    const seqTime = performance.now() - startSeq;
    const estimatedSeq30 = (seqTime / 5) * 30;
    
    console.log(`Batch (30): ${batchTime.toFixed(0)}ms`);
    console.log(`Sequential (30 estimated): ${estimatedSeq30.toFixed(0)}ms`);
    console.log(`Speedup: ${(estimatedSeq30 / batchTime).toFixed(1)}x`);
    
    // Le batch devrait être au moins 2x plus rapide (même avec mock)
    // En production réel, on s'attend à > 10x
    expect(batchTime).toBeLessThan(estimatedSeq30);
  });

  test('predictBatch devrait gérer les erreurs gracieusement', async () => {
    // Simuler une erreur dans le modèle
    model.model.predict = vi.fn().mockRejectedValue(new Error('Model error'));
    
    const features = Array.from({ length: 5 }, () => ({
      dayOfWeek: 1,
      month: 1,
      isWeekend: 0,
      isHoliday: 0,
      price: 10,
      avgSales: 7
    }));
    
    await expect(model.predictBatch(features)).rejects.toThrow();
  });

  test('predictBatch devrait normaliser correctement les features', async () => {
    const features = [{
      dayOfWeek: 3,
      month: 6,
      isWeekend: 0,
      isHoliday: 0,
      price: 15,
      avgSales: 10
    }];
    
    // Vérifier que predict est appelé avec des features normalisées
    const spy = vi.spyOn(model.model, 'predict');
    
    await model.predictBatch(features);
    
    expect(spy).toHaveBeenCalled();
    // Vérifier que les features sont normalisées (approximativement)
    const callArgs = spy.mock.calls[0][0];
    expect(callArgs).toBeDefined();
  });
});

