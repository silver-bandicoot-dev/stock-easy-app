/**
 * Valide les données d'un produit et log les anomalies
 * @param {Object} product - Le produit à valider
 * @returns {Object} - Objet avec isValid et warnings
 */
export const validateProduct = (product) => {
  const warnings = [];
  let isValid = true;

  // Validation : Prix de vente >= Prix d'achat
  if (product.sellPrice && product.buyPrice && product.sellPrice < product.buyPrice) {
    warnings.push({
      type: 'negative_margin',
      message: `Marge négative sur ${product.name || product.sku} (Vente: ${product.sellPrice}€ < Achat: ${product.buyPrice}€)`,
      severity: 'warning',
      product: product.name || product.sku,
      sku: product.sku
    });
  }

  // Validation : Stock négatif
  if (product.stock < 0) {
    warnings.push({
      type: 'negative_stock',
      message: `Stock négatif sur ${product.name || product.sku} (Stock: ${product.stock})`,
      severity: 'error',
      product: product.name || product.sku,
      sku: product.sku
    });
    isValid = false;
  }

  // Validation : salesPerDay négatif
  if (product.salesPerDay && product.salesPerDay < 0) {
    warnings.push({
      type: 'negative_sales',
      message: `Ventes journalières négatives sur ${product.name || product.sku} (Sales: ${product.salesPerDay})`,
      severity: 'error',
      product: product.name || product.sku,
      sku: product.sku
    });
    isValid = false;
  }

  // Validation : Prix négatifs
  if ((product.buyPrice !== undefined && product.buyPrice < 0) || 
      (product.sellPrice !== undefined && product.sellPrice < 0)) {
    warnings.push({
      type: 'negative_price',
      message: `Prix négatif sur ${product.name || product.sku}`,
      severity: 'error',
      product: product.name || product.sku,
      sku: product.sku
    });
    isValid = false;
  }

  // Validation : daysOfStock incohérent
  if (product.daysOfStock !== undefined && product.daysOfStock !== null && product.daysOfStock < 0) {
    warnings.push({
      type: 'negative_days',
      message: `Jours de stock négatifs sur ${product.name || product.sku} (Days: ${product.daysOfStock})`,
      severity: 'warning',
      product: product.name || product.sku,
      sku: product.sku
    });
  }

  // Validation : Données manquantes critiques
  if (!product.buyPrice && product.stock > 0) {
    warnings.push({
      type: 'missing_buy_price',
      message: `Prix d'achat manquant sur ${product.name || product.sku} (Stock: ${product.stock})`,
      severity: 'info',
      product: product.name || product.sku,
      sku: product.sku
    });
  }

  // Validation : rotationRate négatif
  if (product.rotationRate !== undefined && product.rotationRate !== null && product.rotationRate < 0) {
    warnings.push({
      type: 'negative_rotation',
      message: `Taux de rotation négatif sur ${product.name || product.sku} (Rotation: ${product.rotationRate})`,
      severity: 'warning',
      product: product.name || product.sku,
      sku: product.sku
    });
  }

  // Validation : leadTime négatif
  if (product.leadTimeDays !== undefined && product.leadTimeDays !== null && product.leadTimeDays < 0) {
    warnings.push({
      type: 'negative_leadtime',
      message: `Délai de livraison négatif sur ${product.name || product.sku} (LeadTime: ${product.leadTimeDays} jours)`,
      severity: 'error',
      product: product.name || product.sku,
      sku: product.sku
    });
    isValid = false;
  }

  return { isValid, warnings };
};

/**
 * Valide un tableau de produits et agrège les anomalies
 * @param {Array} products - Les produits à valider
 * @returns {Object} - Statistiques et liste des warnings
 */
export const validateProducts = (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    return {
      totalProducts: 0,
      totalErrors: 0,
      totalWarnings: 0,
      totalInfo: 0,
      warnings: [],
      hasErrors: false,
      hasWarnings: false
    };
  }

  const allWarnings = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfo = 0;

  products.forEach(product => {
    const { isValid, warnings } = validateProduct(product);
    
    if (!isValid) {
      totalErrors += warnings.filter(w => w.severity === 'error').length;
    }
    
    warnings.forEach(warning => {
      if (warning.severity === 'error') totalErrors++;
      else if (warning.severity === 'warning') totalWarnings++;
      else if (warning.severity === 'info') totalInfo++;
      
      allWarnings.push(warning);
    });
  });

  return {
    totalProducts: products.length,
    totalErrors,
    totalWarnings,
    totalInfo,
    warnings: allWarnings,
    hasErrors: totalErrors > 0,
    hasWarnings: totalWarnings > 0
  };
};

/**
 * Log les warnings dans la console en développement
 * @param {Object} validationResult - Résultat de validateProducts
 */
export const logValidationWarnings = (validationResult) => {
  if (import.meta.env.DEV && validationResult.warnings.length > 0) {
    console.group('🔍 Validation des Données Produits');
    console.log(`Total produits : ${validationResult.totalProducts}`);
    console.log(`Erreurs : ${validationResult.totalErrors}`);
    console.log(`Avertissements : ${validationResult.totalWarnings}`);
    console.log(`Infos : ${validationResult.totalInfo}`);
    
    // Grouper par type
    const byType = {};
    validationResult.warnings.forEach(w => {
      if (!byType[w.type]) byType[w.type] = [];
      byType[w.type].push(w);
    });

    Object.entries(byType).forEach(([type, warnings]) => {
      console.groupCollapsed(`${type} (${warnings.length})`);
      warnings.forEach(w => {
        const logFn = w.severity === 'error' ? console.error : 
                      w.severity === 'warning' ? console.warn : 
                      console.info;
        logFn(w.message);
      });
      console.groupEnd();
    });

    console.groupEnd();
  }
};

