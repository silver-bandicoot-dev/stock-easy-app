/**
 * Hook React pour les prévisions de demande ML
 * @module hooks/ml/useDemandForecast
 */

import { useState, useEffect, useRef } from 'react';
import { DemandForecastModel } from '../../services/ml/demandForecastModel';
import { collectSalesHistory } from '../../services/ml/dataCollector';
import { getAllCachedForecasts, cacheAllForecasts, isCacheValid } from '../../utils/ml/forecastCache';
import { shouldRetrain, recordTraining, scheduleAutoRetraining } from '../../utils/ml/autoRetraining';

/**
 * Hook pour gérer les prévisions de demande avec ML
 * @param {Array} products - Liste des produits
 * @returns {Object} État et fonctions du modèle ML
 */
export function useDemandForecast(products) {
  const [forecasts, setForecasts] = useState({});
  const [isTraining, setIsTraining] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [predictionHistory, setPredictionHistory] = useState({});
  
  const modelRef = useRef(null);

  /**
   * Génère les prévisions pour tous les produits
   */
  const generateForecasts = async (model, productList, useCache = true) => {
    if (!model || !model.isReady()) {
      console.log('⚠️ Modèle pas prêt pour les prévisions');
      return;
    }

    if (!productList || productList.length === 0) {
      console.log('⚠️ Aucun produit disponible pour les prévisions');
      return;
    }

    try {
      // Vérifier d'abord le cache
      if (useCache && isCacheValid()) {
        const cachedForecasts = getAllCachedForecasts();
        if (Object.keys(cachedForecasts).length > 0) {
          console.log('⚡ Utilisation du cache des prévisions');
          setForecasts(cachedForecasts);
          return;
        }
      }

      console.log('🔮 Génération des prévisions...');
      
      const newForecasts = {};
      const today = new Date();
      
      for (const product of productList) {
        // Prédire sur 90 jours (7, 30, 60, 90)
        const next7Days = [];
        const next30Days = [];
        const next60Days = [];
        const next90Days = [];
        
        for (let i = 0; i < 90; i++) {
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + i);
          
          const prediction = await model.predict({
            dayOfWeek: futureDate.getDay(),
            month: futureDate.getMonth() + 1,
            isWeekend: [0, 6].includes(futureDate.getDay()),
            isHoliday: false,
            price: product.sellPrice || 0,
            avgSales: product.salesPerDay || 0
          });
          
          next90Days.push(prediction);
          if (i < 60) next60Days.push(prediction);
          if (i < 30) next30Days.push(prediction);
          if (i < 7) next7Days.push(prediction);
        }
        
        // Calculer les métriques pour différentes périodes
        const avg7 = next7Days.reduce((a, b) => a + b, 0) / 7;
        const avg30 = next30Days.reduce((a, b) => a + b, 0) / 30;
        const avg60 = next60Days.reduce((a, b) => a + b, 0) / 60;
        const avg90 = next90Days.reduce((a, b) => a + b, 0) / 90;
        
        const trend = next7Days[6] > next7Days[0] ? 'up' : 'down';
        const confidence = calculateConfidence(next7Days, product.salesPerDay);
        
        newForecasts[product.sku] = {
          next7Days,
          next30Days,
          next60Days,
          next90Days,
          averagePredicted: avg7,
          avg30Days: avg30,
          avg60Days: avg60,
          avg90Days: avg90,
          trend,
          confidence,
          recommendedOrder: calculateRecommendedOrder(
            avg7,
            product.stock,
            product.leadTimeDays
          )
        };
      }
      
      setForecasts(newForecasts);
      
      // Sauvegarder dans le cache
      cacheAllForecasts(newForecasts);
      
      console.log(`✅ Prévisions générées pour ${Object.keys(newForecasts).length} produits`);
      
    } catch (err) {
      console.error('❌ Erreur lors de la génération des prévisions:', err);
      setError(err.message);
    }
  };

  /**
   * Initialise le modèle (charge ou entraîne) - une seule fois
   * Met à jour les prévisions quand de nouveaux produits sont ajoutés
   */
  useEffect(() => {
    let mounted = true;
    
    const initModel = async () => {
      try {
        // Si le modèle n'existe pas encore, le créer
        if (!modelRef.current) {
          console.log('🤖 Initialisation du modèle ML...');
          const model = new DemandForecastModel();
          modelRef.current = model;
          
          // Essayer de charger un modèle existant
          try {
            const loaded = await model.load();
            
            if (!mounted) return;
            
            if (loaded) {
              console.log('✅ Modèle chargé depuis le cache');
              setIsReady(true);
            } else {
              console.log('ℹ️ Pas de modèle en cache');
              console.log('💡 Cliquez sur "Réentraîner" pour générer des prévisions');
            }
          } catch (loadError) {
            console.log('ℹ️ Pas de modèle sauvegardé trouvé');
          }
        }
        
        // Si le modèle est prêt et qu'on a des produits, générer les prévisions
        if (modelRef.current && modelRef.current.isReady() && products && products.length > 0) {
          console.log(`🔄 Mise à jour des prévisions pour ${products.length} produits...`);
          await generateForecasts(modelRef.current, products);
        }
        
      } catch (err) {
        if (mounted) {
          console.error('❌ Erreur lors de l\'initialisation:', err);
          setError(err.message);
        }
      }
    };

    initModel();

    // Cleanup
    return () => {
      mounted = false;
      // Ne pas supprimer le modèle ici, seulement au démontage complet
    };
  }, [products]); // Se mettre à jour quand les produits changent

  /**
   * Entraîne le modèle
   */
  const trainModel = async () => {
    if (isTraining) {
      console.log('⚠️ Entraînement déjà en cours');
      return;
    }

    try {
      setIsTraining(true);
      setError(null);
      setTrainingProgress(0);
      
      console.log('📊 Collecte des données d\'entraînement...');
      
      // Collecter l'historique
      const salesHistory = await collectSalesHistory(products, { days: 180 });
      
      if (salesHistory.length < 50) {
        throw new Error('Pas assez de données pour entraîner (minimum 50 enregistrements)');
      }
      
      setTrainingProgress(20);
      console.log(`✅ ${salesHistory.length} enregistrements collectés`);
      
      // Entraîner
      console.log('🚀 Entraînement du modèle...');
      const model = modelRef.current || new DemandForecastModel();
      modelRef.current = model;
      
      await model.train(salesHistory, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0
      });
      
      setTrainingProgress(80);
      
      // Sauvegarder
      console.log('💾 Sauvegarde du modèle...');
      await model.save();
      
      setTrainingProgress(90);
      
      // Générer les prévisions
      await generateForecasts(model, products);
      
      setTrainingProgress(100);
      setIsReady(true);
      
      // Enregistrer l'entraînement pour le système d'auto-retraining
      recordTraining();
      
      console.log('✅ Entraînement terminé avec succès!');
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'entraînement:', err);
      setError(err.message);
    } finally {
      setIsTraining(false);
    }
  };

  /**
   * Calcule un score de confiance
   */
  const calculateConfidence = (predictions, actualAvg) => {
    const predictedAvg = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    const variance = predictions.reduce((sum, val) => 
      sum + Math.pow(val - predictedAvg, 2), 0) / predictions.length;
    
    // Confiance inversement proportionnelle à la variance
    const stdDev = Math.sqrt(variance);
    const coefficient = stdDev / (predictedAvg + 1);
    
    // Score de 0 à 100
    return Math.max(0, Math.min(100, 100 - (coefficient * 100)));
  };

  /**
   * Calcule la quantité recommandée à commander
   */
  const calculateRecommendedOrder = (predictedDailySales, currentStock, leadTimeDays) => {
    const demandDuringLeadTime = predictedDailySales * leadTimeDays;
    const securityStock = demandDuringLeadTime * 0.2; // 20% de sécurité
    const reorderPoint = demandDuringLeadTime + securityStock;
    
    return Math.max(0, Math.round(reorderPoint - currentStock));
  };

  /**
   * Réentraîne le modèle manuellement
   */
  const retrain = async () => {
    console.log('🔄 Réentraînement manuel déclenché');
    await trainModel();
  };

  /**
   * Obtient la prévision pour un produit spécifique
   */
  const getForecastForProduct = (sku) => {
    return forecasts[sku] || null;
  };

  /**
   * Sauvegarde les prévisions actuelles pour comparaison future
   */
  const savePredictionsForTracking = () => {
    const today = new Date().toISOString().split('T')[0];
    const trackingData = {};
    
    Object.entries(forecasts).forEach(([sku, forecast]) => {
      trackingData[sku] = {
        date: today,
        predictions: forecast.next7Days,
        sku: sku
      };
    });
    
    // Sauvegarder dans localStorage
    const existingHistory = JSON.parse(localStorage.getItem('ml-prediction-history') || '{}');
    localStorage.setItem('ml-prediction-history', JSON.stringify({
      ...existingHistory,
      [today]: trackingData
    }));
    
    console.log('💾 Prévisions sauvegardées pour tracking');
  };

  /**
   * Compare les prévisions passées avec la réalité actuelle
   * @param {string} sku - SKU du produit
   * @param {Array} actualSales - Ventes réelles [{date, quantity}, ...]
   * @returns {Array} Comparaisons [{date, predicted, actual}, ...]
   */
  const compareWithReality = (sku, actualSales) => {
    const history = JSON.parse(localStorage.getItem('ml-prediction-history') || '{}');
    const comparisons = [];
    
    Object.entries(history).forEach(([predictionDate, trackingData]) => {
      if (trackingData[sku]) {
        const predictions = trackingData[sku].predictions;
        const baseDate = new Date(predictionDate);
        
        predictions.forEach((predicted, dayOffset) => {
          const targetDate = new Date(baseDate);
          targetDate.setDate(baseDate.getDate() + dayOffset);
          const dateStr = targetDate.toISOString().split('T')[0];
          
          // Chercher la vente réelle pour cette date
          const actualSale = actualSales?.find(s => s.date === dateStr);
          
          if (actualSale) {
            comparisons.push({
              date: dateStr,
              predicted: predicted,
              actual: actualSale.quantity
            });
          }
        });
      }
    });
    
    return comparisons;
  };

  return {
    forecasts,
    isTraining,
    isReady,
    error,
    trainingProgress,
    predictionHistory,
    retrain,
    getForecastForProduct,
    savePredictionsForTracking,
    compareWithReality
  };
}

