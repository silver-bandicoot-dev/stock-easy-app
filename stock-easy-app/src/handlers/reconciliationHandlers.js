// ============================================
// HANDLERS RÉCONCILIATION - Extraites de StockEasy.jsx
// PHASE 9 : Handlers Réconciliation
// PHASE 13 : Handlers Réconciliation Unifiée
// ============================================

import { toast } from 'sonner';

console.log('📁 Loading reconciliationHandlers.js - Phase 9 & 13');

/**
 * Confirme la réconciliation avec quantités reçues et endommagées
 * @param {Object} inlineModals - Objet contenant les modals inline (reconciliationModal)
 * @param {Object} discrepancyTypes - Types de problèmes par SKU
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} setDiscrepancyTypes - Setter pour définir les types de problèmes
 * @param {Function} setTrackTabSection - Setter pour changer la section de l'onglet Track
 */
export const confirmReconciliationWithQuantities = async (
  inlineModals,
  discrepancyTypes,
  api,
  loadData,
  setDiscrepancyTypes,
  setTrackTabSection
) => {

  try {
    const reconciliationOrder = inlineModals.reconciliationModal.reconciliationOrder;
    if (!reconciliationOrder) return;
    
    console.log('🔍 Début de la réconciliation:', reconciliationOrder.id);
    console.log('Quantités reçues:', inlineModals.reconciliationModal.discrepancyItems);
    console.log('Types de problèmes:', discrepancyTypes);
    console.log('Quantités endommagées:', inlineModals.reconciliationModal.damagedQuantities);
    
    // Préparer les items avec quantités et types de problèmes
    const updatedItems = reconciliationOrder.items.map(item => {
      const receivedQty = parseInt(inlineModals.reconciliationModal.discrepancyItems[item.sku]?.received, 10);
      const damagedQty = parseInt(inlineModals.reconciliationModal.damagedQuantities[item.sku] || 0, 10);
      const notes = inlineModals.reconciliationModal.discrepancyItems[item.sku]?.notes || '';
      
      // Validation
      if (isNaN(receivedQty) || receivedQty < 0) {
        throw new Error(`Quantité invalide pour ${item.sku}`);
      }
      if (isNaN(damagedQty) || damagedQty < 0) {
        throw new Error(`Quantité endommagée invalide pour ${item.sku}`);
      }
      
      // Calculer le total reçu (sain + endommagé)
      const totalReceived = receivedQty + damagedQty;
      
      // Calculer l'écart de quantité (commande - total reçu)
      const discrepancyQty = item.quantity - totalReceived;
      
      // Déterminer le type de problème
      let itemType = 'none';
      const hasMissing = totalReceived < item.quantity;
      const hasDamaged = damagedQty > 0;
      
      if (hasMissing && hasDamaged) {
        itemType = 'missing_and_damaged'; // Les deux problèmes
      } else if (hasMissing) {
        itemType = 'missing';
      } else if (hasDamaged) {
        itemType = 'damaged';
      }
      
      return {
        sku: item.sku,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        receivedQuantity: receivedQty,
        damagedQuantity: damagedQty,
        discrepancyType: itemType,
        discrepancyQuantity: discrepancyQty,
        discrepancyNotes: notes
      };
    });
    
    console.log('Items mis à jour:', updatedItems);
    
    // Vérifier s'il y a des problèmes
    const hasProblems = updatedItems.some(item => 
      item.receivedQuantity < item.quantity || 
      item.damagedQuantity > 0
    );
    
    console.log('A des problèmes:', hasProblems);
    
    // Calculer les quantités manquantes et endommagées par SKU
    const missingQuantitiesBySku = {};
    const damagedQuantitiesBySku = {};
    
    updatedItems.forEach(item => {
      const missing = item.quantity - (item.receivedQuantity + item.damagedQuantity);
      if (missing > 0) {
        missingQuantitiesBySku[item.sku] = missing;
      }
      if (item.damagedQuantity > 0) {
        damagedQuantitiesBySku[item.sku] = item.damagedQuantity;
      }
    });
    
    // Sauvegarder dans la base de données
    const updatePayload = {
      status: hasProblems ? 'reconciliation' : 'completed',
      receivedAt: new Date().toISOString().split('T')[0],
      hasDiscrepancy: hasProblems,
      items: updatedItems,
      missingQuantitiesBySku: missingQuantitiesBySku,
      damagedQuantitiesBySku: damagedQuantitiesBySku
    };
    
    console.log('Payload de mise à jour:', updatePayload);
    
    await api.updateOrderStatus(reconciliationOrder.id, updatePayload);
    
    // Mettre à jour le stock uniquement pour les quantités reçues saines
    // NE PAS ajouter les produits endommagés au stock
    const stockUpdates = updatedItems
      .map(item => ({
        sku: item.sku,
        quantityToAdd: item.receivedQuantity // Seulement les quantités saines
      }))
      .filter(update => update.quantityToAdd > 0); // Ne traiter que les quantités > 0
    
    console.log('Mises à jour du stock:', stockUpdates);
    
    if (stockUpdates.length > 0) {
      await api.updateStock(stockUpdates);
      console.log('✅ Stock mis à jour avec succès');
    }
    
    // Recharger les données
    await loadData();
    
    // Fermer la modal et nettoyer les états
    inlineModals.reconciliationModal.closeReconciliationModal();
    setDiscrepancyTypes({});
    
    toast.success(
      hasProblems ? 
        'Réception enregistrée avec écarts. Commande déplacée vers "Réconciliation".' : 
        'Réception validée et stock mis à jour avec succès!',
      { duration: 5000 }
    );
    
    // Rediriger vers l'onglet Réconciliation si des problèmes sont détectés
    if (hasProblems) {
      setTrackTabSection('reconciliation');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
    toast.error('Erreur lors de la validation de la réception: ' + error.message);
  }
};

/**
 * Handler principal pour confirmer la réconciliation
 * @param {Object} reconciliationData - Données de réconciliation (receivedItems, damages, discrepancies, notes)
 * @param {Object} reconciliationModal - Modal de réconciliation (contient order dans data)
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Object} reconciliationModalHandlers - Handlers pour la modal de réconciliation
 * @param {Object} reclamationEmailModalHandlers - Handlers pour la modal d'email de réclamation
 * @param {Object} emailGeneration - Service de génération d'emails
 * @param {Function} getUserSignature - Fonction pour obtenir la signature utilisateur
 * @param {Array} products - Liste des produits
 */
export const handleReconciliationConfirm = async (
  reconciliationData,
  reconciliationModal,
  api,
  loadData,
  reconciliationModalHandlers,
  reclamationEmailModalHandlers,
  emailGeneration,
  getUserSignature,
  products
) => {

  try {
    const order = reconciliationModal.data.order;
    
    console.log('🔥 handleReconciliationConfirm APPELÉE');
    console.log('🔥 reconciliationData:', reconciliationData);
    console.log('🔥 order:', order);
    
    // Analyser les données pour déterminer s'il y a des écarts ou dommages
    const hasDiscrepancies = Object.values(reconciliationData.discrepancies || {}).some(d => d !== 0);
    const hasDamages = Object.values(reconciliationData.damages || {}).some(d => d > 0);
    
    console.log('🔥 hasDiscrepancies:', hasDiscrepancies, 'hasDamages:', hasDamages);
    
    if (hasDiscrepancies || hasDamages) {
      // Calculer les quantités manquantes et endommagées par SKU
      const missingQuantitiesBySku = {};
      const damagedQuantitiesBySku = {};
      
      // Le modal envoie receivedItems = quantités reçues, damages = quantités endommagées
      order.items.forEach(item => {
        const ordered = item.quantity || 0;
        const receivedSaine = parseInt(reconciliationData.receivedItems?.[item.sku] || 0, 10);
        const damaged = parseInt(reconciliationData.damages?.[item.sku] || 0, 10);
        
        // Missing = Commandé - (Reçu sain + Endommagé)
        const missing = ordered - receivedSaine - damaged;
        
        console.log(`📦 ${item.sku}: commandé=${ordered}, reçu=${receivedSaine}, endommagé=${damaged}, manquant=${missing}`);
        
        if (missing > 0) {
          missingQuantitiesBySku[item.sku] = missing;
        }
        if (damaged > 0) {
          damagedQuantitiesBySku[item.sku] = damaged;
        }
      });
      
      console.log('📦 missingQuantitiesBySku:', missingQuantitiesBySku);
      console.log('📦 damagedQuantitiesBySku:', damagedQuantitiesBySku);
      
      // Mettre à jour les items avec les quantités reçues et endommagées
      const updatedItems = order.items.map(item => {
        const receivedSaine = parseInt(reconciliationData.receivedItems?.[item.sku] || 0, 10);
        const damaged = parseInt(reconciliationData.damages?.[item.sku] || 0, 10);
        
        return {
          ...item,
          receivedQuantity: receivedSaine,
          damagedQuantity: damaged
        };
      });
      
      console.log('📦 updatedItems:', updatedItems);
      
      // Il y a des écarts ou dommages - passer au statut 'reconciliation'
      await api.updateOrderStatus(order.id, {
        status: 'reconciliation',
        receivedAt: new Date().toISOString().split('T')[0],
        hasDiscrepancy: hasDiscrepancies,
        damageReport: hasDamages,
        items: updatedItems,
        missingQuantitiesBySku: missingQuantitiesBySku,
        damagedQuantitiesBySku: damagedQuantitiesBySku
      });
      
      // Mettre à jour le stock avec les quantités reçues
      const stockUpdates = Object.entries(reconciliationData.receivedItems || {}).map(([sku, data]) => {
        const quantityReceived = parseInt(data.received || data, 10) || 0;
        return {
          sku,
          quantityToAdd: quantityReceived
        };
      });
      
      await api.updateStock(stockUpdates);
      
      reconciliationModalHandlers.close();
      
      // Générer l'email de réclamation si nécessaire
      const emailContent = emailGeneration.generateReclamationEmail(
        order,
        reconciliationData.receivedItems,
        reconciliationData.damages,
        reconciliationData.notes || getUserSignature(),
        products
      );
      
      if (emailContent) {
        reclamationEmailModalHandlers.open(order, emailContent);
      }
      
      toast.success('Commande mise en réconciliation avec réclamation générée');
    } else {
      // Pas d'écarts - marquer comme complétée
      await api.updateOrderStatus(order.id, {
        status: 'completed',
        receivedAt: new Date().toISOString().split('T')[0],
        completedAt: new Date().toISOString().split('T')[0],
        hasDiscrepancy: false,
        damageReport: false
      });
      
      // Mettre à jour le stock
      const stockUpdates = Object.entries(reconciliationData.receivedItems || {}).map(([sku, data]) => {
        const quantityReceived = parseInt(data.received || data, 10) || 0;
        return {
          sku,
          quantityToAdd: quantityReceived
        };
      });
      
      await api.updateStock(stockUpdates);
      
      reconciliationModalHandlers.close();
      toast.success('Réconciliation validée - Commande complétée');
    }
    
    // Recharger les données
    await loadData();
    
  } catch (error) {
    console.error('Erreur lors de la réconciliation:', error);
    toast.error('Erreur lors de la réconciliation');
  }
};

/**
 * PHASE 13 : Handler pour soumettre la réconciliation unifiée
 * @param {Object} unifiedReconciliationItems - Items de réconciliation unifiée {sku: {ordered, received, damaged}}
 * @param {Object} reconciliationOrder - Commande à réconcilier
 * @param {string} reconciliationNotes - Notes de réconciliation
 * @param {Array} products - Liste des produits
 * @param {Function} getUserSignature - Fonction pour obtenir la signature utilisateur
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} setUnifiedReconciliationModalOpen - Setter pour fermer le modal
 * @param {Function} setUnifiedReconciliationItems - Setter pour réinitialiser les items
 * @param {Function} setReconciliationNotes - Setter pour réinitialiser les notes
 * @param {Function} setReconciliationOrder - Setter pour réinitialiser la commande
 */
export const submitUnifiedReconciliation = async (
  unifiedReconciliationItems,
  reconciliationOrder,
  reconciliationNotes,
  products,
  getUserSignature,
  api,
  loadData,
  setUnifiedReconciliationModalOpen,
  setUnifiedReconciliationItems,
  setReconciliationNotes,
  setReconciliationOrder
) => {
  try {
    // Calculer les écarts et préparer les données
    const hasQuantityDiscrepancy = Object.entries(unifiedReconciliationItems).some(
      ([sku, data]) => data.ordered !== data.received
    );
    const hasDamage = Object.entries(unifiedReconciliationItems).some(
      ([sku, data]) => data.damaged > 0
    );
    
    // Mettre à jour les items avec les quantités reçues, endommagées et validées
    const updatedItems = reconciliationOrder.items.map(item => {
      const data = unifiedReconciliationItems[item.sku];
      const receivedQty = parseInt(data.received, 10) || 0;
      const damagedQty = parseInt(data.damaged, 10) || 0;
      const validatedQty = receivedQty - damagedQty;
      const totalReceived = receivedQty + damagedQty;
      const discrepancyQty = item.quantity - totalReceived;
      
      return {
        sku: item.sku,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        receivedQuantity: receivedQty,
        damagedQuantity: damagedQty,
        discrepancyQuantity: discrepancyQty,
        validatedQuantity: validatedQty,
        quantityDiscrepancy: discrepancyQty
      };
    });

    // Calculer les quantités manquantes et endommagées par SKU
    const missingQuantitiesBySku = {};
    const damagedQuantitiesBySku = {};
    
    updatedItems.forEach(item => {
      const missing = item.quantity - (item.receivedQuantity + item.damagedQuantity);
      if (missing > 0) {
        missingQuantitiesBySku[item.sku] = missing;
      }
      if (item.damagedQuantity > 0) {
        damagedQuantitiesBySku[item.sku] = item.damagedQuantity;
      }
    });

    console.log('=== DEBUG RÉCONCILIATION UNIFIÉE ===');
    console.log('Items mis à jour:', updatedItems);
    console.log('Quantités manquantes par SKU:', missingQuantitiesBySku);
    console.log('Quantités endommagées par SKU:', damagedQuantitiesBySku);
    
    // Générer les emails de réclamation si nécessaire
    if (hasQuantityDiscrepancy || hasDamage) {
      let claimEmail = `Objet: Réclamation - Commande ${reconciliationOrder.id}\n\nBonjour,\n\nNous avons reçu la commande ${reconciliationOrder.id} mais constatons les problèmes suivants :\n\n`;
      
      if (hasQuantityDiscrepancy) {
        const discrepancyList = Object.entries(unifiedReconciliationItems)
          .filter(([sku, data]) => data.ordered !== data.received)
          .map(([sku, data]) => {
            const product = products.find(p => p.sku === sku);
            return `- ${product?.name || sku} (SKU: ${sku})\n  📦 Commandé: ${data.ordered} | Reçu: ${data.received} | Écart: ${data.received - data.ordered}`;
          })
          .join('\n\n');
        
        claimEmail += `**ÉCARTS DE QUANTITÉ:**\n\n${discrepancyList}\n\n`;
      }
      
      if (hasDamage) {
        const damagedList = Object.entries(unifiedReconciliationItems)
          .filter(([sku, data]) => data.damaged > 0)
          .map(([sku, data]) => {
            const product = products.find(p => p.sku === sku);
            return `- ${product?.name || sku} (SKU: ${sku})\n  ⚠️ Endommagé: ${data.damaged} / ${data.received} reçus`;
          })
          .join('\n\n');
        
        claimEmail += `**MARCHANDISES ENDOMMAGÉES:**\n\n${damagedList}\n\n`;
      }
      
      if (reconciliationNotes) {
        claimEmail += `**Notes supplémentaires:**\n${reconciliationNotes}\n\n`;
      }
      
      claimEmail += `Merci de procéder aux actions correctives nécessaires.\n\nCordialement,\n${getUserSignature()}`;
      
      console.log('EMAIL DE RÉCLAMATION GÉNÉRÉ:', claimEmail);
      toast.success('Email de réclamation généré !', {
        description: 'Le contenu a été préparé',
        duration: 4000
      });
    }
    
    // Mettre à jour le statut de la commande
    await api.updateOrderStatus(reconciliationOrder.id, {
      status: 'reconciliation',
      receivedAt: new Date().toISOString().split('T')[0],
      hasDiscrepancy: hasQuantityDiscrepancy,
      hasDamage: hasDamage,
      items: updatedItems,
      missingQuantitiesBySku: missingQuantitiesBySku,
      damagedQuantitiesBySku: damagedQuantitiesBySku
    });
    
    // Mettre à jour le stock avec les quantités validées (reçues - endommagées)
    const stockUpdates = Object.entries(unifiedReconciliationItems).map(([sku, data]) => {
      const validatedQty = parseInt(data.received, 10) - parseInt(data.damaged, 10);
      console.log(`Stock update pour ${sku}: +${validatedQty} unités (reçu: ${data.received}, endommagé: ${data.damaged})`);
      return {
        sku,
        quantityToAdd: validatedQty
      };
    });
    
    console.log('Stock updates:', stockUpdates);
    await api.updateStock(stockUpdates);
    
    await loadData();
    setUnifiedReconciliationModalOpen(false);
    setUnifiedReconciliationItems({});
    setReconciliationNotes('');
    setReconciliationOrder(null);
    
    toast.success('Réconciliation enregistrée avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error);
    toast.error('Erreur lors de la soumission de la réconciliation');
  }
};

/**
 * PHASE 13 : Handler pour soumettre un rapport de dommages
 * @param {Object} damageItems - Items endommagés {sku: {total, damaged}}
 * @param {Object} reconciliationOrder - Commande à réconcilier
 * @param {string} damageNotes - Notes sur les dommages
 * @param {Array} products - Liste des produits
 * @param {Function} getUserSignature - Fonction pour obtenir la signature utilisateur
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} setDamageModalOpen - Setter pour fermer le modal
 * @param {Function} setDamageItems - Setter pour réinitialiser les items
 * @param {Function} setDamageNotes - Setter pour réinitialiser les notes
 * @param {Function} setReconciliationOrder - Setter pour réinitialiser la commande
 */
export const submitDamageReport = async (
  damageItems,
  reconciliationOrder,
  damageNotes,
  products,
  getUserSignature,
  api,
  loadData,
  setDamageModalOpen,
  setDamageItems,
  setDamageNotes,
  setReconciliationOrder
) => {
  try {
    const damagedList = Object.entries(damageItems)
      .filter(([sku, data]) => data.damaged > 0)
      .map(([sku, data]) => {
        const product = products.find(p => p.sku === sku);
        return `- ${product?.name || sku} (SKU: ${sku})\n  Quantité endommagée: ${data.damaged} / ${data.total}`;
      })
      .join('\n\n');
    
    const damageEmail = `Objet: Réclamation - Marchandises endommagées - Commande ${reconciliationOrder.id}\n\nBonjour,\n\nNous avons reçu la commande ${reconciliationOrder.id} mais certains produits sont arrivés endommagés :\n\n${damagedList}\n\nNotes: ${damageNotes || 'Aucune note supplémentaire'}\n\nMerci de procéder au remplacement de ces articles.\n\nCordialement,\n${getUserSignature()}`;
    
    console.log('EMAIL RÉCLAMATION DOMMAGES:', damageEmail);
    toast.success('Email de réclamation pour dommages généré !', {
      description: 'Le contenu a été préparé',
      duration: 4000
    });
    
    // CORRECTION 1: Mettre à jour le stock avec uniquement les produits non endommagés (conversion en nombre)
    const stockUpdates = Object.entries(damageItems).map(([sku, data]) => {
      const quantityGood = parseInt(data.total, 10) - parseInt(data.damaged, 10);
      console.log(`Stock update pour ${sku}: +${quantityGood} unités (total: ${data.total}, endommagé: ${data.damaged})`);
      return {
        sku,
        quantityToAdd: quantityGood
      };
    });
    
    await api.updateStock(stockUpdates);
    await api.updateOrderStatus(reconciliationOrder.id, {
      status: 'reconciliation',
      receivedAt: new Date().toISOString().split('T')[0],
      hasDiscrepancy: true,
      damageReport: true
    });
    
    await loadData();
    setDamageModalOpen(false);
    setDamageItems({});
    setDamageNotes('');
    setReconciliationOrder(null);
  } catch (error) {
    console.error('❌ Erreur:', error);
    toast.error('Erreur lors de la soumission');
  }
};

/**
 * PHASE 14 : Handler pour ouvrir le modal de réconciliation
 * @param {Object} order - Commande à réconcilier
 * @param {Function} setReconciliationOrder - Setter pour définir la commande
 * @param {Object} inlineModals - Objet contenant les modals inline
 * @param {Function} setDiscrepancyTypes - Setter pour définir les types de problèmes
 * @param {Function} setReconciliationModalOpen - Setter pour ouvrir le modal
 */
export const openReconciliationModal = (
  order,
  setReconciliationOrder,
  inlineModals,
  setDiscrepancyTypes,
  setReconciliationModalOpen
) => {
  setReconciliationOrder(order);
  
  // Initialiser les quantités reçues avec les quantités commandées par défaut
  const initialItems = {};
  const initialTypes = {};
  const initialDamaged = {};
  
  order.items.forEach(item => {
    initialItems[item.sku] = {
      received: item.receivedQuantity !== undefined ? item.receivedQuantity : item.quantity,
      notes: item.discrepancyNotes || ''
    };
    initialTypes[item.sku] = item.discrepancyType || 'none';
    initialDamaged[item.sku] = item.damagedQuantity || 0; // Quantités endommagées
  });
  
  inlineModals.reconciliationModal.setDiscrepancyItems(initialItems);
  setDiscrepancyTypes(initialTypes);
  inlineModals.reconciliationModal.setDamagedQuantities(initialDamaged);
  setReconciliationModalOpen(true);
};

/**
 * PHASE 14 : Handler pour mettre à jour un item de réconciliation
 * @param {string} sku - SKU du produit
 * @param {string} field - Champ à mettre à jour ('received', 'notes', etc.)
 * @param {*} value - Nouvelle valeur
 * @param {number} orderedQuantity - Quantité commandée (non utilisée mais conservée pour compatibilité)
 * @param {Object} inlineModals - Objet contenant les modals inline
 */
export const updateDiscrepancyItem = (sku, field, value, orderedQuantity, inlineModals) => {
  inlineModals.reconciliationModal.setDiscrepancyItems(prev => ({
    ...prev,
    [sku]: {
      ...prev[sku],
      [field]: value
    }
  }));
};

/**
 * PHASE 14 : Handler pour confirmer la réconciliation (avec ou sans écarts)
 * @param {boolean} hasDiscrepancy - Indique s'il y a des écarts
 * @param {Object} reconciliationOrder - Commande à réconcilier
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} setReconciliationModalOpen - Setter pour fermer le modal
 * @param {Function} setReconciliationOrder - Setter pour réinitialiser la commande
 */
export const confirmReconciliation = async (
  hasDiscrepancy,
  reconciliationOrder,
  api,
  loadData,
  setReconciliationModalOpen,
  setReconciliationOrder
) => {
  try {
    if (hasDiscrepancy) {
      // Le modal de réconciliation est géré par ReconciliationModalInline
      // Pas besoin d'ouvrir un modal unifié séparé
      setReconciliationModalOpen(false);
    } else {
      // CORRECTION 1: Réception conforme - mise à jour automatique du stock
      console.log('=== DEBUG CORRECTION 1 - Réception conforme ===');
      
      // Convertir les quantités en nombres pour éviter #NUM!
      const stockUpdates = reconciliationOrder.items.map(item => {
        const quantity = parseInt(item.quantity, 10) || 0;
        console.log(`Stock ${item.sku}: +${quantity} unités (type: ${typeof quantity})`);
        return {
          sku: item.sku,
          quantityToAdd: quantity
        };
      });
      
      console.log('Stock updates:', stockUpdates);
      
      // Mettre à jour le stock AVANT de marquer comme completed
      await api.updateStock(stockUpdates);
      
      // Puis marquer la commande comme complétée
      await api.updateOrderStatus(reconciliationOrder.id, {
        status: 'completed',
        receivedAt: new Date().toISOString().split('T')[0],
        completedAt: new Date().toISOString().split('T')[0]
      });
      
      await loadData();
      setReconciliationModalOpen(false);
      setReconciliationOrder(null);
      
      toast.success('Réception validée ! Stock mis à jour automatiquement.');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    toast.error('Erreur lors de la validation');
  }
};

/**
 * PHASE 14 : Handler pour soumettre les écarts de réconciliation
 * @param {Object} reconciliationOrder - Commande à réconcilier
 * @param {Object} inlineModals - Objet contenant les modals inline
 * @param {Array} products - Liste des produits
 * @param {Function} getUserSignature - Fonction pour obtenir la signature utilisateur
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} setDiscrepancyModalOpen - Setter pour fermer le modal
 * @param {Function} setReconciliationOrder - Setter pour réinitialiser la commande
 */
export const submitDiscrepancy = async (
  reconciliationOrder,
  inlineModals,
  products,
  getUserSignature,
  api,
  loadData,
  setDiscrepancyModalOpen,
  setReconciliationOrder
) => {
  try {
    // Créer l'email de réclamation
    const discrepancyList = Object.entries(inlineModals.reconciliationModal.discrepancyItems)
      .filter(([sku, data]) => data.ordered !== data.received)
      .map(([sku, data]) => {
        const product = products.find(p => p.sku === sku);
        return `- ${product?.name || sku} (SKU: ${sku})\n  Commandé: ${data.ordered} | Reçu: ${data.received} | Écart: ${data.received - data.ordered}`;
      })
      .join('\n\n');
    
    const claimEmail = `Objet: Réclamation - Commande ${reconciliationOrder.id}\n\nBonjour,\n\nNous avons constaté des écarts entre les quantités commandées et reçues :\n\n${discrepancyList}\n\nMerci de nous confirmer ces écarts et de procéder à l'envoi des quantités manquantes.\n\nCordialement,\n${getUserSignature()}`;
    
    console.log('EMAIL DE RÉCLAMATION GÉNÉRÉ:', claimEmail);
    toast.success('Email de réclamation généré !', {
      description: 'Le contenu a été préparé',
      duration: 4000
    });
    
    // CORRECTION 4A: Mettre à jour la commande avec les quantités reçues
    const updatedItems = reconciliationOrder.items.map(item => {
      const receivedQty = inlineModals.reconciliationModal.discrepancyItems[item.sku]?.received;
      return {
        sku: item.sku,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        receivedQuantity: receivedQty !== undefined ? parseInt(receivedQty, 10) : parseInt(item.quantity, 10)
      };
    });
    
    console.log('=== DEBUG CORRECTION 4A ===');
    console.log('Items mis à jour avec receivedQuantity:', updatedItems);
    
    await api.updateOrderStatus(reconciliationOrder.id, {
      status: 'reconciliation',
      receivedAt: new Date().toISOString().split('T')[0],
      hasDiscrepancy: true,
      items: updatedItems
    });
    
    // CORRECTION 1: Mettre à jour le stock avec les quantités réellement reçues (conversion en nombre)
    const stockUpdates = Object.entries(inlineModals.reconciliationModal.discrepancyItems).map(([sku, data]) => {
      const quantityReceived = parseInt(data.received, 10) || 0;
      console.log(`Stock update pour ${sku}: +${quantityReceived} unités`);
      return {
        sku,
        quantityToAdd: quantityReceived
      };
    });
    
    console.log('=== DEBUG CORRECTION 1 ===');
    console.log('Stock updates:', stockUpdates);
    
    await api.updateStock(stockUpdates);
    
    await loadData();
    setDiscrepancyModalOpen(false);
    inlineModals.reconciliationModal.setDiscrepancyItems({});
    setReconciliationOrder(null);
  } catch (error) {
    console.error('❌ Erreur:', error);
    toast.error('Erreur lors de la soumission');
  }
};

/**
 * PHASE 14 : Handler pour ouvrir le modal de dommages
 * @param {Function} confirmReconciliation - Fonction pour confirmer la réconciliation
 */
export const openDamageModal = (confirmReconciliation) => {
  // Le modal de réconciliation est géré par ReconciliationModalInline
  confirmReconciliation(true);
};

