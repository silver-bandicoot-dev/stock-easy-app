import React from 'react';
import { motion } from 'framer-motion';
import { Package, Plus } from 'lucide-react';
import { Button } from '../shared/Button';
import { ProductSelectionTable } from '../features/ProductSelectionTable';

export const OrderCreationModal = ({
  isOpen,
  onClose,
  products,
  suppliers,
  warehouses,
  selectedWarehouse,
  setSelectedWarehouse,
  orderQuantities,
  updateOrderQuantity,
  generatePONumber,
  orders,
  handleCreateOrder,
  selectedProductsFromTable,
  setSelectedProductsFromTable
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-[#E5E4DF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200 shrink-0">
                <Package className="w-6 h-6 text-blue-600 shrink-0" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#191919]">Créer une commande</h2>
                <p className="text-sm text-[#666663]">Sélectionnez les produits à commander</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[#666663] hover:text-[#191919]"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Sélection de l'entrepôt */}
          <div className="mb-6">
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
            selectedProducts={selectedProductsFromTable}
            setSelectedProducts={setSelectedProductsFromTable}
            orderQuantities={orderQuantities}
            updateOrderQuantity={updateOrderQuantity}
          />
        </div>

        <div className="p-6 border-t border-[#E5E4DF] bg-[#FAFAF7]">
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
        </div>
      </motion.div>
    </div>
  );
};
