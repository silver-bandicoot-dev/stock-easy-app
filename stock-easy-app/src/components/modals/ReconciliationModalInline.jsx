import React from 'react';
import { Check, Info, ArrowDownRight, Truck, ExternalLink, Calendar } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import CommentSection from '../comments/CommentSection';
import { formatConfirmedDate, calculateETA, formatETA } from '../../utils/dateUtils';
import { roundToTwoDecimals } from '../../utils/decimalUtils';
import { formatTrackingUrl, getTrackingLinkText, isValidUrl } from '../../utils/trackingUtils';
import { useCurrency } from '../../contexts/CurrencyContext';

export const ReconciliationModalInline = ({
  isOpen,
  onClose,
  reconciliationOrder,
  products,
  discrepancyItems,
  setDiscrepancyItems,
  damagedQuantities,
  setDamagedQuantities,
  confirmReconciliationWithQuantities,
  warehouses = {},
  suppliers = []
}) => {
  const [showDetails, setShowDetails] = React.useState(true);
  const { format: formatCurrency } = useCurrency();

  if (!isOpen || !reconciliationOrder) return null;

  // Obtenir le nom de l'entrepôt
  const warehouseName = reconciliationOrder.warehouseId && warehouses[reconciliationOrder.warehouseId]
    ? warehouses[reconciliationOrder.warehouseId].name
    : (reconciliationOrder.warehouseName || reconciliationOrder.warehouseId);

  // Calculer l'ETA si elle n'existe pas déjà
  const calculatedETA = reconciliationOrder.eta || calculateETA(
    reconciliationOrder.confirmedAt || reconciliationOrder.createdAt,
    null,
    suppliers,
    reconciliationOrder.supplier
  );

  // Formater l'ETA pour l'affichage
  const etaInfo = formatETA(calculatedETA, true);

  return (
    <Modal
      isOpen={isOpen && reconciliationOrder}
      onClose={onClose}
      title="Vérification de la réception"
      size="large"
      footer={
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button 
            variant="success" 
            icon={Check}
            onClick={() => {
              console.log('🔥 BOUTON CLIQUÉ DANS ReconciliationModalInline');
              console.log('🔥 discrepancyItems:', discrepancyItems);
              console.log('🔥 damagedQuantities:', damagedQuantities);
              confirmReconciliationWithQuantities();
            }}
          >
            Valider la réception
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* En-tête de la commande - Style similaire à OrderCard */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-[#FAFAF7] transition-colors"
            onClick={() => setShowDetails(!showDetails)}
          >
            <div className="space-y-3">
              {/* Ligne 1: N° PO + Chevron */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#191919] text-base">{reconciliationOrder.id}</span>
                  <motion.div
                    animate={{ rotate: showDetails ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                  </motion.div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium border bg-red-50 text-[#EF1C43] border-red-200">
                  À réconcilier
                </span>
              </div>
              
              {/* Ligne 2: Fournisseur */}
              <div className="flex items-center gap-2">
                <span className="text-[#666663] text-sm">Fournisseur:</span>
                <span className="text-[#191919] font-medium text-sm">{reconciliationOrder.supplier}</span>
              </div>
              
              {/* Ligne 3: Entrepôt */}
              {warehouseName && (
                <div className="flex items-center gap-2">
                  <span className="text-[#666663] text-sm">Entrepôt de livraison:</span>
                  <span className="text-[#191919] font-medium text-sm">{warehouseName}</span>
                </div>
              )}
              
              {/* Ligne 4: Infos principales */}
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-[#666663]">Date: </span>
                  <span className="text-[#191919]">{formatConfirmedDate(reconciliationOrder.createdAt)}</span>
                </div>
                <div>
                  <span className="text-[#666663]">Total: </span>
                  <span className="text-[#191919] font-bold">{formatCurrency(roundToTwoDecimals(reconciliationOrder.total))}</span>
                </div>
                {/* ETA - Livraison estimée */}
                {etaInfo && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Calendar className="w-3 h-3 text-[#666663]" />
                    <span className="text-[#666663]">Livraison estimée: </span>
                    <span className={`font-medium ${
                      etaInfo.isPast ? 'text-red-600' :
                      etaInfo.isUrgent ? 'text-orange-600' :
                      'text-[#191919]'
                    }`}>
                      {etaInfo.formatted}
                    </span>
                    {etaInfo.daysRemaining !== null && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        etaInfo.isPast ? 'bg-red-100 text-red-700' :
                        etaInfo.isUrgent ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {etaInfo.isPast ? `${Math.abs(etaInfo.daysRemaining)}j de retard` :
                         etaInfo.daysRemaining === 0 ? 'Aujourd\'hui' :
                         etaInfo.daysRemaining === 1 ? 'Demain' :
                         `dans ${etaInfo.daysRemaining}j`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Informations de transit */}
              {(reconciliationOrder.trackingNumber || reconciliationOrder.trackingUrl) && (
                <div className="flex items-center justify-between bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg px-3 py-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-3 h-3 text-[#666663]" />
                    <span className="text-xs text-[#666663]">Numéro de suivi:</span>
                    {reconciliationOrder.trackingNumber && (
                      <span className="text-xs text-[#191919] font-mono font-medium">{reconciliationOrder.trackingNumber}</span>
                    )}
                  </div>
                  {reconciliationOrder.trackingUrl && isValidUrl(formatTrackingUrl(reconciliationOrder.trackingUrl)) && (
                    <a 
                      href={formatTrackingUrl(reconciliationOrder.trackingUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[#191919] text-white rounded hover:bg-[#333333] transition-colors text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {getTrackingLinkText(reconciliationOrder.trackingUrl)}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Détails des produits commandés */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-[#E5E4DF] bg-white"
              >
                <div className="p-4">
                  <h4 className="font-semibold text-sm text-[#666663] mb-3">Produits commandés:</h4>
                  
                  <div className="space-y-2">
                    {reconciliationOrder.items?.map((item, idx) => {
                      const product = products?.find(p => p.sku === item.sku);
                      return (
                        <div key={idx} className="bg-[#FAFAF7] rounded border border-[#E5E4DF] p-3">
                          <div className="space-y-2">
                            {/* Nom du produit */}
                            <div>
                              <div className="font-medium text-[#191919] text-sm">
                                {product?.name || item.sku}
                              </div>
                              <div className="text-xs text-[#666663] mt-0.5">
                                SKU: {item.sku}
                              </div>
                            </div>
                            
                            {/* Infos quantité et prix */}
                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E5E4DF]">
                              <div>
                                <div className="text-[#666663]">Quantité</div>
                                <div className="font-bold text-[#191919]">{item.quantity} unités</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[#666663]">Prix unitaire</div>
                                <div className="font-medium text-[#191919]">{formatCurrency(roundToTwoDecimals(item.pricePerUnit))}</div>
                              </div>
                              <div className="col-span-2 pt-1 border-t border-[#E5E4DF]">
                                <div className="flex justify-between items-center">
                                  <span className="text-[#666663] font-medium">Total ligne</span>
                                  <span className="font-bold text-[#191919] text-sm">{formatCurrency(roundToTwoDecimals(item.quantity * item.pricePerUnit))}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Total de la commande */}
                  <div className="mt-3 pt-3 border-t border-[#E5E4DF] flex justify-between">
                    <span className="font-semibold text-[#666663] text-sm">Total:</span>
                    <span className="font-bold text-[#191919]">{formatCurrency(roundToTwoDecimals(reconciliationOrder.total))}</span>
                  </div>
                  
                  {/* Section Commentaires */}
                  <div className="mt-4 pt-4 border-t border-[#E5E4DF]">
                    <CommentSection 
                      purchaseOrderId={reconciliationOrder.id}
                      purchaseOrderNumber={reconciliationOrder.id}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Instructions de réconciliation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Instructions de réconciliation</h4>
              <p className="text-sm text-blue-700">
                Saisissez les quantités réellement reçues et leur état pour chaque produit.
              </p>
            </div>
          </div>
        </div>
        
        {/* Formulaire de réconciliation */}
        <div className="space-y-3">
          <h4 className="font-semibold text-base text-[#191919]">Quantités reçues</h4>
          {reconciliationOrder.items.map((item, idx) => {
            const product = products.find(p => p.sku === item.sku);
            const currentReceived = discrepancyItems[item.sku]?.received !== undefined 
              ? discrepancyItems[item.sku].received 
              : item.quantity;
            const currentDamaged = damagedQuantities[item.sku] || 0;
            
            // Calculer le total reçu (sain + endommagé)
            const totalReceived = parseInt(currentReceived || 0) + parseInt(currentDamaged || 0);
            const hasMissing = totalReceived < item.quantity;
            const hasDamaged = parseInt(currentDamaged) > 0;
            const missingQuantity = item.quantity - totalReceived;
            const hasExcess = totalReceived > item.quantity;
            const excessQuantity = totalReceived - item.quantity;
            
            return (
              <div key={idx} className="border-2 border-[#E5E4DF] rounded-xl p-4 bg-white shadow-sm">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#191919] text-base">{product?.name || item.sku}</span>
                      <span className="text-xs text-[#666663] ml-2">SKU: {item.sku}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#666663]">Prix unitaire</div>
                      <div className="font-bold text-[#191919]">{formatCurrency(roundToTwoDecimals(item.pricePerUnit))}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Quantité commandée */}
                  <div>
                    <label className="text-xs font-medium text-[#666663] block mb-1">📦 Commandé</label>
                    <input 
                      type="number" 
                      value={item.quantity}
                      disabled
                      className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg bg-gray-50 text-[#666663] text-center font-bold"
                    />
                  </div>
                  
                  {/* Quantité reçue saine */}
                  <div>
                    <label className="text-xs font-medium text-[#666663] block mb-1">✅ Reçu sain</label>
                    <input 
                      type="number" 
                      min="0"
                      value={currentReceived}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setDiscrepancyItems(prev => ({
                          ...prev,
                          [item.sku]: {
                            ...prev[item.sku],
                            received: value
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-black font-bold text-[#191919]"
                    />
                  </div>
                  
                  {/* Quantité endommagée */}
                  <div>
                    <label className="text-xs font-medium text-[#666663] block mb-1">🔴 Endommagé</label>
                    <input 
                      type="number" 
                      min="0"
                      value={currentDamaged}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setDamagedQuantities(prev => ({
                          ...prev,
                          [item.sku]: value
                        }));
                      }}
                      className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-black font-bold text-[#191919]"
                    />
                  </div>
                  
                  {/* Résumé avec écarts */}
                  <div className="sm:col-span-1 col-span-2">
                    <label className="text-xs font-medium text-[#666663] block mb-1">📊 Statut</label>
                    <div className="text-xs space-y-1">
                      {/* État général */}
                      {!hasMissing && !hasExcess && !hasDamaged && (
                        <div className="px-2 py-1.5 rounded-lg bg-green-50 text-green-700 font-medium border border-green-200">
                          ✅ Conforme
                        </div>
                      )}
                      
                      {/* Manquants */}
                      {hasMissing && (
                        <div className="px-2 py-1.5 rounded-lg bg-red-50 text-red-700 font-medium border border-red-200">
                          ❌ {missingQuantity} manquant{missingQuantity > 1 ? 's' : ''}
                        </div>
                      )}
                      
                      {/* Excédent */}
                      {hasExcess && (
                        <div className="px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-medium border border-blue-200">
                          📈 +{excessQuantity} en plus
                        </div>
                      )}
                      
                      {/* Endommagés */}
                      {hasDamaged && (
                        <div className="px-2 py-1.5 rounded-lg bg-orange-50 text-orange-700 font-medium border border-orange-200">
                          ⚠️ {currentDamaged} endommagé{currentDamaged > 1 ? 's' : ''}
                        </div>
                      )}
                      
                      {/* Total reçu */}
                      <div className="px-2 py-1.5 rounded-lg bg-gray-50 text-gray-700 font-medium border border-gray-200">
                        Total: {totalReceived}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Valeur monétaire des écarts */}
                {(hasMissing || hasDamaged) && (
                  <div className="mt-3 pt-3 border-t border-[#E5E4DF] grid grid-cols-2 gap-3 text-xs">
                    {hasMissing && (
                      <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                        <div className="text-red-600 font-medium">Perte manquants</div>
                        <div className="text-red-700 font-bold text-sm">
                          {formatCurrency(-roundToTwoDecimals(missingQuantity * item.pricePerUnit))}
                        </div>
                      </div>
                    )}
                    {hasDamaged && (
                      <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
                        <div className="text-orange-600 font-medium">Perte endommagés</div>
                        <div className="text-orange-700 font-bold text-sm">
                          {formatCurrency(-roundToTwoDecimals(currentDamaged * item.pricePerUnit))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Résumé global des écarts */}
        {(() => {
          const totalOrdered = reconciliationOrder.items.reduce((sum, item) => sum + item.quantity, 0);
          const totalReceivedGood = Object.values(discrepancyItems).reduce((sum, item) => sum + (item?.received || 0), 0);
          const totalDamaged = Object.values(damagedQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
          const totalMissing = reconciliationOrder.items.reduce((sum, item) => {
            const received = (discrepancyItems[item.sku]?.received !== undefined ? discrepancyItems[item.sku].received : item.quantity);
            const damaged = damagedQuantities[item.sku] || 0;
            const total = parseInt(received || 0) + parseInt(damaged || 0);
            return sum + Math.max(0, item.quantity - total);
          }, 0);
          
          const totalLossMissing = reconciliationOrder.items.reduce((sum, item) => {
            const received = (discrepancyItems[item.sku]?.received !== undefined ? discrepancyItems[item.sku].received : item.quantity);
            const damaged = damagedQuantities[item.sku] || 0;
            const total = parseInt(received || 0) + parseInt(damaged || 0);
            const missing = Math.max(0, item.quantity - total);
            return sum + (missing * item.pricePerUnit);
          }, 0);
          
          const totalLossDamaged = reconciliationOrder.items.reduce((sum, item) => {
            const damaged = damagedQuantities[item.sku] || 0;
            return sum + (damaged * item.pricePerUnit);
          }, 0);
          
          const hasIssues = totalMissing > 0 || totalDamaged > 0;
          
          return hasIssues ? (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6">
              <h4 className="font-bold text-red-900 text-lg mb-4">⚠️ Résumé des écarts</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="text-red-600 text-xs font-medium mb-1">Total manquants</div>
                  <div className="text-red-900 font-bold text-2xl">{totalMissing}</div>
                  <div className="text-red-700 text-sm mt-1">{formatCurrency(-roundToTwoDecimals(totalLossMissing))}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="text-orange-600 text-xs font-medium mb-1">Total endommagés</div>
                  <div className="text-orange-900 font-bold text-2xl">{totalDamaged}</div>
                  <div className="text-orange-700 text-sm mt-1">{formatCurrency(-roundToTwoDecimals(totalLossDamaged))}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-300">
                  <div className="text-red-700 text-xs font-medium mb-1">Perte totale</div>
                  <div className="text-red-900 font-bold text-2xl">{formatCurrency(-roundToTwoDecimals(totalLossMissing + totalLossDamaged))}</div>
                  <div className="text-red-600 text-xs mt-1">À réclamer au fournisseur</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-bold text-green-900 text-base">Livraison conforme</h4>
                  <p className="text-sm text-green-700">Tous les produits sont reçus en bon état et en quantité correcte.</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </Modal>
  );
};
