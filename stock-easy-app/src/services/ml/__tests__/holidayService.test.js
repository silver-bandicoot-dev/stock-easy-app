/**
 * Tests Unitaires - HolidayService
 * 
 * Couverture : Gestion des jours fériés français (fixes et mobiles)
 * 
 * Run: npm test holidayService.test.js
 */

import { describe, test, expect } from 'vitest';
import {
  calculateEaster,
  calculateMovingHolidays,
  isHoliday,
  getHolidayInfo,
  isNearHoliday,
  detectBridge,
  getImpactFactor,
  getHolidaysForYear,
  listHolidaysForYear,
  validateEasterDates
} from '../holidayService';

describe('HolidayService', () => {

  // ========================================
  // TESTS: Calcul de Pâques
  // ========================================

  describe('calculateEaster()', () => {
    test('devrait calculer Pâques 2024 correctement (31 mars)', () => {
      const easter = calculateEaster(2024);
      expect(easter.getFullYear()).toBe(2024);
      expect(easter.getMonth()).toBe(2); // Mars = 2
      expect(easter.getDate()).toBe(31);
    });

    test('devrait calculer Pâques 2025 correctement (20 avril)', () => {
      const easter = calculateEaster(2025);
      expect(easter.getFullYear()).toBe(2025);
      expect(easter.getMonth()).toBe(3); // Avril = 3
      expect(easter.getDate()).toBe(20);
    });

    test('devrait calculer Pâques 2026 correctement (5 avril)', () => {
      const easter = calculateEaster(2026);
      expect(easter.getFullYear()).toBe(2026);
      expect(easter.getMonth()).toBe(3); // Avril = 3
      expect(easter.getDate()).toBe(5);
    });

    test('devrait calculer Pâques 2023 correctement (9 avril)', () => {
      const easter = calculateEaster(2023);
      expect(easter.getFullYear()).toBe(2023);
      expect(easter.getMonth()).toBe(3); // Avril = 3
      expect(easter.getDate()).toBe(9);
    });

    test('devrait valider plusieurs années avec validateEasterDates', () => {
      const validation = validateEasterDates();
      
      // Vérifier que toutes les dates sont valides
      Object.values(validation).forEach(result => {
        expect(result.valid).toBe(true);
      });
    });
  });

  // ========================================
  // TESTS: Jours fériés mobiles
  // ========================================

  describe('calculateMovingHolidays()', () => {
    test('devrait calculer 3 jours fériés mobiles', () => {
      const holidays = calculateMovingHolidays(2025);
      expect(holidays).toHaveLength(3);
    });

    test('devrait inclure Lundi de Pâques (Pâques + 1)', () => {
      const holidays = calculateMovingHolidays(2025);
      const lundiPaques = holidays.find(h => h.name === 'Lundi de Pâques');
      
      expect(lundiPaques).toBeDefined();
      // Pâques 2025 = 20 avril, donc Lundi de Pâques = 21 avril
      expect(lundiPaques.date.getDate()).toBe(21);
      expect(lundiPaques.date.getMonth()).toBe(3); // Avril
    });

    test('devrait inclure Ascension (Pâques + 39)', () => {
      const holidays = calculateMovingHolidays(2025);
      const ascension = holidays.find(h => h.name === 'Ascension');
      
      expect(ascension).toBeDefined();
      // Pâques 2025 = 20 avril, donc Ascension = 29 mai
      expect(ascension.date.getDate()).toBe(29);
      expect(ascension.date.getMonth()).toBe(4); // Mai
    });

    test('devrait inclure Lundi de Pentecôte (Pâques + 50)', () => {
      const holidays = calculateMovingHolidays(2025);
      const pentecote = holidays.find(h => h.name === 'Lundi de Pentecôte');
      
      expect(pentecote).toBeDefined();
      // Pâques 2025 = 20 avril, donc Pentecôte = 9 juin
      expect(pentecote.date.getDate()).toBe(9);
      expect(pentecote.date.getMonth()).toBe(5); // Juin
    });
  });

  // ========================================
  // TESTS: isHoliday()
  // ========================================

  describe('isHoliday()', () => {
    test('devrait détecter Noël comme jour férié', () => {
      expect(isHoliday(new Date('2025-12-25'))).toBe(true);
    });

    test('devrait détecter le 14 juillet comme jour férié', () => {
      expect(isHoliday(new Date('2025-07-14'))).toBe(true);
    });

    test('devrait détecter le 1er janvier comme jour férié', () => {
      expect(isHoliday(new Date('2025-01-01'))).toBe(true);
    });

    test('devrait détecter Lundi de Pâques 2025 (21 avril)', () => {
      expect(isHoliday(new Date('2025-04-21'))).toBe(true);
    });

    test('devrait détecter Ascension 2025 (29 mai)', () => {
      expect(isHoliday(new Date('2025-05-29'))).toBe(true);
    });

    test('devrait retourner false pour un jour normal', () => {
      expect(isHoliday(new Date('2025-03-15'))).toBe(false);
    });

    test('devrait accepter une string de date', () => {
      expect(isHoliday('2025-12-25')).toBe(true);
      expect(isHoliday('2025-03-15')).toBe(false);
    });
  });

  // ========================================
  // TESTS: getHolidayInfo()
  // ========================================

  describe('getHolidayInfo()', () => {
    test('devrait retourner les infos de Noël', () => {
      const info = getHolidayInfo(new Date('2025-12-25'));
      
      expect(info).not.toBeNull();
      expect(info.name).toBe('Noël');
      expect(info.impact).toBe('high');
      expect(info.type).toBe('fixed');
    });

    test('devrait retourner les infos de l\'Ascension', () => {
      const info = getHolidayInfo(new Date('2025-05-29'));
      
      expect(info).not.toBeNull();
      expect(info.name).toBe('Ascension');
      expect(info.type).toBe('moving');
    });

    test('devrait retourner null pour un jour normal', () => {
      const info = getHolidayInfo(new Date('2025-03-15'));
      expect(info).toBeNull();
    });
  });

  // ========================================
  // TESTS: isNearHoliday()
  // ========================================

  describe('isNearHoliday()', () => {
    test('devrait détecter un jour proche de Noël', () => {
      const result = isNearHoliday(new Date('2025-12-24'), 1, 1);
      
      expect(result).not.toBeNull();
      expect(result.name).toBe('Noël');
    });

    test('devrait détecter un jour après Noël', () => {
      const result = isNearHoliday(new Date('2025-12-26'), 1, 1);
      
      expect(result).not.toBeNull();
      expect(result.name).toBe('Noël');
    });

    test('devrait retourner null si pas de jour férié proche', () => {
      const result = isNearHoliday(new Date('2025-03-15'), 1, 1);
      expect(result).toBeNull();
    });

    test('devrait respecter la plage de jours', () => {
      // 23 décembre, cherche Noël dans les 2 jours APRÈS
      const result = isNearHoliday(new Date('2025-12-23'), 0, 2);
      expect(result).not.toBeNull();
      
      // 22 décembre, cherche Noël dans les 2 jours après (25-22=3, hors plage)
      const result2 = isNearHoliday(new Date('2025-12-22'), 0, 2);
      expect(result2).toBeNull();
    });
  });

  // ========================================
  // TESTS: detectBridge()
  // ========================================

  describe('detectBridge()', () => {
    test('devrait détecter un pont le vendredi avant un lundi férié', () => {
      // Ascension 2025 = jeudi 29 mai, donc vendredi 30 mai = pont
      // Mais detectBridge cherche vendredi -> lundi férié
      // Cherchons un cas où le lundi est férié
      
      // Lundi de Pâques 2025 = 21 avril
      // Vendredi 18 avril devrait détecter le pont
      const result = detectBridge(new Date('2025-04-18'));
      
      expect(result).not.toBeNull();
      expect(result.type).toBe('bridge_before');
    });

    test('devrait détecter un jeudi férié avec vendredi pont probable', () => {
      // Ascension 2025 = jeudi 29 mai
      const result = detectBridge(new Date('2025-05-29'));
      
      expect(result).not.toBeNull();
      expect(result.type).toBe('bridge_likely');
    });

    test('devrait retourner null pour un jour normal', () => {
      const result = detectBridge(new Date('2025-03-12')); // Mercredi
      expect(result).toBeNull();
    });
  });

  // ========================================
  // TESTS: getImpactFactor()
  // ========================================

  describe('getImpactFactor()', () => {
    test('devrait retourner impact élevé pour Noël', () => {
      const result = getImpactFactor(new Date('2025-12-25'));
      
      expect(result.factor).toBe(0.3);
      expect(result.type).toBe('holiday');
      expect(result.reason).toContain('Noël');
    });

    test('devrait retourner impact moyen pour jours fériés moyens', () => {
      // 15 août = Assomption (impact medium)
      const result = getImpactFactor(new Date('2025-08-15'));
      
      expect(result.factor).toBe(0.5);
      expect(result.type).toBe('holiday');
    });

    test('devrait retourner facteur 1.0 pour jour normal', () => {
      const result = getImpactFactor(new Date('2025-03-15'));
      
      expect(result.factor).toBe(1.0);
      expect(result.type).toBe('normal');
      expect(result.reason).toBeNull();
    });

    test('devrait retourner facteur pont pour vendredi avant lundi férié', () => {
      // Vendredi 18 avril 2025 (avant Lundi de Pâques 21 avril)
      const result = getImpactFactor(new Date('2025-04-18'));
      
      expect(result.factor).toBe(0.6);
      expect(result.type).toBe('bridge');
    });
  });

  // ========================================
  // TESTS: getHolidaysForYear()
  // ========================================

  describe('getHolidaysForYear()', () => {
    test('devrait retourner 11 jours fériés pour 2025', () => {
      const holidays = getHolidaysForYear(2025);
      
      // 8 fixes + 3 mobiles = 11
      expect(holidays.size).toBe(11);
    });

    test('devrait contenir tous les jours fériés fixes', () => {
      const holidays = getHolidaysForYear(2025);
      
      expect(holidays.has('2025-01-01')).toBe(true); // Jour de l'An
      expect(holidays.has('2025-05-01')).toBe(true); // Fête du Travail
      expect(holidays.has('2025-07-14')).toBe(true); // Fête Nationale
      expect(holidays.has('2025-12-25')).toBe(true); // Noël
    });

    test('devrait contenir les jours fériés mobiles', () => {
      const holidays = getHolidaysForYear(2025);
      
      expect(holidays.has('2025-04-21')).toBe(true); // Lundi de Pâques
      expect(holidays.has('2025-05-29')).toBe(true); // Ascension
      expect(holidays.has('2025-06-09')).toBe(true); // Pentecôte
    });
  });

  // ========================================
  // TESTS: listHolidaysForYear()
  // ========================================

  describe('listHolidaysForYear()', () => {
    test('devrait retourner une liste triée par date', () => {
      const list = listHolidaysForYear(2025);
      
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(11);
      
      // Vérifier l'ordre
      expect(list[0].date).toBe('2025-01-01');
      expect(list[list.length - 1].date).toBe('2025-12-25');
    });

    test('devrait inclure les noms des jours fériés', () => {
      const list = listHolidaysForYear(2025);
      
      const noel = list.find(h => h.date === '2025-12-25');
      expect(noel.name).toBe('Noël');
      
      const ascension = list.find(h => h.date === '2025-05-29');
      expect(ascension.name).toBe('Ascension');
    });
  });

  // ========================================
  // TESTS: Années différentes
  // ========================================

  describe('Cohérence multi-années', () => {
    test('devrait avoir des dates différentes pour Pâques chaque année', () => {
      const easter2024 = calculateEaster(2024);
      const easter2025 = calculateEaster(2025);
      const easter2026 = calculateEaster(2026);
      
      // Les dates doivent être différentes
      expect(easter2024.getTime()).not.toBe(easter2025.getTime());
      expect(easter2025.getTime()).not.toBe(easter2026.getTime());
    });

    test('devrait avoir des jours fériés mobiles différents chaque année', () => {
      const holidays2024 = calculateMovingHolidays(2024);
      const holidays2025 = calculateMovingHolidays(2025);
      
      const ascension2024 = holidays2024.find(h => h.name === 'Ascension');
      const ascension2025 = holidays2025.find(h => h.name === 'Ascension');
      
      expect(ascension2024.date.getTime()).not.toBe(ascension2025.date.getTime());
    });
  });
});

