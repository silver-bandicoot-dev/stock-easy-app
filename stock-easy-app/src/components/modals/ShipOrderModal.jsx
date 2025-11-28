import React from 'react';
import { Truck, Link2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal, ModalFooter, ModalSection } from '../ui/Modal';

export const ShipOrderModal = ({
  isOpen,
  onClose,
  onConfirm,
  trackingNumber,
  setTrackingNumber,
  trackingUrl,
  setTrackingUrl,
  isLoading = false
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(trackingNumber, trackingUrl);
  };

  const handleClose = () => {
    setTrackingNumber('');
    setTrackingUrl('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Expédier la commande"
      icon={Truck}
      size="md"
      variant="centered"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description */}
        <div className="text-center py-2">
          <div className="mx-auto w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Truck className="w-7 h-7 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-1">
            Confirmer l'expédition
          </h3>
          <p className="text-sm text-neutral-500">
            Saisissez les informations de suivi pour cette commande
          </p>
        </div>

        {/* Numéro de suivi */}
        <ModalSection>
          <label className="label-base">
            Numéro de suivi
          </label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Ex: 1Z999AA1234567890"
            className="input-base"
          />
          <p className="helper-text">
            Numéro de suivi fourni par le transporteur
          </p>
        </ModalSection>

        {/* URL de tracking */}
        <ModalSection>
          <label className="label-base flex items-center gap-1.5">
            <Link2 className="w-4 h-4" />
            URL de suivi
          </label>
          <input
            type="url"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder="https://www.ups.com/track?trackingNumber=..."
            className="input-base"
          />
          <p className="helper-text">
            Lien direct vers le suivi de la commande
          </p>
        </ModalSection>

        {/* Boutons */}
        <div className="pt-4 border-t border-neutral-200">
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Truck}
              loading={isLoading}
            >
              Expédier
            </Button>
          </ModalFooter>
        </div>
      </form>
    </Modal>
  );
};
