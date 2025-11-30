import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('settings.suppliers.editSupplier') : t('settings.suppliers.newSupplier')}
      icon={isEditing ? Pencil : UserPlus}
      size="lg"
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            {t('settings.suppliers.modal.cancel')}
          </Button>
          <Button variant="primary" onClick={onSave} icon={Save}>
            {t('settings.suppliers.modal.save')}
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Informations principales */}
        <ModalSection title={t('settings.suppliers.modal.generalInfo')}>
          <div className="space-y-4">
            <div>
              <label className="label-base">
                {t('settings.suppliers.name')} <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onChange('name', e.target.value)}
                disabled={isEditing}
                placeholder={t('settings.suppliers.modal.namePlaceholder')}
                className="input-base"
              />
              {isEditing && (
                <p className="helper-text flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t('settings.suppliers.modal.nameCannotBeModified')}
                </p>
              )}
            </div>

            <div>
              <label className="label-base">
                {t('settings.suppliers.email')} <span className="text-danger-500">*</span>
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
                  {t('settings.suppliers.modal.leadTimeDays')} <span className="text-danger-500">*</span>
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
                  {t('settings.suppliers.modal.moqStandard')} <span className="text-danger-500">*</span>
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
                {t('settings.suppliers.modal.notesOptional')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => onChange('notes', e.target.value)}
                rows={2}
                placeholder={t('settings.suppliers.modal.notesPlaceholder')}
                className="textarea-base"
              />
            </div>
          </div>
        </ModalSection>

        {/* Contact Commercial */}
        <ModalSection 
          title={t('settings.suppliers.modal.commercialContact')} 
          description={t('settings.suppliers.modal.commercialContactDesc')}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-neutral-700">{t('settings.suppliers.modal.ordersQuotes')}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-base">
                {t('settings.suppliers.modal.contactName')}
              </label>
              <input
                type="text"
                value={formData.commercialContactName}
                onChange={(e) => onChange('commercialContactName', e.target.value)}
                placeholder={t('settings.suppliers.modal.contactNamePlaceholder')}
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">
                {t('settings.suppliers.email')}
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
                {t('settings.suppliers.modal.phone')}
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
          title={t('settings.suppliers.modal.reclamationContact')}
          description={t('settings.suppliers.modal.reclamationContactDesc')}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-warning-600" />
            </div>
            <span className="text-sm font-medium text-neutral-700">{t('settings.suppliers.modal.qualityLogisticsSAV')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-base">
                {t('settings.suppliers.modal.contactName')}
              </label>
              <input
                type="text"
                value={formData.reclamationContactName}
                onChange={(e) => onChange('reclamationContactName', e.target.value)}
                placeholder={t('settings.suppliers.modal.contactNamePlaceholder')}
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">
                {t('settings.suppliers.email')}
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
                {t('settings.suppliers.modal.phone')}
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
              {t('settings.suppliers.modal.role')}
            </label>
            <select
              value={formData.reclamationContactRole || ''}
              onChange={(e) => onChange('reclamationContactRole', e.target.value)}
              className="select-base"
            >
              <option value="">{t('settings.suppliers.modal.selectRole')}</option>
              <option value="Qualité">{t('settings.suppliers.modal.roleQuality')}</option>
              <option value="Logistique">{t('settings.suppliers.modal.roleLogistics')}</option>
              <option value="Service Client">{t('settings.suppliers.modal.roleCustomerService')}</option>
              <option value="Autre">{t('settings.suppliers.modal.roleOther')}</option>
            </select>
          </div>
        </ModalSection>

        {/* Notes de contact / historique */}
        <ModalSection 
          title={t('settings.suppliers.modal.contactNotes')}
          description={t('settings.suppliers.modal.contactNotesDesc')}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-neutral-600" />
            </div>
            <span className="text-sm font-medium text-neutral-700">{t('settings.suppliers.modal.exchangeHistory')}</span>
          </div>
          
          <p className="text-xs text-neutral-500 mb-2">
            {t('settings.suppliers.modal.contactNotesHint')}
          </p>
          <textarea
            value={formData.contactNotes}
            onChange={(e) => onChange('contactNotes', e.target.value)}
            rows={3}
            placeholder={t('settings.suppliers.modal.contactNotesPlaceholder')}
            className="textarea-base"
          />
        </ModalSection>
      </div>
    </Modal>
  );
}
