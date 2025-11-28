/**
 * Utilitaires de gestion des dates pour l'intégration Shopify ↔ StockEasy
 * Gère la conversion des dates UTC vers la timezone du shop
 */
import { DateTime } from 'luxon';

/**
 * Timezone par défaut si le shop n'en a pas configuré
 */
export const DEFAULT_TIMEZONE = 'Europe/Paris';

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
  if (!utcDate) {
    return DateTime.now().setZone(timezone || DEFAULT_TIMEZONE).toFormat('yyyy-MM-dd');
  }

  const tz = timezone || DEFAULT_TIMEZONE;
  
  // Si c'est une string, on la parse comme ISO
  const dateTime = typeof utcDate === 'string' 
    ? DateTime.fromISO(utcDate, { zone: 'utc' })
    : DateTime.fromJSDate(utcDate, { zone: 'utc' });

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
  return DateTime.now().setZone(timezone || DEFAULT_TIMEZONE).toFormat('yyyy-MM-dd');
};

/**
 * Obtient le début de la journée actuelle dans la timezone du shop (en UTC)
 * Utile pour les filtres de requêtes
 * 
 * @param {string} timezone - La timezone du shop
 * @returns {Date} - Date object représentant le début du jour
 */
export const getStartOfTodayUTC = (timezone) => {
  return DateTime.now()
    .setZone(timezone || DEFAULT_TIMEZONE)
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
  return DateTime.now()
    .setZone(timezone || DEFAULT_TIMEZONE)
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
  const tz = timezone || DEFAULT_TIMEZONE;
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
  const tz = timezone || DEFAULT_TIMEZONE;
  const dateTime = typeof date === 'string'
    ? DateTime.fromISO(date)
    : DateTime.fromJSDate(date);
  
  return dateTime.setZone(tz).toFormat('yyyy-MM-dd HH:mm:ss ZZZZ');
};

