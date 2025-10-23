import { useState, useEffect } from 'react';
import api from '../services/apiService';
import { toast } from 'sonner';

/**
 * Hook personnalisé pour gérer les données de stock
 * Extrait de StockEasy.jsx
 */
export const useStockData = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [warehouses, setWarehouses] = useState({});
  const [orders, setOrders] = useState([]);
  const [parameters, setParameters] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAllData();
      
      // Construire suppliersMap
      const suppliersMap = {};
      data.suppliers.forEach(s => {
        suppliersMap[s.name] = s;
      });
      
      // Construire warehousesMap
      const warehousesMap = {};
      if (data.warehouses && Array.isArray(data.warehouses)) {
        data.warehouses.forEach(w => {
          warehousesMap[w.name] = w;
        });
      }
      
      setSuppliers(suppliersMap);
      setWarehouses(warehousesMap);
      setProducts(data.products);
      setOrders(data.orders);
      
      // Charger les paramètres
      if (data.parameters) {
        setParameters(data.parameters);
      }
      
      console.log('✅ Données chargées depuis Google Sheets');
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    try {
      setSyncing(true);
      await loadData();
      console.log('🔄 Synchronisation effectuée');
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      syncData();
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  return {
    loading,
    syncing,
    products,
    suppliers,
    warehouses,
    orders,
    parameters,
    loadData,
    syncData,
    setProducts,
    setOrders,
    setSuppliers,
    setWarehouses,
    setParameters
  };
};
