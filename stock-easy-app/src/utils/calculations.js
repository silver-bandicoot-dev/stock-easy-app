/**
 * Calcul des métriques de santé d'un produit
 */
export const calculateMetrics = (product, seuil = 90) => {
  const daysOfStock = product.salesPerDay > 0 
    ? Math.floor(product.stock / product.salesPerDay) 
    : 999;
  
  const securityStock = product.customSecurityStock !== undefined && product.customSecurityStock !== null 
    ? Math.round(product.customSecurityStock) 
    : Math.round(product.leadTimeDays * 0.2);
  
  let healthStatus = 'healthy';
  let healthPercentage = 100;
  
  // LOGIQUE DE CALCUL DU % SANTÉ
  // Priorité 1: Si qtyToOrder > 0, le produit est URGENT (doit être commandé)
  if (product.qtyToOrder > 0) {
    healthStatus = 'urgent';
    healthPercentage = Math.max(5, Math.min(25, (daysOfStock / securityStock) * 25));
  } else if (daysOfStock < securityStock) {
    // 🔴 URGENT: autonomie inférieure au stock de sécurité
    healthStatus = 'urgent';
    healthPercentage = Math.max(5, Math.min(25, (daysOfStock / securityStock) * 25));
  } else if (daysOfStock < securityStock * 1.2) {
    // 🟡 WARNING: autonomie entre stock sécu et stock sécu × 1.2
    healthStatus = 'warning';
    const ratio = (daysOfStock - securityStock) / (securityStock * 0.2);
    healthPercentage = 25 + (ratio * 25);
  } else {
    // 🟢 HEALTHY: autonomie > stock sécu × 1.2
    healthStatus = 'healthy';
    healthPercentage = Math.min(100, 50 + ((daysOfStock - securityStock * 1.2) / (securityStock * 2)) * 50);
  }
  
  const isDeepOverstock = daysOfStock > (seuil * 2);
  
  return {
    ...product,
    daysOfStock,
    securityStock: Math.round(securityStock),
    healthStatus,
    healthPercentage: Math.round(healthPercentage),
    isDeepOverstock,
    // Arrondir les valeurs numériques qui viennent de Google Sheets
    reorderPoint: Math.round(product.reorderPoint || 0),
    stock: Math.round(product.stock || 0),
    moq: Math.round(product.moq || 0),
    salesPerDay: Math.round((product.salesPerDay || 0) * 10) / 10, // 1 décimale
    buyPrice: Math.round((product.buyPrice || 0) * 100) / 100, // 2 décimales
    sellPrice: Math.round((product.sellPrice || 0) * 100) / 100 // 2 décimales
  };
};

/**
 * Calcule le point de réapprovisionnement
 */
export const calculateReorderPoint = (product) => {
  const avgDailySales = product.salesPerDay || 0;
  const leadTime = product.leadTimeDays || 30;
  const securityStock = product.customSecurityStock !== undefined && product.customSecurityStock !== null 
    ? Math.round(product.customSecurityStock) 
    : Math.round(leadTime * 0.2);
  
  // Calculer le point de commande et arrondir correctement
  const reorderPoint = (avgDailySales * leadTime) + (avgDailySales * securityStock);
  return Math.round(reorderPoint);
};
