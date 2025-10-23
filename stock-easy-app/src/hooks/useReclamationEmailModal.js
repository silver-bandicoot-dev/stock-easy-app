import { useState } from 'react';

export const useReclamationEmailModal = () => {
  const [reclamationEmailModalOpen, setReclamationEmailModalOpen] = useState(false);
  const [currentReclamationOrder, setCurrentReclamationOrder] = useState(null);

  const openReclamationEmailModal = (order) => {
    setCurrentReclamationOrder(order);
    setReclamationEmailModalOpen(true);
  };

  const closeReclamationEmailModal = () => {
    setReclamationEmailModalOpen(false);
    setCurrentReclamationOrder(null);
  };

  return {
    reclamationEmailModalOpen,
    currentReclamationOrder,
    openReclamationEmailModal,
    closeReclamationEmailModal
  };
};
