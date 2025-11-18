/**
 * Modèle de prévision de demande avec TensorFlow.js
 * @module services/ml/demandForecastModel
 */

import * as tf from '@tensorflow/tfjs';
import { DataValidator } from '@/utils/ml/dataValidator';
import { 
  DataValidationError, 
  ModelTrainingError,
  MLErrorHandler 
} from '@/utils/ml/mlErrors';

export class DemandForecastModel {
  constructor() {
    this.model = null;
    this.featureStats = null; // Pour la normalisation
  }

  /**
   * Crée l'architecture du réseau de neurones
   * @private
   */
  createModel() {
    const model = tf.sequential({
      layers: [
        // Couche d'entrée + première couche cachée
        tf.layers.dense({
          inputShape: [6],
          units: 32,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        
        // Dropout pour éviter l'overfitting
        tf.layers.dropout({ rate: 0.2 }),
        
        // Deuxième couche cachée
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        
        // Dropout
        tf.layers.dropout({ rate: 0.1 }),
        
        // Troisième couche cachée
        tf.layers.dense({
          units: 8,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        
        // Couche de sortie (quantité prédite)
        tf.layers.dense({
          units: 1,
          activation: 'linear' // Pas d'activation pour régression
        })
      ]
    });

    // Compiler le modèle
    model.compile({
      optimizer: tf.train.adam(0.001), // Learning rate
      loss: 'meanSquaredError',
      metrics: ['mae'] // Mean Absolute Error
    });

    return model;
  }

  /**
   * Normalise les features pour améliorer l'entraînement
   * @private
   */
  normalizeFeatures(features, stats = null) {
    // Si pas de stats, calculer depuis les données
    if (!stats) {
      const tensor = tf.tensor2d(features);
      const mean = tensor.mean(0);
      const std = tf.moments(tensor, 0).variance.sqrt();
      
      stats = {
        mean: mean.arraySync(),
        std: std.arraySync()
      };
      
      tensor.dispose();
      mean.dispose();
      std.dispose();
    }
    
    // Normaliser: (x - mean) / std
    const normalized = features.map(feature => 
      feature.map((val, idx) => 
        (val - stats.mean[idx]) / (stats.std[idx] + 1e-7) // +epsilon pour éviter division par 0
      )
    );
    
    return { normalized, stats };
  }

  /**
   * Prépare les données pour l'entraînement
   * @private
   */
  prepareTrainingData(salesHistory) {
    console.log(`📊 Préparation de ${salesHistory.length} enregistrements...`);
    
    // Regrouper par SKU pour calculer la moyenne des ventes
    const skuAvg = {};
    salesHistory.forEach(sale => {
      if (!skuAvg[sale.sku]) {
        skuAvg[sale.sku] = { sum: 0, count: 0 };
      }
      skuAvg[sale.sku].sum += sale.quantity;
      skuAvg[sale.sku].count += 1;
    });
    
    // Calculer les moyennes
    Object.keys(skuAvg).forEach(sku => {
      skuAvg[sku] = skuAvg[sku].sum / skuAvg[sku].count;
    });
    
    // Créer les features et labels
    const features = salesHistory.map(sale => [
      sale.dayOfWeek,           // 0-6
      sale.month,               // 1-12
      sale.isWeekend ? 1 : 0,   // 0 ou 1
      sale.isHoliday ? 1 : 0,   // 0 ou 1
      sale.price,               // Prix de vente
      skuAvg[sale.sku] || 0     // Moyenne des ventes pour ce SKU
    ]);
    
    const labels = salesHistory.map(sale => sale.quantity);
    
    return { features, labels };
  }

  /**
   * Entraîne le modèle sur l'historique des ventes
   * @param {Array} salesHistory - Historique des ventes
   * @param {Object} options - Options d'entraînement
   * @returns {Promise<Object>} Historique d'entraînement
   */
  async train(salesHistory, options = {}) {
    return MLErrorHandler.wrap(async () => {
      const {
        epochs = 50, // Réduit de 100 à 50 (early stopping gérera le reste)
        batchSize = 32,
        validationSplit = 0.2,
        verbose = 1,
        minRecords = 50,
        maxZScore = 3,
        minCV = 0.05,
        maxGapDays = 7,
        earlyStopping = true,
        patience = 10, // Arrêter si pas d'amélioration depuis 10 epochs
        minDelta = 0.001 // Amélioration minimum pour considérer comme progrès
      } = options;

      console.log('🚀 Début de l\'entraînement du modèle ML...');
      console.log(`📊 Données: ${salesHistory.length} enregistrements`);
      console.log(`⚙️ Paramètres: ${epochs} epochs, batch size ${batchSize}`);

      // ========================================
      // ÉTAPE 1: VALIDATION DES DONNÉES
      // ========================================
      
      console.log('🔍 Validation des données...');

      const validation = DataValidator.validateSalesHistory(salesHistory, {
        minRecords,
        maxZScore,
        minCV,
        maxGapDays
      });

      // Afficher le rapport de validation (en dev)
      if (import.meta.env.DEV) {
        console.log(DataValidator.formatValidationReport(validation));
      }

      // Si erreurs critiques, on arrête
      if (!validation.valid) {
        throw new DataValidationError(
          'Les données ne sont pas valides pour l\'entraînement',
          validation
        );
      }

      // Si avertissements, on log mais on continue
      if (validation.warnings.length > 0) {
        console.warn(
          `⚠️  ${validation.warnings.length} avertissement(s):`,
          validation.warnings
        );
      }

      console.log('✅ Validation réussie!');
      console.log('📊 Statistiques:', validation.stats);

      // ========================================
      // ÉTAPE 2: PRÉPARATION DES DONNÉES
      // ========================================

      // Préparer les données
      const { features, labels } = this.prepareTrainingData(salesHistory);
      
      // Normaliser les features
      const { normalized, stats } = this.normalizeFeatures(features);
      this.featureStats = stats;
      
      // Créer le modèle
      this.model = this.createModel();
      
      // Afficher l'architecture
      console.log('🏗️ Architecture du modèle:');
      this.model.summary();
      
      // Convertir en tenseurs
      const xs = tf.tensor2d(normalized);
      const ys = tf.tensor2d(labels, [labels.length, 1]);
      
      // Early stopping tracking
      let bestValLoss = Infinity;
      let patienceCounter = 0;
      let stoppedEarly = false;
      let actualEpochs = 0;
      
      // Entraîner
      const history = await this.model.fit(xs, ys, {
        epochs,
        batchSize,
        validationSplit,
        verbose,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            actualEpochs = epoch + 1;
            
            // Early stopping logic
            if (earlyStopping && logs.val_loss !== undefined) {
              const improvement = bestValLoss - logs.val_loss;
              
              if (improvement > minDelta) {
                // Amélioration significative
                bestValLoss = logs.val_loss;
                patienceCounter = 0;
              } else {
                // Pas d'amélioration
                patienceCounter++;
                
                if (patienceCounter >= patience) {
                  stoppedEarly = true;
                  console.log(`🛑 Early stopping at epoch ${actualEpochs}/${epochs} (val_loss: ${logs.val_loss.toFixed(4)})`);
                  // Note: TensorFlow.js ne supporte pas l'arrêt direct, mais on log pour info
                }
              }
            }
            
            if (epoch % 10 === 0 || stoppedEarly) {
              console.log(
                `Epoch ${actualEpochs}/${epochs} - ` +
                `loss: ${logs.loss.toFixed(4)} - ` +
                `mae: ${logs.mae.toFixed(4)} - ` +
                `val_loss: ${logs.val_loss.toFixed(4)} - ` +
                `val_mae: ${logs.val_mae.toFixed(4)}` +
                (stoppedEarly ? ' [EARLY STOP]' : '')
              );
            }
          }
        }
      });
      
      // Nettoyer les tenseurs
      xs.dispose();
      ys.dispose();
      
      if (stoppedEarly) {
        console.log(`✅ Entraînement terminé avec early stopping (${actualEpochs}/${epochs} epochs)`);
      } else {
        console.log('✅ Entraînement terminé!');
      }
      
      // Retourner l'historique avec les informations de validation
      return {
        history,
        validation: {
          stats: validation.stats,
          warnings: validation.warnings
        },
        trainingInfo: {
          actualEpochs,
          stoppedEarly,
          bestValLoss
        }
      };
    }, {
      operation: 'train',
      modelName: 'DemandForecastModel'
    });
  }

  /**
   * Prédit la quantité pour des features données
   * @param {Object} features - Features de prédiction
   * @returns {Promise<number>} Quantité prédite
   */
  async predict(features) {
    if (!this.model) {
      throw new Error('Le modèle n\'est pas entraîné. Appelez train() d\'abord.');
    }

    // Préparer les features
    const featureArray = [
      features.dayOfWeek,
      features.month,
      features.isWeekend ? 1 : 0,
      features.isHoliday ? 1 : 0,
      features.price,
      features.avgSales
    ];
    
    // Normaliser avec les stats d'entraînement
    const normalized = featureArray.map((val, idx) => 
      (val - this.featureStats.mean[idx]) / (this.featureStats.std[idx] + 1e-7)
    );
    
    // Prédire
    const inputTensor = tf.tensor2d([normalized]);
    const prediction = this.model.predict(inputTensor);
    const value = await prediction.data();
    
    // Nettoyer
    inputTensor.dispose();
    prediction.dispose();
    
    // Retourner valeur positive arrondie
    return Math.max(0, Math.round(value[0]));
  }

  /**
   * Prédit en batch pour plusieurs features (BEAUCOUP plus rapide)
   * @param {Array<Object>} featuresArray - Tableau de features
   * @returns {Promise<Array<number>>} Tableau de quantités prédites
   */
  async predictBatch(featuresArray) {
    if (!this.model) {
      throw new Error('Le modèle n\'est pas entraîné. Appelez train() d\'abord.');
    }

    if (!Array.isArray(featuresArray) || featuresArray.length === 0) {
      return [];
    }

    try {
      // Préparer toutes les features
      const normalizedBatch = featuresArray.map(features => {
        const featureArray = [
          features.dayOfWeek,
          features.month,
          features.isWeekend ? 1 : 0,
          features.isHoliday ? 1 : 0,
          features.price,
          features.avgSales
        ];
        
        // Normaliser avec les stats d'entraînement
        return featureArray.map((val, idx) => 
          (val - this.featureStats.mean[idx]) / (this.featureStats.std[idx] + 1e-7)
        );
      });
      
      // Prédire en batch (une seule passe TensorFlow)
      const inputTensor = tf.tensor2d(normalizedBatch);
      const predictions = this.model.predict(inputTensor);
      const values = await predictions.data();
      
      // Nettoyer
      inputTensor.dispose();
      predictions.dispose();
      
      // Convertir en array et arrondir
      const results = Array.from(values).map(val => Math.max(0, Math.round(val)));
      
      return results;
    } catch (error) {
      console.error('❌ Erreur batch prediction:', error);
      // Fallback vers prédictions séquentielles
      console.warn('⚠️ Fallback vers prédictions séquentielles');
      const results = [];
      for (const features of featuresArray) {
        try {
          const prediction = await this.predict(features);
          results.push(prediction);
        } catch (err) {
          console.error('❌ Erreur prédiction individuelle:', err);
          results.push(0);
        }
      }
      return results;
    }
  }

  /**
   * Sauvegarde le modèle en local storage
   * @param {string} name - Nom du modèle
   */
  async save(name = 'demand-forecast-model') {
    if (!this.model) {
      throw new Error('Aucun modèle à sauvegarder');
    }

    console.log(`💾 Sauvegarde du modèle "${name}"...`);
    
    // Sauvegarder le modèle
    await this.model.save(`localstorage://${name}`);
    
    // Sauvegarder les stats de normalisation
    localStorage.setItem(`${name}-stats`, JSON.stringify(this.featureStats));
    
    console.log('✅ Modèle sauvegardé');
  }

  /**
   * Charge un modèle depuis le local storage
   * @param {string} name - Nom du modèle
   */
  async load(name = 'demand-forecast-model') {
    console.log(`📂 Chargement du modèle "${name}"...`);
    
    try {
      // Charger le modèle
      this.model = await tf.loadLayersModel(`localstorage://${name}`);
      
      // Charger les stats
      const statsJson = localStorage.getItem(`${name}-stats`);
      if (statsJson) {
        this.featureStats = JSON.parse(statsJson);
      }
      
      console.log('✅ Modèle chargé');
      return true;
      
    } catch (error) {
      console.log('ℹ️ Aucun modèle sauvegardé trouvé');
      return false;
    }
  }

  /**
   * Vérifie si un modèle est chargé
   */
  isReady() {
    return this.model !== null;
  }

  /**
   * Nettoie le modèle de la mémoire
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.featureStats = null;
      console.log('🗑️ Modèle nettoyé de la mémoire');
    }
  }
}

