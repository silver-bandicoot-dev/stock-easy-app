/**
 * Utilitaires pour le calcul de l'ETA (Estimated Time of Arrival)
 */

/**
 * Calcule l'ETA d'une commande basé sur le leadTimeDays du fournisseur
 * @param {string} shippedAt - Date d'expédition (ISO string)
 * @param {number} leadTimeDays - Nombre de jours de délai du fournisseur
 * @returns {string} - Date ETA au format ISO string
 */
export const calculateETA = (shippedAt, leadTimeDays) => {
  if (!shippedAt || !leadTimeDays || leadTimeDays <= 0) {
    return null;
  }

  try {
    const shippedDate = new Date(shippedAt);
    const etaDate = new Date(shippedDate);
    
    // Ajouter les jours de délai
    etaDate.setDate(etaDate.getDate() + leadTimeDays);
    
    return etaDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
  } catch (error) {
    console.error('Erreur lors du calcul de l\'ETA:', error);
    return null;
  }
};

/**
 * Calcule l'ETA pour une commande en utilisant les données du fournisseur
 * @param {Object} order - La commande
 * @param {Array} suppliers - Liste des fournisseurs
 * @returns {string|null} - Date ETA calculée ou null
 */
export const calculateOrderETA = (order, suppliers) => {
  if (!order || !suppliers || !order.shippedAt) {
    return null;
  }

  // Trouver le fournisseur correspondant
  const supplier = suppliers.find(s => s.name === order.supplier);
  
  if (!supplier || !supplier.leadTimeDays) {
    return null;
  }

  return calculateETA(order.shippedAt, supplier.leadTimeDays);
};

/**
 * Calcule l'ETA pour une commande en utilisant les données des produits
 * @param {Object} order - La commande
 * @param {Array} products - Liste des produits
 * @returns {string|null} - Date ETA calculée ou null
 */
export const calculateOrderETAFromProducts = (order, products) => {
  if (!order || !products || !order.shippedAt || !order.items) {
    return null;
  }

  // Calculer le leadTimeDays moyen des produits de la commande
  let totalLeadTime = 0;
  let productCount = 0;

  order.items.forEach(item => {
    const product = products.find(p => p.sku === item.sku);
    if (product && product.leadTimeDays) {
      totalLeadTime += product.leadTimeDays;
      productCount++;
    }
  });

  if (productCount === 0) {
    return null;
  }

  const averageLeadTime = Math.round(totalLeadTime / productCount);
  return calculateETA(order.shippedAt, averageLeadTime);
};

/**
 * Formate une date ETA pour l'affichage
 * @param {string} eta - Date ETA au format ISO
 * @returns {string} - Date formatée pour l'affichage
 */
export const formatETA = (eta) => {
  if (!eta) return 'Non calculé';
  
  try {
    const date = new Date(eta);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Date invalide';
  }
};

/**
 * Calcule le nombre de jours restants jusqu'à l'ETA
 * @param {string} eta - Date ETA au format ISO
 * @returns {number|null} - Nombre de jours restants ou null
 */
export const getDaysUntilETA = (eta) => {
  if (!eta) return null;
  
  try {
    const etaDate = new Date(eta);
    const today = new Date();
    
    // Réinitialiser les heures pour comparer seulement les dates
    etaDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = etaDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    return null;
  }
};

/**
 * Détermine le statut de livraison basé sur l'ETA
 * @param {string} eta - Date ETA au format ISO
 * @returns {Object} - Statut avec couleur et texte
 */
export const getDeliveryStatus = (eta) => {
  const daysUntilETA = getDaysUntilETA(eta);
  
  if (daysUntilETA === null) {
    return { status: 'unknown', color: 'gray', text: 'Non calculé' };
  }
  
  if (daysUntilETA < 0) {
    return { status: 'overdue', color: 'red', text: 'En retard' };
  } else if (daysUntilETA === 0) {
    return { status: 'today', color: 'orange', text: 'Livraison prévue aujourd\'hui' };
  } else if (daysUntilETA <= 2) {
    return { status: 'soon', color: 'yellow', text: `Livraison dans ${daysUntilETA} jour${daysUntilETA > 1 ? 's' : ''}` };
  } else {
    return { status: 'on-time', color: 'green', text: `Livraison dans ${daysUntilETA} jours` };
  }
};
