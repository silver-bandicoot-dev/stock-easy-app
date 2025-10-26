import { useState } from 'react';

/**
 * Hook pour gérer la modale d'expédition des commandes
 */
export const useShipOrderModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  const openModal = (currentOrderId) => {
    setOrderId(currentOrderId);
    setTrackingNumber('');
    setTrackingUrl('');
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setOrderId(null);
    setTrackingNumber('');
    setTrackingUrl('');
  };

  const resetForm = () => {
    setTrackingNumber('');
    setTrackingUrl('');
  };

  return {
    isOpen,
    orderId,
    trackingNumber,
    trackingUrl,
    openModal,
    closeModal,
    resetForm,
    setTrackingNumber,
    setTrackingUrl
  };
};
