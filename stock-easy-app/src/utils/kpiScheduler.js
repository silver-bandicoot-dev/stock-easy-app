import { saveKPISnapshot } from '../services/kpiHistoryService';

/**
 * Vérifie si un snapshot KPI a déjà été créé aujourd'hui
 * @param {string} companyId - ID de l'entreprise
 * @returns {boolean} true si déjà créé aujourd'hui
 */
function isSnapshotCreatedToday(companyId) {
  const today = new Date().toISOString().split('T')[0];
  const lastSnapshotDate = localStorage.getItem(`kpi_snapshot_${companyId}`);
  
  console.log('📅 Vérification snapshot du jour:', today);
  console.log('📅 Dernier snapshot enregistré:', lastSnapshotDate);
  
  return lastSnapshotDate === today;
}

/**
 * Marque qu'un snapshot a été créé aujourd'hui
 * @param {string} companyId - ID de l'entreprise
 */
function markSnapshotCreated(companyId) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`kpi_snapshot_${companyId}`, today);
  console.log('✅ Snapshot marqué comme créé pour:', today);
}

/**
 * Calcule les KPIs à partir des produits et commandes
 * @param {Array} products - Liste des produits
 * @param {Array} orders - Liste des commandes
 * @returns {object} Objet KPI
 */
function calculateKPIsFromData(products, orders) {
  console.log('🧮 Calcul des KPIs à partir de', products.length, 'produits et', orders.length, 'commandes');
  
  if (!products || products.length === 0) {
    console.log('⚠️ Pas de produits disponibles pour le calcul');
    return {
      skuAvailabilityRate: 0,
      availableSKUs: 0,
      totalSKUs: 0,
      salesLostAmount: 0,
      salesLostCount: 0,
      overstockCost: 0,
      overstockSKUs: 0
    };
  }

  // Calcul de la disponibilité SKU
  const totalSKUs = products.length;
  const availableSKUs = products.filter(p => (p.stock || 0) > 0).length;
  const skuAvailabilityRate = totalSKUs > 0 ? (availableSKUs / totalSKUs) * 100 : 0;

  // Calcul des ventes perdues (SKUs en rupture)
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
  const salesLostCount = outOfStockProducts.length;
  const salesLostAmount = outOfStockProducts.reduce((sum, p) => {
    // Estimation basée sur les ventes moyennes * prix
    const avgDailySales = p.salesPerDay || p.avgDailySales || 0;
    const daysOutOfStock = 7; // Estimation moyenne
    const price = p.buyPrice || p.price || 0;
    return sum + (avgDailySales * daysOutOfStock * price);
  }, 0);

  // Calcul du surstock
  const overstockProducts = products.filter(p => p.isDeepOverstock === true);
  const overstockSKUs = overstockProducts.length;
  const overstockCost = overstockProducts.reduce((sum, p) => {
    const currentStock = p.stock || 0;
    const excessStock = Math.max(0, currentStock - (p.securityStock || 0) * 2);
    const price = p.buyPrice || p.price || 0;
    return sum + (excessStock * price);
  }, 0);

  // Calcul de la valeur de l'inventaire
  const inventoryValuation = products.reduce((sum, p) => {
    const productValue = (p.stock || 0) * (p.buyPrice || 0);
    return sum + productValue;
  }, 0);

  const kpis = {
    skuAvailabilityRate: Math.round(skuAvailabilityRate * 100) / 100,
    availableSKUs,
    totalSKUs,
    salesLostAmount: Math.round(salesLostAmount * 100) / 100,
    salesLostCount,
    overstockCost: Math.round(overstockCost * 100) / 100,
    overstockSKUs,
    inventoryValuation: Math.round(inventoryValuation * 100) / 100
  };

  console.log('📊 KPIs calculés:', kpis);
  return kpis;
}

/**
 * Vérifie et sauvegarde un snapshot KPI si nécessaire
 * @param {string} companyId - ID de l'entreprise
 * @param {Array} products - Liste des produits
 * @param {Array} orders - Liste des commandes
 * @returns {Promise<void>}
 */
export async function checkAndSaveKPISnapshot(companyId, products, orders) {
  try {
    console.log('🔍 checkAndSaveKPISnapshot - Vérification pour companyId:', companyId);
    
    // Vérifier si déjà créé aujourd'hui
    if (isSnapshotCreatedToday(companyId)) {
      console.log('✅ Snapshot déjà créé aujourd\'hui, skip');
      return { success: true, message: 'Snapshot already exists for today' };
    }

    console.log('📊 Aucun snapshot trouvé pour aujourd\'hui, création en cours...');

    // Calculer les KPIs actuels
    const kpiData = calculateKPIsFromData(products, orders);

    // Sauvegarder le snapshot
    await saveKPISnapshot(companyId, kpiData);

    // Marquer comme créé
    markSnapshotCreated(companyId);

    console.log('✅ Snapshot KPI créé avec succès');
    return { success: true, message: 'Snapshot created successfully', data: kpiData };
  } catch (error) {
    console.error('❌ Erreur lors de la vérification/sauvegarde du snapshot:', error);
    throw error;
  }
}

/**
 * Configuration du scheduler KPI (pour utilisation future avec Cloud Functions)
 * Cette fonction sera appelée quotidiennement à minuit UTC
 */
export function setupKPIScheduler() {
  console.log('⚙️ setupKPIScheduler - Configuration du scheduler');
  
  // Pour l'instant, cette fonction sert de placeholder
  // Plus tard, nous migrerons vers Firebase Cloud Functions avec un cron job
  
  console.log('ℹ️ Le scheduler utilise actuellement localStorage pour éviter les doublons');
  console.log('ℹ️ Migration vers Cloud Functions recommandée pour production');
  
  return {
    status: 'configured',
    method: 'client-side-check',
    recommendation: 'Migrate to Cloud Functions for production'
  };
}

