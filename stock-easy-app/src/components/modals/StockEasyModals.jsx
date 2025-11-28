import React, { useState } from 'react';
import { ReconciliationModal } from '../track/modals/ReconciliationModal';
import { ReclamationEmailModal } from '../track/modals/ReclamationEmailModal';
import { ShipOrderModal } from './ShipOrderModal';
import { SupplierModal } from '../settings/SupplierModal';
import { AssignSupplierModal } from '../settings/AssignSupplierModal';
import { InlineModalsContainer } from './InlineModalsContainer';
import { useModalContext } from '../../contexts/ModalContext';
import { useStockContext } from '../../contexts/StockDataContext';
import * as OrderHandlers from '../../handlers/orderHandlers';
import * as ReconciliationHandlers from '../../handlers/reconciliationHandlers';
import * as MappingHandlers from '../../handlers/mappingHandlers';
import { roundToTwoDecimals } from '../../utils/decimalUtils';

export const StockEasyModals = () => {
  // 1. Contextes
  const { 
    reconciliationModal, 
    reconciliationModalHandlers,
    reclamationEmailModal,
    reclamationEmailModalHandlers,
    inlineModals 
  } = useModalContext();

  const {
    // Data
    products,
    orders,
    suppliers,
    warehouses,
    toOrderBySupplier,
    
    // Utils
    api,
    loadData,
    getUserSignature,
    emailGeneration,
    orderManagement, // pour generatePONumber
    
    // Navigation
    tabManagement,
    
    // Modal Hooks & Handlers
    shipOrderModal,
    handlers, // handleConfirmShipOrder, handleReconciliationConfirm
    
    // Sub-hooks logic
    supplierManagement,
    supplierMapping
  } = useStockContext();

  // 2. État local (déplacé depuis StockEasy.jsx)
  const [discrepancyTypes, setDiscrepancyTypes] = useState({});

  // 3. Dérivations pour faciliter l'usage
  const { generatePONumber } = orderManagement;
  const { setActiveTab } = tabManagement;
  
  const { 
    supplierModalOpen, 
    handleCloseSupplierModal, 
    supplierFormData, 
    handleSupplierFormChange, 
    handleSaveSupplier, 
    editingSupplier 
  } = supplierManagement;

  const {
    assignSupplierModalOpen,
    setAssignSupplierModalOpen,
    productToMap,
    setProductToMap,
    selectedSupplierForMapping,
    setSelectedSupplierForMapping
  } = supplierMapping;

  // 4. Handlers adaptés
  const handleReconciliationConfirm = async (reconciliationData) => {
    // Utiliser le handler du contexte ou appeler directement le handler
    // Ici on appelle directement le handler de réconciliation qui a besoin de props spécifiques
    return await ReconciliationHandlers.handleReconciliationConfirm(
      reconciliationData,
      reconciliationModal,
      api,
      loadData,
      reconciliationModalHandlers,
      reclamationEmailModalHandlers,
      emailGeneration,
      getUserSignature,
      products
    );
  };

  return (
    <>
      {/* Modal de réconciliation */}
      <ReconciliationModal
        isOpen={reconciliationModal.isOpen}
        onClose={reconciliationModalHandlers.close}
        order={reconciliationModal.data.order}
        products={products}
        onConfirm={handleReconciliationConfirm}
      />

      {/* Modal d'email de réclamation */}
      <ReclamationEmailModal
        isOpen={reclamationEmailModal.isOpen}
        onClose={reclamationEmailModalHandlers.close}
        order={reclamationEmailModal.data.order}
        emailContent={reclamationEmailModal.data.emailContent}
        onCopy={emailGeneration.copyToClipboard}
      />

      {/* Modal d'expédition */}
      <ShipOrderModal
        isOpen={shipOrderModal.isOpen}
        onClose={shipOrderModal.closeModal}
        onConfirm={handlers.handleConfirmShipOrder}
        trackingNumber={shipOrderModal.trackingNumber}
        setTrackingNumber={shipOrderModal.setTrackingNumber}
        trackingUrl={shipOrderModal.trackingUrl}
        setTrackingUrl={shipOrderModal.setTrackingUrl}
      />

      {/* Modal de gestion des fournisseurs */}
      <SupplierModal
        isOpen={supplierModalOpen}
        onClose={handleCloseSupplierModal}
        formData={supplierFormData}
        onChange={handleSupplierFormChange}
        onSave={handleSaveSupplier}
        isEditing={!!editingSupplier}
      />

      {/* Modal d'assignation de fournisseur */}
      <AssignSupplierModal
        isOpen={assignSupplierModalOpen}
        onClose={() => MappingHandlers.handleCloseAssignSupplierModal(
          setAssignSupplierModalOpen,
          setProductToMap,
          setSelectedSupplierForMapping
        )}
        product={productToMap}
        suppliers={suppliers}
        selectedSupplier={selectedSupplierForMapping}
        onSupplierChange={setSelectedSupplierForMapping}
        onAssign={async () => {
          const selectedSupplier = inlineModals.emailOrderModal.selectedSupplier || selectedSupplierForMapping;
          return await MappingHandlers.handleAssignSupplier(
            productToMap,
            selectedSupplier,
            api,
            loadData,
            () => MappingHandlers.handleCloseAssignSupplierModal(
              setAssignSupplierModalOpen,
              setProductToMap,
              setSelectedSupplierForMapping
            )
          );
        }}
      />

      {/* Conteneur des modales inline */}
      <InlineModalsContainer
        emailOrderModal={inlineModals.emailOrderModal}
        warehouses={warehouses}
        toOrderBySupplier={toOrderBySupplier}
        emailGeneration={emailGeneration}
        getUserSignature={getUserSignature}
        handleCreateOrderWithoutEmail={async () => await OrderHandlers.handleCreateOrderWithoutEmail(
          inlineModals,
          toOrderBySupplier,
          api,
          loadData,
          roundToTwoDecimals,
          generatePONumber,
          orders,
          setActiveTab
        )}
        handleSendOrder={async () => await OrderHandlers.handleSendOrder(
          inlineModals,
          toOrderBySupplier,
          api,
          loadData,
          roundToTwoDecimals,
          generatePONumber,
          emailGeneration,
          getUserSignature,
          suppliers,
          warehouses,
          orders,
          setActiveTab
        )}
        suppliers={suppliers}
        reconciliationModal={inlineModals.reconciliationModal}
        products={products}
        confirmReconciliationWithQuantities={async () => await ReconciliationHandlers.confirmReconciliationWithQuantities(
          inlineModals,
          discrepancyTypes,
          api,
          loadData,
          setDiscrepancyTypes,
          setActiveTab
        )}
        reclamationEmailModal={inlineModals.reclamationEmailModal}
      />
    </>
  );
};
