/**
 * Utilitaire pour générer/récupérer un historique de ventes
 * 
 * Priorité d'utilisation:
 * 1. Table Supabase sales_history (vraies données)
 * 2. Commandes reçues/complétées (données indirectes)
 * 3. Génération simulée depuis salesPerDay (fallback)
 * 
 * @param {Object} product - Produit avec salesPerDay, sales30d, etc.
 * @param {number} days - Nombre de jours d'historique à générer (défaut: 90)
 * @returns {Array} Historique des ventes [{date, quantity}]
 */
export function generateSalesHistory(product, days = 90) {
  if (!product || !product.salesPerDay || product.salesPerDay === 0) {
    return [];
  }

  const salesHistory = [];
  const today = new Date();
  const baseQuantity = product.salesPerDay;
  
  // Ajouter une variation aléatoire pour rendre l'historique plus réaliste
  // Variation de ±20% autour de la moyenne
  const variation = 0.2;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Générer une quantité avec variation aléatoire
    const randomVariation = (Math.random() - 0.5) * 2 * variation; // -0.2 à +0.2
    const quantity = Math.max(0, Math.round(baseQuantity * (1 + randomVariation)));
    
    salesHistory.push({
      date: date.toISOString().split('T')[0],
      quantity: quantity
    });
  }

  return salesHistory;
}

/**
 * Génère un historique de ventes à partir des commandes reçues
 * 
 * @param {Array} orders - Liste des commandes
 * @param {string} productSku - SKU du produit
 * @param {number} days - Nombre de jours d'historique (défaut: 90)
 * @returns {Array} Historique des ventes [{date, quantity}]
 */
export function generateSalesHistoryFromOrders(orders, productSku, days = 90) {
  if (!orders || orders.length === 0) {
    return [];
  }

  const salesByDate = {};
  const today = new Date();
  
  // Parcourir les commandes reçues/complétées
  orders
    .filter(order => 
      (order.status === 'received' || order.status === 'completed') &&
      order.receivedAt
    )
    .forEach(order => {
      const orderDate = new Date(order.receivedAt);
      const daysDiff = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));
      
      // Ne garder que les commandes des X derniers jours
      if (daysDiff >= 0 && daysDiff < days) {
        const orderItems = order.items || [];
        const productItem = orderItems.find(item => item.sku === productSku);
        
        if (productItem && productItem.receivedQuantity) {
          const dateKey = orderDate.toISOString().split('T')[0];
          salesByDate[dateKey] = (salesByDate[dateKey] || 0) + productItem.receivedQuantity;
        }
      }
    });

  // Convertir en tableau et remplir les jours manquants avec 0
  const salesHistory = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    salesHistory.push({
      date: dateKey,
      quantity: salesByDate[dateKey] || 0
    });
  }

  return salesHistory;
}

/**
 * Récupère l'historique depuis Supabase (table sales_history)
 * 
 * @param {string} sku - SKU du produit
 * @param {number} days - Nombre de jours d'historique (défaut: 90)
 * @returns {Promise<Array>} Historique des ventes [{date, quantity}]
 */
export async function getSalesHistoryFromSupabase(sku, days = 90) {
  try {
    // Import dynamique pour éviter les problèmes de circular dependency
    const { getSalesHistory: getSupabaseSalesHistory } = await import('../services/apiAdapter.js');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Format: YYYY-MM-DD
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const salesData = await getSupabaseSalesHistory({
      sku,
      startDate: startDateStr,
      endDate: endDateStr
    });
    
    if (!salesData || salesData.length === 0) {
      return null;
    }
    
    // Convertir le format Supabase en format attendu
    // Supabase retourne via RPC: [{ sku, sale_date, quantity, revenue, details }]
    // Après snakeToCamel: [{ sku, saleDate, quantity, revenue, details }]
    const salesHistory = salesData.map(sale => {
      // Gérer les différents formats possibles de date
      const saleDate = sale.saleDate || sale.sale_date || sale.date;
      // Convertir en format YYYY-MM-DD si nécessaire
      const dateStr = saleDate instanceof Date 
        ? saleDate.toISOString().split('T')[0]
        : (saleDate?.split('T')[0] || saleDate);
      
      return {
        date: dateStr,
        quantity: Number(sale.quantity) || 0
      };
    }).filter(sale => sale.date); // Filtrer les entrées sans date valide
    
    // Remplir les jours manquants avec 0
    const filledHistory = [];
    const historyMap = new Map(salesHistory.map(h => [h.date, h.quantity]));
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      filledHistory.push({
        date: dateKey,
        quantity: historyMap.get(dateKey) || 0
      });
    }
    
    return filledHistory;
  } catch (error) {
    console.warn('⚠️ Erreur récupération historique Supabase:', error);
    return null;
  }
}

/**
 * Combine toutes les méthodes : Supabase → Commandes → Génération
 * 
 * @param {Object} product - Produit
 * @param {Array} orders - Liste des commandes
 * @param {number} days - Nombre de jours d'historique (défaut: 90)
 * @returns {Promise<Array>} Historique des ventes [{date, quantity}]
 */
export async function getSalesHistory(product, orders = [], days = 90) {
  if (!product || !product.sku) {
    return [];
  }

  // 1. Essayer d'abord avec Supabase (table sales_history)
  try {
    const historyFromSupabase = await getSalesHistoryFromSupabase(product.sku, days);
    
    if (historyFromSupabase && historyFromSupabase.length > 0) {
      const hasRealData = historyFromSupabase.some(h => h.quantity > 0);
      if (hasRealData) {
        console.log(`✅ Historique Supabase utilisé pour ${product.sku}`);
        return historyFromSupabase;
      }
    }
  } catch (error) {
    console.warn('⚠️ Impossible de récupérer depuis Supabase, fallback sur commandes:', error);
  }

  // 2. Essayer avec les vraies commandes
  const historyFromOrders = generateSalesHistoryFromOrders(orders, product.sku, days);
  const hasRealData = historyFromOrders.some(h => h.quantity > 0);
  if (hasRealData) {
    console.log(`✅ Historique depuis commandes utilisé pour ${product.sku}`);
    return historyFromOrders;
  }

  // 3. Fallback: générer depuis salesPerDay
  console.log(`⚠️ Génération simulée depuis salesPerDay pour ${product.sku} (pas de données réelles)`);
  return generateSalesHistory(product, days);
}

