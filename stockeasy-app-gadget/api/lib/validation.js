/**
 * Utilitaires de validation des données pour l'intégration Shopify ↔ Stockeasy
 * Empêche les données corrompues d'être insérées dans Supabase
 */

/**
 * Regex pour valider un UUID v4
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Regex pour valider une date au format YYYY-MM-DD
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valide qu'une valeur est un UUID valide
 * @param {string} value - La valeur à valider
 * @returns {boolean}
 */
export const isValidUUID = (value) => {
  if (!value || typeof value !== 'string') return false;
  return UUID_REGEX.test(value);
};

/**
 * Valide qu'une valeur est un nombre fini (pas NaN, pas Infinity)
 * @param {any} value - La valeur à valider
 * @returns {boolean}
 */
export const isValidNumber = (value) => {
  if (value === null || value === undefined) return false;
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
};

/**
 * Valide qu'une valeur est un nombre positif ou zéro
 * @param {any} value - La valeur à valider
 * @returns {boolean}
 */
export const isPositiveOrZero = (value) => {
  if (!isValidNumber(value)) return false;
  return Number(value) >= 0;
};

/**
 * Valide qu'une chaîne n'est pas vide ou uniquement des espaces
 * @param {string} value - La valeur à valider
 * @returns {boolean}
 */
export const isNonEmptyString = (value) => {
  if (!value || typeof value !== 'string') return false;
  return value.trim().length > 0;
};

/**
 * Valide un format de date YYYY-MM-DD
 * @param {string} value - La valeur à valider
 * @returns {boolean}
 */
export const isValidDateFormat = (value) => {
  if (!value || typeof value !== 'string') return false;
  if (!DATE_REGEX.test(value)) return false;
  // Vérifie que c'est une date valide
  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * Résultat de validation
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Si les données sont valides
 * @property {string[]} errors - Liste des erreurs trouvées
 * @property {Object} sanitizedData - Données nettoyées/corrigées
 */

/**
 * Valide une entrée de sales_history
 * @param {Object} sale - Les données de vente à valider
 * @returns {ValidationResult}
 */
export const validateSalesHistoryEntry = (sale) => {
  const errors = [];
  const sanitizedData = { ...sale };

  // 1. company_id (obligatoire, UUID)
  if (!sale.company_id) {
    errors.push('company_id est obligatoire');
  } else if (!isValidUUID(sale.company_id)) {
    errors.push(`company_id invalide: ${sale.company_id}`);
  }

  // 2. sku (obligatoire, non vide)
  if (!sale.sku) {
    errors.push('sku est obligatoire');
  } else if (!isNonEmptyString(sale.sku)) {
    errors.push('sku ne peut pas être vide');
  } else {
    sanitizedData.sku = sale.sku.trim();
  }

  // 3. quantity (obligatoire, nombre)
  // Note: peut être négatif pour les annulations
  if (sale.quantity === undefined || sale.quantity === null) {
    errors.push('quantity est obligatoire');
  } else if (!isValidNumber(sale.quantity)) {
    errors.push(`quantity invalide: ${sale.quantity}`);
  } else {
    sanitizedData.quantity = Number(sale.quantity);
  }

  // 4. revenue (optionnel mais doit être un nombre si présent)
  if (sale.revenue !== undefined && sale.revenue !== null) {
    if (!isValidNumber(sale.revenue)) {
      errors.push(`revenue invalide: ${sale.revenue}`);
    } else {
      sanitizedData.revenue = Number(sale.revenue);
    }
  }

  // 5. sale_date (obligatoire, format YYYY-MM-DD)
  if (!sale.sale_date) {
    errors.push('sale_date est obligatoire');
  } else if (!isValidDateFormat(sale.sale_date)) {
    errors.push(`sale_date format invalide: ${sale.sale_date} (attendu: YYYY-MM-DD)`);
  }

  // 6. source (optionnel, valeurs autorisées)
  const validSources = ['shopify', 'stockeasy', 'manual', 'import'];
  if (sale.source && !validSources.includes(sale.source)) {
    // On corrige plutôt que rejeter
    sanitizedData.source = 'shopify';
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
};

/**
 * Valide un batch d'entrées sales_history
 * Retourne les entrées valides et les erreurs pour les invalides
 * @param {Array} salesData - Tableau de données de vente
 * @returns {{validEntries: Array, invalidEntries: Array<{entry: Object, errors: string[]}>}}
 */
export const validateSalesHistoryBatch = (salesData) => {
  if (!Array.isArray(salesData)) {
    return {
      validEntries: [],
      invalidEntries: [{ entry: salesData, errors: ['salesData doit être un tableau'] }]
    };
  }

  const validEntries = [];
  const invalidEntries = [];

  for (const entry of salesData) {
    const validation = validateSalesHistoryEntry(entry);
    
    if (validation.isValid) {
      validEntries.push(validation.sanitizedData);
    } else {
      invalidEntries.push({
        entry,
        errors: validation.errors
      });
    }
  }

  return { validEntries, invalidEntries };
};

/**
 * Valide une mise à jour de stock
 * @param {Object} stockUpdate - Les données de mise à jour de stock
 * @param {string} stockUpdate.sku - Le SKU du produit
 * @param {string} stockUpdate.company_id - L'ID de la company
 * @param {number} stockUpdate.stock - La nouvelle quantité
 * @returns {ValidationResult}
 */
export const validateStockUpdate = (stockUpdate) => {
  const errors = [];
  const sanitizedData = { ...stockUpdate };

  // 1. company_id (obligatoire, UUID)
  if (!stockUpdate.company_id) {
    errors.push('company_id est obligatoire');
  } else if (!isValidUUID(stockUpdate.company_id)) {
    errors.push(`company_id invalide: ${stockUpdate.company_id}`);
  }

  // 2. sku (obligatoire, non vide)
  if (!stockUpdate.sku) {
    errors.push('sku est obligatoire');
  } else if (!isNonEmptyString(stockUpdate.sku)) {
    errors.push('sku ne peut pas être vide');
  } else {
    sanitizedData.sku = stockUpdate.sku.trim();
  }

  // 3. stock (obligatoire, nombre >= 0)
  if (stockUpdate.stock === undefined || stockUpdate.stock === null) {
    errors.push('stock est obligatoire');
  } else if (!isValidNumber(stockUpdate.stock)) {
    errors.push(`stock invalide: ${stockUpdate.stock}`);
  } else if (!isPositiveOrZero(stockUpdate.stock)) {
    errors.push(`stock ne peut pas être négatif: ${stockUpdate.stock}`);
  } else {
    sanitizedData.stock = Math.floor(Number(stockUpdate.stock)); // Arrondi vers le bas
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
};

/**
 * Valide un product mapping
 * @param {Object} mapping - Les données du mapping
 * @returns {ValidationResult}
 */
export const validateProductMapping = (mapping) => {
  const errors = [];
  const sanitizedData = { ...mapping };

  // shopifyVariantId (obligatoire)
  if (!mapping.shopifyVariantId) {
    errors.push('shopifyVariantId est obligatoire');
  }

  // shopifyProductId (obligatoire)
  if (!mapping.shopifyProductId) {
    errors.push('shopifyProductId est obligatoire');
  }

  // stockEasySku (obligatoire, non vide)
  if (!mapping.stockEasySku) {
    errors.push('stockEasySku est obligatoire');
  } else if (!isNonEmptyString(mapping.stockEasySku)) {
    errors.push('stockEasySku ne peut pas être vide');
  } else {
    sanitizedData.stockEasySku = mapping.stockEasySku.trim();
  }

  // shopId (obligatoire)
  if (!mapping.shopId) {
    errors.push('shopId est obligatoire');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
};

