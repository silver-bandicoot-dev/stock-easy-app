/**
 * Utilitaires pour la gestion des URLs de tracking
 */

/**
 * Valide si une URL est valide
 * @param {string} url - L'URL à valider
 * @returns {boolean} - True si l'URL est valide
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Formate une URL de tracking pour l'affichage
 * @param {string} url - L'URL de tracking
 * @returns {string} - L'URL formatée ou une chaîne vide si invalide
 */
export const formatTrackingUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  // Si l'URL ne commence pas par http/https, l'ajouter
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
};

/**
 * Extrait le nom du transporteur depuis une URL de tracking
 * @param {string} url - L'URL de tracking
 * @returns {string} - Le nom du transporteur ou "Transporteur"
 */
export const getCarrierName = (url) => {
  if (!url) return 'Transporteur';
  
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('ups.com')) return 'UPS';
  if (urlLower.includes('fedex.com')) return 'FedEx';
  if (urlLower.includes('dhl.com')) return 'DHL';
  if (urlLower.includes('chronopost.fr')) return 'Chronopost';
  if (urlLower.includes('colissimo.fr')) return 'Colissimo';
  if (urlLower.includes('laposte.fr')) return 'La Poste';
  if (urlLower.includes('dpd.com')) return 'DPD';
  if (urlLower.includes('gls.com')) return 'GLS';
  if (urlLower.includes('tnt.com')) return 'TNT';
  
  return 'Transporteur';
};

/**
 * Génère un texte d'affichage pour le lien de tracking
 * @param {string} url - L'URL de tracking
 * @returns {string} - Le texte à afficher
 */
export const getTrackingLinkText = (url) => {
  const carrier = getCarrierName(url);
  return `Suivre sur ${carrier}`;
};
