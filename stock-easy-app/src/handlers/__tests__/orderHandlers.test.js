/**
 * Tests pour orderHandlers.js
 * 
 * Ces tests protègent contre les régressions lors du refactoring
 * et servent de documentation pour comprendre le comportement attendu.
 * 
 * Handler critique : Gère la création de commandes (core business)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import {
  handleCreateOrder,
  handleCreateOrderFromTable,
  handleSendOrder,
  handleCreateOrderWithoutEmail,
  handleOpenEmailModal,
  handleShipOrder,
  handleConfirmShipOrder
} from '../orderHandlers';

// Mock de toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}));

// Mock de feature-flags
vi.mock('../../config/feature-flags', () => ({
  REFACTOR_FLAGS: {
    PHASE_8_ACTIVE: true,
    PHASE_10_ACTIVE: true
  }
}));

describe('orderHandlers', () => {
  let mockApi;
  let mockLoadData;
  let mockGeneratePONumber;
  let mockRoundToTwoDecimals;
  let mockSetEmailModalOpen;
  let mockSetSelectedSupplier;
  let mockSetSelectedWarehouse;
  let mockSetOrderQuantities;
  let mockSetActiveTab;
  let mockInlineModals;
  let mockEmailGeneration;
  let mockGetUserSignature;
  let mockShipOrder;
  let mockShipOrderModal;

  beforeEach(() => {
    // Reset des mocks avant chaque test
    vi.clearAllMocks();
    
    // Mock API
    mockApi = {
      createOrder: vi.fn().mockResolvedValue({ success: true })
    };
    
    // Mock fonctions utilitaires
    mockLoadData = vi.fn().mockResolvedValue();
    mockGeneratePONumber = vi.fn((orders) => 'PO-001');
    mockRoundToTwoDecimals = vi.fn((value) => Math.round(value * 100) / 100);
    
    // Mock setters
    mockSetEmailModalOpen = vi.fn();
    mockSetSelectedSupplier = vi.fn();
    mockSetSelectedWarehouse = vi.fn();
    mockSetOrderQuantities = vi.fn();
    mockSetActiveTab = vi.fn();
    
    // Mock inline modals
    mockInlineModals = {
      emailOrderModal: {
        selectedSupplier: 'Supplier1',
        selectedWarehouse: 'Warehouse1',
        orderQuantities: {},
        openEmailModal: vi.fn(),
        updateOrderQuantity: vi.fn(),
        setSelectedWarehouse: vi.fn(),
        closeEmailModal: vi.fn()
      }
    };
    
    // Mock email generation
    mockEmailGeneration = {
      generateOrderEmailDraft: vi.fn().mockReturnValue('Email content')
    };
    
    mockGetUserSignature = vi.fn().mockReturnValue('Signature');
    
    // Mock ship order
    mockShipOrder = vi.fn().mockResolvedValue();
    mockShipOrderModal = {
      orderId: 'PO-001',
      openModal: vi.fn(),
      closeModal: vi.fn()
    };
  });

  describe('handleCreateOrder', () => {
    const mockProducts = [
      { sku: 'SKU1', qtyToOrder: 10, buyPrice: 5.50 },
      { sku: 'SKU2', qtyToOrder: 5, buyPrice: 12.00 }
    ];
    const mockOrderQuantities = { SKU1: 15, SKU2: 5 };
    const mockOrders = [];

    it('devrait créer une commande avec succès', async () => {
      await handleCreateOrder(
        'Supplier1',
        mockProducts,
        'Warehouse1',
        mockOrderQuantities,
        mockOrders,
        mockApi,
        mockLoadData,
        mockGeneratePONumber
      );

      expect(mockGeneratePONumber).toHaveBeenCalledWith(mockOrders);
      expect(mockApi.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          poNumber: 'PO-001',
          supplier: 'Supplier1',
          warehouse: 'Warehouse1',
          status: 'pending',
          items: expect.arrayContaining([
            expect.objectContaining({ sku: 'SKU1', quantity: 15, pricePerUnit: 5.50 }),
            expect.objectContaining({ sku: 'SKU2', quantity: 5, pricePerUnit: 12.00 })
          ])
        })
      );
      expect(mockLoadData).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Commande créée pour Supplier1 !');
    });

    it('devrait utiliser qtyToOrder si orderQuantities n\'est pas défini', async () => {
      await handleCreateOrder(
        'Supplier1',
        mockProducts,
        'Warehouse1',
        {}, // Pas de quantités personnalisées
        mockOrders,
        mockApi,
        mockLoadData,
        mockGeneratePONumber
      );

      expect(mockApi.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ sku: 'SKU1', quantity: 10 }), // qtyToOrder
            expect.objectContaining({ sku: 'SKU2', quantity: 5 })   // qtyToOrder
          ])
        })
      );
    });

    it('devrait afficher une erreur si aucun entrepôt n\'est sélectionné', async () => {
      await handleCreateOrder(
        'Supplier1',
        mockProducts,
        null, // Pas d'entrepôt
        mockOrderQuantities,
        mockOrders,
        mockApi,
        mockLoadData,
        mockGeneratePONumber
      );

      expect(toast.error).toHaveBeenCalledWith('Veuillez sélectionner un entrepôt');
      expect(mockApi.createOrder).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la création', async () => {
      const error = new Error('Erreur API');
      mockApi.createOrder.mockRejectedValue(error);

      await expect(
        handleCreateOrder(
          'Supplier1',
          mockProducts,
          'Warehouse1',
          mockOrderQuantities,
          mockOrders,
          mockApi,
          mockLoadData,
          mockGeneratePONumber
        )
      ).rejects.toThrow('Erreur API');

      expect(toast.error).toHaveBeenCalledWith('Erreur lors de la création de la commande');
    });
  });

  describe('handleCreateOrderFromTable', () => {
    const mockEnrichedProducts = [
      { sku: 'SKU1', supplier: 'Supplier1', buyPrice: 5.50, qtyToOrder: 10, investment: 55 },
      { sku: 'SKU2', supplier: 'Supplier1', buyPrice: 12.00, qtyToOrder: 5, investment: 60 },
      { sku: 'SKU3', supplier: 'Supplier2', buyPrice: 8.00, qtyToOrder: 3, investment: 24 }
    ];
    const mockWarehouses = {
      'Warehouse1': { name: 'Warehouse1', address: 'Address1' }
    };

    it('devrait ouvrir le modal email si un seul fournisseur', async () => {
      const selectedProducts = new Map([
        ['SKU1', 15],
        ['SKU2', 5]
      ]);

      await handleCreateOrderFromTable(
        selectedProducts,
        mockEnrichedProducts,
        mockWarehouses,
        [],
        mockApi,
        mockLoadData,
        mockGeneratePONumber,
        mockRoundToTwoDecimals,
        mockSetEmailModalOpen,
        mockSetSelectedSupplier,
        mockSetSelectedWarehouse,
        mockSetOrderQuantities
      );

      expect(mockSetSelectedSupplier).toHaveBeenCalledWith('Supplier1');
      expect(mockSetSelectedWarehouse).toHaveBeenCalledWith('Warehouse1');
      expect(mockSetOrderQuantities).toHaveBeenCalledWith({
        SKU1: 15,
        SKU2: 5
      });
      expect(mockSetEmailModalOpen).toHaveBeenCalledWith(true);
      expect(mockApi.createOrder).not.toHaveBeenCalled(); // Pas de création directe
    });

    it('devrait créer plusieurs commandes si plusieurs fournisseurs', async () => {
      const selectedProducts = new Map([
        ['SKU1', 15], // Supplier1
        ['SKU2', 5],  // Supplier1
        ['SKU3', 3]   // Supplier2
      ]);

      await handleCreateOrderFromTable(
        selectedProducts,
        mockEnrichedProducts,
        mockWarehouses,
        [],
        mockApi,
        mockLoadData,
        mockGeneratePONumber,
        mockRoundToTwoDecimals,
        mockSetEmailModalOpen,
        mockSetSelectedSupplier,
        mockSetSelectedWarehouse,
        mockSetOrderQuantities
      );

      expect(toast.info).toHaveBeenCalledWith(
        'Plusieurs fournisseurs détectés. Créer des commandes séparées...',
        expect.any(Object)
      );
      
      // Devrait créer 2 commandes (une par fournisseur)
      expect(mockApi.createOrder).toHaveBeenCalledTimes(2);
      
      // Vérifier la première commande (Supplier1)
      expect(mockApi.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          supplier: 'Supplier1',
          items: expect.arrayContaining([
            expect.objectContaining({ sku: 'SKU1', quantity: 15 }),
            expect.objectContaining({ sku: 'SKU2', quantity: 5 })
          ])
        })
      );
      
      // Vérifier la deuxième commande (Supplier2)
      expect(mockApi.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          supplier: 'Supplier2',
          items: expect.arrayContaining([
            expect.objectContaining({ sku: 'SKU3', quantity: 3 })
          ])
        })
      );
      
      expect(mockLoadData).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        '2 commande(s) créée(s) !',
        expect.any(Object)
      );
    });

    it('devrait ignorer les produits sans fournisseur', async () => {
      const productsWithoutSupplier = [
        { sku: 'SKU1', supplier: null, buyPrice: 5.50 }
      ];
      const selectedProducts = new Map([['SKU1', 10]]);

      await handleCreateOrderFromTable(
        selectedProducts,
        productsWithoutSupplier,
        mockWarehouses,
        [],
        mockApi,
        mockLoadData,
        mockGeneratePONumber,
        mockRoundToTwoDecimals,
        mockSetEmailModalOpen,
        mockSetSelectedSupplier,
        mockSetSelectedWarehouse,
        mockSetOrderQuantities
      );

      // Ne devrait pas créer de commande ni ouvrir de modal
      expect(mockApi.createOrder).not.toHaveBeenCalled();
      expect(mockSetEmailModalOpen).not.toHaveBeenCalled();
    });

    it('devrait calculer le total correctement avec orderQuantity différente', async () => {
      // Pour tester le calcul du total, on doit avoir plusieurs fournisseurs
      // car avec un seul fournisseur, le code ouvre le modal au lieu de créer la commande
      const productsWithDifferentQty = [
        { sku: 'SKU1', supplier: 'Supplier1', buyPrice: 5.50, qtyToOrder: 10, investment: 55 },
        { sku: 'SKU4', supplier: 'Supplier2', buyPrice: 8.00, qtyToOrder: 3, investment: 24 }
      ];
      const selectedProducts = new Map([
        ['SKU1', 20], // Différent de qtyToOrder (10)
        ['SKU4', 3]
      ]);

      await handleCreateOrderFromTable(
        selectedProducts,
        productsWithDifferentQty,
        mockWarehouses,
        [],
        mockApi,
        mockLoadData,
        mockGeneratePONumber,
        mockRoundToTwoDecimals,
        mockSetEmailModalOpen,
        mockSetSelectedSupplier,
        mockSetSelectedWarehouse,
        mockSetOrderQuantities
      );

      // Vérifier que le total est calculé avec orderQuantity (20) et non qtyToOrder (10)
      expect(mockRoundToTwoDecimals).toHaveBeenCalled();
      const totalCall = mockRoundToTwoDecimals.mock.calls[0][0];
      expect(totalCall).toBe(20 * 5.50); // orderQuantity * buyPrice pour Supplier1
    });
  });

  describe('handleSendOrder', () => {
    const mockToOrderBySupplier = {
      'Supplier1': [
        { sku: 'SKU1', qtyToOrder: 10, buyPrice: 5.50 },
        { sku: 'SKU2', qtyToOrder: 5, buyPrice: 12.00 }
      ]
    };
    const mockSuppliers = {
      'Supplier1': { name: 'Supplier1', email: 'supplier1@test.com' }
    };
    const mockWarehouses = {
      'Warehouse1': { name: 'Warehouse1' }
    };
    const mockOrders = [];

    beforeEach(() => {
      mockInlineModals.emailOrderModal.orderQuantities = { SKU1: 15, SKU2: 5 };
    });

    it('devrait créer une commande et générer un email', async () => {
      await handleSendOrder(
        mockInlineModals,
        mockToOrderBySupplier,
        mockApi,
        mockLoadData,
        mockRoundToTwoDecimals,
        mockGeneratePONumber,
        mockEmailGeneration,
        mockGetUserSignature,
        mockSuppliers,
        mockWarehouses,
        mockOrders,
        mockSetActiveTab
      );

      expect(mockApi.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          supplier: 'Supplier1',
          warehouseId: 'Warehouse1',
          status: 'pending_confirmation',
          items: expect.arrayContaining([
            expect.objectContaining({ sku: 'SKU1', quantity: 15 }),
            expect.objectContaining({ sku: 'SKU2', quantity: 5 })
          ])
        })
      );

      expect(mockEmailGeneration.generateOrderEmailDraft).toHaveBeenCalledWith(
        'Supplier1',
        mockToOrderBySupplier['Supplier1'],
        'Warehouse1',
        { SKU1: 15, SKU2: 5 },
        'Signature',
        mockSuppliers,
        mockWarehouses
      );

      expect(mockInlineModals.emailOrderModal.closeEmailModal).toHaveBeenCalled();
      expect(mockLoadData).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        'Commande créée et email généré avec succès !',
        expect.any(Object)
      );
    });

    it('devrait utiliser qtyToOrder si orderQuantities n\'est pas défini', async () => {
      mockInlineModals.emailOrderModal.orderQuantities = {};

      await handleSendOrder(
        mockInlineModals,
        mockToOrderBySupplier,
        mockApi,
        mockLoadData,
        mockRoundToTwoDecimals,
        mockGeneratePONumber,
        mockEmailGeneration,
        mockGetUserSignature,
        mockSuppliers,
        mockWarehouses,
        mockOrders,
        mockSetActiveTab
      );

      expect(mockApi.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ sku: 'SKU1', quantity: 10 }), // qtyToOrder
            expect.objectContaining({ sku: 'SKU2', quantity: 5 })   // qtyToOrder
          ])
        })
      );
    });

    it('devrait afficher une erreur si aucun entrepôt n\'est sélectionné', async () => {
      mockInlineModals.emailOrderModal.selectedWarehouse = null;

      await handleSendOrder(
        mockInlineModals,
        mockToOrderBySupplier,
        mockApi,
        mockLoadData,
        mockRoundToTwoDecimals,
        mockGeneratePONumber,
        mockEmailGeneration,
        mockGetUserSignature,
        mockSuppliers,
        mockWarehouses,
        mockOrders,
        mockSetActiveTab
      );

      expect(toast.error).toHaveBeenCalledWith('Veuillez sélectionner un entrepôt');
      expect(mockApi.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('handleCreateOrderWithoutEmail', () => {
    const mockToOrderBySupplier = {
      'Supplier1': [
        { sku: 'SKU1', qtyToOrder: 10, buyPrice: 5.50 },
        { sku: 'SKU2', qtyToOrder: 5, buyPrice: 12.00 }
      ]
    };
    const mockOrders = [];

    beforeEach(() => {
      mockInlineModals.emailOrderModal.orderQuantities = { SKU1: 15, SKU2: 5 };
    });

    it('devrait créer une commande sans générer d\'email', async () => {
      await handleCreateOrderWithoutEmail(
        mockInlineModals,
        mockToOrderBySupplier,
        mockApi,
        mockLoadData,
        mockRoundToTwoDecimals,
        mockGeneratePONumber,
        mockOrders,
        mockSetActiveTab
      );

      expect(mockApi.createOrder).toHaveBeenCalled();
      expect(mockInlineModals.emailOrderModal.closeEmailModal).toHaveBeenCalled();
      expect(mockLoadData).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        'Commande créée avec succès !',
        expect.any(Object)
      );
    });

    it('devrait afficher une erreur si aucun entrepôt n\'est sélectionné', async () => {
      mockInlineModals.emailOrderModal.selectedWarehouse = null;

      await handleCreateOrderWithoutEmail(
        mockInlineModals,
        mockToOrderBySupplier,
        mockApi,
        mockLoadData,
        mockRoundToTwoDecimals,
        mockGeneratePONumber,
        mockOrders,
        mockSetActiveTab
      );

      expect(toast.error).toHaveBeenCalledWith('Veuillez sélectionner un entrepôt');
      expect(mockApi.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('handleOpenEmailModal', () => {
    const mockProducts = [
      { sku: 'SKU1', qtyToOrder: 10 },
      { sku: 'SKU2', qtyToOrder: 5 }
    ];
    const mockWarehouses = {
      'Warehouse1': { name: 'Warehouse1' },
      'Warehouse2': { name: 'Warehouse2' }
    };

    it('devrait ouvrir le modal et pré-remplir les quantités', () => {
      handleOpenEmailModal(
        mockInlineModals,
        'Supplier1',
        mockProducts,
        mockWarehouses
      );

      expect(mockInlineModals.emailOrderModal.openEmailModal).toHaveBeenCalledWith('Supplier1');
      expect(mockInlineModals.emailOrderModal.updateOrderQuantity).toHaveBeenCalledWith('SKU1', 10);
      expect(mockInlineModals.emailOrderModal.updateOrderQuantity).toHaveBeenCalledWith('SKU2', 5);
      expect(mockInlineModals.emailOrderModal.setSelectedWarehouse).toHaveBeenCalledWith('Warehouse1');
    });

    it('devrait sélectionner le premier entrepôt disponible', () => {
      handleOpenEmailModal(
        mockInlineModals,
        'Supplier1',
        mockProducts,
        mockWarehouses
      );

      expect(mockInlineModals.emailOrderModal.setSelectedWarehouse).toHaveBeenCalledWith('Warehouse1');
    });

    it('ne devrait pas planter si aucun entrepôt n\'est disponible', () => {
      handleOpenEmailModal(
        mockInlineModals,
        'Supplier1',
        mockProducts,
        {}
      );

      expect(mockInlineModals.emailOrderModal.openEmailModal).toHaveBeenCalled();
      expect(mockInlineModals.emailOrderModal.setSelectedWarehouse).not.toHaveBeenCalled();
    });
  });

  describe('handleShipOrder', () => {
    it('devrait ouvrir le modal d\'expédition', () => {
      handleShipOrder(mockShipOrderModal, 'PO-001');

      expect(mockShipOrderModal.openModal).toHaveBeenCalledWith('PO-001');
    });
  });

  describe('handleConfirmShipOrder', () => {
    it('devrait confirmer l\'expédition avec succès', async () => {
      await handleConfirmShipOrder(
        mockShipOrder,
        mockShipOrderModal,
        'TRACK123',
        'https://tracking.com/TRACK123',
        [],
        []
      );

      expect(mockShipOrder).toHaveBeenCalledWith(
        'PO-001',
        'TRACK123',
        'https://tracking.com/TRACK123',
        [],
        []
      );
      expect(mockShipOrderModal.closeModal).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de l\'expédition', async () => {
      const error = new Error('Erreur expédition');
      mockShipOrder.mockRejectedValue(error);

      await handleConfirmShipOrder(
        mockShipOrder,
        mockShipOrderModal,
        'TRACK123',
        '',
        [],
        []
      );

      expect(toast.error).toHaveBeenCalledWith('Erreur lors de l\'expédition');
      expect(mockShipOrderModal.closeModal).not.toHaveBeenCalled();
    });
  });
});

