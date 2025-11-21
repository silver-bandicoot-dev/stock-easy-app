// ============================================
// HANDLERS RÉCLAMATION - Extraites de StockEasy.jsx
// PHASE 15 : Handlers Réclamation
// ============================================

import { toast } from 'sonner';

console.log('📁 Loading reclamationHandlers.js - Phase 15');

/**
 * PHASE 15 : Handler pour ouvrir le modal de réclamation
 * @param {Object} order - Commande pour laquelle générer la réclamation
 * @param {Function} generateReclamationEmail - Fonction pour générer l'email de réclamation
 * @param {Object} reclamationEmailModalHandlers - Handlers pour le modal de réclamation depuis useModals
 */
export const openReclamationModal = (
  order,
  generateReclamationEmail,
  reclamationEmailModalHandlers
) => {
  const emailContent = generateReclamationEmail(order);
  reclamationEmailModalHandlers.open(order, emailContent);
};

/**
 * PHASE 15 : Handler pour copier l'email de réclamation dans le presse-papier
 * @param {Object} reclamationEmailModal - Modal de réclamation depuis useModals
 */
export const copyReclamationToClipboard = (reclamationEmailModal) => {
  const emailContent = reclamationEmailModal.data.emailContent || '';
  navigator.clipboard.writeText(emailContent);
  toast.success('Email copié dans le presse-papier !');
};

/**
 * PHASE 15 : Handler pour valider une commande sans envoyer de réclamation
 * @param {Object} order - Commande à valider
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 */
export const validateWithoutReclamation = async (order, api, loadData) => {
  const confirm = window.confirm(
    `Êtes-vous sûr de vouloir valider cette commande sans envoyer de réclamation ?\n\n` +
    `Les quantités reçues seront enregistrées comme définitives et le stock sera ajusté en conséquence.`
  );
  
  if (!confirm) return;
  
  try {
    console.log('=== VALIDATION SANS RÉCLAMATION ===');
    
    // CORRECTION 1 & 4C: Ajuster le stock avec les quantités RÉELLEMENT reçues
    const stockUpdates = order.items.map(item => {
      const quantityReceived = parseInt(item.receivedQuantity, 10) || 0;
      console.log(`Stock ${item.sku}: +${quantityReceived} unités reçues`);
      return {
        sku: item.sku,
        quantityToAdd: quantityReceived
      };
    });
    
    console.log('Stock updates:', stockUpdates);
    
    // Mettre à jour le stock
    await api.updateStock(stockUpdates);
    
    // Marquer la commande comme completed
    await api.updateOrderStatus(order.id, {
      status: 'completed',
      completedAt: new Date().toISOString().split('T')[0]
    });
    
    await loadData();
    
    toast.success(`Commande ${order.id} validée avec les quantités reçues.`);
  } catch (error) {
    console.error('❌ Erreur:', error);
    toast.error('Erreur lors de la validation');
  }
};
