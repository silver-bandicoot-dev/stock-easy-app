import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/apiAdapter';
import { toast } from 'sonner';
import { DEFAULT_PARAMETERS } from '../constants/stockEasyConstants';
import cache, { CACHE_CONFIG, invalidateOnMutation } from '../services/cacheService';

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
 * Avec système de cache intelligent pour réduire les appels Supabase
 */
export const useStockData = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [warehouses, setWarehouses] = useState({});
  const [orders, setOrders] = useState([]);
  const [parameters, setParameters] = useState({});
  
  // Ref pour éviter les appels simultanés
  const loadingRef = useRef(false);

  /**
   * Transforme les données brutes en maps utilisables
   */
  const processData = useCallback((data) => {
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
    
    return {
      suppliersMap,
      warehousesMap,
      products: data.products,
      orders: data.orders,
      parameters: buildParametersState(data.parameters)
    };
  }, []);

  /**
   * Charge les données avec support du cache
   */
  const loadData = useCallback(async (options = {}) => {
    const { forceRefresh = false } = options;
    
    // Éviter les appels simultanés
    if (loadingRef.current) {
      console.log('⏳ Chargement déjà en cours...');
      return;
    }
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      let data;
      const cacheConfig = CACHE_CONFIG.allData;
      
      // Essayer le cache d'abord (sauf si forceRefresh)
      if (!forceRefresh) {
        const cachedData = cache.get(cacheConfig.key);
        if (cachedData) {
          data = cachedData;
        }
      }
      
      // Si pas de cache, charger depuis Supabase
      if (!data) {
        console.log('📡 Chargement depuis Supabase...');
        data = await api.getAllData();
        
        // Stocker en cache
        cache.set(cacheConfig.key, data, cacheConfig.ttl);
      }
      
      // Transformer et appliquer les données
      const processed = processData(data);
      
      // DEBUG: Vérifier si les commandes ont warehouseName
      console.log('🏭 DEBUG commandes avec warehouse:', data.orders?.slice(0, 3)?.map(o => ({
        id: o.id,
        warehouseId: o.warehouseId,
        warehouseName: o.warehouseName
      })));
      
      setSuppliers(processed.suppliersMap);
      setWarehouses(processed.warehousesMap);
      setProducts(processed.products);
      setOrders(processed.orders);
      setParameters(processed.parameters);
      
      console.log('✅ Données chargées');
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [processData]);

  /**
   * Synchronisation manuelle (force refresh)
   */
  const syncData = useCallback(async () => {
    try {
      setSyncing(true);
      // Invalider le cache avant de recharger
      cache.invalidate(['allData', 'products', 'orders', 'suppliers', 'warehouses']);
      await loadData({ forceRefresh: true });
      console.log('🔄 Synchronisation effectuée');
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    } finally {
      setSyncing(false);
    }
  }, [loadData]);

  /**
   * Invalide le cache suite à une mutation
   */
  const invalidateCacheOnMutation = useCallback((mutationType) => {
    invalidateOnMutation(mutationType);
  }, []);

  useEffect(() => {
    loadData();
    
    // Nettoyage périodique du cache expiré
    const cleanupInterval = setInterval(() => {
      cache.clearOld();
    }, 5 * 60 * 1000); // Toutes les 5 minutes
    
    // Synchronisation périodique (avec cache, donc légère)
    const syncInterval = setInterval(() => {
      loadData(); // Utilisera le cache si disponible
    }, 2 * 60 * 1000); // 2 minutes
    
    return () => {
      clearInterval(cleanupInterval);
      clearInterval(syncInterval);
    };
  }, [loadData]);

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
    setParameters,
    // Nouvelles fonctions pour la gestion du cache
    invalidateCacheOnMutation,
    forceRefresh: () => loadData({ forceRefresh: true })
  };
};
