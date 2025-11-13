import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardLayout from '../layout/DashboardLayout';
import ProfilePage from './ProfilePage';

const ProfileWithSidebar = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
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

  const handleSetActiveTab = (tabId) => {
    setActiveTab(tabId || 'dashboard');
    if (tabId && tabId !== 'profile') {
      navigate('/', { state: { targetTab: tabId } });
    } else if (!tabId) {
      navigate('/');
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={handleSetActiveTab}
      syncData={handleSync}
      syncing={syncing}
    >
      <ProfilePage />
    </DashboardLayout>
  );
};

export default ProfileWithSidebar;

