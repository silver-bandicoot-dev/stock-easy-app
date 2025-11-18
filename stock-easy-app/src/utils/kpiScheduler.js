import { saveKPISnapshot } from '../services/kpiHistoryService';
import { calculateOverstockExcessValue } from './calculations';
import { calculateAnalyticsKPIs } from './analyticsKPIs';

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
 * @param {number} seuilSurstockProfond - Seuil de surstock profond en jours (défaut: 90)
 * @returns {object} Objet KPI
 */
function calculateKPIsFromData(products, orders, seuilSurstockProfond = 90) {
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
  // Utiliser le prix de vente (sellPrice) pour refléter les revenus perdus, pas le coût
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0 && (p.salesPerDay || 0) > 0);
  const salesLostCount = outOfStockProducts.length;
  const salesLostAmount = outOfStockProducts.reduce((sum, p) => {
    // Estimation basée sur les ventes moyennes * prix de vente
    // Utiliser sellPrice pour être cohérent avec useAnalytics et refléter les revenus perdus
    const avgDailySales = p.salesPerDay || p.avgDailySales || 0;
    const daysOutOfStock = 7; // Estimation moyenne
    const sellPrice = p.sellPrice || p.buyPrice || 0; // Utiliser prix de vente pour ventes perdues
    return sum + (avgDailySales * daysOutOfStock * sellPrice);
  }, 0);

  // Calcul du surstock profond (approche 2 : valeur de l'excédent uniquement)
  // Un produit est en surstock profond si son autonomie (daysOfStock) >= seuil configuré
  // La valeur du surstock profond = valeur de l'excédent (excédent en jours × ventes/jour × prix)
  // Utiliser la fonction utilitaire pour garantir la cohérence du calcul
  const overstockProducts = products.filter(p => p.isDeepOverstock === true);
  const overstockSKUs = overstockProducts.length;
  const overstockCost = overstockProducts.reduce((sum, p) => {
    const excessValue = calculateOverstockExcessValue(p, seuilSurstockProfond);
    return sum + excessValue;
  }, 0);

  // Calcul de la valeur de l'inventaire
  const inventoryValuation = products.reduce((sum, p) => {
    const productValue = (p.stock || 0) * (p.buyPrice || 0);
    return sum + productValue;
  }, 0);

  // Calculer les KPIs supplémentaires avec calculateAnalyticsKPIs
  // Note: formatCurrency n'est pas nécessaire ici car on utilise rawValue
  const additionalKPIs = calculateAnalyticsKPIs(products, orders, null, null);
  
  const kpis = {
    skuAvailabilityRate: Math.round(skuAvailabilityRate * 100) / 100,
    availableSKUs,
    totalSKUs,
    salesLostAmount: Math.round(salesLostAmount * 100) / 100,
    salesLostCount,
    overstockCost: Math.round(overstockCost * 100) / 100,
    overstockSKUs,
    inventoryValuation: Math.round(inventoryValuation * 100) / 100,
    // KPIs supplémentaires
    mappingPercentage: additionalKPIs.mappingPercentage?.rawValue || 0,
    totalProducts: additionalKPIs.totalProducts?.rawValue || 0,
    healthyPercentage: additionalKPIs.healthyPercentage?.rawValue || 0,
    totalGrossMargin: additionalKPIs.totalGrossMargin?.rawValue || 0,
    totalPotentialRevenue: additionalKPIs.totalPotentialRevenue?.rawValue || 0,
    fastRotatingProducts: additionalKPIs.fastRotatingProducts?.rawValue || 0
  };

  console.log('📊 KPIs calculés:', kpis);
  return kpis;
}

/**
 * Vérifie et sauvegarde un snapshot KPI si nécessaire
 * @param {string} companyId - ID de l'entreprise
 * @param {Array} products - Liste des produits
 * @param {Array} orders - Liste des commandes
 * @param {number} seuilSurstockProfond - Seuil de surstock profond en jours (défaut: 90)
 * @returns {Promise<void>}
 */
export async function checkAndSaveKPISnapshot(companyId, products, orders, seuilSurstockProfond = 90) {
  try {
    console.log('🔍 checkAndSaveKPISnapshot - Vérification pour companyId:', companyId);
    
    // Vérifier si déjà créé aujourd'hui
    if (isSnapshotCreatedToday(companyId)) {
      console.log('✅ Snapshot déjà créé aujourd\'hui, skip');
      return { success: true, message: 'Snapshot already exists for today' };
    }

    console.log('📊 Aucun snapshot trouvé pour aujourd\'hui, création en cours...');

    // Calculer les KPIs actuels
    const kpiData = calculateKPIsFromData(products, orders, seuilSurstockProfond);

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
  // Plus tard, nous migrerons vers Supabase Edge Functions avec un cron job
  
  console.log('ℹ️ Le scheduler utilise actuellement localStorage pour éviter les doublons');
  console.log('ℹ️ Migration vers Supabase Edge Functions recommandée pour production');
  
  return {
    status: 'configured',
    method: 'client-side-check',
    recommendation: 'Migrate to Supabase Edge Functions for production'
  };
}

