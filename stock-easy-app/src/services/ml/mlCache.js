/**
 * Système de cache pour les calculs ML
 * Améliore drastiquement les performances en évitant les recalculs
 * @module services/ml/mlCache
 */

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes par défaut
const MAX_CACHE_SIZE = 100; // Maximum 100 entrées en cache

class MLCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      clears: 0
    };
  }

  /**
   * Génère une clé de cache à partir des paramètres
   * @param {string} operation - Type d'opération (ex: 'revenue', 'forecast')
   * @param {Object} params - Paramètres de l'opération
   * @returns {string} Clé de cache
   */
  generateKey(operation, params) {
    // Créer une clé stable à partir des paramètres
    const keyParts = [operation];
    
    if (params.products) {
      // Utiliser les SKUs pour identifier les produits
      const skus = Array.isArray(params.products) 
        ? params.products.map(p => p.sku || p.id).sort().join(',')
        : 'no-products';
      keyParts.push(`products:${skus}`);
    }
    
    if (params.forecastDays) {
      keyParts.push(`days:${params.forecastDays}`);
    }
    
    if (params.useMLPredictions !== undefined) {
      keyParts.push(`ml:${params.useMLPredictions}`);
    }
    
    if (params.useSeasonality !== undefined) {
      keyParts.push(`season:${params.useSeasonality}`);
    }
    
    // Hash simple pour éviter les clés trop longues
    const keyString = keyParts.join('|');
    return this.hashString(keyString);
  }

  /**
   * Hash simple d'une string
   * @private
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `ml_${Math.abs(hash)}`;
  }

  /**
   * Récupère une valeur du cache
   * @param {string} key - Clé de cache
   * @returns {Object|null} Valeur en cache ou null
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Vérifier l'expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Stocke une valeur dans le cache
   * @param {string} key - Clé de cache
   * @param {*} value - Valeur à stocker
   * @param {number} ttl - Time to live en millisecondes
   */
  set(key, value, ttl = DEFAULT_TTL) {
    // Nettoyer le cache si trop plein
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.cleanup();
    }
    
    const entry = {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    };
    
    this.cache.set(key, entry);
    this.stats.sets++;
  }

  /**
   * Nettoie le cache (supprime les entrées expirées et les plus anciennes)
   * @private
   */
  cleanup() {
    const now = Date.now();
    const expired = [];
    const entries = [];
    
    // Identifier les entrées expirées et collecter les autres
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expired.push(key);
      } else {
        entries.push({ key, createdAt: entry.createdAt });
      }
    }
    
    // Supprimer les expirées
    expired.forEach(key => this.cache.delete(key));
    
    // Si toujours trop plein, supprimer les plus anciennes
    if (this.cache.size >= MAX_CACHE_SIZE) {
      entries.sort((a, b) => a.createdAt - b.createdAt);
      const toRemove = entries.slice(0, this.cache.size - MAX_CACHE_SIZE + 10);
      toRemove.forEach(({ key }) => this.cache.delete(key));
    }
  }

  /**
   * Vide complètement le cache
   */
  clear() {
    this.cache.clear();
    this.stats.clears++;
    console.log('🗑️ Cache ML vidé');
  }

  /**
   * Supprime une entrée spécifique
   * @param {string} key - Clé à supprimer
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Récupère les statistiques du cache
   * @returns {Object} Statistiques
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(1) : 0;
    
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      sets: this.stats.sets,
      clears: this.stats.clears,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Wrapper pour une fonction avec cache automatique
   * @param {string} operation - Type d'opération
   * @param {Function} fn - Fonction à wrapper
   * @param {Object} params - Paramètres pour la fonction et le cache
   * @param {number} ttl - Time to live en millisecondes
   * @returns {Promise<*>} Résultat de la fonction (depuis cache ou calcul)
   */
  async cached(operation, fn, params = {}, ttl = DEFAULT_TTL) {
    const key = this.generateKey(operation, params);
    const cached = this.get(key);
    
    if (cached !== null) {
      console.log(`✅ Cache hit for ${operation}`);
      return cached;
    }
    
    console.log(`🔄 Cache miss for ${operation}, calculating...`);
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.set(key, result, ttl);
      console.log(`✅ ${operation} calculated in ${duration.toFixed(0)}ms`);
      
      return result;
    } catch (error) {
      console.error(`❌ Error in cached ${operation}:`, error);
      throw error;
    }
  }
}

// Export d'une instance singleton
export const mlCache = new MLCache();

