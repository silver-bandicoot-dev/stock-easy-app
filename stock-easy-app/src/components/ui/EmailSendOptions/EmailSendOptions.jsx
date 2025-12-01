import React, { useState, useCallback } from 'react';
import { Copy, Check, Mail, ExternalLink, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Limite de caractères pour les URLs
 * Les navigateurs ont une limite d'environ 2000-8000 chars
 * Gmail/Outlook peuvent avoir des problèmes au-delà de ~2000
 */
const MAX_BODY_LENGTH = 1500;

/**
 * Composant pour envoyer des emails via Gmail, Outlook ou client natif
 * Avec liens directs vers les versions web
 */
export const EmailSendOptions = ({
  to = '',
  subject = '',
  body = '',
  onCopied,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  const [recentlyClicked, setRecentlyClicked] = useState(null);

  // Vérifier si le contenu est présent
  const hasContent = Boolean(subject && body);
  const hasRecipient = Boolean(to);
  
  // Vérifier si le body est trop long pour les URLs
  const isBodyTooLong = body.length > MAX_BODY_LENGTH;

  // Copier l'email complet dans le presse-papiers
  const handleCopy = useCallback(async () => {
    const fullEmail = `À: ${to}\nObjet: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(fullEmail);
      setIsCopied(true);
      toast.success(t('email.options.copied', 'Email copié dans le presse-papiers'));
      onCopied?.();
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    } catch (err) {
      // Fallback pour les navigateurs plus anciens
      try {
        const textArea = document.createElement('textarea');
        textArea.value = fullEmail;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setIsCopied(true);
        toast.success(t('email.options.copied', 'Email copié dans le presse-papiers'));
        setTimeout(() => setIsCopied(false), 2000);
        return true;
      } catch (fallbackErr) {
        toast.error('Erreur lors de la copie');
        return false;
      }
    }
  }, [to, subject, body, onCopied, t]);

  // Ouvrir un client email
  const handleOpenClient = useCallback(async (type) => {
    setRecentlyClicked(type);
    
    // Toujours copier d'abord pour que l'utilisateur puisse coller si besoin
    const copied = await handleCopy();
    
    // Préparer les valeurs encodées
    const safeTo = (to || '').trim();
    const safeSubject = (subject || '').trim();
    // Pour le body, on le tronque si trop long pour l'URL
    const safeBody = isBodyTooLong ? '' : (body || '').trim();
    
    let url = '';
    
    if (type === 'gmail') {
      // Gmail compose URL
      // Paramètres: view=cm (compose mode), to, su (subject), body
      const params = new URLSearchParams();
      params.set('view', 'cm');
      params.set('fs', '1'); // fullscreen
      if (safeTo) params.set('to', safeTo);
      if (safeSubject) params.set('su', safeSubject);
      if (safeBody) params.set('body', safeBody);
      url = `https://mail.google.com/mail/?${params.toString()}`;
      
    } else if (type === 'outlook') {
      // Outlook Web compose URL
      const params = new URLSearchParams();
      if (safeTo) params.set('to', safeTo);
      if (safeSubject) params.set('subject', safeSubject);
      if (safeBody) params.set('body', safeBody);
      url = `https://outlook.live.com/mail/0/deeplink/compose?${params.toString()}`;
      
    } else {
      // Client email natif via mailto:
      const params = new URLSearchParams();
      if (safeSubject) params.set('subject', safeSubject);
      if (body) params.set('body', body); // Pas de troncature pour mailto
      url = `mailto:${safeTo}?${params.toString()}`;
    }
    
    // Ouvrir l'URL
    window.open(url, '_blank');
    
    // Message approprié
    if (isBodyTooLong && (type === 'gmail' || type === 'outlook')) {
      toast.info('📋 Message copié ! Collez-le dans le corps de l\'email avec Ctrl+V (ou Cmd+V)', { 
        duration: 6000,
        description: 'Le message était trop long pour l\'URL'
      });
    } else {
      const clientName = type === 'gmail' ? 'Gmail' : type === 'outlook' ? 'Outlook' : 'Email';
      toast.success(`${clientName} ouvert`, { duration: 2000 });
    }
    
    setTimeout(() => setRecentlyClicked(null), 2000);
  }, [to, subject, body, isBodyTooLong, handleCopy]);

  const emailClients = [
    {
      id: 'gmail',
      name: 'Gmail',
      logo: '/logos/gmail.webp',
      bgColor: 'hover:bg-red-50',
      borderColor: 'hover:border-red-200',
      activeColor: 'bg-red-50 border-red-300',
    },
    {
      id: 'outlook',
      name: 'Outlook',
      logo: '/logos/outlook.png',
      bgColor: 'hover:bg-blue-50',
      borderColor: 'hover:border-blue-200',
      activeColor: 'bg-blue-50 border-blue-300',
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Titre */}
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-neutral-500" />
        <span className="text-sm font-medium text-neutral-700">
          {t('email.options.title', 'Choisissez comment envoyer')}
        </span>
      </div>

      {/* Avertissement si pas de contenu */}
      {!hasContent && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-800">
            {t('email.options.noContent', 'Sélectionnez un entrepôt pour générer le contenu de l\'email')}
          </span>
        </div>
      )}

      {/* Avertissement si pas de destinataire */}
      {hasContent && !hasRecipient && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-800">
            {t('email.options.noRecipient', 'Aucune adresse email configurée pour ce fournisseur')}
          </span>
        </div>
      )}

      {/* Info si URL trop longue */}
      {isBodyTooLong && hasContent && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-800">
            {t('email.options.longMessage', 'Le message sera automatiquement copié. Collez-le dans l\'email après ouverture.')}
          </span>
        </div>
      )}

      {/* Aperçu rapide du contenu */}
      {hasContent && (
        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm">
          <div className="flex items-start gap-2 text-neutral-600 mb-1">
            <span className="font-medium shrink-0">À:</span>
            <span className={`${hasRecipient ? 'text-neutral-800' : 'text-amber-600 italic'}`}>
              {to || '(email non configuré)'}
            </span>
          </div>
          <div className="flex items-start gap-2 text-neutral-600">
            <span className="font-medium shrink-0">Objet:</span>
            <span className="text-neutral-800 truncate">{subject}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-200">
            <span className="font-medium text-neutral-600">Aperçu:</span>
            <p className="text-neutral-700 text-xs mt-1 line-clamp-2">
              {body.substring(0, 150)}...
            </p>
          </div>
        </div>
      )}

      {/* Options principales - Gmail & Outlook */}
      <div className="grid grid-cols-2 gap-3">
        {emailClients.map((client) => (
          <button
            key={client.id}
            onClick={() => handleOpenClient(client.id)}
            disabled={!hasContent}
            className={`
              relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
              ${!hasContent 
                ? 'opacity-50 cursor-not-allowed border-neutral-200 bg-neutral-50'
                : recentlyClicked === client.id 
                  ? client.activeColor 
                  : `border-neutral-200 bg-white ${client.bgColor} ${client.borderColor}`
              }
              group
            `}
          >
            {/* Logo */}
            <div className="w-12 h-12 rounded-lg bg-white border border-neutral-100 p-2 shadow-sm group-hover:shadow-md transition-shadow">
              <img 
                src={client.logo} 
                alt={client.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            
            {/* Nom */}
            <span className="text-sm font-semibold text-neutral-800">
              {t('email.options.openIn', { client: client.name }) || `Ouvrir dans ${client.name}`}
            </span>

            {/* Indicateur Web */}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-neutral-100 rounded-full">
              <ExternalLink className="w-3 h-3 text-neutral-500" />
              <span className="text-[10px] font-medium text-neutral-500 uppercase">Web</span>
            </div>

            {/* Indicateur de succès */}
            {recentlyClicked === client.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('email.options.opened', 'Ouvert !')}</span>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Options secondaires */}
      <div className="flex items-center gap-2">
        {/* Autre client email */}
        <button
          onClick={() => handleOpenClient('native')}
          disabled={!hasContent}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all
            ${!hasContent 
              ? 'opacity-50 cursor-not-allowed border-neutral-200 bg-neutral-50'
              : recentlyClicked === 'native'
                ? 'border-neutral-400 bg-neutral-100'
                : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300'
            }
          `}
        >
          <Mail className="w-4 h-4 text-neutral-600" />
          <span className="text-sm font-medium text-neutral-700">
            {t('email.options.otherClient', 'Autre client email')}
          </span>
        </button>

        {/* Copier */}
        <button
          onClick={handleCopy}
          disabled={isCopied || !hasContent}
          className={`
            flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all
            ${!hasContent 
              ? 'opacity-50 cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400'
              : isCopied
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 text-neutral-700'
            }
          `}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">{t('email.options.copiedShort', 'Copié !')}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">{t('email.options.copy', 'Copier')}</span>
            </>
          )}
        </button>
      </div>

      {/* Note d'aide */}
      <p className="text-xs text-neutral-500 text-center">
        {t('email.options.helpText', "L'email sera automatiquement copié. Vérifiez et envoyez depuis votre messagerie.")}
      </p>
    </div>
  );
};

export default EmailSendOptions;
