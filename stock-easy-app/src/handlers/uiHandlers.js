// ============================================
// HANDLERS UI - Extraites de Stockeasy.jsx
// PHASE 12 : Handlers Utilitaires UI
// PHASE 17 : Handlers UI Utilitaires (extension)
// ============================================

/**
 * PHASE 12 : Handler pour basculer l'affichage des détails d'une commande
 * @param {Function} setExpandedOrders - Fonction pour mettre à jour l'état des commandes étendues
 * @param {string} orderId - ID de la commande
 */
export const toggleOrderDetails = (setExpandedOrders, orderId) => {
  setExpandedOrders(prev => ({
    ...prev,
    [orderId]: !prev[orderId]
  }));
};

// ============================================
// PHASE 17 : Handlers UI Utilitaires
// ============================================

/**
 * PHASE 17 : Handler pour ouvrir le modal de graphique détaillé
 * @param {string} kpiKey - Clé du KPI à afficher
 * @param {Function} setSelectedKPI - Setter pour définir le KPI sélectionné
 * @param {Function} setChartModalOpen - Setter pour ouvrir/fermer le modal
 */
export const openChartModal = (kpiKey, setSelectedKPI, setChartModalOpen) => {
  console.log('📊 Ouverture du modal pour KPI:', kpiKey);
  setSelectedKPI(kpiKey);
  setChartModalOpen(true);
};

/**
 * PHASE 17 : Handler pour exporter l'historique en CSV
 * @param {Array} orders - Liste des commandes
 * @param {Array} products - Liste des produits
 * @param {string} historyFilter - Filtre de statut
 * @param {string} historyDateStart - Date de début
 * @param {string} historyDateEnd - Date de fin
 * @param {string} currencySymbol - Symbole de la devise
 * @param {Function} formatWithCurrency - Fonction de formatage avec devise
 * @param {Function} formatConfirmedDate - Fonction de formatage de date
 * @param {Function} roundToTwoDecimals - Fonction d'arrondi
 * @param {Function} toast - Fonction de notification
 * @param {Object} EmailUtils - Utilitaires d'email (contient exportHistoryToCSV)
 */
export const exportHistoryToCSV = (
  orders,
  products,
  historyFilter,
  historyDateStart,
  historyDateEnd,
  currencySymbol,
  formatWithCurrency,
  formatConfirmedDate,
  roundToTwoDecimals,
  toast,
  EmailUtils
) => {
  return EmailUtils.exportHistoryToCSV(
    orders,
    products,
    historyFilter,
    historyDateStart,
    historyDateEnd,
    currencySymbol,
    formatWithCurrency,
    formatConfirmedDate,
    roundToTwoDecimals,
    toast
  );
};

