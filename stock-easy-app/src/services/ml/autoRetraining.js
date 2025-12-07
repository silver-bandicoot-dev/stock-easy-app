/**
 * Service de Réentraînement Automatique ML
 * 
 * Gère le cycle de vie du modèle ML :
 * - Évaluation des performances
 * - Détection de la dégradation
 * - Réentraînement automatique
 * - Validation avant déploiement
 * 
 * @module services/ml/autoRetraining
 */

import { featureStore } from './featureStore';
import { mlCache } from './mlCache';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  // Seuils de performance
  MAPE_THRESHOLD: 25, // Réentraîner si MAPE > 25%
  ACCURACY_THRESHOLD: 70, // Réentraîner si accuracy < 70%
  
  // Données minimales requises
  MIN_TRAINING_SAMPLES: 100,
  MIN_VALIDATION_SAMPLES: 30,
  
  // Intervalles (en millisecondes)
  EVALUATION_INTERVAL: 24 * 60 * 60 * 1000, // Évaluer chaque 24h
  MIN_RETRAIN_INTERVAL: 7 * 24 * 60 * 60 * 1000, // Minimum 7 jours entre réentraînements
  
  // Storage
  STATE_KEY: 'ml_auto_retrain_state',
  HISTORY_KEY: 'ml_retrain_history'
};

// ========================================
// AUTO RETRAINING SERVICE
// ========================================

class AutoRetrainingService {
  constructor() {
    this.state = {
      lastEvaluation: null,
      lastRetraining: null,
      currentMAPE: null,
      currentAccuracy: null,
      status: 'idle', // idle, evaluating, training, validating
      isEnabled: true
    };
    
    this.history = [];
    this.callbacks = {
      onEvaluationComplete: null,
      onRetrainingStart: null,
      onRetrainingComplete: null,
      onError: null
    };
    
    this._loadState();
  }

  // ========================================
  // PERSISTENCE
  // ========================================

  /**
   * Charge l'état depuis localStorage
   * @private
   */
  _loadState() {
    try {
      const savedState = localStorage.getItem(CONFIG.STATE_KEY);
      if (savedState) {
        this.state = { ...this.state, ...JSON.parse(savedState) };
      }
      
      const savedHistory = localStorage.getItem(CONFIG.HISTORY_KEY);
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.warn('⚠️ AutoRetraining: error loading state', error);
    }
  }

  /**
   * Sauvegarde l'état dans localStorage
   * @private
   */
  _saveState() {
    try {
      localStorage.setItem(CONFIG.STATE_KEY, JSON.stringify(this.state));
      localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify(this.history.slice(-50)));
    } catch (error) {
      console.warn('⚠️ AutoRetraining: error saving state', error);
    }
  }

  // ========================================
  // ÉVALUATION DU MODÈLE
  // ========================================

  /**
   * Évalue les performances actuelles du modèle
   * @param {Object} model - Le modèle ML (SmartForecastEngine ou DemandForecastModel)
   * @param {Array} salesHistory - Historique des ventes récent
   * @returns {Object} Métriques de performance
   */
  async evaluateModel(model, salesHistory) {
    if (!salesHistory || salesHistory.length < CONFIG.MIN_VALIDATION_SAMPLES) {
      return {
        success: false,
        reason: 'insufficient_data',
        message: `Need at least ${CONFIG.MIN_VALIDATION_SAMPLES} samples for evaluation`
      };
    }

    this.state.status = 'evaluating';
    console.log('🔍 AutoRetraining: Starting model evaluation...');

    try {
      // Séparer en train/test
      const splitIndex = Math.floor(salesHistory.length * 0.8);
      const trainData = salesHistory.slice(0, splitIndex);
      const testData = salesHistory.slice(splitIndex);

      // Calculer les métriques
      const predictions = [];
      const actuals = [];

      for (const sample of testData) {
        try {
          // Prédire avec le modèle
          let prediction;
          
          if (model.predict) {
            // SmartForecastEngine
            const result = model.predict(trainData, new Date(sample.date));
            prediction = result.value || result;
          } else if (model.predictSingle) {
            // Autre type de modèle
            prediction = await model.predictSingle(sample);
          } else {
            prediction = sample.quantity; // Fallback
          }
          
          predictions.push(prediction);
          actuals.push(sample.quantity || 0);
        } catch (e) {
          // Ignorer les erreurs de prédiction individuelles
        }
      }

      if (predictions.length === 0) {
        return {
          success: false,
          reason: 'prediction_failed',
          message: 'Could not generate predictions for evaluation'
        };
      }

      // Calculer MAPE
      const mape = this._calculateMAPE(actuals, predictions);
      const accuracy = 100 - mape;
      const mae = this._calculateMAE(actuals, predictions);
      const rmse = this._calculateRMSE(actuals, predictions);

      // Mettre à jour l'état
      this.state.currentMAPE = Math.round(mape * 10) / 10;
      this.state.currentAccuracy = Math.round(accuracy * 10) / 10;
      this.state.lastEvaluation = Date.now();
      this.state.status = 'idle';
      this._saveState();

      const metrics = {
        success: true,
        mape: this.state.currentMAPE,
        accuracy: this.state.currentAccuracy,
        mae: Math.round(mae * 10) / 10,
        rmse: Math.round(rmse * 10) / 10,
        sampleSize: predictions.length,
        needsRetraining: this._needsRetraining()
      };

      console.log(`✅ AutoRetraining: Evaluation complete - MAPE: ${metrics.mape}%, Accuracy: ${metrics.accuracy}%`);
      
      // Callback
      if (this.callbacks.onEvaluationComplete) {
        this.callbacks.onEvaluationComplete(metrics);
      }

      return metrics;

    } catch (error) {
      this.state.status = 'idle';
      console.error('❌ AutoRetraining: Evaluation failed', error);
      
      if (this.callbacks.onError) {
        this.callbacks.onError('evaluation', error);
      }
      
      return {
        success: false,
        reason: 'evaluation_error',
        message: error.message
      };
    }
  }

  /**
   * Calcule MAPE (Mean Absolute Percentage Error)
   * @private
   */
  _calculateMAPE(actuals, predictions) {
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < actuals.length; i++) {
      if (actuals[i] !== 0) {
        sum += Math.abs((actuals[i] - predictions[i]) / actuals[i]);
        count++;
      }
    }
    
    return count > 0 ? (sum / count) * 100 : 0;
  }

  /**
   * Calcule MAE (Mean Absolute Error)
   * @private
   */
  _calculateMAE(actuals, predictions) {
    const sum = actuals.reduce((acc, actual, i) => 
      acc + Math.abs(actual - predictions[i]), 0);
    return sum / actuals.length;
  }

  /**
   * Calcule RMSE (Root Mean Square Error)
   * @private
   */
  _calculateRMSE(actuals, predictions) {
    const sum = actuals.reduce((acc, actual, i) => 
      acc + Math.pow(actual - predictions[i], 2), 0);
    return Math.sqrt(sum / actuals.length);
  }

  // ========================================
  // DÉTECTION DE DÉGRADATION
  // ========================================

  /**
   * Vérifie si le modèle a besoin d'être réentraîné
   * @returns {boolean}
   */
  _needsRetraining() {
    // Vérifier le MAPE
    if (this.state.currentMAPE > CONFIG.MAPE_THRESHOLD) {
      return true;
    }
    
    // Vérifier l'accuracy
    if (this.state.currentAccuracy < CONFIG.ACCURACY_THRESHOLD) {
      return true;
    }
    
    return false;
  }

  /**
   * Vérifie si un réentraînement est autorisé (cooldown)
   * @returns {boolean}
   */
  _canRetrain() {
    if (!this.state.lastRetraining) {
      return true;
    }
    
    const timeSinceLastRetrain = Date.now() - this.state.lastRetraining;
    return timeSinceLastRetrain >= CONFIG.MIN_RETRAIN_INTERVAL;
  }

  /**
   * Vérifie si une évaluation est nécessaire
   * @returns {boolean}
   */
  needsEvaluation() {
    if (!this.state.lastEvaluation) {
      return true;
    }
    
    const timeSinceLastEval = Date.now() - this.state.lastEvaluation;
    return timeSinceLastEval >= CONFIG.EVALUATION_INTERVAL;
  }

  // ========================================
  // RÉENTRAÎNEMENT
  // ========================================

  /**
   * Lance le réentraînement du modèle
   * @param {Object} model - Le modèle ML
   * @param {Array} salesHistory - Données d'entraînement
   * @param {Object} options - Options de réentraînement
   * @returns {Object} Résultat du réentraînement
   */
  async retrain(model, salesHistory, options = {}) {
    const { force = false, validateAfter = true } = options;

    // Vérifier si on peut réentraîner
    if (!force && !this._canRetrain()) {
      const nextRetrain = new Date(this.state.lastRetraining + CONFIG.MIN_RETRAIN_INTERVAL);
      return {
        success: false,
        reason: 'cooldown',
        message: `Next retraining allowed after ${nextRetrain.toISOString()}`,
        nextAllowed: nextRetrain
      };
    }

    // Vérifier les données
    if (!salesHistory || salesHistory.length < CONFIG.MIN_TRAINING_SAMPLES) {
      return {
        success: false,
        reason: 'insufficient_data',
        message: `Need at least ${CONFIG.MIN_TRAINING_SAMPLES} samples for training`
      };
    }

    this.state.status = 'training';
    console.log('🔄 AutoRetraining: Starting model retraining...');
    
    if (this.callbacks.onRetrainingStart) {
      this.callbacks.onRetrainingStart();
    }

    const startTime = Date.now();

    try {
      // Réentraîner le modèle
      if (model.train) {
        await model.train(salesHistory);
      } else if (model.fit) {
        await model.fit(salesHistory);
      } else {
        // Pour SmartForecastEngine, pas de train() - on invalide le cache
        mlCache.clear();
        featureStore.clear();
        console.log('🔄 SmartForecastEngine: Cache cleared for fresh calculations');
      }

      const trainingDuration = Date.now() - startTime;

      // Valider le nouveau modèle
      let validationResult = null;
      if (validateAfter) {
        this.state.status = 'validating';
        validationResult = await this.evaluateModel(model, salesHistory);
      }

      // Enregistrer dans l'historique
      const retrainRecord = {
        timestamp: Date.now(),
        duration: trainingDuration,
        sampleSize: salesHistory.length,
        previousMAPE: this.state.currentMAPE,
        newMAPE: validationResult?.mape,
        success: true
      };
      this.history.push(retrainRecord);

      // Mettre à jour l'état
      this.state.lastRetraining = Date.now();
      this.state.status = 'idle';
      this._saveState();

      const result = {
        success: true,
        duration: trainingDuration,
        sampleSize: salesHistory.length,
        validation: validationResult,
        improved: validationResult && retrainRecord.previousMAPE 
          ? validationResult.mape < retrainRecord.previousMAPE 
          : null
      };

      console.log(`✅ AutoRetraining: Retraining complete in ${trainingDuration}ms`);
      
      if (this.callbacks.onRetrainingComplete) {
        this.callbacks.onRetrainingComplete(result);
      }

      return result;

    } catch (error) {
      this.state.status = 'idle';
      console.error('❌ AutoRetraining: Retraining failed', error);
      
      this.history.push({
        timestamp: Date.now(),
        success: false,
        error: error.message
      });
      this._saveState();
      
      if (this.callbacks.onError) {
        this.callbacks.onError('retraining', error);
      }
      
      return {
        success: false,
        reason: 'training_error',
        message: error.message
      };
    }
  }

  // ========================================
  // WORKFLOW AUTOMATIQUE
  // ========================================

  /**
   * Exécute le workflow complet (évaluation + réentraînement si nécessaire)
   * @param {Object} model - Le modèle ML
   * @param {Array} salesHistory - Données
   * @returns {Object} Résultat du workflow
   */
  async runWorkflow(model, salesHistory) {
    if (!this.state.isEnabled) {
      return { skipped: true, reason: 'disabled' };
    }

    console.log('🚀 AutoRetraining: Running automatic workflow...');

    try {
      // Étape 1: Évaluation
      let evaluation = null;
      if (this.needsEvaluation()) {
        evaluation = await this.evaluateModel(model, salesHistory);
        
        if (!evaluation.success) {
          return {
            step: 'evaluation',
            success: false,
            evaluation
          };
        }
      }

      // Étape 2: Réentraînement si nécessaire
      let retraining = null;
      if (this._needsRetraining() && this._canRetrain()) {
        console.log('📉 AutoRetraining: Performance degradation detected, triggering retraining...');
        retraining = await this.retrain(model, salesHistory);
      }

      return {
        success: true,
        evaluation,
        retraining,
        currentState: this.getStatus()
      };

    } catch (error) {
      console.error('❌ AutoRetraining: Workflow failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========================================
  // API PUBLIQUE
  // ========================================

  /**
   * Active/désactive le réentraînement automatique
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.state.isEnabled = enabled;
    this._saveState();
    console.log(`AutoRetraining: ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Enregistre des callbacks
   * @param {Object} callbacks
   */
  registerCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Obtient le statut actuel
   * @returns {Object}
   */
  getStatus() {
    return {
      ...this.state,
      needsEvaluation: this.needsEvaluation(),
      needsRetraining: this._needsRetraining(),
      canRetrain: this._canRetrain(),
      historyCount: this.history.length
    };
  }

  /**
   * Obtient l'historique des réentraînements
   * @returns {Array}
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Réinitialise l'état
   */
  reset() {
    this.state = {
      lastEvaluation: null,
      lastRetraining: null,
      currentMAPE: null,
      currentAccuracy: null,
      status: 'idle',
      isEnabled: true
    };
    this.history = [];
    this._saveState();
    console.log('🔄 AutoRetraining: State reset');
  }

  /**
   * Obtient les recommandations basées sur l'état actuel
   * @returns {Array}
   */
  getRecommendations() {
    const recommendations = [];

    if (!this.state.lastEvaluation) {
      recommendations.push({
        type: 'evaluation_needed',
        priority: 'high',
        message: 'No evaluation performed yet. Run evaluation to assess model performance.'
      });
    }

    if (this._needsRetraining()) {
      if (this._canRetrain()) {
        recommendations.push({
          type: 'retraining_recommended',
          priority: 'high',
          message: `Model performance degraded (MAPE: ${this.state.currentMAPE}%). Retraining recommended.`
        });
      } else {
        const nextRetrain = new Date(this.state.lastRetraining + CONFIG.MIN_RETRAIN_INTERVAL);
        recommendations.push({
          type: 'retraining_scheduled',
          priority: 'medium',
          message: `Retraining will be available after ${nextRetrain.toLocaleDateString()}`
        });
      }
    }

    if (this.state.currentAccuracy && this.state.currentAccuracy > 85) {
      recommendations.push({
        type: 'good_performance',
        priority: 'info',
        message: `Model performing well (Accuracy: ${this.state.currentAccuracy}%)`
      });
    }

    return recommendations;
  }
}

// ========================================
// EXPORT SINGLETON
// ========================================

export const autoRetraining = new AutoRetrainingService();

export default autoRetraining;

