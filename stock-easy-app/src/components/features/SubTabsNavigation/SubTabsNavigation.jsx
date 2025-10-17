import React from 'react';
import { Settings, Package, Truck, Activity } from 'lucide-react';

/**
 * Composant SubTabsNavigation - Navigation par onglets pour les paramètres
 * @param {Object} props
 * @param {string} props.activeSubTab - ID de l'onglet actif
 * @param {Function} props.onSubTabChange - Callback lors du changement d'onglet
 * @returns {JSX.Element}
 */
export function SubTabsNavigation({ activeSubTab, onSubTabChange }) {
  const subTabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
    { id: 'mapping', label: 'Mapping', icon: Activity }
  ];
  
  return (
    <div className="flex gap-2 border-b border-[#E5E4DF] mb-6 overflow-x-auto">
      {subTabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeSubTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onSubTabChange(tab.id)}
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

