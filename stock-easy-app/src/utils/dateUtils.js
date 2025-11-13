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

/**
 * Calcule l'ETA (Estimated Time of Arrival) d'une commande
 * À partir de la date de confirmation + leadTimeDays du fournisseur
 * @param {string|null} confirmedAt - Date de confirmation de la commande (format ISO ou YYYY-MM-DD)
 * @param {number} leadTimeDays - Délai de livraison en jours
 * @param {Object} suppliers - Objet des fournisseurs (pour récupérer le leadTimeDays si nécessaire)
 * @param {string} supplierName - Nom du fournisseur
 * @returns {string|null} - Date ETA au format YYYY-MM-DD ou null
 */
export const calculateETA = (confirmedAt, leadTimeDays, suppliers = {}, supplierName = '') => {
  // Si pas de date de confirmation, impossible de calculer l'ETA
  if (!confirmedAt) return null;
  
  try {
    // Parser la date de confirmation
    const confirmDate = new Date(confirmedAt);
    
    // Vérifier que la date est valide
    if (isNaN(confirmDate.getTime())) {
      console.warn('calculateETA: date de confirmation invalide:', confirmedAt);
      return null;
    }
    
    // Récupérer le leadTime - d'abord depuis le paramètre, sinon depuis le fournisseur
    let leadTime = leadTimeDays;
    
    if (!leadTime && supplierName && suppliers[supplierName]) {
      leadTime = suppliers[supplierName].leadTimeDays;
    }
    
    // Si toujours pas de leadTime, retourner null
    if (!leadTime || leadTime <= 0) {
      console.warn('calculateETA: leadTimeDays invalide:', leadTime);
      return null;
    }
    
    // Calculer l'ETA en ajoutant le leadTime à la date de confirmation
    const etaDate = new Date(confirmDate);
    etaDate.setDate(etaDate.getDate() + leadTime);
    
    // Retourner au format YYYY-MM-DD
    return formatDateForAPI(etaDate);
  } catch (error) {
    console.error('Erreur calcul ETA:', error);
    return null;
  }
};

/**
 * Formate une date ETA pour l'affichage (avec indicateur d'urgence)
 * @param {string|null} eta - Date ETA au format ISO ou YYYY-MM-DD
 * @param {boolean} includeUrgency - Inclure l'indicateur d'urgence (jours restants)
 * @returns {Object|null} - { formatted: string, daysRemaining: number, isUrgent: boolean, isPast: boolean }
 */
export const formatETA = (eta, includeUrgency = true) => {
  if (!eta) return null;
  
  try {
    const etaDate = new Date(eta);
    
    // Vérifier que la date est valide
    if (isNaN(etaDate.getTime())) {
      return null;
    }
    
    const formatted = etaDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    
    if (!includeUrgency) {
      return { formatted, daysRemaining: null, isUrgent: false, isPast: false };
    }
    
    // Calculer les jours restants
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    etaDate.setHours(0, 0, 0, 0);
    
    const daysRemaining = Math.ceil((etaDate - today) / (1000 * 60 * 60 * 24));
    
    // Déterminer l'urgence
    const isUrgent = daysRemaining <= 3 && daysRemaining >= 0;
    const isPast = daysRemaining < 0;
    
    return {
      formatted,
      daysRemaining,
      isUrgent,
      isPast
    };
  } catch (error) {
    console.error('Erreur formatage ETA:', error);
    return null;
  }
};
