import React from 'react';
import { Modal, ModalFooter, ModalSection } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { UserPlus, Pencil, Save, Briefcase, AlertCircle, MessageSquare } from 'lucide-react';

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
      title={isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
      icon={isEditing ? Pencil : UserPlus}
      size="lg"
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={onSave} icon={Save}>
            Sauvegarder
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Informations principales */}
        <ModalSection title="Informations générales">
          <div className="space-y-4">
            <div>
              <label className="label-base">
                Nom du fournisseur <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onChange('name', e.target.value)}
                disabled={isEditing}
                placeholder="Ex: Fournisseur France"
                className="input-base"
              />
              {isEditing && (
                <p className="helper-text flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Le nom ne peut pas être modifié
                </p>
              )}
            </div>

            <div>
              <label className="label-base">
                Email <span className="text-danger-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onChange('email', e.target.value)}
                placeholder="contact@example.com"
                className="input-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">
                  Délai (jours) <span className="text-danger-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.leadTimeDays}
                  onChange={(e) => onChange('leadTimeDays', parseInt(e.target.value) || 0)}
                  min="1"
                  className="input-base"
                />
              </div>
              
              <div>
                <label className="label-base">
                  MOQ Standard <span className="text-danger-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.moq}
                  onChange={(e) => onChange('moq', parseInt(e.target.value) || 0)}
                  min="1"
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <label className="label-base">
                Notes (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => onChange('notes', e.target.value)}
                rows={2}
                placeholder="Notes diverses..."
                className="textarea-base"
              />
            </div>
          </div>
        </ModalSection>

        {/* Contact Commercial */}
        <ModalSection 
          title="Contact Commercial" 
          description="Pour les commandes et devis"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-neutral-700">Commandes & Devis</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-base">
                Nom du contact
              </label>
              <input
                type="text"
                value={formData.commercialContactName}
                onChange={(e) => onChange('commercialContactName', e.target.value)}
                placeholder="Nom et prénom"
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">
                Email
              </label>
              <input
                type="email"
                value={formData.commercialContactEmail}
                onChange={(e) => onChange('commercialContactEmail', e.target.value)}
                placeholder="commercial@fournisseur.com"
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.commercialContactPhone}
                onChange={(e) => onChange('commercialContactPhone', e.target.value)}
                placeholder="+33 6 00 00 00 00"
                className="input-base"
              />
            </div>
          </div>
        </ModalSection>

        {/* Contact Réclamations */}
        <ModalSection 
          title="Contact Réclamations"
          description="Pour la qualité, logistique et SAV"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-warning-600" />
            </div>
            <span className="text-sm font-medium text-neutral-700">Qualité / Logistique / SAV</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-base">
                Nom du contact
              </label>
              <input
                type="text"
                value={formData.reclamationContactName}
                onChange={(e) => onChange('reclamationContactName', e.target.value)}
                placeholder="Nom et prénom"
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">
                Email
              </label>
              <input
                type="email"
                value={formData.reclamationContactEmail}
                onChange={(e) => onChange('reclamationContactEmail', e.target.value)}
                placeholder="qualite@fournisseur.com"
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.reclamationContactPhone}
                onChange={(e) => onChange('reclamationContactPhone', e.target.value)}
                placeholder="+33 6 00 00 00 00"
                className="input-base"
              />
            </div>
          </div>
          
          <div className="mt-4 max-w-xs">
            <label className="label-base">
              Rôle
            </label>
            <select
              value={formData.reclamationContactRole || ''}
              onChange={(e) => onChange('reclamationContactRole', e.target.value)}
              className="select-base"
            >
              <option value="">Sélectionner un rôle</option>
              <option value="Qualité">Qualité</option>
              <option value="Logistique">Logistique</option>
              <option value="Service Client">Service Client</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
        </ModalSection>

        {/* Notes de contact / historique */}
        <ModalSection 
          title="Notes de Contact"
          description="Historique des échanges et observations"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-neutral-600" />
            </div>
            <span className="text-sm font-medium text-neutral-700">Historique des échanges</span>
          </div>
          
          <p className="text-xs text-neutral-500 mb-2">
            Exemples : "répond en 24h", "très réactif sur qualité", "préférer les emails le matin"...
          </p>
          <textarea
            value={formData.contactNotes}
            onChange={(e) => onChange('contactNotes', e.target.value)}
            rows={3}
            placeholder="Ajoutez ici vos observations sur les échanges avec ce fournisseur..."
            className="textarea-base"
          />
        </ModalSection>
      </div>
    </Modal>
  );
}
