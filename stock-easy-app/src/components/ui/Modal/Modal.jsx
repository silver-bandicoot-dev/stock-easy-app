import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Composant Modal - Modal overlay unifié avec animation
 * @param {Object} props
 * @param {boolean} props.isOpen - Indique si le modal est ouvert
 * @param {Function} props.onClose - Fonction appelée à la fermeture
 * @param {string} props.title - Titre du modal
 * @param {React.ReactNode} props.children - Contenu du modal
 * @param {React.ReactNode} props.footer - Footer optionnel du modal
 * @param {string} props.size - Taille du modal ('small' | 'medium' | 'large' | 'xlarge')
 * @returns {JSX.Element|null}
 */
export function Modal({ isOpen, onClose, title, children, footer, size = 'medium' }) {
  if (!isOpen) return null;
  
  // Déterminer la largeur max selon la taille
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl'
  };
  
  const maxWidthClass = sizeClasses[size] || sizeClasses.medium;
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`relative bg-white rounded-xl shadow-2xl ${maxWidthClass} w-full max-h-[90vh] flex flex-col`}>
        <div className="bg-[#191919] px-6 py-4 flex items-center justify-between rounded-t-xl shrink-0">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-white hover:text-[#BFBFBA] transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded p-1"
            aria-label="Fermer"
          >
            <X className="w-6 h-6 shrink-0" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 bg-[#FAFAF7] border-t border-[#E5E4DF] rounded-b-xl shrink-0">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}

