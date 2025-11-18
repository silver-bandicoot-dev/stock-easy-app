/**
 * Configuration centralisée pour le composant SearchBar
 * Modifiez ces valeurs pour personnaliser le comportement global
 */

export const SEARCH_CONFIG = {
  // Clé localStorage pour l'historique
  HISTORY_KEY: 'stock_easy_search_history',

  // Nombre maximum d'items dans l'historique
  MAX_HISTORY_ITEMS: 10,

  // Délai de débounce en millisecondes
  DEBOUNCE_DELAY: 300,

  // Nombre minimum de caractères pour déclencher une recherche
  MIN_SEARCH_LENGTH: 2,

  // Limites de résultats par catégorie
  RESULT_LIMITS: {
    products: 5,
    suppliers: 3,
    orders: 3,
  },

  // Textes par défaut
  TEXTS: {
    placeholder: 'Rechercher un produit, fournisseur, commande...',
    noResults: 'Aucun résultat trouvé',
    tryAgain: 'Essayez un autre terme de recherche',
    loading: 'Recherche en cours...',
  },

  // Routes de navigation par type
  ROUTES: {
    product: (id) => `/stock?sku=${id}`,
    supplier: (id) => `/settings?tab=suppliers&id=${id}`,
    order: (id) => `/track?order=${id}`,
  },

  // Catégories de résultats
  CATEGORIES: {
    products: {
      label: 'Produits',
      icon: 'Package',
      color: 'primary',
    },
    suppliers: {
      label: 'Fournisseurs',
      icon: 'User',
      color: 'success',
    },
    orders: {
      label: 'Commandes',
      icon: 'ShoppingCart',
      color: 'warning',
    },
    history: {
      label: 'Recherches récentes',
      icon: 'History',
      color: 'neutral',
    },
  },

  // Champs de recherche par table Supabase
  SUPABASE_QUERIES: {
    produits: {
      table: 'produits',
      select: 'sku, nom_produit, stock_actuel, fournisseur, prix_vente, image_url',
      searchFields: ['sku', 'nom_produit'],
      limit: 5,
    },
    fournisseurs: {
      table: 'fournisseurs',
      select: 'id, nom_fournisseur, email, lead_time_days',
      searchFields: ['nom_fournisseur'],
      limit: 3,
    },
    commandes: {
      table: 'commandes',
      select: 'id, supplier, status, total, created_at',
      searchFields: ['id', 'supplier'],
      orderBy: { column: 'created_at', ascending: false },
      limit: 3,
    },
  },

  // Raccourcis clavier
  KEYBOARD_SHORTCUTS: {
    focus: 'k', // Cmd/Ctrl + K
    up: 'ArrowUp',
    down: 'ArrowDown',
    enter: 'Enter',
    escape: 'Escape',
  },

  // Options d'animation
  ANIMATIONS: {
    dropdown: 'animate-slide-down',
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
  },
};

/**
 * Helper pour obtenir la route de navigation selon le type
 */
export const getNavigationRoute = (type, id) => {
  const routeGenerator = SEARCH_CONFIG.ROUTES[type];
  return routeGenerator ? routeGenerator(id) : null;
};

/**
 * Helper pour obtenir le label d'une catégorie
 */
export const getCategoryLabel = (type) => {
  return SEARCH_CONFIG.CATEGORIES[type]?.label || type;
};

/**
 * Helper pour construire la requête de recherche Supabase
 */
export const buildSearchQuery = (table, searchPattern) => {
  const config = SEARCH_CONFIG.SUPABASE_QUERIES[table];
  if (!config) return null;

  return {
    table: config.table,
    select: config.select,
    searchPattern,
    searchFields: config.searchFields,
    orderBy: config.orderBy,
    limit: config.limit,
  };
};


