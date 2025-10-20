import React, { useState } from 'react';
import { 
  Package, 
  Activity, 
  TrendingUp, 
  Truck, 
  FileText, 
  Settings, 
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  darkMode, 
  setDarkMode, 
  handleLogout, 
  syncData, 
  syncing 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Package, type: 'tab' },
    { id: 'actions', label: 'Actions', icon: Activity, type: 'tab' },
    { id: 'track', label: 'Track & Manage', icon: Truck, type: 'tab' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, type: 'tab' },
    { id: 'stock-level', label: 'Stock Level', icon: Activity, type: 'tab' },
    { id: 'history', label: 'Historique', icon: FileText, type: 'tab' },
    { id: 'profile', label: 'Mon Profil', icon: User, type: 'route', path: '/profile' },
    { id: 'settings', label: 'Paramètres', icon: Settings, type: 'tab' },
  ];

  const handleMenuItemClick = (item) => {
    if (item.type === 'route') {
      navigate(item.path);
    } else {
      setActiveTab(item.id);
    }
    setMobileMenuOpen(false);
  };

  // Menu Desktop/Tablette (sidebar fixe pleine hauteur)
  const DesktopSidebar = () => (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-[#191919] md:z-40">
      {/* Logo en haut de la sidebar */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#40403E]">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg">
          <Package className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">Stock Easy</h1>
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
          onClick={syncData}
          disabled={syncing}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#FAFAF7] hover:bg-[#40403E] transition-all text-sm font-medium"
        >
          <RefreshCw className={`w-5 h-5 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
          <span>Synchroniser</span>
        </button>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#FAFAF7] hover:bg-[#40403E] transition-all text-sm font-medium"
        >
          {darkMode ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
          <span>{darkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
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
      {/* Mobile Header - Minimaliste avec juste logo et hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#191919] z-50 px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Stock Easy</h1>
        </div>
        
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
              <div className="flex items-center gap-3 px-6 py-6 border-b border-[#40403E]">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Stock Easy</h1>
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
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#FAFAF7] hover:bg-[#40403E] transition-all text-sm font-medium"
                >
                  {darkMode ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
                  <span>{darkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
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
