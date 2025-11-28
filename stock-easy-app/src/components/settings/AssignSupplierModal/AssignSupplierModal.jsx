import React from 'react';
import { Modal, ModalFooter, ModalSection } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Link2, Save, AlertTriangle, Package } from 'lucide-react';

/**
 * Modal pour assigner un fournisseur à un produit
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal ouvert ou fermé
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Object} props.product - Produit à assigner
 * @param {Object} props.suppliers - Map des fournisseurs
 * @param {string} props.selectedSupplier - Fournisseur sélectionné
 * @param {Function} props.onSupplierChange - Callback de sélection
 * @param {Function} props.onAssign - Callback d'assignation
 * @returns {JSX.Element}
 */
export function AssignSupplierModal({ 
  isOpen, 
  onClose, 
  product, 
  suppliers,
  selectedSupplier,
  onSupplierChange,
  onAssign
}) {
  const suppliersList = Object.values(suppliers || {});
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assigner un fournisseur"
      icon={Link2}
      size="md"
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={onAssign}
            disabled={!selectedSupplier}
            icon={Save}
          >
            Assigner
          </Button>
        </ModalFooter>
      }
    >
      {product && (
        <div className="space-y-5">
          {/* Info produit */}
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-0.5">Produit sélectionné</div>
                <div className="font-semibold text-neutral-900">
                  {product.sku}
                </div>
                <div className="text-sm text-neutral-600">
                  {product.name}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sélection fournisseur */}
          <ModalSection>
            <label className="label-base">
              Sélectionner un fournisseur <span className="text-danger-500">*</span>
            </label>
            <select
              value={selectedSupplier || ''}
              onChange={(e) => onSupplierChange(e.target.value)}
              className="select-base"
            >
              <option value="">-- Choisir un fournisseur --</option>
              {suppliersList.map(s => (
                <option key={s.name} value={s.name}>
                  {s.name} (Délai: {s.leadTimeDays}j, MOQ: {s.moq})
                </option>
              ))}
            </select>
            
            {suppliersList.length === 0 && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-danger-600 flex-shrink-0" />
                <p className="text-sm text-danger-700">
                  Aucun fournisseur disponible. Créez d'abord un fournisseur dans l'onglet "Fournisseurs".
                </p>
              </div>
            )}
          </ModalSection>
        </div>
      )}
    </Modal>
  );
}
