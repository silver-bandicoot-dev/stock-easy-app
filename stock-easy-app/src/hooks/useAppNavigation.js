// ============================================
// HOOK useAppNavigation - Navigation basée sur l'URL
// Remplace useTabManagement pour une navigation React Router
// Supporte les sous-onglets et les paramètres de ressources (ex: /app/orders?id=PO-123)
// ============================================

import { useMemo, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  MAIN_TABS,
  SETTINGS_TABS,
  ANALYTICS_TABS
} from '../constants/stockEasyConstants';

/**
 * Mapping des chemins URL vers les IDs de tabs
 * Note: MAIN_TABS.STOCK = 'stock-level' mais l'URL utilise 'stock'
 */
const PATH_TO_TAB = {
  'dashboard': MAIN_TABS.DASHBOARD,
  'actions': MAIN_TABS.ACTIONS,
  'orders': MAIN_TABS.ORDERS,
  'stock': MAIN_TABS.STOCK,        // URL: /app/stock -> tab: 'stock-level'
  'inventory': MAIN_TABS.INVENTORY,
  'analytics': MAIN_TABS.ANALYTICS,
  'settings': MAIN_TABS.SETTINGS,
  'profile': MAIN_TABS.PROFILE,
  'help': MAIN_TABS.HELP
};

/**
 * Mapping inverse: IDs de tabs vers chemins URL
 * Note: 'stock-level' tab -> URL 'stock'
 */
const TAB_TO_PATH = {
  [MAIN_TABS.DASHBOARD]: 'dashboard',
  [MAIN_TABS.ACTIONS]: 'actions',
  [MAIN_TABS.ORDERS]: 'orders',
  [MAIN_TABS.STOCK]: 'stock',      // tab: 'stock-level' -> URL: /app/stock
  [MAIN_TABS.INVENTORY]: 'inventory',
  [MAIN_TABS.ANALYTICS]: 'analytics',
  [MAIN_TABS.SETTINGS]: 'settings',
  [MAIN_TABS.PROFILE]: 'profile',
  [MAIN_TABS.HELP]: 'help'
};

/**
 * Sous-onglets par défaut pour les sections avec sous-menus
 */
const DEFAULT_SUB_TABS = {
  analytics: ANALYTICS_TABS.KPIS,
  settings: SETTINGS_TABS.GENERAL
};

/**
 * Hook personnalisé pour la navigation basée sur l'URL
 * @returns {Object} API de navigation compatible avec l'ancien useTabManagement
 */
export const useAppNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Parse le chemin actuel pour extraire tab et subTab
   */
  const { activeTab, subTab } = useMemo(() => {
    // Le chemin est /app/[tab]/[subTab]
    const pathParts = location.pathname.replace('/app/', '').split('/').filter(Boolean);
    
    const mainPath = pathParts[0] || 'dashboard';
    const subPath = pathParts[1] || null;
    
    const tab = PATH_TO_TAB[mainPath] || MAIN_TABS.DASHBOARD;
    
    return {
      activeTab: tab,
      subTab: subPath
    };
  }, [location.pathname]);

  /**
   * Paramètres de ressource depuis l'URL (ex: ?order=PO-123, ?sku=ABC)
   */
  const resourceParams = useMemo(() => ({
    orderId: searchParams.get('order'),
    sku: searchParams.get('sku'),
    supplierId: searchParams.get('supplier'),
    warehouseId: searchParams.get('warehouse')
  }), [searchParams]);

  /**
   * Sous-onglet Analytics actif
   */
  const analyticsSubTab = useMemo(() => {
    if (activeTab !== MAIN_TABS.ANALYTICS) return ANALYTICS_TABS.KPIS;
    return subTab || ANALYTICS_TABS.KPIS;
  }, [activeTab, subTab]);

  /**
   * Sous-onglet Settings actif
   */
  const parametersSubTab = useMemo(() => {
    if (activeTab !== MAIN_TABS.SETTINGS) return SETTINGS_TABS.GENERAL;
    return subTab || SETTINGS_TABS.GENERAL;
  }, [activeTab, subTab]);

  /**
   * Naviguer vers un onglet principal
   */
  const setActiveTab = useCallback((tabId) => {
    const path = TAB_TO_PATH[tabId] || 'dashboard';
    
    // Pour analytics et settings, aller au sous-onglet par défaut
    if (tabId === MAIN_TABS.ANALYTICS) {
      navigate(`/app/analytics/${DEFAULT_SUB_TABS.analytics}`);
    } else if (tabId === MAIN_TABS.SETTINGS) {
      navigate(`/app/settings/${DEFAULT_SUB_TABS.settings}`);
    } else {
      navigate(`/app/${path}`);
    }
  }, [navigate]);

  /**
   * Naviguer vers un sous-onglet Analytics
   */
  const setAnalyticsSubTab = useCallback((subTabId) => {
    navigate(`/app/analytics/${subTabId}`);
  }, [navigate]);

  /**
   * Naviguer vers un sous-onglet Settings (Paramètres)
   */
  const setParametersSubTab = useCallback((subTabId) => {
    navigate(`/app/settings/${subTabId}`);
  }, [navigate]);

  /**
   * Navigation vers un onglet spécifique avec sous-onglet optionnel
   * (Compatible avec l'ancienne API)
   */
  const onNavigateToTab = useCallback((tabName, subTabName = null) => {
    const tabMap = {
      'settings': MAIN_TABS.SETTINGS,
      'orders': MAIN_TABS.ORDERS,
      'actions': MAIN_TABS.ACTIONS,
      'stock': MAIN_TABS.STOCK,
      'analytics': MAIN_TABS.ANALYTICS
    };
    
    const mappedTab = tabMap[tabName] || tabName;
    const path = TAB_TO_PATH[mappedTab] || tabName;
    
    if (subTabName) {
      navigate(`/app/${path}/${subTabName}`);
    } else if (mappedTab === MAIN_TABS.ANALYTICS) {
      navigate(`/app/analytics/${DEFAULT_SUB_TABS.analytics}`);
    } else if (mappedTab === MAIN_TABS.SETTINGS) {
      navigate(`/app/settings/${DEFAULT_SUB_TABS.settings}`);
    } else {
      navigate(`/app/${path}`);
    }
  }, [navigate]);

  /**
   * Générer un chemin URL pour un onglet (utile pour les liens)
   */
  const getTabPath = useCallback((tabId, subTabId = null) => {
    const path = TAB_TO_PATH[tabId] || 'dashboard';
    if (subTabId) {
      return `/app/${path}/${subTabId}`;
    }
    if (tabId === MAIN_TABS.ANALYTICS) {
      return `/app/analytics/${DEFAULT_SUB_TABS.analytics}`;
    }
    if (tabId === MAIN_TABS.SETTINGS) {
      return `/app/settings/${DEFAULT_SUB_TABS.settings}`;
    }
    return `/app/${path}`;
  }, []);

  /**
   * Naviguer vers une commande spécifique
   * @param {string} orderId - ID de la commande (ex: PO-2024-001)
   */
  const navigateToOrder = useCallback((orderId) => {
    navigate(`/app/orders?order=${encodeURIComponent(orderId)}`);
  }, [navigate]);

  /**
   * Naviguer vers un produit spécifique (dans Stock)
   * @param {string} sku - SKU du produit
   */
  const navigateToProduct = useCallback((sku) => {
    navigate(`/app/stock?sku=${encodeURIComponent(sku)}`);
  }, [navigate]);

  /**
   * Naviguer vers un fournisseur spécifique
   * @param {string} supplierId - ID ou nom du fournisseur
   */
  const navigateToSupplier = useCallback((supplierId) => {
    navigate(`/app/settings/suppliers?supplier=${encodeURIComponent(supplierId)}`);
  }, [navigate]);

  /**
   * Naviguer vers un entrepôt spécifique
   * @param {string} warehouseId - ID de l'entrepôt
   */
  const navigateToWarehouse = useCallback((warehouseId) => {
    navigate(`/app/settings/warehouses?warehouse=${encodeURIComponent(warehouseId)}`);
  }, [navigate]);

  /**
   * Effacer les paramètres de ressource de l'URL (après avoir traité)
   */
  const clearResourceParams = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('order');
    newParams.delete('sku');
    newParams.delete('supplier');
    newParams.delete('warehouse');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  /**
   * Générer une URL partageable pour une ressource
   * @param {string} type - Type de ressource ('order', 'product', 'supplier', 'warehouse')
   * @param {string} id - Identifiant de la ressource
   * @returns {string} URL complète partageable
   */
  const getShareableUrl = useCallback((type, id) => {
    const baseUrl = window.location.origin;
    switch (type) {
      case 'order':
        return `${baseUrl}/app/orders?order=${encodeURIComponent(id)}`;
      case 'product':
        return `${baseUrl}/app/stock?sku=${encodeURIComponent(id)}`;
      case 'supplier':
        return `${baseUrl}/app/settings/suppliers?supplier=${encodeURIComponent(id)}`;
      case 'warehouse':
        return `${baseUrl}/app/settings/warehouses?warehouse=${encodeURIComponent(id)}`;
      default:
        return `${baseUrl}/app/dashboard`;
    }
  }, []);

  return {
    // État dérivé de l'URL
    activeTab,
    analyticsSubTab,
    parametersSubTab,
    
    // Paramètres de ressource (order, sku, supplier, warehouse)
    resourceParams,
    
    // Fonctions de navigation (compatibles avec l'ancienne API)
    setActiveTab,
    setAnalyticsSubTab,
    setParametersSubTab,
    onNavigateToTab,
    
    // Navigation vers ressources spécifiques
    navigateToOrder,
    navigateToProduct,
    navigateToSupplier,
    navigateToWarehouse,
    
    // Utilitaires
    getTabPath,
    getShareableUrl,
    clearResourceParams,
    navigate,
    location,
    searchParams
  };
};

export default useAppNavigation;

