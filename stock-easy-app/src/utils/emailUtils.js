// ============================================
// UTILITAIRES EMAIL - Extraites de StockEasy.jsx
// PHASE 2 : Fonctions Utilitaires Pures
// ============================================

import { formatCurrency } from './formatting';
import { roundToTwoDecimals } from './decimalUtils';
import { formatConfirmedDate } from './dateUtils';
import { ORDER_STATUS_LABELS } from '../constants/stockEasyConstants';

console.log('📁 Loading emailUtils.js - Phase 2');

/**
 * Génère la signature de l'utilisateur pour les emails
 * @param {Object} currentUser - L'utilisateur actuel
 * @returns {string} La signature de l'utilisateur
 */
export const getUserSignature = (currentUser) => {
  if (currentUser && currentUser.firstName && currentUser.lastName) {
    return `${currentUser.firstName} ${currentUser.lastName}`;
  } else if (currentUser && currentUser.displayName) {
    return currentUser.displayName;
  }
  return "L'équipe stockeasy";
};

/**
 * Génère un brouillon d'email pour une commande
 * @param {string} supplier - Le nom du fournisseur
 * @param {Array} products - Les produits à commander
 * @param {Object} orderQuantities - Les quantités par SKU
 * @param {Object} suppliers - Les fournisseurs (objet map)
 * @param {Object} warehouses - Les entrepôts disponibles
 * @param {string} selectedWarehouse - L'entrepôt sélectionné
 * @param {string} deviseDefaut - La devise par défaut
 * @param {Function} getUserSignatureFn - Fonction pour obtenir la signature
 * @returns {Object} L'objet email avec to, subject, body
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
  const productList = products.map(p => {
    const qty = orderQuantities[p.sku] || p.qtyToOrder;
    return `- ${p.name} (SKU: ${p.sku}) - Quantité: ${qty} unités - Prix unitaire: ${formatCurrency(roundToTwoDecimals(p.buyPrice), deviseDefaut)}`;
  }).join('\n');
  
  const total = roundToTwoDecimals(products.reduce((sum, p) => {
    const qty = orderQuantities[p.sku] || p.qtyToOrder;
    // Utiliser l'investissement si disponible, sinon calculer qty * buyPrice
    return sum + (p.investment || (qty * p.buyPrice) || 0);
  }, 0));
  
  // Informations d'entrepôt
  const warehouseInfo = selectedWarehouse && warehouses[selectedWarehouse] 
    ? `\n\nEntrepôt de livraison : ${selectedWarehouse}\nAdresse :\n${warehouses[selectedWarehouse].address}\n${warehouses[selectedWarehouse].postalCode} ${warehouses[selectedWarehouse].city}\n${warehouses[selectedWarehouse].country}`
    : '';
  
  return {
    to: supplierInfo.email || 'email@fournisseur.com',
    subject: `Commande stockeasy - ${new Date().toLocaleDateString('fr-FR')}`,
    body: `Bonjour,

Nous souhaitons passer la commande suivante :

${productList}

TOTAL: ${formatCurrency(total, deviseDefaut)}${warehouseInfo}

Merci de nous confirmer la disponibilité et la date de livraison estimée.

Conditions habituelles: ${supplierInfo.leadTimeDays} jours - MOQ respecté

Cordialement,
${getUserSignatureFn()}`
  };
};

/**
 * Génère un email de réclamation pour une commande avec écarts
 * @param {Object} order - La commande concernée
 * @param {Object} suppliers - Les fournisseurs (objet map)
 * @param {Array} products - Les produits
 * @param {Function} getUserSignatureFn - Fonction pour obtenir la signature
 * @returns {string} Le contenu de l'email de réclamation
 */
export const generateReclamationEmail = (order, suppliers, products, getUserSignatureFn) => {
  // Filtrer les items avec problèmes
  const missingItems = order.items.filter(i => {
    const totalReceived = (i.receivedQuantity || 0) + (i.damagedQuantity || 0);
    return totalReceived < i.quantity;
  });
  
  const damagedItems = order.items.filter(i => (i.damagedQuantity || 0) > 0);
  
  const supplierData = suppliers[order.supplier] || {};
  const reclamationEmail =
    supplierData.reclamationContactEmail ||
    supplierData.commercialContactEmail ||
    supplierData.email ||
    '';
  const reclamationName = supplierData.reclamationContactName || supplierData.commercialContactName || '';
  const reclamationPhone = supplierData.reclamationContactPhone || supplierData.commercialContactPhone || '';

  let email = `À: ${reclamationEmail}\n`;
  email += `Objet: Réclamation - Commande ${order.id}\n\n`;
  email += `Bonjour,\n\n`;
  email += `Nous avons réceptionné la commande ${order.id} mais constatons les problèmes suivants :\n\n`;
  
  if (missingItems.length > 0) {
    email += `🔴 QUANTITÉS MANQUANTES:\n`;
    email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    missingItems.forEach(item => {
      const product = products.find(p => p.sku === item.sku);
      const totalReceived = (item.receivedQuantity || 0) + (item.damagedQuantity || 0);
      const missing = item.quantity - totalReceived;
      email += `\n▸ ${product?.name || item.sku}\n`;
      email += `  SKU: ${item.sku}\n`;
      email += `  Commandé: ${item.quantity} unités\n`;
      email += `  Reçu sain: ${item.receivedQuantity || 0} unités\n`;
      if (item.damagedQuantity > 0) {
        email += `  Reçu endommagé: ${item.damagedQuantity} unités\n`;
        email += `  Total reçu: ${totalReceived} unités\n`;
      }
      email += `  Manquant: ${missing} unités\n`;
      if (item.discrepancyNotes) {
        email += `  Notes: ${item.discrepancyNotes}\n`;
      }
    });
    email += `\n`;
  }
  
  if (damagedItems.length > 0) {
    email += `⚠️ PRODUITS ENDOMMAGÉS:\n`;
    email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    damagedItems.forEach(item => {
      const product = products.find(p => p.sku === item.sku);
      const totalReceived = (item.receivedQuantity || 0) + (item.damagedQuantity || 0);
      const missing = item.quantity - totalReceived;
      email += `\n▸ ${product?.name || item.sku}\n`;
      email += `  SKU: ${item.sku}\n`;
      email += `  Quantité endommagée: ${item.damagedQuantity} unités\n`;
      if (missing > 0) {
        email += `  Note: Également ${missing} unités manquantes (voir section ci-dessus)\n`;
      }
      if (item.discrepancyNotes) {
        email += `  Description: ${item.discrepancyNotes}\n`;
      }
    });
    email += `\n`;
  }
  
  email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  email += `Merci de procéder rapidement au remplacement ou à l'envoi des articles manquants/endommagés.\n\n`;
  if (reclamationName || reclamationPhone) {
    email += `Contact réclamations côté fournisseur: ${reclamationName || 'N/A'}${reclamationPhone ? ` - Tél: ${reclamationPhone}` : ''}\n\n`;
  }
  email += `Cordialement,\n`;
  email += `${getUserSignatureFn()}`;
  
  return email;
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
 * @param {Function} formatConfirmedDate - Fonction de formatage de date
 * @param {Function} roundToTwoDecimals - Fonction d'arrondi
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
  formatConfirmedDate,
  roundToTwoDecimals,
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
  
  // Utiliser ORDER_STATUS_LABELS (déjà extrait en Phase 1)
  const statusLabels = ORDER_STATUS_LABELS;
  
  filteredOrders.forEach(order => {
    // Pour chaque commande, créer une ligne par produit
    order.items.forEach((item, index) => {
      const product = products.find(p => p.sku === item.sku);
      const lineTotal = roundToTwoDecimals(item.quantity * item.pricePerUnit);
      
      rows.push([
        order.id,
        order.supplier,
        formatConfirmedDate(order.createdAt) || order.createdAt,
        formatConfirmedDate(order.confirmedAt) || order.confirmedAt || '-',
        formatConfirmedDate(order.shippedAt) || order.shippedAt || '-',
        formatConfirmedDate(order.receivedAt) || order.receivedAt || '-',
        statusLabels[order.status] || order.status,
        item.sku,
        product?.name || item.sku,
        item.quantity,
        formatWithCurrency(roundToTwoDecimals(item.pricePerUnit)),
        formatWithCurrency(lineTotal),
        // Afficher le total de la commande seulement sur la première ligne de chaque commande
        index === 0 ? formatWithCurrency(roundToTwoDecimals(order.total)) : '',
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

