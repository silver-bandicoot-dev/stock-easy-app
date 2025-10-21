import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DemandForecastModel } from '../demandForecastModel';

describe('DemandForecastModel', () => {
  let model;

  beforeEach(() => {
    model = new DemandForecastModel();
  });

  afterEach(() => {
    if (model) {
      model.dispose();
    }
  });

  it('devrait créer une instance', () => {
    expect(model).toBeDefined();
    expect(model.isReady()).toBe(false);
  });

  it('devrait entraîner le modèle', async () => {
    // Données de test minimales
    const salesHistory = [];
    
    for (let i = 0; i < 100; i++) {
      salesHistory.push({
        sku: 'TEST-001',
        quantity: 5 + Math.floor(Math.random() * 5),
        dayOfWeek: i % 7,
        month: (i % 12) + 1,
        isWeekend: (i % 7) === 0 || (i % 7) === 6,
        isHoliday: false,
        price: 10
      });
    }

    const history = await model.train(salesHistory, {
      epochs: 10,
      verbose: 0
    });

    expect(model.isReady()).toBe(true);
    expect(history).toBeDefined();
  }, 30000); // Timeout 30s

  it('devrait faire des prédictions', async () => {
    // Mini entraînement
    const salesHistory = [];
    for (let i = 0; i < 50; i++) {
      salesHistory.push({
        sku: 'TEST-001',
        quantity: 5,
        dayOfWeek: 1,
        month: 10,
        isWeekend: false,
        isHoliday: false,
        price: 10
      });
    }

    await model.train(salesHistory, { epochs: 5, verbose: 0 });

    const prediction = await model.predict({
      dayOfWeek: 1,
      month: 10,
      isWeekend: false,
      isHoliday: false,
      price: 10,
      avgSales: 5
    });

    expect(prediction).toBeGreaterThanOrEqual(0);
    expect(typeof prediction).toBe('number');
  }, 30000);
});

