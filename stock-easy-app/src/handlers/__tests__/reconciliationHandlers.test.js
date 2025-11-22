/**
 * Tests pour reconciliationHandlers.js
 * 
 * Ces tests protègent contre les régressions lors du refactoring
 * et servent de documentation pour comprendre le comportement attendu.
 * 
 * Handler critique : Gère la logique de réconciliation (calculs complexes, mise à jour stock)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import {
  confirmReconciliationWithQuantities,
  handleReconciliationConfirm,
  submitUnifiedReconciliation,
  submitDamageReport,
  openReconciliationModal,
  updateDiscrepancyItem,
  confirmReconciliation,
  submitDiscrepancy,
  openDamageModal
} from '../reconciliationHandlers';

// Mock de toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}));

describe('reconciliationHandlers', () => {
  let mockApi;
  let mockLoadData;
  let mockInlineModals;
  let mockReconciliationModal;
  let mockReconciliationModalHandlers;
  let mockReclamationEmailModalHandlers;
  let mockEmailGeneration;
  let mockGetUserSignature;
  let mockProducts;
  let mockOrder;

  beforeEach(() => {
    // Reset des mocks avant chaque test
    vi.clearAllMocks();
    
    // Mock API
    mockApi = {
      updateOrderStatus: vi.fn().mockResolvedValue({ success: true }),
      updateStock: vi.fn().mockResolvedValue({ success: true })
    };
    
    // Mock fonctions utilitaires
    mockLoadData = vi.fn().mockResolvedValue();
    mockGetUserSignature = vi.fn().mockReturnValue('Signature utilisateur');
    
    // Mock produits
    mockProducts = [
      { sku: 'SKU1', name: 'Produit 1' },
      { sku: 'SKU2', name: 'Produit 2' },
      { sku: 'SKU3', name: 'Produit 3' }
    ];
    
    // Mock commande
    mockOrder = {
      id: 'PO-001',
      supplier: 'Supplier1',
      items: [
        { sku: 'SKU1', quantity: 10, pricePerUnit: 5.50 },
        { sku: 'SKU2', quantity: 5, pricePerUnit: 12.00 }
      ]
    };
    
    // Mock inline modals
    mockInlineModals = {
      reconciliationModal: {
        reconciliationOrder: mockOrder,
        discrepancyItems: {},
        damagedQuantities: {},
        setDiscrepancyItems: vi.fn(),
        setDamagedQuantities: vi.fn(),
        closeReconciliationModal: vi.fn()
      }
    };
    
    // Mock reconciliation modal
    mockReconciliationModal = {
      data: {
        order: mockOrder
      }
    };
    
    // Mock handlers
    mockReconciliationModalHandlers = {
      close: vi.fn()
    };
    
    mockReclamationEmailModalHandlers = {
      open: vi.fn()
    };
    
    // Mock email generation
    mockEmailGeneration = {
      generateReclamationEmail: vi.fn().mockReturnValue('Email de réclamation')
    };
  });

  describe('confirmReconciliationWithQuantities', () => {
    let mockSetDiscrepancyTypes;
    let mockSetTrackTabSection;

    beforeEach(() => {
      mockSetDiscrepancyTypes = vi.fn();
      mockSetTrackTabSection = vi.fn();
    });

    it('devrait confirmer la réconciliation sans problèmes', async () => {
      // Configuration : toutes les quantités reçues = quantités commandées, pas de dommages
      mockInlineModals.reconciliationModal.discrepancyItems = {
        SKU1: { received: '10', notes: '' },
        SKU2: { received: '5', notes: '' }
      };
      mockInlineModals.reconciliationModal.damagedQuantities = {
        SKU1: 0,
        SKU2: 0
      };

      await confirmReconciliationWithQuantities(
        mockInlineModals,
        {},
        mockApi,
        mockLoadData,
        mockSetDiscrepancyTypes,
        mockSetTrackTabSection
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          status: 'completed',
          hasDiscrepancy: false
        })
      );

      // Vérifier que le stock est mis à jour avec les quantités reçues
      expect(mockApi.updateStock).toHaveBeenCalledWith([
        { sku: 'SKU1', quantityToAdd: 10 },
        { sku: 'SKU2', quantityToAdd: 5 }
      ]);

      expect(mockLoadData).toHaveBeenCalled();
      expect(mockInlineModals.reconciliationModal.closeReconciliationModal).toHaveBeenCalled();
      expect(mockSetDiscrepancyTypes).toHaveBeenCalledWith({});
      expect(toast.success).toHaveBeenCalledWith(
        'Réception validée et stock mis à jour avec succès!',
        expect.any(Object)
      );
    });

    it('devrait gérer les quantités manquantes', async () => {
      // Configuration : quantités reçues < quantités commandées
      mockInlineModals.reconciliationModal.discrepancyItems = {
        SKU1: { received: '8', notes: '2 manquantes' }, // 10 commandés, 8 reçus
        SKU2: { received: '5', notes: '' }
      };
      mockInlineModals.reconciliationModal.damagedQuantities = {
        SKU1: 0,
        SKU2: 0
      };

      await confirmReconciliationWithQuantities(
        mockInlineModals,
        {},
        mockApi,
        mockLoadData,
        mockSetDiscrepancyTypes,
        mockSetTrackTabSection
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          status: 'reconciliation',
          hasDiscrepancy: true,
          missingQuantitiesBySku: { SKU1: 2 }
        })
      );

      expect(mockSetTrackTabSection).toHaveBeenCalledWith('reconciliation');
      expect(toast.success).toHaveBeenCalledWith(
        'Réception enregistrée avec écarts. Commande déplacée vers "Réconciliation".',
        expect.any(Object)
      );
    });

    it('devrait gérer les produits endommagés', async () => {
      // Configuration : produits endommagés
      mockInlineModals.reconciliationModal.discrepancyItems = {
        SKU1: { received: '10', notes: '' },
        SKU2: { received: '5', notes: '' }
      };
      mockInlineModals.reconciliationModal.damagedQuantities = {
        SKU1: 2, // 2 endommagés
        SKU2: 0
      };

      await confirmReconciliationWithQuantities(
        mockInlineModals,
        {},
        mockApi,
        mockLoadData,
        mockSetDiscrepancyTypes,
        mockSetTrackTabSection
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          status: 'reconciliation',
          hasDiscrepancy: true,
          damagedQuantitiesBySku: { SKU1: 2 }
        })
      );

      // Le stock ne doit être mis à jour qu'avec les quantités saines (reçues - endommagées)
      expect(mockApi.updateStock).toHaveBeenCalledWith([
        { sku: 'SKU1', quantityToAdd: 10 }, // Seulement les quantités reçues saines
        { sku: 'SKU2', quantityToAdd: 5 }
      ]);
    });

    it('devrait gérer les quantités manquantes ET endommagées', async () => {
      // Configuration : quantités manquantes + endommagées
      mockInlineModals.reconciliationModal.discrepancyItems = {
        SKU1: { received: '7', notes: '' }, // 10 commandés, 7 reçus sains
        SKU2: { received: '5', notes: '' }
      };
      mockInlineModals.reconciliationModal.damagedQuantities = {
        SKU1: 1, // 1 endommagé
        SKU2: 0
      };

      await confirmReconciliationWithQuantities(
        mockInlineModals,
        {},
        mockApi,
        mockLoadData,
        mockSetDiscrepancyTypes,
        mockSetTrackTabSection
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          status: 'reconciliation',
          hasDiscrepancy: true,
          missingQuantitiesBySku: { SKU1: 2 }, // 10 - (7 + 1) = 2
          damagedQuantitiesBySku: { SKU1: 1 }
        })
      );

      // Vérifier que le type de problème est 'missing_and_damaged'
      const updateCall = mockApi.updateOrderStatus.mock.calls[0][1];
      const sku1Item = updateCall.items.find(item => item.sku === 'SKU1');
      expect(sku1Item.discrepancyType).toBe('missing_and_damaged');
    });

    it('devrait valider les quantités invalides', async () => {
      mockInlineModals.reconciliationModal.discrepancyItems = {
        SKU1: { received: '-5', notes: '' }, // Quantité négative
        SKU2: { received: '5', notes: '' }
      };
      mockInlineModals.reconciliationModal.damagedQuantities = {
        SKU1: 0,
        SKU2: 0
      };

      await confirmReconciliationWithQuantities(
        mockInlineModals,
        {},
        mockApi,
        mockLoadData,
        mockSetDiscrepancyTypes,
        mockSetTrackTabSection
      );

      // La fonction catch l'erreur et affiche un toast, elle ne rejette pas
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Quantité invalide pour SKU1')
      );
      expect(mockApi.updateOrderStatus).not.toHaveBeenCalled();
    });

    it('ne devrait rien faire si pas de commande', async () => {
      mockInlineModals.reconciliationModal.reconciliationOrder = null;

      await confirmReconciliationWithQuantities(
        mockInlineModals,
        {},
        mockApi,
        mockLoadData,
        mockSetDiscrepancyTypes,
        mockSetTrackTabSection
      );

      expect(mockApi.updateOrderStatus).not.toHaveBeenCalled();
    });
  });

  describe('handleReconciliationConfirm', () => {
    it('devrait compléter la commande si pas d\'écarts', async () => {
      const reconciliationData = {
        receivedItems: {
          SKU1: { received: 10 },
          SKU2: { received: 5 }
        },
        damages: {},
        discrepancies: {}
      };

      await handleReconciliationConfirm(
        reconciliationData,
        mockReconciliationModal,
        mockApi,
        mockLoadData,
        mockReconciliationModalHandlers,
        mockReclamationEmailModalHandlers,
        mockEmailGeneration,
        mockGetUserSignature,
        mockProducts
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          status: 'completed',
          hasDiscrepancy: false,
          damageReport: false
        })
      );

      expect(mockApi.updateStock).toHaveBeenCalled();
      expect(mockReconciliationModalHandlers.close).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Réconciliation validée - Commande complétée');
    });

    it('devrait mettre en réconciliation si écarts détectés', async () => {
      const reconciliationData = {
        receivedItems: {
          SKU1: 8, // Format direct : nombre au lieu de {received: 8}
          SKU2: 5
        },
        damages: {},
        discrepancies: { SKU1: -2 }
      };

      await handleReconciliationConfirm(
        reconciliationData,
        mockReconciliationModal,
        mockApi,
        mockLoadData,
        mockReconciliationModalHandlers,
        mockReclamationEmailModalHandlers,
        mockEmailGeneration,
        mockGetUserSignature,
        mockProducts
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          status: 'reconciliation',
          hasDiscrepancy: true
        })
      );

      // Vérifier que missingQuantitiesBySku contient SKU1: 2
      const updateCall = mockApi.updateOrderStatus.mock.calls[0][1];
      expect(updateCall.missingQuantitiesBySku.SKU1).toBe(2);

      expect(mockEmailGeneration.generateReclamationEmail).toHaveBeenCalled();
      expect(mockReclamationEmailModalHandlers.open).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Commande mise en réconciliation avec réclamation générée');
    });

    it('devrait gérer les dommages', async () => {
      const reconciliationData = {
        receivedItems: {
          SKU1: { received: 10 },
          SKU2: { received: 5 }
        },
        damages: {
          SKU1: 2 // 2 endommagés
        },
        discrepancies: {}
      };

      await handleReconciliationConfirm(
        reconciliationData,
        mockReconciliationModal,
        mockApi,
        mockLoadData,
        mockReconciliationModalHandlers,
        mockReclamationEmailModalHandlers,
        mockEmailGeneration,
        mockGetUserSignature,
        mockProducts
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          status: 'reconciliation',
          damageReport: true,
          damagedQuantitiesBySku: { SKU1: 2 }
        })
      );
    });
  });

  describe('submitUnifiedReconciliation', () => {
    let mockSetUnifiedReconciliationModalOpen;
    let mockSetUnifiedReconciliationItems;
    let mockSetReconciliationNotes;
    let mockSetReconciliationOrder;

    beforeEach(() => {
      mockSetUnifiedReconciliationModalOpen = vi.fn();
      mockSetUnifiedReconciliationItems = vi.fn();
      mockSetReconciliationNotes = vi.fn();
      mockSetReconciliationOrder = vi.fn();
    });

    it('devrait soumettre une réconciliation sans problèmes', async () => {
      const unifiedItems = {
        SKU1: { ordered: 10, received: 10, damaged: 0 },
        SKU2: { ordered: 5, received: 5, damaged: 0 }
      };

      await submitUnifiedReconciliation(
        unifiedItems,
        mockOrder,
        '',
        mockProducts,
        mockGetUserSignature,
        mockApi,
        mockLoadData,
        mockSetUnifiedReconciliationModalOpen,
        mockSetUnifiedReconciliationItems,
        mockSetReconciliationNotes,
        mockSetReconciliationOrder
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          status: 'reconciliation',
          hasDiscrepancy: false,
          hasDamage: false
        })
      );

      // Le stock doit être mis à jour avec les quantités validées (reçues - endommagées)
      expect(mockApi.updateStock).toHaveBeenCalledWith([
        { sku: 'SKU1', quantityToAdd: 10 },
        { sku: 'SKU2', quantityToAdd: 5 }
      ]);

      expect(mockLoadData).toHaveBeenCalled();
      expect(mockSetUnifiedReconciliationModalOpen).toHaveBeenCalledWith(false);
      expect(toast.success).toHaveBeenCalledWith('Réconciliation enregistrée avec succès !');
    });

    it('devrait générer un email de réclamation si écarts', async () => {
      const unifiedItems = {
        SKU1: { ordered: 10, received: 8, damaged: 0 }, // 2 manquantes
        SKU2: { ordered: 5, received: 5, damaged: 0 }
      };

      await submitUnifiedReconciliation(
        unifiedItems,
        mockOrder,
        'Notes de réclamation',
        mockProducts,
        mockGetUserSignature,
        mockApi,
        mockLoadData,
        mockSetUnifiedReconciliationModalOpen,
        mockSetUnifiedReconciliationItems,
        mockSetReconciliationNotes,
        mockSetReconciliationOrder
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          hasDiscrepancy: true,
          missingQuantitiesBySku: { SKU1: 2 }
        })
      );

      expect(toast.success).toHaveBeenCalledWith(
        'Email de réclamation généré !',
        expect.any(Object)
      );
    });

    it('devrait gérer les produits endommagés', async () => {
      const unifiedItems = {
        SKU1: { ordered: 10, received: 10, damaged: 2 },
        SKU2: { ordered: 5, received: 5, damaged: 0 }
      };

      await submitUnifiedReconciliation(
        unifiedItems,
        mockOrder,
        '',
        mockProducts,
        mockGetUserSignature,
        mockApi,
        mockLoadData,
        mockSetUnifiedReconciliationModalOpen,
        mockSetUnifiedReconciliationItems,
        mockSetReconciliationNotes,
        mockSetReconciliationOrder
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          hasDamage: true,
          damagedQuantitiesBySku: { SKU1: 2 }
        })
      );

      // Le stock doit être mis à jour avec les quantités validées (reçues - endommagées)
      expect(mockApi.updateStock).toHaveBeenCalledWith([
        { sku: 'SKU1', quantityToAdd: 8 }, // 10 - 2 = 8
        { sku: 'SKU2', quantityToAdd: 5 }
      ]);
    });
  });

  describe('submitDamageReport', () => {
    let mockSetDamageModalOpen;
    let mockSetDamageItems;
    let mockSetDamageNotes;
    let mockSetReconciliationOrder;

    beforeEach(() => {
      mockSetDamageModalOpen = vi.fn();
      mockSetDamageItems = vi.fn();
      mockSetDamageNotes = vi.fn();
      mockSetReconciliationOrder = vi.fn();
    });

    it('devrait soumettre un rapport de dommages', async () => {
      const damageItems = {
        SKU1: { total: 10, damaged: 2 },
        SKU2: { total: 5, damaged: 0 }
      };

      await submitDamageReport(
        damageItems,
        mockOrder,
        'Notes sur les dommages',
        mockProducts,
        mockGetUserSignature,
        mockApi,
        mockLoadData,
        mockSetDamageModalOpen,
        mockSetDamageItems,
        mockSetDamageNotes,
        mockSetReconciliationOrder
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          status: 'reconciliation',
          hasDiscrepancy: true,
          damageReport: true
        })
      );

      // Le stock doit être mis à jour avec les quantités non endommagées
      expect(mockApi.updateStock).toHaveBeenCalledWith([
        { sku: 'SKU1', quantityToAdd: 8 }, // 10 - 2 = 8
        { sku: 'SKU2', quantityToAdd: 5 }
      ]);

      expect(toast.success).toHaveBeenCalledWith(
        'Email de réclamation pour dommages généré !',
        expect.any(Object)
      );
    });
  });

  describe('openReconciliationModal', () => {
    let mockSetReconciliationOrder;
    let mockSetDiscrepancyTypes;
    let mockSetReconciliationModalOpen;

    beforeEach(() => {
      mockSetReconciliationOrder = vi.fn();
      mockSetDiscrepancyTypes = vi.fn();
      mockSetReconciliationModalOpen = vi.fn();
    });

    it('devrait ouvrir le modal et initialiser les quantités', () => {
      openReconciliationModal(
        mockOrder,
        mockSetReconciliationOrder,
        mockInlineModals,
        mockSetDiscrepancyTypes,
        mockSetReconciliationModalOpen
      );

      expect(mockSetReconciliationOrder).toHaveBeenCalledWith(mockOrder);
      expect(mockInlineModals.reconciliationModal.setDiscrepancyItems).toHaveBeenCalled();
      expect(mockSetDiscrepancyTypes).toHaveBeenCalled();
      expect(mockInlineModals.reconciliationModal.setDamagedQuantities).toHaveBeenCalled();
      expect(mockSetReconciliationModalOpen).toHaveBeenCalledWith(true);
    });

    it('devrait utiliser receivedQuantity si disponible', () => {
      const orderWithReceived = {
        ...mockOrder,
        items: [
          { sku: 'SKU1', quantity: 10, receivedQuantity: 8 },
          { sku: 'SKU2', quantity: 5 }
        ]
      };

      openReconciliationModal(
        orderWithReceived,
        mockSetReconciliationOrder,
        mockInlineModals,
        mockSetDiscrepancyTypes,
        mockSetReconciliationModalOpen
      );

      const setItemsCall = mockInlineModals.reconciliationModal.setDiscrepancyItems.mock.calls[0][0];
      expect(setItemsCall.SKU1.received).toBe(8); // Utilise receivedQuantity
      expect(setItemsCall.SKU2.received).toBe(5); // Utilise quantity par défaut
    });
  });

  describe('updateDiscrepancyItem', () => {
    it('devrait mettre à jour un item de réconciliation', () => {
      // Initialiser avec des données existantes
      const initialItems = {
        SKU1: { received: 10, notes: 'Note initiale' }
      };
      
      // Simuler le comportement de setDiscrepancyItems qui prend une fonction
      let currentItems = { ...initialItems };
      mockInlineModals.reconciliationModal.setDiscrepancyItems = vi.fn((updater) => {
        if (typeof updater === 'function') {
          currentItems = updater(currentItems);
        } else {
          currentItems = updater;
        }
      });

      updateDiscrepancyItem(
        'SKU1',
        'received',
        8,
        10,
        mockInlineModals
      );

      // Vérifier que setDiscrepancyItems a été appelé
      expect(mockInlineModals.reconciliationModal.setDiscrepancyItems).toHaveBeenCalled();
      
      // Vérifier le résultat via la fonction updater
      const updaterFn = mockInlineModals.reconciliationModal.setDiscrepancyItems.mock.calls[0][0];
      const updatedItems = updaterFn(initialItems);
      expect(updatedItems.SKU1.received).toBe(8);
      expect(updatedItems.SKU1.notes).toBe('Note initiale'); // Les autres champs sont préservés
    });
  });

  describe('confirmReconciliation', () => {
    let mockSetReconciliationModalOpen;
    let mockSetReconciliationOrder;

    beforeEach(() => {
      mockSetReconciliationModalOpen = vi.fn();
      mockSetReconciliationOrder = vi.fn();
    });

    it('devrait compléter la commande si pas d\'écarts', async () => {
      await confirmReconciliation(
        false, // Pas d'écarts
        mockOrder,
        mockApi,
        mockLoadData,
        mockSetReconciliationModalOpen,
        mockSetReconciliationOrder
      );

      expect(mockApi.updateStock).toHaveBeenCalledWith([
        { sku: 'SKU1', quantityToAdd: 10 },
        { sku: 'SKU2', quantityToAdd: 5 }
      ]);

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          status: 'completed'
        })
      );

      expect(toast.success).toHaveBeenCalledWith('Réception validée ! Stock mis à jour automatiquement.');
    });

    it('devrait fermer le modal si écarts détectés', async () => {
      await confirmReconciliation(
        true, // Il y a des écarts
        mockOrder,
        mockApi,
        mockLoadData,
        mockSetReconciliationModalOpen,
        mockSetReconciliationOrder
      );

      expect(mockSetReconciliationModalOpen).toHaveBeenCalledWith(false);
      expect(mockApi.updateOrderStatus).not.toHaveBeenCalled();
    });
  });

  describe('submitDiscrepancy', () => {
    let mockSetDiscrepancyModalOpen;
    let mockSetReconciliationOrder;

    beforeEach(() => {
      mockSetDiscrepancyModalOpen = vi.fn();
      mockSetReconciliationOrder = vi.fn();
      
      mockInlineModals.reconciliationModal.discrepancyItems = {
        SKU1: { ordered: 10, received: 8 },
        SKU2: { ordered: 5, received: 5 }
      };
    });

    it('devrait soumettre les écarts et générer un email', async () => {
      await submitDiscrepancy(
        mockOrder,
        mockInlineModals,
        mockProducts,
        mockGetUserSignature,
        mockApi,
        mockLoadData,
        mockSetDiscrepancyModalOpen,
        mockSetReconciliationOrder
      );

      expect(mockApi.updateOrderStatus).toHaveBeenCalledWith(
        'PO-001',
        expect.objectContaining({
          status: 'reconciliation',
          hasDiscrepancy: true
        })
      );

      // Le stock doit être mis à jour avec les quantités réellement reçues
      expect(mockApi.updateStock).toHaveBeenCalledWith([
        { sku: 'SKU1', quantityToAdd: 8 },
        { sku: 'SKU2', quantityToAdd: 5 }
      ]);

      expect(toast.success).toHaveBeenCalledWith(
        'Email de réclamation généré !',
        expect.any(Object)
      );
    });
  });

  describe('openDamageModal', () => {
    it('devrait appeler confirmReconciliation avec hasDiscrepancy = true', () => {
      const mockConfirmReconciliation = vi.fn();
      
      openDamageModal(mockConfirmReconciliation);
      
      expect(mockConfirmReconciliation).toHaveBeenCalledWith(true);
    });
  });
});

