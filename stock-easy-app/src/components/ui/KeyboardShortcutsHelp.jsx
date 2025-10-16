import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

const shortcuts = [
  { keys: ['Ctrl', 'K'], description: 'Recherche globale' },
  { keys: ['Ctrl', 'N'], description: 'Nouveau produit' },
  { keys: ['Ctrl', 'Shift', 'O'], description: 'Nouvelle commande' },
  { keys: ['Ctrl', 'S'], description: 'Sauvegarder' },
  { keys: ['ESC'], description: 'Fermer modal' },
  { keys: ['?'], description: 'Afficher l\'aide' },
];

export const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Écouter la touche ?
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '?' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Bouton pour ouvrir */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 p-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors z-40"
        title="Raccourcis clavier (?)"
      >
        <Keyboard size={20} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Raccourcis clavier
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-700">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-gray-400 mx-1">+</span>}
                          <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm text-xs font-mono">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-500 mt-6 text-center">
                Appuyez sur <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">?</kbd> pour afficher cette aide
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
