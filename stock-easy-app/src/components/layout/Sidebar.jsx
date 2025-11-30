import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Activity,
  TrendingUp, 
  Truck, 
  FileText, 
  Settings, 
  User,
  Menu,
  X,
  BarChart3,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Sliders,
  Box,
  Users,
  Warehouse,
  Zap,
  PlugZap,
  Cog,
  Brain,
  ClipboardList,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationBell from '../notifications/NotificationBell';
import { Logo } from '../ui/Logo';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  handleLogout,
  analyticsSubTab,
  setAnalyticsSubTab,
  settingsSubTab,
  setSettingsSubTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  orderBadgeCount = 0,
  ordersBadgeCount = 0
}) => {
  const { t } = useTranslation();
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: Package, type: 'tab' },
    { id: 'actions', label: t('navigation.placeOrder'), icon: Plus, type: 'tab' },
    { id: 'orders', label: t('navigation.myOrders'), icon: Truck, type: 'tab' },
    { id: 'stock-level', label: t('navigation.stockLevels'), icon: Activity, type: 'tab' },
    { id: 'inventory', label: t('navigation.inventory'), icon: ClipboardList, type: 'tab' },
    { 
      id: 'analytics', 
      label: t('navigation.analytics'), 
      icon: TrendingUp, 
      type: 'tab',
      hasSubMenu: true,
      subItems: [
        { id: 'kpis', label: t('navigation.kpis'), icon: BarChart3 },
        { id: 'forecast', label: t('navigation.aiForecast'), icon: Brain }
      ]
    },
    { 
      id: 'settings', 
      label: t('navigation.settings'), 
      icon: Cog, 
      type: 'tab',
      hasSubMenu: true,
      subItems: [
        { id: 'general', label: t('navigation.generalSettings'), icon: Sliders },
        { id: 'multipliers', label: t('navigation.multipliers'), icon: TrendingUp },
        { id: 'suppliers', label: t('navigation.supplierManagement'), icon: Users },
        { id: 'mapping', label: t('navigation.mapping'), icon: Package },
        { id: 'warehouses', label: t('navigation.warehouseManagement'), icon: Warehouse },
        { id: 'integrations', label: t('navigation.integrations'), icon: PlugZap }
      ]
    },
  ];

  const handleMenuItemClick = (item) => {
    if (item.type === 'route') {
      navigate(item.path);
    } else if (item.hasSubMenu && item.id === 'analytics') {
      // Si on clique sur Analytics, basculer l'expansion
      if (activeTab === 'analytics') {
        setAnalyticsExpanded(!analyticsExpanded);
      } else {
        setActiveTab(item.id);
        setAnalyticsExpanded(true);
      }
    } else if (item.hasSubMenu && item.id === 'settings') {
      // Si on clique sur Paramètres, basculer l'expansion
      if (activeTab === 'settings') {
        setSettingsExpanded(!settingsExpanded);
      } else {
        setActiveTab(item.id);
        setSettingsExpanded(true);
      }
    } else {
      setActiveTab(item.id);
      // Fermer les sous-menus si on quitte
      if (item.id !== 'analytics') setAnalyticsExpanded(false);
      if (item.id !== 'settings') setSettingsExpanded(false);
    }
    setMobileMenuOpen(false);
  };
  
  const handleSubMenuClick = (parentId, subItem) => {
    if (parentId === 'analytics') {
      setAnalyticsSubTab(subItem.id);
      setActiveTab('analytics');
    } else if (parentId === 'settings') {
      setSettingsSubTab(subItem.id);
      setActiveTab('settings');
    }
    setMobileMenuOpen(false);
  };

  // Menu Desktop/Tablette (sidebar fixe pleine hauteur)
  const DesktopSidebar = () => (
    <aside className="hidden md:flex md:flex-col md:fixed md:top-16 md:bottom-0 md:left-0 md:w-64 md:bg-[#FAFAF7] md:border-r md:border-[#E5E4DF] md:z-40">
      {/* Navigation - Le logo est maintenant dans la barre horizontale globale */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const routeActive = item.type === 'route' && location.pathname === item.path;
          const isActive = item.type === 'tab' ? activeTab === item.id : routeActive;
          const showSubMenu = item.hasSubMenu && (
            (item.id === 'analytics' && analyticsExpanded) ||
            (item.id === 'settings' && settingsExpanded)
          );
          
          return (
            <div key={item.id}>
              {/* Menu principal */}
              <button
                onClick={() => handleMenuItemClick(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-[#191919] text-white shadow-lg'
                    : 'text-[#191919] hover:bg-[#E5E4DF]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-purple-600 text-white rounded">
                    {item.badge}
                  </span>
                )}
                {item.id === 'actions' && orderBadgeCount > 0 && (
                  <span className={`px-2.5 py-1 min-w-[24px] text-xs font-semibold rounded-full flex items-center justify-center ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-[#E5E4DF] text-[#191919]'
                  }`}>
                    {orderBadgeCount}
                  </span>
                )}
                {item.id === 'orders' && ordersBadgeCount > 0 && (
                  <span className={`px-2.5 py-1 min-w-[24px] text-xs font-semibold rounded-full flex items-center justify-center ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-[#E5E4DF] text-[#191919]'
                  }`}>
                    {ordersBadgeCount}
                  </span>
                )}
                {item.hasSubMenu && (
                  showSubMenu ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {/* Sous-menu */}
              {showSubMenu && item.subItems && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subItems.map((subItem) => {
                    const SubIcon = subItem.icon;
                    // Vérifier le bon sous-tab selon le parent
                    const isSubActive = item.id === 'analytics' 
                      ? (analyticsSubTab === subItem.id && activeTab === 'analytics')
                      : item.id === 'settings'
                      ? (settingsSubTab === subItem.id && activeTab === 'settings')
                      : false;
                    
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => handleSubMenuClick(item.id, subItem)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                          isSubActive
                            ? 'bg-[#191919] text-white'
                            : 'text-[#191919] hover:bg-[#E5E4DF]'
                        }`}
                        style={{ fontSize: '0.8125rem' }}
                      >
                        <SubIcon className="w-4 h-4 shrink-0" />
                        <span>{subItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      {/* Centre d'aide - En bas de la sidebar */}
      <div className="px-4 pb-6 mt-auto">
        <button
          onClick={() => {
            setActiveTab('help');
            setAnalyticsExpanded(false);
            setSettingsExpanded(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'help'
              ? 'bg-[#191919] text-white shadow-lg'
              : 'text-[#191919] hover:bg-[#E5E4DF]'
          }`}
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1 text-left">{t('navigation.helpCenter')}</span>
        </button>
      </div>
    </aside>
  );

  // Menu Mobile (overlay uniquement, sans header)
  const MobileSidebar = () => (
    <>
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-[#FAFAF7] border-r border-[#E5E4DF] z-50 flex flex-col"
            >
              {/* Logo */}
              <div className="px-6 py-6 border-b border-[#E5E4DF] flex justify-center">
                <Logo size="normal" showText={true} theme="light" />
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const routeActive = item.type === 'route' && location.pathname === item.path;
                  const isActive = item.type === 'tab' ? activeTab === item.id : routeActive;
                    const showSubMenu = item.hasSubMenu && (
                      (item.id === 'analytics' && analyticsExpanded) ||
                      (item.id === 'settings' && settingsExpanded)
                    );
                  
                  return (
                    <div key={item.id}>
                      {/* Menu principal */}
                      <button
                        onClick={() => handleMenuItemClick(item)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                          isActive
                            ? 'bg-[#191919] text-white shadow-lg'
                            : 'text-[#191919] hover:bg-[#E5E4DF]'
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-purple-600 text-white rounded">
                            {item.badge}
                          </span>
                        )}
                        {item.id === 'actions' && orderBadgeCount > 0 && (
                          <span className={`px-2.5 py-1 min-w-[24px] text-xs font-semibold rounded-full flex items-center justify-center ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : 'bg-[#E5E4DF] text-[#191919]'
                          }`}>
                            {orderBadgeCount}
                          </span>
                        )}
                        {item.id === 'orders' && ordersBadgeCount > 0 && (
                          <span className={`px-2.5 py-1 min-w-[24px] text-xs font-semibold rounded-full flex items-center justify-center ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : 'bg-[#E5E4DF] text-[#191919]'
                          }`}>
                            {ordersBadgeCount}
                          </span>
                        )}
                        {item.hasSubMenu && (
                          showSubMenu ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      
                      {/* Sous-menu */}
                      {showSubMenu && item.subItems && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.subItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = item.id === 'analytics' 
                              ? (analyticsSubTab === subItem.id && activeTab === 'analytics')
                              : item.id === 'settings'
                              ? (settingsSubTab === subItem.id && activeTab === 'settings')
                              : false;
                            
                            return (
                              <button
                                key={subItem.id}
                                onClick={() => handleSubMenuClick(item.id, subItem)}
                                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                                  isSubActive
                                    ? 'bg-[#191919] text-white'
                                    : 'text-[#191919] hover:bg-[#E5E4DF]'
                                }`}
                                style={{ fontSize: '0.8125rem' }}
                              >
                                <SubIcon className="w-4 h-4 shrink-0" />
                                <span>{subItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
              
              {/* Centre d'aide - En bas de la sidebar mobile */}
              <div className="px-4 pb-6 mt-auto">
                <button
                  onClick={() => {
                    setActiveTab('help');
                    setAnalyticsExpanded(false);
                    setSettingsExpanded(false);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'help'
                      ? 'bg-[#191919] text-white shadow-lg'
                      : 'text-[#191919] hover:bg-[#E5E4DF]'
                  }`}
                >
                  <HelpCircle className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">{t('navigation.helpCenter')}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};

export default Sidebar;
