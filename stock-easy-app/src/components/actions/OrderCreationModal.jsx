import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus } from 'lucide-react';
import { Button } from '../shared/Button';
import { Modal } from '../ui/Modal';
import { ProductSelectionTable } from '../features/ProductSelectionTable';

export const OrderCreationModal = ({
  isOpen,
  onClose,
  products,
  suppliers,
  warehouses,
  orderQuantities,
  updateOrderQuantity,
  generatePONumber,
  orders,
  handleCreateOrder,
  selectedProductsFromTable,
  setSelectedProductsFromTable
}) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer une commande personnalisée"
      size="xlarge"
      footer={
        <div className="flex flex-wrap gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              const selectedProducts = Array.from(selectedProductsFromTable.values());
              if (selectedProducts.length > 0) {
                handleCreateOrder('Commande personnalisée', selectedProducts);
                onClose();
              }
            }}
            disabled={!selectedWarehouse || selectedProductsFromTable.size === 0}
            className="flex-1 sm:flex-none"
          >
            Créer la commande ({selectedProductsFromTable.size} produits)
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Sélection de l'entrepôt */}
        <div>
          <label className="block text-sm font-medium text-[#191919] mb-2">
            Entrepôt de destination
          </label>
          <select
            value={selectedWarehouse || ''}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="w-full p-3 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Sélectionner un entrepôt</option>
            {Object.values(warehouses).map(warehouse => (
              <option key={warehouse.name} value={warehouse.name}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table de sélection des produits */}
        <ProductSelectionTable
          products={products}
          suppliers={suppliers}
          // Ne pas passer onCreateOrder pour désactiver le bouton violet interne
        />
      </div>
    </Modal>
  );
};
