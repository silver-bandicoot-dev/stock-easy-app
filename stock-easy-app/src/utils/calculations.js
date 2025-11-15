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
 * 
 * ⚠️ NOTE IMPORTANTE : Cette fonction utilise maintenant les valeurs calculées par le backend.
 * Les calculs de healthStatus et healthPercentage sont faits dans le trigger PostgreSQL
 * pour garantir la cohérence des données. Cette fonction enrichit simplement les données
 * avec des calculs locaux supplémentaires (comme isDeepOverstock) et arrondit les valeurs.
 */
export const calculateMetrics = (product, seuil = 90) => {
  // Utiliser les valeurs calculées par le backend si disponibles
  // Sinon, calculer daysOfStock localement pour compatibilité
  const daysOfStock = product?.daysOfStock !== undefined && product.daysOfStock !== null
    ? product.daysOfStock
    : (product?.salesPerDay > 0 
      ? roundToOneDecimal(divideWithPrecision(product.stock ?? 0, product.salesPerDay, 1))
      : 999);
  
  // Utiliser healthStatus et healthPercentage du backend si disponibles
  // Sinon, utiliser les valeurs par défaut
  const healthStatus = product?.healthStatus || 'healthy';
  const healthPercentage = product?.healthPercentage !== undefined && product.healthPercentage !== null
    ? product.healthPercentage
    : 100;
  
  // Utiliser securityStock du backend si disponible
  // IMPORTANT: securityStock doit être en UNITÉS, pas en jours
  // Backend: stock_securite = salesPerDay * (leadTime * 0.2) = salesPerDay * leadTime * 0.2 (unités)
  const leadTime = product?.leadTimeDays ?? product?.leadTime ?? 30;
  const salesPerDay = product?.salesPerDay || 0;
  const hasCustomSecurityStock = product?.customSecurityStock !== undefined && product.customSecurityStock !== null && product.customSecurityStock > 0;
  
  // securityStock du backend est déjà en unités
  let securityStock = product?.securityStock !== undefined && product.securityStock !== null
    ? product.securityStock
    : null;
  
  // Si pas disponible du backend, calculer en unités (pas en jours)
  if (!securityStock) {
    if (hasCustomSecurityStock) {
      // customSecurityStock est en unités (cohérent avec le backend)
      securityStock = roundToInteger(product.customSecurityStock);
    } else {
      // Calculer en unités : salesPerDay × (leadTime × 0.2)
      // = salesPerDay × leadTime × 0.2 (unités)
      const securityStockDays = multiplyWithPrecision(leadTime, 0.2, 0); // Jours
      securityStock = salesPerDay > 0 
        ? roundToInteger(multiplyWithPrecision(salesPerDay, securityStockDays, 0))
        : roundToInteger(multiplyWithPrecision(leadTime, 0.2, 0)); // Fallback : au moins 1 si pas de ventes
    }
  }
  
  // S'assurer que securityStock est au moins 1 (minimum pour éviter les valeurs nulles)
  securityStock = Math.max(1, roundToInteger(securityStock));
  
  // Calculer securityStockDays (en jours) pour l'affichage et les comparaisons
  // Ceci est cohérent avec le backend qui utilise v_security_stock_days pour les calculs de santé
  // Formule: securityStockDays = securityStock / salesPerDay (conversion unités -> jours)
  let securityStockDays = 0;
  if (salesPerDay > 0 && securityStock > 0) {
    securityStockDays = roundToOneDecimal(divideWithPrecision(securityStock, salesPerDay, 1));
  } else {
    // Si pas de ventes, utiliser la valeur par défaut en jours
    securityStockDays = roundToOneDecimal(multiplyWithPrecision(leadTime, 0.2, 0));
  }
  securityStockDays = Math.max(1, securityStockDays); // Au moins 1 jour
  
  // Détection surstock profond : un produit est en surstock profond si son autonomie
  // (daysOfStock) dépasse ou égale le seuil configuré par l'utilisateur dans les paramètres.
  // Le seuil est directement utilisé (sans multiplication) pour s'adapter aux besoins de chaque utilisateur.
  const isDeepOverstock = daysOfStock >= roundToOneDecimal(seuil);
  
  return {
    ...product,
    daysOfStock: roundToOneDecimal(daysOfStock),
    securityStock: roundToInteger(securityStock), // En unités (cohérent avec le backend stock_securite)
    securityStockDays: roundToOneDecimal(securityStockDays), // En jours (pour affichage et comparaisons)
    healthStatus, // Utilise la valeur du backend
    healthPercentage: roundToInteger(healthPercentage), // Utilise la valeur du backend
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
 * Formule cohérente avec le backend: (salesPerDay × leadTime) + securityStock
 * Où securityStock est en UNITÉS (cohérent avec le backend)
 */
export const calculateReorderPoint = (product) => {
  const avgDailySales = product.salesPerDay || 0;
  const leadTime = product.leadTimeDays || 30;
  
  // securityStock doit être en UNITÉS (cohérent avec le backend)
  // Backend: stock_securite = salesPerDay × (leadTime × 0.2) = salesPerDay × leadTime × 0.2 (unités)
  let securityStock = product.securityStock; // Déjà en unités depuis le backend
  
  if (!securityStock || securityStock <= 0) {
    if (product.customSecurityStock !== undefined && product.customSecurityStock !== null && product.customSecurityStock > 0) {
      // customSecurityStock est en unités (cohérent avec le backend)
      securityStock = roundToInteger(product.customSecurityStock);
    } else {
      // Calculer en unités : salesPerDay × (leadTime × 0.2)
      const securityStockDays = multiplyWithPrecision(leadTime, 0.2, 0); // Jours
      securityStock = avgDailySales > 0
        ? roundToInteger(multiplyWithPrecision(avgDailySales, securityStockDays, 0))
        : roundToInteger(multiplyWithPrecision(leadTime, 0.2, 0)); // Fallback : au moins 1 si pas de ventes
    }
  }
  
  securityStock = Math.max(1, roundToInteger(securityStock));
  
  // Calculer le point de commande avec précision décimale
  // Formule cohérente avec le backend: (salesPerDay × leadTime) + securityStock
  const reorderPoint = addWithPrecision(
    multiplyWithPrecision(avgDailySales, leadTime, 0),
    securityStock
  );
  
  return roundToInteger(reorderPoint);
};

/**
 * Calcule la valeur de l'excédent de surstock profond pour un produit
 * Approche 2 : Valeur de l'excédent uniquement (recommandée)
 * 
 * @param {Object} product - Le produit enrichi avec daysOfStock
 * @param {number} seuil - Seuil de surstock profond en jours (défaut: 90)
 * @returns {number} Valeur de l'excédent en surstock profond (0 si pas de surstock)
 */
export const calculateOverstockExcessValue = (product, seuil = 90) => {
  const daysOfStock = product?.daysOfStock || 0;
  const salesPerDay = product?.salesPerDay || 0;
  const price = product?.buyPrice || product?.price || 0;
  
  // Vérifier si le produit est en surstock profond
  if (daysOfStock < seuil || salesPerDay <= 0) {
    return 0;
  }
  
  // Calculer l'excédent en jours (au-delà du seuil)
  const excessDays = daysOfStock - seuil;
  
  if (excessDays <= 0) {
    return 0;
  }
  
  // Calculer l'excédent en unités et sa valeur
  const excessUnits = excessDays * salesPerDay;
  const excessValue = excessUnits * price;
  
  return roundToTwoDecimals(excessValue);
};
