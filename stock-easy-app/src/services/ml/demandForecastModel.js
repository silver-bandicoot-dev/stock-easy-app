/**
 * Modèle de prévision de demande avec TensorFlow.js
 * @module services/ml/demandForecastModel
 */

import * as tf from '@tensorflow/tfjs';

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
    const {
      epochs = 100,
      batchSize = 32,
      validationSplit = 0.2,
      verbose = 1
    } = options;

    console.log('🚀 Début de l\'entraînement du modèle ML...');
    console.log(`📊 Données: ${salesHistory.length} enregistrements`);
    console.log(`⚙️ Paramètres: ${epochs} epochs, batch size ${batchSize}`);

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
    
    // Entraîner
    const history = await this.model.fit(xs, ys, {
      epochs,
      batchSize,
      validationSplit,
      verbose,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(
              `Epoch ${epoch + 1}/${epochs} - ` +
              `loss: ${logs.loss.toFixed(4)} - ` +
              `mae: ${logs.mae.toFixed(4)} - ` +
              `val_loss: ${logs.val_loss.toFixed(4)} - ` +
              `val_mae: ${logs.val_mae.toFixed(4)}`
            );
          }
        }
      }
    });
    
    // Nettoyer les tenseurs
    xs.dispose();
    ys.dispose();
    
    console.log('✅ Entraînement terminé!');
    
    return history;
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

