/**
 * Calcul des métriques de santé d'un produit
 */
export const calculateMetrics = (product, seuil = 90) => {
  const daysOfStock = product.salesPerDay > 0 
    ? Math.floor(product.stock / product.salesPerDay) 
    : 999;
  
  const securityStock = product.customSecurityStock !== undefined && product.customSecurityStock !== null 
    ? product.customSecurityStock 
    : Math.round(product.leadTimeDays * 0.2);
  
  let healthStatus = 'healthy';
  let healthPercentage = 100;
  
  if (daysOfStock < securityStock) {
    healthStatus = 'urgent';
    healthPercentage = Math.max(5, Math.min(25, (daysOfStock / securityStock) * 25));
  } else if (daysOfStock < securityStock * 1.2) {
    healthStatus = 'warning';
    const ratio = (daysOfStock - securityStock) / (securityStock * 0.2);
    healthPercentage = 25 + (ratio * 25);
  } else {
    healthStatus = 'healthy';
    healthPercentage = Math.min(100, 50 + ((daysOfStock - securityStock * 1.2) / (securityStock * 2)) * 50);
  }
  
  const isDeepOverstock = daysOfStock > (seuil * 2);
  
  return {
    ...product,
    daysOfStock,
    securityStock,
    healthStatus,
    healthPercentage: Math.round(healthPercentage),
    isDeepOverstock
  };
};

/**
 * Calcule le point de réapprovisionnement
 */
export const calculateReorderPoint = (product) => {
  const avgDailySales = product.salesPerDay || 0;
  const leadTime = product.leadTimeDays || 30;
  const securityStock = product.customSecurityStock || Math.round(leadTime * 0.2);
  
  return Math.ceil((avgDailySales * leadTime) + (avgDailySales * securityStock));
};
