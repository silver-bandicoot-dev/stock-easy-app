import React, { useState } from 'react';
import { 
  Package, 
  DollarSign, 
  Activity,
  TrendingUp, 
  Truck, 
  FileText, 
  Settings, 
  User,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Brain,
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
  Cog
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';
import { Logo } from '../ui/Logo';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  handleLogout, 
  syncData, 
  syncing,
  analyticsSubTab,
  setAnalyticsSubTab,
  aiSubTab,
  setAiSubTab,
  settingsSubTab,
  setSettingsSubTab,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Package, type: 'tab' },
    { id: 'actions', label: 'Order', icon: DollarSign, type: 'tab' },
    { id: 'track', label: 'Track & Manage', icon: Truck, type: 'tab' },
    { id: 'stock-level', label: 'Stock Level', icon: Activity, type: 'tab' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, type: 'tab' },
    { id: 'history', label: 'Historique', icon: FileText, type: 'tab' },
    { 
      id: 'ai', 
      label: 'IA & Prévisions', 
      icon: Brain, 
      type: 'tab',
      badge: 'Beta',
      hasSubMenu: true,
      subItems: [
        { id: 'overview', label: 'Vue d\'Ensemble', icon: BarChart3 },
        { id: 'forecasts', label: 'Prévisions Détaillées', icon: TrendingUp },
        { id: 'optimization', label: 'Optimisation Stocks', icon: Activity },
        { id: 'anomalies', label: 'Détection Anomalies', icon: AlertTriangle }
      ]
    },
    { 
      id: 'settings', 
      label: 'Paramètres', 
      icon: Cog, 
      type: 'tab',
      hasSubMenu: true,
      subItems: [
        { id: 'general', label: 'Paramètres Généraux', icon: Sliders },
        { id: 'multipliers', label: 'Multiplicateurs', icon: TrendingUp },
        { id: 'suppliers', label: 'Gestion Fournisseurs', icon: Users },
        { id: 'mapping', label: 'Mapping', icon: Package },
        { id: 'warehouses', label: 'Gestion Entrepôts', icon: Warehouse },
        { id: 'integrations', label: 'Intégrations', icon: PlugZap }
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
    } else if (item.hasSubMenu && item.id === 'ai') {
      // Si on clique sur IA & Prévisions, basculer l'expansion
      if (activeTab === 'ai') {
        setAiExpanded(!aiExpanded);
      } else {
        setActiveTab(item.id);
        setAiExpanded(true);
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
      if (item.id !== 'ai') setAiExpanded(false);
      if (item.id !== 'settings') setSettingsExpanded(false);
    }
    setMobileMenuOpen(false);
  };
  
  const handleSubMenuClick = (parentId, subItem) => {
    if (parentId === 'analytics') {
      setAnalyticsSubTab(subItem.id);
      setActiveTab('analytics');
    } else if (parentId === 'ai') {
      setAiSubTab(subItem.id);
      setActiveTab('ai');
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
            (item.id === 'ai' && aiExpanded) ||
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
                      : item.id === 'ai'
                      ? (aiSubTab === subItem.id && activeTab === 'ai')
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

      {/* Actions Footer */}
      <div className="px-4 py-4 border-t border-[#E5E4DF] space-y-2">
        <button
          onClick={syncData}
          disabled={syncing}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#191919] hover:bg-[#E5E4DF] transition-all text-sm font-medium"
        >
          <RefreshCw className={`w-5 h-5 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
          <span>Synchroniser</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-all text-sm font-medium"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Déconnexion</span>
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
                {/* Notification intégrée au menu */}
                <div className="mb-4">
                  <NotificationBell variant="mobile" />
                </div>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const routeActive = item.type === 'route' && location.pathname === item.path;
                  const isActive = item.type === 'tab' ? activeTab === item.id : routeActive;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                        isActive
                          ? 'bg-[#191919] text-white shadow-lg'
                          : 'text-[#191919] hover:bg-[#E5E4DF]'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Actions Footer */}
              <div className="px-4 py-4 border-t border-[#E5E4DF] space-y-2">
                <button
                  onClick={() => {
                    syncData();
                    setMobileMenuOpen(false);
                  }}
                  disabled={syncing}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#191919] hover:bg-[#E5E4DF] transition-all text-sm font-medium"
                >
                  <RefreshCw className={`w-5 h-5 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
                  <span>Synchroniser</span>
                </button>

                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-all text-sm font-medium"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span>Déconnexion</span>
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
