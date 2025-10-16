import { useState, useEffect, useCallback } from 'react';
import api from '../services/apiService';
import { toast } from 'sonner';
import { calculateMetrics } from '../utils/calculations';

export const useProducts = (seuilSurstock = 90) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllData();
      
      // Enrichir les produits avec les métriques calculées
      const enrichedProducts = data.products.map(p => 
        calculateMetrics(p, seuilSurstock)
      );
      
      setProducts(enrichedProducts);
      console.log('✅ Produits chargés:', enrichedProducts.length);
    } catch (err) {
      console.error('❌ Erreur chargement produits:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [seuilSurstock]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const updateProduct = useCallback(async (sku, updates) => {
    try {
      await api.updateProduct(sku, updates);
      await loadProducts(); // Recharger après mise à jour
      toast.success('Produit mis à jour avec succès');
    } catch (err) {
      console.error('❌ Erreur mise à jour produit:', err);
      toast.error('Erreur lors de la mise à jour du produit');
      throw err;
    }
  }, [loadProducts]);

  const updateStock = useCallback(async (sku, quantityToAdd) => {
    try {
      await api.updateStock([{ sku, quantityToAdd }]);
      await loadProducts();
      toast.success('Stock mis à jour avec succès');
    } catch (err) {
      console.error('❌ Erreur mise à jour stock:', err);
      toast.error('Erreur lors de la mise à jour du stock');
      throw err;
    }
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    loadProducts,
    updateProduct,
    updateStock,
  };
};
