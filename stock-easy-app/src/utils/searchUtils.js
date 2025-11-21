/**
 * Utilitaires pour améliorer la recherche avec gestion des accents et erreurs de frappe
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
 * Calcule la distance de Levenshtein entre deux chaînes
 * Utilisé pour la recherche approximative (fuzzy search)
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} Distance de Levenshtein
 */
export const levenshteinDistance = (str1, str2) => {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
};

/**
 * Calcule un score de similarité entre 0 et 1
 * @param {string} query - Terme de recherche
 * @param {string} text - Texte à comparer
 * @returns {number} Score de similarité (0 = pas de correspondance, 1 = correspondance parfaite)
 */
export const similarityScore = (query, text) => {
  const normalizedQuery = normalizeText(query);
  const normalizedText = normalizeText(text);
  
  // Correspondance exacte après normalisation
  if (normalizedText.includes(normalizedQuery)) {
    return 1;
  }
  
  // Correspondance au début
  if (normalizedText.startsWith(normalizedQuery)) {
    return 0.9;
  }
  
  // Calcul de la distance de Levenshtein
  const distance = levenshteinDistance(query, text);
  const maxLength = Math.max(normalizedQuery.length, normalizedText.length);
  
  // Score basé sur la distance (plus la distance est petite, plus le score est élevé)
  const similarity = 1 - (distance / maxLength);
  
  // Seuil minimum de similarité (60% de similarité minimum - optimisé pour réduire faux positifs)
  return similarity >= 0.6 ? similarity : 0;
};

/**
 * Vérifie si un texte correspond à une requête avec tolérance aux erreurs
 * @param {string} query - Terme de recherche
 * @param {string} text - Texte à vérifier
 * @param {number} threshold - Seuil de similarité minimum (par défaut 0.6 - optimisé)
 * @returns {boolean} True si le texte correspond
 */
export const fuzzyMatch = (query, text, threshold = 0.6) => {
  if (!query || !text) return false;
  
  const normalizedQuery = normalizeText(query);
  const normalizedText = normalizeText(text);
  
  // Correspondance exacte
  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }
  
  // Multi-mots amélioré avec pondération
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
  if (queryWords.length > 1) {
    const matches = queryWords.map(word => {
      if (normalizedText.includes(word)) return 1.0;
      // Chercher des correspondances partielles
      if (normalizedText.split(/\s+/).some(textWord => 
        textWord.startsWith(word) || word.startsWith(textWord)
      )) return 0.7;
      return 0;
    });
    
    const avgMatch = matches.reduce((a, b) => a + b, 0) / matches.length;
    return avgMatch >= threshold;
  }
  
  // Fuzzy matching pour mot unique
  const score = similarityScore(query, text);
  return score >= threshold;
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

/**
 * Filtre et trie les résultats selon leur pertinence
 * @param {Array} results - Liste des résultats
 * @param {string} query - Terme de recherche
 * @param {string} field - Champ à utiliser pour la comparaison (ex: 'title', 'nom_produit')
 * @returns {Array} Résultats triés par pertinence
 */
export const rankResults = (results, query, field = 'title') => {
  if (!results || results.length === 0) return [];
  
  const normalizedQuery = normalizeText(query);
  
  return results
    .map(item => {
      const text = item[field] || item.title || item.nom_produit || '';
      const score = similarityScore(query, text);
      return { ...item, _relevanceScore: score };
    })
    .filter(item => item._relevanceScore > 0)
    .sort((a, b) => b._relevanceScore - a._relevanceScore);
};

/**
 * Construit un pattern de recherche pour Supabase avec plusieurs variantes
 * @param {string} query - Terme de recherche
 * @returns {string} Pattern pour Supabase
 */
export const buildSearchPattern = (query) => {
  const normalized = normalizeText(query);
  // Créer plusieurs variantes pour améliorer les résultats
  return `%${normalized}%`;
};

/**
 * Construit des patterns de recherche optimisés (max 2 patterns pour performance)
 * @param {string} query - Terme de recherche
 * @returns {Array<string>} Liste de patterns (max 2)
 */
export const buildSearchPatterns = (query) => {
  const normalized = normalizeText(query);
  const searchWords = normalized.split(/\s+/).filter(w => w.length > 0);
  
  const patterns = [];

  // 1. Pattern "Commence par" (plus performant si indexé)
  // Uniquement si la requête fait au moins 3 caractères
  if (normalized.length >= 3) {
    patterns.push(`${normalized}%`);
  }

  // 2. Pattern "Contient" (standard)
  patterns.push(`%${normalized}%`);
  
  // Si plusieurs mots significatifs, on peut ajouter une variante sur le premier mot
  // Mais on limite le nombre total de patterns pour éviter l'explosion de la requête
  if (patterns.length < 3 && searchWords.length > 1 && searchWords[0].length >= 3) {
    patterns.push(`%${searchWords[0]}%`);
  }
  
  // Retourner les patterns uniques
  return [...new Set(patterns)].slice(0, 3);
};

/**
 * Construit une requête OR pour Supabase avec plusieurs champs
 * @param {Array<string>} fields - Liste des champs à rechercher
 * @param {string} pattern - Pattern de recherche
 * @returns {string} Requête OR pour Supabase
 */
export const buildOrQuery = (fields, pattern) => {
  return fields.map(field => `${field}.ilike.${pattern}`).join(',');
};

/**
 * Construit une requête intelligente multi-champs et multi-patterns
 * @param {Array<string>} fields - Liste des champs à rechercher
 * @param {Array<string>} patterns - Liste des patterns de recherche
 * @returns {string} Requête OR pour Supabase
 */
export const buildSmartQuery = (fields, patterns) => {
  return fields.flatMap(field => 
    patterns.map(pattern => `${field}.ilike.${pattern}`)
  ).join(',');
};

/**
 * Calcule un score de pertinence avancé
 * @param {string} query - Terme de recherche
 * @param {Object} item - Item à scorer
 * @param {string} type - Type d'item ('product', 'supplier', 'order', 'warehouse')
 * @returns {number} Score de pertinence
 */
export const calculateRelevanceScore = (query, item, type) => {
  const normalizedQuery = normalizeText(query);
  let score = 0;
  
  // Pondération améliorée pour mieux différencier les résultats
  const weights = {
    exactMatch: 100,      // Score très élevé pour correspondance exacte
    startsWith: 50,       // Score élevé pour commence par
    contains: 20,         // Score moyen pour contient
    fuzzyHigh: 10,        // Score faible pour fuzzy high (≥80%)
    fuzzyMed: 3,          // Score très faible pour fuzzy medium (≥60%)
    secondaryField: 0.5  // Score minimal pour champs secondaires
  };
  
  // Fonction helper pour scorer un champ
  const scoreField = (fieldValue, weight = 1) => {
    if (!fieldValue) return 0;
    const normalized = normalizeText(String(fieldValue));
    
    if (normalized === normalizedQuery) return weights.exactMatch * weight;
    if (normalized.startsWith(normalizedQuery)) return weights.startsWith * weight;
    if (normalized.includes(normalizedQuery)) return weights.contains * weight;
    
    const similarity = similarityScore(query, String(fieldValue));
    if (similarity >= 0.8) return weights.fuzzyHigh * weight;
    if (similarity >= 0.6) return weights.fuzzyMed * weight; // Seuil augmenté à 60%
    
    return 0;
  };
  
  // Scoring selon le type avec pondération améliorée
  switch (type) {
    case 'product':
      score += scoreField(item.sku, 2.0);      // SKU très prioritaire (x2)
      score += scoreField(item.nom_produit, 1.5); // Nom prioritaire (x1.5)
      score += scoreField(item.fournisseur, 0.3); // Fournisseur moins prioritaire
      break;
    case 'supplier':
      score += scoreField(item.nom_fournisseur, 1.5);
      score += scoreField(item.email, 0.8);
      score += scoreField(item.commercial_contact_email, 0.7);
      break;
    case 'order':
      score += scoreField(item.id, 1.3);
      score += scoreField(item.supplier, 1.0);
      score += scoreField(item.tracking_number, 1.2);
      break;
    case 'warehouse':
      score += scoreField(item.name, 1.5);
      score += scoreField(item.city, 1.0);
      score += scoreField(item.address, 0.7);
      break;
  }
  
  // Bonus pour correspondance multi-mots
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
  if (queryWords.length > 1) {
    const allFields = Object.values(item).join(' ');
    const matchedWords = queryWords.filter(word => 
      normalizeText(allFields).includes(word)
    );
    score += (matchedWords.length / queryWords.length) * 2;
  }
  
  return score;
};

/**
 * Génère des suggestions de recherche basées sur les données existantes
 * @param {string} query - Terme de recherche
 * @param {Array} allData - Toutes les données disponibles
 * @returns {Array<string>} Liste de suggestions
 */
export const generateSearchSuggestions = (query, allData) => {
  const normalized = normalizeText(query);
  const suggestions = new Set();
  
  // Extraire des suggestions des données existantes
  allData.forEach(item => {
    const fields = [
      item.nom_produit, 
      item.sku, 
      item.nom_fournisseur,
      item.name,
      item.title
    ].filter(Boolean);
    
    fields.forEach(field => {
      const fieldNorm = normalizeText(String(field));
      if (fieldNorm.includes(normalized) && fieldNorm !== normalized) {
        suggestions.add(field);
      }
    });
  });
  
  return Array.from(suggestions).slice(0, 5);
};

