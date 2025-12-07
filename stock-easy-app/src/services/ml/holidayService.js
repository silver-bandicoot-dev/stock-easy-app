/**
 * Service de gestion des jours fériés français
 * 
 * Gère les jours fériés fixes ET mobiles (Pâques, Ascension, Pentecôte)
 * 
 * @module services/ml/holidayService
 */

// ========================================
// JOURS FÉRIÉS FIXES (même date chaque année)
// ========================================
const FIXED_HOLIDAYS = {
  '01-01': { name: 'Jour de l\'An', impact: 'high' },
  '05-01': { name: 'Fête du Travail', impact: 'high' },
  '05-08': { name: 'Victoire 1945', impact: 'medium' },
  '07-14': { name: 'Fête Nationale', impact: 'high' },
  '08-15': { name: 'Assomption', impact: 'medium' },
  '11-01': { name: 'Toussaint', impact: 'medium' },
  '11-11': { name: 'Armistice 1918', impact: 'medium' },
  '12-25': { name: 'Noël', impact: 'high' }
};

// ========================================
// ALGORITHME DE CALCUL DE PÂQUES
// Algorithme de Meeus/Jones/Butcher (valide de 1900 à 2099)
// ========================================

/**
 * Calcule la date de Pâques pour une année donnée
 * @param {number} year - L'année (ex: 2024)
 * @returns {Date} Date de Pâques
 */
export function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Ajoute des jours à une date
 * @param {Date} date - Date de base
 * @param {number} days - Nombre de jours à ajouter
 * @returns {Date} Nouvelle date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calcule tous les jours fériés mobiles pour une année
 * @param {number} year - L'année
 * @returns {Array} Liste des jours fériés mobiles avec leurs dates
 */
export function calculateMovingHolidays(year) {
  const easter = calculateEaster(year);
  
  return [
    {
      date: addDays(easter, 1),   // Lundi de Pâques = Pâques + 1
      name: 'Lundi de Pâques',
      impact: 'high',
      type: 'moving'
    },
    {
      date: addDays(easter, 39),  // Ascension = Pâques + 39 jours
      name: 'Ascension',
      impact: 'high',
      type: 'moving'
    },
    {
      date: addDays(easter, 50),  // Lundi de Pentecôte = Pâques + 50 jours
      name: 'Lundi de Pentecôte',
      impact: 'medium',
      type: 'moving'
    }
  ];
}

/**
 * Génère tous les jours fériés pour une année
 * @param {number} year - L'année
 * @returns {Map} Map avec clé = 'YYYY-MM-DD', valeur = info du jour férié
 */
export function getHolidaysForYear(year) {
  const holidays = new Map();
  
  // Ajouter les jours fériés fixes
  Object.entries(FIXED_HOLIDAYS).forEach(([monthDay, info]) => {
    const dateKey = `${year}-${monthDay}`;
    holidays.set(dateKey, { ...info, type: 'fixed' });
  });
  
  // Ajouter les jours fériés mobiles
  const movingHolidays = calculateMovingHolidays(year);
  movingHolidays.forEach(holiday => {
    const dateKey = formatDateKey(holiday.date);
    holidays.set(dateKey, {
      name: holiday.name,
      impact: holiday.impact,
      type: holiday.type
    });
  });
  
  return holidays;
}

// Cache des jours fériés par année
const holidayCache = new Map();

/**
 * Obtient les jours fériés pour une année (avec cache)
 * @param {number} year - L'année
 * @returns {Map} Map des jours fériés
 */
function getCachedHolidays(year) {
  if (!holidayCache.has(year)) {
    holidayCache.set(year, getHolidaysForYear(year));
  }
  return holidayCache.get(year);
}

/**
 * Formate une date en clé YYYY-MM-DD
 * @param {Date} date - La date
 * @returns {string} Clé formatée
 */
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Vérifie si une date est un jour férié
 * @param {Date|string} date - La date à vérifier
 * @returns {boolean} true si jour férié
 */
export function isHoliday(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const holidays = getCachedHolidays(year);
  const dateKey = formatDateKey(d);
  return holidays.has(dateKey);
}

/**
 * Obtient les informations d'un jour férié
 * @param {Date|string} date - La date
 * @returns {Object|null} Info du jour férié ou null
 */
export function getHolidayInfo(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const holidays = getCachedHolidays(year);
  const dateKey = formatDateKey(d);
  return holidays.get(dateKey) || null;
}

/**
 * Vérifie si une date est proche d'un jour férié (pour détecter les ponts)
 * @param {Date|string} date - La date
 * @param {number} daysBefore - Jours avant le férié
 * @param {number} daysAfter - Jours après le férié
 * @returns {Object|null} Info sur le jour férié proche ou null
 */
export function isNearHoliday(date, daysBefore = 1, daysAfter = 1) {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Vérifier les jours autour
  for (let offset = -daysBefore; offset <= daysAfter; offset++) {
    if (offset === 0) continue; // Ignorer le jour lui-même
    
    const checkDate = addDays(d, offset);
    const holidayInfo = getHolidayInfo(checkDate);
    
    if (holidayInfo) {
      return {
        ...holidayInfo,
        daysUntil: -offset, // Négatif = avant, positif = après
        holidayDate: checkDate
      };
    }
  }
  
  return null;
}

/**
 * Détecte si une période est un "pont" (jour entre férié et weekend)
 * @param {Date|string} date - La date
 * @returns {Object|null} Info sur le pont ou null
 */
export function detectBridge(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayOfWeek = d.getDay();
  
  // Un pont typique : Vendredi avant un weekend suivi d'un lundi férié
  // Ou Lundi après un weekend précédé d'un vendredi férié
  
  // Vendredi
  if (dayOfWeek === 5) {
    const nextMonday = addDays(d, 3);
    if (isHoliday(nextMonday)) {
      return {
        type: 'bridge_before',
        reason: `Pont avant ${getHolidayInfo(nextMonday)?.name}`,
        holidayDate: nextMonday
      };
    }
  }
  
  // Lundi
  if (dayOfWeek === 1) {
    const lastFriday = addDays(d, -3);
    if (isHoliday(lastFriday)) {
      return {
        type: 'bridge_after',
        reason: `Pont après ${getHolidayInfo(lastFriday)?.name}`,
        holidayDate: lastFriday
      };
    }
  }
  
  // Jeudi (pont du vendredi si jeudi férié)
  if (dayOfWeek === 4 && isHoliday(d)) {
    const friday = addDays(d, 1);
    return {
      type: 'bridge_likely',
      reason: `Vendredi probablement pont (${getHolidayInfo(d)?.name} jeudi)`,
      bridgeDate: friday
    };
  }
  
  return null;
}

/**
 * Obtient le facteur d'impact d'un jour sur les ventes
 * @param {Date|string} date - La date
 * @returns {Object} Facteur d'impact et raison
 */
export function getImpactFactor(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Vérifier si c'est un jour férié
  const holidayInfo = getHolidayInfo(d);
  if (holidayInfo) {
    const factors = { high: 0.3, medium: 0.5, low: 0.7 };
    return {
      factor: factors[holidayInfo.impact] || 0.5,
      reason: `Jour férié: ${holidayInfo.name}`,
      type: 'holiday'
    };
  }
  
  // Vérifier si c'est un pont
  const bridgeInfo = detectBridge(d);
  if (bridgeInfo) {
    return {
      factor: 0.6,
      reason: bridgeInfo.reason,
      type: 'bridge'
    };
  }
  
  // Vérifier si proche d'un jour férié
  const nearHoliday = isNearHoliday(d, 1, 1);
  if (nearHoliday) {
    return {
      factor: 0.8,
      reason: `Proche de ${nearHoliday.name}`,
      type: 'near_holiday'
    };
  }
  
  // Jour normal
  return {
    factor: 1.0,
    reason: null,
    type: 'normal'
  };
}

/**
 * Liste tous les jours fériés d'une année (pour affichage)
 * @param {number} year - L'année
 * @returns {Array} Liste triée des jours fériés
 */
export function listHolidaysForYear(year) {
  const holidays = getCachedHolidays(year);
  
  return Array.from(holidays.entries())
    .map(([dateKey, info]) => ({
      date: dateKey,
      ...info
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Vérifie les dates de Pâques pour validation
 * @returns {Object} Dates de Pâques pour plusieurs années
 */
export function validateEasterDates() {
  // Dates connues de Pâques pour validation
  const knownEasterDates = {
    2020: '2020-04-12',
    2021: '2021-04-04',
    2022: '2022-04-17',
    2023: '2023-04-09',
    2024: '2024-03-31',
    2025: '2025-04-20',
    2026: '2026-04-05',
    2027: '2027-03-28',
    2028: '2028-04-16',
    2029: '2029-04-01',
    2030: '2030-04-21'
  };
  
  const results = {};
  
  Object.entries(knownEasterDates).forEach(([year, expected]) => {
    const calculated = calculateEaster(parseInt(year));
    const calculatedStr = formatDateKey(calculated);
    results[year] = {
      expected,
      calculated: calculatedStr,
      valid: expected === calculatedStr
    };
  });
  
  return results;
}

// Export par défaut
export default {
  isHoliday,
  getHolidayInfo,
  isNearHoliday,
  detectBridge,
  getImpactFactor,
  calculateEaster,
  calculateMovingHolidays,
  getHolidaysForYear,
  listHolidaysForYear,
  validateEasterDates
};

