import React from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

/**
 * Modal pour créer ou modifier un fournisseur
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal ouvert ou fermé
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Object} props.formData - Données du formulaire
 * @param {Function} props.onChange - Callback de changement de champ
 * @param {Function} props.onSave - Callback de sauvegarde
 * @param {boolean} props.isEditing - Mode édition ou création
 * @returns {JSX.Element}
 */
export function SupplierModal({ 
  isOpen, 
  onClose, 
  formData, 
  onChange, 
  onSave, 
  isEditing 
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '✏️ Modifier le fournisseur' : '➕ Nouveau fournisseur'}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={onSave}>
            💾 Enregistrer
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#666663] mb-2">
            Nom du fournisseur *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            disabled={isEditing}
            placeholder="Ex: Fournisseur France"
            className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6] disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          {isEditing && (
            <p className="text-xs text-[#666663] mt-1">
              ℹ️ Le nom ne peut pas être modifié
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#666663] mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="contact@example.com"
            className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#666663] mb-2">
              Délai (jours) *
            </label>
            <input
              type="number"
              value={formData.leadTimeDays}
              onChange={(e) => onChange('leadTimeDays', parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#666663] mb-2">
              MOQ Standard *
            </label>
            <input
              type="number"
              value={formData.moq}
              onChange={(e) => onChange('moq', parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#666663] mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            rows={3}
            placeholder="Notes diverses..."
            className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6] resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

