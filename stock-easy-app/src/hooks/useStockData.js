import { useState, useEffect } from 'react';
import api from '../services/apiAdapter';
import { toast } from 'sonner';
import { DEFAULT_PARAMETERS } from '../constants/stockEasyConstants';

const NUMERIC_PARAMETERS = new Set(['seuilSurstockProfond', 'multiplicateurDefaut']);

const normalizeParamKey = (key = '') => {
  if (!key) return '';

  if (key.includes('_')) {
    return key
      .toLowerCase()
      .replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  }

  return key.charAt(0).toLowerCase() + key.slice(1);
};

const parseParameterValue = (key, value) => {
  if (value === null || value === undefined) return value;

  if (NUMERIC_PARAMETERS.has(key)) {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? DEFAULT_PARAMETERS[key] : numericValue;
  }

  return value;
};

const buildParametersState = (rawParameters) => {
  const base = { ...DEFAULT_PARAMETERS };

  if (!rawParameters) {
    return base;
  }

  const parameterEntries = Array.isArray(rawParameters)
    ? rawParameters
    : [rawParameters];

  parameterEntries.forEach((param) => {
    if (!param) return;
    const rawKey =
      param.nomParametre ||
      param.nom_parametre ||
      param.paramName ||
      param.name ||
      param.key;

    if (!rawKey) return;

    const normalizedKey = normalizeParamKey(rawKey);
    const rawValue =
      param.valeur ??
      param.value ??
      param.paramValue ??
      param.val ??
      param.data;

    if (rawValue === undefined) return;

    base[normalizedKey] = parseParameterValue(normalizedKey, rawValue);
  });

  return base;
};

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
      
      // Construire warehousesMap (indexé par nom ET par id)
      const warehousesMap = {};
      if (data.warehouses && Array.isArray(data.warehouses)) {
        data.warehouses.forEach(w => {
          warehousesMap[w.name] = w;  // Index par nom (legacy)
          if (w.id) {
            warehousesMap[w.id] = w;  // Index par ID (UUID)
          }
        });
      }
      
      setSuppliers(suppliersMap);
      setWarehouses(warehousesMap);
      setProducts(data.products);
      setOrders(data.orders);
      
      // Charger les paramètres
      const parsedParameters = buildParametersState(data.parameters);
      setParameters(parsedParameters);
      
      console.log('✅ Données chargées depuis Supabase');
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
    // Synchronisation périodique réduite à 2 minutes pour être plus réactif
    // La synchronisation en temps réel via useSupabaseSync gère la plupart des changements
    const interval = setInterval(() => {
      syncData();
    }, 2 * 60 * 1000); // 2 minutes
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
