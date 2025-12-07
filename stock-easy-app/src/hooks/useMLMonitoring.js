/**
 * Hook de Monitoring ML
 * 
 * Collecte et agrège les métriques de santé du système ML
 * pour affichage dans le dashboard
 * 
 * @module hooks/useMLMonitoring
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { featureStore } from '../services/ml/featureStore';
import { mlCache } from '../services/ml/mlCache';
import { autoRetraining } from '../services/ml/autoRetraining';

// ========================================
// CONFIGURATION
// ========================================

const REFRESH_INTERVAL = 30000; // 30 secondes
const HEALTH_THRESHOLDS = {
  MAPE_EXCELLENT: 10,
  MAPE_GOOD: 15,
  MAPE_WARNING: 25,
  ACCURACY_EXCELLENT: 90,
  ACCURACY_GOOD: 80,
  ACCURACY_WARNING: 70,
  CACHE_HIT_GOOD: 70,
  CACHE_HIT_WARNING: 50
};

// ========================================
// HOOK PRINCIPAL
// ========================================

/**
 * Hook principal pour le monitoring ML
 * @param {Object} options - Options de configuration
 * @returns {Object} Métriques et fonctions de monitoring
 */
export function useMLMonitoring(options = {}) {
  const { autoRefresh = true, refreshInterval = REFRESH_INTERVAL } = options;

  const [metrics, setMetrics] = useState({
    // Performance du modèle
    mape: null,
    accuracy: null,
    lastEvaluation: null,
    
    // Feature Store
    featuresCount: 0,
    featuresCacheHits: 0,
    featuresCacheMisses: 0,
    
    // ML Cache
    cacheSize: 0,
    cacheHitRate: 0,
    
    // Auto-retraining
    retrainingStatus: 'idle',
    lastRetraining: null,
    retrainingHistory: [],
    
    // Alertes
    alerts: [],
    recommendations: [],
    
    // Métadonnées
    lastRefresh: null,
    isLoading: false,
    error: null
  });

  /**
   * Collecte toutes les métriques
   */
  const collectMetrics = useCallback(async () => {
    setMetrics(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. Métriques Auto-Retraining
      const retrainingStatus = autoRetraining.getStatus();
      const retrainingHistory = autoRetraining.getHistory();
      const recommendations = autoRetraining.getRecommendations();

      // 2. Métriques Feature Store
      const featureStats = featureStore.getStats();

      // 3. Métriques ML Cache
      const cacheStats = mlCache.getStats();

      // 4. Générer les alertes
      const alerts = generateAlerts(retrainingStatus, featureStats, cacheStats);

      // 5. Calculer la santé globale
      const healthScore = calculateHealthScore(retrainingStatus, featureStats, cacheStats);

      setMetrics({
        // Performance
        mape: retrainingStatus.currentMAPE,
        accuracy: retrainingStatus.currentAccuracy,
        lastEvaluation: retrainingStatus.lastEvaluation,
        
        // Feature Store
        featuresCount: featureStats.size || 0,
        featuresCacheHits: featureStats.hits || 0,
        featuresCacheMisses: featureStats.misses || 0,
        featuresHitRate: featureStats.hitRate || '0%',
        
        // ML Cache
        cacheSize: cacheStats.size || 0,
        cacheHitRate: parseFloat(cacheStats.hitRate) || 0,
        cacheHits: cacheStats.hits || 0,
        cacheMisses: cacheStats.misses || 0,
        
        // Auto-retraining
        retrainingStatus: retrainingStatus.status,
        isRetrainingEnabled: retrainingStatus.isEnabled,
        lastRetraining: retrainingStatus.lastRetraining,
        needsRetraining: retrainingStatus.needsRetraining,
        canRetrain: retrainingStatus.canRetrain,
        retrainingHistory: retrainingHistory.slice(-10),
        
        // Alertes & Recommandations
        alerts,
        recommendations,
        
        // Santé globale
        healthScore,
        healthStatus: getHealthStatus(healthScore),
        
        // Métadonnées
        lastRefresh: Date.now(),
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ MLMonitoring: Error collecting metrics', error);
      setMetrics(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  }, []);

  /**
   * Auto-refresh
   */
  useEffect(() => {
    // Collecte initiale
    collectMetrics();

    // Auto-refresh si activé
    if (autoRefresh) {
      const interval = setInterval(collectMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, collectMetrics]);

  /**
   * Déclenche une évaluation manuelle
   */
  const triggerEvaluation = useCallback(async (model, salesHistory) => {
    setMetrics(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await autoRetraining.evaluateModel(model, salesHistory);
      await collectMetrics();
      return result;
    } catch (error) {
      setMetrics(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  }, [collectMetrics]);

  /**
   * Déclenche un réentraînement manuel
   */
  const triggerRetraining = useCallback(async (model, salesHistory, options = {}) => {
    setMetrics(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await autoRetraining.retrain(model, salesHistory, { 
        force: true, 
        ...options 
      });
      await collectMetrics();
      return result;
    } catch (error) {
      setMetrics(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  }, [collectMetrics]);

  /**
   * Vide tous les caches
   */
  const clearAllCaches = useCallback(() => {
    mlCache.clear();
    featureStore.clear();
    collectMetrics();
  }, [collectMetrics]);

  return {
    metrics,
    refresh: collectMetrics,
    triggerEvaluation,
    triggerRetraining,
    clearAllCaches,
    isHealthy: metrics.healthScore >= 70
  };
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Génère les alertes basées sur les métriques
 */
function generateAlerts(retrainingStatus, featureStats, cacheStats) {
  const alerts = [];

  // Alerte MAPE élevé
  if (retrainingStatus.currentMAPE && retrainingStatus.currentMAPE > HEALTH_THRESHOLDS.MAPE_WARNING) {
    alerts.push({
      id: 'high_mape',
      type: 'error',
      title: 'Performance dégradée',
      message: `MAPE à ${retrainingStatus.currentMAPE}% (seuil: ${HEALTH_THRESHOLDS.MAPE_WARNING}%)`,
      action: 'retraining',
      priority: 1
    });
  } else if (retrainingStatus.currentMAPE && retrainingStatus.currentMAPE > HEALTH_THRESHOLDS.MAPE_GOOD) {
    alerts.push({
      id: 'moderate_mape',
      type: 'warning',
      title: 'Performance à surveiller',
      message: `MAPE à ${retrainingStatus.currentMAPE}%`,
      priority: 2
    });
  }

  // Alerte pas d'évaluation récente
  if (!retrainingStatus.lastEvaluation) {
    alerts.push({
      id: 'no_evaluation',
      type: 'warning',
      title: 'Évaluation nécessaire',
      message: 'Aucune évaluation du modèle effectuée',
      action: 'evaluate',
      priority: 1
    });
  } else {
    const hoursSinceEval = (Date.now() - retrainingStatus.lastEvaluation) / (1000 * 60 * 60);
    if (hoursSinceEval > 48) {
      alerts.push({
        id: 'old_evaluation',
        type: 'info',
        title: 'Évaluation ancienne',
        message: `Dernière évaluation il y a ${Math.round(hoursSinceEval)}h`,
        action: 'evaluate',
        priority: 3
      });
    }
  }

  // Alerte réentraînement disponible
  if (retrainingStatus.needsRetraining && retrainingStatus.canRetrain) {
    alerts.push({
      id: 'retraining_available',
      type: 'info',
      title: 'Réentraînement disponible',
      message: 'Le modèle peut être amélioré',
      action: 'retraining',
      priority: 2
    });
  }

  // Alerte cache inefficace
  const cacheHitRate = parseFloat(cacheStats.hitRate) || 0;
  if (cacheStats.hits + cacheStats.misses > 10 && cacheHitRate < HEALTH_THRESHOLDS.CACHE_HIT_WARNING) {
    alerts.push({
      id: 'low_cache_hit',
      type: 'warning',
      title: 'Cache peu efficace',
      message: `Taux de cache: ${cacheHitRate}%`,
      priority: 3
    });
  }

  // Trier par priorité
  return alerts.sort((a, b) => a.priority - b.priority);
}

/**
 * Calcule le score de santé global (0-100)
 */
function calculateHealthScore(retrainingStatus, featureStats, cacheStats) {
  let score = 100;
  
  // Pénalité MAPE (max -40 points)
  if (retrainingStatus.currentMAPE) {
    if (retrainingStatus.currentMAPE > HEALTH_THRESHOLDS.MAPE_WARNING) {
      score -= 40;
    } else if (retrainingStatus.currentMAPE > HEALTH_THRESHOLDS.MAPE_GOOD) {
      score -= 20;
    } else if (retrainingStatus.currentMAPE > HEALTH_THRESHOLDS.MAPE_EXCELLENT) {
      score -= 10;
    }
  } else {
    // Pas d'évaluation = pénalité
    score -= 20;
  }

  // Bonus/Pénalité cache (max ±15 points)
  const cacheHitRate = parseFloat(cacheStats.hitRate) || 0;
  if (cacheHitRate >= HEALTH_THRESHOLDS.CACHE_HIT_GOOD) {
    score += 5;
  } else if (cacheHitRate < HEALTH_THRESHOLDS.CACHE_HIT_WARNING) {
    score -= 15;
  }

  // Pénalité réentraînement nécessaire (-10 points)
  if (retrainingStatus.needsRetraining) {
    score -= 10;
  }

  // Bonus features calculées
  if (featureStats.size > 0) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Détermine le statut de santé
 */
function getHealthStatus(score) {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

// ========================================
// HOOKS SPÉCIALISÉS
// ========================================

/**
 * Hook pour les alertes ML uniquement
 */
export function useMLAlerts() {
  const { metrics } = useMLMonitoring({ autoRefresh: true });
  
  return useMemo(() => ({
    alerts: metrics.alerts,
    recommendations: metrics.recommendations,
    hasAlerts: metrics.alerts.length > 0,
    criticalCount: metrics.alerts.filter(a => a.type === 'error').length,
    warningCount: metrics.alerts.filter(a => a.type === 'warning').length
  }), [metrics.alerts, metrics.recommendations]);
}

/**
 * Hook pour le statut de santé uniquement
 */
export function useMLHealth() {
  const { metrics, isHealthy } = useMLMonitoring({ autoRefresh: true });
  
  return useMemo(() => ({
    score: metrics.healthScore,
    status: metrics.healthStatus,
    isHealthy,
    mape: metrics.mape,
    accuracy: metrics.accuracy
  }), [metrics.healthScore, metrics.healthStatus, isHealthy, metrics.mape, metrics.accuracy]);
}

/**
 * Hook pour les statistiques de cache
 */
export function useMLCacheStats() {
  const { metrics } = useMLMonitoring({ autoRefresh: true });
  
  return useMemo(() => ({
    mlCache: {
      size: metrics.cacheSize,
      hitRate: metrics.cacheHitRate,
      hits: metrics.cacheHits,
      misses: metrics.cacheMisses
    },
    featureStore: {
      size: metrics.featuresCount,
      hitRate: metrics.featuresHitRate,
      hits: metrics.featuresCacheHits,
      misses: metrics.featuresCacheMisses
    }
  }), [metrics]);
}

export default useMLMonitoring;

