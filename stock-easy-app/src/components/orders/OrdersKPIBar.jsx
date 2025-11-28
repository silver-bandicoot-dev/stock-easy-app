import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Package, Truck, CheckCircle, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';

// Mapping des clés KPI vers les clés d'onglet
const KPI_TO_TAB = {
  pending: 'pending_confirmation',
  preparing: 'preparing',
  inTransit: 'in_transit',
  received: 'received',
  reconciliation: 'reconciliation'
};

export const OrdersKPIBar = ({ kpis, formatCurrency, onKpiClick, activeTab }) => {
  const kpiItems = [
    {
      key: 'today',
      label: "Aujourd'hui",
      value: kpis.today,
      icon: Calendar,
      color: 'text-[#191919]',
      bgColor: 'bg-[#FAFAF7]',
      borderColor: 'border-[#E5E4DF]',
      clickable: false
    },
    {
      key: 'pending',
      label: 'En Cours',
      value: kpis.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      hoverBgColor: 'hover:bg-yellow-100',
      clickable: true
    },
    {
      key: 'preparing',
      label: 'Préparation',
      value: kpis.preparing,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBgColor: 'hover:bg-blue-100',
      clickable: true
    },
    {
      key: 'inTransit',
      label: 'En Transit',
      value: kpis.inTransit,
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverBgColor: 'hover:bg-purple-100',
      clickable: true
    },
    {
      key: 'received',
      label: 'Reçues',
      value: kpis.received,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverBgColor: 'hover:bg-green-100',
      clickable: true
    },
    {
      key: 'reconciliation',
      label: 'À Réconcilier',
      value: kpis.reconciliation,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      hoverBgColor: 'hover:bg-red-100',
      highlight: kpis.reconciliation > 0,
      clickable: true
    },
    {
      key: 'totalAmount',
      label: 'Total Montant',
      value: formatCurrency(kpis.totalAmount),
      icon: TrendingUp,
      color: 'text-[#191919]',
      bgColor: 'bg-[#FAFAF7]',
      borderColor: 'border-[#E5E4DF]',
      isAmount: true,
      clickable: false
    }
  ];

  const handleClick = (kpi) => {
    if (kpi.clickable && onKpiClick && KPI_TO_TAB[kpi.key]) {
      onKpiClick(KPI_TO_TAB[kpi.key]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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
              {kpi.isAmount ? kpi.value : kpi.value}
            </div>
            <div className="text-xs text-[#666663] truncate">{kpi.label}</div>
            
            {/* Indicateur de filtre actif */}
            {isActiveFilter && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#191919] rounded-full border-2 border-white" />
            )}
            
            {/* Barre de progression subtile */}
            {!kpi.isAmount && kpi.value > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg overflow-hidden">
                <div 
                  className={`h-full ${kpi.color.replace('text-', 'bg-')} opacity-30`}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

