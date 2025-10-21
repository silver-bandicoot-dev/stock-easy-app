/**
 * Système de cache pour les prévisions ML
 * @module utils/ml/forecastCache
 */

const CACHE_KEY = 'ml-forecast-cache';
const CACHE_DURATION = 3600000; // 1 heure en millisecondes

/**
 * Sauvegarde les prévisions dans le cache
 * @param {string} productSku - SKU du produit
 * @param {Object} forecast - Prévisions
 */
export function cacheForecast(productSku, forecast) {
  try {
    const cache = getCacheData();
    
    cache[productSku] = {
      forecast,
      timestamp: Date.now(),
      version: '1.0'
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log(`💾 Prévisions mises en cache pour ${productSku}`);
  } catch (error) {
    console.error('Erreur lors de la mise en cache:', error);
  }
}

/**
 * Sauvegarde toutes les prévisions en une fois
 * @param {Object} allForecasts - Toutes les prévisions {sku: forecast}
 */
export function cacheAllForecasts(allForecasts) {
  try {
    const cache = {};
    const timestamp = Date.now();

    Object.entries(allForecasts).forEach(([sku, forecast]) => {
      cache[sku] = {
        forecast,
        timestamp,
        version: '1.0'
      };
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log(`💾 ${Object.keys(cache).length} prévisions mises en cache`);
  } catch (error) {
    console.error('Erreur lors de la mise en cache:', error);
  }
}

/**
 * Récupère les prévisions depuis le cache
 * @param {string} productSku - SKU du produit
 * @returns {Object|null} Prévisions ou null si expiré/absent
 */
export function getCachedForecast(productSku) {
  try {
    const cache = getCacheData();
    const cached = cache[productSku];

    if (!cached) {
      return null;
    }

    // Vérifier si le cache est expiré
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_DURATION) {
      console.log(`⏰ Cache expiré pour ${productSku}`);
      return null;
    }

    console.log(`✅ Prévisions récupérées du cache pour ${productSku}`);
    return cached.forecast;
  } catch (error) {
    console.error('Erreur lors de la lecture du cache:', error);
    return null;
  }
}

/**
 * Récupère toutes les prévisions du cache
 * @returns {Object} Toutes les prévisions non expirées
 */
export function getAllCachedForecasts() {
  try {
    const cache = getCacheData();
    const validForecasts = {};
    const now = Date.now();

    Object.entries(cache).forEach(([sku, data]) => {
      const age = now - data.timestamp;
      if (age <= CACHE_DURATION) {
        validForecasts[sku] = data.forecast;
      }
    });

    if (Object.keys(validForecasts).length > 0) {
      console.log(`✅ ${Object.keys(validForecasts).length} prévisions récupérées du cache`);
    }

    return validForecasts;
  } catch (error) {
    console.error('Erreur lors de la lecture du cache:', error);
    return {};
  }
}

/**
 * Vérifie si le cache est valide
 * @param {string} productSku - SKU (optionnel)
 * @returns {boolean} True si le cache est valide
 */
export function isCacheValid(productSku = null) {
  try {
    const cache = getCacheData();
    
    if (productSku) {
      const cached = cache[productSku];
      if (!cached) return false;
      
      const age = Date.now() - cached.timestamp;
      return age <= CACHE_DURATION;
    } else {
      // Vérifier si au moins un cache est valide
      return Object.values(cache).some(data => {
        const age = Date.now() - data.timestamp;
        return age <= CACHE_DURATION;
      });
    }
  } catch (error) {
    return false;
  }
}

/**
 * Invalide le cache (force un recalcul)
 * @param {string} productSku - SKU (optionnel, sinon tout le cache)
 */
export function invalidateCache(productSku = null) {
  try {
    if (productSku) {
      const cache = getCacheData();
      delete cache[productSku];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      console.log(`🗑️ Cache invalidé pour ${productSku}`);
    } else {
      localStorage.removeItem(CACHE_KEY);
      console.log(`🗑️ Tout le cache invalidé`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'invalidation du cache:', error);
  }
}

/**
 * Récupère les données du cache depuis localStorage
 * @private
 */
function getCacheData() {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Erreur lors de la lecture du cache:', error);
    return {};
  }
}

/**
 * Nettoie les caches expirés
 */
export function cleanExpiredCache() {
  try {
    const cache = getCacheData();
    const now = Date.now();
    let cleanedCount = 0;

    Object.entries(cache).forEach(([sku, data]) => {
      const age = now - data.timestamp;
      if (age > CACHE_DURATION) {
        delete cache[sku];
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      console.log(`🧹 ${cleanedCount} caches expirés nettoyés`);
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage du cache:', error);
  }
}

/**
 * Obtient des statistiques sur le cache
 * @returns {Object} Stats {totalEntries, validEntries, expiredEntries, oldestAge, newestAge}
 */
export function getCacheStats() {
  try {
    const cache = getCacheData();
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;
    let ages = [];

    Object.values(cache).forEach(data => {
      const age = now - data.timestamp;
      ages.push(age);
      
      if (age <= CACHE_DURATION) {
        validCount++;
      } else {
        expiredCount++;
      }
    });

    return {
      totalEntries: Object.keys(cache).length,
      validEntries: validCount,
      expiredEntries: expiredCount,
      oldestAge: ages.length > 0 ? Math.max(...ages) : 0,
      newestAge: ages.length > 0 ? Math.min(...ages) : 0,
      cacheHitRate: validCount / (validCount + expiredCount) || 0
    };
  } catch (error) {
    return {
      totalEntries: 0,
      validEntries: 0,
      expiredEntries: 0,
      oldestAge: 0,
      newestAge: 0,
      cacheHitRate: 0
    };
  }
}

export default {
  cacheForecast,
  cacheAllForecasts,
  getCachedForecast,
  getAllCachedForecasts,
  isCacheValid,
  invalidateCache,
  cleanExpiredCache,
  getCacheStats
};

