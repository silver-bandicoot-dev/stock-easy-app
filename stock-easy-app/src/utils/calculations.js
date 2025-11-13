import { 
  roundToInteger, 
  roundToTwoDecimals, 
  roundToOneDecimal,
  divideWithPrecision,
  multiplyWithPrecision,
  addWithPrecision
} from './decimalUtils.js';

/**
 * Calcul des métriques de santé d'un produit
 */
export const calculateMetrics = (product, seuil = 90) => {
  const daysOfStock = product?.salesPerDay > 0 
    ? roundToOneDecimal(divideWithPrecision(product.stock ?? 0, product.salesPerDay, 1))
    : 999;
  
  const leadTime = product?.leadTimeDays ?? product?.leadTime ?? 30;
  const hasCustomSecurityStock = product?.customSecurityStock !== undefined && product.customSecurityStock !== null && product.customSecurityStock > 0;
  const computedSecurityStock = hasCustomSecurityStock
    ? product.customSecurityStock
    : multiplyWithPrecision(leadTime, 0.2, 0);
  const securityStock = Math.max(1, roundToInteger(computedSecurityStock));
  
  let healthStatus = 'healthy';
  let healthPercentage = 100;
  
  // LOGIQUE DE CALCUL DU % SANTÉ
  // Priorité 1: Si qtyToOrder > 0, le produit est URGENT (doit être commandé)
  if (product.qtyToOrder > 0) {
    healthStatus = 'urgent';
    healthPercentage = Math.max(5, Math.min(25, multiplyWithPrecision(divideWithPrecision(daysOfStock, securityStock, 2), 25, 0)));
  } else if (daysOfStock < securityStock) {
    // 🔴 URGENT: autonomie inférieure au stock de sécurité
    healthStatus = 'urgent';
    healthPercentage = Math.max(5, Math.min(25, multiplyWithPrecision(divideWithPrecision(daysOfStock, securityStock, 2), 25, 0)));
  } else if (daysOfStock < multiplyWithPrecision(securityStock, 1.2, 0)) {
    // 🟡 WARNING: autonomie entre stock sécu et stock sécu × 1.2
    healthStatus = 'warning';
    const ratio = divideWithPrecision(daysOfStock - securityStock, multiplyWithPrecision(securityStock, 0.2, 2), 2);
    healthPercentage = roundToInteger(25 + multiplyWithPrecision(ratio, 25, 2));
  } else {
    // 🟢 HEALTHY: autonomie > stock sécu × 1.2
    const securityStock120 = multiplyWithPrecision(securityStock, 1.2, 0);
    const securityStock200 = multiplyWithPrecision(securityStock, 2, 0);
    const ratio = divideWithPrecision(daysOfStock - securityStock120, securityStock200, 2);
    healthPercentage = Math.min(100, roundToInteger(50 + multiplyWithPrecision(ratio, 50, 2)));
  }
  
  const isDeepOverstock = daysOfStock >= roundToOneDecimal(seuil);
  
  return {
    ...product,
    daysOfStock,
    securityStock: roundToInteger(securityStock),
    healthStatus,
    healthPercentage: roundToInteger(healthPercentage),
    isDeepOverstock,
    // Utiliser les fonctions de précision pour arrondir les valeurs numériques
    reorderPoint: roundToInteger(product.reorderPoint || 0),
    stock: roundToInteger(product.stock || 0),
    moq: roundToInteger(product.moq || 0),
    salesPerDay: roundToOneDecimal(product.salesPerDay || 0),
    buyPrice: roundToTwoDecimals(product.buyPrice || 0),
    sellPrice: roundToTwoDecimals(product.sellPrice || 0)
  };
};

/**
 * Calcule le point de réapprovisionnement
 */
export const calculateReorderPoint = (product) => {
  const avgDailySales = product.salesPerDay || 0;
  const leadTime = product.leadTimeDays || 30;
  const securityStock = product.customSecurityStock !== undefined && product.customSecurityStock !== null 
    ? roundToInteger(product.customSecurityStock) 
    : roundToInteger(multiplyWithPrecision(leadTime, 0.2, 0));
  
  // Calculer le point de commande avec précision décimale
  const reorderPoint = addWithPrecision(
    multiplyWithPrecision(avgDailySales, leadTime, 0),
    multiplyWithPrecision(avgDailySales, securityStock, 0)
  );
  
  return roundToInteger(reorderPoint);
};
