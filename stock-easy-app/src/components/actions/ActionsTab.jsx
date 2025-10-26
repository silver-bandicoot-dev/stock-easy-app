import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, Sparkles } from 'lucide-react';
import { Button } from '../shared/Button';
import { OrderBySupplier } from './OrderBySupplier';
import { OrderCreationModal } from './OrderCreationModal';
import { ACTIONS_TABS } from '../../constants/stockEasyConstants';

export const ActionsTab = ({
  productsByStatus,
  toOrderBySupplier,
  suppliers,
  warehouses,
  orderQuantities,
  updateOrderQuantity,
  generatePONumber,
  orders,
  handleCreateOrder,
  handleOpenEmailModal,
  orderCreationModalOpen,
  setOrderCreationModalOpen,
  selectedProductsFromTable,
  setSelectedProductsFromTable,
  // Nouveaux props pour les modals
  emailModal,
  emailModalHandlers,
  emailGeneration
}) => {
  // État local pour la sous-navigation Actions
  const [actionsSubTab, setActionsSubTab] = useState(ACTIONS_TABS.RECOMMENDATIONS);

  const actionsSections = [
    {
      key: ACTIONS_TABS.RECOMMENDATIONS,
      title: 'Recommandations de commandes',
      icon: Sparkles,
      shortTitle: 'Recommandations'
    },
    {
      key: ACTIONS_TABS.CUSTOM_ORDER,
      title: 'Commande personnalisée',
      icon: Plus,
      shortTitle: 'Personnalisée'
    }
  ];

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
        {/* Header avec titre et sous-titre */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-[#191919]" />
            <h1 className="text-2xl font-bold text-[#191919]">Commandes</h1>
          </div>
          <p className="text-[#666663] ml-11">
            {productsByStatus.to_order.length} produit(s) à commander
          </p>
          
          {/* Onglets de navigation - Optimisés mobile */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
            {actionsSections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.key}
                  onClick={() => setActionsSubTab(section.key)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                    actionsSubTab === section.key
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{section.title}</span>
                  <span className="sm:hidden">{section.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu des sous-sections */}
        <AnimatePresence mode="wait">
          {actionsSubTab === ACTIONS_TABS.RECOMMENDATIONS && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Composant principal pour les commandes par fournisseur */}
              <OrderBySupplier
                toOrderBySupplier={toOrderBySupplier}
                suppliers={suppliers}
                warehouses={warehouses}
                orderQuantities={orderQuantities}
                updateOrderQuantity={updateOrderQuantity}
                generatePONumber={generatePONumber}
                orders={orders}
                handleCreateOrder={handleCreateOrder}
                handleOpenEmailModal={handleOpenEmailModal}
                emailModalHandlers={emailModalHandlers}
              />
            </motion.div>
          )}

          {actionsSubTab === ACTIONS_TABS.CUSTOM_ORDER && (
            <motion.div
              key="custom-order"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6"
            >
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FAFAF7] mb-4">
                  <Plus className="w-8 h-8 text-[#666663]" />
                </div>
                <h3 className="text-xl font-semibold text-[#191919] mb-2">
                  Créer une commande personnalisée
                </h3>
                <p className="text-[#666663] mb-6">
                  Commencez par sélectionner un fournisseur et des produits
                </p>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setOrderCreationModalOpen(true)}
                >
                  Ouvrir le créateur de commande
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal de création de commande personnalisée */}
      <OrderCreationModal
        isOpen={orderCreationModalOpen}
        onClose={() => setOrderCreationModalOpen(false)}
        products={productsByStatus.to_order}
        suppliers={suppliers}
        warehouses={warehouses}
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
