import React, { useState, useCallback, useEffect } from 'react';
import { X, Copy, ExternalLink, AlertTriangle, Paperclip, Trash2 } from 'lucide-react';
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
    // reset input value to allow re-selecting the same file if needed
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

    // Si on n'a pas détecté explicitement le corps, on renvoie le contenu complet
    if (!body && content) {
      body = content;
    }

    return { to, subject, body };
  };

  // Initialiser les champs éditables à partir du contenu généré + données de la commande
  useEffect(() => {
    if (!isOpen || !emailContent) return;

    const parsed = parseEmailContent(emailContent);
    const poNumber = order?.poNumber || order?.id || '';

    // Adresse email du fournisseur en priorité si disponible
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
    >
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
            <div className="flex items-center justify-between mb-4">
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

          <div className="space-y-3">
            {/* Adresse email du destinataire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email du destinataire
              </label>
              <input
                type="email"
                value={editableTo}
                onChange={(e) => setEditableTo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Adresse email du fournisseur"
              />
            </div>

            {/* Objet de l'email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objet
              </label>
              <input
                type="text"
                value={editableSubject}
                onChange={(e) => setEditableSubject(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={`Réclamation - Commande ${order?.poNumber || order?.id}`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Le format sera toujours envoyé comme : <span className="font-medium">Réclamation - Commande {order?.poNumber || order?.id}</span>
              </p>
            </div>

            {/* Corps du message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                rows={10}
                className="w-full bg-gray-50 rounded-lg p-4 border whitespace-pre-wrap text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
      </div>

      {/* Pièces jointes */}
      <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-gray-700" />
            Pièces jointes (preuves)
          </h3>

          <p className="text-xs text-gray-600 mb-3">
            Formats acceptés : <span className="font-medium">.jpg, .jpeg, .png, .heic, .pdf</span>.{' '}
            Taille max : <span className="font-medium">{MAX_FILE_SIZE_MB} Mo</span> par fichier,{' '}
            <span className="font-medium">{MAX_TOTAL_SIZE_MB} Mo</span> au total.{' '}
            Maximum <span className="font-medium">{MAX_FILES}</span> fichiers.
          </p>

          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
            }`}
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
              className="flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Paperclip className="w-5 h-5 text-gray-700 mb-1" />
              <span className="text-sm font-medium text-gray-800">
                Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
              </span>
              <span className="text-xs text-gray-500">
                Idéalement : photos du colis, produits endommagés, BL/facture.
              </span>
            </label>
          </div>

          {/* Liste des fichiers sélectionnés */}
          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>{attachments.length} fichier(s) sélectionné(s)</span>
                <span>
                  Total :{' '}
                  <span className={totalSizeMB > MAX_TOTAL_SIZE_MB ? 'text-red-600 font-semibold' : 'font-medium'}>
                    {totalSizeMB.toFixed(2)} Mo
                  </span>
                </span>
              </div>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {attachments.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium text-gray-800" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-gray-500 text-[11px]">
                          {getFileSizeInMB(file.size).toFixed(2)} Mo
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="ml-3 p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>

              <p className="text-[11px] text-gray-500 mt-2">
                Pour l’instant, les pièces jointes doivent être ajoutées manuellement dans votre client email.
                Elles seront bientôt envoyées directement depuis StockEasy via Gmail / Outlook.
              </p>
            </div>
          )}
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
    </Modal>
  );
};