/**
 * Utilitaire de monitoring de performance pour les calculs ML
 * @module utils/ml/performanceMonitor
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
  }

  /**
   * Démarre le monitoring d'une opération
   * @param {string} operation - Nom de l'opération
   * @returns {Function} Fonction stop() à appeler à la fin
   */
  start(operation) {
    const startTime = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    return () => {
      const endTime = performance.now();
      const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const duration = endTime - startTime;
      const memoryDelta = endMemory - startMemory;

      const metric = {
        operation,
        duration,
        memoryDelta,
        timestamp: new Date().toISOString()
      };

      this.metrics.push(metric);
      
      console.log(`⏱️  ${operation}: ${duration.toFixed(0)}ms (memory: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB)`);
      
      return metric;
    };
  }

  /**
   * Mesure une fonction async
   * @param {string} operation - Nom de l'opération
   * @param {Function} fn - Fonction à mesurer
   * @returns {Promise<*>} Résultat de la fonction
   */
  async measure(operation, fn) {
    const stop = this.start(operation);
    try {
      const result = await fn();
      stop();
      return result;
    } catch (error) {
      stop();
      throw error;
    }
  }

  /**
   * Récupère les statistiques
   * @param {string} operation - Filtrer par opération (optionnel)
   * @returns {Object} Statistiques
   */
  getStats(operation = null) {
    const filtered = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (filtered.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0 };
    }

    const durations = filtered.map(m => m.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      count: filtered.length,
      avg: Math.round(avg),
      min: Math.round(min),
      max: Math.round(max),
      total: Math.round(durations.reduce((a, b) => a + b, 0))
    };
  }

  /**
   * Affiche un rapport de performance
   * @param {string} operation - Filtrer par opération (optionnel)
   */
  printReport(operation = null) {
    const stats = this.getStats(operation);
    const title = operation ? `Performance Report: ${operation}` : 'Performance Report: All Operations';
    
    console.log(`\n📊 ${title}`);
    console.log('─────────────────────────────────────');
    console.log(`Count: ${stats.count}`);
    console.log(`Average: ${stats.avg}ms`);
    console.log(`Min: ${stats.min}ms`);
    console.log(`Max: ${stats.max}ms`);
    if (stats.count > 0) {
      console.log(`Total: ${stats.total}ms`);
    }
    console.log('─────────────────────────────────────\n');
  }

  /**
   * Réinitialise les métriques
   */
  reset() {
    this.metrics = [];
    console.log('🔄 Performance monitor reset');
  }

  /**
   * Exporte les métriques au format JSON
   * @returns {string} JSON des métriques
   */
  export() {
    return JSON.stringify(this.metrics, null, 2);
  }
}

// Export d'une instance singleton
export const performanceMonitor = new PerformanceMonitor();

