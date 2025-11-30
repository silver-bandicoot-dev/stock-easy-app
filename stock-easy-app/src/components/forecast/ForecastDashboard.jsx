/**
 * ForecastDashboard - Interface "AI-Powered" Premium
 * 
 * Dashboard de prévisions avec un look & feel professionnel qui
 * donne l'impression d'un système ML sophistiqué
 * 
 * @module components/forecast/ForecastDashboard
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Calendar,
  Package,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Alert, AlertDescription } from '../ui/Alert';
import {
  useSmartForecast,
  useForecastRecommendations,
  useDataQuality,
  useForecastAccuracy
} from '../../hooks/useSmartForecast';

/**
 * Composant principal du dashboard
 */
export function ForecastDashboard({ 
  product, 
  salesHistory, 
  currentStock, 
  reorderPoint,
  className = '' 
}) {
  const { t } = useTranslation();
  const { forecast, isLoading, error, refresh } = useSmartForecast(
    product?.id || 'default',
    salesHistory,
    { days: 30 }
  );

  const recommendations = useForecastRecommendations(
    forecast,
    currentStock,
    reorderPoint
  );

  const dataQuality = useDataQuality(salesHistory);
  const { accuracy: accuracyResult } = useForecastAccuracy(salesHistory);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t('analytics.forecast.errorGenerating')}: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!forecast && !isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-4">
            {t('analytics.forecast.noForecastAvailable')}
          </p>
          <Button onClick={refresh} variant="outline">
            {t('common.retry') || t('dashboard.revenueChart.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec badge AI */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('analytics.forecast.title')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('analytics.forecast.predictiveAnalysis', { product: product?.name || 'Produit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            <Sparkles className="w-3 h-3 mr-1" />
            {t('analytics.forecast.aiPowered')}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prédiction Principale */}
        <Card className="lg:col-span-2 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              {t('analytics.forecast.forecast30Days')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ForecastSkeleton />
            ) : (
              <>
                {/* Grosse valeur */}
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-purple-900 mb-2">
                    {forecast?.total?.toLocaleString() || '—'}
                  </div>
                  <p className="text-gray-600">
                    {t('analytics.forecast.unitsForecast')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('analytics.forecast.unitsPerDay', { count: Math.round(forecast?.average || 0) })}
                  </p>
                </div>

                {/* Score de confiance */}
                <ConfidenceScore confidence={forecast?.avgConfidence || 0} t={t} />

                {/* Breakdown technique */}
                {forecast?.predictions?.[0] && (
                  <ForecastBreakdown breakdown={forecast.predictions[0].breakdown} t={t} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar - Qualité & Précision */}
        <div className="space-y-6">
          {/* Qualité des Données */}
          <DataQualityCard quality={dataQuality} t={t} />

          {/* Précision Historique */}
          {accuracyResult && <AccuracyCard accuracy={accuracyResult} t={t} />}
        </div>
      </div>

      {/* Recommandations */}
      {recommendations && recommendations.length > 0 && (
        <RecommendationsSection recommendations={recommendations} t={t} />
      )}

      {/* Graphique de prévisions (optionnel) */}
      <ForecastChart forecast={forecast} salesHistory={salesHistory} t={t} />
    </div>
  );
}

/**
 * Score de confiance avec barre de progression
 */
function ConfidenceScore({ confidence, t }) {
  const percentage = (confidence * 100).toFixed(0);
  const color = confidence > 0.7 ? 'text-green-600' : confidence > 0.5 ? 'text-yellow-600' : 'text-orange-600';
  const bgColor = confidence > 0.7 ? 'bg-green-100' : confidence > 0.5 ? 'bg-yellow-100' : 'bg-orange-100';

  return (
    <div className={`p-4 rounded-lg ${bgColor} mb-6`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {t('analytics.forecast.confidenceLevel')}
        </span>
        <span className={`text-lg font-bold ${color}`}>
          {percentage}%
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-gray-600 mt-2">
        {confidence > 0.7 && t('analytics.forecast.confidenceHigh')}
        {confidence > 0.5 && confidence <= 0.7 && t('analytics.forecast.confidenceMedium')}
        {confidence <= 0.5 && t('analytics.forecast.confidenceLow')}
      </p>
    </div>
  );
}

/**
 * Détails techniques du calcul (pour crédibilité)
 */
function ForecastBreakdown({ breakdown, t }) {
  if (!breakdown) return null;

  return (
    <details className="text-sm border-t pt-4">
      <summary className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        {t('analytics.forecast.algorithmDetails')}
      </summary>
      <div className="mt-3 space-y-2 pl-6 border-l-2 border-purple-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{t('analytics.forecast.wma')}</span>
          <span className="font-mono text-purple-700 font-medium">
            {breakdown.base}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{t('analytics.forecast.dayAdjustment')}</span>
          <span className="font-mono text-purple-700 font-medium">
            ×{breakdown.dayMultiplier}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{t('analytics.forecast.trendFactor')}</span>
          <span className="font-mono text-purple-700 font-medium">
            {(breakdown.trend * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{t('analytics.forecast.seasonalCoefficient')}</span>
          <span className="font-mono text-purple-700 font-medium">
            ×{breakdown.seasonality}
          </span>
        </div>
      </div>
      <div className="mt-3 p-2 bg-purple-50 rounded text-xs text-gray-600">
        {t('analytics.forecast.autoCalculated')}
      </div>
    </details>
  );
}

/**
 * Carte de qualité des données
 */
function DataQualityCard({ quality, t }) {
  if (!quality) return null;

  const scoreColor = quality.score > 75 ? 'text-green-600' : quality.score > 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="w-4 h-4" />
          {t('analytics.forecast.dataQuality')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className={`text-4xl font-bold ${scoreColor}`}>
            {quality.score}
          </div>
          <p className="text-xs text-gray-600">{t('analytics.forecast.scoreOutOf100')}</p>
        </div>

        {quality.metrics && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('analytics.forecast.dataPoints')}</span>
              <span className="font-medium">{quality.metrics.dataPoints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('analytics.forecast.variability')}</span>
              <span className="font-medium">{quality.metrics.variability}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Carte de précision historique
 */
function AccuracyCard({ accuracy, t }) {
  // Vérifier que accuracy existe et a les bonnes propriétés
  if (!accuracy || accuracy === null || typeof accuracy.accuracy !== 'number') {
    return null;
  }

  const accuracyValue = Number(accuracy.accuracy);
  const mapeValue = accuracy.mape || 0;
  
  // Déterminer la couleur basée sur la qualité
  let accuracyColor, qualityLabel, qualityIcon;
  
  if (accuracy.quality === 'excellent') {
    accuracyColor = 'text-green-600';
    qualityLabel = t('analytics.forecast.qualityExcellent');
    qualityIcon = '✨';
  } else if (accuracy.quality === 'good') {
    accuracyColor = 'text-green-500';
    qualityLabel = t('analytics.forecast.qualityGood');
    qualityIcon = '👍';
  } else if (accuracy.quality === 'acceptable') {
    accuracyColor = 'text-yellow-600';
    qualityLabel = t('analytics.forecast.qualityAcceptable');
    qualityIcon = '⚠️';
  } else {
    accuracyColor = 'text-orange-600';
    qualityLabel = t('analytics.forecast.qualityLow');
    qualityIcon = '📉';
  }

  // Si l'accuracy brute est négative, afficher une alerte
  const hasNegativeAccuracy = accuracy.rawAccuracy !== undefined && accuracy.rawAccuracy < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {t('analytics.forecast.historicalAccuracy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className={`text-4xl font-bold ${accuracyColor}`}>
            {accuracyValue.toFixed(1)}%
            {hasNegativeAccuracy && (
              <span className="text-xs text-orange-600 ml-2" title={`${t('analytics.forecast.averageAccuracy')}: ${accuracy.rawAccuracy.toFixed(1)}%`}>
                *
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-1">{t('analytics.forecast.averageAccuracy')}</p>
          {accuracy.quality && (
            <p className="text-xs text-gray-500">
              {qualityIcon} {qualityLabel} (MAPE: {mapeValue.toFixed(1)}%)
            </p>
          )}
        </div>
        
        {hasNegativeAccuracy && (
          <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
            <p className="font-medium mb-1">⚠️ {t('analytics.forecast.accuracyVeryLow')}</p>
            <p className="text-orange-700">
              {t('analytics.forecast.accuracyVeryLowDesc', { mape: mapeValue.toFixed(1) })}
            </p>
          </div>
        )}
        
        <p className="text-xs text-gray-500 text-center">
          {t('analytics.forecast.basedOnPredictions', { count: accuracy.tested || 0 })}
        </p>
        
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
            ℹ️ {t('analytics.forecast.accuracyExplanation')}
          </summary>
          <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700">
            <p className="mb-1">
              <strong>{t('analytics.forecast.accuracyFormula')}</strong>
            </p>
            <p className="mb-1">
              {t('analytics.forecast.mapeDescription')}
            </p>
            <p className="mb-1">
              <strong>{t('analytics.forecast.accuracyExamples')}</strong>
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>MAPE 10% → 90% ({t('analytics.forecast.qualityExcellent').toLowerCase()})</li>
              <li>MAPE 20% → 80% ({t('analytics.forecast.qualityGood').toLowerCase()})</li>
              <li>MAPE 50% → 50% ({t('analytics.forecast.qualityAcceptable').toLowerCase()})</li>
              <li>MAPE 100%+ → 0% ({t('analytics.forecast.qualityLow').toLowerCase()})</li>
            </ul>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

/**
 * Section des recommandations
 */
function RecommendationsSection({ recommendations, t }) {
  const priorityColors = {
    critical: 'border-red-200 bg-red-50',
    high: 'border-orange-200 bg-orange-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50',
    info: 'border-gray-200 bg-gray-50'
  };

  // Helper function to get translated message or fallback
  const getMessage = (rec) => {
    if (rec.messageKey) {
      return t(rec.messageKey, rec.messageParams || {});
    }
    return rec.message;
  };

  const getAction = (rec) => {
    if (rec.actionKey) {
      return t(rec.actionKey, rec.actionParams || {});
    }
    return rec.action;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          {t('analytics.forecast.smartRecommendations')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${priorityColors[rec.priority] || priorityColors.info}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{rec.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-1">
                  {getMessage(rec)}
                </p>
                <p className="text-sm text-gray-700">
                  {getAction(rec)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Graphique simple de prévisions
 */
function ForecastChart({ forecast, salesHistory, t }) {
  // Pour l'instant, un placeholder
  // Tu peux intégrer Recharts ou Chart.js ici plus tard
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          {t('analytics.forecast.forecastVisualization')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">{t('analytics.forecast.chartComingSoon')}</p>
            <p className="text-xs mt-1">
              {t('analytics.forecast.chartComingSoonDesc')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader
 */
function ForecastSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-20 bg-gray-200 rounded" />
      <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
    </div>
  );
}

/**
 * Export des composants individuels pour usage modulaire
 */
export {
  ConfidenceScore,
  ForecastBreakdown,
  DataQualityCard,
  AccuracyCard,
  RecommendationsSection,
  ForecastChart
};

