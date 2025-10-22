/**
 * Dashboard principal IA & Prévisions
 * Organise toutes les fonctionnalités ML avec navigation par onglets
 * @module components/ml/AIMainDashboard
 */

import React, { useState } from 'react';
import { Brain, BarChart3, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { SubTabsNavigation } from '../features/SubTabsNavigation';
import { MLAdvancedDashboard } from './MLAdvancedDashboard';
import { ReorderOptimizationDashboard } from './ReorderOptimizationDashboard';
import { AnomalyDashboard } from './AnomalyDashboard';
import { AIOverviewDashboard } from './AIOverviewDashboard';
import api from '../../services/apiService';
import { toast } from 'sonner';

export function AIMainDashboard({ products, orders, aiSubTab, setAiSubTab }) {
  // États pour l'optimisation des stocks (persistants entre les onglets)
  const [optimizations, setOptimizations] = useState(new Map());
  const [optimizationSummary, setOptimizationSummary] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimizationError, setOptimizationError] = useState(null);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  
  // État pour la dernière mise à jour
  const [lastUpdateDate, setLastUpdateDate] = useState(null);

  // Fonctions pour l'optimisation des stocks
  const analyzeOptimizations = async () => {
    setIsAnalyzing(true);
    setOptimizationProgress(0);
    setOptimizationError(null);
    
    // Simulation d'analyse
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setOptimizationProgress(i);
    }
    
    // Générer des optimisations fictives
    const mockOptimizations = new Map();
    products.slice(0, 3).forEach(product => {
      mockOptimizations.set(product.sku, {
        sku: product.sku,
        reorderPoint: Math.floor(Math.random() * 50) + 10,
        currentSettings: {
          reorderPoint: product.reorderPoint || 20,
          stock: product.stock || 0
        },
        costAnalysis: {
          current: {
            stockoutCost: Math.floor(Math.random() * 1000) + 500,
            overstockCost: Math.floor(Math.random() * 500) + 200,
            totalCost: Math.floor(Math.random() * 1500) + 700
          },
          optimized: {
            totalCost: Math.floor(Math.random() * 800) + 300
          },
          savings: {
            perYear: Math.floor(Math.random() * 500) + 200,
            percent: Math.floor(Math.random() * 30) + 10
          }
        },
        confidence: Math.floor(Math.random() * 40) + 60,
        reasoning: [
          {
            type: 'increase',
            change: 'Augmenter le point de commande',
            reason: 'Taux de rupture élevé détecté'
          }
        ]
      });
    });
    
    setOptimizations(mockOptimizations);
    setOptimizationSummary({
      totalCost: 5000,
      totalStockoutCost: 3000,
      totalOverstockCost: 2000,
      avgStockoutRate: 15,
      avgOverstockRate: 8,
      productsWithStockouts: 5,
      productsWithOverstock: 3
    });
    setIsAnalyzing(false);
    
    // Mettre à jour la date de dernière mise à jour
    setLastUpdateDate(new Date().toISOString());
  };

  const applyOptimization = async (sku) => {
    try {
      const optimization = optimizations.get(sku);
      if (!optimization) return;

      await api.updateProduct(sku, {
        reorderPoint: optimization.reorderPoint
      });

      const newOptimizations = new Map(optimizations);
      newOptimizations.delete(sku);
      setOptimizations(newOptimizations);

      toast.success(`Optimisation appliquée pour ${sku}`);
    } catch (err) {
      console.error('Erreur lors de l\'application de l\'optimisation:', err);
      setOptimizationError('Erreur lors de la mise à jour du produit');
    }
  };

  const applyAllOptimizations = async () => {
    try {
      const updates = Array.from(optimizations.entries()).map(([sku, opt]) => ({
        sku,
        reorderPoint: opt.reorderPoint
      }));

      await api.applyOptimizationsBatch(updates);
      setOptimizations(new Map());
      toast.success(`${updates.length} optimisations appliquées avec succès !`);
    } catch (err) {
      console.error('Erreur lors de l\'application des optimisations:', err);
      setOptimizationError('Erreur lors de la mise à jour des produits');
    }
  };

  const rejectOptimization = (sku) => {
    const newOptimizations = new Map(optimizations);
    newOptimizations.delete(sku);
    setOptimizations(newOptimizations);
  };

  const getTotalSavings = () => {
    let total = 0;
    optimizations.forEach(opt => {
      total += opt.costAnalysis.savings.perYear;
    });
    return total;
  };

  const getTopProblems = (limit = 5) => {
    return Array.from(optimizations.entries())
      .map(([sku, opt]) => ({
        sku,
        product: products.find(p => p.sku === sku) || { name: sku },
        stockoutRate: Math.random() * 0.3,
        overstockRate: Math.random() * 0.2,
        stockoutCost: opt.costAnalysis.current.stockoutCost,
        overstockCost: opt.costAnalysis.current.overstockCost
      }))
      .sort((a, b) => (b.stockoutCost + b.overstockCost) - (a.stockoutCost + a.overstockCost))
      .slice(0, limit);
  };

  // Fonction pour lancer toutes les analyses d'un coup
  const launchAllAnalyses = async () => {
    try {
      toast.info('Lancement de toutes les analyses IA...');
      
      // Lancer l'analyse d'optimisation des stocks
      await analyzeOptimizations();
      
      // Mettre à jour la date de dernière mise à jour
      setLastUpdateDate(new Date().toISOString());
      
      toast.success('Toutes les analyses IA ont été lancées avec succès !');
    } catch (err) {
      console.error('Erreur lors du lancement des analyses:', err);
      toast.error('Erreur lors du lancement des analyses');
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation par onglets */}
      <SubTabsNavigation
        tabs={[
          { id: 'overview', label: 'Vue d\'Ensemble', icon: BarChart3 },
          { id: 'forecasts', label: 'Prévisions Détaillées', icon: TrendingUp },
          { id: 'optimization', label: 'Optimisation Stocks', icon: Activity },
          { id: 'anomalies', label: 'Détection Anomalies', icon: AlertTriangle }
        ]}
        activeTab={aiSubTab}
        onChange={setAiSubTab}
      />

      {/* Vue d'Ensemble */}
      {aiSubTab === 'overview' && (
        <AIOverviewDashboard 
          products={products} 
          orders={orders} 
          aiSubTab={aiSubTab}
          setAiSubTab={setAiSubTab}
          onLaunchAllAnalyses={launchAllAnalyses}
          lastUpdateDate={lastUpdateDate}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* Prévisions Détaillées */}
      {aiSubTab === 'forecasts' && (
        <MLAdvancedDashboard products={products} />
      )}

      {/* Optimisation des Points de Commande */}
      {aiSubTab === 'optimization' && (
        <ReorderOptimizationDashboard 
          products={products}
          optimizations={optimizations}
          summary={optimizationSummary}
          isAnalyzing={isAnalyzing}
          error={optimizationError}
          progress={optimizationProgress}
          onAnalyze={analyzeOptimizations}
          onApplyOptimization={applyOptimization}
          onApplyAll={applyAllOptimizations}
          onRejectOptimization={rejectOptimization}
          getTotalSavings={getTotalSavings}
          getTopProblems={getTopProblems}
        />
      )}

      {/* Détection d'Anomalies */}
      {aiSubTab === 'anomalies' && (
        <AnomalyDashboard products={products} orders={orders} />
      )}
    </div>
  );
}

