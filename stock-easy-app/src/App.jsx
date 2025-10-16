import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { Header, Sidebar } from './components/layout';
import DashboardView from './views/DashboardView';
import ProductsView from './views/ProductsView';
import OrdersView from './views/OrdersView';
import TrackingView from './views/TrackingView';
import SettingsView from './views/SettingsView';
import LoadingState from './components/shared/LoadingState';
import { useProducts, useOrders, useSuppliers } from './hooks';
import api from './services/apiService';

const App = () => {
  // États globaux
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Paramètres
  const [parameters, setParameters] = useState({});
  const [seuilSurstock, setSeuilSurstock] = useState(90);
  const [devise, setDevise] = useState('EUR');
  const [multiplicateur, setMultiplicateur] = useState(1.2);

  // Hooks métier
  const { 
    products, 
    loading: productsLoading,
    loadProducts,
    updateProduct,
    updateStock
  } = useProducts(seuilSurstock);

  const {
    orders,
    loading: ordersLoading,
    loadOrders,
    createOrder,
    updateOrderStatus,
    sendOrder
  } = useOrders();

  const {
    suppliers,
    suppliersList,
    loading: suppliersLoading,
    loadSuppliers,
    createSupplier,
    updateSupplier
  } = useSuppliers();

  // Dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Charger les paramètres
  useEffect(() => {
    const loadParameters = async () => {
      try {
        const data = await api.getAllData();
        if (data.parameters) {
          setParameters(data.parameters);
          setSeuilSurstock(data.parameters.seuilSurstockProfond || 90);
          setDevise(data.parameters.deviseDefaut || 'EUR');
          setMultiplicateur(data.parameters.multiplicateurDefaut || 1.2);
        }
      } catch (error) {
        console.error('Erreur chargement paramètres:', error);
      }
    };
    
    loadParameters();
  }, []);

  // Calculer les notifications
  const notificationsCount = products.filter(p => p.healthStatus === 'urgent').length;

  const loading = productsLoading && ordersLoading && suppliersLoading;

  if (loading) {
    return <LoadingState message="Chargement de Stock Easy..." fullScreen />;
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Header
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={notificationsCount}
          onNotificationsClick={() => setNotificationsOpen(!notificationsOpen)}
        />
        
        <div className="flex">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          
          <main className="flex-1 lg:ml-0">
            {activeTab === 'dashboard' && (
              <DashboardView 
                products={products} 
                orders={orders}
                loading={productsLoading}
              />
            )}
            
            {activeTab === 'products' && (
              <ProductsView 
                products={products}
                loading={productsLoading}
                onUpdateProduct={updateProduct}
                currency={devise}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersView 
                products={products}
                suppliers={suppliers}
                onCreateOrder={createOrder}
                loading={ordersLoading}
              />
            )}

            {activeTab === 'track' && (
              <TrackingView 
                orders={orders}
                loading={ordersLoading}
              />
            )}

            {activeTab === 'parameters' && (
              <SettingsView 
                loading={false}
                seuilSurstock={seuilSurstock}
                onUpdateSeuil={async (value) => {
                  await api.updateParameter('SeuilSurstockProfond', value);
                  setSeuilSurstock(value);
                }}
                devise={devise}
                onUpdateDevise={async (value) => {
                  await api.updateParameter('DeviseDefaut', value);
                  setDevise(value);
                }}
                multiplicateur={multiplicateur}
                onUpdateMultiplicateur={async (value) => {
                  await api.updateParameter('MultiplicateurDefaut', value);
                  setMultiplicateur(value);
                }}
              />
            )}
          </main>
        </div>
        
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
};

export default App;
