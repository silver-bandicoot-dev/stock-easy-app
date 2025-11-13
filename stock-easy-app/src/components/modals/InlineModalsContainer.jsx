import React from 'react';
import { EmailOrderModalInline } from './EmailOrderModalInline';
import { ReconciliationModalInline } from './ReconciliationModalInline';
import { ReclamationEmailModalInline } from './ReclamationEmailModalInline';

/**
 * Composant conteneur pour toutes les modales inline
 * Centralise le rendu des modales pour une meilleure organisation du code
 */
export const InlineModalsContainer = ({
  // Email Order Modal props
  emailOrderModal,
  warehouses,
  toOrderBySupplier,
  emailGeneration,
  getUserSignature,
  handleCreateOrderWithoutEmail,
  handleSendOrder,
  suppliers,
  
  // Reconciliation Modal props
  reconciliationModal,
  products,
  confirmReconciliationWithQuantities,
  
  // Reclamation Email Modal props
  reclamationEmailModal
}) => {
  return (
    <>
      {/* Modal Email pour les commandes */}
      <EmailOrderModalInline
        isOpen={emailOrderModal.emailModalOpen}
        onClose={emailOrderModal.closeEmailModal}
        selectedSupplier={emailOrderModal.selectedSupplier}
        toOrderBySupplier={toOrderBySupplier}
        warehouses={warehouses}
        selectedWarehouse={emailOrderModal.selectedWarehouse}
        setSelectedWarehouse={emailOrderModal.setSelectedWarehouse}
        orderQuantities={emailOrderModal.orderQuantities}
        updateOrderQuantity={emailOrderModal.updateOrderQuantity}
        emailGeneration={emailGeneration}
        getUserSignature={getUserSignature}
        handleCreateOrderWithoutEmail={handleCreateOrderWithoutEmail}
        handleSendOrder={handleSendOrder}
        suppliers={suppliers}
      />

      {/* Modal Reconciliation */}
      <ReconciliationModalInline
        isOpen={reconciliationModal.reconciliationModalOpen}
        onClose={reconciliationModal.closeReconciliationModal}
        reconciliationOrder={reconciliationModal.reconciliationOrder}
        products={products}
        warehouses={warehouses}
        suppliers={suppliers}
        discrepancyItems={reconciliationModal.discrepancyItems}
        setDiscrepancyItems={reconciliationModal.setDiscrepancyItems}
        damagedQuantities={reconciliationModal.damagedQuantities}
        setDamagedQuantities={reconciliationModal.setDamagedQuantities}
        confirmReconciliationWithQuantities={confirmReconciliationWithQuantities}
      />

      {/* Modal Email de Réclamation */}
      <ReclamationEmailModalInline
        isOpen={reclamationEmailModal.reclamationEmailModalOpen}
        onClose={reclamationEmailModal.closeReclamationEmailModal}
        currentReclamationOrder={reclamationEmailModal.currentReclamationOrder}
        emailGeneration={emailGeneration}
        getUserSignature={getUserSignature}
      />
    </>
  );
};
