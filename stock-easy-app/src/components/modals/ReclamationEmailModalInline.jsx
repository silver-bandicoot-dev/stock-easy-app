import React, { useState } from 'react';
import { Mail, Copy, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const ReclamationEmailModalInline = ({
  isOpen,
  onClose,
  currentReclamationOrder,
  emailGeneration,
  getUserSignature
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !currentReclamationOrder) return null;

  const email = emailGeneration.generateReclamationEmail(
    currentReclamationOrder,
    getUserSignature()
  );

  const handleCopyToClipboard = async () => {
    try {
      await emailGeneration.copyToClipboard(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen && currentReclamationOrder}
      onClose={onClose}
      title="Email de Réclamation"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button 
            variant="secondary" 
            icon={copied ? Check : Copy}
            onClick={handleCopyToClipboard}
          >
            {copied ? 'Copié !' : 'Copier dans le presse-papiers'}
          </Button>
          <Button 
            variant="primary" 
            icon={Mail}
            onClick={() => window.open(`mailto:${email.to}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`)}
          >
            Ouvrir dans le client email
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
      </div>
    </Modal>
  );
};
