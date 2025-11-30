import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DateRangePicker = ({ 
  value, 
  onChange, 
  customRange, 
  onCustomRangeChange 
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const ranges = [
    { value: 'yesterday', label: t('analytics.period.yesterday') },
    { value: '7d', label: t('analytics.period.last7days') },
    { value: '30d', label: t('analytics.period.last30days') },
    { value: '90d', label: t('analytics.period.last3months') },
    { value: '1y', label: t('analytics.period.lastYear') },
    { value: 'custom', label: t('analytics.period.custom') }
  ];

  const selectedRange = ranges.find(range => range.value === value);

  const handleSelect = (rangeValue) => {
    onChange(rangeValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#191919]" />
          <h3 className="text-sm font-semibold text-[#191919]">{t('analytics.period.title')}</h3>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-sm text-[#191919] flex items-center justify-between hover:border-[#D1D0CB] transition-colors"
          >
            <span>{selectedRange?.label || t('analytics.period.selectPeriod')}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E4DF] rounded-lg shadow-lg z-[100]"
            >
              {ranges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleSelect(range.value)}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-[#FAFAF7] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    value === range.value ? 'bg-[#F0F0EB] text-[#191919]' : 'text-[#666663]'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {value === 'custom' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#666663] mb-1">
                {t('analytics.period.startDate')}
              </label>
              <input
                type="date"
                value={customRange.start}
                onChange={(e) => onCustomRangeChange({ ...customRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666663] mb-1">
                {t('analytics.period.endDate')}
              </label>
              <input
                type="date"
                value={customRange.end}
                onChange={(e) => onCustomRangeChange({ ...customRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};