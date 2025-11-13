import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import Sidebar from './Sidebar';
import NotificationBell from '../notifications/NotificationBell';
import { RefreshCw } from 'lucide-react';

const DashboardLayout = ({ children, activeTab, setActiveTab, syncData, syncing }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Sidebar Component */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        syncData={syncData}
        syncing={syncing}
      />

      {/* Main Content - Pleine hauteur avec padding pour sidebar desktop */}
      <div className="md:ml-64 min-h-screen">
        {/* Spacer pour le header mobile uniquement */}
        <div className="md:hidden h-[72px]" />
        
        {/* Content Area avec NotificationBell intégré */}
        <div className="relative min-h-screen">
          {/* NotificationBell flottant en haut à droite avec fond - Masqué sur mobile */}
          <div className="hidden md:block absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
            <div className="bg-white rounded-lg shadow-md p-2">
              <NotificationBell />
            </div>
          </div>

          {/* Contenu principal avec padding */}
          <div className="p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

