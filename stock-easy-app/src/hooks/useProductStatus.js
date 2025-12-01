// ============================================
// HOOK useProductStatus - Extraites de Stockeasy.jsx
// PHASE 7 : Calculs useMemo / Business Logic
// ============================================

import { useMemo } from 'react';

console.log('📁 Loading useProductStatus.js - Phase 7');

/**
 * Hook personnalisé pour calculer les statuts des produits et les notifications
 * @param {Array} enrichedProducts - Liste des produits enrichis
 * @param {Array} orders - Liste des commandes
 * @returns {Object} Objet contenant productsByStatus, toOrderBySupplier, et notifications
 */
export const useProductStatus = (enrichedProducts, orders) => {

  // Calcul des produits par statut
  const productsByStatus = useMemo(() => {
    // Calculer les quantités déjà en commande pour chaque produit
    // (commandes avec statut pending_confirmation, preparing, ou in_transit)
    const quantitiesInOrder = {};
    // Calculer les quantités en transit spécifiquement
    const quantitiesInTransit = {};
    
    orders
      .filter(o => ['pending_confirmation', 'preparing', 'in_transit'].includes(o.status))
      .forEach(order => {
        order.items?.forEach(item => {
          if (!quantitiesInOrder[item.sku]) {
            quantitiesInOrder[item.sku] = 0;
          }
          quantitiesInOrder[item.sku] += item.quantity || 0;
          
          // Quantités en transit spécifiquement
          if (order.status === 'in_transit') {
            if (!quantitiesInTransit[item.sku]) {
              quantitiesInTransit[item.sku] = 0;
            }
            quantitiesInTransit[item.sku] += item.quantity || 0;
          }
        });
      });

    // Enrichir les produits avec les quantités en commande et en transit
    const enrichedWithOrderInfo = enrichedProducts.map(p => ({
      ...p,
      qtyInOrder: quantitiesInOrder[p.sku] || 0,
      qtyInTransit: quantitiesInTransit[p.sku] || 0,
      // Quantité résiduelle à commander (quantité nécessaire - quantité déjà commandée)
      qtyToOrderRemaining: Math.max(0, (p.qtyToOrder || 0) - (quantitiesInOrder[p.sku] || 0))
    }));

    return {
      // Un produit doit apparaître dans "Produits à commander" seulement si
      // la quantité à commander dépasse ce qui est déjà commandé
      // Et on affiche la quantité résiduelle
      to_order: enrichedWithOrderInfo.filter(p => {
        const qtyToOrder = p.qtyToOrder || 0;
        const qtyInOrder = p.qtyInOrder || 0;
        // Afficher seulement si la quantité nécessaire dépasse ce qui est déjà en commande
        return qtyToOrder > qtyInOrder;
      }),
      watch: enrichedWithOrderInfo.filter(p => {
        const qtyToOrder = p.qtyToOrder || 0;
        const qtyInOrder = p.qtyInOrder || 0;
        // Ne pas afficher dans "watch" si c'est déjà dans "to_order"
        return qtyToOrder <= qtyInOrder && p.stock < p.reorderPoint * 1.2;
      }),
      in_transit: enrichedWithOrderInfo.filter(p => {
        return orders.some(o => 
          o.status === 'in_transit' && 
          o.items.some(item => item.sku === p.sku)
        );
      }),
      received: enrichedWithOrderInfo.filter(p => {
        return orders.some(o => 
          o.status === 'received' && 
          o.items.some(item => item.sku === p.sku)
        );
      })
    };
  }, [enrichedProducts, orders]);

  // Groupe les produits à commander par fournisseur
  const toOrderBySupplier = useMemo(() => {
    const grouped = {};
    const UNASSIGNED_SUPPLIER = '__unassigned__';
    
    productsByStatus.to_order.forEach(p => {
      // Utiliser une clé spéciale pour les produits sans fournisseur
      const supplierKey = p.supplier || UNASSIGNED_SUPPLIER;
      if (!grouped[supplierKey]) {
        grouped[supplierKey] = [];
      }
      grouped[supplierKey].push(p);
    });
    return grouped;
  }, [productsByStatus]);

  // Calcul des notifications
  const notifications = useMemo(() => {
    const notifs = [];
    
    if (productsByStatus.to_order.length > 0) {
      notifs.push({
        type: 'warning',
        message: `${productsByStatus.to_order.length} produit(s) à commander`,
        count: productsByStatus.to_order.length
      });
    }
    
    productsByStatus.in_transit.forEach(p => {
      const order = orders.find(o => o.items.some(item => item.sku === p.sku) && o.status === 'in_transit');
      if (order && order.shippedAt) {
        const daysSinceShip = Math.floor((new Date() - new Date(order.shippedAt)) / (1000 * 60 * 60 * 24));
        const daysRemaining = p.leadTimeDays - daysSinceShip;
        if (daysRemaining <= 3) {
          notifs.push({
            type: 'info',
            message: `${p.name} arrive dans ~${daysRemaining} jour(s)`,
            product: p.name
          });
        }
      }
    });
    
    if (orders.filter(o => o.status === 'received').length > 0) {
      notifs.push({
        type: 'success',
        message: `${orders.filter(o => o.status === 'received').length} commande(s) à valider`,
        count: orders.filter(o => o.status === 'received').length
      });
    }
    
    return notifs;
  }, [productsByStatus, orders]);

  return {
    productsByStatus,
    toOrderBySupplier,
    notifications
  };
};

