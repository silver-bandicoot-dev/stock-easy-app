import React, { useState, useCallback, useEffect } from 'react';
import { Copy, ExternalLink, AlertTriangle, Paperclip, Trash2, Mail } from 'lucide-react';
import { Modal, ModalSection, ModalFooter } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { toast } from 'sonner';

export const ReclamationEmailModal = ({
  isOpen,
  onClose,
  order,
  emailContent,
  onCopy
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editableTo, setEditableTo] = useState('');
  const [editableSubject, setEditableSubject] = useState('');
  const [editableBody, setEditableBody] = useState('');

  const MAX_FILE_SIZE_MB = 5;
  const MAX_TOTAL_SIZE_MB = 15;
  const MAX_FILES = 5;
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'pdf'];

  const getFileExtension = (fileName) => {
    const parts = fileName.split('.');
    if (parts.length < 2) return '';
    return parts.pop().toLowerCase();
  };

  const getFileSizeInMB = (sizeInBytes) => sizeInBytes / (1024 * 1024);

  const validateFiles = (files) => {
    const currentCount = attachments.length;
    const currentTotalSize = attachments.reduce((sum, f) => sum + f.size, 0);

    const newFilesArray = Array.from(files || []);
    if (newFilesArray.length === 0) {
      return [];
    }

    const acceptedFiles = [];
    for (const file of newFilesArray) {
      const ext = getFileExtension(file.name);
      const sizeMB = getFileSizeInMB(file.size);

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(`Type de fichier non autorisé: ${file.name}. Formats acceptés: .jpg, .jpeg, .png, .heic, .pdf`);
        continue;
      }

      if (sizeMB > MAX_FILE_SIZE_MB) {
        toast.error(`"${file.name}" dépasse la taille maximale de ${MAX_FILE_SIZE_MB} Mo (${sizeMB.toFixed(1)} Mo). Merci de compresser l'image ou le PDF.`);
        continue;
      }

      if (currentCount + acceptedFiles.length + 1 > MAX_FILES) {
        toast.error(`Vous ne pouvez pas ajouter plus de ${MAX_FILES} pièces jointes.`);
        break;
      }

      const projectedTotalSizeMB = getFileSizeInMB(
        currentTotalSize + acceptedFiles.reduce((s, f) => s + f.size, 0) + file.size
      );
      if (projectedTotalSizeMB > MAX_TOTAL_SIZE_MB) {
        toast.error(`Le poids total des pièces jointes dépasserait ${MAX_TOTAL_SIZE_MB} Mo. Merci de retirer un fichier ou de le compresser.`);
        continue;
      }

      acceptedFiles.push(file);
    }

    return acceptedFiles;
  };

  const handleFilesAdded = useCallback((fileList) => {
    const validFiles = validateFiles(fileList);
    if (validFiles.length > 0) {
      setAttachments((prev) => [...prev, ...validFiles]);
    }
  }, [attachments]);

  const handleFileInputChange = (event) => {
    const files = event.target.files;
    handleFilesAdded(files);
    event.target.value = '';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    handleFilesAdded(files);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const totalSizeMB = getFileSizeInMB(attachments.reduce((sum, f) => sum + f.size, 0));

  const handleCopy = async () => {
    try {
      await onCopy(emailContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  const parseEmailContent = (content) => {
    if (!content) {
      return { to: '', subject: '', body: '' };
    }

    const lines = content.split('\n');
    let to = '';
    let subject = '';
    let body = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('À:') || line.startsWith('A:')) {
        to = line.replace('À:', '').replace('A:', '').trim();
      } else if (line.startsWith('Objet:')) {
        subject = line.replace('Objet:', '').trim();
      } else if (line.startsWith('Bonjour,')) {
        body = lines.slice(i).join('\n');
        break;
      }
    }

    if (!body && content) {
      body = content;
    }

    return { to, subject, body };
  };

  useEffect(() => {
    if (!isOpen || !emailContent) return;

    const parsed = parseEmailContent(emailContent);
    const poNumber = order?.poNumber || order?.id || '';

    const supplierEmail =
      order?.supplier?.email ||
      order?.supplierEmail ||
      order?.supplier_email ||
      '';

    setEditableTo(parsed.to || supplierEmail || '');
    setEditableSubject(`Réclamation - Commande ${poNumber}`);
    setEditableBody(parsed.body || emailContent);
  }, [isOpen, emailContent, order]);

  const handleOpenEmailClient = () => {
    const poNumber = order?.poNumber || order?.id || '';
    const enforcedSubject = `Réclamation - Commande ${poNumber}`;
    const safeSubject = encodeURIComponent(enforcedSubject);
    const safeBody = encodeURIComponent(editableBody || emailContent);
    const mailtoLink = `mailto:${editableTo || ''}?subject=${safeSubject}&body=${safeBody}`;
    window.open(mailtoLink);
  };

  if (!isOpen || !emailContent) return null;

  const poNumber = order?.poNumber || order?.id || '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`Email de réclamation — Commande ${poNumber}`}
      icon={Mail}
      footer={
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </ModalFooter>
      }
    >
      {/* Avertissement */}
      <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
          </div>
          <p className="text-sm text-warning-800">
            <strong>Attention :</strong> Cet email contient des informations sur des écarts constatés lors de la réception. 
            Vérifiez le contenu avant l'envoi.
          </p>
        </div>
      </div>

      {/* Contenu de l'email */}
      <ModalSection title="Contenu de l'email" className="mb-6">
        <div className="flex items-center justify-end gap-2 mb-4">
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

        <div className="space-y-4">
          {/* Adresse email du destinataire */}
          <div>
            <label className="label-base">
              Adresse email du destinataire
            </label>
            <input
              type="email"
              value={editableTo}
              onChange={(e) => setEditableTo(e.target.value)}
              className="input-base"
              placeholder="Adresse email du fournisseur"
            />
          </div>

          {/* Objet de l'email */}
          <div>
            <label className="label-base">
              Objet
            </label>
            <input
              type="text"
              value={editableSubject}
              onChange={(e) => setEditableSubject(e.target.value)}
              className="input-base"
              placeholder={`Réclamation - Commande ${order?.poNumber || order?.id}`}
            />
            <p className="helper-text">
              Le format sera toujours envoyé comme : <span className="font-medium">Réclamation - Commande {order?.poNumber || order?.id}</span>
            </p>
          </div>

          {/* Corps du message */}
          <div>
            <label className="label-base">
              Message
            </label>
            <textarea
              value={editableBody}
              onChange={(e) => setEditableBody(e.target.value)}
              rows={10}
              className="input-base font-mono text-sm resize-y min-h-[200px]"
            />
          </div>
        </div>
      </ModalSection>

      {/* Pièces jointes */}
      <ModalSection 
        title="Pièces jointes" 
        description="Ajoutez des preuves visuelles (photos, documents)"
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
            <Paperclip className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-xs text-neutral-500">
            <span className="font-medium">Formats :</span> .jpg, .jpeg, .png, .heic, .pdf | 
            <span className="font-medium"> Max :</span> {MAX_FILE_SIZE_MB} Mo/fichier, {MAX_TOTAL_SIZE_MB} Mo total, {MAX_FILES} fichiers
          </div>
        </div>

        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="reclamation-attachments-input"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.heic,.pdf"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <label
            htmlFor="reclamation-attachments-input"
            className="flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-neutral-600" />
            </div>
            <span className="text-sm font-medium text-neutral-700">
              Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
            </span>
            <span className="text-xs text-neutral-500">
              Photos du colis, produits endommagés, BL/facture
            </span>
          </label>
        </div>

        {/* Liste des fichiers sélectionnés */}
        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
              <span>{attachments.length} fichier(s) sélectionné(s)</span>
              <span>
                Total :{' '}
                <span className={totalSizeMB > MAX_TOTAL_SIZE_MB ? 'text-danger-600 font-semibold' : 'font-medium'}>
                  {totalSizeMB.toFixed(2)} Mo
                </span>
              </span>
            </div>
            <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {attachments.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-neutral-100 rounded flex items-center justify-center flex-shrink-0">
                      <Paperclip className="w-4 h-4 text-neutral-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm font-medium text-neutral-800" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {getFileSizeInMB(file.size).toFixed(2)} Mo
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="ml-3 p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-400 hover:text-danger-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>

            <p className="text-xs text-neutral-500 mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              Les pièces jointes doivent être ajoutées manuellement dans votre client email.
              L'envoi direct depuis Stockeasy sera bientôt disponible.
            </p>
          </div>
        )}
      </ModalSection>

      {/* Instructions */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h4 className="font-medium text-primary-900 mb-2">Instructions :</h4>
        <ul className="text-sm text-primary-700 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            Cliquez sur "Copier" pour copier l'email dans le presse-papiers
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            Cliquez sur "Ouvrir dans l'email" pour ouvrir votre client email
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            Vérifiez les informations avant d'envoyer
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            Gardez une copie de cet email pour vos archives
          </li>
        </ul>
      </div>
    </Modal>
  );
};
