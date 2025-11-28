import React, { useState, useEffect } from 'react';
import { RefreshCw, Menu, User, LogOut, Compass } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './components/notifications/NotificationBell';
import Sidebar from './components/layout/Sidebar';
import BottomNav, { BottomNavMoreMenu } from './components/layout/BottomNav';
import { Logo } from './components/ui/Logo';
import { SearchBar, SearchModal } from './components/SearchBar';
import { StockDataProvider, useStockContext } from './contexts/StockDataContext';
import { useModalContext } from './contexts/ModalContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { StockeasyModals } from './components/modals/StockeasyModals';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { SkeletonDashboard } from './components/ui/Skeleton';

// Composants Dashboard
import { DashboardTab } from './components/dashboard/DashboardTab';
import { ActionsTab } from './components/actions/ActionsTab';
import { OrdersTab } from './components/orders/OrdersTab';
import { StockTab } from './components/stock/StockTab';
import { InventoryTab } from './components/inventory/InventoryTab';
import { AnalyticsTab } from './components/analytics/AnalyticsTab';
import { SettingsTab } from './components/settings/SettingsTab';
import ProfilePage from './components/profile/ProfilePage';
import { HelpCenterTab } from './components/help';

// Constantes et Utils
import {
  MAIN_TABS,
  STOCK_FILTERS,
  DEFAULT_PARAMETERS
} from './constants/stockEasyConstants';
import { roundToTwoDecimals } from './utils/decimalUtils';
import * as OrderHandlers from './handlers/orderHandlers';
import * as UIHandlers from './handlers/uiHandlers';

// ============================================
// COMPOSANT CONTENU (Consomme le Context)
// ============================================
const StockeasyContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Contextes
  const { 
    inlineModals,
    reconciliationModal,
    reconciliationModalHandlers,
    reclamationEmailModal,
    reclamationEmailModalHandlers
  } = useModalContext();
  const {
    // Data
    loading,
    syncing,
    products,
    orders,
    suppliers,
    warehouses,
    parameters,
    refreshData: loadData,
    syncData: handleSyncData,
    api,
    
    // Computed
    enrichedProducts,
    productsByStatus,
    toOrderBySupplier,
    
    // User
    currentUser,
    getUserSignature,
    
    // Logic Hooks
    tabManagement,
    parameterState,
    parameterEditing,
    orderManagement,
    supplierManagement,
    supplierMapping,
    warehouseActions,
    reconciliationLogic,
    emailGeneration,
    
    // Handlers
    handlers
  } = useStockContext();

  // Navigation State
  const { 
    activeTab, setActiveTab, 
    parametersSubTab, setParametersSubTab,
    analyticsSubTab, setAnalyticsSubTab
  } = tabManagement;

  // UI State (Local)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  
  // Tab Specific Local State
  const [stockLevelFilter, setStockLevelFilter] = useState(STOCK_FILTERS.ALL);
  const [stockLevelSupplierFilter, setStockLevelSupplierFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  
  // Fonction pour mettre à jour la recherche depuis la SearchBar et naviguer
  const setStockLevelSearch = (term) => {
    setSearchTerm(term);
  };

  // Gestion Profile Photo
  useEffect(() => {
    let isMounted = true;
    const loadProfilePhoto = async () => {
      try {
        const { getCurrentUserProfile } = await import('./services/profileService');
        const { data } = await getCurrentUserProfile();
        if (!isMounted) return;
        if (data?.photo_url) setProfilePhotoUrl(data.photo_url);
        else if (data?.photoUrl) setProfilePhotoUrl(data.photoUrl);
      } catch (e) {
        console.warn('Impossible de charger la photo de profil:', e);
      }
    };
    loadProfilePhoto();
    return () => { isMounted = false; };
  }, []);

  // Gestion Navigation URL (Track Order)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('order');

    if (orderId && orders && orders.length > 0) {
      setActiveTab(MAIN_TABS.ORDERS);
      const targetOrder = orders.find(order => order.id === orderId);
      if (!targetOrder) {
        toast.error('Commande introuvable');
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, orders, navigate, setActiveTab]);

  // Gestion Raccourci Clavier Recherche
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (event.key === 'k' && (event.metaKey || event.ctrlKey) && !isInput) {
        event.preventDefault();
        setSearchModalOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Helpers UI ---

  const userDisplayName = (currentUser?.firstName && currentUser?.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser?.displayName || currentUser?.user_metadata?.full_name || currentUser?.email || '') || '';

  const userInitials = React.useMemo(() => {
    if (!userDisplayName) return '';
    const parts = userDisplayName.split(' ').filter(Boolean);
    return parts.length === 1 
      ? parts[0].charAt(0).toUpperCase() 
      : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [userDisplayName]);

  const userAvatarUrl = profilePhotoUrl || currentUser?.photoURL || currentUser?.avatar_url || currentUser?.user_metadata?.avatar_url || null;

  const handleProfileLogout = async () => {
    setIsProfileMenuOpen(false);
    const { handleLogout } = await import('./handlers/authHandlers');
    await handleLogout(async () => {}, navigate);
  };

  // View Details Handler
  const onViewDetails = (product) => {
    setActiveTab(MAIN_TABS.ACTIONS);
  };

  // Adapters pour les handlers existants
  const setEmailModalOpenAdapter = (isOpen) => {
    if (isOpen) {
      inlineModals.emailOrderModal.openEmailModal();
    } else {
      inlineModals.emailOrderModal.closeEmailModal();
    }
  };

  // Code devise (défini tôt pour être utilisé dans le loading state)
  const currencyCode = parameterState.deviseDefaut || DEFAULT_PARAMETERS.deviseDefaut;

  // Loading State avec Skeleton
  if (loading) {
    return (
      <CurrencyProvider code={currencyCode}>
        <div className="min-h-screen bg-[#FAFAF7]">
          {/* Header skeleton */}
          <div className="hidden md:flex fixed top-0 left-0 right-0 z-[60] bg-[#FAFAF7] border-b border-[#E5E4DF] h-16 items-center">
            <div className="w-64 flex items-center justify-center shrink-0">
              <Logo size="small" showText={true} theme="light" />
            </div>
          </div>
          
          {/* Mobile header skeleton */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-[#FAFAF7] border-b border-[#E5E4DF] h-16 flex items-center px-4">
            <div className="flex-1 flex items-center justify-center">
              <Logo size="small" showText={true} theme="light" />
            </div>
          </div>
          
          {/* Sidebar skeleton (desktop) */}
          <aside className="hidden md:block fixed top-16 bottom-0 left-0 w-64 bg-[#FAFAF7] border-r border-[#E5E4DF]" />
          
          {/* Main content with skeleton */}
          <div className="md:ml-64 min-h-screen pt-16">
            <div className="p-4 sm:p-6 lg:p-8 pt-10">
              <div className="max-w-7xl mx-auto">
                <SkeletonDashboard />
              </div>
            </div>
          </div>
          
          {/* Bottom nav skeleton (mobile) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E4DF]" />
        </div>
      </CurrencyProvider>
    );
  }

  return (
    <CurrencyProvider code={currencyCode}>
      <>
        <Toaster position="top-right" expand={true} richColors closeButton duration={4000} />
        
        {/* HEADER DESKTOP */}
        <div className="hidden md:flex fixed top-0 left-0 right-0 z-[60] bg-[#FAFAF7] border-b border-[#E5E4DF] h-16 items-center">
          <div className="w-64 flex items-center justify-center shrink-0">
            <Logo size="small" showText={true} theme="light" />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
            <SearchBar 
              setActiveTab={setActiveTab}
              setParametersSubTab={setParametersSubTab}
              setStockLevelSearch={setStockLevelSearch}
              onSupplierSelect={(supplierData) => {
                supplierManagement.handleOpenSupplierModal({
                  name: supplierData.nom_fournisseur,
                  email: supplierData.email || '',
                  leadTimeDays: supplierData.lead_time_days || 14,
                  moq: supplierData.moq || 1,
                  notes: supplierData.notes || ''
                });
              }}
            />
          </div>
          <div className="ml-auto flex items-center gap-4 pr-4 sm:pr-6 lg:pr-8">
            <NotificationBell variant="inline" />
            <button onClick={handleSyncData} disabled={syncing} className="p-2 rounded-lg hover:bg-[#E5E4DF] transition-colors disabled:opacity-50">
              <RefreshCw className={`w-5 h-5 text-[#191919] ${syncing ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative">
              <button onClick={() => setIsProfileMenuOpen((open) => !open)} className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-[#E5E4DF]">
                <div className="w-8 h-8 rounded-full bg-[#E5E4DF] overflow-hidden flex items-center justify-center text-sm font-semibold text-[#191919]">
                  {userAvatarUrl ? <img src={userAvatarUrl} alt="Profil" className="w-full h-full object-cover" /> : <span>{userInitials || 'U'}</span>}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs text-[#666663]">Mon profil</span>
                  <span className="text-sm font-medium text-[#191919] truncate max-w-[120px]">{userDisplayName || 'Utilisateur'}</span>
                </div>
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#E5E4DF] bg-white shadow-lg py-1 text-sm z-40">
                  <button onClick={() => { setActiveTab(MAIN_TABS.PROFILE); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#FAFAF7] text-left text-[#191919]">
                    <User className="w-4 h-4 text-[#666663]" /> <span>Mon profil</span>
                  </button>
                  <button onClick={handleProfileLogout} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#FAFAF7] text-left text-[#EF1C43]">
                    <LogOut className="w-4 h-4" /> <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HEADER MOBILE */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-[#FAFAF7] border-b border-[#E5E4DF] h-16 flex items-center px-4">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-[#E5E4DF]"><Menu className="w-6 h-6 text-[#191919]" /></button>
          <div className="flex-1 flex items-center justify-center"><Logo size="small" showText={true} theme="light" /></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchModalOpen(true)} className="p-2 rounded-lg hover:bg-[#E5E4DF]"><Compass className="w-5 h-5 text-[#191919]" /></button>
            <NotificationBell variant="inline" />
            <button onClick={handleSyncData} disabled={syncing} className="p-2 rounded-lg hover:bg-[#E5E4DF] disabled:opacity-50">
              <RefreshCw className={`w-5 h-5 text-[#191919] ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <SearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          setActiveTab={setActiveTab}
          setParametersSubTab={setParametersSubTab}
          setStockLevelSearch={setStockLevelSearch}
          onSupplierSelect={(supplierData) => {
            supplierManagement.handleOpenSupplierModal({
              name: supplierData.nom_fournisseur,
              email: supplierData.email || '',
              leadTimeDays: supplierData.lead_time_days || 14,
              moq: supplierData.moq || 1,
              notes: supplierData.notes || ''
            });
          }}
        />

        {/* MAIN CONTENT */}
        <div className="min-h-screen bg-[#FAFAF7]">
          <div className="h-16" />
          <Sidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleLogout={handleProfileLogout}
            analyticsSubTab={analyticsSubTab}
            setAnalyticsSubTab={setAnalyticsSubTab}
            settingsSubTab={parametersSubTab}
            setSettingsSubTab={setParametersSubTab}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            orderBadgeCount={productsByStatus.to_order.length}
            ordersBadgeCount={orders.filter(o => ['pending_confirmation', 'preparing', 'in_transit', 'received', 'reconciliation'].includes(o.status)).length}
          />

          <div className="md:ml-64 min-h-screen bg-[#FAFAF7]">
            <div className="relative min-h-screen">
              {/* pb-20 pour le BottomNav sur mobile */}
              <div className="p-4 sm:p-6 lg:p-8 pt-10 sm:pt-12 lg:pt-14 pb-24 md:pb-8">
                <div className="max-w-7xl mx-auto">
                  <AnimatePresence mode="wait">
                    {activeTab === MAIN_TABS.DASHBOARD && (
                      <ErrorBoundary section="Tableau de bord">
                        <DashboardTab 
                          productsByStatus={productsByStatus}
                          orders={orders}
                          enrichedProducts={enrichedProducts}
                          onViewDetails={onViewDetails}
                          seuilSurstockProfond={parameterState.seuilSurstockProfond}
                          syncing={syncing}
                        />
                      </ErrorBoundary>
                    )}

                    {activeTab === MAIN_TABS.ACTIONS && (
                      <ErrorBoundary section="Passer Commande">
                        <ActionsTab
                          productsByStatus={productsByStatus}
                          toOrderBySupplier={toOrderBySupplier}
                          suppliers={suppliers}
                          warehouses={warehouses}
                          orderQuantities={orderManagement.orderQuantities}
                          updateOrderQuantity={orderManagement.updateOrderQuantity}
                          generatePONumber={orderManagement.generatePONumber}
                          orders={orders}
                          handleCreateOrder={(selectedProducts) => OrderHandlers.handleCreateOrderFromTable(
                            selectedProducts, enrichedProducts, warehouses, orders, api, loadData, 
                            orderManagement.generatePONumber, roundToTwoDecimals, 
                            setEmailModalOpenAdapter,
                            inlineModals.emailOrderModal.setSelectedSupplier,
                            orderManagement.setSelectedWarehouse, 
                            orderManagement.setOrderQuantities
                          )}
                          handleOpenEmailModal={(supplier, products) => OrderHandlers.handleOpenEmailModal(
                            inlineModals,
                            supplier, products, warehouses
                          )}
                          loadData={loadData}
                          getUserSignature={getUserSignature}
                          allProducts={enrichedProducts}
                          emailGeneration={emailGeneration}
                        />
                      </ErrorBoundary>
                    )}

                    {activeTab === MAIN_TABS.ORDERS && (
                      <ErrorBoundary section="Mes Commandes">
                        <OrdersTab
                          orders={orders}
                          products={products}
                          suppliers={suppliers}
                          warehouses={warehouses}
                          confirmOrder={orderManagement.confirmOrder}
                          shipOrder={handlers.handleShipOrder}
                          receiveOrder={orderManagement.receiveOrder}
                          loadData={loadData}
                          reconciliationLogic={reconciliationLogic}
                          emailGeneration={emailGeneration}
                          reconciliationModal={reconciliationModal}
                          reconciliationModalHandlers={reconciliationModalHandlers}
                          reclamationEmailModal={reclamationEmailModal}
                          reclamationEmailModalHandlers={reclamationEmailModalHandlers}
                        />
                      </ErrorBoundary>
                    )}

                    {activeTab === MAIN_TABS.STOCK && (
                      <ErrorBoundary section="Niveaux de Stock">
                        <StockTab
                          products={enrichedProducts}
                          suppliers={suppliers}
                          orders={orders}
                          stockLevelFilter={stockLevelFilter}
                          setStockLevelFilter={setStockLevelFilter}
                          stockLevelSupplierFilter={stockLevelSupplierFilter}
                          setStockLevelSupplierFilter={setStockLevelSupplierFilter}
                          searchTerm={searchTerm}
                          setSearchTerm={setSearchTerm}
                          onViewDetails={onViewDetails}
                        />
                      </ErrorBoundary>
                    )}

                    {activeTab === MAIN_TABS.INVENTORY && (
                      <ErrorBoundary section="Inventaire">
                        <InventoryTab
                          products={enrichedProducts}
                          suppliers={suppliers}
                        />
                      </ErrorBoundary>
                    )}

                    {activeTab === MAIN_TABS.ANALYTICS && (
                      <ErrorBoundary section="Analytics">
                        <AnalyticsTab
                          products={enrichedProducts}
                          orders={orders}
                          suppliers={suppliers}
                          warehouses={warehouses}
                          seuilSurstockProfond={parameterState.seuilSurstockProfond}
                          analyticsSubTab={analyticsSubTab}
                          setAnalyticsSubTab={setAnalyticsSubTab}
                        />
                      </ErrorBoundary>
                    )}

                    {activeTab === MAIN_TABS.SETTINGS && (
                      <ErrorBoundary section="Paramètres">
                        <SettingsTab
                          parametersSubTab={parametersSubTab}
                          setParametersSubTab={setParametersSubTab}
                          products={products}
                          suppliers={suppliers}
                          warehouses={warehouses}
                          parameters={parameters}
                          setParameters={parameterEditing.setParameters}
                          loadData={loadData}
                          // Props ParametresGeneraux
                          seuilSurstockProfond={parameterState.seuilSurstockProfond}
                          onUpdateSeuilSurstock={parameterEditing.onUpdateSeuilSurstock}
                          deviseDefaut={parameterState.deviseDefaut}
                          onUpdateDevise={parameterEditing.onUpdateDevise}
                          multiplicateurDefaut={parameterState.multiplicateurDefaut}
                          onUpdateMultiplicateur={parameterEditing.onUpdateMultiplicateur}
                          // Props GestionFournisseurs
                          supplierModalOpen={supplierManagement.supplierModalOpen}
                          setSupplierModalOpen={supplierManagement.setSupplierModalOpen}
                          editingSupplier={supplierManagement.editingSupplier}
                          setEditingSupplier={supplierManagement.setEditingSupplier}
                          supplierFormData={supplierManagement.supplierFormData}
                          setSupplierFormData={supplierManagement.setSupplierFormData}
                          handleOpenSupplierModal={supplierManagement.handleOpenSupplierModal}
                          handleCloseSupplierModal={supplierManagement.handleCloseSupplierModal}
                          handleSupplierFormChange={supplierManagement.handleSupplierFormChange}
                          handleSaveSupplier={supplierManagement.handleSaveSupplier}
                          handleDeleteSupplier={supplierManagement.handleDeleteSupplier}
                          // Props Mapping
                          assignSupplierModalOpen={supplierMapping.assignSupplierModalOpen}
                          setAssignSupplierModalOpen={supplierMapping.setAssignSupplierModalOpen}
                          selectedProductForMapping={supplierMapping.selectedProductForMapping}
                          setSelectedProductForMapping={supplierMapping.setSelectedProductForMapping}
                          handleSaveSupplierMapping={supplierMapping.handleSaveSupplierMapping}
                          isSavingSupplierMapping={supplierMapping.isSavingSupplierMapping}
                          // Props Warehouses
                          onCreateWarehouse={warehouseActions.handleCreateWarehouse}
                          onUpdateWarehouse={warehouseActions.handleUpdateWarehouse}
                          onDeleteWarehouse={warehouseActions.handleDeleteWarehouse}
                        />
                      </ErrorBoundary>
                    )}

                    {activeTab === MAIN_TABS.PROFILE && (
                      <ErrorBoundary section="Profil">
                        <ProfilePage />
                      </ErrorBoundary>
                    )}
                  </AnimatePresence>

                    {activeTab === MAIN_TABS.HELP && (
                      <ErrorBoundary section="Centre d'aide">
                        <HelpCenterTab />
                      </ErrorBoundary>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM NAVIGATION MOBILE */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          orderBadgeCount={productsByStatus.to_order.length}
          ordersBadgeCount={orders.filter(o => ['pending_confirmation', 'preparing', 'in_transit', 'received', 'reconciliation'].includes(o.status)).length}
          onMoreClick={() => setMoreMenuOpen(true)}
        />

        {/* MENU "PLUS" POUR MOBILE */}
        <AnimatePresence>
          {moreMenuOpen && (
            <BottomNavMoreMenu
              isOpen={moreMenuOpen}
              onClose={() => setMoreMenuOpen(false)}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              analyticsSubTab={analyticsSubTab}
              setAnalyticsSubTab={setAnalyticsSubTab}
              settingsSubTab={parametersSubTab}
              setSettingsSubTab={setParametersSubTab}
            />
          )}
        </AnimatePresence>

        {/* MODALS - Sans props car tout est dans le contexte ! */}
        <StockeasyModals />
      </>
    </CurrencyProvider>
  );
};

// ============================================
// COMPOSANT RACINE
// ============================================
const Stockeasy = () => {
  return (
    <StockDataProvider>
      <StockeasyContent />
    </StockDataProvider>
  );
};

export default Stockeasy;
