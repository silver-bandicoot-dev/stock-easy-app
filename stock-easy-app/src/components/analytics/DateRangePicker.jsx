import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, BarChart3, RefreshCw } from 'lucide-react';

export const DateRangePicker = ({ 
  value, 
  onChange, 
  customRange, 
  onCustomRangeChange 
}) => {
  const ranges = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '90d', label: '3 derniers mois' },
    { value: '1y', label: '1 an' },
    { value: 'custom', label: 'Période personnalisée' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-[#191919]" />
        <h3 className="text-lg font-semibold text-[#191919]">Période d'analyse</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              value === range.value
                ? 'bg-black text-white'
                : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {value === 'custom' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"
        >
          <div>
            <label className="block text-sm font-medium text-[#191919] mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={customRange.start}
              onChange={(e) => onCustomRangeChange({ ...customRange, start: e.target.value })}
              className="w-full p-3 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#191919] mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={customRange.end}
              onChange={(e) => onCustomRangeChange({ ...customRange, end: e.target.value })}
              className="w-full p-3 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};
