import { useState } from 'react';

/**
 * Hook centralisé pour la gestion de tous les modals de l'application
 * Remplace tous les useState individuels pour les modals
 */
export const useModals = () => {
  // États des modals
  const [emailModal, setEmailModal] = useState({ isOpen: false, data: {} });
  const [orderCreationModal, setOrderCreationModal] = useState({ isOpen: false, data: {} });
  const [receivingModal, setReceivingModal] = useState({ isOpen: false, data: {} });
  const [reconciliationModal, setReconciliationModal] = useState({ isOpen: false, data: {} });
  const [reclamationEmailModal, setReclamationEmailModal] = useState({ isOpen: false, data: {} });
  const [supplierModal, setSupplierModal] = useState({ isOpen: false, data: {} });
  const [assignSupplierModal, setAssignSupplierModal] = useState({ isOpen: false, data: {} });
  const [warehouseModal, setWarehouseModal] = useState({ isOpen: false, data: {} });

  // Handlers pour email modal
  const emailModalHandlers = {
    open: (data) => {
      setEmailModal({
        isOpen: true,
        data: data
      });
    },
    close: () => {
      setEmailModal({ isOpen: false, data: {} });
    }
  };

  // Handlers pour order creation modal
  const orderCreationModalHandlers = {
    open: (products) => {
      setOrderCreationModal({
        isOpen: true,
        data: { products }
      });
    },
    close: () => {
      setOrderCreationModal({ isOpen: false, data: {} });
    }
  };

  // Handlers pour receiving modal
  const receivingModalHandlers = {
    open: (order) => {
      setReceivingModal({
        isOpen: true,
        data: { order }
      });
    },
    close: () => {
      setReceivingModal({ isOpen: false, data: {} });
    }
  };

  // Handlers pour reconciliation modal
  const reconciliationModalHandlers = {
    open: (order) => {
      setReconciliationModal({
        isOpen: true,
        data: { order }
      });
    },
    close: () => {
      setReconciliationModal({ isOpen: false, data: {} });
    }
  };

  // Handlers pour reclamation email modal
  const reclamationEmailModalHandlers = {
    open: (order, emailContent) => {
      setReclamationEmailModal({
        isOpen: true,
        data: { order, emailContent }
      });
    },
    close: () => {
      setReclamationEmailModal({ isOpen: false, data: {} });
    }
  };

  // Handlers pour supplier modal
  const supplierModalHandlers = {
    open: (supplier) => {
      setSupplierModal({
        isOpen: true,
        data: { supplier }
      });
    },
    close: () => {
      setSupplierModal({ isOpen: false, data: {} });
    }
  };

  // Handlers pour assign supplier modal
  const assignSupplierModalHandlers = {
    open: (product) => {
      setAssignSupplierModal({
        isOpen: true,
        data: { product }
      });
    },
    close: () => {
      setAssignSupplierModal({ isOpen: false, data: {} });
    }
  };

  // Handlers pour warehouse modal
  const warehouseModalHandlers = {
    open: (warehouse) => {
      setWarehouseModal({
        isOpen: true,
        data: { warehouse }
      });
    },
    close: () => {
      setWarehouseModal({ isOpen: false, data: {} });
    }
  };

  return {
    // États des modals
    emailModal,
    orderCreationModal,
    receivingModal,
    reconciliationModal,
    reclamationEmailModal,
    supplierModal,
    assignSupplierModal,
    warehouseModal,
    
    // Handlers
    emailModalHandlers,
    orderCreationModalHandlers,
    receivingModalHandlers,
    reconciliationModalHandlers,
    reclamationEmailModalHandlers,
    supplierModalHandlers,
    assignSupplierModalHandlers,
    warehouseModalHandlers
  };
};
