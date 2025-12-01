import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockDataProvider, useStockContext } from './contexts/StockDataContext';
import { useModalContext } from './contexts/ModalContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { SkeletonDashboard } from './components/ui/Skeleton';
import { Logo } from './components/ui/Logo';
import { OnboardingTourProvider } from './components/onboarding';
import StockeasyUI from './components/layout/StockeasyUI';
import { DEFAULT_PARAMETERS } from './constants/stockEasyConstants';

// ============================================
// COMPOSANT CONTENU (Consomme le Context)
// ============================================
const StockeasyContent = () => {
  const navigate = useNavigate();
  
  // State pour contrôler l'expansion du menu Settings (pour le tour)
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  
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
    parametersSubTab, setParametersSubTab
  } = tabManagement;
  
  // Fonction pour ouvrir le menu paramètres (utilisée par le tour)
  const expandSettingsMenu = useCallback(() => {
    setSettingsExpanded(true);
  }, []);

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

  // Render avec OnboardingTourProvider (render prop pattern)
  return (
    <OnboardingTourProvider
      setActiveTab={setActiveTab}
      setSettingsSubTab={setParametersSubTab}
      expandSettingsMenu={expandSettingsMenu}
      autoStart={true}
      autoStartDelay={2500}
    >
      {({ startTour, isTourActive }) => (
        <StockeasyUI
          navigate={navigate}
          loading={loading}
          syncing={syncing}
          products={products}
          orders={orders}
          suppliers={suppliers}
          warehouses={warehouses}
          parameters={parameters}
          loadData={loadData}
          handleSyncData={handleSyncData}
          api={api}
          enrichedProducts={enrichedProducts}
          productsByStatus={productsByStatus}
          toOrderBySupplier={toOrderBySupplier}
          currentUser={currentUser}
          getUserSignature={getUserSignature}
          tabManagement={tabManagement}
          parameterState={parameterState}
          parameterEditing={parameterEditing}
          orderManagement={orderManagement}
          supplierManagement={supplierManagement}
          supplierMapping={supplierMapping}
          warehouseActions={warehouseActions}
          reconciliationLogic={reconciliationLogic}
          emailGeneration={emailGeneration}
          handlers={handlers}
          inlineModals={inlineModals}
          reconciliationModal={reconciliationModal}
          reconciliationModalHandlers={reconciliationModalHandlers}
          reclamationEmailModal={reclamationEmailModal}
          reclamationEmailModalHandlers={reclamationEmailModalHandlers}
          settingsExpanded={settingsExpanded}
          setSettingsExpanded={setSettingsExpanded}
          // Props du tour passées directement
          startTour={startTour}
          isTourActive={isTourActive}
        />
      )}
    </OnboardingTourProvider>
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
