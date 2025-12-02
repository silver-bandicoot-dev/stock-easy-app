import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Check, AlertTriangle, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../shared/Button';

/**
 * Modale pour recevoir les articles de remplacement d'une commande réconciliée
 * Affiche les articles manquants et endommagés et permet de saisir les quantités reçues
 */
export const ReplacementReceiptModal = ({
  isOpen,
  onClose,
  order,
  onConfirm,
  isProcessing = false
}) => {
  const { t } = useTranslation();
  
  // État pour les quantités reçues par SKU
  const [receivedQuantities, setReceivedQuantities] = useState({});
  
  // Calculer les articles à remplacer
  const itemsToReplace = useMemo(() => {
    if (!order) return [];
    
    const items = [];
    const missingBySku = order.missingQuantitiesBySku || order.missing_quantities_by_sku || {};
    const damagedBySku = order.damagedQuantitiesBySku || order.damaged_quantities_by_sku || {};
    
    // Parcourir les items de la commande
    (order.items || []).forEach(item => {
      const sku = item.sku;
      const missing = missingBySku[sku] || 0;
      const damaged = damagedBySku[sku] || 0;
      const totalToReplace = missing + damaged;
      
      if (totalToReplace > 0) {
        items.push({
          sku,
          name: item.name || item.productName || sku,
          missing,
          damaged,
          totalToReplace
        });
      }
    });
    
    return items;
  }, [order]);
  
  // Mettre à jour la quantité reçue pour un SKU
  const updateQuantity = (sku, delta) => {
    setReceivedQuantities(prev => {
      const current = prev[sku] || 0;
      const item = itemsToReplace.find(i => i.sku === sku);
      const max = item?.totalToReplace || 0;
      const newValue = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [sku]: newValue };
    });
  };
  
  // Calculer le total des quantités à recevoir
  const totalToReceive = useMemo(() => {
    return Object.values(receivedQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [receivedQuantities]);
  
  // Gérer la confirmation
  const handleConfirm = () => {
    const replacements = Object.entries(receivedQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([sku, quantity]) => ({ sku, quantity }));
    
    if (replacements.length > 0) {
      onConfirm(order.id, replacements);
    }
  };
  
  // Remplir toutes les quantités au max
  const fillAll = () => {
    const filled = {};
    itemsToReplace.forEach(item => {
      filled[item.sku] = item.totalToReplace;
    });
    setReceivedQuantities(filled);
  };
  
  if (!isOpen || !order) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#E5E4DF] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#191919]">
                  {t('orders.replacement.title', 'Recevoir les Remplacements')}
                </h2>
                <p className="text-sm text-[#666663]">
                  {t('orders.replacement.subtitle', 'Commande {{id}}', { id: order.id })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F5F5F0] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#666663]" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 flex-1 overflow-y-auto">
            {itemsToReplace.length === 0 ? (
              <div className="text-center py-8 text-[#666663]">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                <p>{t('orders.replacement.noItems', 'Aucun article à remplacer')}</p>
              </div>
            ) : (
              <>
                {/* Info banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-700">
                    {t('orders.replacement.info', 'Indiquez les quantités reçues du fournisseur pour mettre à jour le stock.')}
                  </p>
                </div>
                
                {/* Bouton remplir tout */}
                <div className="flex justify-end mb-3">
                  <button
                    onClick={fillAll}
                    className="text-sm text-[#191919] hover:text-[#EF1C43] underline"
                  >
                    {t('orders.replacement.fillAll', 'Tout recevoir')}
                  </button>
                </div>
                
                {/* Liste des articles */}
                <div className="space-y-3">
                  {itemsToReplace.map(item => (
                    <div
                      key={item.sku}
                      className="border border-[#E5E4DF] rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-[#191919]">{item.name}</p>
                          <p className="text-xs text-[#666663]">{item.sku}</p>
                        </div>
                        <div className="text-right text-xs">
                          {item.missing > 0 && (
                            <span className="text-red-600 block">
                              {t('orders.replacement.missing', '{{count}} manquant(s)', { count: item.missing })}
                            </span>
                          )}
                          {item.damaged > 0 && (
                            <span className="text-amber-600 block">
                              {t('orders.replacement.damaged', '{{count}} endommagé(s)', { count: item.damaged })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Contrôle de quantité */}
                      <div className="flex items-center justify-between bg-[#F5F5F0] rounded-lg p-2">
                        <span className="text-sm text-[#666663]">
                          {t('orders.replacement.received', 'Reçu')}:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.sku, -1)}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-[#E5E4DF] rounded-lg hover:bg-[#FAFAF7] transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-semibold text-[#191919]">
                            {receivedQuantities[item.sku] || 0}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.sku, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-[#E5E4DF] rounded-lg hover:bg-[#FAFAF7] transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-[#666663]">
                            / {item.totalToReplace}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-[#E5E4DF] flex items-center justify-between">
            <div className="text-sm text-[#666663]">
              {t('orders.replacement.totalToReceive', 'Total à recevoir')}: 
              <span className="font-semibold text-[#191919] ml-1">{totalToReceive}</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isProcessing}
              >
                {t('common.cancel', 'Annuler')}
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={totalToReceive === 0 || isProcessing}
                icon={Check}
              >
                {isProcessing 
                  ? t('common.processing', 'Traitement...')
                  : t('orders.replacement.confirm', 'Confirmer la réception')
                }
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReplacementReceiptModal;

