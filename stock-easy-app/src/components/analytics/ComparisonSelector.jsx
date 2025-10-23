import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export const ComparisonSelector = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const comparisons = [
    { value: 'previous', label: 'Période précédente', icon: TrendingUp },
    { value: 'same_last_year', label: 'Même période l\'an dernier', icon: TrendingDown },
    { value: 'none', label: 'Aucune comparaison', icon: BarChart3 }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-5 h-5 text-[#191919]" />
        <h3 className="text-lg font-semibold text-[#191919]">Comparaison</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {comparisons.map((comparison) => {
          const Icon = comparison.icon;
          return (
            <button
              key={comparison.value}
              onClick={() => onChange(comparison.value)}
              disabled={disabled}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                value === comparison.value
                  ? 'bg-black text-white'
                  : disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {comparison.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
