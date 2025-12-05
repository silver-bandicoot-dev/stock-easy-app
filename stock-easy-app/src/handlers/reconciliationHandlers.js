// ============================================
// HANDLERS RÉCONCILIATION - Extraites de Stockeasy.jsx
// PHASE 9 : Handlers Réconciliation
// PHASE 13 : Handlers Réconciliation Unifiée
// ============================================

import { toast } from 'sonner';
import { updateShopifyInventory, prepareStockUpdatesFromReconciliation } from '../services/gadgetService';
import { supabase } from '../lib/supabaseClient';

console.log('📁 Loading reconciliationHandlers.js - Phase 9 & 13');

/**
 * Récupère le stock actuel FRAIS depuis Supabase pour une liste de SKUs
 * Nécessaire car la variable `products` peut être périmée/en cache
 * @param {Array<string>} skus - Liste des SKUs à récupérer
 * @returns {Promise<Object>} Map SKU -> stock_actuel
 */
async function getFreshStockFromSupabase(skus) {
  try {
    console.log('🔍 Récupération stock frais pour SKUs:', skus);
    
    // Convertir tous les SKUs en minuscules pour la recherche
    const skusLower = skus.map(s => s?.toLowerCase()).filter(Boolean);
    
    // Requête avec ILIKE pour gérer la casse (ou filtrage côté client)
    const { data, error } = await supabase
      .from('produits')
      .select('sku, stock_actuel');
    
    if (error) {
      console.error('❌ Erreur Supabase:', error);
      throw error;
    }
    
    console.log('📦 Données brutes Supabase:', data?.length, 'produits');
    
    // Créer une map SKU -> stock (insensible à la casse)
    // Filtrer pour ne garder que les SKUs demandés
    const stockMap = {};
    (data || []).forEach(p => {
      const skuLower = p.sku?.toLowerCase();
      if (skusLower.includes(skuLower)) {
        stockMap[skuLower] = p.stock_actuel ?? 0;
        console.log(`  → ${p.sku}: ${p.stock_actuel}`);
      }
    });
    
    console.log('📦 Stock frais depuis Supabase:', stockMap);
    return stockMap;
  } catch (e) {
    console.error('❌ Impossible de récupérer le stock frais:', e.message || e);
    return {};
  }
}

/**
 * Récupère le company_id de l'utilisateur actuel
 * @returns {Promise<string|null>} company_id ou null si non trouvé
 */
async function getCurrentUserCompanyId() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();
    
    return profile?.company_id || null;
  } catch (error) {
    console.error('❌ Erreur récupération company_id:', error);
    return null;
  }
}

/**
 * Confirme la réconciliation avec quantités reçues et endommagées
 * @param {Object} inlineModals - Objet contenant les modals inline (reconciliationModal)
 * @param {Object} discrepancyTypes - Types de problèmes par SKU
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} setDiscrepancyTypes - Setter pour définir les types de problèmes
 * @param {Function} setActiveTab - Setter pour changer l'onglet actif
 */
export const confirmReconciliationWithQuantities = async (
  inlineModals,
  discrepancyTypes,
  api,
  loadData,
  setDiscrepancyTypes,
  setActiveTab,
  products = [] // AJOUTÉ: Liste des produits pour calculer le stock total
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
      console.log('✅ Stock local mis à jour avec succès');
      
      // CORRECTION: Synchroniser avec Shopify en envoyant le STOCK TOTAL
      const companyId = await getCurrentUserCompanyId();
      if (companyId && products && products.length > 0) {
        console.log('🔄 Synchronisation Shopify - Réconciliation...');
        
        // Récupérer le stock FRAIS depuis Supabase (products en mémoire peut être périmé)
        const skus = stockUpdates.map(u => u.sku);
        const freshStock = await getFreshStockFromSupabase(skus);
        
        const shopifyUpdates = stockUpdates.map(update => {
          const skuLower = update.sku?.toLowerCase();
          const currentStock = freshStock[skuLower] ?? 0;
          // IMPORTANT: Le stock est DÉJÀ mis à jour dans Supabase, on l'envoie tel quel
          const finalStock = currentStock; // Pas d'addition !
          
          console.log(`📦 ${update.sku}: stock final après MAJ locale = ${finalStock} (envoi à Shopify)`);
          
          return {
            sku: update.sku,
            stock_actuel: finalStock  // Stock déjà mis à jour dans Supabase
          };
        }).filter(u => u.sku);
        
        if (shopifyUpdates.length > 0) {
          try {
            const shopifyResult = await updateShopifyInventory(companyId, shopifyUpdates);
            if (shopifyResult.success) {
              console.log('✅ Shopify synchronisé (réconciliation):', shopifyResult);
            } else {
              console.warn('⚠️ Synchronisation Shopify partielle:', shopifyResult);
            }
          } catch (shopifyError) {
            console.error('❌ Erreur sync Shopify:', shopifyError);
          }
        }
      } else {
        console.warn('⚠️ Synchronisation Shopify ignorée (company_id ou products manquants)');
      }
    }
    
    // Recharger les données
    await loadData({ forceRefresh: true });
    
    // Fermer la modal et nettoyer les états
    inlineModals.reconciliationModal.closeReconciliationModal();
    setDiscrepancyTypes({});
    
    toast.success(
      hasProblems ? 
        'Réception enregistrée avec écarts. Commande déplacée vers "Réconciliation".' : 
        'Réception validée et stock mis à jour avec succès!',
      { duration: 5000 }
    );
    
    // Rediriger vers l'onglet Commandes si des problèmes sont détectés
    if (hasProblems && setActiveTab) {
      setActiveTab('orders');
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
    
    // Récupérer le company_id de l'ordre OU de l'utilisateur actuel
    let companyId = order.company_id;
    if (!companyId) {
      console.log('⚠️ company_id manquant dans la commande, récupération depuis le profil utilisateur...');
      companyId = await getCurrentUserCompanyId();
      console.log('📋 company_id récupéré:', companyId);
    }
    
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
      
      // Mettre à jour le stock local avec les quantités reçues
      const stockUpdates = Object.entries(reconciliationData.receivedItems || {}).map(([sku, data]) => {
        const quantityReceived = parseInt(data.received || data, 10) || 0;
        return {
          sku,
          quantityToAdd: quantityReceived
        };
      });
      
      await api.updateStock(stockUpdates);
      
      // Synchroniser avec Shopify si company_id est disponible
      if (companyId && stockUpdates.length > 0) {
        console.log('🔄 Synchronisation Shopify (avec écarts) - Préparation des mises à jour...');
        console.log('📦 stockUpdates:', JSON.stringify(stockUpdates));
        
        // Récupérer le stock FRAIS depuis Supabase (APRÈS la mise à jour locale)
        // Le stock a DÉJÀ été incrémenté par api.updateStock(), donc on l'envoie tel quel à Shopify
        const skus = stockUpdates.map(u => u.sku);
        const freshStock = await getFreshStockFromSupabase(skus);
        
        const shopifyUpdates = stockUpdates.map(update => {
          const skuLower = update.sku?.toLowerCase();
          // IMPORTANT: Le stock est DÉJÀ mis à jour dans Supabase, on l'envoie tel quel
          const finalStock = freshStock[skuLower] ?? 0;
          
          console.log(`📦 ${update.sku}: stock final après MAJ locale = ${finalStock} (envoi à Shopify)`);
          
          return {
            sku: update.sku,
            stock_actuel: finalStock  // PAS d'addition, le stock est déjà correct
          };
        }).filter(u => u.sku && u.stock_actuel > 0);
        
        if (shopifyUpdates.length > 0) {
          try {
            const shopifyResult = await updateShopifyInventory(companyId, shopifyUpdates);
            if (shopifyResult.success) {
              console.log('✅ Shopify synchronisé (avec écarts):', shopifyResult);
            } else {
              console.warn('⚠️ Synchronisation Shopify partielle (avec écarts):', shopifyResult);
            }
          } catch (shopifyError) {
            console.error('❌ Erreur sync Shopify (avec écarts):', shopifyError);
          }
        }
      }
      
      reconciliationModalHandlers.close();
      
      // Générer l'email de réclamation si nécessaire
      const emailContent = emailGeneration.generateReclamationEmail(
        order,
        reconciliationData.receivedItems,
        reconciliationData.damages,
        reconciliationData.notes || '', // Notes additionnelles - seulement si l'utilisateur a écrit quelque chose
        products,
        null, // supplier
        getUserSignature() // Signature - sera ajoutée à la fin, pas dans les notes
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
      
      // Mettre à jour le stock local
      const stockUpdates = Object.entries(reconciliationData.receivedItems || {}).map(([sku, data]) => {
        const quantityReceived = parseInt(data.received || data, 10) || 0;
        return {
          sku,
          quantityToAdd: quantityReceived
        };
      });
      
      await api.updateStock(stockUpdates);
      
      // Synchroniser avec Shopify si company_id est disponible
      if (companyId && stockUpdates.length > 0) {
        console.log('🔄 Synchronisation Shopify - Préparation des mises à jour...');
        console.log('📦 stockUpdates:', JSON.stringify(stockUpdates));
        
        // Récupérer le stock ACTUEL depuis Supabase (car products peut être périmé)
        // Récupérer le stock FRAIS depuis Supabase
        const skus = stockUpdates.map(u => u.sku);
        const freshStock = await getFreshStockFromSupabase(skus);
        
        const shopifyUpdates = stockUpdates.map(update => {
          const skuLower = update.sku?.toLowerCase();
          const currentStock = freshStock[skuLower] ?? 0;
          // IMPORTANT: Le stock est DÉJÀ mis à jour dans Supabase, on l'envoie tel quel
          const finalStock = currentStock; // Pas d'addition !
          
          console.log(`📦 ${update.sku}: stock final après MAJ locale = ${finalStock} (envoi à Shopify)`);
          
          return {
            sku: update.sku,
            stock_actuel: finalStock
          };
        }).filter(u => u.sku);
        
        if (shopifyUpdates.length > 0) {
          try {
            const shopifyResult = await updateShopifyInventory(companyId, shopifyUpdates);
            
            if (shopifyResult.success) {
              console.log('✅ Shopify synchronisé:', shopifyResult);
              toast.success(`Réconciliation validée - ${shopifyResult.processed || shopifyUpdates.length} produit(s) synchronisé(s) avec Shopify`);
            } else {
              console.warn('⚠️ Synchronisation Shopify partielle:', shopifyResult);
              toast.success('Réconciliation validée - Commande complétée');
              if (shopifyResult.error) {
                toast.warning('Synchronisation Shopify en attente - vérifiez la configuration');
              }
            }
          } catch (shopifyError) {
            console.error('❌ Erreur sync Shopify:', shopifyError);
            toast.success('Réconciliation validée - Commande complétée');
            toast.warning('Synchronisation Shopify échouée - mise à jour manuelle requise');
          }
        } else {
          toast.success('Réconciliation validée - Commande complétée');
        }
      } else {
        toast.success('Réconciliation validée - Commande complétée');
      }
      
      reconciliationModalHandlers.close();
    }
    
    // Recharger les données avec forceRefresh pour ignorer le cache
    await loadData({ forceRefresh: true });
    
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
    
    // CORRECTION: Synchroniser avec Shopify en envoyant le STOCK TOTAL
    const companyId = await getCurrentUserCompanyId();
    if (companyId && stockUpdates.length > 0 && products && products.length > 0) {
      console.log('🔄 Synchronisation Shopify - Réconciliation unifiée...');
      
      // Récupérer le stock FRAIS depuis Supabase
      const skus = stockUpdates.map(u => u.sku);
      const freshStock = await getFreshStockFromSupabase(skus);
      
      const shopifyUpdates = stockUpdates.map(update => {
        const skuLower = update.sku?.toLowerCase();
        // IMPORTANT: Le stock est DÉJÀ mis à jour dans Supabase, on l'envoie tel quel
        const finalStock = freshStock[skuLower] ?? 0;
        
        console.log(`📦 ${update.sku}: stock final après MAJ locale = ${finalStock} (envoi à Shopify)`);
        
        return {
          sku: update.sku,
          stock_actuel: finalStock
        };
      }).filter(u => u.sku && u.stock_actuel > 0);
      
      if (shopifyUpdates.length > 0) {
        try {
          const shopifyResult = await updateShopifyInventory(companyId, shopifyUpdates);
          if (shopifyResult.success) {
            console.log('✅ Shopify synchronisé (réconciliation unifiée):', shopifyResult);
          } else {
            console.warn('⚠️ Synchronisation Shopify partielle:', shopifyResult);
          }
        } catch (shopifyError) {
          console.error('❌ Erreur sync Shopify:', shopifyError);
        }
      }
    }
    
    await loadData({ forceRefresh: true });
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
    
    // CORRECTION: Synchroniser avec Shopify en envoyant le STOCK TOTAL
    const companyId = await getCurrentUserCompanyId();
    if (companyId && stockUpdates.length > 0 && products && products.length > 0) {
      console.log('🔄 Synchronisation Shopify - Rapport de dommages...');
      
      // Récupérer le stock FRAIS depuis Supabase
      const skus = stockUpdates.map(u => u.sku);
      const freshStock = await getFreshStockFromSupabase(skus);
      
      const shopifyUpdates = stockUpdates.map(update => {
        const skuLower = update.sku?.toLowerCase();
        // IMPORTANT: Le stock est DÉJÀ mis à jour dans Supabase, on l'envoie tel quel
        const finalStock = freshStock[skuLower] ?? 0;
        
        console.log(`📦 ${update.sku}: stock final après MAJ locale = ${finalStock} (envoi à Shopify)`);
        
        return {
          sku: update.sku,
          stock_actuel: finalStock
        };
      }).filter(u => u.sku && u.stock_actuel > 0);
      
      if (shopifyUpdates.length > 0) {
        try {
          const shopifyResult = await updateShopifyInventory(companyId, shopifyUpdates);
          if (shopifyResult.success) {
            console.log('✅ Shopify synchronisé (rapport dommages):', shopifyResult);
          } else {
            console.warn('⚠️ Synchronisation Shopify partielle:', shopifyResult);
          }
        } catch (shopifyError) {
          console.error('❌ Erreur sync Shopify:', shopifyError);
        }
      }
    }
    
    await api.updateOrderStatus(reconciliationOrder.id, {
      status: 'reconciliation',
      receivedAt: new Date().toISOString().split('T')[0],
      hasDiscrepancy: true,
      damageReport: true
    });
    
    await loadData({ forceRefresh: true });
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
  setReconciliationOrder,
  products // AJOUTÉ: Liste des produits pour calculer le stock total
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
      
      // Mettre à jour le stock local AVANT de marquer comme completed
      await api.updateStock(stockUpdates);
      
      // CORRECTION: Synchroniser avec Shopify en envoyant le STOCK TOTAL (pas juste la quantité ajoutée)
      const companyId = await getCurrentUserCompanyId();
      if (companyId && stockUpdates.length > 0 && products) {
        console.log('🔄 Synchronisation Shopify - Réception conforme...');
        
        // Récupérer le stock FRAIS depuis Supabase
        const skus = stockUpdates.map(u => u.sku);
        const freshStock = await getFreshStockFromSupabase(skus);
        
        const shopifyUpdates = stockUpdates.map(update => {
          const skuLower = update.sku?.toLowerCase();
          const currentStock = freshStock[skuLower] ?? 0;
          // IMPORTANT: Le stock est DÉJÀ mis à jour dans Supabase, on l'envoie tel quel
          const finalStock = currentStock; // Pas d'addition !
          
          console.log(`📦 ${update.sku}: stock final après MAJ locale = ${finalStock} (envoi à Shopify)`);
          
          return {
            sku: update.sku,
            stock_actuel: finalStock  // Stock déjà mis à jour dans Supabase
          };
        }).filter(u => u.sku);
        
        if (shopifyUpdates.length > 0) {
          try {
            const shopifyResult = await updateShopifyInventory(companyId, shopifyUpdates);
            if (shopifyResult.success) {
              console.log('✅ Shopify synchronisé (réception conforme):', shopifyResult);
            } else {
              console.warn('⚠️ Synchronisation Shopify partielle:', shopifyResult);
            }
          } catch (shopifyError) {
            console.error('❌ Erreur sync Shopify:', shopifyError);
          }
        }
      }
      
      // Puis marquer la commande comme complétée
      await api.updateOrderStatus(reconciliationOrder.id, {
        status: 'completed',
        receivedAt: new Date().toISOString().split('T')[0],
        completedAt: new Date().toISOString().split('T')[0]
      });
      
      await loadData({ forceRefresh: true });
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

