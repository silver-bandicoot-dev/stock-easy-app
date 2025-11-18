/**
 * Composant de comparaison Prévisions vs Réalité
 * @module components/ml/PredictionVsReality
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { InfoTooltip, tooltips } from '../ui/InfoTooltip';

export function PredictionVsReality({ comparisonData, product }) {
  // Préparer les données pour le graphique
  const chartData = comparisonData?.map(item => ({
    date: format(new Date(item.date), 'dd/MM', { locale: fr }),
    fullDate: item.date,
    reel: item.actual,
    prevu: item.predicted,
    ecart: item.actual - item.predicted,
    ecartPercent: item.predicted > 0 
      ? ((item.actual - item.predicted) / item.predicted * 100).toFixed(1)
      : 0
  })) || [];

  // Calculer les métriques de performance
  const metrics = calculateMetrics(comparisonData || []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#191919] mb-1">
          Précision des Prévisions
        </h3>
        <p className="text-sm text-[#666663]">
          {product?.name || 'Tous les produits'} - Comparaison sur les 7 derniers jours
        </p>
      </div>

      {/* Métriques de performance */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Précision"
          value={`${metrics.accuracy}%`}
          icon={CheckCircle}
          color={metrics.accuracy >= 80 ? 'green' : metrics.accuracy >= 60 ? 'yellow' : 'red'}
          tooltip={tooltips.mlPrecision}
        />
        <MetricCard
          label="MAE"
          value={metrics.mae.toFixed(2)}
          subtitle="Erreur moyenne"
          icon={AlertCircle}
          color="purple"
          tooltip={tooltips.mlMAE}
        />
        <MetricCard
          label="RMSE"
          value={metrics.rmse.toFixed(2)}
          subtitle="Écart quadratique"
          icon={TrendingUp}
          color="blue"
          tooltip={tooltips.mlRMSE}
        />
        <MetricCard
          label="R²"
          value={metrics.r2.toFixed(3)}
          subtitle="Corrélation"
          icon={CheckCircle}
          color={metrics.r2 >= 0.8 ? 'green' : metrics.r2 >= 0.5 ? 'yellow' : 'red'}
          tooltip={tooltips.mlR2}
        />
      </div>

      {/* Graphique comparatif */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E4DF" />
            <XAxis 
              dataKey="date" 
              stroke="#666663"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#666663"
              style={{ fontSize: '12px' }}
              label={{ value: 'Quantité', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #E5E4DF',
                borderRadius: '8px',
                padding: '12px'
              }}
              formatter={(value, name) => {
                if (name === 'Écart') return [`${value > 0 ? '+' : ''}${value}`, name];
                return [value, name];
              }}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#666663" strokeDasharray="3 3" />
            
            <Bar dataKey="reel" fill="#3b82f6" name="Réel" radius={[4, 4, 0, 0]} />
            <Bar dataKey="prevu" fill="#8b5cf6" name="Prévu" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ecart" fill="#f59e0b" name="Écart" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12 text-[#666663]">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Pas encore de données de comparaison</p>
          <p className="text-sm mt-2">Les prévisions seront comparées aux ventes réelles au fil du temps</p>
        </div>
      )}

      {/* Insights sur la précision */}
      {chartData.length > 0 && (
        <div className="mt-6 p-4 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]">
          <p className="text-sm font-medium text-[#191919] mb-2">📊 Analyse de Précision</p>
          <p className="text-sm text-[#666663]">
            {metrics.accuracy >= 80 
              ? "✅ Excellente précision ! Le modèle prédit la demande avec une grande fiabilité."
              : metrics.accuracy >= 60
              ? "⚠️ Précision acceptable. Le modèle peut être amélioré avec plus de données."
              : "❌ Précision faible. Réentraînement recommandé avec plus de données historiques."
            }
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Carte métrique pour afficher un indicateur
 */
function MetricCard({ label, value, subtitle, icon: Icon, color, tooltip }) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200'
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color] || colorClasses.purple}`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-4 h-4" />}
        <p className="text-xs font-medium uppercase">{label}</p>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs mt-1 opacity-75">{subtitle}</p>}
    </div>
  );
}

/**
 * Calcule les métriques de performance du modèle
 * @param {Array} comparisonData - [{date, actual, predicted}, ...]
 * @returns {Object} Métriques {mae, rmse, r2, accuracy}
 */
function calculateMetrics(comparisonData) {
  if (!comparisonData || comparisonData.length === 0) {
    return { mae: 0, rmse: 0, r2: 0, accuracy: 0 };
  }

  const n = comparisonData.length;
  const actual = comparisonData.map(d => d.actual);
  const predicted = comparisonData.map(d => d.predicted);

  // MAE - Mean Absolute Error
  const mae = actual.reduce((sum, val, i) => 
    sum + Math.abs(val - predicted[i]), 0
  ) / n;

  // RMSE - Root Mean Square Error
  const mse = actual.reduce((sum, val, i) => 
    sum + Math.pow(val - predicted[i], 2), 0
  ) / n;
  const rmse = Math.sqrt(mse);

  // R² - Coefficient de détermination
  const meanActual = actual.reduce((a, b) => a + b, 0) / n;
  const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
  const ssResidual = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  // Accuracy - Pourcentage de prédictions dans une marge de 20%
  const accurateCount = actual.filter((val, i) => {
    const error = Math.abs(val - predicted[i]);
    const errorPercent = val > 0 ? (error / val) : 0;
    return errorPercent <= 0.2; // Erreur < 20%
  }).length;
  const accuracy = (accurateCount / n) * 100;

  return {
    mae: mae,
    rmse: rmse,
    r2: Math.max(0, r2), // R² peut être négatif si modèle très mauvais
    accuracy: Math.round(accuracy)
  };
}












