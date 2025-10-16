import { useState, useEffect, useCallback } from 'react';
import api from '../services/apiService';
import { toast } from 'sonner';

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState({});
  const [suppliersList, setSuppliersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllData();
      
      // Créer le map des fournisseurs
      const suppliersMap = {};
      const list = [];
      
      data.suppliers.forEach(s => {
        suppliersMap[s.name] = s;
        list.push(s);
      });
      
      setSuppliers(suppliersMap);
      setSuppliersList(list);
      console.log('✅ Fournisseurs chargés:', list.length);
    } catch (err) {
      console.error('❌ Erreur chargement fournisseurs:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const createSupplier = useCallback(async (supplierData) => {
    try {
      await api.createSupplier(supplierData);
      await loadSuppliers();
      toast.success('Fournisseur créé avec succès');
    } catch (err) {
      console.error('❌ Erreur création fournisseur:', err);
      toast.error('Erreur lors de la création du fournisseur');
      throw err;
    }
  }, [loadSuppliers]);

  const updateSupplier = useCallback(async (supplierName, updates) => {
    try {
      await api.updateSupplier(supplierName, updates);
      await loadSuppliers();
      toast.success('Fournisseur mis à jour');
    } catch (err) {
      console.error('❌ Erreur mise à jour fournisseur:', err);
      toast.error('Erreur lors de la mise à jour du fournisseur');
      throw err;
    }
  }, [loadSuppliers]);

  return {
    suppliers,
    suppliersList,
    loading,
    error,
    loadSuppliers,
    createSupplier,
    updateSupplier,
  };
};
