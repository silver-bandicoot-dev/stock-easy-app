// ============================================
// UTILITAIRES DE DATE - Extraits de StockEasy.jsx
// ============================================

/**
 * Formate une date ISO en format français lisible
 * @param {string} isoDate - Date ISO (ex: "2025-10-14T22:00:00.000Z")
 * @returns {string|null} - Ex: "14 octobre 2025" ou null si invalide
 */
export const formatConfirmedDate = (isoDate) => {
  if (!isoDate) {
    console.warn('formatConfirmedDate: date vide ou null');
    return null;
  }
  
  try {
    const date = new Date(isoDate);
    
    // Vérifier que la date est valide
    if (isNaN(date.getTime())) {
      console.error('formatConfirmedDate: date invalide:', isoDate);
      return 'Date invalide';
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erreur formatage date:', error, 'Date reçue:', isoDate);
    return 'Erreur de date';
  }
};

/**
 * Calcule le nombre de jours entre deux dates
 * @param {string|Date} date1 
 * @param {string|Date} date2 
 * @returns {number} - Nombre de jours
 */
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calcule les jours restants depuis une date d'expédition
 * @param {string} shippedAt - Date d'expédition
 * @param {number} leadTimeDays - Délai de livraison
 * @returns {number} - Jours restants
 */
export const calculateDaysRemaining = (shippedAt, leadTimeDays) => {
  if (!shippedAt) return leadTimeDays;
  
  const daysSinceShip = daysBetween(shippedAt, new Date());
  return Math.max(0, leadTimeDays - daysSinceShip);
};

/**
 * Vérifie si une date est aujourd'hui
 * @param {string|Date} date 
 * @returns {boolean}
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Formate une date pour l'API (YYYY-MM-DD)
 * @param {Date} date 
 * @returns {string}
 */
export const formatDateForAPI = (date) => {
  return date.toISOString().split('T')[0];
};
