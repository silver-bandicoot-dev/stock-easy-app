/**
 * Définition des étapes du tour guidé complet
 * Couvre tous les onglets principaux et les sous-onglets Paramètres
 * 
 * IMPORTANT: Les éléments ciblés doivent TOUJOURS exister dans le DOM
 * pour éviter les problèmes d'affichage du popover.
 */

/**
 * IDs des éléments à cibler dans le DOM
 * À utiliser comme référence pour ajouter les attributs id aux composants
 */
export const TOUR_ELEMENT_IDS = {
  // Header elements
  WELCOME: 'tour-welcome',
  SEARCHBAR: 'tour-searchbar',
  SYNC_BUTTON: 'tour-sync-button',
  NOTIFICATIONS: 'tour-notifications',
  PROFILE: 'tour-profile',
  
  // Sidebar & Navigation
  SIDEBAR: 'tour-sidebar',
  
  // Main tabs (dans la sidebar)
  TAB_DASHBOARD: 'tour-tab-dashboard',
  TAB_ACTIONS: 'tour-tab-actions',
  TAB_ORDERS: 'tour-tab-orders',
  TAB_STOCK: 'tour-tab-stock',
  TAB_INVENTORY: 'tour-tab-inventory',
  TAB_ANALYTICS: 'tour-tab-analytics',
  TAB_SETTINGS: 'tour-tab-settings',
  
  // Settings sub-tabs (visibles seulement quand menu expanded)
  SETTINGS_GENERAL: 'tour-settings-general',
  SETTINGS_MULTIPLIERS: 'tour-settings-multipliers',
  SETTINGS_SUPPLIERS: 'tour-settings-suppliers',
  SETTINGS_MAPPING: 'tour-settings-mapping',
  SETTINGS_WAREHOUSES: 'tour-settings-warehouses',
  SETTINGS_INTEGRATIONS: 'tour-settings-integrations',
  
  // Dashboard elements
  DASHBOARD_KPIS: 'tour-dashboard-kpis',
  ONBOARDING_CHECKLIST: 'tour-onboarding-checklist'
};

/**
 * Configuration des actions de navigation pour chaque étape
 * Permet au tour de naviguer automatiquement vers la bonne section
 */
export const TOUR_NAVIGATION_CONFIG = {
  // Onglets principaux
  [TOUR_ELEMENT_IDS.TAB_DASHBOARD]: { tab: 'dashboard' },
  [TOUR_ELEMENT_IDS.TAB_ACTIONS]: { tab: 'actions' },
  [TOUR_ELEMENT_IDS.TAB_ORDERS]: { tab: 'orders' },
  [TOUR_ELEMENT_IDS.TAB_STOCK]: { tab: 'stock-level' },
  [TOUR_ELEMENT_IDS.TAB_INVENTORY]: { tab: 'inventory' },
  [TOUR_ELEMENT_IDS.TAB_ANALYTICS]: { tab: 'analytics' },
  [TOUR_ELEMENT_IDS.TAB_SETTINGS]: { tab: 'settings', expandSettings: true },
  
  // Sous-onglets Paramètres (expansion requise)
  [TOUR_ELEMENT_IDS.SETTINGS_GENERAL]: { tab: 'settings', subTab: 'general', expandSettings: true },
  [TOUR_ELEMENT_IDS.SETTINGS_MULTIPLIERS]: { tab: 'settings', subTab: 'multipliers', expandSettings: true },
  [TOUR_ELEMENT_IDS.SETTINGS_SUPPLIERS]: { tab: 'settings', subTab: 'suppliers', expandSettings: true },
  [TOUR_ELEMENT_IDS.SETTINGS_MAPPING]: { tab: 'settings', subTab: 'mapping', expandSettings: true },
  [TOUR_ELEMENT_IDS.SETTINGS_WAREHOUSES]: { tab: 'settings', subTab: 'warehouses', expandSettings: true },
  [TOUR_ELEMENT_IDS.SETTINGS_INTEGRATIONS]: { tab: 'settings', subTab: 'integrations', expandSettings: true }
};

/**
 * Génère les étapes du tour avec les traductions
 * @param {Function} t - Fonction de traduction i18n
 * @returns {Array} Liste des étapes pour Driver.js
 */
export const getMainTourSteps = (t) => [
  // ============================================
  // PARTIE 1: Accueil (1 étape sans élément - modal central)
  // ============================================
  {
    popover: {
      title: t('tour.steps.welcome.title', 'Bienvenue sur StockEasy ! 👋'),
      description: t('tour.steps.welcome.description', 'Découvrons ensemble les fonctionnalités principales de votre outil de gestion de stock intelligent. Ce tour vous guidera à travers l\'interface.'),
      side: 'over',
      align: 'center'
    }
  },

  // ============================================
  // PARTIE 2: Navigation principale (1 étape)
  // ============================================
  {
    element: `#${TOUR_ELEMENT_IDS.SIDEBAR}`,
    popover: {
      title: t('tour.steps.sidebar.title', 'Navigation principale'),
      description: t('tour.steps.sidebar.description', 'Voici votre menu de navigation. Vous pouvez accéder à toutes les sections de l\'application depuis cette barre latérale.'),
      side: 'right',
      align: 'start'
    }
  },

  // ============================================
  // PARTIE 3: Onglets principaux (6 étapes)
  // ============================================
  {
    element: `#${TOUR_ELEMENT_IDS.TAB_DASHBOARD}`,
    popover: {
      title: t('tour.steps.tabDashboard.title', '📊 Tableau de bord'),
      description: t('tour.steps.tabDashboard.description', 'Vue d\'ensemble de votre activité : alertes stock, commandes en cours et indicateurs clés.'),
      side: 'right',
      align: 'center'
    }
  },
  {
    element: `#${TOUR_ELEMENT_IDS.TAB_ACTIONS}`,
    popover: {
      title: t('tour.steps.tabActions.title', '➕ Passer commande'),
      description: t('tour.steps.tabActions.description', 'Créez vos commandes fournisseurs en quelques clics. Les quantités sont calculées automatiquement.'),
      side: 'right',
      align: 'center'
    }
  },
  {
    element: `#${TOUR_ELEMENT_IDS.TAB_ORDERS}`,
    popover: {
      title: t('tour.steps.tabOrders.title', '🚚 Mes commandes'),
      description: t('tour.steps.tabOrders.description', 'Suivez toutes vos commandes : en attente, en transit, livrées. Gérez les réceptions et réconciliations.'),
      side: 'right',
      align: 'center'
    }
  },
  {
    element: `#${TOUR_ELEMENT_IDS.TAB_STOCK}`,
    popover: {
      title: t('tour.steps.tabStock.title', '📦 Niveaux de stock'),
      description: t('tour.steps.tabStock.description', 'Visualisez l\'état de votre stock en temps réel. Filtrez par statut (critique, bas, optimal, surstock).'),
      side: 'right',
      align: 'center'
    }
  },
  {
    element: `#${TOUR_ELEMENT_IDS.TAB_INVENTORY}`,
    popover: {
      title: t('tour.steps.tabInventory.title', '📋 Inventaire'),
      description: t('tour.steps.tabInventory.description', 'Consultez et exportez votre inventaire complet avec toutes les informations produits.'),
      side: 'right',
      align: 'center'
    }
  },
  {
    element: `#${TOUR_ELEMENT_IDS.TAB_ANALYTICS}`,
    popover: {
      title: t('tour.steps.tabAnalytics.title', '📈 Analytics'),
      description: t('tour.steps.tabAnalytics.description', 'Analysez vos performances et accédez aux prévisions IA pour anticiper vos besoins.'),
      side: 'right',
      align: 'center'
    }
  },

  // ============================================
  // PARTIE 4: Paramètres (1 seule étape avec description détaillée)
  // Note: Les sous-onglets sont dynamiques et ne peuvent pas être ciblés directement
  // ============================================
  {
    element: `#${TOUR_ELEMENT_IDS.TAB_SETTINGS}`,
    popover: {
      title: t('tour.steps.tabSettings.title', '⚙️ Paramètres'),
      description: t('tour.steps.tabSettings.description', 'Configurez StockEasy selon vos besoins :\n\n• **Général** : Seuils de stock, devise\n• **Multiplicateurs** : Coefficients de calcul\n• **Fournisseurs** : Gestion des contacts\n• **Mapping** : Association produits-fournisseurs\n• **Entrepôts** : Lieux de stockage\n• **Intégrations** : Shopify, email...'),
      side: 'right',
      align: 'center'
    }
  },

  // ============================================
  // PARTIE 5: Outils Header (4 étapes)
  // ============================================
  {
    element: `#${TOUR_ELEMENT_IDS.SEARCHBAR}`,
    popover: {
      title: t('tour.steps.search.title', '🔍 Recherche rapide'),
      description: t('tour.steps.search.description', 'Recherchez n\'importe quoi : produits, fournisseurs, paramètres. Utilisez ⌘K (Mac) ou Ctrl+K (Windows) pour un accès instantané !'),
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: `#${TOUR_ELEMENT_IDS.SYNC_BUTTON}`,
    popover: {
      title: t('tour.steps.sync.title', '🔄 Synchronisation'),
      description: t('tour.steps.sync.description', 'Synchronisez vos données avec Shopify à tout moment. La sync se fait aussi automatiquement en arrière-plan.'),
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: `#${TOUR_ELEMENT_IDS.NOTIFICATIONS}`,
    popover: {
      title: t('tour.steps.notifications.title', '🔔 Notifications'),
      description: t('tour.steps.notifications.description', 'Recevez des alertes en temps réel : stocks critiques, commandes à réceptionner, et plus encore.'),
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: `#${TOUR_ELEMENT_IDS.PROFILE}`,
    popover: {
      title: t('tour.steps.profile.title', '👤 Votre profil'),
      description: t('tour.steps.profile.description', 'Accédez à votre profil et gérez vos préférences de compte. C\'est terminé ! 🎉 Explorez maintenant StockEasy à votre rythme.'),
      side: 'bottom',
      align: 'end'
    }
  }
];

/**
 * Nombre total d'étapes du tour
 * (13 étapes après simplification des sous-onglets Settings)
 */
export const TOTAL_TOUR_STEPS = 13;
