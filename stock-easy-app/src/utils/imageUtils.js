/**
 * Utilitaires pour la gestion des images produits
 */

/**
 * Génère une URL d'image SVG basée sur le SKU du produit
 * Utilisé comme fallback quand l'image externe ne charge pas
 * 
 * @param {string} sku - SKU du produit
 * @param {string} name - Nom du produit (optionnel)
 * @param {number} size - Taille de l'image (défaut: 400)
 * @returns {string} URL de données SVG
 */
export function generateProductImageSVG(sku, name = '', size = 400) {
  // Générer des couleurs basées sur le SKU pour avoir des images variées
  const hash = sku.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  // Couleur de fond (pastel)
  const hue = Math.abs(hash) % 360;
  const saturation = 40 + (Math.abs(hash) % 30); // 40-70%
  const lightness = 85 + (Math.abs(hash) % 10); // 85-95%
  const bgColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  // Couleur de texte (contraste)
  const textColor = lightness > 90 ? '#666' : '#333';
  
  // Texte à afficher (première lettre du nom ou SKU)
  const displayText = name ? name.charAt(0).toUpperCase() : (sku ? sku.substring(0, 2).toUpperCase() : '?');
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.3}" 
        font-weight="bold" 
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >${displayText}</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Obtient une URL d'image avec fallback
 * 
 * @param {string} imageUrl - URL de l'image originale
 * @param {string} sku - SKU du produit
 * @param {string} name - Nom du produit
 * @returns {string} URL de l'image ou fallback SVG
 */
export function getProductImageUrl(imageUrl, sku, name) {
  // Si pas d'URL, utiliser le SVG généré
  if (!imageUrl || imageUrl.trim() === '') {
    return generateProductImageSVG(sku, name);
  }
  
  // Si c'est une URL picsum.photos qui a des problèmes, utiliser un fallback
  if (imageUrl.includes('picsum.photos')) {
    // On peut essayer de charger l'image, mais avoir un fallback SVG prêt
    return imageUrl;
  }
  
  return imageUrl;
}

/**
 * Vérifie si une URL d'image est valide
 * 
 * @param {string} url - URL à vérifier
 * @returns {boolean} true si l'URL semble valide
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Vérifier si c'est une URL valide ou une data URL
  try {
    if (url.startsWith('data:')) return true;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

