/**
 * Vue d'ensemble du système IA - Dashboard récapitulatif
 * @module components/ml/AIOverviewDashboard
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  CheckCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AI_TABS } from '../../constants/stockEasyConstants';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useDemandForecast } from '../../hooks/ml/useDemandForecast';
import { useReorderOptimization } from '../../hooks/ml/useReorderOptimization';
import { useAnomalyDetection } from '../../hooks/ml/useAnomalyDetection';
import { toast } from 'sonner';

export function AIOverviewDashboard({ products = [], orders = [], setAiSubTab }) {
  const { format: formatCurrency } = useCurrency();
  const formatNoDecimals = useCallback(
    (value) =>
      formatCurrency(value ?? 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    [formatCurrency]
  );

  const {
    forecasts,
    isTraining: forecastTraining,
    isReady: forecastReady,
    error: forecastError,
    retrain,
    getForecastForProduct
  } = useDemandForecast(products);

  const {
    optimizations,
    summary,
    isAnalyzing: optimizationAnalyzing,
    isReady: optimizationReady,
    error: optimizationError,
    progress: optimizationProgress,
    analyze,
    getTotalSavings,
    getOptimizationForProduct
  } = useReorderOptimization(products);

  const {
    stats,
    anomalies,
    isDetecting,
    isReady: anomaliesReady,
    error: anomaliesError,
    lastCheck,
    detectAnomalies,
    getAnomaliesForProduct
  } = useAnomalyDetection(products, orders);

  const [launchingAll, setLaunchingAll] = useState(false);
  const [lastLaunchAt, setLastLaunchAt] = useState(null);

  const handleLaunchAllAnalyses = useCallback(async () => {
    if (launchingAll || !products || products.length === 0) {
      return;
    }

    setLaunchingAll(true);
    try {
      await retrain();
      await analyze();
      await detectAnomalies();
      setLastLaunchAt(new Date());
      toast.success('Analyses ML terminées');
    } catch (error) {
      console.error('❌ Erreur lors du lancement des analyses:', error);
      toast.error('Erreur lors du lancement des analyses', {
        description: error.message
      });
    } finally {
      setLaunchingAll(false);
    }
  }, [launchingAll, products, retrain, analyze, detectAnomalies]);

  useEffect(() => {
    let cancelled = false;

    const triggerInitialAnalysis = async () => {
      try {
        await analyze();
        if (!cancelled) {
          setLastLaunchAt(new Date());
        }
      } catch (error) {
        console.error("❌ Erreur lors de l'analyse initiale:", error);
      }
    };

    if (products && products.length > 0 && !optimizationReady && !optimizationAnalyzing) {
      triggerInitialAnalysis();
    }

    return () => {
      cancelled = true;
    };
  }, [products, optimizationReady, optimizationAnalyzing, analyze]);

  const optimizationItems = useMemo(
    () => (optimizations instanceof Map ? Array.from(optimizations.values()) : []),
    [optimizations]
  );
  const totalOptimizations = optimizationItems.length;
  const totalSavings = useMemo(() => {
    const value = typeof getTotalSavings === 'function' ? getTotalSavings() : 0;
    return Number.isFinite(value) ? value : 0;
  }, [getTotalSavings, optimizationItems]);
  const totalForecastedProducts = useMemo(
    () => (forecasts ? Object.keys(forecasts).length : 0),
    [forecasts]
  );
  const averageConfidence = useMemo(() => {
    if (!forecasts) return null;
    const values = Object.values(forecasts);
    if (!values.length) return null;
    const sum = values.reduce((acc, item) => acc + (item?.confidence ?? 0), 0);
    return sum / values.length;
  }, [forecasts]);
  const criticalAnomalies = stats?.critical ?? 0;
  const highAnomalies = stats?.high ?? 0;
  const totalAnomalies = stats?.total ?? (anomalies?.length ?? 0);
  const lastUpdate = useMemo(() => {
    const source = lastLaunchAt || lastCheck || null;
    return source ? new Date(source) : null;
  }, [lastLaunchAt, lastCheck]);
  const isAnyAnalysisRunning =
    launchingAll || forecastTraining || optimizationAnalyzing || isDetecting;
  const topProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .sort((a, b) => (b.salesPerDay || 0) - (a.salesPerDay || 0))
      .slice(0, 5);
  }, [products]);
  const handleNavigateTo = useCallback(
    (tab) => {
      if (setAiSubTab) {
        setAiSubTab(tab);
      }
    },
    [setAiSubTab]
  );
  const errors = useMemo(
    () => [forecastError, optimizationError, anomaliesError].filter(Boolean),
    [forecastError, optimizationError, anomaliesError]
  );

  const optimizationStats = useMemo(() => {
    const stats = [
      { label: 'Optimisations', value: totalOptimizations },
      {
        label: 'Économies/an',
        value:
          totalSavings > 0 ? `${formatNoDecimals(Math.round(totalSavings))}/an` : '—'
      },
      {
        label: 'État',
        value: optimizationAnalyzing
          ? 'En cours...'
          : optimizationReady
            ? '✅ Analysé'
            : '⏳ En attente'
      }
    ];

    if (optimizationAnalyzing) {
      stats.push({
        label: 'Progression',
        value: `${optimizationProgress ?? 0}%`
      });
    }

    return stats;
  }, [totalOptimizations, totalSavings, optimizationAnalyzing, optimizationReady, optimizationProgress, formatNoDecimals]);

  const anomaliesStats = useMemo(() => (
    [
      { label: 'Total anomalies', value: totalAnomalies },
      { label: 'Critiques', value: criticalAnomalies },
      {
        label: 'État',
        value: isDetecting ? '⏳ Analyse' : anomaliesReady ? '🔴 Actif' : '⏳ En attente'
      }
    ]
  ), [totalAnomalies, criticalAnomalies, isDetecting, anomaliesReady]);

  const forecastsStats = useMemo(() => (
    [
      { label: 'Produits analysés', value: totalForecastedProducts },
      {
        label: 'État',
        value: forecastTraining
          ? 'Entraînement...'
          : forecastReady
            ? '✅ Prêt'
            : '⏳ À lancer'
      },
      {
        label: 'Modèle',
        value: forecastReady ? 'Actif' : 'Inactif'
      }
    ]
  ), [totalForecastedProducts, forecastTraining, forecastReady]);

  return (
    <div className="space-y-6">
      {/* Header avec KPIs globaux */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg text-white p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Vue d'Ensemble IA</h2>
            <p className="text-purple-100">Tableau de bord récapitulatif des systèmes intelligents</p>
            {lastUpdate && (
              <p className="text-purple-200 text-sm mt-1">
                Dernière mise à jour : {lastUpdate.toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
          <button
            onClick={handleLaunchAllAnalyses}
            disabled={isAnyAnalysisRunning || !products.length}
            className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            <Sparkles className={`w-5 h-5 ${isAnyAnalysisRunning ? 'animate-spin' : ''}`} />
            {isAnyAnalysisRunning ? 'Analyses en cours...' : 'Lancer toutes les analyses'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            icon={Brain}
            label="Modèle ML"
            value={forecastTraining ? 'Entraînement...' : forecastReady ? 'Actif' : 'En attente'}
            sublabel={forecastReady ? `${totalForecastedProducts} produits` : 'Cliquez sur "Réentraîner"'}
            color="bg-white/20"
          />
          <KPICard
            icon={Target}
            label="Optimisations"
            value={optimizationReady ? totalOptimizations : '—'}
            sublabel={
              totalSavings > 0
                ? `${formatNoDecimals(Math.round(totalSavings))} économies/an`
                : 'Analyse requise'
            }
            color="bg-white/20"
          />
          <KPICard
            icon={AlertTriangle}
            label="Anomalies"
            value={criticalAnomalies + highAnomalies}
            sublabel={
              criticalAnomalies > 0 ? `${criticalAnomalies} critiques` : anomaliesReady ? 'Aucune critique' : 'Analyse en attente'
            }
            color={criticalAnomalies > 0 ? 'bg-red-500/30' : 'bg-white/20'}
          />
          <KPICard
            icon={CheckCircle}
            label="Précision"
            value={
              averageConfidence != null
                ? `${Math.round(averageConfidence)}%`
                : forecastReady
                  ? '—'
                  : 'En attente'
            }
            sublabel="Confiance moyenne"
            color="bg-white/20"
          />
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <ul className="list-disc list-inside space-y-1 text-sm">
            {errors.map((error, idx) => (
              <li key={idx}>{typeof error === 'string' ? error : error?.message ?? 'Erreur inconnue'}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Alertes Critiques */}
      {(criticalAnomalies > 0 || totalOptimizations > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <h3 className="text-xl font-semibold text-[#191919] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Actions Prioritaires
          </h3>

          <div className="space-y-3">
            {criticalAnomalies > 0 && (
              <ActionCard
                icon={AlertTriangle}
                title={`${criticalAnomalies} anomalie${criticalAnomalies > 1 ? 's' : ''} critique${criticalAnomalies > 1 ? 's' : ''}`}
                description="Nécessite une action immédiate"
                action="Voir les anomalies"
                color="red"
                onClick={() => handleNavigateTo(AI_TABS.ANOMALIES)}
              />
            )}

            {totalOptimizations > 0 && (
              <ActionCard
                icon={Target}
                title={`${totalOptimizations} optimisation${totalOptimizations > 1 ? 's' : ''} disponible${totalOptimizations > 1 ? 's' : ''}`}
                description={`Économies potentielles : ${formatNoDecimals(Math.round(totalSavings))}/an`}
                action="Optimiser maintenant"
                color="blue"
                onClick={() => handleNavigateTo(AI_TABS.OPTIMIZATION)}
              />
            )}
          </div>
        </div>
      )}

      {/* Grid des modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ModuleCard
          icon={TrendingUp}
          title="Prévisions de Demande"
          description="Prévisions ML sur 7/30/60/90 jours"
          stats={forecastsStats}
          link="forecasts"
          color="purple"
          onClick={() => handleNavigateTo(AI_TABS.FORECASTS)}
        />

        <ModuleCard
          icon={Target}
          title="Optimisation Points de Commande"
          description="Réduction des ruptures et surstocks"
          stats={optimizationStats}
          link="optimization"
          color="blue"
          onClick={() => handleNavigateTo(AI_TABS.OPTIMIZATION)}
        />

        <ModuleCard
          icon={AlertTriangle}
          title="Détection d'Anomalies"
          description="Surveillance temps réel des comportements"
          stats={anomaliesStats}
          link="anomalies"
          color="red"
          onClick={() => handleNavigateTo(AI_TABS.ANOMALIES)}
        />

        <ModuleCard
          icon={Sparkles}
          title="Performance Globale"
          description="Métriques et analytics du système"
          stats={[
            { label: 'Produits suivis', value: products.length },
            { label: 'Analyses actives', value: totalOptimizations + totalAnomalies },
            {
              label: 'Dernier lancement',
              value: lastUpdate ? lastUpdate.toLocaleDateString('fr-FR') : '—'
            }
          ]}
          link="forecasts"
          color="green"
          onClick={() => handleNavigateTo(AI_TABS.FORECASTS)}
        />
      </div>

      {/* Top 5 produits à surveiller */}
      {forecastReady && topProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <h3 className="text-xl font-semibold text-[#191919] mb-4">
            Top 5 Produits à Surveiller
          </h3>

          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <ProductSummaryCard
                key={product.sku}
                rank={index + 1}
                product={product}
                forecast={getForecastForProduct(product.sku)}
                optimization={getOptimizationForProduct(product.sku)}
                anomalies={getAnomaliesForProduct(product.sku)}
                formatNoDecimals={formatNoDecimals}
              />
            ))}
          </div>
        </div>
      )}

      {!forecastReady && !forecastTraining && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-12 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-purple-600 opacity-50" />
          <h3 className="text-2xl font-semibold text-[#191919] mb-2">
            Bienvenue dans l'IA de stockeasy
          </h3>
          <p className="text-[#666663] mb-6">
            Accédez à l'onglet "Prévisions Détaillées" et cliquez sur "Réentraîner" pour démarrer le système ML
          </p>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sublabel, color }) {
  return (
    <div className={`${color} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-90">{sublabel}</p>
    </div>
  );
}

function ModuleCard({ icon: Icon, title, description, stats, color, onClick }) {
  const colorClasses = {
    purple: 'border-purple-200 bg-purple-50',
    blue: 'border-blue-200 bg-blue-50',
    red: 'border-red-200 bg-red-50',
    green: 'border-green-200 bg-green-50'
  };

  const iconColors = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600'
  };

  return (
    <div className={`border-2 ${colorClasses[color]} rounded-xl p-6 hover:shadow-lg transition-shadow`}>
      <div className={`${iconColors[color]} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        <Icon className="w-7 h-7" />
      </div>

      <h4 className="text-lg font-bold text-[#191919] mb-2">{title}</h4>
      <p className="text-sm text-[#666663] mb-4">{description}</p>

      <div className="space-y-2 mb-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-[#666663]">{stat.label}:</span>
            <span className="font-semibold text-[#191919]">{stat.value}</span>
          </div>
        ))}
      </div>

      <button
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#191919] border border-[#E5E4DF] rounded-lg hover:bg-[#FAFAF7] transition-colors font-medium"
        onClick={onClick}
      >
        Accéder au module
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ProductSummaryCard({ rank, product, forecast, optimization, anomalies, formatNoDecimals }) {
  const anomalyCount = anomalies?.length ?? 0;
  const savingsPerYear = optimization?.costAnalysis?.savings?.perYear ?? null;
  const savingsLabel = savingsPerYear != null ? `${formatNoDecimals(Math.round(savingsPerYear))}/an` : '—';
  const forecastValue = forecast?.averagePredicted != null ? forecast.averagePredicted.toFixed(1) : '-';
  const trendIcon =
    forecast?.trend === 'down' ? (
      <TrendingDown className="w-3 h-3 text-red-600" />
    ) : (
      <TrendingUp className="w-3 h-3 text-green-600" />
    );
  const hasIssues = anomalyCount > 0 || (optimization && optimization.confidence < 80);

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
      hasIssues ? 'border-orange-200 bg-orange-50' : 'border-[#E5E4DF] bg-[#FAFAF7]'
    }`}>
      <div className="flex items-center gap-4 flex-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
          rank <= 3 ? 'bg-purple-600 text-white' : 'bg-[#E5E4DF] text-[#666663]'
        }`}>
          {rank}
        </div>

        <div className="flex-1">
          <p className="font-semibold text-[#191919]">{product.name}</p>
          <p className="text-sm text-[#666663]">{product.sku}</p>
        </div>

        <div className="flex items-center gap-4">
          {forecast && (
            <div className="text-center">
              <p className="text-xs text-[#666663]">Prévision 7j</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-purple-600">{forecastValue}</p>
                {trendIcon}
              </div>
            </div>
          )}

          {optimization && (
            <div className="text-center">
              <p className="text-xs text-[#666663]">Optimisation</p>
              <p className="text-sm font-bold text-blue-600">{savingsLabel}</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-[#666663]">Anomalies</p>
            <p className={`text-sm font-bold ${anomalyCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {anomalyCount}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-[#666663]">Stock</p>
            <p className="text-sm font-bold text-[#191919]">
              {product.stock ?? '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, description, action, color, onClick }) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700'
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className="w-6 h-6 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold mb-1">{title}</p>
          <p className="text-sm opacity-90 mb-3">{description}</p>
          <button
            className="text-sm font-medium hover:underline flex items-center gap-1"
            onClick={onClick}
          >
            {action}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
