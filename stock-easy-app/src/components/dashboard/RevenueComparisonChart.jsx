import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import { useRevenueComparison } from '../../hooks/useRevenueComparison';
import { useCurrency } from '../../contexts/CurrencyContext';

/**
 * RevenueComparisonChart - Graphique CA Réalisé vs Objectifs
 * 
 * Affiche un graphique combiné (barres + lignes) comparant :
 * - CA réalisé par mois (barres)
 * - Objectif avec multiplicateur par défaut (ligne pointillée)
 * - Objectif avec multiplicateur ML moyen (ligne continue)
 */
export function RevenueComparisonChart({ className = '' }) {
  const { data, summary, loading, error, hasEnoughData, hasAnyRevenue, refetch } = useRevenueComparison(12);
  const { format: formatCurrency } = useCurrency();

  // Couleurs du thème
  const colors = {
    actualRevenue: '#8B5CF6',      // Violet - CA réalisé
    targetDefault: '#9CA3AF',      // Gris - Objectif défaut
    targetML: '#10B981',           // Vert - Objectif ML
    currentMonth: '#C4B5FD',       // Violet clair - Mois en cours
    grid: '#F1F1F1',
    text: '#6B7177',
    textDark: '#191919'
  };

  // Formater les montants pour l'affichage
  const formatAmount = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K€`;
    }
    return `${value.toFixed(0)}€`;
  };

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload;
    if (!dataPoint) return null;

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-[#E1E3E5] min-w-[220px]">
        <p className="font-semibold text-[#191919] mb-3 pb-2 border-b border-[#E1E3E5]">
          {dataPoint.label}
          {dataPoint.isCurrentMonth && (
            <span className="ml-2 text-xs font-normal text-[#6B7177]">(en cours)</span>
          )}
        </p>
        
        {/* CA Réalisé */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#6B7177]">CA Réalisé</span>
          <span className="font-semibold text-[#191919]">
            {formatCurrency ? formatCurrency(dataPoint.actualRevenue) : formatAmount(dataPoint.actualRevenue)}
          </span>
        </div>
        
        <div className="border-t border-[#E1E3E5] my-2 pt-2">
          {/* Objectif Défaut */}
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-[#6B7177]">Obj. Défaut (×{dataPoint.defaultMultiplier})</span>
            <span className="text-sm text-[#6B7177]">
              {formatCurrency ? formatCurrency(dataPoint.targetDefault) : formatAmount(dataPoint.targetDefault)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#6B7177]">Écart</span>
            <span className={`text-xs font-medium ${dataPoint.varianceDefaultPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {dataPoint.varianceDefaultPct >= 0 ? '+' : ''}{dataPoint.varianceDefaultPct}%
              {dataPoint.varianceDefaultPct >= 0 ? ' ▲' : ' ▼'}
            </span>
          </div>
          
          {/* Objectif ML */}
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-[#6B7177]">Obj. ML (×{dataPoint.avgMLMultiplier})</span>
            <span className="text-sm text-[#6B7177]">
              {formatCurrency ? formatCurrency(dataPoint.targetML) : formatAmount(dataPoint.targetML)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6B7177]">Écart</span>
            <span className={`text-xs font-medium ${dataPoint.varianceMLPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {dataPoint.varianceMLPct >= 0 ? '+' : ''}{dataPoint.varianceMLPct}%
              {dataPoint.varianceMLPct >= 0 ? ' ▲' : ' ▼'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Légende personnalisée
  const CustomLegend = () => (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.actualRevenue }} />
        <span className="text-[#6B7177]">CA Réalisé</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: colors.targetDefault }} />
        <span className="text-[#6B7177]">Obj. Défaut</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-0.5" style={{ backgroundColor: colors.targetML }} />
        <span className="text-[#6B7177]">Obj. ML</span>
      </div>
    </div>
  );

  // État de chargement
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-[#E1E3E5] overflow-hidden ${className}`}>
        <div className="border-b border-[#E1E3E5] px-4 py-3">
          <div className="h-4 w-48 bg-[#F1F1F1] rounded animate-pulse" />
        </div>
        <div className="p-4">
          <div className="h-[300px] flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-[#6B7177] animate-spin" />
            <span className="ml-2 text-sm text-[#6B7177]">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-[#E1E3E5] overflow-hidden ${className}`}>
        <div className="border-b border-[#E1E3E5] px-4 py-3">
          <h3 className="text-xs font-medium text-[#6B7177]">Chiffre d'Affaires vs Objectifs</h3>
        </div>
        <div className="p-4">
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-sm text-[#6B7177] mb-3">Erreur lors du chargement des données</p>
            <button
              onClick={refetch}
              className="text-xs text-[#8B5CF6] hover:underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pas assez de données
  if (!hasEnoughData || !hasAnyRevenue) {
    return (
      <div className={`bg-white rounded-lg border border-[#E1E3E5] overflow-hidden ${className}`}>
        <div className="border-b border-[#E1E3E5] px-4 py-3">
          <h3 className="text-xs font-medium text-[#6B7177]">Chiffre d'Affaires vs Objectifs</h3>
        </div>
        <div className="p-4">
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-10 h-10 text-[#D1D5DB] mb-3" />
            <p className="text-sm font-medium text-[#191919] mb-1">Données insuffisantes</p>
            <p className="text-xs text-[#6B7177] max-w-[280px]">
              Ce graphique nécessite au moins 2 mois d'historique de ventes pour afficher des comparaisons.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-[#E1E3E5] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="border-b border-[#E1E3E5] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-[#6B7177]">
            Chiffre d'Affaires vs Objectifs
          </h3>
          <span className="text-[10px] text-[#9CA3AF] bg-[#F6F6F7] px-1.5 py-0.5 rounded">
            12 mois
          </span>
        </div>
        
        {/* Résumé rapide */}
        {summary && (
          <div className="hidden sm:flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-[#6B7177]">YTD:</span>
              <span className="font-semibold text-[#191919]">
                {formatCurrency ? formatCurrency(summary.ytdRevenue) : formatAmount(summary.ytdRevenue)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#6B7177]">Précision ML:</span>
              <span className={`font-semibold ${summary.mlIsBetter ? 'text-emerald-600' : 'text-[#191919]'}`}>
                {summary.mlAccuracyPct.toFixed(1)}%
                {summary.mlIsBetter && ' ✓'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Graphique */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="0" stroke={colors.grid} vertical={false} />
            
            <XAxis
              dataKey="label"
              stroke="transparent"
              fontSize={10}
              tick={{ fill: colors.text }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            
            <YAxis
              stroke="transparent"
              fontSize={10}
              tick={{ fill: colors.text }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAmount}
              width={50}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Barres - CA Réalisé */}
            <Bar
              dataKey="actualRevenue"
              name="CA Réalisé"
              radius={[4, 4, 0, 0]}
              barSize={24}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isCurrentMonth ? colors.currentMonth : colors.actualRevenue}
                />
              ))}
            </Bar>
            
            {/* Ligne - Objectif Défaut */}
            <Line
              type="monotone"
              dataKey="targetDefault"
              name="Obj. Défaut"
              stroke={colors.targetDefault}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, fill: colors.targetDefault }}
            />
            
            {/* Ligne - Objectif ML */}
            <Line
              type="monotone"
              dataKey="targetML"
              name="Obj. ML"
              stroke={colors.targetML}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: colors.targetML }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        <CustomLegend />
      </div>

      {/* Footer avec résumé détaillé */}
      {summary && summary.monthsWithData >= 3 && (
        <div className="border-t border-[#E1E3E5] px-4 py-3 bg-[#FAFAFA]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[#6B7177]">Précision Mult. Défaut: </span>
                <span className="font-medium text-[#191919]">±{(100 - summary.defaultAccuracyPct).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-[#6B7177]">Précision Mult. ML: </span>
                <span className={`font-medium ${summary.mlIsBetter ? 'text-emerald-600' : 'text-[#191919]'}`}>
                  ±{(100 - summary.mlAccuracyPct).toFixed(1)}%
                </span>
              </div>
            </div>
            {summary.mlIsBetter && (
              <div className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                <span className="font-medium">ML +{summary.accuracyDiff}% plus précis</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RevenueComparisonChart;

