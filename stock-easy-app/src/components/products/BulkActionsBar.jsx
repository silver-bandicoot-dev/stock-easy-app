import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Edit, Download, Tag } from 'lucide-react';
import Button from '../ui/Button/Button';

export const BulkActionsBar = ({ 
  selectedCount, 
  onClearSelection,
  onBulkDelete,
  onBulkEdit,
  onBulkExport,
  onBulkTag
}) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 z-50"
        >
          {/* Compteur */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold">
              {selectedCount}
            </div>
            <span className="font-medium">
              {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </span>
          </div>

          <div className="h-6 w-px bg-gray-700" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onBulkEdit}
              className="text-white hover:bg-gray-800"
            >
              <Edit size={16} />
              <span className="ml-2">Modifier</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onBulkTag}
              className="text-white hover:bg-gray-800"
            >
              <Tag size={16} />
              <span className="ml-2">Étiqueter</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onBulkExport}
              className="text-white hover:bg-gray-800"
            >
              <Download size={16} />
              <span className="ml-2">Exporter</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onBulkDelete}
              className="text-red-400 hover:bg-red-900/20"
            >
              <Trash2 size={16} />
              <span className="ml-2">Supprimer</span>
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-700" />

          {/* Bouton fermer */}
          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
