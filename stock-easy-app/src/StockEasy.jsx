import React, { useState, useEffect } from 'react';
import { RefreshCw, Menu, User, LogOut, Compass } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './components/notifications/NotificationBell';
import Sidebar from './components/layout/Sidebar';
import { Logo } from './components/ui/Logo';
import { SearchBar, SearchModal } from './components/SearchBar';
import { StockDataProvider, useStockContext } from './contexts/StockDataContext';
import { useModalContext } from './contexts/ModalContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { StockEasyModals } from './components/modals/StockEasyModals';

// Composants Dashboard
import { DashboardTab } from './components/dashboard/DashboardTab';
import { ActionsTab } from './components/actions/ActionsTab';
import { TrackTab } from './components/track/TrackTab';
import { StockTab } from './components/stock/StockTab';
import { AnalyticsTab } from './components/analytics/AnalyticsTab';
import { HistoryTab } from './components/history/HistoryTab';
import { SettingsTab } from './components/settings/SettingsTab';
import ProfilePage from './components/profile/ProfilePage';

// Constantes et Utils
import {
  MAIN_TABS,
  TRACK_TABS,
  STOCK_FILTERS,
  DEFAULT_PARAMETERS
} from './constants/stockEasyConstants';
import { roundToTwoDecimals } from './utils/decimalUtils';
import * as OrderHandlers from './handlers/orderHandlers';
import * as UIHandlers from './handlers/uiHandlers';

// ============================================
// COMPOSANT CONTENU (Consomme le Context)
// ============================================
const StockEasyContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Contextes
  const { inlineModals } = useModalContext();
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
    trackTabSection, setTrackTabSection,
    parametersSubTab, setParametersSubTab,
    analyticsSubTab, setAnalyticsSubTab
  } = tabManagement;

  // UI State (Local)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  
  // Tab Specific Local State
  const [stockLevelFilter, setStockLevelFilter] = useState(STOCK_FILTERS.ALL);
  const [stockLevelSupplierFilter, setStockLevelSupplierFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockLevelSearch, setStockLevelSearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySupplierFilter, setHistorySupplierFilter] = useState('all');
  const [historyDateStart, setHistoryDateStart] = useState('');
  const [historyDateEnd, setHistoryDateEnd] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});

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
      setActiveTab(MAIN_TABS.TRACK);
      const targetOrder = orders.find(order => order.id === orderId);
      if (targetOrder) {
        const statusToSectionMap = {
          pending_confirmation: TRACK_TABS.EN_COURS_COMMANDE,
          preparing: TRACK_TABS.PREPARATION,
          in_transit: TRACK_TABS.EN_TRANSIT,
          received: TRACK_TABS.COMMANDES_RECUES,
          reconciliation: TRACK_TABS.RECONCILIATION
        };
        setTrackTabSection(statusToSectionMap[targetOrder.status] ?? TRACK_TABS.EN_COURS_COMMANDE);
        setExpandedOrders(prev => ({ ...prev, [orderId]: true }));
      } else {
        toast.error('Commande introuvable');
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, orders, navigate, setActiveTab, setTrackTabSection]);

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

  // Loading State
  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <RefreshCw className="w-12 h-12 text-black mx-auto mb-4" />
          </motion.div>
          <p className="text-lg font-medium text-[#191919]">Chargement depuis Supabase...</p>
        </div>
      </motion.div>
    );
  }

  const currencyCode = parameterState.deviseDefaut || DEFAULT_PARAMETERS.deviseDefaut;

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
              setTrackTabSection={setTrackTabSection}
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
          setTrackTabSection={setTrackTabSection}
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
            trackBadgeCount={orders.filter(o => ['pending_confirmation', 'preparing', 'in_transit', 'received', 'reconciliation'].includes(o.status)).length}
          />

          <div className="md:ml-64 min-h-screen bg-[#FAFAF7]">
            <div className="relative min-h-screen">
              <div className="p-4 sm:p-6 lg:p-8 pt-10 sm:pt-12 lg:pt-14">
                <div className="max-w-7xl mx-auto">
                  <AnimatePresence mode="wait">
                    {activeTab === MAIN_TABS.DASHBOARD && (
                      <DashboardTab 
                        productsByStatus={productsByStatus}
                        orders={orders}
                        enrichedProducts={enrichedProducts}
                        onViewDetails={onViewDetails}
                        seuilSurstockProfond={parameterState.seuilSurstockProfond}
                      />
                    )}

                    {activeTab === MAIN_TABS.ACTIONS && (
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
                    )}

                    {activeTab === MAIN_TABS.TRACK && (
                      <TrackTab
                        orders={orders}
                        products={products}
                        trackTabSection={trackTabSection}
                        setTrackTabSection={setTrackTabSection}
                        expandedOrders={expandedOrders}
                        toggleOrderDetails={(orderId) => UIHandlers.toggleOrderDetails(setExpandedOrders, orderId)}
                        confirmOrder={orderManagement.confirmOrder}
                        shipOrder={handlers.handleShipOrder}
                        receiveOrder={orderManagement.receiveOrder}
                        suppliers={suppliers}
                        warehouses={warehouses}
                        loadData={loadData}
                        reconciliationLogic={reconciliationLogic}
                        emailGeneration={emailGeneration}
                      />
                    )}

                    {activeTab === MAIN_TABS.STOCK && (
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
                    )}

                    {activeTab === MAIN_TABS.ANALYTICS && (
                      <AnalyticsTab
                        products={enrichedProducts}
                        orders={orders}
                        suppliers={suppliers}
                        warehouses={warehouses}
                        seuilSurstockProfond={parameterState.seuilSurstockProfond}
                        analyticsSubTab={analyticsSubTab}
                        setAnalyticsSubTab={setAnalyticsSubTab}
                      />
                    )}

                    {activeTab === MAIN_TABS.HISTORY && (
                      <HistoryTab
                        orders={orders}
                        products={products}
                        suppliers={suppliers}
                        warehouses={warehouses}
                        historyFilter={historyFilter}
                        setHistoryFilter={setHistoryFilter}
                        historySupplierFilter={historySupplierFilter}
                        setHistorySupplierFilter={setHistorySupplierFilter}
                        historyDateStart={historyDateStart}
                        setHistoryDateStart={setHistoryDateStart}
                        historyDateEnd={historyDateEnd}
                        setHistoryDateEnd={setHistoryDateEnd}
                        expandedOrders={expandedOrders}
                        toggleOrderDetails={(orderId) => UIHandlers.toggleOrderDetails(setExpandedOrders, orderId)}
                      />
                    )}

                    {activeTab === MAIN_TABS.SETTINGS && (
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
                    )}

                    {activeTab === MAIN_TABS.PROFILE && (
                      <ProfilePage />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODALS - Sans props car tout est dans le contexte ! */}
        <StockEasyModals />
      </>
    </CurrencyProvider>
  );
};

// ============================================
// COMPOSANT RACINE
// ============================================
const StockEasy = () => {
  return (
    <StockDataProvider>
      <StockEasyContent />
    </StockDataProvider>
  );
};

export default StockEasy;
