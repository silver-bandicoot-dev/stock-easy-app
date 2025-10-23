import { useState } from 'react';
import api from '../services/apiService';
import { toast } from 'sonner';
import { formatDateForAPI } from '../utils/dateUtils';

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
    const poNumbers = existingOrders
      .map(o => {
        const match = o.id.match(/^PO-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);
    
    const nextNumber = poNumbers.length > 0 ? Math.max(...poNumbers) + 1 : 1;
    return `PO-${String(nextNumber).padStart(3, '0')}`;
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

  const shipOrder = async (orderId) => {
    const tracking = prompt('Entrez le numéro de suivi (optionnel):');
    try {
      await api.updateOrderStatus(orderId, {
        status: 'in_transit',
        shippedAt: formatDateForAPI(new Date()),
        trackingNumber: tracking || ''
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
