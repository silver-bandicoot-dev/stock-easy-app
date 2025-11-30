import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OrderBySupplier } from './OrderBySupplier';
import { ProductSelectionTable } from '../features/ProductSelectionTable/ProductSelectionTable';
import { CustomOrderModal } from './modals/CustomOrderModal';
import { ActionsKPIBar } from './ActionsKPIBar';
import { ACTIONS_TABS } from '../../constants/stockEasyConstants';
import { toast } from 'sonner';
import api from '../../services/apiAdapter';
import { useCurrency } from '../../contexts/CurrencyContext';

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
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();
  
  // Onglets style Shopify
  const ACTION_TABS = [
    { key: ACTIONS_TABS.RECOMMENDATIONS, label: t('actions.recommendations'), icon: Sparkles },
    { key: ACTIONS_TABS.CUSTOM_ORDER, label: t('actions.custom'), icon: Plus }
  ];
  
  // État local pour la sous-navigation Actions
  const [actionsSubTab, setActionsSubTab] = useState(ACTIONS_TABS.RECOMMENDATIONS);
  
  // État pour le modal de commande personnalisée
  const [customOrderModalOpen, setCustomOrderModalOpen] = useState(false);
  const [selectedProductsForModal, setSelectedProductsForModal] = useState([]);

  // Calculer les KPIs
  const kpis = useMemo(() => {
    const productsToOrder = productsByStatus?.to_order || [];
    const urgentProducts = productsToOrder.filter(p => p.healthStatus === 'urgent');
    
    // Calculer l'investissement total
    const totalInvestment = productsToOrder.reduce((sum, p) => {
      const qty = p.qtyToOrder || 0;
      const price = p.buyPrice || 0;
      return sum + (qty * price);
    }, 0);

    // Compter les fournisseurs uniques
    const uniqueSuppliers = new Set(
      productsToOrder
        .map(p => p.supplier)
        .filter(Boolean)
    );

    return {
      productsToOrder: productsToOrder.length,
      urgentCount: urgentProducts.length,
      totalInvestment,
      suppliersCount: uniqueSuppliers.size
    };
  }, [productsByStatus]);

  // Handler pour créer une commande personnalisée
  const handleCreateCustomOrder = (selectedProductsMap) => {
    if (selectedProductsMap.size === 0) {
      toast.error(t('actions.selectAtLeastOneProduct'));
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
      toast.error(t('actions.invalidQuantity'));
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

    const suppliersArray = Object.keys(productsBySupplier);
    
    if (suppliersArray.length === 0) {
      toast.error(t('actions.noSupplierFound'));
      return;
    }

    // Si plusieurs fournisseurs, informer l'utilisateur
    if (suppliersArray.length > 1) {
      toast.info(t('actions.multipleSuppliers', { count: suppliersArray.length }), {
        duration: 4000
      });
      return;
    }

    // Un seul fournisseur - ouvrir le modal de commande personnalisée
    const supplier = suppliersArray[0];
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
        toast.error(t('actions.invalidWarehouse'));
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
      toast.success(t('orders.messages.created'));
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      toast.error(t('actions.orderCreationError'));
    }
  };

  // Export CSV des produits à commander
  const handleExportCSV = async () => {
    const toastId = toast.loading(t('common.export') + '...');
    try {
      const productsToExport = productsByStatus?.to_order || [];
      
      const csvData = productsToExport.map(product => ({
        'SKU': product.sku,
        'Nom': product.name,
        'Fournisseur': product.supplier || 'Non assigné',
        'Stock Actuel': product.stock,
        'Quantité à Commander': product.qtyToOrder || 0,
        'Prix Unitaire': product.buyPrice || 0,
        'Total': ((product.qtyToOrder || 0) * (product.buyPrice || 0)).toFixed(2),
        'Autonomie (jours)': product.daysOfStock || 0,
        'Statut': product.healthStatus
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `produits_a_commander_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success(t('actions.exportSuccess'), { id: toastId });
    } catch (error) {
      toast.error(t('actions.exportError'), { id: toastId });
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
        className="h-full flex flex-col space-y-6"
      >
        {/* Header - Style Dashboard épuré */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#191919]">
              {t('navigation.placeOrder')}
            </h1>
            <p className="text-sm text-[#6B7177] mt-0.5">
              {t('actions.manageSupplierOrders')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E1E3E5] rounded-full text-sm font-medium text-[#191919] hover:border-[#8A8C8E] transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.export')}</span>
            </button>
          </div>
        </div>

        {/* KPIs */}
        <section>
          <ActionsKPIBar
            productsToOrder={kpis.productsToOrder}
            urgentCount={kpis.urgentCount}
            totalInvestment={kpis.totalInvestment}
            suppliersCount={kpis.suppliersCount}
            formatCurrency={formatCurrency}
          />
        </section>

        {/* Onglets - Style pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {ACTION_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActionsSubTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  actionsSubTab === tab.key
                    ? 'bg-[#191919] text-white shadow-sm'
                    : 'bg-white text-[#6B7177] border border-[#E1E3E5] hover:border-[#8A8C8E] hover:text-[#191919]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenu des sous-sections */}
        <div className="flex-1 min-h-0">
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
        </div>
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
