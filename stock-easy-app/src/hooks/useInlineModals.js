import { useEmailOrderModal } from './useEmailOrderModal';
import { useReconciliationModal } from './useReconciliationModal';
import { useReclamationEmailModal } from './useReclamationEmailModal';

/**
 * Hook principal pour gérer toutes les modales inline de l'application
 * Centralise la logique des modales pour éviter la duplication de code
 * et faciliter la maintenance
 */
export const useInlineModals = () => {
  const emailOrderModal = useEmailOrderModal();
  const reconciliationModal = useReconciliationModal();
  const reclamationEmailModal = useReclamationEmailModal();

  // Fonction utilitaire pour fermer toutes les modales
  const closeAllModals = () => {
    emailOrderModal.closeEmailModal();
    reconciliationModal.closeReconciliationModal();
    reclamationEmailModal.closeReclamationEmailModal();
  };

  return {
    // Email Order Modal
    emailOrderModal: {
      ...emailOrderModal,
      closeAllModals
    },
    
    // Reconciliation Modal
    reconciliationModal: {
      ...reconciliationModal,
      closeAllModals
    },
    
    // Reclamation Email Modal
    reclamationEmailModal: {
      ...reclamationEmailModal,
      closeAllModals
    },
    
    // Fonction globale
    closeAllModals
  };
};
