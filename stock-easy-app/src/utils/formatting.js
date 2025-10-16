/**
 * Formate une date pour l'affichage
 */
export const formatDate = (isoDate, options = {}) => {
  if (!isoDate) return null;
  
  try {
    const date = new Date(isoDate);
    
    if (isNaN(date.getTime())) {
      console.error('formatDate: date invalide:', isoDate);
      return 'Date invalide';
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      ...options
    });
  } catch (error) {
    console.error('Erreur formatage date:', error, 'Date reçue:', isoDate);
    return 'Erreur de date';
  }
};

/**
 * Formate un montant en devise
 */
export const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Formate un nombre avec des séparateurs
 */
export const formatNumber = (number, decimals = 0) => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};
