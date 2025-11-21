// ============================================
// CONSTANTES STOCK EASY - Extraites de StockEasy.jsx
// ============================================

// Labels de statut des commandes
export const ORDER_STATUS_LABELS = {
  pending_confirmation: 'En attente',
  preparing: 'En traitement',
  in_transit: 'En transit',
  received: 'Reçue',
  completed: 'Complétée',
  reconciliation: 'À réconcilier'
};

// Labels de statut avec émojis
export const ORDER_STATUS_LABELS_EMOJI = {
  pending_confirmation: '⏳ En attente',
  preparing: '📦 En traitement',
  in_transit: '🚚 En transit',
  received: '✅ Reçue',
  completed: '✅ Complétée',
  reconciliation: '⚠️ À réconcilier'
};

// Couleurs par statut
export const ORDER_STATUS_COLORS = {
  pending_confirmation: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-200'
  },
  preparing: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200'
  },
  in_transit: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200'
  },
  received: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200'
  },
  completed: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200'
  },
  reconciliation: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200'
  }
};

// Types d'écarts de réconciliation
export const DISCREPANCY_TYPES = {
  none: 'Aucun problème',
  missing: 'Quantités manquantes',
  damaged: 'Produits endommagés',
  missing_and_damaged: 'Manquant et endommagé'
};

// Onglets principaux
export const MAIN_TABS = {
  DASHBOARD: 'dashboard',
  ACTIONS: 'actions',
  TRACK: 'track',
  STOCK: 'stock-level',
  ANALYTICS: 'analytics',
  HISTORY: 'history',
  SETTINGS: 'settings',
  PROFILE: 'profile'
};

// Sous-onglets Track
export const TRACK_TABS = {
  EN_COURS_COMMANDE: 'en_cours_commande',
  PREPARATION: 'preparation',
  EN_TRANSIT: 'en_transit',
  COMMANDES_RECUES: 'commandes_recues',
  RECONCILIATION: 'reconciliation',
  COMPLETED: 'completed'
};

// Sous-onglets Actions
export const ACTIONS_TABS = {
  CUSTOM_ORDER: 'custom_order',
  RECOMMENDATIONS: 'recommendations'
};

// Sous-onglets Stock
export const STOCK_TABS = {
  NIVEAU_STOCK: 'niveau_stock',
  HISTORIQUE: 'historique'
};

// Sous-onglets Paramètres
export const SETTINGS_TABS = {
  GENERAL: 'general',
  PRODUCTS: 'products',
  SUPPLIERS: 'suppliers',
  MAPPING: 'mapping',
  WAREHOUSES: 'warehouses',
  MULTIPLIERS: 'multipliers',
  INTEGRATIONS: 'integrations'
};

// Sous-onglets Analytics
export const ANALYTICS_TABS = {
  KPIS: 'kpis',
  FORECAST: 'forecast'
};


// Filtres de stock
export const STOCK_FILTERS = {
  ALL: 'all',
  LOW_STOCK: 'low_stock',
  REORDER: 'reorder',
  OVERSTOCK: 'overstock',
  CRITICAL: 'critical'
};

// Devises disponibles
export const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dollar US' },
  { code: 'GBP', symbol: '£', label: 'Livre Sterling' }
];

// Valeurs par défaut des paramètres
export const DEFAULT_PARAMETERS = {
  seuilSurstockProfond: 90,
  deviseDefaut: 'EUR',
  multiplicateurDefaut: 1.2
};

// Messages de validation
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Ce champ est obligatoire',
  INVALID_EMAIL: 'Email invalide',
  INVALID_NUMBER: 'Nombre invalide',
  MIN_VALUE: (min) => `La valeur doit être supérieure à ${min}`,
  MAX_VALUE: (max) => `La valeur doit être inférieure à ${max}`,
  DUPLICATE_NAME: 'Ce nom existe déjà'
};

// Messages de succès
export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Commande créée avec succès !',
  ORDER_CONFIRMED: 'Commande confirmée !',
  ORDER_SHIPPED: 'Commande expédiée !',
  ORDER_RECEIVED: 'Commande reçue !',
  ORDER_COMPLETED: 'Commande complétée !',
  STOCK_UPDATED: 'Stock mis à jour !',
  SUPPLIER_CREATED: 'Fournisseur créé !',
  SUPPLIER_UPDATED: 'Fournisseur modifié !',
  SUPPLIER_DELETED: 'Fournisseur supprimé !',
  WAREHOUSE_CREATED: 'Entrepôt créé !',
  WAREHOUSE_UPDATED: 'Entrepôt modifié !',
  WAREHOUSE_DELETED: 'Entrepôt supprimé !',
  PARAMETER_SAVED: 'Paramètre sauvegardé !'
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  LOADING_FAILED: 'Erreur lors du chargement des données',
  SAVE_FAILED: 'Erreur lors de la sauvegarde',
  DELETE_FAILED: 'Erreur lors de la suppression',
  NETWORK_ERROR: 'Problème de connexion. Vérifiez votre connexion Internet.',
  NOT_FOUND: 'Élément introuvable',
  UNKNOWN_ERROR: 'Erreur inconnue'
};

// Configuration des intervalles de synchronisation
export const SYNC_INTERVALS = {
  AUTO_SYNC: 5 * 60 * 1000, // 5 minutes en millisecondes
  MANUAL_DEBOUNCE: 300 // 300ms pour debounce
};

// Limites d'affichage
export const DISPLAY_LIMITS = {
  MAX_DASHBOARD_ITEMS: 10,
  MAX_TABLE_ROWS_DEFAULT: 50,
  MAX_NOTIFICATIONS: 20
};

// Configuration des modals
export const MODAL_CONFIG = {
  ANIMATION_DURATION: 250, // ms
  BACKDROP_BLUR: true
};

// Formats de date
export const DATE_FORMATS = {
  DISPLAY: 'DD MMMM YYYY', // Ex: 14 octobre 2025
  API: 'YYYY-MM-DD', // Ex: 2025-10-14
  DATETIME_DISPLAY: 'DD/MM/YYYY HH:mm',
  DATETIME_API: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};

// Mapping des clés KPI vers leurs titres
// PHASE 1 : Extraite de StockEasy.jsx (lignes 623-628)
export const KPI_TITLES = {
  skuAvailability: 'Taux de Disponibilité des SKU',
  inventoryValuation: 'Valeur de l\'Inventaire',
  salesLost: 'Ventes Perdues - Rupture de Stock',
  overstockCost: 'Valeur Surstocks Profonds'
};
