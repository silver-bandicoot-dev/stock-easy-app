/**
 * Service de cache pour réduire les appels Supabase
 * Utilise localStorage avec expiration et invalidation intelligente
 */

const CACHE_PREFIX = 'stockeasy_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes par défaut

// Configuration des TTL par type de données
const CACHE_CONFIG = {
  products: { ttl: 2 * 60 * 1000, key: 'products' },      // 2 min (change souvent)
  orders: { ttl: 1 * 60 * 1000, key: 'orders' },          // 1 min (critique)
  suppliers: { ttl: 10 * 60 * 1000, key: 'suppliers' },   // 10 min (change rarement)
  warehouses: { ttl: 15 * 60 * 1000, key: 'warehouses' }, // 15 min (change rarement)
  parameters: { ttl: 30 * 60 * 1000, key: 'parameters' }, // 30 min (config)
  allData: { ttl: 2 * 60 * 1000, key: 'allData' },        // 2 min (bundle complet)
};

/**
 * Génère la clé de cache complète
 */
const getCacheKey = (key) => `${CACHE_PREFIX}${key}`;

/**
 * Récupère les données du cache si elles existent et ne sont pas expirées
 * @param {string} key - Clé de cache
 * @returns {Object|null} Données cachées ou null
 */
export const getFromCache = (key) => {
  try {
    const cacheKey = getCacheKey(key);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp, ttl } = JSON.parse(cached);
    const now = Date.now();
    
    // Vérifier si le cache est expiré
    if (now - timestamp > ttl) {
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ Cache expiré: ${key}`);
      return null;
    }
    
    const ageSeconds = Math.round((now - timestamp) / 1000);
    console.log(`✅ Cache hit: ${key} (âge: ${ageSeconds}s)`);
    return data;
    
  } catch (error) {
    console.warn(`⚠️ Erreur lecture cache ${key}:`, error);
    return null;
  }
};

/**
 * Stocke les données dans le cache
 * @param {string} key - Clé de cache
 * @param {any} data - Données à cacher
 * @param {number} ttl - Durée de vie en ms (optionnel)
 */
export const setInCache = (key, data, ttl = DEFAULT_TTL) => {
  try {
    const cacheKey = getCacheKey(key);
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    console.log(`💾 Cache set: ${key} (TTL: ${ttl / 1000}s)`);
    
  } catch (error) {
    // Gérer le cas où localStorage est plein
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ Cache plein, nettoyage...');
      clearOldCache();
      // Réessayer une fois
      try {
        localStorage.setItem(getCacheKey(key), JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl
        }));
      } catch (e) {
        console.error('❌ Impossible de cacher après nettoyage');
      }
    } else {
      console.warn(`⚠️ Erreur écriture cache ${key}:`, error);
    }
  }
};

/**
 * Invalide une ou plusieurs clés de cache
 * @param {string|string[]} keys - Clé(s) à invalider
 */
export const invalidateCache = (keys) => {
  const keysArray = Array.isArray(keys) ? keys : [keys];
  
  keysArray.forEach(key => {
    const cacheKey = getCacheKey(key);
    localStorage.removeItem(cacheKey);
    console.log(`🔄 Cache invalidé: ${key}`);
  });
};

/**
 * Invalide tout le cache Stockeasy
 */
export const clearAllCache = () => {
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️ Cache vidé (${keysToRemove.length} entrées)`);
};

/**
 * Nettoie les entrées de cache expirées
 */
export const clearOldCache = () => {
  const now = Date.now();
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      try {
        const cached = JSON.parse(localStorage.getItem(key));
        if (now - cached.timestamp > cached.ttl) {
          keysToRemove.push(key);
        }
      } catch {
        // Si parsing échoue, supprimer l'entrée corrompue
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`🧹 Cache nettoyé (${keysToRemove.length} entrées expirées)`);
};

/**
 * Wrapper pour appels API avec cache
 * @param {string} cacheKey - Clé de cache
 * @param {Function} fetchFn - Fonction fetch à exécuter si cache miss
 * @param {Object} options - Options
 * @returns {Promise<any>} Données (du cache ou fraîches)
 */
export const withCache = async (cacheKey, fetchFn, options = {}) => {
  const { 
    ttl = DEFAULT_TTL, 
    forceRefresh = false,
    onCacheHit = null,
    onCacheMiss = null
  } = options;
  
  // Si forceRefresh, ignorer le cache
  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached !== null) {
      onCacheHit?.(cached);
      return cached;
    }
  }
  
  // Cache miss - fetch les données
  onCacheMiss?.();
  const data = await fetchFn();
  
  // Stocker en cache
  if (data !== null && data !== undefined) {
    setInCache(cacheKey, data, ttl);
  }
  
  return data;
};

/**
 * Hook helper pour créer un système de cache réactif
 * À utiliser avec les configurations prédéfinies
 */
export const getCacheConfig = (dataType) => {
  return CACHE_CONFIG[dataType] || { ttl: DEFAULT_TTL, key: dataType };
};

/**
 * Invalide le cache lié à un type de mutation
 * @param {string} mutationType - Type de mutation (create_order, update_product, etc.)
 */
export const invalidateOnMutation = (mutationType) => {
  const invalidationMap = {
    // Commandes
    'create_order': ['orders', 'allData'],
    'update_order': ['orders', 'allData'],
    'delete_order': ['orders', 'allData'],
    'confirm_order': ['orders', 'allData'],
    'ship_order': ['orders', 'allData'],
    'receive_order': ['orders', 'products', 'allData'],
    
    // Produits
    'update_product': ['products', 'allData'],
    'update_stock': ['products', 'allData'],
    
    // Fournisseurs
    'create_supplier': ['suppliers', 'allData'],
    'update_supplier': ['suppliers', 'allData'],
    'delete_supplier': ['suppliers', 'allData'],
    
    // Entrepôts
    'create_warehouse': ['warehouses', 'allData'],
    'update_warehouse': ['warehouses', 'allData'],
    'delete_warehouse': ['warehouses', 'allData'],
    
    // Paramètres
    'update_parameters': ['parameters', 'allData'],
  };
  
  const keysToInvalidate = invalidationMap[mutationType];
  if (keysToInvalidate) {
    invalidateCache(keysToInvalidate);
  }
};

// Exporter la config pour utilisation externe
export { CACHE_CONFIG };

export default {
  get: getFromCache,
  set: setInCache,
  invalidate: invalidateCache,
  clearAll: clearAllCache,
  clearOld: clearOldCache,
  withCache,
  getCacheConfig,
  invalidateOnMutation,
  CACHE_CONFIG
};

