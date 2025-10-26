import { useState } from 'react';

export const useEmailOrderModal = () => {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [orderQuantities, setOrderQuantities] = useState({});

  const openEmailModal = (supplier) => {
    setSelectedSupplier(supplier);
    setEmailModalOpen(true);
    // Les quantités seront initialisées par le composant parent
    setOrderQuantities({});
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
      [sku]: Math.ceil(parseFloat(quantity)) || 0
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
