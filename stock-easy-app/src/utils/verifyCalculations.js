/**
 * Utilitaires de vérification des calculs de quantités à commander
 * Sert de double-vérification frontend pour garantir la cohérence avec le backend
 */

import { 
  roundToInteger, 
  roundToOneDecimal,
  divideWithPrecision,
  multiplyWithPrecision,
  addWithPrecision
} from './decimalUtils.js';

/**
 * Calcule le stock de sécurité
 * @param {Object} product - Le produit
 * @returns {number} Stock de sécurité en unités
 */
export const calculateSecurityStock = (product) => {
  // Utiliser le stock personnalisé si défini
  if (product.customSecurityStock !== undefined && 
      product.customSecurityStock !== null && 
      product.customSecurityStock > 0) {
    return roundToInteger(product.customSecurityStock);
  }
  
  // Sinon, calculer : 20% du délai de livraison
  const leadTime = product.leadTimeDays || product.leadTime || 30;
  return Math.max(1, roundToInteger(multiplyWithPrecision(leadTime, 0.2, 0)));
};

/**
 * Calcule le point de commande (reorder point)
 * @param {Object} product - Le produit
 * @returns {number} Point de commande en unités
 */
export const calculateReorderPoint = (product) => {
  const salesPerDay = product.salesPerDay || product.adjustedSales || 0;
  const leadTime = product.leadTimeDays || product.leadTime || 30;
  const securityStock = calculateSecurityStock(product);
  
  if (salesPerDay <= 0) {
    // Si pas de ventes, retourner au moins le MOQ
    return product.moq || 1;
  }
  
  // Formule : (Ventes/jour × Délai) + (Ventes/jour × Stock sécurité)
  const reorderPoint = addWithPrecision(
    multiplyWithPrecision(salesPerDay, leadTime, 0),
    multiplyWithPrecision(salesPerDay, securityStock, 0)
  );
  
  // S'assurer que le point de commande est au moins égal au MOQ
  return Math.max(roundToInteger(reorderPoint), product.moq || 1);
};

/**
 * Calcule la quantité à commander
 * @param {Object} product - Le produit
 * @returns {number} Quantité à commander en unités
 */
export const calculateQtyToOrder = (product) => {
  const currentStock = product.stock || 0;
  const reorderPoint = calculateReorderPoint(product);
  const securityStock = calculateSecurityStock(product);
  const salesPerDay = product.salesPerDay || product.adjustedSales || 0;
  const moq = product.moq || 1;
  const maxStock = product.maxStock || (currentStock + 10000);
  
  // Si stock > point de commande, pas besoin de commander
  if (currentStock > reorderPoint) {
    return 0;
  }
  
  // Calculer la quantité brute nécessaire
  let qtyToOrder = reorderPoint - currentStock + (securityStock * salesPerDay);
  
  // S'assurer que la quantité est positive
  qtyToOrder = Math.max(0, qtyToOrder);
  
  if (qtyToOrder === 0) {
    return 0;
  }
  
  // Arrondir au MOQ supérieur
  if (moq > 0) {
    qtyToOrder = Math.ceil(qtyToOrder / moq) * moq;
  }
  
  // S'assurer du MOQ minimum
  qtyToOrder = Math.max(qtyToOrder, moq);
  
  // Vérifier qu'on ne dépasse pas le stock maximum
  if (maxStock > 0 && (currentStock + qtyToOrder) > maxStock) {
    qtyToOrder = maxStock - currentStock;
    
    // Re-arrondir au MOQ inférieur
    if (moq > 0 && qtyToOrder > 0) {
      qtyToOrder = Math.floor(qtyToOrder / moq) * moq;
    }
  }
  
  // Garantir le MOQ minimum final
  if (qtyToOrder > 0 && qtyToOrder < moq) {
    qtyToOrder = moq;
  }
  
  return roundToInteger(qtyToOrder);
};

/**
 * Calcule l'autonomie en jours
 * @param {Object} product - Le produit
 * @returns {number} Nombre de jours d'autonomie
 */
export const calculateDaysOfStock = (product) => {
  const currentStock = product.stock || 0;
  const salesPerDay = product.salesPerDay || product.adjustedSales || 0;
  
  if (salesPerDay <= 0) {
    return 999; // Autonomie infinie si pas de ventes
  }
  
  return roundToOneDecimal(divideWithPrecision(currentStock, salesPerDay, 1));
};

/**
 * Vérifie la cohérence entre la valeur de la BDD et le calcul frontend
 * @param {Object} product - Le produit avec qtyToOrder de la BDD
 * @returns {Object} Résultat de la vérification
 */
export const verifyQtyToOrder = (product) => {
  const dbValue = product.qtyToOrder || 0;
  const calculatedValue = calculateQtyToOrder(product);
  const moq = product.moq || 1;
  
  // Tolérance : une différence inférieure au MOQ est acceptable
  const diff = Math.abs(dbValue - calculatedValue);
  const isConsistent = diff < moq;
  
  const result = {
    sku: product.sku,
    name: product.name,
    database: dbValue,
    calculated: calculatedValue,
    difference: diff,
    isConsistent,
    details: {
      stock: product.stock,
      salesPerDay: product.salesPerDay,
      reorderPoint: calculateReorderPoint(product),
      securityStock: calculateSecurityStock(product),
      moq: product.moq,
      leadTimeDays: product.leadTimeDays
    }
  };
  
  if (!isConsistent) {
    console.warn(`⚠️ Incohérence détectée pour ${product.sku}:`, result);
  }
  
  return result;
};

/**
 * Vérifie tous les produits et retourne un rapport
 * @param {Array} products - Liste des produits
 * @returns {Object} Rapport de vérification
 */
export const verifyAllProducts = (products) => {
  const results = products.map(verifyQtyToOrder);
  
  const inconsistencies = results.filter(r => !r.isConsistent);
  const consistent = results.filter(r => r.isConsistent);
  
  const report = {
    total: results.length,
    consistent: consistent.length,
    inconsistent: inconsistencies.length,
    consistencyRate: Math.round((consistent.length / results.length) * 100),
    inconsistencies: inconsistencies.map(i => ({
      sku: i.sku,
      name: i.name,
      database: i.database,
      shouldBe: i.calculated,
      difference: i.difference
    }))
  };
  
  console.group('📊 Rapport de Vérification des Calculs');
  console.log(`Total produits: ${report.total}`);
  console.log(`✅ Cohérents: ${report.consistent} (${report.consistencyRate}%)`);
  console.log(`❌ Incohérents: ${report.inconsistent}`);
  
  if (report.inconsistent > 0) {
    console.log('\nIncohérences détectées:');
    console.table(report.inconsistencies);
    console.log('\n💡 Action recommandée: Exécuter SELECT recalculate_all_products(); dans Supabase');
  }
  
  console.groupEnd();
  
  return report;
};

/**
 * Analyse détaillée d'un produit (comme la fonction SQL)
 * @param {Object} product - Le produit à analyser
 * @returns {Object} Analyse complète
 */
export const analyzeProductCalculation = (product) => {
  const securityStock = calculateSecurityStock(product);
  const reorderPoint = calculateReorderPoint(product);
  const qtyToOrder = calculateQtyToOrder(product);
  const daysOfStock = calculateDaysOfStock(product);
  
  const needsReorder = product.stock <= reorderPoint;
  
  const analysis = {
    sku: product.sku,
    name: product.name,
    
    donneesBase: {
      stockActuel: product.stock,
      ventesJour: product.salesPerDay,
      leadTimeDays: product.leadTimeDays,
      moq: product.moq,
      stockMax: product.maxStock
    },
    
    calculs: {
      stockSecurite: securityStock,
      stockSecuritePersonnalise: product.customSecurityStock,
      pointCommande: reorderPoint,
      autonomieJours: daysOfStock
    },
    
    resultat: {
      quantiteCommander: qtyToOrder,
      besoinCommander: needsReorder,
      raison: needsReorder
        ? `Stock (${product.stock}) ≤ Point de commande (${reorderPoint})`
        : `Stock (${product.stock}) > Point de commande (${reorderPoint}) - Pas besoin de commander`
    },
    
    formules: {
      stockSecurite: '20% du délai de livraison',
      pointCommande: '(Ventes/jour × Délai) + (Ventes/jour × Stock sécu)',
      quantiteCommander: 'Point commande - Stock + Buffer, arrondi au MOQ'
    },
    
    comparaisonBDD: {
      valeurBDD: product.qtyToOrder,
      valeurCalculee: qtyToOrder,
      coherent: Math.abs((product.qtyToOrder || 0) - qtyToOrder) < (product.moq || 1)
    }
  };
  
  console.group(`📊 Analyse Détaillée - ${product.sku}`);
  console.log('Données de base:', analysis.donneesBase);
  console.log('Calculs intermédiaires:', analysis.calculs);
  console.log('Résultat:', analysis.resultat);
  console.log('Comparaison BDD:', analysis.comparaisonBDD);
  console.groupEnd();
  
  return analysis;
};

/**
 * Utilise la valeur calculée si la BDD est incohérente
 * @param {Object} product - Le produit
 * @returns {Object} Produit avec qtyToOrder corrigée
 */
export const useCalculatedIfInconsistent = (product) => {
  const verification = verifyQtyToOrder(product);
  
  if (!verification.isConsistent) {
    return {
      ...product,
      qtyToOrder: verification.calculated,
      _qtyToOrderCorrected: true,
      _originalQtyToOrder: verification.database
    };
  }
  
  return product;
};

// Export tout pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.verifyCalculations = {
    calculateSecurityStock,
    calculateReorderPoint,
    calculateQtyToOrder,
    calculateDaysOfStock,
    verifyQtyToOrder,
    verifyAllProducts,
    analyzeProductCalculation,
    useCalculatedIfInconsistent
  };
  
  console.log('✅ Fonctions de vérification disponibles: window.verifyCalculations');
}

export default {
  calculateSecurityStock,
  calculateReorderPoint,
  calculateQtyToOrder,
  calculateDaysOfStock,
  verifyQtyToOrder,
  verifyAllProducts,
  analyzeProductCalculation,
  useCalculatedIfInconsistent
};

