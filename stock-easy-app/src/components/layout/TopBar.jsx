import React from 'react';
import { Logo } from '../ui/Logo';
import { SearchBar } from '../SearchBar';
import NotificationBell from '../notifications/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, RefreshCw, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';

/**
 * Barre horizontale en haut de l'application
 * Contient : Logo, SearchBar, Notifications, Profil
 */
const TopBar = ({ 
  onMenuToggle, 
  mobileMenuOpen, 
  syncData, 
  syncing, 
  setActiveTab,
  setParametersSubTab,
  setTrackTabSection,
  setStockLevelSearch
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 z-50 shadow-sm">
      <div className="h-full px-4 flex items-center gap-4">
        {/* Bouton Menu Mobile (hamburger) - Visible uniquement sur mobile */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-neutral-900" />
          ) : (
            <Menu className="w-6 h-6 text-neutral-900" />
          )}
        </button>

        {/* Logo - Cliquable pour retourner au dashboard */}
        <button
          onClick={() => navigate('/app')}
          className="shrink-0 hover:opacity-80 transition-opacity"
        >
          <Logo size="small" showText={true} theme="light" />
        </button>

        {/* SearchBar - Prend l'espace disponible */}
        <div className="flex-1 max-w-2xl mx-4">
          <SearchBar 
            setActiveTab={setActiveTab}
            setParametersSubTab={setParametersSubTab}
            setTrackTabSection={setTrackTabSection}
            setStockLevelSearch={setStockLevelSearch}
          />
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Bouton Sync - Masqué sur mobile */}
          <button
            onClick={syncData}
            disabled={syncing}
            className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
            title="Synchroniser les données"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden xl:inline">Sync</span>
          </button>

          {/* Notifications */}
          <div className="hidden sm:block">
            <NotificationBell />
          </div>

          {/* Menu Profil - Dropdown simple */}
          <div className="relative group">
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title="Mon profil"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <span className="hidden lg:inline text-sm font-medium text-neutral-900">
                {user?.email?.split('@')[0] || 'Profil'}
              </span>
            </button>

            {/* Dropdown menu - Apparaît au hover sur desktop */}
            <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-neutral-200 py-2">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Mon profil</span>
              </button>
              <div className="my-1 border-t border-neutral-200" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

