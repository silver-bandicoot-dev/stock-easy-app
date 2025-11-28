import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { InfoTooltip } from '../../ui/InfoTooltip';
import { motion } from 'framer-motion';

/**
 * Composant KPICard - Style Shopify : sobre, neutre, efficace
 * Couleurs : noir/blanc/gris avec accents sémantiques minimaux
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

  // Couleur du graphique - sobre (gris par défaut)
  const chartColor = isCritical ? '#D72C0D' : '#5C5F62';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        group relative bg-white rounded-lg border p-4
        transition-all duration-200 h-full flex flex-col
        ${isCritical ? 'border-[#FED3D1] bg-[#FFF4F4]' : 'border-[#E1E3E5] hover:border-[#8A8C8E]'}
        ${isClickable ? 'cursor-pointer hover:shadow-sm' : ''}
      `}
      onClick={onClick}
    >
      {/* Badge critique - discret */}
      {isCritical && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-medium text-[#D72C0D] bg-[#FED3D1] px-1.5 py-0.5 rounded">
            Action requise
          </span>
        </div>
      )}
      
      {/* En-tête */}
      <div className="flex items-start gap-2.5 mb-3">
        {Icon && (
          <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
            isCritical ? 'bg-[#FED3D1]' : 'bg-[#F6F6F7]'
          }`}>
            <Icon className={`w-4 h-4 ${isCritical ? 'text-[#D72C0D]' : 'text-[#5C5F62]'}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="text-xs font-medium text-[#6B7177] truncate">
              {title}
            </h3>
            <InfoTooltip content={description} />
          </div>
        </div>
      </div>
      
      {/* Valeur principale */}
      <div className="flex-1 mb-2">
        <div className="text-xl font-semibold text-[#191919] leading-tight">
          {typeof value === 'string' && value.includes('(') && value.includes(')') ? (
            <>
              {value.split('(')[0]}
              <span className="text-xs font-normal text-[#6B7177] ml-1">
                ({value.split('(')[1].split(')')[0]})
              </span>
            </>
          ) : (
            value
          )}
        </div>
        
        {/* Indicateur de changement - Style Shopify */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`inline-flex items-center text-xs font-medium ${
            isGood ? 'text-[#008060]' : 'text-[#D72C0D]'
          }`}>
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {typeof changePercent === 'number' ? Math.abs(changePercent).toFixed(1) : Math.abs(changePercent)}%
          </span>
          <span className="text-[10px] text-[#8C9196]">
            vs {comparisonPeriod || 'sem. préc.'}
          </span>
        </div>
      </div>
      
      {/* Graphique sparkline - sobre */}
      <div className="h-10 mt-auto">
        <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.1" />
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
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </motion.div>
  );
}

