// ============================================
// HANDLERS WAREHOUSES - Extraites de Stockeasy.jsx
// PHASE 4 : Handlers Warehouses
// ============================================

import { toast } from 'sonner';

console.log('📁 Loading warehouseHandlers.js - Phase 4');

/**
 * Crée un nouvel entrepôt
 * @param {Object} warehouseData - Données de l'entrepôt à créer
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @returns {Promise<void>}
 */
export const handleCreateWarehouse = async (warehouseData, api, loadData) => {
  try {
    console.log('📦 Création warehouse:', warehouseData);
    await api.createWarehouse(warehouseData);
    await loadData();
    toast.success('Entrepôt créé avec succès !');
  } catch (error) {
    console.error('❌ Erreur création warehouse:', error);
    toast.error('Erreur lors de la création: ' + error.message);
    throw error;
  }
};

/**
 * Met à jour un entrepôt existant
 * @param {string} warehouseId - ID (UUID) ou nom de l'entrepôt à modifier
 * @param {Object} warehouseData - Nouvelles données de l'entrepôt
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @returns {Promise<void>}
 */
export const handleUpdateWarehouse = async (warehouseId, warehouseData, api, loadData) => {
  try {
    console.log('📦 Modification warehouse:', warehouseId, warehouseData);
    const result = await api.updateWarehouse(warehouseId, warehouseData);
    
    // Vérifier si l'API a retourné une erreur
    if (result && result.success === false) {
      throw new Error(result.error || 'Échec de la mise à jour de l\'entrepôt');
    }
    
    await loadData();
    toast.success('Entrepôt modifié avec succès !');
  } catch (error) {
    console.error('❌ Erreur modification warehouse:', error);
    const errorMessage = error?.message || 'Erreur lors de la modification';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Supprime un entrepôt
 * @param {Object} warehouse - L'entrepôt à supprimer (doit avoir un id ou name)
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @returns {Promise<void>}
 */
export const handleDeleteWarehouse = async (warehouse, api, loadData) => {
  try {
    console.log('🗑️ Suppression warehouse:', warehouse.name);
    // Utiliser l'ID si disponible, sinon utiliser le nom comme identifiant
    const warehouseId = warehouse.id || warehouse.name;
    await api.deleteWarehouse(warehouseId);
    await loadData();
    toast.success('Entrepôt supprimé avec succès !');
  } catch (error) {
    console.error('❌ Erreur suppression warehouse:', error);
    toast.error('Erreur lors de la suppression: ' + error.message);
    throw error;
  }
};

// ============================================
// PHASE 16 : Handlers UI pour le modal d'entrepôt
// ============================================

console.log('📁 Loading warehouseHandlers.js - Phase 16');

/**
 * PHASE 16 : Handler pour ouvrir le modal d'entrepôt
 * @param {Object|null} warehouse - L'entrepôt à éditer (null pour création)
 * @param {Function} setEditingWarehouse - Setter pour l'entrepôt en édition
 * @param {Function} setWarehouseFormData - Setter pour les données du formulaire
 * @param {Function} setWarehouseModalOpen - Setter pour ouvrir/fermer le modal
 */
export const handleOpenWarehouseModal = (
  warehouse,
  setEditingWarehouse,
  setWarehouseFormData,
  setWarehouseModalOpen
) => {
  if (warehouse) {
    setEditingWarehouse(warehouse);
    setWarehouseFormData({
      name: warehouse.name || '',
      address: warehouse.address || '',
      city: warehouse.city || '',
      postalCode: warehouse.postalCode || '',
      country: warehouse.country || '',
      contactPerson: warehouse.contactPerson || '',
      phone: warehouse.phone || '',
      email: warehouse.email || ''
    });
  } else {
    setEditingWarehouse(null);
    setWarehouseFormData({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      contactPerson: '',
      phone: '',
      email: ''
    });
  }
  setWarehouseModalOpen(true);
};

/**
 * PHASE 16 : Handler pour fermer le modal d'entrepôt
 * @param {Function} setWarehouseModalOpen - Setter pour fermer le modal
 * @param {Function} setEditingWarehouse - Setter pour réinitialiser l'entrepôt en édition
 * @param {Function} setWarehouseFormData - Setter pour réinitialiser les données du formulaire
 */
export const handleCloseWarehouseModal = (
  setWarehouseModalOpen,
  setEditingWarehouse,
  setWarehouseFormData
) => {
  setWarehouseModalOpen(false);
  setEditingWarehouse(null);
  setWarehouseFormData({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    contactPerson: '',
    phone: '',
    email: ''
  });
};

/**
 * PHASE 16 : Handler pour mettre à jour un champ du formulaire d'entrepôt
 * @param {string} field - Nom du champ à mettre à jour
 * @param {any} value - Nouvelle valeur
 * @param {Function} setWarehouseFormData - Setter pour les données du formulaire
 */
export const handleWarehouseFormChange = (field, value, setWarehouseFormData) => {
  setWarehouseFormData(prev => ({
    ...prev,
    [field]: value
  }));
};

/**
 * PHASE 16 : Handler pour sauvegarder un entrepôt (création uniquement)
 * @param {Object} data - Données de l'entrepôt à sauvegarder (optionnel, utilise warehouseFormData si non fourni)
 * @param {Object} warehouseFormData - Données actuelles du formulaire
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @returns {Promise<void>}
 */
export const handleSaveWarehouse = async (data, warehouseFormData, api, loadData) => {
  try {
    const formData = data || warehouseFormData;
    await api.createWarehouse(formData);
    toast.success('Entrepôt créé avec succès');
    await loadData();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'entrepôt:', error);
    toast.error('Erreur lors de la sauvegarde de l\'entrepôt');
    throw error;
  }
};

