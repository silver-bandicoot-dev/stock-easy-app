/**
 * Service de collecte et préparation des données pour ML
 * @module services/ml/dataCollector
 */

import { getAllData, getSalesHistory as fetchSalesHistory } from '../apiAdapter';

const DEFAULT_HISTORY_DAYS = 180;
const FIXED_HOLIDAYS = new Set(['01-01', '05-01', '05-08', '07-14', '08-15', '11-01', '11-11', '12-25']);

/**
 * Collecte l'historique des ventes depuis l'API
 * @param {Array} products - Liste des produits déjà chargés (optionnel)
 * @param {Object} options - Options de collecte (sku, startDate, endDate, days)
 * @returns {Promise<Array>} Historique des ventes préparé pour ML
 */
export async function collectSalesHistory(products = [], options = {}) {
  try {
    console.log('📊 Collecte des données de ventes réelles...');

    const {
      sku = null,
      startDate = null,
      endDate = null,
      days = DEFAULT_HISTORY_DAYS
    } = options;

    const start = normalizeDateInput(startDate) ?? computeStartDate(days);
    const end = normalizeDateInput(endDate);

    const salesData = await fetchSalesHistory({
      sku,
      startDate: start,
      endDate: end
    });

    let productList = Array.isArray(products) ? products : [];
    if (!productList || productList.length === 0) {
      const allData = await getAllData();
      productList = allData.products || [];
    }

    const productMap = new Map(productList.map(product => [product.sku, product]));

    if (!Array.isArray(salesData) || salesData.length === 0) {
      console.warn('⚠️ Aucun historique de ventes réel disponible.');
      return [];
    }

    const skuAggregates = salesData.reduce((acc, row) => {
      const qty = Number(row.quantity) || 0;
      if (!acc[row.sku]) {
        acc[row.sku] = { sum: 0, count: 0 };
      }
      acc[row.sku].sum += qty;
      acc[row.sku].count += 1;
      return acc;
    }, {});

    const history = [];

    for (const row of salesData) {
      const quantity = Number(row.quantity) || 0;
      const date = parseISODate(row.saleDate);
      if (!date) continue;

      const product = productMap.get(row.sku);
      const aggregate = skuAggregates[row.sku];
      const avgSales = aggregate?.count ? aggregate.sum / aggregate.count : deriveAvgSalesFromProduct(product);

      history.push({
        sku: row.sku,
        date: formatDate(date),
        quantity,
        dayOfWeek: date.getDay(),
        month: date.getMonth() + 1,
        isWeekend: isWeekend(date),
        isHoliday: isHoliday(date),
        price: Number(product?.sellPrice ?? product?.prixVente ?? 0),
        avgSales: Number(Number(avgSales ?? 0).toFixed(2))
      });
    }

    console.log(`✅ ${history.length} enregistrements ML prêts (${Object.keys(skuAggregates).length} SKU)`);
    return history;
  } catch (error) {
    console.error('❌ Erreur lors de la collecte des données:', error);
    throw error;
  }
}

function deriveAvgSalesFromProduct(product) {
  if (!product) return 0;
  if (product.salesPerDay !== undefined && product.salesPerDay !== null) {
    return Number(product.salesPerDay) || 0;
  }
  if (product.sales30d) {
    return Number(product.sales30d) / 30;
  }
  if (product.dailySales) {
    return Number(product.dailySales) || 0;
  }
  return 0;
}

function normalizeDateInput(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return formatDate(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
}

function computeStartDate(days = DEFAULT_HISTORY_DAYS) {
  if (!days || typeof days !== 'number') {
    return null;
  }
  const date = new Date();
  date.setDate(date.getDate() - Math.max(days, 1));
  return formatDate(date);
}

function parseISODate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isHoliday(date) {
  const key = formatDate(date).slice(5);
  return FIXED_HOLIDAYS.has(key);
}

/**
 * Filtre les données par SKU
 * @param {Array} salesHistory
 * @param {string} sku
 * @returns {Array}
 */
export function filterBySKU(salesHistory, sku) {
  return salesHistory.filter(sale => sale.sku === sku);
}

/**
 * Statistiques sur l'historique des ventes
 * @param {Array} salesHistory
 * @returns {Object}
 */
export function getSalesStatistics(salesHistory) {
  if (salesHistory.length === 0) {
    return { count: 0, avgQuantity: 0, minQuantity: 0, maxQuantity: 0, totalQuantity: 0 };
  }

  const quantities = salesHistory.map(s => Number(s.quantity) || 0);

  return {
    count: salesHistory.length,
    avgQuantity: quantities.reduce((a, b) => a + b, 0) / quantities.length,
    minQuantity: Math.min(...quantities),
    maxQuantity: Math.max(...quantities),
    totalQuantity: quantities.reduce((a, b) => a + b, 0)
  };
}
