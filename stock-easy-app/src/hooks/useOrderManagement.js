import { useState } from 'react';
import api from '../services/apiService';
import { toast } from 'sonner';
import { formatDateForAPI } from '../utils/dateUtils';
import { calculateETA } from '../utils/etaUtils';

/**
 * Hook pour gérer les actions sur les commandes
 * Extrait de StockEasy.jsx
 */
export const useOrderManagement = (loadData) => {
  const [orderQuantities, setOrderQuantities] = useState({});
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const updateOrderQuantity = (sku, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    setOrderQuantities(prev => ({
      ...prev,
      [sku]: isNaN(qty) || qty < 0 ? 0 : qty
    }));
  };

  const generatePONumber = (existingOrders) => {
    // Utiliser un timestamp pour générer un ID unique et éviter les conflits
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = String(date.getHours()).padStart(2, '0') + String(date.getMinutes()).padStart(2, '0');
    
    return `PO-${day}${month}${year}-${time}`;
  };

  const confirmOrder = async (orderId) => {
    try {
      const confirmedAt = new Date().toISOString();
      await api.updateOrderStatus(orderId, {
        status: 'preparing',
        confirmedAt: confirmedAt
      });
      await loadData();
      toast.success('Commande confirmée !');
    } catch (error) {
      console.error('❌ Erreur confirmation:', error);
      toast.error('Erreur lors de la confirmation');
    }
  };

  const shipOrder = async (orderId, trackingNumber = '', trackingUrl = '', suppliers = [], orders = []) => {
    try {
      const shippedAt = formatDateForAPI(new Date());
      
      // Trouver la commande pour connaître le fournisseur
      const order = orders.find(o => o.id === orderId);
      let eta = null;
      
      if (order && suppliers && suppliers.length > 0) {
        // Trouver le fournisseur pour calculer l'ETA
        const supplier = suppliers.find(s => s.name === order.supplier);
        if (supplier && supplier.leadTimeDays) {
          eta = calculateETA(shippedAt, supplier.leadTimeDays);
          console.log('🚀 ETA calculé côté frontend:', eta, 'pour', supplier.name, 'avec', supplier.leadTimeDays, 'jours');
        } else {
          eta = calculateETA(shippedAt, 30); // Valeur par défaut
          console.log('⚠️ ETA calculé avec valeur par défaut (30 jours)');
        }
      }
      
      await api.updateOrderStatus(orderId, {
        status: 'in_transit',
        shippedAt: shippedAt,
        trackingNumber: trackingNumber || '',
        trackingUrl: trackingUrl || '',
        eta: eta
      });
      await loadData();
      toast.success('Commande expédiée !');
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const receiveOrder = async (orderId) => {
    try {
      await api.updateOrderStatus(orderId, {
        status: 'received',
        receivedAt: formatDateForAPI(new Date())
      });
      await loadData();
      toast.success('Commande reçue !');
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la réception');
    }
  };

  return {
    orderQuantities,
    setOrderQuantities,
    selectedWarehouse,
    setSelectedWarehouse,
    updateOrderQuantity,
    generatePONumber,
    confirmOrder,
    shipOrder,
    receiveOrder
  };
};
