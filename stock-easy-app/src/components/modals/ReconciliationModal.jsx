import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, Package, CheckCircle } from 'lucide-react';
import Button from '../ui/Button/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

export const ReconciliationModal = ({ 
  isOpen, 
  onClose, 
  order,
  onReconcile 
}) => {
  const [reconciliation, setReconciliation] = useState([]);
  const [notes, setNotes] = useState('');

  // Initialiser avec les quantités commandées
  useEffect(() => {
    if (order?.items) {
      setReconciliation(order.items.map(item => ({
        sku: item.sku,
        name: item.name,
        ordered: item.quantity,
        received: item.quantity, // Par défaut = quantité commandée
        difference: 0,
        status: 'ok'
      })));
    }
  }, [order]);

  // Mettre à jour la quantité reçue
  const updateReceived = (sku, value) => {
    setReconciliation(prev => prev.map(item => {
      if (item.sku === sku) {
        const received = Math.max(0, Number(value));
        const difference = received - item.ordered;
        let status = 'ok';
        
        if (difference < 0) status = 'missing';
        if (difference > 0) status = 'excess';
        
        return {
          ...item,
          received,
          difference,
          status
        };
      }
      return item;
    }));
  };

  // Calculer les statistiques
  const stats = reconciliation.reduce((acc, item) => {
    acc.totalOrdered += item.ordered;
    acc.totalReceived += item.received;
    if (item.status === 'missing') acc.missing++;
    if (item.status === 'excess') acc.excess++;
    if (item.status === 'ok') acc.ok++;
    return acc;
  }, { totalOrdered: 0, totalReceived: 0, missing: 0, excess: 0, ok: 0 });

  const isComplete = stats.totalReceived === stats.totalOrdered;
  const hasDiscrepancies = stats.missing > 0 || stats.excess > 0;

  // Soumettre le rapprochement
  const handleSubmit = async () => {
    try {
      await onReconcile({
        orderId: order.id,
        reconciliation,
        notes,
        isComplete,
        hasDiscrepancies,
        completedAt: new Date().toISOString()
      });
      
      toast.success('Rapprochement effectué avec succès');
      onClose();
    } catch (err) {
      toast.error('Erreur lors du rapprochement');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Rapprochement de commande
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Commande #{order?.orderNumber || order?.id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
            <div className="text-center">
              <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrdered}</p>
              <p className="text-sm text-gray-500">Commandés</p>
            </div>
            
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalReceived}</p>
              <p className="text-sm text-gray-500">Reçus</p>
            </div>
            
            <div className="text-center">
              {hasDiscrepancies ? (
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              ) : (
                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
              )}
              <p className="text-2xl font-bold text-gray-900">
                {stats.missing + stats.excess}
              </p>
              <p className="text-sm text-gray-500">Écarts</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {reconciliation.map(item => (
              <div
                key={item.sku}
                className={`
                  border-2 rounded-lg p-4 transition-all
                  ${item.status === 'ok' ? 'border-green-200 bg-green-50' : ''}
                  ${item.status === 'missing' ? 'border-red-200 bg-red-50' : ''}
                  ${item.status === 'excess' ? 'border-amber-200 bg-amber-50' : ''}
                `}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Info produit */}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  </div>

                  {/* Quantité commandée */}
                  <div className="text-center w-20">
                    <p className="text-xs text-gray-500 mb-1">Commandé</p>
                    <p className="font-bold text-gray-900">{item.ordered}</p>
                  </div>

                  {/* Input quantité reçue */}
                  <div className="w-32">
                    <label className="block text-xs text-gray-500 mb-1">Reçu</label>
                    <Input
                      type="number"
                      min="0"
                      value={item.received}
                      onChange={(e) => updateReceived(item.sku, e.target.value)}
                      className={`text-center font-bold
                        ${item.status === 'ok' ? 'text-green-600' : ''}
                        ${item.status === 'missing' ? 'text-red-600' : ''}
                        ${item.status === 'excess' ? 'text-amber-600' : ''}
                      `}
                    />
                  </div>

                  {/* Différence */}
                  <div className="text-center w-20">
                    <p className="text-xs text-gray-500 mb-1">Écart</p>
                    <p className={`font-bold
                      ${item.difference === 0 ? 'text-green-600' : ''}
                      ${item.difference < 0 ? 'text-red-600' : ''}
                      ${item.difference > 0 ? 'text-amber-600' : ''}
                    `}>
                      {item.difference > 0 ? '+' : ''}{item.difference}
                    </p>
                  </div>

                  {/* Status icon */}
                  <div>
                    {item.status === 'ok' && (
                      <Check className="w-6 h-6 text-green-500" />
                    )}
                    {item.status === 'missing' && (
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    )}
                    {item.status === 'excess' && (
                      <AlertTriangle className="w-6 h-6 text-amber-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes sur le rapprochement
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Précisez les raisons des écarts, dommages, etc..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {/* Alerte si écarts */}
            {hasDiscrepancies && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900">Des écarts ont été détectés</p>
                  <p className="text-sm text-amber-700 mt-1">
                    {stats.missing > 0 && `${stats.missing} produit(s) manquant(s). `}
                    {stats.excess > 0 && `${stats.excess} produit(s) en excédent. `}
                    Veuillez vérifier et ajouter des notes.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Annuler
              </Button>
              
              <Button
                type="button"
                onClick={handleSubmit}
                className={hasDiscrepancies ? 'bg-amber-500 hover:bg-amber-600' : ''}
              >
                {hasDiscrepancies ? 'Valider malgré les écarts' : 'Valider le rapprochement'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
