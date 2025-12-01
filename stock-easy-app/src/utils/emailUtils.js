// ============================================
// UTILITAIRES EMAIL - Réexport depuis le service centralisé
// Maintenu pour compatibilité descendante
// ============================================

import emailService from '../services/emailService';
import { formatCurrency } from './formatting';
import { roundToTwoDecimals } from './decimalUtils';
import { formatConfirmedDate } from './dateUtils';
import { ORDER_STATUS_LABELS } from '../constants/stockEasyConstants';

/**
 * Génère la signature de l'utilisateur pour les emails
 * @param {Object} currentUser - L'utilisateur actuel
 * @returns {string} La signature de l'utilisateur (vide si non disponible)
 * @deprecated Utiliser getUserSignature() du contexte StockDataContext qui inclut la société
 */
export const getUserSignature = (currentUser) => {
  if (currentUser && currentUser.firstName && currentUser.lastName) {
    return `${currentUser.firstName} ${currentUser.lastName}`;
  } else if (currentUser && currentUser.displayName) {
    return currentUser.displayName;
  } else if (currentUser && currentUser.email) {
    // Utiliser le nom avant @ comme fallback
    return currentUser.email.split('@')[0];
  }
  // Ne JAMAIS retourner "L'équipe Stockeasy" - retourner vide
  return '';
};

/**
 * Génère un brouillon d'email pour une commande
 * @deprecated Utiliser emailService.generateOrderEmail() à la place
 */
export const generateEmailDraft = (
  supplier,
  products,
  orderQuantities,
  suppliers,
  warehouses,
  selectedWarehouse,
  deviseDefaut,
  getUserSignatureFn
) => {
  const supplierInfo = suppliers[supplier] || {};
  const warehouseInfo = selectedWarehouse && warehouses[selectedWarehouse] 
    ? warehouses[selectedWarehouse]
    : null;

  // Utiliser le service centralisé
  const email = emailService.generateOrderEmail({
    supplierName: supplier,
    products,
    quantities: orderQuantities,
    supplier: supplierInfo,
    warehouse: warehouseInfo ? { ...warehouseInfo, name: selectedWarehouse } : { name: selectedWarehouse },
    signature: getUserSignatureFn ? getUserSignatureFn() : '',
    formatCurrency: (amount) => formatCurrency(roundToTwoDecimals(amount), deviseDefaut)
  });

  return {
    to: email.to || supplierInfo.email || 'email@fournisseur.com',
    subject: email.subject || `Commande Stockeasy - ${new Date().toLocaleDateString('fr-FR')}`,
    body: email.body
  };
};

/**
 * Génère un email de réclamation pour une commande avec écarts
 * @deprecated Utiliser emailService.generateReclamationEmail() à la place
 */
export const generateReclamationEmail = (order, suppliers, products, getUserSignatureFn) => {
  // Convertir les items de la commande au format attendu
  const receivedItems = {};
  const damagedQuantities = {};

  if (order.items) {
    order.items.forEach(item => {
      receivedItems[item.sku] = {
        received: item.receivedQuantity || 0,
        ordered: item.quantity
      };
      if (item.damagedQuantity > 0) {
        damagedQuantities[item.sku] = item.damagedQuantity;
      }
    });
  }

  const supplierInfo = suppliers[order.supplier] || {};

  const email = emailService.generateReclamationEmail({
    order,
    receivedItems,
    damagedQuantities,
    products,
    supplier: supplierInfo,
    notes: '',
    signature: getUserSignatureFn ? getUserSignatureFn() : ''
  });

  // Retourner au format legacy avec À: et Objet: en préfixe
  const reclamationEmail = supplierInfo.reclamationContactEmail ||
    supplierInfo.commercialContactEmail ||
    supplierInfo.email ||
    '';

  return `À: ${reclamationEmail}\n${email.body}`;
};

/**
 * Exporte l'historique des commandes en CSV
 * @param {Array} orders - Les commandes
 * @param {Array} products - Les produits
 * @param {string} historyFilter - Le filtre de statut
 * @param {string} historyDateStart - Date de début
 * @param {string} historyDateEnd - Date de fin
 * @param {string} currencySymbol - Le symbole de devise
 * @param {Function} formatWithCurrency - Fonction de formatage de devise
 * @param {Function} formatConfirmedDateFn - Fonction de formatage de date
 * @param {Function} roundToTwoDecimalsFn - Fonction d'arrondi
 * @param {Function} toastFn - Fonction toast pour les notifications
 * @returns {void}
 */
export const exportHistoryToCSV = (
  orders,
  products,
  historyFilter,
  historyDateStart,
  historyDateEnd,
  currencySymbol,
  formatWithCurrency,
  formatConfirmedDateFn,
  roundToTwoDecimalsFn,
  toastFn
) => {
  // Filtrer les commandes selon les critères actuels
  const filteredOrders = orders.filter(o => {
    // Filtrage par statut
    if (historyFilter !== 'all' && o.status !== historyFilter) return false;
    
    // Filtrage par dates
    if (historyDateStart || historyDateEnd) {
      const orderDate = new Date(o.createdAt);
      if (historyDateStart && orderDate < new Date(historyDateStart)) return false;
      if (historyDateEnd && orderDate > new Date(historyDateEnd)) return false;
    }
    
    return true;
  });

  // Générer le CSV avec détail des produits
  const priceHeader = `Prix Unitaire (${currencySymbol})`;
  const lineTotalHeader = `Total Ligne (${currencySymbol})`;
  const orderTotalHeader = `Total Commande (${currencySymbol})`;
  const headers = ['N° Commande', 'Fournisseur', 'Date Création', 'Date Confirmation', 'Date Expédition', 'Date Réception', 'Statut', 'SKU', 'Nom Produit', 'Quantité', priceHeader, lineTotalHeader, orderTotalHeader, 'Suivi'];
  const rows = [];
  
  const statusLabels = ORDER_STATUS_LABELS;
  
  filteredOrders.forEach(order => {
    order.items.forEach((item, index) => {
      const product = products.find(p => p.sku === item.sku);
      const lineTotal = roundToTwoDecimalsFn(item.quantity * item.pricePerUnit);
      
      rows.push([
        order.id,
        order.supplier,
        formatConfirmedDateFn(order.createdAt) || order.createdAt,
        formatConfirmedDateFn(order.confirmedAt) || order.confirmedAt || '-',
        formatConfirmedDateFn(order.shippedAt) || order.shippedAt || '-',
        formatConfirmedDateFn(order.receivedAt) || order.receivedAt || '-',
        statusLabels[order.status] || order.status,
        item.sku,
        product?.name || item.sku,
        item.quantity,
        formatWithCurrency(roundToTwoDecimalsFn(item.pricePerUnit)),
        formatWithCurrency(lineTotal),
        index === 0 ? formatWithCurrency(roundToTwoDecimalsFn(order.total)) : '',
        index === 0 ? (order.trackingNumber || '-') : ''
      ]);
    });
  });

  // Créer le contenu CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Créer le fichier et le télécharger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().split('T')[0];
  
  link.setAttribute('href', url);
  link.setAttribute('download', `historique-commandes-detaille-${today}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  const totalItems = rows.length;
  if (toastFn && typeof toastFn.success === 'function') {
    toastFn.success(`Export CSV réussi : ${filteredOrders.length} commande(s), ${totalItems} ligne(s) de produits exportée(s)`);
  }
};

// Réexporter les helpers du service
export const { isValidEmail, copyToClipboard, parseEmailContent, openEmailClient } = emailService;
