import React from 'react';
import { ArrowUpRight, ArrowDownRight, Maximize2 } from 'lucide-react';
import { InfoTooltip } from '../../ui/InfoTooltip';

/**
 * Composant KPICard - Carte d'indicateur clé de performance avec graphique
 * @param {Object} props
 * @param {string} props.title - Titre du KPI
 * @param {string|number} props.value - Valeur principale
 * @param {number} props.change - Changement numérique
 * @param {number} props.changePercent - Changement en pourcentage
 * @param {'up'|'down'} props.trend - Tendance du KPI
 * @param {string} props.description - Description du tooltip
 * @param {number[]} props.chartData - Données du graphique (0-100)
 * @param {string} props.comparisonPeriod - Label de la période de comparaison
 * @param {function} props.onClick - Callback au clic (optionnel)
 * @returns {JSX.Element}
 */
export function KPICard({ title, value, change, changePercent, trend, description, chartData, comparisonPeriod, onClick }) {
  const isPositive = trend === 'up';
  const isGood = (title.includes('Disponibilité') && isPositive) || 
                 (title.includes('Perdues') && !isPositive) ||
                 (title.includes('Surstocks') && !isPositive);
  
  const isClickable = !!onClick;
  const safeChartData = Array.isArray(chartData)
    ? (chartData.length > 1 ? chartData : chartData.length === 1 ? [chartData[0], chartData[0]] : [0, 0])
    : [0, 0];
  const points = safeChartData
    .map((val, i) => {
      const x = safeChartData.length > 1 ? (i / (safeChartData.length - 1)) * 300 : 0;
      const y = 80 - (Math.min(Math.max(val, 0), 100) / 100) * 80;
      return `${x},${y}`;
    })
    .join(' ');
  const tooltipDescription = description || 'Indicateur clé';
  
  return (
    <div 
      className={`
        group relative bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 
        transition-all h-full flex flex-col
        ${isClickable ? 'hover:shadow-lg hover:border-[#191919] cursor-pointer' : 'hover:shadow-md'}
      `}
      onClick={onClick}
    >
      {/* Indicateur visuel de cliquabilité */}
      {isClickable && (
        <div className="absolute top-4 right-4 text-[#666663] opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-4 h-4" />
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4 flex-1">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-[#666663]">{title}</h3>
            <InfoTooltip content={description} />
          </div>
          <div className="text-3xl font-bold text-[#191919] mb-1">{value}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-flex items-center gap-1 ${isGood ? 'text-green-600' : 'text-[#EF1C43]'}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4 shrink-0" /> : <ArrowDownRight className="w-4 h-4 shrink-0" />}
              {Math.abs(changePercent)}%
            </span>
            <span className="text-[#666663]">
              vs {comparisonPeriod || 'période précédente'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="h-20 mt-auto">
        <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            points={points}
          />
        </svg>
      </div>
    </div>
  );
}

