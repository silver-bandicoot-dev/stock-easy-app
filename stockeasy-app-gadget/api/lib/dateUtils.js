/**
 * Utilitaires de gestion des dates pour l'intégration Shopify ↔ Stockeasy
 * Gère la conversion des dates UTC vers la timezone du shop
 */
import { DateTime } from 'luxon';

/**
 * Timezone par défaut si le shop n'en a pas configuré
 */
export const DEFAULT_TIMEZONE = 'Europe/Paris';

/**
 * Mapping des timezones Shopify (format descriptif) vers IANA
 * Shopify renvoie des timezones comme "(GMT-05:00) Eastern Time (US & Canada)"
 * Luxon a besoin d'identifiants IANA comme "America/New_York"
 */
const SHOPIFY_TIMEZONE_MAP = {
  '(GMT-12:00) International Date Line West': 'Etc/GMT+12',
  '(GMT-11:00) Midway Island': 'Pacific/Midway',
  '(GMT-10:00) Hawaii': 'Pacific/Honolulu',
  '(GMT-09:00) Alaska': 'America/Anchorage',
  '(GMT-08:00) Pacific Time (US & Canada)': 'America/Los_Angeles',
  '(GMT-07:00) Mountain Time (US & Canada)': 'America/Denver',
  '(GMT-07:00) Arizona': 'America/Phoenix',
  '(GMT-06:00) Central Time (US & Canada)': 'America/Chicago',
  '(GMT-05:00) Eastern Time (US & Canada)': 'America/New_York',
  '(GMT-05:00) Indiana (East)': 'America/Indiana/Indianapolis',
  '(GMT-04:00) Atlantic Time (Canada)': 'America/Halifax',
  '(GMT-03:30) Newfoundland': 'America/St_Johns',
  '(GMT-03:00) Buenos Aires': 'America/Argentina/Buenos_Aires',
  '(GMT-03:00) Brasilia': 'America/Sao_Paulo',
  '(GMT+00:00) London': 'Europe/London',
  '(GMT+00:00) UTC': 'UTC',
  '(GMT+01:00) Paris': 'Europe/Paris',
  '(GMT+01:00) Amsterdam': 'Europe/Amsterdam',
  '(GMT+01:00) Berlin': 'Europe/Berlin',
  '(GMT+01:00) Rome': 'Europe/Rome',
  '(GMT+01:00) Madrid': 'Europe/Madrid',
  '(GMT+02:00) Athens': 'Europe/Athens',
  '(GMT+02:00) Cairo': 'Africa/Cairo',
  '(GMT+03:00) Moscow': 'Europe/Moscow',
  '(GMT+08:00) Hong Kong': 'Asia/Hong_Kong',
  '(GMT+08:00) Singapore': 'Asia/Singapore',
  '(GMT+09:00) Tokyo': 'Asia/Tokyo',
  '(GMT+10:00) Sydney': 'Australia/Sydney',
  '(GMT+12:00) Auckland': 'Pacific/Auckland',
};

/**
 * Convertit une timezone Shopify (format descriptif) en timezone IANA
 * @param {string} shopifyTimezone - Timezone au format Shopify
 * @returns {string} - Timezone IANA valide
 */
export const normalizeTimezone = (shopifyTimezone) => {
  if (!shopifyTimezone) {
    return DEFAULT_TIMEZONE;
  }
  
  // Si c'est déjà un identifiant IANA valide (ne commence pas par "(")
  if (!shopifyTimezone.startsWith('(')) {
    // Vérifier si c'est une timezone valide en essayant de l'utiliser
    const testDate = DateTime.now().setZone(shopifyTimezone);
    if (testDate.isValid) {
      return shopifyTimezone;
    }
  }
  
  // Chercher dans le mapping
  if (SHOPIFY_TIMEZONE_MAP[shopifyTimezone]) {
    return SHOPIFY_TIMEZONE_MAP[shopifyTimezone];
  }
  
  // Essayer d'extraire l'offset GMT et utiliser un fallback
  const gmtMatch = shopifyTimezone.match(/\(GMT([+-]\d{2}):(\d{2})\)/);
  if (gmtMatch) {
    const hours = parseInt(gmtMatch[1], 10);
    // Utiliser Etc/GMT avec offset inversé (Etc/GMT+5 = UTC-5)
    const etcOffset = hours === 0 ? 'UTC' : `Etc/GMT${hours > 0 ? '-' : '+'}${Math.abs(hours)}`;
    return etcOffset;
  }
  
  // Fallback
  return DEFAULT_TIMEZONE;
};

/**
 * Convertit une date UTC en date locale du shop au format YYYY-MM-DD
 * 
 * Exemple:
 * - Date UTC: 2025-11-10T23:30:00Z (23h30 UTC le 10 novembre)
 * - Timezone shop: Europe/Paris (UTC+1)
 * - Résultat: "2025-11-11" (car 23h30 UTC = 00h30 le 11 novembre à Paris)
 * 
 * @param {Date|string} utcDate - Date en UTC (Date object ou ISO string)
 * @param {string} timezone - La timezone du shop (ex: "Europe/Paris", "America/New_York")
 * @returns {string} - Date au format YYYY-MM-DD dans la timezone du shop
 */
export const convertToShopDate = (utcDate, timezone) => {
  // Normaliser la timezone Shopify vers IANA
  const tz = normalizeTimezone(timezone);
  
  if (!utcDate) {
    return DateTime.now().setZone(tz).toFormat('yyyy-MM-dd');
  }
  
  let dateTime;
  
  // Si c'est une string, on la parse comme ISO
  if (typeof utcDate === 'string') {
    dateTime = DateTime.fromISO(utcDate, { zone: 'utc' });
  } else if (utcDate instanceof Date) {
    dateTime = DateTime.fromJSDate(utcDate, { zone: 'utc' });
  } else if (typeof utcDate === 'object' && utcDate !== null) {
    // Gadget peut renvoyer des objets DateTime ou des objets avec toISOString
    if (typeof utcDate.toISOString === 'function') {
      dateTime = DateTime.fromISO(utcDate.toISOString(), { zone: 'utc' });
    } else if (typeof utcDate.toString === 'function') {
      dateTime = DateTime.fromISO(utcDate.toString(), { zone: 'utc' });
    } else {
      // Fallback to now
      dateTime = DateTime.now().setZone('utc');
    }
  } else {
    // Fallback to now
    dateTime = DateTime.now().setZone('utc');
  }

  // Vérifier si la date est valide
  if (!dateTime.isValid) {
    console.warn(`Invalid date received: ${utcDate}, using current date`);
    dateTime = DateTime.now().setZone('utc');
  }

  // Convertir vers la timezone du shop et formater
  return dateTime.setZone(tz).toFormat('yyyy-MM-dd');
};

/**
 * Obtient la date actuelle dans la timezone du shop au format YYYY-MM-DD
 * 
 * @param {string} timezone - La timezone du shop
 * @returns {string} - Date au format YYYY-MM-DD
 */
export const getTodayInShopTimezone = (timezone) => {
  const tz = normalizeTimezone(timezone);
  return DateTime.now().setZone(tz).toFormat('yyyy-MM-dd');
};

/**
 * Obtient le début de la journée actuelle dans la timezone du shop (en UTC)
 * Utile pour les filtres de requêtes
 * 
 * @param {string} timezone - La timezone du shop
 * @returns {Date} - Date object représentant le début du jour
 */
export const getStartOfTodayUTC = (timezone) => {
  const tz = normalizeTimezone(timezone);
  return DateTime.now()
    .setZone(tz)
    .startOf('day')
    .toUTC()
    .toJSDate();
};

/**
 * Obtient la fin de la journée actuelle dans la timezone du shop (en UTC)
 * Utile pour les filtres de requêtes
 * 
 * @param {string} timezone - La timezone du shop
 * @returns {Date} - Date object représentant la fin du jour
 */
export const getEndOfTodayUTC = (timezone) => {
  const tz = normalizeTimezone(timezone);
  return DateTime.now()
    .setZone(tz)
    .endOf('day')
    .toUTC()
    .toJSDate();
};

/**
 * Convertit une période en jours en dates de début/fin dans la timezone du shop
 * 
 * @param {number} daysBack - Nombre de jours en arrière
 * @param {string} timezone - La timezone du shop
 * @returns {{startDate: Date, endDate: Date}} - Dates de début et fin en UTC
 */
export const getDateRangeUTC = (daysBack, timezone) => {
  const tz = normalizeTimezone(timezone);
  const now = DateTime.now().setZone(tz);
  
  return {
    startDate: now.minus({ days: daysBack }).startOf('day').toUTC().toJSDate(),
    endDate: now.endOf('day').toUTC().toJSDate()
  };
};

/**
 * Formate une date pour l'affichage dans les logs
 * 
 * @param {Date|string} date - Date à formater
 * @param {string} timezone - La timezone du shop
 * @returns {string} - Date formatée avec timezone
 */
export const formatDateForLog = (date, timezone) => {
  const tz = normalizeTimezone(timezone);
  const dateTime = typeof date === 'string'
    ? DateTime.fromISO(date)
    : DateTime.fromJSDate(date);
  
  return dateTime.setZone(tz).toFormat('yyyy-MM-dd HH:mm:ss ZZZZ');
};

