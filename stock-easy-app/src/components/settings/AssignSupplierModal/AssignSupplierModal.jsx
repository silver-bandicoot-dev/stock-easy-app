import React from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

/**
 * Modal pour assigner un fournisseur à un produit
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal ouvert ou fermé
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Object} props.product - Produit à assigner
 * @param {Object} props.suppliers - Map des fournisseurs
 * @param {string} props.selectedSupplier - Fournisseur sélectionné
 * @param {Function} props.onSelectSupplier - Callback de sélection
 * @param {Function} props.onAssign - Callback d'assignation
 * @returns {JSX.Element}
 */
export function AssignSupplierModal({ 
  isOpen, 
  onClose, 
  product, 
  suppliers,
  selectedSupplier,
  onSelectSupplier,
  onAssign
}) {
  const suppliersList = Object.values(suppliers);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔗 Assigner un fournisseur"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={onAssign}
            disabled={!selectedSupplier}
          >
            💾 Assigner
          </Button>
        </div>
      }
    >
      {product && (
        <div className="space-y-4">
          <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[#E5E4DF]">
            <div className="text-sm text-[#666663] mb-1">Produit</div>
            <div className="font-semibold text-[#191919]">
              {product.sku} - {product.name}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#666663] mb-2">
              Sélectionner un fournisseur *
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => onSelectSupplier(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6] bg-white"
            >
              <option value="">-- Choisir un fournisseur --</option>
              {suppliersList.map(s => (
                <option key={s.name} value={s.name}>
                  {s.name} (Délai: {s.leadTimeDays}j, MOQ: {s.moq})
                </option>
              ))}
            </select>
            
            {suppliersList.length === 0 && (
              <p className="text-sm text-[#EF1C43] mt-2">
                ⚠️ Aucun fournisseur disponible. Créez d'abord un fournisseur dans l'onglet "Fournisseurs".
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

