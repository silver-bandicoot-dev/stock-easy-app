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
            💾 Sauvegarder
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
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

        {/* Contact Commercial */}
        <div className="border-t border-[#E5E4DF] pt-4">
          <h4 className="text-sm font-semibold text-[#191919] mb-3">
            Contact Commercial (commandes & devis)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#666663] mb-2">
                Nom du contact
              </label>
              <input
                type="text"
                value={formData.commercialContactName}
                onChange={(e) => onChange('commercialContactName', e.target.value)}
                placeholder="Nom et prénom"
                className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#666663] mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.commercialContactEmail}
                onChange={(e) => onChange('commercialContactEmail', e.target.value)}
                placeholder="commercial@fournisseur.com"
                className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#666663] mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.commercialContactPhone}
                onChange={(e) => onChange('commercialContactPhone', e.target.value)}
                placeholder="+33 6 00 00 00 00"
                className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>
        </div>

        {/* Contact Réclamations */}
        <div className="border-t border-[#E5E4DF] pt-4">
          <h4 className="text-sm font-semibold text-[#191919] mb-3">
            Contact Réclamations (qualité / logistique / SAV)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#666663] mb-2">
                Nom du contact
              </label>
              <input
                type="text"
                value={formData.reclamationContactName}
                onChange={(e) => onChange('reclamationContactName', e.target.value)}
                placeholder="Nom et prénom"
                className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#666663] mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.reclamationContactEmail}
                onChange={(e) => onChange('reclamationContactEmail', e.target.value)}
                placeholder="qualite@fournisseur.com"
                className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#666663] mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.reclamationContactPhone}
                onChange={(e) => onChange('reclamationContactPhone', e.target.value)}
                placeholder="+33 6 00 00 00 00"
                className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>
          <div className="mt-4 max-w-xs">
            <label className="block text-sm font-medium text-[#666663] mb-2">
              Rôle
            </label>
            <select
              value={formData.reclamationContactRole || ''}
              onChange={(e) => onChange('reclamationContactRole', e.target.value)}
              className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg bg-white focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="">Sélectionner un rôle</option>
              <option value="Qualité">Qualité</option>
              <option value="Logistique">Logistique</option>
              <option value="Service Client">Service Client</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
        </div>

        {/* Notes de contact / historique */}
        <div className="border-t border-[#E5E4DF] pt-4">
          <h4 className="text-sm font-semibold text-[#191919] mb-2">
            Notes de Contact / Historique
          </h4>
          <p className="text-xs text-[#666663] mb-2">
            Exemples : &quot;répond en 24h&quot;, &quot;très réactif sur qualité&quot;, &quot;préférer les emails le matin&quot;...
          </p>
          <textarea
            value={formData.contactNotes}
            onChange={(e) => onChange('contactNotes', e.target.value)}
            rows={4}
            placeholder="Ajoutez ici vos observations sur les échanges avec ce fournisseur..."
            className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6] resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

