import React from 'react';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { InfoTooltip } from '../../ui/InfoTooltip';

/**
 * ComparisonSelector - Composant pour choisir le type de comparaison des KPIs
 * @param {string} value - Type de comparaison actuel ('previous' | 'year_ago' | 'average')
 * @param {function} onChange - Callback avec la nouvelle valeur
 * @param {boolean} disabled - Si true, désactive les options
 */
export function ComparisonSelector({ 
  value = 'previous', 
  onChange,
  disabled = false 
}) {
  // Options de comparaison disponibles
  const comparisonOptions = [
    {
      value: 'previous',
      label: 'Période équivalente',
      icon: TrendingUp,
      tooltip: 'Compare avec la période équivalente précédente (ex: les 30 jours avant les 30 derniers jours)',
      available: true
    },
    {
      value: 'year_ago',
      label: 'Année dernière',
      icon: Calendar,
      tooltip: 'Compare avec la même période l\'année dernière (nécessite 1 an d\'historique)',
      available: true // Peut être désactivé si pas assez d'historique
    },
    {
      value: 'average',
      label: 'Moyenne historique',
      icon: BarChart3,
      tooltip: 'Compare avec la moyenne de toutes les périodes similaires enregistrées',
      available: true // Peut être désactivé si pas assez d'historique
    }
  ];

  // Gérer le changement de type de comparaison
  const handleChange = (newValue) => {
    if (!disabled) {
      console.log('📊 Changement du type de comparaison:', newValue);
      onChange(newValue);
    }
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <label className="text-sm font-medium text-[#666663]">
        Comparer avec:
      </label>
      
      <div className="flex gap-2 flex-wrap">
        {comparisonOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          const isDisabled = disabled || !option.available;
          
          return (
            <button
              key={option.value}
              onClick={() => handleChange(option.value)}
              disabled={isDisabled}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 
                font-medium text-sm transition-all duration-200
                ${isSelected 
                  ? 'bg-[#191919] text-white border-[#191919]' 
                  : 'bg-white text-[#666663] border-[#E5E4DF] hover:border-[#191919] hover:text-[#191919]'
                }
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#666663]'}`} />
              <span>{option.label}</span>
              <InfoTooltip content={option.tooltip} />
            </button>
          );
        })}
      </div>
      
      {/* Message d'aide pour mode personnalisé */}
      {disabled && (
        <p className="text-xs text-[#666663] italic">
          ℹ️ Les options de comparaison sont limitées en mode personnalisé
        </p>
      )}
    </div>
  );
}

ComparisonSelector.defaultProps = {
  value: 'previous',
  disabled: false
};

