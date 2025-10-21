/**
 * Hook React pour l'optimisation des points de commande
 * @module hooks/ml/useReorderOptimization
 */

import { useState, useCallback } from 'react';
import { PerformanceAnalyzer } from '../../services/ml/optimizer/performanceAnalyzer';
import { ReorderOptimizer } from '../../services/ml/optimizer/reorderOptimizer';
import * as api from '../../services/apiService';
import { toast } from 'sonner';

/**
 * Hook pour gérer l'optimisation des points de commande
 * @param {Array} products - Liste des produits
 * @returns {Object}
 */
export function useReorderOptimization(products) {
  const [optimizations, setOptimizations] = useState(new Map());
  const [performanceData, setPerformanceData] = useState(new Map());
  const [summary, setSummary] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  /**
   * Analyse la performance et optimise les points de commande
   */
  const analyze = useCallback(async () => {
    if (isAnalyzing) {
      console.log('⚠️ Analyse déjà en cours');
      return;
    }

    if (!products || products.length === 0) {
      setError('Aucun produit à analyser');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      setProgress(0);
      
      console.log('📊 Début de l\'analyse de performance...');
      
      // Étape 1 : Analyser la performance historique
      setProgress(10);
      const analyzer = new PerformanceAnalyzer();
      const perfMap = await analyzer.collectPerformanceHistory();
      setPerformanceData(perfMap);
      
      setProgress(40);
      console.log(`✅ Performance analysée pour ${perfMap.size} produits`);
      
      // Étape 2 : Générer le résumé
      const perfSummary = analyzer.getPerformanceSummary(perfMap);
      setSummary(perfSummary);
      
      setProgress(50);
      console.log('📈 Résumé de performance:', perfSummary);
      
      // Étape 3 : Optimiser les points de commande
      console.log('🎯 Optimisation des points de commande...');
      const optimizer = new ReorderOptimizer();
      const optimizationMap = optimizer.optimizeAllProducts(products, perfMap);
      setOptimizations(optimizationMap);
      
      setProgress(90);
      console.log(`✅ ${optimizationMap.size} produits optimisés`);
      
      // Étape 4 : Calculer les économies totales
      const totalSavings = Array.from(optimizationMap.values())
        .reduce((sum, opt) => sum + (opt.costAnalysis.savings.perYear || 0), 0);
      
      setProgress(100);
      setIsReady(true);
      
      toast.success(
        `Analyse terminée! ${optimizationMap.size} produits optimisés.`,
        {
          description: `Économies potentielles : ${Math.round(totalSavings)}€/an`
        }
      );
      
      console.log('✅ Analyse terminée avec succès');
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'analyse:', err);
      setError(err.message);
      toast.error('Erreur lors de l\'analyse', {
        description: err.message
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [products, isAnalyzing]);

  /**
   * Applique une optimisation à un produit
   * @param {string} sku
   */
  const applyOptimization = useCallback(async (sku) => {
    const optimization = optimizations.get(sku);
    
    if (!optimization) {
      toast.error('Optimisation introuvable');
      return;
    }

    try {
      console.log(`🔧 Application de l'optimisation pour ${sku}...`);
      
      // Mettre à jour le produit via l'API
      await api.updateProduct(sku, {
        reorderPoint: optimization.reorderPoint,
        securityStock: optimization.securityStock
      });
      
      // Retirer de la liste des optimisations
      const newOptimizations = new Map(optimizations);
      newOptimizations.delete(sku);
      setOptimizations(newOptimizations);
      
      toast.success(`Optimisation appliquée pour ${sku}`, {
        description: `Nouveau point de commande : ${optimization.reorderPoint}`
      });
      
      console.log(`✅ Optimisation appliquée pour ${sku}`);
      
    } catch (err) {
      console.error(`❌ Erreur lors de l'application:`, err);
      toast.error('Erreur lors de l\'application', {
        description: err.message
      });
    }
  }, [optimizations]);

  /**
   * Applique toutes les optimisations en batch
   */
  const applyAll = useCallback(async () => {
    const optimizationList = Array.from(optimizations.values());
    
    if (optimizationList.length === 0) {
      toast.info('Aucune optimisation à appliquer');
      return;
    }

    const totalSavings = Array.from(optimizations.values())
      .reduce((sum, opt) => sum + opt.costAnalysis.savings.perYear, 0);

    const confirm = window.confirm(
      `Appliquer ${optimizationList.length} optimisations?\n\n` +
      `Cela mettra à jour les points de commande pour tous les produits sélectionnés.\n\n` +
      `Économies totales estimées : ${Math.round(totalSavings)}€/an`
    );

    if (!confirm) return;

    try {
      toast.loading('Application des optimisations...', { id: 'apply-all' });
      
      // Utiliser le batch endpoint
      const results = await api.applyOptimizationsBatch(optimizationList);
      
      // Retirer les optimisations réussies
      const newOptimizations = new Map(optimizations);
      results.success.forEach(sku => newOptimizations.delete(sku));
      setOptimizations(newOptimizations);
      
      // Notifications
      if (results.success.length > 0) {
        toast.success(
          `${results.success.length} optimisations appliquées`,
          { id: 'apply-all' }
        );
      }
      
      if (results.errors.length > 0) {
        toast.error(
          `${results.errors.length} erreurs rencontrées`,
          {
            id: 'apply-all-errors',
            description: results.errors.map(e => `${e.sku}: ${e.error}`).join('\n')
          }
        );
      }
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'application batch:', err);
      toast.error('Erreur lors de l\'application', {
        id: 'apply-all',
        description: err.message
      });
    }
  }, [optimizations]);

  /**
   * Rejette une optimisation
   * @param {string} sku
   */
  const rejectOptimization = useCallback((sku) => {
    const newOptimizations = new Map(optimizations);
    newOptimizations.delete(sku);
    setOptimizations(newOptimizations);
    
    toast.info(`Optimisation rejetée pour ${sku}`);
  }, [optimizations]);

  /**
   * Obtient l'optimisation pour un produit
   */
  const getOptimizationForProduct = useCallback((sku) => {
    return optimizations.get(sku) || null;
  }, [optimizations]);

  /**
   * Obtient la performance pour un produit
   */
  const getPerformanceForProduct = useCallback((sku) => {
    return performanceData.get(sku) || null;
  }, [performanceData]);

  /**
   * Calcule les économies totales
   */
  const getTotalSavings = useCallback(() => {
    return Array.from(optimizations.values())
      .reduce((sum, opt) => sum + (opt.costAnalysis.savings.perYear || 0), 0);
  }, [optimizations]);

  /**
   * Obtient les produits les plus problématiques
   */
  const getTopProblems = useCallback((count = 5) => {
    if (!isReady || performanceData.size === 0) return [];
    
    const analyzer = new PerformanceAnalyzer();
    return analyzer.getProblematicProducts(performanceData, count);
  }, [performanceData, isReady]);

  return {
    // État
    optimizations,
    performanceData,
    summary,
    isAnalyzing,
    isReady,
    error,
    progress,
    
    // Actions
    analyze,
    applyOptimization,
    applyAll,
    rejectOptimization,
    
    // Helpers
    getOptimizationForProduct,
    getPerformanceForProduct,
    getTotalSavings,
    getTopProblems
  };
}

