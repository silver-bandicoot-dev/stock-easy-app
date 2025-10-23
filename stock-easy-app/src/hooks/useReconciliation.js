import { useState } from 'react';
import api from '../services/apiService';
import { toast } from 'sonner';

/**
 * Hook pour la gestion de la logique de réconciliation des commandes
 */
export const useReconciliation = (loadData) => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Traite la réconciliation d'une commande
   * @param {Object} order - La commande à réconcilier
   * @param {Object} reconciliationData - Les données de réconciliation
   * @returns {Object} - Résultat de la réconciliation
   */
  const processReconciliation = async (order, reconciliationData) => {
    if (!order || !reconciliationData) {
      return { success: false, error: 'Données manquantes' };
    }

    setIsProcessing(true);
    
    try {
      // Préparer les données de réconciliation
      const reconciliationPayload = {
        orderId: order.id,
        receivedItems: reconciliationData.receivedItems || {},
        discrepancies: reconciliationData.discrepancies || {},
        damages: reconciliationData.damages || {},
        notes: reconciliationData.notes || '',
        receivedDate: new Date().toISOString()
      };

      // Appeler l'API pour traiter la réconciliation
      const result = await api.processOrderReconciliation(reconciliationPayload);
      
      if (result.success) {
        // Recharger les données
        await loadData();
        
        // Vérifier s'il y a des écarts nécessitant une réclamation
        const hasDiscrepancies = Object.keys(reconciliationData.discrepancies || {}).length > 0;
        const hasDamages = Object.keys(reconciliationData.damages || {}).length > 0;
        
        return {
          success: true,
          requiresReclamation: hasDiscrepancies || hasDamages,
          reconciliationId: result.reconciliationId
        };
      } else {
        throw new Error(result.error || 'Erreur lors de la réconciliation');
      }
    } catch (error) {
      console.error('Erreur lors de la réconciliation:', error);
      toast.error(`Erreur lors de la réconciliation: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Génère un résumé de réconciliation pour affichage
   * @param {Object} reconciliationData - Les données de réconciliation
   * @returns {Object} - Résumé formaté
   */
  const generateReconciliationSummary = (reconciliationData) => {
    const receivedItems = reconciliationData.receivedItems || {};
    const discrepancies = reconciliationData.discrepancies || {};
    const damages = reconciliationData.damages || {};

    const totalReceived = Object.values(receivedItems).reduce((sum, qty) => sum + qty, 0);
    const totalDiscrepancies = Object.values(discrepancies).reduce((sum, qty) => sum + qty, 0);
    const totalDamages = Object.values(damages).reduce((sum, qty) => sum + qty, 0);

    return {
      totalReceived,
      totalDiscrepancies,
      totalDamages,
      hasIssues: totalDiscrepancies > 0 || totalDamages > 0,
      itemsCount: Object.keys(receivedItems).length
    };
  };

  /**
   * Valide les données de réconciliation avant traitement
   * @param {Object} reconciliationData - Les données à valider
   * @returns {Object} - Résultat de la validation
   */
  const validateReconciliationData = (reconciliationData) => {
    const errors = [];

    if (!reconciliationData.receivedItems || Object.keys(reconciliationData.receivedItems).length === 0) {
      errors.push('Aucun article reçu spécifié');
    }

    // Vérifier que les quantités reçues sont positives
    Object.entries(reconciliationData.receivedItems || {}).forEach(([sku, qty]) => {
      if (qty < 0) {
        errors.push(`Quantité négative pour ${sku}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    isProcessing,
    processReconciliation,
    generateReconciliationSummary,
    validateReconciliationData
  };
};
