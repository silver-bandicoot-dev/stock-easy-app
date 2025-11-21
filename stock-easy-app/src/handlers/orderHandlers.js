// ============================================
// HANDLERS COMMANDES - Extraites de StockEasy.jsx
// PHASE 8 : Handlers Commandes Complexes
// PHASE 10 : Handlers Email/Commandes
// ============================================

import { toast } from 'sonner';
import { REFACTOR_FLAGS } from '../config/feature-flags';

console.log('📁 Loading orderHandlers.js - Phase 8 & 10');

/**
 * Crée une commande simple (pour les boutons dans OrderBySupplier)
 * @param {string} supplier - Le nom du fournisseur
 * @param {Array} products - Liste des produits à commander
 * @param {string} selectedWarehouse - L'entrepôt sélectionné
 * @param {Object} orderQuantities - Objet avec les quantités modifiées par SKU
 * @param {Array} orders - Liste des commandes existantes (pour générer le PO number)
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} generatePONumber - Fonction pour générer le numéro de commande
 * @returns {Promise<void>}
 */
export const handleCreateOrder = async (
  supplier,
  products,
  selectedWarehouse,
  orderQuantities,
  orders,
  api,
  loadData,
  generatePONumber
) => {
  try {
    if (REFACTOR_FLAGS?.PHASE_8_ACTIVE) {
      console.log('✅ Using refactored handleCreateOrder - Phase 8');
    }

    if (!selectedWarehouse) {
      toast.error('Veuillez sélectionner un entrepôt');
      return;
    }

    const poNumber = generatePONumber(orders);
    const orderData = {
      poNumber,
      supplier,
      warehouse: selectedWarehouse,
      status: 'pending',
      items: products.map(p => ({
        sku: p.sku,
        quantity: orderQuantities[p.sku] || p.qtyToOrder,
        pricePerUnit: p.buyPrice
      })),
      notes: `Commande pour ${supplier}`
    };

    await api.createOrder(orderData);
    await loadData();
    toast.success(`Commande créée pour ${supplier} !`);
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    toast.error('Erreur lors de la création de la commande');
    throw error;
  }
};

/**
 * Crée une commande depuis la table de sélection
 * @param {Map} selectedProducts - Map<sku, quantity> des produits sélectionnés
 * @param {Array} enrichedProducts - Liste des produits enrichis
 * @param {Object} warehouses - Objet des entrepôts
 * @param {Array} orders - Liste des commandes existantes
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} generatePONumber - Fonction pour générer le numéro de commande
 * @param {Function} roundToTwoDecimals - Fonction pour arrondir à 2 décimales
 * @param {Function} setEmailModalOpen - Setter pour ouvrir/fermer le modal email
 * @param {Function} setSelectedSupplier - Setter pour le fournisseur sélectionné
 * @param {Function} setSelectedWarehouse - Setter pour l'entrepôt sélectionné
 * @param {Function} setOrderQuantities - Setter pour les quantités de commande
 * @returns {Promise<void>}
 */
export const handleCreateOrderFromTable = async (
  selectedProducts,
  enrichedProducts,
  warehouses,
  orders,
  api,
  loadData,
  generatePONumber,
  roundToTwoDecimals,
  setEmailModalOpen,
  setSelectedSupplier,
  setSelectedWarehouse,
  setOrderQuantities
) => {
  try {
    if (REFACTOR_FLAGS?.PHASE_8_ACTIVE) {
      console.log('✅ Using refactored handleCreateOrderFromTable - Phase 8');
    }

    // selectedProducts est une Map<sku, quantity>
    
    // Grouper les produits par fournisseur
    const productsBySupplier = {};
    
    selectedProducts.forEach((quantity, sku) => {
      const product = enrichedProducts.find(p => p.sku === sku);
      if (!product || !product.supplier) return;
      
      if (!productsBySupplier[product.supplier]) {
        productsBySupplier[product.supplier] = [];
      }
      
      productsBySupplier[product.supplier].push({
        ...product,
        orderQuantity: quantity
      });
    });
    
    // Si un seul fournisseur, ouvrir directement la modal email
    if (Object.keys(productsBySupplier).length === 1) {
      const supplier = Object.keys(productsBySupplier)[0];
      const products = productsBySupplier[supplier];
      
      // Pré-remplir orderQuantities
      const quantities = {};
      products.forEach(p => {
        quantities[p.sku] = p.orderQuantity;
      });
      setOrderQuantities(quantities);
      setSelectedSupplier(supplier);
      
      // Sélectionner le premier warehouse par défaut
      const warehousesList = Object.values(warehouses);
      if (warehousesList.length > 0) {
        setSelectedWarehouse(warehousesList[0].name);
      }
      
      setEmailModalOpen(true);
    } else {
      // Si plusieurs fournisseurs, créer plusieurs commandes ou afficher un choix
      toast.info('Plusieurs fournisseurs détectés. Créer des commandes séparées...', {
        duration: 4000
      });
      
      const warehousesList = Object.values(warehouses);
      
      // Option : créer automatiquement une commande par fournisseur
      for (const [supplier, products] of Object.entries(productsBySupplier)) {
        // Créer la commande sans email pour chaque fournisseur
        // Utiliser l'investissement si disponible, sinon calculer orderQuantity * buyPrice
        const total = roundToTwoDecimals(products.reduce((sum, p) => {
          // Si orderQuantity diffère de qtyToOrder, recalculer
          if (p.orderQuantity && p.orderQuantity !== p.qtyToOrder) {
            return sum + (p.orderQuantity * p.buyPrice);
          }
          return sum + (p.investment || (p.orderQuantity * p.buyPrice) || 0);
        }, 0));
        
        const orderData = {
          id: generatePONumber(orders),
          supplier: supplier,
          warehouseId: warehousesList[0]?.name || null,
          status: 'pending_confirmation',
          total: total,
          createdAt: new Date().toISOString().split('T')[0],
          items: products.map(p => ({
            sku: p.sku,
            quantity: p.orderQuantity,
            pricePerUnit: p.buyPrice
          })),
          notes: 'Commande créée depuis la table de sélection'
        };
        
        await api.createOrder(orderData);
      }
      
      await loadData();
      toast.success(`${Object.keys(productsBySupplier).length} commande(s) créée(s) !`, {
        duration: 4000
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de commande depuis la table:', error);
    toast.error('Erreur lors de la création de la commande');
    throw error;
  }
};

/**
 * PHASE 10 : Handler pour envoyer une commande par email
 * Crée une commande et génère un email
 * @param {Object} inlineModals - Objet contenant les modals inline
 * @param {Object} toOrderBySupplier - Produits à commander groupés par fournisseur
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} roundToTwoDecimals - Fonction pour arrondir à 2 décimales
 * @param {Function} generatePONumber - Fonction pour générer le numéro de commande
 * @param {Object} emailGeneration - Hook pour la génération d'emails
 * @param {Function} getUserSignature - Fonction pour obtenir la signature utilisateur
 * @param {Object} suppliers - Objet des fournisseurs
 * @param {Object} warehouses - Objet des entrepôts
 * @param {Array} orders - Liste des commandes existantes
 * @param {Function} setActiveTab - Setter pour changer l'onglet actif
 * @returns {Promise<void>}
 */
export const handleSendOrder = async (
  inlineModals,
  toOrderBySupplier,
  api,
  loadData,
  roundToTwoDecimals,
  generatePONumber,
  emailGeneration,
  getUserSignature,
  suppliers,
  warehouses,
  orders,
  setActiveTab
) => {
  try {
    const selectedSupplier = inlineModals.emailOrderModal.selectedSupplier;
    const selectedWarehouse = inlineModals.emailOrderModal.selectedWarehouse;
    const productsToOrder = toOrderBySupplier[selectedSupplier];
    
    if (!selectedWarehouse) {
      toast.error('Veuillez sélectionner un entrepôt');
      return;
    }
    
    const total = roundToTwoDecimals(productsToOrder.reduce((sum, p) => {
      const qty = inlineModals.emailOrderModal.orderQuantities[p.sku] || p.qtyToOrder;
      return sum + (qty * p.buyPrice);
    }, 0));
    
    const orderData = {
      id: generatePONumber(orders),
      supplier: selectedSupplier,
      warehouseId: selectedWarehouse,
      warehouseName: selectedWarehouse,
      status: 'pending_confirmation',
      total: total,
      createdAt: new Date().toISOString().split('T')[0],
      items: productsToOrder.map(p => ({
        sku: p.sku,
        quantity: inlineModals.emailOrderModal.orderQuantities[p.sku] || p.qtyToOrder,
        pricePerUnit: p.buyPrice
      })),
      notes: ''
    };

    await api.createOrder(orderData);
    await loadData();
    
    // Générer et envoyer l'email
    const emailContent = emailGeneration.generateOrderEmailDraft(
      selectedSupplier,
      productsToOrder,
      selectedWarehouse,
      inlineModals.emailOrderModal.orderQuantities,
      getUserSignature(),
      suppliers,
      warehouses
    );
    
    // Ici vous pouvez ajouter la logique d'envoi d'email
    console.log('📧 Email généré:', emailContent);
    
    inlineModals.emailOrderModal.closeEmailModal();
    toast.success('Commande créée et email généré avec succès !', {
      action: {
        label: 'Voir',
        onClick: () => setActiveTab('track')
      },
      duration: 6000
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création de la commande:', error);
    toast.error('Erreur lors de la création de la commande');
  }
};

/**
 * PHASE 10 : Handler pour créer une commande sans email
 * Crée une commande sans générer d'email
 * @param {Object} inlineModals - Objet contenant les modals inline
 * @param {Object} toOrderBySupplier - Produits à commander groupés par fournisseur
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} roundToTwoDecimals - Fonction pour arrondir à 2 décimales
 * @param {Function} generatePONumber - Fonction pour générer le numéro de commande
 * @param {Array} orders - Liste des commandes existantes
 * @param {Function} setActiveTab - Setter pour changer l'onglet actif
 * @returns {Promise<void>}
 */
export const handleCreateOrderWithoutEmail = async (
  inlineModals,
  toOrderBySupplier,
  api,
  loadData,
  roundToTwoDecimals,
  generatePONumber,
  orders,
  setActiveTab
) => {
  try {
    const selectedSupplier = inlineModals.emailOrderModal.selectedSupplier;
    const selectedWarehouse = inlineModals.emailOrderModal.selectedWarehouse;
    const productsToOrder = toOrderBySupplier[selectedSupplier];
    
    if (!selectedWarehouse) {
      toast.error('Veuillez sélectionner un entrepôt');
      return;
    }
    
    const total = roundToTwoDecimals(productsToOrder.reduce((sum, p) => {
      const qty = inlineModals.emailOrderModal.orderQuantities[p.sku] || p.qtyToOrder;
      return sum + (qty * p.buyPrice);
    }, 0));
    
    const orderData = {
      id: generatePONumber(orders),
      supplier: selectedSupplier,
      warehouseId: selectedWarehouse,
      warehouseName: selectedWarehouse,
      status: 'pending_confirmation',
      total: total,
      createdAt: new Date().toISOString().split('T')[0],
      items: productsToOrder.map(p => ({
        sku: p.sku,
        quantity: inlineModals.emailOrderModal.orderQuantities[p.sku] || p.qtyToOrder,
        pricePerUnit: p.buyPrice
      })),
      notes: ''
    };

    await api.createOrder(orderData);
    await loadData();
    
    inlineModals.emailOrderModal.closeEmailModal();
    toast.success('Commande créée avec succès !', {
      action: {
        label: 'Voir',
        onClick: () => setActiveTab('track')
      },
      duration: 6000
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création de la commande:', error);
    toast.error('Erreur lors de la création de la commande');
  }
};

/**
 * PHASE 10 : Handler pour ouvrir le modal d'email de commande
 * Ouvre le modal et pré-remplit les quantités
 * @param {Object} inlineModals - Objet contenant les modals inline
 * @param {string} supplier - Le nom du fournisseur
 * @param {Array} products - Liste des produits à commander
 * @param {Object} warehouses - Objet des entrepôts
 * @returns {void}
 */
export const handleOpenEmailModal = (
  inlineModals,
  supplier,
  products,
  warehouses
) => {
  // Utiliser le système inline qui fonctionnait avant
  inlineModals.emailOrderModal.openEmailModal(supplier);
  
  // Pré-remplir les quantités dans le système inline
  products.forEach(p => {
    inlineModals.emailOrderModal.updateOrderQuantity(p.sku, p.qtyToOrder);
  });
  
  // Sélectionner le premier warehouse par défaut
  const warehousesList = Object.values(warehouses);
  if (warehousesList.length > 0) {
    inlineModals.emailOrderModal.setSelectedWarehouse(warehousesList[0].name);
  }
};

/**
 * PHASE 12 : Handler pour ouvrir la modale d'expédition
 * @param {Object} shipOrderModal - Objet modal depuis useShipOrderModal
 * @param {string} orderId - ID de la commande à expédier
 */
export const handleShipOrder = (shipOrderModal, orderId) => {
  shipOrderModal.openModal(orderId);
};

/**
 * PHASE 12 : Handler pour confirmer l'expédition d'une commande
 * @param {Function} shipOrder - Fonction pour expédier la commande depuis useOrderManagement
 * @param {Object} shipOrderModal - Objet modal depuis useShipOrderModal
 * @param {string} trackingNumber - Numéro de suivi
 * @param {string} trackingUrl - URL de suivi
 * @param {Array|Object} suppliers - Liste ou objet map des fournisseurs
 * @param {Array} orders - Liste des commandes
 */
export const handleConfirmShipOrder = async (
  shipOrder,
  shipOrderModal,
  trackingNumber,
  trackingUrl,
  suppliers,
  orders
) => {
  try {
    await shipOrder(shipOrderModal.orderId, trackingNumber, trackingUrl, suppliers, orders);
    shipOrderModal.closeModal();
  } catch (error) {
    console.error('❌ Erreur lors de l\'expédition:', error);
    toast.error('Erreur lors de l\'expédition');
  }
};

