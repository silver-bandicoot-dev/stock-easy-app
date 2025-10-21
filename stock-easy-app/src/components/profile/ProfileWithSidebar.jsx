import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../layout/Sidebar';
import NotificationBell from '../notifications/NotificationBell';
import UserProfile from './UserProfile';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const ProfileWithSidebar = () => {
  const [syncing, setSyncing] = useState(false);
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

  const syncData = async () => {
    setSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Données synchronisées !');
    } catch (error) {
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0EB]">
      {/* Sidebar Component */}
      <Sidebar 
        activeTab={null}
        setActiveTab={() => navigate('/')}
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
            <UserProfile />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileWithSidebar;

