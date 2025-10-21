import React from 'react';

/**
 * Composant SubTabsNavigation - Navigation par onglets réutilisable
 * @param {Object} props
 * @param {Array} props.tabs - Tableau des onglets {id, label, icon}
 * @param {string} props.activeTab - ID de l'onglet actif
 * @param {Function} props.onChange - Callback lors du changement d'onglet
 * @returns {JSX.Element}
 */
export function SubTabsNavigation({ tabs, activeTab, onChange }) {
  // Si pas de tabs fourni, ne rien afficher
  if (!tabs || tabs.length === 0) {
    return null;
  }
  
  return (
    <div className="flex gap-2 border-b border-[#E5E4DF] mb-6 overflow-x-auto">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap
              ${isActive 
                ? 'text-[#8B5CF6] border-b-2 border-[#8B5CF6]' 
                : 'text-[#666663] hover:text-[#191919] hover:bg-[#FAFAF7]'
              }
            `}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

