import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, Sparkles } from 'lucide-react';
import { Button } from '../shared/Button';
import { OrderBySupplier } from './OrderBySupplier';
import { ProductSelectionTable } from '../features/ProductSelectionTable/ProductSelectionTable';
import { CustomOrderModal } from './modals/CustomOrderModal';
import { ACTIONS_TABS } from '../../constants/stockEasyConstants';
import { toast } from 'sonner';
import api from '../../services/apiAdapter';

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
  loadData,
  getUserSignature,
  // Nouveaux props pour les modals
  emailModal,
  emailModalHandlers,
  emailGeneration,
  allProducts = []
}) => {
  // État local pour la sous-navigation Actions
  const [actionsSubTab, setActionsSubTab] = useState(ACTIONS_TABS.RECOMMENDATIONS);
  
  // État pour le modal de commande personnalisée
  const [customOrderModalOpen, setCustomOrderModalOpen] = useState(false);
  const [selectedProductsForModal, setSelectedProductsForModal] = useState([]);

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

  // Handler pour créer une commande personnalisée
  const handleCreateCustomOrder = (selectedProductsMap) => {
    if (selectedProductsMap.size === 0) {
      toast.error('Veuillez sélectionner au moins un produit');
      return;
    }

    // Convertir les produits sélectionnés en array avec les bonnes quantités
    const products = Array.from(selectedProductsMap.entries())
      .map(([sku, quantity]) => {
        const product = allProducts.find(p => p.sku === sku);
        if (!product) return null;

        const qty = Math.max(0, Number(quantity) || 0);
        return {
          ...product,
          qtyToOrder: qty // Utiliser la quantité personnalisée au lieu de qtyToOrder
        };
      })
      .filter(Boolean);

    const hasInvalidQuantity = products.some(p => !p.qtyToOrder || p.qtyToOrder <= 0);
    if (hasInvalidQuantity) {
      toast.error('Veuillez définir une quantité positive pour chaque produit sélectionné');
      return;
    }

    // Grouper par fournisseur
    const productsBySupplier = {};
    products.forEach(p => {
      if (!p || !p.supplier) return;
      if (!productsBySupplier[p.supplier]) {
        productsBySupplier[p.supplier] = [];
      }
      productsBySupplier[p.supplier].push(p);
    });

    const suppliers = Object.keys(productsBySupplier);
    
    if (suppliers.length === 0) {
      toast.error('Aucun fournisseur trouvé pour les produits sélectionnés');
      return;
    }

    // Si plusieurs fournisseurs, informer l'utilisateur
    if (suppliers.length > 1) {
      toast.info(`${suppliers.length} fournisseurs détectés. Sélectionner des produits d'un seul fournisseur.`, {
        duration: 4000
      });
      return;
    }

    // Un seul fournisseur - ouvrir le modal de commande personnalisée
    const supplier = suppliers[0];
    const supplierProducts = productsBySupplier[supplier];
    
    setSelectedProductsForModal(supplierProducts);
    setCustomOrderModalOpen(true);
  };

  // Handler pour confirmer la création de la commande personnalisée
  const handleConfirmCustomOrder = async (mode, warehouse, quantities, emailData) => {
    try {
      const supplier = selectedProductsForModal[0]?.supplier;
      const warehouseEntry = typeof warehouse === 'string'
        ? warehouses[warehouse] || Object.values(warehouses || {}).find(w => w.id === warehouse)
        : warehouse;

      if (!warehouseEntry || !warehouseEntry.id) {
        toast.error('Entrepôt invalide, veuillez réessayer');
        return;
      }

      const total = selectedProductsForModal.reduce((sum, p) => {
        const qty = Number(quantities[p.sku] ?? p.qtyToOrder ?? 0);
        const unitPrice = Number(p.buyPrice ?? 0);
        return sum + (qty * unitPrice);
      }, 0);

      const orderData = {
        id: generatePONumber(orders),
        supplier: supplier,
        warehouseId: warehouseEntry.id,
        warehouseName: warehouseEntry.name,
        status: 'pending_confirmation',
        total: total.toFixed(2),
        createdAt: new Date().toISOString().split('T')[0],
        items: selectedProductsForModal.map(p => ({
          sku: p.sku,
          quantity: Number(quantities[p.sku] ?? p.qtyToOrder ?? 0),
          pricePerUnit: Number(p.buyPrice ?? 0)
        })),
        notes: mode === 'with_email' ? 'Commande créée avec email' : 'Commande créée sans email'
      };

      const { success, error } = await api.createOrder(orderData);

      if (!success) {
        throw new Error(error || 'Erreur inconnue Supabase');
      }
      
      if (mode === 'with_email' && emailData) {
        console.log('📧 Email à envoyer:', emailData);
      }

      await loadData();
      setCustomOrderModalOpen(false);
      toast.success('Commande créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  };

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
          <p className="text-xs sm:text-sm text-[#666663]">
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
            >
              {/* Table de sélection des produits avec bouton de création */}
              <ProductSelectionTable
                products={allProducts.length > 0 ? allProducts : productsByStatus.to_order}
                suppliers={suppliers}
                onCreateOrder={(selectedProductsMap) => {
                  handleCreateCustomOrder(selectedProductsMap);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal de commande personnalisée */}
      <CustomOrderModal
        isOpen={customOrderModalOpen}
        onClose={() => setCustomOrderModalOpen(false)}
        selectedProducts={selectedProductsForModal}
        warehouses={warehouses}
        emailGeneration={emailGeneration}
        getUserSignature={getUserSignature}
        suppliers={suppliers}
        onConfirm={handleConfirmCustomOrder}
      />
    </>
  );
};
