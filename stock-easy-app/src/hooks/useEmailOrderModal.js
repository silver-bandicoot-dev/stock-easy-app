import { useState } from 'react';

export const useEmailOrderModal = () => {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [orderQuantities, setOrderQuantities] = useState({});

  const openEmailModal = (supplier) => {
    setSelectedSupplier(supplier);
    setEmailModalOpen(true);
    // Initialiser les quantités avec les valeurs par défaut
    const productsToOrder = supplier ? supplier.products : [];
    const initialQuantities = {};
    productsToOrder.forEach(product => {
      initialQuantities[product.sku] = product.qtyToOrder;
    });
    setOrderQuantities(initialQuantities);
  };

  const closeEmailModal = () => {
    setEmailModalOpen(false);
    setSelectedSupplier(null);
    setSelectedWarehouse('');
    setOrderQuantities({});
  };

  const updateOrderQuantity = (sku, quantity) => {
    setOrderQuantities(prev => ({
      ...prev,
      [sku]: parseInt(quantity) || 0
    }));
  };

  return {
    emailModalOpen,
    selectedSupplier,
    selectedWarehouse,
    setSelectedWarehouse,
    orderQuantities,
    updateOrderQuantity,
    openEmailModal,
    closeEmailModal
  };
};
