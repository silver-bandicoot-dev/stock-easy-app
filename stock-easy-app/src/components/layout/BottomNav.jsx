import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Truck, 
  Activity, 
  MoreHorizontal,
  TrendingUp,
  Settings
} from 'lucide-react';

/**
 * Bottom Navigation pour mobile
 * Remplace la sidebar sur les petits écrans pour une meilleure UX
 */
const BottomNav = ({ 
  activeTab, 
  setActiveTab, 
  orderBadgeCount = 0,
  ordersBadgeCount = 0,
  onMoreClick // Pour ouvrir le menu complet
}) => {
  // Items principaux (5 max pour la bottom nav)
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Accueil', 
      icon: Package,
      badge: null
    },
    { 
      id: 'actions', 
      label: 'Commander', 
      icon: Plus,
      badge: orderBadgeCount > 0 ? orderBadgeCount : null,
      badgeColor: 'bg-rose-500'
    },
    { 
      id: 'orders', 
      label: 'Commandes', 
      icon: Truck,
      badge: ordersBadgeCount > 0 ? ordersBadgeCount : null,
      badgeColor: 'bg-indigo-500'
    },
    { 
      id: 'stock-level', 
      label: 'Stock', 
      icon: Activity,
      badge: null
    },
    { 
      id: 'more', 
      label: 'Plus', 
      icon: MoreHorizontal,
      badge: null,
      isMore: true
    },
  ];

  const handleItemClick = (item) => {
    if (item.isMore) {
      onMoreClick?.();
    } else {
      setActiveTab(item.id);
    }
  };

  // Déterminer si "Plus" est actif (analytics ou settings)
  const isMoreActive = ['analytics', 'settings', 'profile'].includes(activeTab);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E4DF] safe-area-bottom">
      {/* Gradient top border pour effet premium */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#191919]/10 to-transparent" />
      
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isMore ? isMoreActive : activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[64px] group"
            >
              {/* Indicateur actif */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#191919] rounded-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              {/* Icône avec badge */}
              <div className="relative">
                <Icon 
                  className={`w-6 h-6 transition-colors ${
                    isActive 
                      ? 'text-[#191919]' 
                      : 'text-[#666663] group-hover:text-[#191919]'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Badge */}
                {item.badge && (
                  <span 
                    className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1 ${item.badgeColor || 'bg-[#191919]'}`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span 
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  isActive 
                    ? 'text-[#191919]' 
                    : 'text-[#666663] group-hover:text-[#191919]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Safe area pour les iPhones avec encoche */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
};

/**
 * Menu "Plus" en modal pour les options supplémentaires
 */
export const BottomNavMoreMenu = ({ 
  isOpen, 
  onClose, 
  activeTab,
  setActiveTab,
  analyticsSubTab,
  setAnalyticsSubTab,
  settingsSubTab,
  setSettingsSubTab
}) => {
  if (!isOpen) return null;

  const moreItems = [
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: TrendingUp,
      subItems: [
        { id: 'kpis', label: 'KPIs' },
        { id: 'forecast', label: 'Prévisions IA' }
      ]
    },
    { 
      id: 'settings', 
      label: 'Paramètres', 
      icon: Settings,
      subItems: [
        { id: 'general', label: 'Généraux' },
        { id: 'multipliers', label: 'Multiplicateurs' },
        { id: 'suppliers', label: 'Fournisseurs' },
        { id: 'mapping', label: 'Mapping' },
        { id: 'warehouses', label: 'Entrepôts' },
        { id: 'integrations', label: 'Intégrations' }
      ]
    }
  ];

  const handleItemClick = (parentId, subItemId = null) => {
    if (parentId === 'analytics') {
      setActiveTab('analytics');
      if (subItemId) setAnalyticsSubTab(subItemId);
    } else if (parentId === 'settings') {
      setActiveTab('settings');
      if (subItemId) setSettingsSubTab(subItemId);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[60]"
      />
      
      {/* Menu Panel */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[61] max-h-[70vh] overflow-auto"
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-[#E5E4DF] rounded-full" />
        </div>
        
        {/* Content */}
        <div className="px-4 pb-8 space-y-4">
          <h3 className="text-lg font-semibold text-[#191919] px-2">
            Plus d'options
          </h3>
          
          {moreItems.map((item) => {
            const Icon = item.icon;
            const isParentActive = activeTab === item.id;
            
            return (
              <div key={item.id} className="space-y-1">
                {/* Parent Item */}
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isParentActive 
                      ? 'bg-[#191919] text-white' 
                      : 'bg-[#FAFAF7] text-[#191919] hover:bg-[#E5E4DF]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
                
                {/* Sub Items */}
                {item.subItems && (
                  <div className="ml-4 flex flex-wrap gap-2">
                    {item.subItems.map((subItem) => {
                      const currentSubTab = item.id === 'analytics' ? analyticsSubTab : settingsSubTab;
                      const isSubActive = isParentActive && currentSubTab === subItem.id;
                      
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => handleItemClick(item.id, subItem.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            isSubActive 
                              ? 'bg-[#191919] text-white' 
                              : 'bg-[#E5E4DF] text-[#666663] hover:text-[#191919]'
                          }`}
                        >
                          {subItem.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Safe area */}
        <div className="h-safe-area-inset-bottom" />
      </motion.div>
    </>
  );
};

export default BottomNav;

