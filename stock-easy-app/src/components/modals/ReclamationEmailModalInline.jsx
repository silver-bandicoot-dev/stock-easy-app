import React from 'react';
import { Mail, AlertTriangle, Paperclip } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { EmailSendOptions } from '../ui/EmailSendOptions';
import { useTranslation } from 'react-i18next';

export const ReclamationEmailModalInline = ({
  isOpen,
  onClose,
  currentReclamationOrder,
  emailGeneration,
  getUserSignature
}) => {
  const { t } = useTranslation();
  
  if (!isOpen || !currentReclamationOrder) return null;

  const email = emailGeneration.generateReclamationEmail(
    currentReclamationOrder,
    getUserSignature()
  );

  // Vérifier s'il y a des photos attachées
  const hasPhotos = currentReclamationOrder.items?.some(item => 
    item.photos?.length > 0 || item.damagePhotos?.length > 0
  );

  return (
    <Modal
      isOpen={isOpen && currentReclamationOrder}
      onClose={onClose}
      title="Email de Réclamation"
      icon={Mail}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Réclamation pour la commande: {currentReclamationOrder.id}</h4>
              <p className="text-sm text-red-700">
                Fournisseur: {currentReclamationOrder.supplier}<br />
                Email généré automatiquement pour signaler les problèmes de réception.
              </p>
            </div>
          </div>
        </div>

        {/* Détails de la réclamation */}
        <div className="space-y-3">
          <h4 className="font-semibold text-[#191919]">Détails de la réclamation:</h4>
          {currentReclamationOrder.items.map((item, idx) => {
            const hasDiscrepancy = item.discrepancy && item.discrepancy.length > 0;
            const hasDamage = item.damaged && item.damaged > 0;
            
            if (!hasDiscrepancy && !hasDamage) return null;
            
            return (
              <div key={idx} className="border border-red-200 rounded-lg p-3 bg-red-50">
                <div className="font-medium text-red-900 mb-2">{item.name} ({item.sku})</div>
                <div className="text-sm text-red-700 space-y-1">
                  {hasDiscrepancy && (
                    <div>❌ Problèmes: {item.discrepancy.join(', ')}</div>
                  )}
                  {hasDamage && (
                    <div>🔴 Quantité endommagée: {item.damaged}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Aperçu de l'email */}
        <div className="space-y-3">
          <h4 className="font-semibold text-[#191919]">Aperçu de l'email:</h4>
          <div className="bg-white border border-[#E5E4DF] rounded-lg p-4 max-h-60 overflow-y-auto">
            <div className="space-y-2 text-sm">
              <div><strong>À:</strong> {email.to}</div>
              <div><strong>Objet:</strong> {email.subject}</div>
              <div className="mt-3">
                <strong>Corps:</strong>
                <pre className="whitespace-pre-wrap text-xs mt-2 p-2 bg-[#FAFAF7] rounded border">{email.body}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Avertissement pièces jointes */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Paperclip className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t('reclamation.attachmentWarning.title', 'Pièces jointes à ajouter manuellement')}
              </h4>
              <p className="text-sm text-amber-700">
                {t('reclamation.attachmentWarning.description', 'Les photos et documents ne peuvent pas être envoyés automatiquement. Une fois l\'email ouvert dans Gmail ou Outlook, vous devrez ajouter les pièces jointes manuellement.')}
              </p>
              {hasPhotos && (
                <p className="text-sm text-amber-800 font-medium mt-2">
                  📷 {t('reclamation.attachmentWarning.photosDetected', 'Des photos ont été prises - pensez à les joindre !')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Options d'envoi Gmail / Outlook */}
        <div className="pt-4 border-t border-neutral-200">
          <EmailSendOptions
            to={email.to}
            subject={email.subject}
            body={email.body}
          />
        </div>
      </div>
    </Modal>
  );
};
