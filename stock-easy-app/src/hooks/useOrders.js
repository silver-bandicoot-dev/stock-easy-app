import { useState, useEffect, useCallback } from 'react';
import api from '../services/apiService';
import { toast } from 'sonner';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllData();
      setOrders(data.orders || []);
      console.log('✅ Commandes chargées:', data.orders?.length || 0);
    } catch (err) {
      console.error('❌ Erreur chargement commandes:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const createOrder = useCallback(async (orderData) => {
    try {
      await api.createOrder(orderData);
      await loadOrders();
      toast.success('Commande créée avec succès');
    } catch (err) {
      console.error('❌ Erreur création commande:', err);
      toast.error('Erreur lors de la création de la commande');
      throw err;
    }
  }, [loadOrders]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, { status: newStatus });
      await loadOrders();
      toast.success('Statut de commande mis à jour');
    } catch (err) {
      console.error('❌ Erreur mise à jour statut:', err);
      toast.error('Erreur lors de la mise à jour du statut');
      throw err;
    }
  }, [loadOrders]);

  const sendOrder = useCallback(async (orderId) => {
    try {
      await api.updateOrderStatus(orderId, { status: 'confirmed' });
      await loadOrders();
      toast.success('Commande envoyée au fournisseur');
    } catch (err) {
      console.error('❌ Erreur envoi commande:', err);
      toast.error('Erreur lors de l\'envoi de la commande');
      throw err;
    }
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    loadOrders,
    createOrder,
    updateOrderStatus,
    sendOrder,
  };
};
