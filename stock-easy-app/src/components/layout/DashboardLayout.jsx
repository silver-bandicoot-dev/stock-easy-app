import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { RefreshCw } from 'lucide-react';

const DashboardLayout = ({ children, activeTab, setActiveTab, syncData, syncing }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* TopBar horizontale fixe en haut avec SearchBar */}
      <TopBar 
        onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
        syncData={syncData}
        syncing={syncing}
        setActiveTab={setActiveTab}
      />

      {/* Sidebar Component - Maintenant sans le header mobile */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        syncData={syncData}
        syncing={syncing}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content - Avec padding pour topbar et sidebar */}
      <div className="md:ml-64 pt-16 min-h-screen">
        {/* Contenu principal avec padding */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

