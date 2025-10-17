import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { Header } from './components/layout';
import Sidebar from './components/layout/Sidebar/Sidebar';
import DashboardView from './views/DashboardView';
import { AnalyticsView } from './views/AnalyticsView';
import { AppTour } from './components/onboarding/AppTour';
import { KeyboardShortcutsHelp } from './components/ui/KeyboardShortcutsHelp';
import { FeedbackWidget } from './components/feedback/FeedbackWidget';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import api from './services/apiService';
import { OrderModal } from './components/modals';
import { ReconciliationModal } from './components/modals';
import { OrdersKanban } from './components/orders/OrdersKanban';
import { BulkActionsBar } from './components/products/BulkActionsBar';
import { exportProducts } from './utils/exportUtils';

// Import du StockEasy original pour les vues produits et commandes
import StockEasy from './StockEasy';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les produits
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Raccourcis clavier
  useKeyboardShortcuts({
    'ctrl+k': () => {
      document.getElementById('search-bar')?.focus();
    },
    'ctrl+1': () => setActiveTab('dashboard'),
    'ctrl+2': () => setActiveTab('products'),
    'ctrl+3': () => setActiveTab('orders'),
    'ctrl+4': () => setActiveTab('analytics'),
  });

  // Rendu selon l'onglet actif
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView products={products} loading={loading} />;
      
      case 'analytics':
        return <AnalyticsView />;
      
      case 'products':
      case 'orders':
      case 'track':
      case 'parameters':
        // Utiliser l'ancien StockEasy pour ces vues (compatibilité)
        return <StockEasy initialTab={activeTab} />;
      
      default:
        return <DashboardView products={products} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <Header 
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Contenu principal */}
        <main className="flex-1 lg:ml-0">
          {renderContent()}
        </main>
      </div>

      {/* Widgets globaux Phase 4 */}
      <AppTour />
      <KeyboardShortcutsHelp />
      <FeedbackWidget />

      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
