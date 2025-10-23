import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Package } from 'lucide-react';
import { Button } from '../shared/Button';
import { OrderBySupplier } from './OrderBySupplier';
import { OrderCreationModal } from './OrderCreationModal';

export const ActionsTab = ({
  productsByStatus,
  toOrderBySupplier,
  suppliers,
  warehouses,
  selectedWarehouse,
  setSelectedWarehouse,
  orderQuantities,
  updateOrderQuantity,
  generatePONumber,
  orders,
  handleCreateOrder,
  handleOpenEmailModal,
  orderCreationModalOpen,
  setOrderCreationModalOpen,
  selectedProductsFromTable,
  setSelectedProductsFromTable
}) => {
  return (
    <>
      <motion.div
        key="actions"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        {/* En-tête avec bouton de création personnalisée */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200 shrink-0">
                <Package className="w-6 h-6 text-blue-600 shrink-0" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#191919]">Gestion des commandes</h2>
                <p className="text-sm text-[#666663]">
                  {productsByStatus.to_order.length} produit(s) à commander
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setOrderCreationModalOpen(true)}
              className="flex-1 sm:flex-none"
            >
              Créer une commande personnalisée
            </Button>
          </div>
        </div>

        {/* Composant principal pour les commandes par fournisseur */}
        <OrderBySupplier
          toOrderBySupplier={toOrderBySupplier}
          suppliers={suppliers}
          warehouses={warehouses}
          selectedWarehouse={selectedWarehouse}
          setSelectedWarehouse={setSelectedWarehouse}
          orderQuantities={orderQuantities}
          updateOrderQuantity={updateOrderQuantity}
          generatePONumber={generatePONumber}
          orders={orders}
          handleCreateOrder={handleCreateOrder}
          handleOpenEmailModal={handleOpenEmailModal}
        />
      </motion.div>

      {/* Modal de création de commande personnalisée */}
      <OrderCreationModal
        isOpen={orderCreationModalOpen}
        onClose={() => setOrderCreationModalOpen(false)}
        products={productsByStatus.to_order}
        suppliers={suppliers}
        warehouses={warehouses}
        selectedWarehouse={selectedWarehouse}
        setSelectedWarehouse={setSelectedWarehouse}
        orderQuantities={orderQuantities}
        updateOrderQuantity={updateOrderQuantity}
        generatePONumber={generatePONumber}
        orders={orders}
        handleCreateOrder={handleCreateOrder}
        selectedProductsFromTable={selectedProductsFromTable}
        setSelectedProductsFromTable={setSelectedProductsFromTable}
      />
    </>
  );
};
