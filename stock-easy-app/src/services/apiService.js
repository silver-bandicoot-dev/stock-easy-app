/**
 * Service API pour l'application Stock Easy
 * 
 * Ce module contient toutes les fonctions pour interagir avec l'API Google Apps Script.
 * Toutes les fonctions retournent des Promises et gèrent les erreurs de manière cohérente.
 */

import { API_URL } from '../config/api';

/**
 * Récupère toutes les données (produits, commandes, fournisseurs)
 */
export async function getAllData() {
  try {
    const response = await fetch(`${API_URL}?action=getAllData`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données:', error);
    throw error;
  }
}

/**
 * Crée une nouvelle commande
 * 
 * @param {Object} orderData - Les données de la commande
 * @param {string} orderData.id - ID unique de la commande
 * @param {string} orderData.supplier - Nom du fournisseur
 * @param {string} orderData.status - Statut de la commande
 * @param {number} orderData.total - Montant total
 * @param {string} orderData.createdAt - Date de création
 * @param {Array} orderData.items - Liste des articles
 */
export async function createOrder(orderData) {
  try {
    const response = await fetch(`${API_URL}?action=createOrder`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la commande:', error);
    throw error;
  }
}

/**
 * Met à jour le statut d'une commande
 * 
 * @param {string|Object} orderIdOrData - ID de la commande ou objet avec les données
 * @param {Object} [updates] - Données de mise à jour (si premier param est un ID)
 */
export async function updateOrderStatus(orderIdOrData, updates) {
  try {
    // Support pour les deux syntaxes : updateOrderStatus(orderId, updates) et updateOrderStatus({ orderId, ...updates })
    const data = typeof orderIdOrData === 'string' 
      ? { orderId: orderIdOrData, ...updates }
      : orderIdOrData;
      
    const response = await fetch(`${API_URL}?action=updateOrderStatus`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la commande:', error);
    throw error;
  }
}

/**
 * Met à jour le stock (addition)
 * 
 * @param {Array} items - Liste des articles à mettre à jour
 * @param {string} items[].sku - SKU du produit
 * @param {number} items[].quantityToAdd - Quantité à ajouter
 */
export async function updateStock(items) {
  try {
    const response = await fetch(`${API_URL}?action=updateStock`, {
      method: 'POST',
      body: JSON.stringify({ items })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du stock:', error);
    throw error;
  }
}

/**
 * Met à jour un produit
 * 
 * @param {string|Object} skuOrData - SKU du produit ou objet avec les données
 * @param {Object} [updates] - Données de mise à jour (si premier param est un SKU)
 */
export async function updateProduct(skuOrData, updates) {
  try {
    // Support pour les deux syntaxes : updateProduct(sku, updates) et updateProduct({ sku, ...updates })
    const data = typeof skuOrData === 'string' 
      ? { sku: skuOrData, ...updates }
      : skuOrData;
      
    const response = await fetch(`${API_URL}?action=updateProduct`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du produit:', error);
    throw error;
  }
}

/**
 * Crée un nouveau fournisseur
 * 
 * @param {Object} data - Les données du fournisseur
 * @param {string} data.name - Nom du fournisseur
 * @param {string} data.email - Email du fournisseur
 * @param {number} data.leadTimeDays - Délai de livraison en jours
 * @param {number} data.moq - Quantité minimum de commande
 * @param {string} data.notes - Notes
 */
export async function createSupplier(data) {
  try {
    const response = await fetch(`${API_URL}?action=createSupplier`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la création du fournisseur:', error);
    throw error;
  }
}

/**
 * Récupère un paramètre de configuration
 * 
 * @param {string} parameterName - Nom du paramètre
 */
export async function getParameter(parameterName) {
  try {
    const response = await fetch(`${API_URL}?action=getParameter&name=${encodeURIComponent(parameterName)}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.value;
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture du paramètre "${parameterName}":`, error);
    // Valeurs par défaut en cas d'erreur
    const defaults = {
      "SeuilSurstockProfond": 90,
      "DeviseDefaut": "EUR",
      "MultiplicateurDefaut": 1.2
    };
    return defaults[parameterName] || null;
  }
}

/**
 * Met à jour un paramètre de configuration
 * 
 * @param {string} paramName - Nom du paramètre
 * @param {any} value - Nouvelle valeur
 */
export async function updateParameter(paramName, value) {
  try {
    const response = await fetch(`${API_URL}?action=updateParameter`, {
      method: 'POST',
      body: JSON.stringify({ paramName, value })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour du paramètre "${paramName}":`, error);
    throw error;
  }
}

/**
 * Met à jour un fournisseur
 * 
 * @param {string} supplierName - Nom du fournisseur
 * @param {Object} updates - Données à mettre à jour
 */
export async function updateSupplier(supplierName, updates) {
  try {
    const response = await fetch(`${API_URL}?action=updateSupplier`, {
      method: 'POST',
      body: JSON.stringify({ supplierName, ...updates })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du fournisseur:', error);
    throw error;
  }
}

/**
 * Supprime un fournisseur
 * 
 * @param {string} supplierName - Nom du fournisseur à supprimer
 */
export async function deleteSupplier(supplierName) {
  try {
    const response = await fetch(`${API_URL}?action=deleteSupplier`, {
      method: 'POST',
      body: JSON.stringify({ supplierName })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du fournisseur:', error);
    throw error;
  }
}

/**
 * Assigne un fournisseur à un produit
 * 
 * @param {string} sku - SKU du produit
 * @param {string} supplierName - Nom du fournisseur
 */
export async function assignSupplierToProduct(sku, supplierName) {
  try {
    const response = await fetch(`${API_URL}?action=assignSupplierToProduct`, {
      method: 'POST',
      body: JSON.stringify({ sku, supplierName })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation du fournisseur:', error);
    throw error;
  }
}

/**
 * Retire le fournisseur d'un produit
 * 
 * @param {string} sku - SKU du produit
 */
export async function removeSupplierFromProduct(sku) {
  try {
    const response = await fetch(`${API_URL}?action=removeSupplierFromProduct`, {
      method: 'POST',
      body: JSON.stringify({ sku })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du fournisseur:', error);
    throw error;
  }
}

// Objet API pour compatibilité avec le code existant
export const api = {
  getAllData,
  createOrder,
  updateOrderStatus,
  updateStock,
  updateProduct,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  assignSupplierToProduct,
  removeSupplierFromProduct,
  getParameter,
  updateParameter
};

export default api;
