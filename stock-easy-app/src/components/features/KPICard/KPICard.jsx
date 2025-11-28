import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { InfoTooltip } from '../../ui/InfoTooltip';
import { motion } from 'framer-motion';

/**
 * Composant KPICard - Carte d'indicateur clé de performance avec graphique violet
 */
export function KPICard({ title, value, change, changePercent, trend, description, chartData, comparisonPeriod, onClick, isCritical, icon: Icon }) {
  const isPositive = trend === 'up';
  const isGood = (title.includes('Disponibilité') && isPositive) || 
                 (title.includes('Perdues') && !isPositive) ||
                 (title.includes('Surstocks') && !isPositive) ||
                 (title.includes('Commander') && !isPositive);
  
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
  
  const gradientId = React.useMemo(() => {
    const sanitized = title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase() + '-' + Math.random().toString(36).substr(2, 9);
    return `gradient-fill-${sanitized}`;
  }, [title]);

  // Couleur du graphique - VIOLET par défaut, rouge si critique
  const chartColor = isCritical ? '#D72C0D' : '#8B5CF6';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        group relative bg-white rounded-xl shadow-sm border p-6
        transition-all duration-200 h-full flex flex-col
        ${isCritical ? 'border-[#FED3D1] bg-[#FFF4F4]' : 'border-[#E5E4DF] hover:shadow-md'}
        ${isClickable ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Badge critique */}
      {isCritical && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-medium text-[#D72C0D] bg-[#FED3D1] px-1.5 py-0.5 rounded">
            Action requise
          </span>
        </div>
      )}
      
      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {Icon && (
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isCritical ? 'bg-[#FED3D1]' : 'bg-[#F6F6F7]'
              }`}>
                <Icon className={`w-4 h-4 ${isCritical ? 'text-[#D72C0D]' : 'text-[#666663]'}`} />
              </div>
            )}
            <h3 className="text-sm font-medium text-[#666663]">{title}</h3>
            <InfoTooltip content={description} />
          </div>
          
          {/* Valeur principale */}
          <div className="text-3xl font-bold text-[#191919] mb-1">
            {typeof value === 'string' && value.includes('(') && value.includes(')') ? (
              <>
                {value.split('(')[0]}
                <span className="text-sm font-normal text-[#666663] ml-1">
                  ({value.split('(')[1].split(')')[0]})
                </span>
              </>
            ) : (
              value
            )}
          </div>
          
          {/* Indicateur de changement */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-flex items-center gap-1 ${isGood ? 'text-green-600' : 'text-[#EF1C43]'}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4 shrink-0" /> : <ArrowDownRight className="w-4 h-4 shrink-0" />}
              {typeof changePercent === 'number' ? Math.abs(changePercent).toFixed(1) : Math.abs(changePercent)}%
            </span>
            <span className="text-[#666663]">vs {comparisonPeriod || 'période précédente'}</span>
          </div>
        </div>
      </div>
      
      {/* Graphique sparkline - VIOLET */}
      <div className="h-20 mt-auto">
        <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polygon
            fill={`url(#${gradientId})`}
            points={`0,80 ${points} 300,80`}
          />
          <polyline
            fill="none"
            stroke={chartColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </motion.div>
  );
}
