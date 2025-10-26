import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modal - Composant modal réutilisable
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {function} onClose - Callback de fermeture
 * @param {string} title - Titre du modal
 * @param {string} size - Taille du modal (small, medium, large)
 * @param {React.ReactNode} children - Contenu du modal
 * @param {React.ReactNode} footer - Pied du modal
 */
export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  size = 'medium',
  children,
  footer 
}) {
  // Fermer le modal avec la touche Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Tailles du modal
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[85vh] overflow-hidden flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#E5E4DF]">
                <h2 className="text-xl font-bold text-[#191919]">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#F0F0EB] rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-[#666663]" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1 min-h-0">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="p-6 border-t border-[#E5E4DF] bg-[#FAFAF7]">
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
