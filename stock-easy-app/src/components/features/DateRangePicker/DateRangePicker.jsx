import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Calendar } from 'lucide-react';

/**
 * DateRangePicker - Composant moderne pour sélectionner une période
 * @param {string} value - Valeur actuelle ('7d', '30d', '90d', 'custom')
 * @param {function} onChange - Callback pour changement de période
 * @param {object} customRange - { startDate, endDate } pour mode custom
 * @param {function} onCustomRangeChange - Callback pour dates custom
 */
export function DateRangePicker({ 
  value = '30d', 
  onChange, 
  customRange = null,
  onCustomRangeChange 
}) {
  const [showCustomPicker, setShowCustomPicker] = useState(value === 'custom');
  
  // Options de période prédéfinies
  const presets = [
    { value: '7d', label: '7j' },
    { value: '30d', label: '30j' },
    { value: '90d', label: '90j' },
    { value: 'custom', label: 'Personnalisé' }
  ];

  // Gérer le changement de période
  const handlePresetChange = (newValue) => {
    onChange(newValue);
    setShowCustomPicker(newValue === 'custom');
    
    // Si on quitte le mode custom, réinitialiser les dates
    if (newValue !== 'custom' && onCustomRangeChange) {
      onCustomRangeChange(null);
    }
  };

  // Gérer le changement de dates custom
  const handleCustomDateChange = (field, dateValue) => {
    const newRange = {
      startDate: field === 'startDate' ? dateValue : (customRange?.startDate || ''),
      endDate: field === 'endDate' ? dateValue : (customRange?.endDate || '')
    };
    
    // Validation: date de fin >= date de début
    if (newRange.startDate && newRange.endDate) {
      if (new Date(newRange.endDate) < new Date(newRange.startDate)) {
        console.warn('⚠️ La date de fin doit être supérieure ou égale à la date de début');
        return;
      }
    }
    
    onCustomRangeChange(newRange);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium text-[#666663] shrink-0">Période:</span>
      
      {/* Boutons toggle pour les presets */}
      <div className="inline-flex rounded-lg border border-[#E5E4DF] p-1 bg-white">
        {presets.map((preset) => {
          const isActive = value === preset.value;
          
          return (
            <button
              key={preset.value}
              onClick={() => handlePresetChange(preset.value)}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${isActive 
                  ? 'bg-black text-white shadow-sm' 
                  : 'text-[#666663] hover:text-[#191919] hover:bg-[#FAFAF7]'
                }
              `}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      
      {/* Date pickers custom */}
      {showCustomPicker && value === 'custom' && (
        <div className="flex items-center gap-2 animate-fadeIn">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg">
            <Calendar className="w-4 h-4 text-[#666663] shrink-0" />
            <span className="text-xs font-medium text-[#666663]">Du:</span>
            <input
              type="date"
              value={customRange?.startDate || ''}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              max={customRange?.endDate || undefined}
              className="text-sm text-[#191919] font-medium bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg">
            <Calendar className="w-4 h-4 text-[#666663] shrink-0" />
            <span className="text-xs font-medium text-[#666663]">Au:</span>
            <input
              type="date"
              value={customRange?.endDate || ''}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              min={customRange?.startDate || undefined}
              className="text-sm text-[#191919] font-medium bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}

DateRangePicker.propTypes = {
  value: PropTypes.oneOf(['7d', '30d', '90d', 'custom']),
  onChange: PropTypes.func.isRequired,
  customRange: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string
  }),
  onCustomRangeChange: PropTypes.func
};

DateRangePicker.defaultProps = {
  value: '30d',
  customRange: null,
  onCustomRangeChange: () => {}
};

