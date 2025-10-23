import { useState } from 'react';

export const useReconciliationModal = () => {
  const [reconciliationModalOpen, setReconciliationModalOpen] = useState(false);
  const [reconciliationOrder, setReconciliationOrder] = useState(null);
  const [discrepancyItems, setDiscrepancyItems] = useState({});
  const [damagedQuantities, setDamagedQuantities] = useState({});

  const openReconciliationModal = (order) => {
    setReconciliationOrder(order);
    setReconciliationModalOpen(true);
    // Initialiser les quantités avec les valeurs de la commande
    const initialDiscrepancyItems = {};
    const initialDamagedQuantities = {};
    
    if (order && order.items) {
      order.items.forEach(item => {
        initialDiscrepancyItems[item.sku] = {
          received: item.quantity,
          missing: 0
        };
        initialDamagedQuantities[item.sku] = 0;
      });
    }
    
    setDiscrepancyItems(initialDiscrepancyItems);
    setDamagedQuantities(initialDamagedQuantities);
  };

  const closeReconciliationModal = () => {
    setReconciliationModalOpen(false);
    setReconciliationOrder(null);
    setDiscrepancyItems({});
    setDamagedQuantities({});
  };

  const updateDiscrepancyItem = (sku, field, value) => {
    setDiscrepancyItems(prev => ({
      ...prev,
      [sku]: {
        ...prev[sku],
        [field]: value
      }
    }));
  };

  const updateDamagedQuantity = (sku, quantity) => {
    setDamagedQuantities(prev => ({
      ...prev,
      [sku]: parseInt(quantity) || 0
    }));
  };

  return {
    reconciliationModalOpen,
    reconciliationOrder,
    discrepancyItems,
    damagedQuantities,
    openReconciliationModal,
    closeReconciliationModal,
    updateDiscrepancyItem,
    updateDamagedQuantity,
    setDiscrepancyItems,
    setDamagedQuantities
  };
};
