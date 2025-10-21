/**
 * Service de collecte et préparation des données pour ML
 * @module services/ml/dataCollector
 */

import { getAllData } from '../apiService';
import { isHoliday as checkIsHoliday } from './holidayService';

/**
 * Collecte l'historique des ventes depuis l'API
 * @returns {Promise<Array>} Historique des ventes préparé pour ML
 */
export async function collectSalesHistory() {
  try {
    console.log('📊 Collecte des données de ventes...');
    
    const allData = await getAllData();
    const salesHistory = prepareSalesData(allData.products);
    
    console.log(`✅ ${salesHistory.length} enregistrements collectés`);
    return salesHistory;
    
  } catch (error) {
    console.error('❌ Erreur lors de la collecte des données:', error);
    throw error;
  }
}

/**
 * Prépare les données brutes pour l'entraînement ML
 * @param {Array} products - Liste des produits
 * @returns {Array} Données formatées pour ML
 */
function prepareSalesData(products) {
  const salesHistory = [];
  const today = new Date();
  
  // Pour chaque produit
  for (const product of products) {
    // Générer l'historique sur 90 jours
    for (let daysAgo = 0; daysAgo < 90; daysAgo++) {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      
      // Simuler des ventes quotidiennes basées sur sales30d
      // Note: Dans une vraie app, vous auriez l'historique réel
      const dailySales = Math.max(0, Math.round(
        product.salesPerDay + (Math.random() - 0.5) * product.salesPerDay * 0.3
      ));
      
      salesHistory.push({
        sku: product.sku,
        date: date.toISOString().split('T')[0],
        quantity: dailySales,
        dayOfWeek: date.getDay(), // 0-6 (dimanche-samedi)
        month: date.getMonth() + 1, // 1-12
        isWeekend: [0, 6].includes(date.getDay()),
        isHoliday: isHoliday(date),
        price: product.sellPrice || 0
      });
    }
  }
  
  return salesHistory;
}

/**
 * Vérifie si une date est un jour férié
 * @param {Date} date
 * @returns {boolean}
 */
function isHoliday(date) {
  // Jours fériés français 2025
  const holidays = [
    '2025-01-01', // Nouvel An
    '2025-04-21', // Lundi de Pâques
    '2025-05-01', // Fête du Travail
    '2025-05-08', // Victoire 1945
    '2025-05-29', // Ascension
    '2025-06-09', // Lundi de Pentecôte
    '2025-07-14', // Fête Nationale
    '2025-08-15', // Assomption
    '2025-11-01', // Toussaint
    '2025-11-11', // Armistice
    '2025-12-25', // Noël
  ];
  
  const dateStr = date.toISOString().split('T')[0];
  return holidays.includes(dateStr);
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
    return { count: 0, avgQuantity: 0, minQuantity: 0, maxQuantity: 0 };
  }
  
  const quantities = salesHistory.map(s => s.quantity);
  
  return {
    count: salesHistory.length,
    avgQuantity: quantities.reduce((a, b) => a + b, 0) / quantities.length,
    minQuantity: Math.min(...quantities),
    maxQuantity: Math.max(...quantities),
    totalQuantity: quantities.reduce((a, b) => a + b, 0)
  };
}
