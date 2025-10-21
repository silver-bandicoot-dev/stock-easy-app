/**
 * Dashboard d'optimisation des points de commande
 * @module components/ml/ReorderOptimizationDashboard
 */

import React, { useState } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  DollarSign,
  Package,
  Loader,
  ArrowRight,
  Info,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useReorderOptimization } from '../../hooks/ml/useReorderOptimization';

export function ReorderOptimizationDashboard({ products }) {
  const {
    optimizations,
    summary,
    isAnalyzing,
    isReady,
    error,
    progress,
    analyze,
    applyOptimization,
    applyAll,
    rejectOptimization,
    getTotalSavings,
    getTopProblems
  } = useReorderOptimization(products);

  const [selectedSKU, setSelectedSKU] = useState(null);

  // Convertir Map en Array pour l'affichage
  const optimizationList = Array.from(optimizations.entries()).map(([sku, opt]) => ({
    sku,
    ...opt
  }));

  const totalSavings = getTotalSavings();
  const topProblems = getTopProblems(5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#191919]">
                Optimisation des Points de Commande
              </h2>
              <p className="text-sm text-[#666663]">
                Analyse ML pour réduire les ruptures et surstocks
              </p>
            </div>
          </div>

          {/* Bouton Analyser */}
          <button
            onClick={analyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyse...' : 'Analyser'}
          </button>
        </div>

        {/* Barre de progression */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="font-medium">Analyse en cours...</span>
              <span className="text-sm">({progress}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Résumé de performance */}
      {isReady && summary && (
        <PerformanceSummary summary={summary} totalSavings={totalSavings} />
      )}

      {/* Top problèmes */}
      {isReady && topProblems.length > 0 && (
        <TopProblemsSection problems={topProblems} />
      )}

      {/* Liste des optimisations */}
      {isReady && optimizationList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#191919]">
              📋 Optimisations Suggérées ({optimizationList.length})
            </h3>
            
            {optimizationList.length > 0 && (
              <button
                onClick={applyAll}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Appliquer Tout
              </button>
            )}
          </div>

          <div className="space-y-4">
            {optimizationList.map(opt => (
              <OptimizationCard
                key={opt.sku}
                optimization={opt}
                onApply={() => applyOptimization(opt.sku)}
                onReject={() => rejectOptimization(opt.sku)}
                isSelected={selectedSKU === opt.sku}
                onSelect={() => setSelectedSKU(opt.sku === selectedSKU ? null : opt.sku)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Message si pas de données */}
      {isReady && optimizationList.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <h3 className="text-xl font-semibold text-[#191919] mb-2">
            Tous les produits sont optimaux !
          </h3>
          <p className="text-[#666663]">
            Aucune optimisation nécessaire. Les points de commande actuels sont déjà bien calibrés.
          </p>
        </div>
      )}

      {/* Message initial */}
      {!isReady && !isAnalyzing && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-12 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-blue-600 opacity-50" />
          <h3 className="text-xl font-semibold text-[#191919] mb-2">
            Prêt à optimiser vos stocks
          </h3>
          <p className="text-[#666663] mb-4">
            Cliquez sur "Analyser" pour identifier les opportunités d'optimisation
          </p>
          <button
            onClick={analyze}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Lancer l'analyse
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Résumé de performance
 */
function PerformanceSummary({ summary, totalSavings }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
      <h3 className="text-lg font-semibold text-[#191919] mb-4">
        📊 Résumé de Performance
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Coûts totaux */}
        <div className="border border-[#E5E4DF] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            <span className="text-sm text-[#666663]">Coûts Actuels</span>
          </div>
          <div className="text-2xl font-bold text-[#191919]">
            {summary.totalCost.toLocaleString()}€
          </div>
          <div className="text-xs text-[#666663] mt-1">
            Ruptures: {summary.totalStockoutCost}€ | Surstock: {summary.totalOverstockCost}€
          </div>
        </div>

        {/* Économies potentielles */}
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">Économies Potentielles</span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {Math.round(totalSavings).toLocaleString()}€/an
          </div>
          <div className="text-xs text-green-600 mt-1">
            En appliquant les optimisations
          </div>
        </div>

        {/* Taux de rupture */}
        <div className="border border-[#E5E4DF] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-[#666663]">Taux de Rupture</span>
          </div>
          <div className="text-2xl font-bold text-[#191919]">
            {summary.avgStockoutRate}%
          </div>
          <div className="text-xs text-[#666663] mt-1">
            {summary.productsWithStockouts} produits affectés
          </div>
        </div>

        {/* Taux de surstock */}
        <div className="border border-[#E5E4DF] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-[#666663]">Taux de Surstock</span>
          </div>
          <div className="text-2xl font-bold text-[#191919]">
            {summary.avgOverstockRate}%
          </div>
          <div className="text-xs text-[#666663] mt-1">
            {summary.productsWithOverstock} produits affectés
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section des produits les plus problématiques
 */
function TopProblemsSection({ problems }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
      <h3 className="text-lg font-semibold text-[#191919] mb-4">
        ⚠️ Top 5 Produits à Optimiser en Priorité
      </h3>

      <div className="space-y-3">
        {problems.map((problem, index) => (
          <div 
            key={problem.sku}
            className="flex items-center justify-between p-4 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                index === 0 ? 'bg-red-600' : index === 1 ? 'bg-orange-600' : 'bg-yellow-600'
              }`}>
                {index + 1}
              </div>
              
              <div className="flex-1">
                <p className="font-semibold text-[#191919]">{problem.product.name}</p>
                <p className="text-sm text-[#666663]">{problem.sku}</p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-[#666663]">Ruptures</p>
                    <p className="text-sm font-semibold text-red-600">
                      {(problem.stockoutRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#666663]">Surstock</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {(problem.overstockRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#666663]">Coût total</p>
                    <p className="text-sm font-semibold text-[#191919]">
                      {Math.round(problem.stockoutCost + problem.overstockCost)}€
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Carte d'optimisation pour un produit
 */
function OptimizationCard({ optimization, onApply, onReject, isSelected, onSelect }) {
  const product = optimization.currentSettings;
  const hasSignificantChange = Math.abs(optimization.reorderPoint - product.reorderPoint) > 5;
  
  // Couleur selon le type d'ajustement
  const changeType = optimization.reorderPoint > product.reorderPoint ? 'increase' : 'decrease';
  const changeColor = changeType === 'increase' ? 'text-orange-600' : 'text-green-600';
  const changeBg = changeType === 'increase' ? 'bg-orange-50' : 'bg-green-50';

  return (
    <div className={`border-2 rounded-lg transition-all ${
      isSelected ? 'border-blue-500 shadow-lg' : 'border-[#E5E4DF]'
    }`}>
      {/* Header cliquable */}
      <button
        onClick={onSelect}
        className="w-full p-4 flex items-center justify-between hover:bg-[#FAFAF7] transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={`p-2 rounded-lg ${changeBg}`}>
            {changeType === 'increase' ? (
              <TrendingUp className={`w-5 h-5 ${changeColor}`} />
            ) : (
              <TrendingDown className={`w-5 h-5 ${changeColor}`} />
            )}
          </div>

          <div className="text-left flex-1">
            <p className="font-semibold text-[#191919]">{optimization.sku}</p>
            <p className="text-sm text-[#666663]">
              {optimization.currentSettings.stock} en stock
            </p>
          </div>

          {/* Comparaison Avant/Après */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-[#666663]">Actuel</p>
              <p className="text-lg font-bold text-[#191919]">{product.reorderPoint}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#666663]" />
            <div className="text-center">
              <p className="text-xs text-[#666663]">Optimal</p>
              <p className={`text-lg font-bold ${changeColor}`}>{optimization.reorderPoint}</p>
            </div>
          </div>

          {/* Économies */}
          <div className="text-right">
            <p className="text-xs text-[#666663]">Économies/an</p>
            <p className="text-lg font-bold text-green-600">
              {optimization.costAnalysis.savings.perYear}€
            </p>
          </div>

          {isSelected ? <ChevronUp className="w-5 h-5 text-[#666663]" /> : <ChevronDown className="w-5 h-5 text-[#666663]" />}
        </div>
      </button>

      {/* Détails (affiché si sélectionné) */}
      {isSelected && (
        <div className="p-6 border-t border-[#E5E4DF] bg-[#FAFAF7]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Analyse des coûts */}
            <div>
              <h4 className="font-semibold text-[#191919] mb-3">💰 Analyse des Coûts</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666663]">Coût ruptures (actuel):</span>
                  <span className="font-semibold text-red-600">
                    {optimization.costAnalysis.current.stockoutCost}€
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666663]">Coût surstock (actuel):</span>
                  <span className="font-semibold text-blue-600">
                    {optimization.costAnalysis.current.overstockCost}€
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E5E4DF]">
                  <span className="text-[#666663] font-medium">Total actuel:</span>
                  <span className="font-bold text-[#191919]">
                    {optimization.costAnalysis.current.totalCost}€/an
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666663] font-medium">Total optimisé:</span>
                  <span className="font-bold text-green-600">
                    {optimization.costAnalysis.optimized.totalCost}€/an
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E5E4DF]">
                  <span className="text-green-700 font-medium">Économies:</span>
                  <span className="font-bold text-green-700">
                    {optimization.costAnalysis.savings.perYear}€/an (-{optimization.costAnalysis.savings.percent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Raisons des ajustements */}
            <div>
              <h4 className="font-semibold text-[#191919] mb-3">📋 Raisons des Ajustements</h4>
              <div className="space-y-2">
                {optimization.reasoning.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {reason.type === 'increase' ? (
                      <TrendingUp className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    ) : reason.type === 'decrease' ? (
                      <TrendingDown className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-[#191919]">{reason.change}</p>
                      <p className="text-[#666663]">{reason.reason}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Score de confiance */}
              <div className="mt-4 pt-4 border-t border-[#E5E4DF]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#666663]">Confiance</span>
                  <span className={`text-sm font-semibold ${
                    optimization.confidence >= 80 ? 'text-green-600' :
                    optimization.confidence >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {optimization.confidence}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      optimization.confidence >= 80 ? 'bg-green-600' :
                      optimization.confidence >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${optimization.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <CheckCircle className="w-5 h-5" />
              Appliquer cette optimisation
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              className="px-4 py-2.5 border-2 border-[#E5E4DF] text-[#666663] rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors font-medium"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

