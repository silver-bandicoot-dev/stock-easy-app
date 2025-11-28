import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Eye, CheckCircle, TrendingUp, Package, RotateCw } from 'lucide-react';

// Mapping des clés KPI vers les clés d'onglet de filtre
const KPI_TO_TAB = {
  urgent: 'urgent',
  warning: 'warning',
  healthy: 'healthy'
};

export const StockKPIBar = ({ 
  urgentCount, 
  warningCount, 
  healthyCount, 
  totalProducts,
  avgRotation,
  onKpiClick, 
  activeTab 
}) => {
  const healthScore = totalProducts > 0 ? Math.round((healthyCount / totalProducts) * 100) : 0;

  const kpiItems = [
    {
      key: 'total',
      label: 'Total Produits',
      value: totalProducts,
      icon: Package,
      color: 'text-[#191919]',
      bgColor: 'bg-[#FAFAF7]',
      borderColor: 'border-[#E5E4DF]',
      clickable: false
    },
    {
      key: 'urgent',
      label: 'Action Immédiate',
      value: urgentCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      hoverBgColor: 'hover:bg-red-100',
      highlight: urgentCount > 0,
      clickable: true
    },
    {
      key: 'warning',
      label: 'À Surveiller',
      value: warningCount,
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverBgColor: 'hover:bg-orange-100',
      clickable: true
    },
    {
      key: 'healthy',
      label: 'En Bonne Santé',
      value: healthyCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverBgColor: 'hover:bg-green-100',
      clickable: true
    },
    {
      key: 'healthScore',
      label: 'Score de Santé',
      value: `${healthScore}%`,
      icon: TrendingUp,
      color: healthScore >= 70 ? 'text-green-600' : healthScore >= 40 ? 'text-orange-600' : 'text-red-600',
      bgColor: healthScore >= 70 ? 'bg-green-50' : healthScore >= 40 ? 'bg-orange-50' : 'bg-red-50',
      borderColor: healthScore >= 70 ? 'border-green-200' : healthScore >= 40 ? 'border-orange-200' : 'border-red-200',
      isPercentage: true,
      clickable: false
    },
    {
      key: 'rotation',
      label: 'Rotation Moy.',
      value: avgRotation ? `${avgRotation.toFixed(1)}x` : 'N/A',
      icon: RotateCw,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      clickable: false
    }
  ];

  const handleClick = (kpi) => {
    if (kpi.clickable && onKpiClick && KPI_TO_TAB[kpi.key]) {
      onKpiClick(KPI_TO_TAB[kpi.key]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpiItems.map((kpi) => {
        const Icon = kpi.icon;
        const isActiveFilter = activeTab && KPI_TO_TAB[kpi.key] === activeTab;
        
        return (
          <motion.div
            key={kpi.key}
            whileHover={kpi.clickable ? { scale: 1.02, y: -2 } : {}}
            whileTap={kpi.clickable ? { scale: 0.98 } : {}}
            onClick={() => handleClick(kpi)}
            className={`relative rounded-lg p-3 border transition-all duration-200 ${kpi.bgColor} ${kpi.borderColor} ${
              kpi.highlight ? 'ring-2 ring-red-300 ring-opacity-50' : ''
            } ${kpi.clickable ? `cursor-pointer ${kpi.hoverBgColor}` : ''} ${
              isActiveFilter ? 'ring-2 ring-[#191919] ring-opacity-40 shadow-md' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Icon className={`w-4 h-4 ${kpi.color}`} />
              {kpi.highlight && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>
            <div className={`text-lg sm:text-xl font-bold ${kpi.color}`}>
              {kpi.value}
            </div>
            <div className="text-xs text-[#666663] truncate">{kpi.label}</div>
            
            {/* Indicateur de filtre actif */}
            {isActiveFilter && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#191919] rounded-full border-2 border-white" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default StockKPIBar;

