/**
 * Hook React pour les prévisions de demande ML
 * @module hooks/ml/useDemandForecast
 */

import { useState, useEffect, useRef } from 'react';
import { DemandForecastModel } from '../../services/ml/demandForecastModel';
import { collectSalesHistory } from '../../services/ml/dataCollector';

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
  
  const modelRef = useRef(null);

  /**
   * Initialise le modèle (charge ou entraîne) - une seule fois
   */
  useEffect(() => {
    let mounted = true;
    
    const initModel = async () => {
      try {
        console.log('🤖 Initialisation du modèle ML...');
        
        // Créer l'instance
        const model = new DemandForecastModel();
        modelRef.current = model;
        
        // Essayer de charger un modèle existant
        try {
          const loaded = await model.load();
          
          if (!mounted) return;
          
          if (loaded && products && products.length > 0) {
            console.log('✅ Modèle chargé depuis le cache');
            setIsReady(true);
            
            // Générer les prévisions avec les produits
            await generateForecasts(model, products);
          } else {
            console.log('ℹ️ Pas de modèle en cache');
            console.log('💡 Cliquez sur "Réentraîner" pour générer des prévisions');
          }
        } catch (loadError) {
          console.log('ℹ️ Pas de modèle sauvegardé trouvé');
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
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, []); // Une seule fois au montage

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
      const salesHistory = await collectSalesHistory();
      
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
      console.log('✅ Entraînement terminé avec succès!');
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'entraînement:', err);
      setError(err.message);
    } finally {
      setIsTraining(false);
    }
  };

  /**
   * Génère les prévisions pour tous les produits
   */
  const generateForecasts = async (model, productList) => {
    if (!model || !model.isReady()) {
      console.log('⚠️ Modèle pas prêt pour les prévisions');
      return;
    }

    if (!productList || productList.length === 0) {
      console.log('⚠️ Aucun produit disponible pour les prévisions');
      return;
    }

    try {
      console.log('🔮 Génération des prévisions...');
      
      const newForecasts = {};
      const today = new Date();
      
      for (const product of productList) {
        // Prédire les 7 prochains jours
        const next7Days = [];
        
        for (let i = 0; i < 7; i++) {
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + i);
          
          const prediction = await model.predict({
            dayOfWeek: futureDate.getDay(),
            month: futureDate.getMonth() + 1,
            isWeekend: [0, 6].includes(futureDate.getDay()),
            isHoliday: false, // TODO: intégrer API jours fériés
            price: product.sellPrice || 0,
            avgSales: product.salesPerDay || 0
          });
          
          next7Days.push(prediction);
        }
        
        // Calculer les métriques
        const averagePredicted = next7Days.reduce((a, b) => a + b, 0) / 7;
        const trend = next7Days[6] > next7Days[0] ? 'up' : 'down';
        const confidence = calculateConfidence(next7Days, product.salesPerDay);
        
        newForecasts[product.sku] = {
          next7Days,
          averagePredicted,
          trend,
          confidence,
          recommendedOrder: calculateRecommendedOrder(
            averagePredicted,
            product.stock,
            product.leadTimeDays
          )
        };
      }
      
      setForecasts(newForecasts);
      console.log(`✅ Prévisions générées pour ${Object.keys(newForecasts).length} produits`);
      
    } catch (err) {
      console.error('❌ Erreur lors de la génération des prévisions:', err);
      setError(err.message);
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

  return {
    forecasts,
    isTraining,
    isReady,
    error,
    trainingProgress,
    retrain,
    getForecastForProduct
  };
}

