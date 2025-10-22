import { describe, it, expect } from 'vitest';
import {
  roundToDecimals,
  roundToInteger,
  roundToTwoDecimals,
  roundToOneDecimal,
  formatNumber,
  formatUnits,
  formatPrice,
  formatSalesPerDay,
  addWithPrecision,
  multiplyWithPrecision,
  divideWithPrecision
} from '../decimalUtils';

describe('decimalUtils', () => {
  describe('roundToDecimals', () => {
    it('devrait arrondir correctement à 0 décimales', () => {
      expect(roundToDecimals(85.80000000000001, 0)).toBe(86);
      expect(roundToDecimals(46.80000000000001, 0)).toBe(47);
      expect(roundToDecimals(10.4, 0)).toBe(10);
      expect(roundToDecimals(10.5, 0)).toBe(11);
    });

    it('devrait arrondir correctement à 2 décimales', () => {
      expect(roundToDecimals(85.80000000000001, 2)).toBe(85.8);
      expect(roundToDecimals(46.80000000000001, 2)).toBe(46.8);
      expect(roundToDecimals(10.456, 2)).toBe(10.46);
      expect(roundToDecimals(10.454, 2)).toBe(10.45);
    });

    it('devrait gérer les valeurs NaN', () => {
      expect(roundToDecimals(NaN, 2)).toBe(0);
      expect(roundToDecimals('abc', 2)).toBe(0);
    });
  });

  describe('roundToInteger', () => {
    it('devrait arrondir à l\'entier le plus proche', () => {
      expect(roundToInteger(85.80000000000001)).toBe(86);
      expect(roundToInteger(46.80000000000001)).toBe(47);
      expect(roundToInteger(10.4)).toBe(10);
      expect(roundToInteger(10.5)).toBe(11);
    });
  });

  describe('roundToTwoDecimals', () => {
    it('devrait arrondir à 2 décimales', () => {
      expect(roundToTwoDecimals(85.80000000000001)).toBe(85.8);
      expect(roundToTwoDecimals(46.80000000000001)).toBe(46.8);
      expect(roundToTwoDecimals(10.456)).toBe(10.46);
    });
  });

  describe('roundToOneDecimal', () => {
    it('devrait arrondir à 1 décimale', () => {
      expect(roundToOneDecimal(85.86)).toBe(85.9);
      expect(roundToOneDecimal(46.84)).toBe(46.8);
      expect(roundToOneDecimal(10.456)).toBe(10.5);
    });
  });

  describe('formatNumber', () => {
    it('devrait formater avec le bon nombre de décimales', () => {
      expect(formatNumber(85.80000000000001, 0)).toBe('86');
      expect(formatNumber(46.80000000000001, 2)).toBe('46.80');
      expect(formatNumber(10.5, 2)).toBe('10.50');
    });
  });

  describe('formatUnits', () => {
    it('devrait formater les unités sans décimales', () => {
      expect(formatUnits(85.80000000000001)).toBe('86');
      expect(formatUnits(46.80000000000001)).toBe('47');
      expect(formatUnits(100.5)).toBe('101');
    });
  });

  describe('formatPrice', () => {
    it('devrait formater les prix avec 2 décimales', () => {
      expect(formatPrice(85.80000000000001)).toBe('85.80');
      expect(formatPrice(46.80000000000001)).toBe('46.80');
      expect(formatPrice(10)).toBe('10.00');
    });
  });

  describe('formatSalesPerDay', () => {
    it('devrait formater les ventes par jour avec 1 décimale', () => {
      expect(formatSalesPerDay(85.86)).toBe('85.9');
      expect(formatSalesPerDay(46.84)).toBe('46.8');
      expect(formatSalesPerDay(10.456)).toBe('10.5');
    });
  });

  describe('addWithPrecision', () => {
    it('devrait additionner avec précision', () => {
      expect(addWithPrecision(0.1, 0.2)).toBe(0.3);
      expect(addWithPrecision(85.8, 46.8)).toBe(132.6);
      expect(addWithPrecision(10.456, 20.123)).toBe(30.58);
    });

    it('devrait gérer les valeurs invalides', () => {
      expect(addWithPrecision(10, NaN, 5)).toBe(15);
      expect(addWithPrecision(10, 'abc', 5)).toBe(15);
    });
  });

  describe('multiplyWithPrecision', () => {
    it('devrait multiplier avec précision', () => {
      expect(multiplyWithPrecision(0.1, 0.2, 2)).toBe(0.02);
      expect(multiplyWithPrecision(85.8, 2, 2)).toBe(171.6);
      expect(multiplyWithPrecision(10.5, 3, 0)).toBe(32);
    });

    it('devrait gérer les valeurs invalides', () => {
      expect(multiplyWithPrecision(NaN, 5, 2)).toBe(0);
      expect(multiplyWithPrecision('abc', 5, 2)).toBe(0);
    });
  });

  describe('divideWithPrecision', () => {
    it('devrait diviser avec précision', () => {
      expect(divideWithPrecision(10, 3, 2)).toBe(3.33);
      expect(divideWithPrecision(100, 3, 1)).toBe(33.3);
      expect(divideWithPrecision(85.8, 2, 2)).toBe(42.9);
    });

    it('devrait éviter la division par zéro', () => {
      expect(divideWithPrecision(10, 0, 2)).toBe(10);
      expect(divideWithPrecision(10, NaN, 2)).toBe(10);
    });
  });

  describe('cas d\'usage réels - problème utilisateur', () => {
    it('devrait corriger 85.80000000000001 en 86 unités', () => {
      const problematicValue = 85.80000000000001;
      expect(formatUnits(problematicValue)).toBe('86');
      expect(roundToInteger(problematicValue)).toBe(86);
    });

    it('devrait corriger 46.80000000000001 en 47 unités', () => {
      const problematicValue = 46.80000000000001;
      expect(formatUnits(problematicValue)).toBe('47');
      expect(roundToInteger(problematicValue)).toBe(47);
    });

    it('devrait formater correctement les prix avec ces valeurs', () => {
      expect(formatPrice(85.80000000000001)).toBe('85.80');
      expect(formatPrice(46.80000000000001)).toBe('46.80');
    });
  });
});

