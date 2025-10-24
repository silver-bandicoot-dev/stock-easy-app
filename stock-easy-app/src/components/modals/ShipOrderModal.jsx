import React from 'react';
import { X, Truck, Link } from 'lucide-react';
import { Button } from '../shared/Button';
import { Modal } from '../ui/Modal';

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
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Icône et description */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-[#191919] mb-2">
            Confirmer l'expédition
          </h3>
          <p className="text-sm text-[#666663]">
            Saisissez les informations de suivi pour cette commande
          </p>
        </div>

        {/* Numéro de suivi */}
        <div>
          <label className="block text-sm font-medium text-[#191919] mb-2">
            Numéro de suivi
          </label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Ex: 1Z999AA1234567890"
            className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-white text-[#191919] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-[#666663] mt-1">
            Numéro de suivi fourni par le transporteur
          </p>
        </div>

        {/* URL de tracking */}
        <div>
          <label className="block text-sm font-medium text-[#191919] mb-2">
            <Link className="w-4 h-4 inline mr-1" />
            URL de suivi
          </label>
          <input
            type="url"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder="https://www.ups.com/track?trackingNumber=..."
            className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-white text-[#191919] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-[#666663] mt-1">
            Lien direct vers le suivi de la commande
          </p>
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E4DF]">
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
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? 'Expédition...' : 'Expédier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
