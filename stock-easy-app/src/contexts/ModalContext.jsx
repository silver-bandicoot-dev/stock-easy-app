import React, { createContext, useContext } from 'react';
import { useModals } from '../hooks/useModals';
import { useInlineModals } from '../hooks/useInlineModals';

const ModalContext = createContext(null);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  // Standard Modals
  const {
    emailModal,
    orderCreationModal,
    receivingModal,
    reconciliationModal,
    reclamationEmailModal,
    supplierModal,
    assignSupplierModal,
    warehouseModal,
    emailModalHandlers,
    orderCreationModalHandlers,
    receivingModalHandlers,
    reconciliationModalHandlers,
    reclamationEmailModalHandlers,
    supplierModalHandlers,
    assignSupplierModalHandlers,
    warehouseModalHandlers
  } = useModals();

  // Inline Modals
  const inlineModals = useInlineModals();

  const value = {
    // Standard Modals State & Handlers
    emailModal,
    orderCreationModal,
    receivingModal,
    reconciliationModal,
    reclamationEmailModal,
    supplierModal,
    assignSupplierModal,
    warehouseModal,
    emailModalHandlers,
    orderCreationModalHandlers,
    receivingModalHandlers,
    reconciliationModalHandlers,
    reclamationEmailModalHandlers,
    supplierModalHandlers,
    assignSupplierModalHandlers,
    warehouseModalHandlers,

    // Inline Modals
    inlineModals
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

