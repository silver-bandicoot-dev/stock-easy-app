/**
 * Utilitaires pour améliorer la recherche avec gestion des accents et détection du type
 */

/**
 * Normalise un texte en supprimant les accents et en le mettant en minuscules
 * @param {string} text - Texte à normaliser
 * @returns {string} Texte normalisé
 */
export const normalizeText = (text = '') => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .trim();
};

/**
 * Détecte le type de recherche souhaité par l'utilisateur
 * @param {string} query - Terme de recherche
 * @returns {Object} Type de recherche détecté et termes associés
 */
export const detectSearchType = (query) => {
  const normalized = normalizeText(query);
  
  // Patterns plus sophistiqués avec regex
  const patterns = {
    product: /(?:produit|article|sku|stock|inventaire|ref(?:erence)?)/i,
    supplier: /(?:fournisseur|supplier|vendeur|distributeur|@|mail)/i,
    order: /(?:commande|order|po|achat|purchase|^#)/i,
    warehouse: /(?:entrepot|warehouse|depot|stockage|magasin|ville|rue)/i
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(query)) {
      return { type, priority: true, confidence: 'high' };
    }
  }
  
  // Détection format Commande explicite (commence par #)
  if (/^#\d+$/.test(normalized)) {
    return { type: 'order', priority: true, confidence: 'high' };
  }

  // Si tout chiffres (4+), ambigu -> produit (EAN) ou commande
  // On retourne 'all' pour chercher partout
  if (/^\d{4,}$/.test(normalized)) {
    return { type: 'all', priority: false, confidence: 'medium' };
  }

  // Détection format Email
  if (normalized.includes('@') || normalized.includes('.com') || normalized.includes('.fr')) {
    return { type: 'supplier', priority: true, confidence: 'high' };
  }

  // Détection par format SKU (lettres + chiffres/tirets, min 3 chars)
  // Exemples: SKU-001, P123, REF-A
  if (/^[A-Z0-9-]{3,}$/i.test(normalized) && (/\d/.test(normalized) || /-/.test(normalized))) {
    return { type: 'product', priority: true, confidence: 'medium' };
  }
  
  // Par défaut, tout rechercher
  return { type: 'all', priority: false, confidence: 'low' };
};
