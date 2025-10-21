/**
 * Hook React pour la détection d'anomalies
 * @module hooks/ml/useAnomalyDetection
 */

import { useState, useEffect, useCallback } from 'react';
import { AnomalyDetector } from '../../services/ml/anomalyDetector';
import { getAllData } from '../../services/apiService';
import { toast } from 'sonner';

/**
 * Hook pour gérer la détection d'anomalies
 * @param {Array} products - Liste des produits
 * @param {Array} orders - Liste des commandes
 * @returns {Object}
 */
export function useAnomalyDetection(products, orders = []) {
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  /**
   * Détecte toutes les anomalies
   */
  const detectAnomalies = useCallback(async () => {
    if (isDetecting) {
      console.log('⚠️ Détection déjà en cours');
      return;
    }

    if (!products || products.length === 0) {
      setError('Aucun produit à analyser');
      return;
    }

    try {
      setIsDetecting(true);
      setError(null);
      
      console.log('🔍 Détection des anomalies...');
      
      // Récupérer les commandes si non fournies
      let ordersData = orders;
      if (!ordersData || ordersData.length === 0) {
        const allData = await getAllData();
        ordersData = allData.orders || [];
      }
      
      const detector = new AnomalyDetector();
      const detected = await detector.detectAllAnomalies(products, ordersData);
      
      setAnomalies(detected);
      
      // Calculer les statistiques
      const anomalyStats = detector.getAnomalyStats(detected);
      setStats(anomalyStats);
      
      setLastCheck(new Date());
      setIsReady(true);
      
      // Notifier si anomalies critiques
      const criticalCount = anomalyStats.critical || 0;
      if (criticalCount > 0) {
        toast.error(
          `${criticalCount} anomalie${criticalCount > 1 ? 's' : ''} critique${criticalCount > 1 ? 's' : ''} détectée${criticalCount > 1 ? 's' : ''}`,
          {
            description: 'Action immédiate recommandée'
          }
        );
      }
      
      console.log(`✅ ${detected.length} anomalies détectées`);
      
    } catch (err) {
      console.error('❌ Erreur lors de la détection:', err);
      setError(err.message);
      toast.error('Erreur lors de la détection d\'anomalies', {
        description: err.message
      });
    } finally {
      setIsDetecting(false);
    }
  }, [products, orders, isDetecting]);

  /**
   * Détection automatique au montage
   */
  useEffect(() => {
    if (products && products.length > 0 && !isReady && !isDetecting) {
      detectAnomalies();
    }
  }, [products]);

  /**
   * Détection périodique toutes les 5 minutes
   */
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(() => {
      console.log('🔄 Détection périodique d\'anomalies...');
      detectAnomalies();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isReady, detectAnomalies]);

  /**
   * Marque une anomalie comme résolue
   */
  const resolveAnomaly = useCallback((anomalyId) => {
    setAnomalies(prev => prev.filter(a => a.id !== anomalyId));
    toast.success('Anomalie marquée comme résolue');
  }, []);

  /**
   * Filtre les anomalies par type
   */
  const getAnomaliesByType = useCallback((type) => {
    return anomalies.filter(a => a.type === type);
  }, [anomalies]);

  /**
   * Filtre les anomalies par sévérité
   */
  const getAnomaliesBySeverity = useCallback((severity) => {
    return anomalies.filter(a => a.severity === severity);
  }, [anomalies]);

  /**
   * Obtient les anomalies pour un produit
   */
  const getAnomaliesForProduct = useCallback((sku) => {
    return anomalies.filter(a => a.sku === sku);
  }, [anomalies]);

  return {
    // État
    anomalies,
    stats,
    isDetecting,
    isReady,
    error,
    lastCheck,
    
    // Actions
    detectAnomalies,
    resolveAnomaly,
    
    // Helpers
    getAnomaliesByType,
    getAnomaliesBySeverity,
    getAnomaliesForProduct
  };
}

