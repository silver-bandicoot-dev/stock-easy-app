/**
 * Tests Unitaires - SmartForecastEngine
 * 
 * Run: npm test SmartForecastEngine.test.js
 */

import { SmartForecastEngine, quickForecast } from '../SmartForecastEngine';

describe('SmartForecastEngine', () => {
  // ========================================
  // DONNÉES DE TEST
  // ========================================

  const generateSalesData = (days, avgQuantity = 10, variance = 0.2) => {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      quantity: Math.max(0, avgQuantity + (Math.random() - 0.5) * avgQuantity * variance)
    }));
  };

  const generateTrendingData = (days, start = 10, growth = 0.05) => {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      quantity: start * Math.pow(1 + growth, i)
    }));
  };

  // ========================================
  // TESTS: Prédictions de Base
  // ========================================

  describe('Prédictions de base', () => {
    test('Devrait générer une prévision valide', () => {
      const engine = new SmartForecastEngine();
      const data = generateSalesData(60, 10);
      const forecast = engine.predict(data);

      expect(forecast).toBeDefined();
      expect(forecast.value).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence).toBeGreaterThan(0);
      expect(forecast.confidence).toBeLessThanOrEqual(1);
      expect(forecast.breakdown).toBeDefined();
    });

    test('Devrait retourner un fallback avec données insuffisantes', () => {
      const engine = new SmartForecastEngine();
      const data = generateSalesData(10);
      const forecast = engine.predict(data);

      expect(forecast.confidence).toBeLessThan(0.5);
      expect(forecast.metadata.warning).toBeDefined();
    });

    test('Devrait gérer les données vides', () => {
      const engine = new SmartForecastEngine();
      const forecast = engine.predict([]);

      expect(forecast.value).toBe(0);
      expect(forecast.confidence).toBe(0);
    });

    test('Devrait gérer les données null', () => {
      const engine = new SmartForecastEngine();
      const forecast = engine.predict(null);

      expect(forecast.value).toBe(0);
      expect(forecast.confidence).toBe(0);
    });
  });

  // ========================================
  // TESTS: Moyenne Mobile Pondérée
  // ========================================

  describe('Weighted Moving Average', () => {
    test('Devrait calculer WMA correctement', () => {
      const engine = new SmartForecastEngine({ wmaWindow: 5 });
      const data = [
        { date: '2024-01-01', quantity: 10 },
        { date: '2024-01-02', quantity: 12 },
        { date: '2024-01-03', quantity: 14 },
        { date: '2024-01-04', quantity: 16 },
        { date: '2024-01-05', quantity: 18 }
      ];

      const wma = engine.weightedMovingAverage(data);

      // WMA = (10*1 + 12*2 + 14*3 + 16*4 + 18*5) / (1+2+3+4+5)
      // WMA = (10 + 24 + 42 + 64 + 90) / 15 = 230 / 15 ≈ 15.33
      expect(wma).toBeCloseTo(15.33, 1);
    });

    test('Devrait donner plus de poids aux jours récents', () => {
      const engine = new SmartForecastEngine({ wmaWindow: 10 });
      
      // Données avec spike récent
      const dataWithSpike = [
        ...Array(9).fill({ quantity: 10 }),
        { date: '2024-01-10', quantity: 100 }
      ].map((d, i) => ({
        ...d,
        date: new Date(2024, 0, i + 1).toISOString()
      }));

      const wma = engine.weightedMovingAverage(dataWithSpike);
      const simpleAvg = 19; // (9*10 + 100) / 10

      // WMA devrait être supérieur à la moyenne simple
      // car le spike récent a plus de poids
      expect(wma).toBeGreaterThan(simpleAvg);
    });
  });

  // ========================================
  // TESTS: Détection de Tendance
  // ========================================

  describe('Trend Detection', () => {
    test('Devrait détecter une tendance haussière', () => {
      const engine = new SmartForecastEngine();
      const data = generateTrendingData(60, 10, 0.05); // +5% par jour
      const trend = engine.trendAdjustment(data);

      expect(trend).toBeGreaterThan(0);
    });

    test('Devrait détecter une tendance baissière', () => {
      const engine = new SmartForecastEngine();
      const data = generateTrendingData(60, 10, -0.03); // -3% par jour
      const trend = engine.trendAdjustment(data);

      expect(trend).toBeLessThan(0);
    });

    test('Devrait retourner 0 avec données stables', () => {
      const engine = new SmartForecastEngine();
      const data = Array.from({ length: 60 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString(),
        quantity: 10 // Toujours 10
      }));
      const trend = engine.trendAdjustment(data);

      expect(trend).toBeCloseTo(0, 1);
    });

    test('Devrait limiter la tendance à ±50%', () => {
      const engine = new SmartForecastEngine();
      
      // Tendance extrême
      const extremeData = [
        ...Array(14).fill({ quantity: 1 }),
        ...Array(14).fill({ quantity: 100 })
      ].map((d, i) => ({
        ...d,
        date: new Date(2024, 0, i + 1).toISOString()
      }));

      const trend = engine.trendAdjustment(extremeData);

      expect(trend).toBeGreaterThanOrEqual(-0.5);
      expect(trend).toBeLessThanOrEqual(0.5);
    });
  });

  // ========================================
  // TESTS: Jour de la Semaine
  // ========================================

  describe('Day of Week Pattern', () => {
    test('Devrait détecter les patterns hebdomadaires', () => {
      const engine = new SmartForecastEngine();
      
      // Lundi = 20, autres jours = 10
      const data = Array.from({ length: 60 }, (_, i) => {
        const date = new Date(2024, 0, i + 1);
        const isMonday = date.getDay() === 1;
        
        return {
          date: date.toISOString(),
          quantity: isMonday ? 20 : 10
        };
      });

      const mondayMultiplier = engine.dayOfWeekMultiplier(
        data,
        new Date(2024, 1, 5) // Un lundi
      );

      expect(mondayMultiplier).toBeGreaterThan(1);
    });

    test('Devrait retourner 1 sans pattern clair', () => {
      const engine = new SmartForecastEngine();
      const data = generateSalesData(60, 10, 0.1); // Variance faible
      
      const multiplier = engine.dayOfWeekMultiplier(
        data,
        new Date(2024, 1, 5)
      );

      expect(multiplier).toBeCloseTo(1, 0);
    });
  });

  // ========================================
  // TESTS: Saisonnalité
  // ========================================

  describe('Seasonality', () => {
    test('Devrait détecter la saisonnalité mensuelle', () => {
      const engine = new SmartForecastEngine();
      
      // Décembre = 30, autres mois = 10
      const data = Array.from({ length: 365 }, (_, i) => {
        const date = new Date(2024, 0, i + 1);
        const isDecember = date.getMonth() === 11;
        
        return {
          date: date.toISOString(),
          quantity: isDecember ? 30 : 10
        };
      });

      const decemberMultiplier = engine.seasonalityMultiplier(
        data,
        new Date(2024, 11, 1) // Décembre
      );

      expect(decemberMultiplier).toBeGreaterThan(1);
    });
  });

  // ========================================
  // TESTS: Score de Confiance
  // ========================================

  describe('Confidence Score', () => {
    test('Devrait avoir une confiance élevée avec bonne data', () => {
      const engine = new SmartForecastEngine();
      const data = generateSalesData(120, 10, 0.2); // 120 jours, variance raisonnable
      const confidence = engine.calculateConfidence(data);

      expect(confidence).toBeGreaterThan(0.7);
    });

    test('Devrait avoir une confiance faible avec peu de données', () => {
      const engine = new SmartForecastEngine();
      const data = generateSalesData(20, 10);
      const confidence = engine.calculateConfidence(data);

      expect(confidence).toBeLessThan(0.5);
    });

    test('Devrait pénaliser beaucoup de jours à zéro', () => {
      const engine = new SmartForecastEngine();
      
      const dataWithZeros = Array.from({ length: 60 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString(),
        quantity: i % 2 === 0 ? 0 : 10 // 50% de zéros
      }));

      const confidence = engine.calculateConfidence(dataWithZeros);

      expect(confidence).toBeLessThan(0.6);
    });

    test('Devrait pénaliser la haute variabilité', () => {
      const engine = new SmartForecastEngine();
      const volatileData = generateSalesData(60, 10, 2.0); // Variance élevée
      const confidence = engine.calculateConfidence(volatileData);

      expect(confidence).toBeLessThan(0.7);
    });
  });

  // ========================================
  // TESTS: Intervalle de Prédiction
  // ========================================

  describe('Prediction Interval', () => {
    test('Devrait calculer un intervalle valide', () => {
      const engine = new SmartForecastEngine();
      const data = generateSalesData(60, 10);
      const forecast = engine.predict(data);

      expect(forecast.interval.min).toBeLessThanOrEqual(forecast.value);
      expect(forecast.interval.max).toBeGreaterThanOrEqual(forecast.value);
      expect(forecast.interval.min).toBeGreaterThanOrEqual(0);
    });

    test('Intervalle devrait s\'élargir avec faible confiance', () => {
      const engine = new SmartForecastEngine();
      
      // Haute confiance
      const stableData = generateSalesData(120, 10, 0.1);
      const stableForecast = engine.predict(stableData);
      const stableRange = stableForecast.interval.max - stableForecast.interval.min;

      // Basse confiance
      const volatileData = generateSalesData(30, 10, 2.0);
      const volatileForecast = engine.predict(volatileData);
      const volatileRange = volatileForecast.interval.max - volatileForecast.interval.min;

      expect(volatileRange).toBeGreaterThan(stableRange);
    });
  });

  // ========================================
  // TESTS: Prédictions Multiples
  // ========================================

  describe('Multiple Days Prediction', () => {
    test('Devrait générer plusieurs prévisions', () => {
      const engine = new SmartForecastEngine();
      const data = generateSalesData(60, 10);
      const predictions = engine.predictMultipleDays(data, 7);

      expect(predictions).toHaveLength(7);
      predictions.forEach(pred => {
        expect(pred.date).toBeDefined();
        expect(pred.value).toBeGreaterThanOrEqual(0);
      });
    });

    test('Devrait respecter le nombre de jours demandé', () => {
      const engine = new SmartForecastEngine();
      const data = generateSalesData(60, 10);
      
      const pred7 = engine.predictMultipleDays(data, 7);
      const pred30 = engine.predictMultipleDays(data, 30);

      expect(pred7).toHaveLength(7);
      expect(pred30).toHaveLength(30);
    });
  });

  // ========================================
  // TESTS: Backtesting / MAPE
  // ========================================

  describe('Backtesting & Accuracy', () => {
    test('Devrait calculer la MAPE', () => {
      const engine = new SmartForecastEngine();
      const data = generateSalesData(90, 10, 0.2);
      const mape = engine.calculateMAPE(data);

      expect(mape).toBeDefined();
      expect(mape.mape).toBeGreaterThan(0);
      expect(mape.accuracy).toBeGreaterThan(0);
      expect(mape.tested).toBeGreaterThan(0);
    });

    test('Devrait retourner null avec données insuffisantes', () => {
      const engine = new SmartForecastEngine();
      const data = generateSalesData(30);
      const mape = engine.calculateMAPE(data);

      expect(mape).toBeNull();
    });
  });

  // ========================================
  // TESTS: Utilitaires
  // ========================================

  describe('Utility Functions', () => {
    test('average() devrait calculer correctement', () => {
      const engine = new SmartForecastEngine();
      expect(engine.average([1, 2, 3, 4, 5])).toBe(3);
      expect(engine.average([10])).toBe(10);
      expect(engine.average([])).toBe(0);
    });

    test('standardDeviation() devrait calculer correctement', () => {
      const engine = new SmartForecastEngine();
      const std = engine.standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(std).toBeCloseTo(2, 0);
    });

    test('coefficientOfVariation() devrait calculer correctement', () => {
      const engine = new SmartForecastEngine();
      const cv = engine.coefficientOfVariation([10, 12, 14, 16, 18]);
      expect(cv).toBeGreaterThan(0);
      expect(cv).toBeLessThan(1);
    });

    test('sortByDate() devrait trier correctement', () => {
      const engine = new SmartForecastEngine();
      const unsorted = [
        { date: '2024-01-05', quantity: 5 },
        { date: '2024-01-01', quantity: 1 },
        { date: '2024-01-03', quantity: 3 }
      ];
      const sorted = engine.sortByDate(unsorted);

      expect(sorted[0].quantity).toBe(1);
      expect(sorted[1].quantity).toBe(3);
      expect(sorted[2].quantity).toBe(5);
    });
  });

  // ========================================
  // TESTS: Quick Forecast Helper
  // ========================================

  describe('Quick Forecast Helper', () => {
    test('quickForecast() devrait fonctionner', () => {
      const data = generateSalesData(60, 10);
      const forecast = quickForecast(data, 1);

      expect(forecast.value).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence).toBeGreaterThan(0);
    });

    test('quickForecast() multiple days', () => {
      const data = generateSalesData(60, 10);
      const forecasts = quickForecast(data, 7);

      expect(forecasts).toHaveLength(7);
    });
  });

  // ========================================
  // TESTS: Configuration
  // ========================================

  describe('Configuration', () => {
    test('Devrait accepter des options personnalisées', () => {
      const engine = new SmartForecastEngine({
        wmaWindow: 14,
        trendWeight: 0.5,
        minHistoryDays: 20
      });

      expect(engine.config.wmaWindow).toBe(14);
      expect(engine.config.trendWeight).toBe(0.5);
      expect(engine.config.minHistoryDays).toBe(20);
    });
  });
});