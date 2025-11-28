import React from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, Users, Warehouse, AlertTriangle, TrendingUp } from 'lucide-react';

export const ActionsKPIBar = ({ 
  productsToOrder = 0,
  totalInvestment = 0,
  suppliersCount = 0,
  urgentCount = 0,
  formatCurrency,
  onKpiClick
}) => {
  const kpiItems = [
    {
      key: 'products',
      label: 'Produits à commander',
      value: productsToOrder,
      icon: Package,
      color: 'text-[#191919]',
      bgColor: 'bg-[#FAFAF7]',
      borderColor: 'border-[#E5E4DF]',
      clickable: false
    },
    {
      key: 'urgent',
      label: 'Urgents',
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
      key: 'investment',
      label: 'Investissement',
      value: formatCurrency ? formatCurrency(totalInvestment) : `${totalInvestment.toFixed(2)} €`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      isAmount: true,
      clickable: false
    },
    {
      key: 'suppliers',
      label: 'Fournisseurs',
      value: suppliersCount,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      clickable: false
    }
  ];

  const handleClick = (kpi) => {
    if (kpi.clickable && onKpiClick) {
      onKpiClick(kpi.key);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpiItems.map((kpi) => {
        const Icon = kpi.icon;
        
        return (
          <motion.div
            key={kpi.key}
            whileHover={kpi.clickable ? { scale: 1.02, y: -2 } : {}}
            whileTap={kpi.clickable ? { scale: 0.98 } : {}}
            onClick={() => handleClick(kpi)}
            className={`relative rounded-lg p-3 border transition-all duration-200 ${kpi.bgColor} ${kpi.borderColor} ${
              kpi.highlight ? 'ring-2 ring-red-300 ring-opacity-50' : ''
            } ${kpi.clickable ? `cursor-pointer ${kpi.hoverBgColor}` : ''}`}
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
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActionsKPIBar;

