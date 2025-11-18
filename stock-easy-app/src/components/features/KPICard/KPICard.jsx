import React from 'react';
import { ArrowUpRight, ArrowDownRight, Maximize2, AlertCircle } from 'lucide-react';
import { InfoTooltip } from '../../ui/InfoTooltip';
import { motion } from 'framer-motion';

/**
 * Composant KPICard - Carte d'indicateur clé de performance avec graphique amélioré
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
 * @param {boolean} props.isCritical - Indique si le KPI est critique
 * @param {React.Component} props.icon - Icône du KPI
 * @returns {JSX.Element}
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
  
  // Générer un ID unique pour le gradient basé sur le titre (en remplaçant les caractères spéciaux)
  const gradientId = React.useMemo(() => {
    const sanitized = title
      .replace(/[^a-zA-Z0-9\s]/g, '') // Supprimer les caractères spéciaux
      .replace(/\s+/g, '-')
      .toLowerCase() + '-' + Math.random().toString(36).substr(2, 9);
    return `gradient-fill-${sanitized}`;
  }, [title]);
  
  // Dégradé selon le type de KPI
  const getGradientClass = () => {
    if (isCritical) return 'from-red-50 to-red-100/50';
    if (title.includes('Valeur')) return 'from-blue-50 to-purple-50';
    if (title.includes('Commandes')) return 'from-indigo-50 to-blue-50';
    if (title.includes('Critiques')) return 'from-orange-50 to-red-50';
    if (title.includes('Perdues')) return 'from-rose-50 to-red-50';
    return 'from-purple-50 to-indigo-50';
  };
  
  // Couleur du graphique - toujours en violet
  const getChartColor = () => {
    return '#8B5CF6';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`
        group relative rounded-xl shadow-sm border border-[#E5E4DF] p-6 
        transition-all duration-300 h-full flex flex-col overflow-hidden
        bg-gradient-to-br ${getGradientClass()}
        ${isClickable ? 'hover:shadow-xl hover:border-[#191919] cursor-pointer' : 'hover:shadow-lg'}
      `}
      onClick={onClick}
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 -translate-x-full" />
      
      {/* Badge d'alerte si critique */}
      {isCritical && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-3 right-3"
        >
          <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
            <AlertCircle className="w-3 h-3" />
            <span>Urgent</span>
          </div>
        </motion.div>
      )}
      
      {/* Indicateur visuel de cliquabilité */}
      {isClickable && !isCritical && (
        <div className="absolute top-4 right-4 text-[#666663] opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Maximize2 className="w-4 h-4" />
        </div>
      )}
      
      {/* En-tête avec icône et titre */}
      <div className="flex items-center gap-3 mb-4 relative z-10">
        {Icon && (
          <div className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm border border-white/50 shrink-0">
            <Icon className={`w-6 h-6 ${isCritical ? 'text-red-600' : isGood ? 'text-green-600' : 'text-purple-600'}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#191919] truncate inline-flex items-center gap-2">
            <span>{title}</span>
            <InfoTooltip content={description} />
          </h3>
        </div>
      </div>
      
      <div className="flex items-start justify-between mb-4 flex-1 relative z-10">
        <div className="flex-1">
          {/* Vérifier si la valeur contient des parenthèses pour afficher la partie secondaire en plus petit */}
          {typeof value === 'string' && value.includes('(') && value.includes(')') ? (
            <div className="text-3xl font-bold text-[#191919] mb-2 tracking-tight">
              {value.split('(')[0]}
              <span className="text-xs font-medium text-[#666663] ml-1">
                ({value.split('(')[1].split(')')[0]})
              </span>
            </div>
          ) : (
            <div className="text-3xl font-bold text-[#191919] mb-2 tracking-tight">{value}</div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-flex items-center gap-1 font-semibold ${
              isGood ? 'text-green-600' : 'text-[#EF1C43]'
            }`}>
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              ) : (
                <ArrowDownRight className="w-4 h-4 shrink-0" />
              )}
              {typeof changePercent === 'number' ? Math.abs(changePercent).toFixed(1) : Math.abs(changePercent)}%
            </span>
            <span className="text-[#666663] text-xs">
              vs {comparisonPeriod || 'période précédente'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Graphique amélioré */}
      <div className="h-20 mt-auto relative z-10">
        <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
          {/* Zone de remplissage sous la courbe */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <polygon
            fill={`url(#${gradientId})`}
            points={`0,80 ${points} 300,80`}
          />
          <polyline
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </motion.div>
  );
}

