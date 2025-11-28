// ============================================
// HOOK useTabManagement - Extraites de Stockeasy.jsx
// PRIORITÉ 5 : Gestion de la navigation entre onglets
// ============================================

import { useState } from 'react';
import {
  MAIN_TABS,
  SETTINGS_TABS,
  ANALYTICS_TABS
} from '../constants/stockEasyConstants';

console.log('📁 Loading useTabManagement.js - Priorité 5');

/**
 * Hook personnalisé pour gérer la navigation entre onglets et sous-onglets
 * @returns {Object} Objet contenant les états et fonctions de navigation
 */
export const useTabManagement = () => {
  // États pour les onglets principaux
  const [activeTab, setActiveTab] = useState(MAIN_TABS.DASHBOARD);
  
  // États pour les sous-onglets
  const [parametersSubTab, setParametersSubTab] = useState(SETTINGS_TABS.GENERAL);
  const [analyticsSubTab, setAnalyticsSubTab] = useState(ANALYTICS_TABS.KPIS);

  /**
   * Fonction pour naviguer vers un onglet spécifique avec sous-onglet optionnel
   * @param {string} tabName - Nom de l'onglet (peut être une constante MAIN_TABS ou un nom string)
   * @param {string|null} subTabName - Nom du sous-onglet optionnel
   */
  const onNavigateToTab = (tabName, subTabName = null) => {
    // Mapper les noms d'onglets aux constantes MAIN_TABS
    const tabMap = {
      'settings': MAIN_TABS.SETTINGS,
      'orders': MAIN_TABS.ORDERS,
      'actions': MAIN_TABS.ACTIONS,
      'stock': MAIN_TABS.STOCK,
      'analytics': MAIN_TABS.ANALYTICS
    };
    
    const mappedTab = tabMap[tabName] || tabName;
    setActiveTab(mappedTab);
    
    // Gérer les sous-onglets si nécessaire
    if (subTabName === 'mapping') {
      setParametersSubTab(SETTINGS_TABS.MAPPING);
    }
    // Autres sous-onglets peuvent être ajoutés ici
  };

  return {
    activeTab,
    setActiveTab,
    parametersSubTab,
    setParametersSubTab,
    analyticsSubTab,
    setAnalyticsSubTab,
    onNavigateToTab
  };
};


