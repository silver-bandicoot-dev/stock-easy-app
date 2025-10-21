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
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  setAiSubTab
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Package, type: 'tab' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, type: 'tab' },
    { 
      id: 'ai-forecasts', 
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
    { id: 'actions', label: 'Order', icon: DollarSign, type: 'tab' },
    { id: 'track', label: 'Track & Manage', icon: Truck, type: 'tab' },
    { id: 'stock-level', label: 'Stock Level', icon: Activity, type: 'tab' },
    { id: 'history', label: 'Historique', icon: FileText, type: 'tab' },
    { id: 'settings', label: 'Paramètres', icon: Settings, type: 'tab' },
    { id: 'profile', label: 'Mon Profil', icon: User, type: 'route', path: '/profile' },
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
    } else if (item.hasSubMenu && item.id === 'ai-forecasts') {
      // Si on clique sur IA & Prévisions, basculer l'expansion
      if (activeTab === 'ai-forecasts') {
        setAiExpanded(!aiExpanded);
      } else {
        setActiveTab(item.id);
        setAiExpanded(true);
      }
    } else {
      setActiveTab(item.id);
      // Fermer les sous-menus si on quitte
      if (item.id !== 'analytics') setAnalyticsExpanded(false);
      if (item.id !== 'ai-forecasts') setAiExpanded(false);
    }
    setMobileMenuOpen(false);
  };
  
  const handleSubMenuClick = (parentId, subItem) => {
    if (parentId === 'analytics') {
      setAnalyticsSubTab(subItem.id);
      setActiveTab('analytics');
    } else if (parentId === 'ai-forecasts') {
      setAiSubTab(subItem.id);
      setActiveTab('ai-forecasts');
    }
    setMobileMenuOpen(false);
  };

  // Menu Desktop/Tablette (sidebar fixe pleine hauteur)
  const DesktopSidebar = () => (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-[#191919] md:z-40">
      {/* Logo en haut de la sidebar */}
      <div className="px-6 py-5 border-b border-[#40403E] flex justify-center">
        <Logo size="normal" showText={true} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.type === 'tab' && activeTab === item.id;
          const showSubMenu = item.hasSubMenu && (
            (item.id === 'analytics' && analyticsExpanded) ||
            (item.id === 'ai-forecasts' && aiExpanded)
          );
          
          return (
            <div key={item.id}>
              {/* Menu principal */}
              <button
                onClick={() => handleMenuItemClick(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-black text-white shadow-lg'
                    : 'text-[#FAFAF7] hover:bg-[#40403E]'
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
                      : item.id === 'ai-forecasts'
                      ? (aiSubTab === subItem.id && activeTab === 'ai-forecasts')
                      : false;
                    
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => handleSubMenuClick(item.id, subItem)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                          isSubActive
                            ? 'bg-[#40403E] text-white'
                            : 'text-[#FAFAF7] hover:bg-[#40403E]/50'
                        }`}
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
      <div className="px-4 py-4 border-t border-[#40403E] space-y-2">
        <button
          onClick={syncData}
          disabled={syncing}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#FAFAF7] hover:bg-[#40403E] transition-all text-sm font-medium"
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

  // Menu Mobile (hamburger + overlay)
  const MobileSidebar = () => (
    <>
      {/* Mobile Header - Logo, notification et hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#191919] z-50 px-4 py-4 flex items-center justify-between shadow-lg">
        <Logo size="normal" showText={true} />
        
        <div className="flex items-center gap-2">
          {/* Icône de notification */}
          <NotificationBell variant="mobile" />
          
          {/* Bouton hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#40403E] hover:bg-[#666663] transition-colors"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

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
              className="md:hidden fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-[#191919] z-50 flex flex-col"
            >
              {/* Logo */}
              <div className="px-6 py-6 border-b border-[#40403E] flex justify-center">
                <Logo size="normal" showText={true} />
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.type === 'tab' && activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                        isActive
                          ? 'bg-black text-white shadow-lg'
                          : 'text-[#FAFAF7] hover:bg-[#40403E]'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Actions Footer */}
              <div className="px-4 py-4 border-t border-[#40403E] space-y-2">
                <button
                  onClick={() => {
                    syncData();
                    setMobileMenuOpen(false);
                  }}
                  disabled={syncing}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#FAFAF7] hover:bg-[#40403E] transition-all text-sm font-medium"
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
