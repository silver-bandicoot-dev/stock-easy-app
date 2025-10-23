import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

export const KPICard = ({ 
  title, 
  value, 
  change, 
  changePercent, 
  icon: Icon, 
  color = 'blue',
  isLoading = false 
}) => {
  const getColorClasses = (color) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          value: 'text-green-700',
          change: 'text-green-600'
        };
      case 'red':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          value: 'text-red-700',
          change: 'text-red-600'
        };
      case 'orange':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: 'text-orange-600',
          value: 'text-orange-700',
          change: 'text-orange-600'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          icon: 'text-purple-600',
          value: 'text-purple-700',
          change: 'text-purple-600'
        };
      default: // blue
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          value: 'text-blue-700',
          change: 'text-blue-600'
        };
    }
  };

  const colors = getColorClasses(color);

  const getChangeIcon = () => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getChangeColor = () => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 h-full"
      >
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-[#666663]" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center border ${colors.border} shrink-0`}>
          <Icon className={`w-6 h-6 ${colors.icon} shrink-0`} />
        </div>
        <div className={`flex items-center gap-1 ${getChangeColor()}`}>
          {getChangeIcon()}
          <span className="text-sm font-medium">
            {changePercent !== undefined ? `${changePercent.toFixed(1)}%` : 'N/A'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[#666663]">{title}</h3>
        <p className={`text-2xl font-bold ${colors.value}`}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </p>
        {change !== undefined && (
          <p className={`text-sm ${getChangeColor()}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}
          </p>
        )}
      </div>
    </motion.div>
  );
};
