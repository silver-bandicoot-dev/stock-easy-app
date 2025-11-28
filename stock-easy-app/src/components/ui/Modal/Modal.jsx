import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

/**
 * Composant Modal unifié - Système de modales cohérent pour toute l'application
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Indique si le modal est ouvert
 * @param {Function} props.onClose - Fonction appelée à la fermeture
 * @param {string} props.title - Titre du modal
 * @param {React.ReactNode} props.icon - Icône optionnelle à afficher dans le header (Lucide icon component)
 * @param {React.ReactNode} props.children - Contenu du modal
 * @param {React.ReactNode} props.footer - Footer optionnel du modal
 * @param {string} props.size - Taille du modal ('sm' | 'md' | 'lg' | 'xl' | 'full')
 * @param {string} props.variant - Variante visuelle ('default' | 'search' | 'centered')
 * @param {boolean} props.closeOnBackdrop - Fermer au clic sur le backdrop (défaut: true)
 * @param {boolean} props.closeOnEscape - Fermer avec Escape (défaut: true)
 * @param {boolean} props.showCloseButton - Afficher le bouton X (défaut: true)
 * @param {string} props.className - Classes CSS additionnelles pour le contenu
 * @returns {JSX.Element|null}
 */
export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  icon: Icon,
  children, 
  footer, 
  size = 'md',
  variant = 'default',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = ''
}) {
  // Gestion de la touche Escape
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  // Configuration des tailles
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-[95vw]'
  };

  // Configuration des variantes
  const variantConfig = {
    default: {
      position: 'items-center justify-center',
      animation: {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 }
      },
      containerClass: 'rounded-xl'
    },
    search: {
      position: 'items-start justify-center pt-[10vh]',
      animation: {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
      },
      containerClass: 'rounded-xl'
    },
    centered: {
      position: 'items-center justify-center',
      animation: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 }
      },
      containerClass: 'rounded-2xl'
    }
  };

  const config = variantConfig[variant] || variantConfig.default;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className={`fixed inset-0 z-[9999] flex p-4 ${config.position}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden="true"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={config.animation.initial}
            animate={config.animation.animate}
            exit={config.animation.exit}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={`
              relative bg-white shadow-2xl 
              ${sizeClasses[size]} w-full max-h-[85vh] 
              flex flex-col ${config.containerClass}
            `}
          >
            {/* Header */}
            {title && (
              <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between rounded-t-xl shrink-0">
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <h3 id="modal-title" className="text-lg font-semibold text-white">
                    {title}
                  </h3>
                </div>
                {showCloseButton && (
                  <button 
                    onClick={onClose} 
                    className="
                      text-white/70 hover:text-white 
                      transition-colors p-1.5 rounded-lg
                      hover:bg-white/10
                      focus:outline-none focus:ring-2 focus:ring-white/20
                    "
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className={`p-6 overflow-y-auto flex-1 custom-scrollbar ${className}`}>
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 rounded-b-xl shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Utiliser un portal pour rendre la modale à la racine du DOM
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return null;
}

/**
 * Composant ModalFooter - Footer standardisé avec actions
 */
export function ModalFooter({ 
  children, 
  align = 'right',
  className = '' 
}) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={`flex items-center gap-3 ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Composant ModalSection - Section de contenu avec titre optionnel
 */
export function ModalSection({ 
  title, 
  description,
  children,
  className = '' 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
          )}
          {description && (
            <p className="text-sm text-neutral-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export default Modal;
