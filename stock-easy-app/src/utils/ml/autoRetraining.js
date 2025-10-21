/**
 * Système de réentraînement automatique et détection de drift
 * @module utils/ml/autoRetraining
 */

const RETRAINING_KEY = 'ml-retraining-schedule';
const DRIFT_KEY = 'ml-drift-detection';

/**
 * Vérifie si un réentraînement est nécessaire
 * @param {number} intervalDays - Intervalle en jours (défaut: 7)
 * @returns {boolean} True si réentraînement nécessaire
 */
export function shouldRetrain(intervalDays = 7) {
  try {
    const data = JSON.parse(localStorage.getItem(RETRAINING_KEY) || '{}');
    
    if (!data.lastTraining) {
      console.log('ℹ️ Aucun historique d\'entraînement');
      return true;
    }

    const lastTraining = new Date(data.lastTraining);
    const now = new Date();
    const daysSinceTraining = Math.floor((now - lastTraining) / (1000 * 60 * 60 * 24));

    const shouldRun = daysSinceTraining >= intervalDays;
    
    if (shouldRun) {
      console.log(`⏰ Réentraînement recommandé (${daysSinceTraining} jours depuis le dernier)`);
    }

    return shouldRun;
  } catch (error) {
    console.error('Erreur vérification réentraînement:', error);
    return false;
  }
}

/**
 * Enregistre un entraînement
 */
export function recordTraining() {
  try {
    const data = {
      lastTraining: new Date().toISOString(),
      trainingCount: (getRetrainingData().trainingCount || 0) + 1
    };

    localStorage.setItem(RETRAINING_KEY, JSON.stringify(data));
    console.log('📝 Entraînement enregistré');
  } catch (error) {
    console.error('Erreur enregistrement entraînement:', error);
  }
}

/**
 * Obtient les données de réentraînement
 */
export function getRetrainingData() {
  try {
    return JSON.parse(localStorage.getItem(RETRAINING_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

/**
 * Configure un rappel de réentraînement périodique
 * @param {Function} callback - Fonction à appeler
 * @param {number} intervalDays - Intervalle en jours
 * @returns {number} Interval ID
 */
export function scheduleAutoRetraining(callback, intervalDays = 7) {
  console.log(`⏰ Planification du réentraînement automatique tous les ${intervalDays} jours`);
  
  // Vérifier toutes les heures
  const checkInterval = setInterval(() => {
    if (shouldRetrain(intervalDays)) {
      console.log('🔄 Déclenchement du réentraînement automatique');
      callback();
    }
  }, 3600000); // 1 heure

  return checkInterval;
}

/**
 * Détecte le drift du modèle (dégradation de performance)
 * @param {Array} recentPredictions - [{predicted, actual}, ...]
 * @param {Object} previousMetrics - Métriques précédentes {mae, rmse, r2}
 * @returns {Object} {hasDrift, severity, metrics}
 */
export function detectModelDrift(recentPredictions, previousMetrics) {
  if (!recentPredictions || recentPredictions.length < 5) {
    return { hasDrift: false, severity: 'none', reason: 'Pas assez de données' };
  }

  // Calculer les métriques actuelles
  const currentMetrics = calculatePredictionMetrics(recentPredictions);

  // Si pas de métriques précédentes, sauvegarder les actuelles
  if (!previousMetrics || !previousMetrics.mae) {
    saveDriftMetrics(currentMetrics);
    return { hasDrift: false, severity: 'none', metrics: currentMetrics };
  }

  // Comparer les métriques
  const maeIncrease = ((currentMetrics.mae - previousMetrics.mae) / previousMetrics.mae) * 100;
  const rmseIncrease = ((currentMetrics.rmse - previousMetrics.rmse) / previousMetrics.rmse) * 100;
  const r2Decrease = ((previousMetrics.r2 - currentMetrics.r2) / previousMetrics.r2) * 100;

  let hasDrift = false;
  let severity = 'none';
  let reasons = [];

  // Détection de drift
  if (maeIncrease > 50) {
    hasDrift = true;
    severity = 'high';
    reasons.push(`MAE augmenté de ${maeIncrease.toFixed(0)}%`);
  } else if (maeIncrease > 25) {
    hasDrift = true;
    severity = 'medium';
    reasons.push(`MAE augmenté de ${maeIncrease.toFixed(0)}%`);
  }

  if (r2Decrease > 30) {
    hasDrift = true;
    if (severity !== 'high') severity = 'medium';
    reasons.push(`R² diminué de ${r2Decrease.toFixed(0)}%`);
  }

  if (hasDrift) {
    console.warn(`⚠️ Drift détecté (${severity}): ${reasons.join(', ')}`);
    saveDriftMetrics(currentMetrics);
  }

  return {
    hasDrift,
    severity,
    reasons: reasons.join(', '),
    metrics: currentMetrics,
    previousMetrics
  };
}

/**
 * Calcule les métriques de prédiction
 * @private
 */
function calculatePredictionMetrics(predictions) {
  const n = predictions.length;
  const actual = predictions.map(p => p.actual);
  const predicted = predictions.map(p => p.predicted);

  // MAE
  const mae = actual.reduce((sum, val, i) => 
    sum + Math.abs(val - predicted[i]), 0
  ) / n;

  // RMSE
  const mse = actual.reduce((sum, val, i) => 
    sum + Math.pow(val - predicted[i], 2), 0
  ) / n;
  const rmse = Math.sqrt(mse);

  // R²
  const meanActual = actual.reduce((a, b) => a + b, 0) / n;
  const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
  const ssResidual = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  return { mae, rmse, r2 };
}

/**
 * Sauvegarde les métriques de drift
 * @private
 */
function saveDriftMetrics(metrics) {
  try {
    const data = {
      metrics,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(DRIFT_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erreur sauvegarde métriques drift:', error);
  }
}

/**
 * Récupère les métriques de drift sauvegardées
 */
export function getSavedDriftMetrics() {
  try {
    const data = JSON.parse(localStorage.getItem(DRIFT_KEY) || '{}');
    return data.metrics || null;
  } catch (error) {
    return null;
  }
}

/**
 * Génère une notification de réentraînement
 * @param {string} reason - Raison du réentraînement
 * @returns {Object} Notification {title, message, severity, action}
 */
export function createRetrainingNotification(reason = 'périodique') {
  const reasons = {
    'périodique': {
      title: '🔄 Réentraînement Programmé',
      message: 'Il est temps de réentraîner le modèle ML pour maintenir sa précision.',
      severity: 'info'
    },
    'drift': {
      title: '⚠️ Drift Détecté',
      message: 'La performance du modèle s\'est dégradée. Réentraînement recommandé.',
      severity: 'warning'
    },
    'manuel': {
      title: 'ℹ️ Données Mises à Jour',
      message: 'De nouvelles données sont disponibles. Réentraîner pour améliorer les prévisions.',
      severity: 'info'
    }
  };

  const config = reasons[reason] || reasons['périodique'];

  return {
    id: `retrain-${Date.now()}`,
    ...config,
    action: 'retrain',
    timestamp: new Date().toISOString()
  };
}

export default {
  shouldRetrain,
  recordTraining,
  getRetrainingData,
  scheduleAutoRetraining,
  detectModelDrift,
  getSavedDriftMetrics,
  createRetrainingNotification
};

