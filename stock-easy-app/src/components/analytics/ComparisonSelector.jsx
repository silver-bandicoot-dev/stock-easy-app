import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

export const ComparisonSelector = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const comparisons = [
    { value: 'previous', label: 'Période précédente', icon: TrendingUp },
    { value: 'same_last_year', label: 'Même période l\'an dernier', icon: TrendingDown }
  ];

  const selectedComparison = comparisons.find(comparison => comparison.value === value);

  const handleSelect = (comparisonValue) => {
    onChange(comparisonValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#191919]" />
          <h3 className="text-sm font-semibold text-[#191919]">Comparaison</h3>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-sm flex items-center justify-between transition-colors ${
              disabled 
                ? 'text-gray-400 cursor-not-allowed border-gray-200' 
                : 'text-[#191919] hover:border-[#D1D0CB]'
            }`}
          >
            <span>{selectedComparison?.label || 'Sélectionner une comparaison'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-gray-400' : ''}`} />
          </button>

          {isOpen && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E4DF] rounded-lg shadow-lg z-[100]"
            >
              {comparisons.map((comparison) => {
                const Icon = comparison.icon;
                // Seule la "Période précédente" est désactivée avec une période personnalisée
                const isDisabled = disabled && comparison.value === 'previous';
                return (
                  <button
                    key={comparison.value}
                    onClick={() => handleSelect(comparison.value)}
                    disabled={isDisabled}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-[#FAFAF7] transition-colors flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg ${
                      value === comparison.value 
                        ? 'bg-[#F0F0EB] text-[#191919]' 
                        : isDisabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-[#666663]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {comparison.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};