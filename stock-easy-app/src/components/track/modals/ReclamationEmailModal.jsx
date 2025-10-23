import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../shared/Button';
import { toast } from 'sonner';

export const ReclamationEmailModal = ({
  isOpen,
  onClose,
  order,
  emailContent,
  onCopy
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await onCopy(emailContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  const handleOpenEmailClient = () => {
    const subject = encodeURIComponent(`Réclamation - Commande ${order?.poNumber || order?.id}`);
    const body = encodeURIComponent(emailContent);
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
  };

  if (!isOpen || !emailContent) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Email de réclamation</h2>
              <p className="text-sm text-gray-600">Commande {order?.poNumber || order?.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Avertissement */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-orange-800">
              <strong>Attention :</strong> Cet email contient des informations sur des écarts constatés lors de la réception. 
              Vérifiez le contenu avant l'envoi.
            </p>
          </div>
        </div>

        {/* Contenu de l'email */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Contenu de l'email</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Copy}
                onClick={handleCopy}
                disabled={isCopied}
              >
                {isCopied ? 'Copié !' : 'Copier'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={ExternalLink}
                onClick={handleOpenEmailClient}
              >
                Ouvrir dans l'email
              </Button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {emailContent}
            </pre>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Instructions :</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Cliquez sur "Copier" pour copier l'email dans le presse-papiers</li>
            <li>• Cliquez sur "Ouvrir dans l'email" pour ouvrir votre client email</li>
            <li>• Vérifiez les informations avant d'envoyer</li>
            <li>• Gardez une copie de cet email pour vos archives</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};