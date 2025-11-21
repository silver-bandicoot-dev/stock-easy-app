// ============================================
// HANDLERS MAPPING - Extraites de StockEasy.jsx
// PHASE 5 : Handlers Mapping
// ============================================

import { toast } from 'sonner';

console.log('📁 Loading mappingHandlers.js - Phase 5');

/**
 * Assigne un fournisseur à un produit
 * @param {Object} productToMap - Le produit auquel assigner le fournisseur
 * @param {string} selectedSupplier - Le nom du fournisseur sélectionné
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} handleCloseAssignSupplierModal - Fonction pour fermer le modal
 * @returns {Promise<void>}
 */
export const handleAssignSupplier = async (
  productToMap,
  selectedSupplier,
  api,
  loadData,
  handleCloseAssignSupplierModal
) => {
  try {
    if (!selectedSupplier) {
      toast.warning('Veuillez sélectionner un fournisseur');
      return;
    }

    await api.assignSupplierToProduct(productToMap.sku, selectedSupplier);
    console.log(`✅ Fournisseur assigné à ${productToMap.sku}`);
    await loadData();
    
    if (handleCloseAssignSupplierModal) {
      handleCloseAssignSupplierModal();
    }
    
    toast.success('Fournisseur assigné avec succès');
  } catch (error) {
    console.error('❌ Erreur assignation fournisseur:', error);
    const errorMessage = error?.message || 'Erreur lors de l\'assignation du fournisseur';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Retire un fournisseur d'un produit
 * @param {string} sku - Le SKU du produit
 * @param {Array} products - Liste des produits pour trouver le fournisseur actuel
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @returns {Promise<void>}
 */
export const handleRemoveSupplierFromProduct = async (
  sku,
  products,
  api,
  loadData
) => {
  try {
    const confirm = window.confirm(
      `⚠️ Retirer le fournisseur de ce produit ?\n\n` +
      `Le produit n'aura plus de fournisseur assigné.`
    );

    if (!confirm) return;

    const product = products.find((item) => item.sku === sku);
    const supplierName = product?.supplier || null;
    await api.removeSupplierFromProduct(sku, supplierName);
    console.log(`✅ Fournisseur retiré de ${sku}`);
    await loadData();
    toast.success('Fournisseur retiré avec succès');
  } catch (error) {
    console.error('❌ Erreur suppression assignation:', error);
    toast.error('Erreur lors de la suppression');
    throw error;
  }
};

/**
 * Sauvegarde le mapping fournisseur-produit
 * @param {string} supplierName - Le nom du fournisseur
 * @param {Array} assignedSkus - Liste des SKUs à assigner au fournisseur
 * @param {Array} products - Liste des produits
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} setIsSavingSupplierMapping - Setter pour l'état de sauvegarde
 * @returns {Promise<void>}
 */
export const handleSaveSupplierMapping = async (
  supplierName,
  assignedSkus = [],
  products,
  api,
  loadData,
  setIsSavingSupplierMapping
) => {
  try {
    if (!supplierName) {
      return;
    }

    const desiredSkus = Array.from(new Set(assignedSkus.filter(Boolean)));
    const currentSkus = products
      .filter((product) => product.supplier === supplierName)
      .map((product) => product.sku);

    const desiredSet = new Set(desiredSkus);
    const currentSet = new Set(currentSkus);

    const skusToAssign = desiredSkus.filter((sku) => !currentSet.has(sku));
    const skusToRemove = currentSkus.filter((sku) => !desiredSet.has(sku));

    const hasDifferences =
      skusToAssign.length > 0 ||
      skusToRemove.length > 0 ||
      desiredSkus.length !== currentSkus.length;

    if (!hasDifferences) {
      toast.info('Aucune modification à sauvegarder pour ce fournisseur.');
      return;
    }

    if (setIsSavingSupplierMapping) {
      setIsSavingSupplierMapping(true);
    }

    await Promise.all([
      ...desiredSkus.map((sku) => api.assignSupplierToProduct(sku, supplierName)),
      ...skusToRemove.map((sku) => api.removeSupplierFromProduct(sku, supplierName))
    ]);

    toast.success(`Mapping fournisseur mis à jour pour ${supplierName}`);
    await loadData();
  } catch (error) {
    console.error('❌ Erreur sauvegarde mapping fournisseur:', error);
    const errorMessage = error?.message || 'Erreur lors de la sauvegarde du mapping fournisseur';
    toast.error(errorMessage);
    throw error;
  } finally {
    if (setIsSavingSupplierMapping) {
      setIsSavingSupplierMapping(false);
    }
  }
};

/**
 * PRIORITÉ 3 : Handler pour ouvrir le modal d'assignation de fournisseur
 * @param {Object} product - Le produit auquel assigner un fournisseur
 * @param {Function} setProductToMap - Setter pour le produit en cours de mapping
 * @param {Function} setSelectedSupplierForMapping - Setter pour le fournisseur sélectionné
 * @param {Function} setAssignSupplierModalOpen - Setter pour l'état d'ouverture du modal
 */
export const handleOpenAssignSupplierModal = (
  product,
  setProductToMap,
  setSelectedSupplierForMapping,
  setAssignSupplierModalOpen
) => {
  setProductToMap(product);
  setSelectedSupplierForMapping(product.supplier || '');
  setAssignSupplierModalOpen(true);
};

/**
 * PRIORITÉ 3 : Handler pour fermer le modal d'assignation de fournisseur
 * @param {Function} setAssignSupplierModalOpen - Setter pour l'état d'ouverture du modal
 * @param {Function} setProductToMap - Setter pour le produit en cours de mapping
 * @param {Function} setSelectedSupplierForMapping - Setter pour le fournisseur sélectionné
 */
export const handleCloseAssignSupplierModal = (
  setAssignSupplierModalOpen,
  setProductToMap,
  setSelectedSupplierForMapping
) => {
  setAssignSupplierModalOpen(false);
  setProductToMap(null);
  setSelectedSupplierForMapping('');
};

