/**
 * Utilitaires pour gérer les calculs décimaux avec précision
 * Évite les erreurs de précision flottante comme 85.80000000000001
 */

/**
 * Arrondit un nombre à un nombre spécifique de décimales
 * Utilise une méthode qui évite les erreurs de précision flottante
 * 
 * @param {number} num - Le nombre à arrondir
 * @param {number} decimals - Le nombre de décimales (défaut: 0)
 * @returns {number} Le nombre arrondi
 */
export const roundToDecimals = (num, decimals = 0) => {
  if (typeof num !== 'number' || isNaN(num)) {
    return 0;
  }
  
  // Utilise Number.EPSILON pour éviter les erreurs de précision
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

/**
 * Arrondit un nombre à l'entier le plus proche
 * 
 * @param {number} num - Le nombre à arrondir
 * @returns {number} L'entier arrondi
 */
export const roundToInteger = (num) => {
  return roundToDecimals(num, 0);
};

/**
 * Arrondit un nombre à 2 décimales (pour les prix)
 * 
 * @param {number} num - Le nombre à arrondir
 * @returns {number} Le nombre arrondi à 2 décimales
 */
export const roundToTwoDecimals = (num) => {
  return roundToDecimals(num, 2);
};

/**
 * Arrondit un nombre à 1 décimale (pour les ventes par jour)
 * 
 * @param {number} num - Le nombre à arrondir
 * @returns {number} Le nombre arrondi à 1 décimale
 */
export const roundToOneDecimal = (num) => {
  return roundToDecimals(num, 1);
};

/**
 * Formate un nombre pour l'affichage avec un nombre spécifique de décimales
 * 
 * @param {number} num - Le nombre à formater
 * @param {number} decimals - Le nombre de décimales à afficher
 * @returns {string} Le nombre formaté
 */
export const formatNumber = (num, decimals = 0) => {
  const rounded = roundToDecimals(num, decimals);
  return rounded.toFixed(decimals);
};

/**
 * Formate un nombre d'unités pour l'affichage (entier)
 * 
 * @param {number} num - Le nombre d'unités
 * @returns {string} Le nombre formaté sans décimales
 */
export const formatUnits = (num) => {
  const rounded = Math.round(num || 0);
  return rounded.toFixed(0);
};

/**
 * Formate un prix pour l'affichage (2 décimales)
 * 
 * @param {number} num - Le prix
 * @returns {string} Le prix formaté avec 2 décimales
 */
export const formatPrice = (num) => {
  return formatNumber(num, 2);
};

/**
 * Formate les ventes par jour pour l'affichage (1 décimale)
 * 
 * @param {number} num - Les ventes par jour
 * @returns {string} Les ventes formatées avec 1 décimale
 */
export const formatSalesPerDay = (num) => {
  return formatNumber(num, 1);
};

/**
 * Effectue une addition avec précision décimale
 * 
 * @param {...number} numbers - Les nombres à additionner
 * @returns {number} La somme arrondie
 */
export const addWithPrecision = (...numbers) => {
  const sum = numbers.reduce((acc, num) => {
    const cleanNum = typeof num === 'number' && !isNaN(num) ? num : 0;
    return acc + cleanNum;
  }, 0);
  
  return roundToDecimals(sum, 2);
};

/**
 * Effectue une multiplication avec précision décimale
 * 
 * @param {number} a - Premier nombre
 * @param {number} b - Deuxième nombre
 * @param {number} decimals - Nombre de décimales pour le résultat (défaut: 2)
 * @returns {number} Le produit arrondi
 */
export const multiplyWithPrecision = (a, b, decimals = 2) => {
  const cleanA = typeof a === 'number' && !isNaN(a) ? a : 0;
  const cleanB = typeof b === 'number' && !isNaN(b) ? b : 0;
  
  return roundToDecimals(cleanA * cleanB, decimals);
};

/**
 * Effectue une division avec précision décimale
 * 
 * @param {number} a - Le dividende
 * @param {number} b - Le diviseur
 * @param {number} decimals - Nombre de décimales pour le résultat (défaut: 2)
 * @returns {number} Le quotient arrondi
 */
export const divideWithPrecision = (a, b, decimals = 2) => {
  const cleanA = typeof a === 'number' && !isNaN(a) ? a : 0;
  const cleanB = typeof b === 'number' && !isNaN(b) && b !== 0 ? b : 1;
  
  return roundToDecimals(cleanA / cleanB, decimals);
};

