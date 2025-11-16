import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownRight, Truck, ExternalLink, CheckCircle, Calendar, Clock, AlertTriangle } from 'lucide-react';
import CommentSection from '../comments/CommentSection';
import { ImagePreview } from '../ui/ImagePreview';
import { formatConfirmedDate, calculateETA, formatETA } from '../../utils/dateUtils';
import { roundToTwoDecimals } from '../../utils/decimalUtils';
import { formatTrackingUrl, getTrackingLinkText, isValidUrl } from '../../utils/trackingUtils';
import { useCurrency } from '../../contexts/CurrencyContext';

export const OrderCard = ({ 
  order, 
  products,
  expandedOrders,
  toggleOrderDetails,
  showStatus = true,
  showActions = false,
  actionButton = null,
  compactMode = false,
  suppliers = [], // Fournisseurs pour les données de base
  warehouses = {} // Entrepôts pour résoudre les noms
}) => {
  const { format: formatCurrency } = useCurrency();
  // Résoudre le nom de l'entrepôt
  const warehouseName = order.warehouseId && warehouses[order.warehouseId]
    ? warehouses[order.warehouseId].name
    : (order.warehouseName || order.warehouseId);

  // Calculer l'ETA si elle n'existe pas déjà
  const calculatedETA = order.eta || calculateETA(
    order.confirmedAt || order.createdAt,
    null, // leadTimeDays sera récupéré depuis le fournisseur
    suppliers,
    order.supplier
  );

  // Formater l'ETA pour l'affichage
  const etaInfo = formatETA(calculatedETA, true);

  // Utiliser les vraies données sans inventer de fallback
  const getDisplayData = () => {
    return {
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      eta: calculatedETA
    };
  };

  const displayData = getDisplayData();
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_confirmation': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'preparing': return 'bg-blue-50 text-[#64A4F2] border-blue-200';
      case 'in_transit': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'received': return 'bg-green-50 text-green-600 border-green-200';
      case 'completed': return 'bg-green-50 text-green-600 border-green-200';
      case 'reconciliation': return 'bg-red-50 text-[#EF1C43] border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_confirmation': return 'En attente';
      case 'preparing': return 'En traitement';
      case 'in_transit': return 'En transit';
      case 'received': return 'Reçues';
      case 'completed': return 'Complétée';
      case 'reconciliation': return 'À réconcilier';
      default: return status || 'Inconnu';
    }
  };

  const status = {
    label: getStatusLabel(order.status),
    color: getStatusColor(order.status)
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
      {/* Header de la commande - Cliquable */}
      <div 
        className="p-3 sm:p-4 cursor-pointer hover:bg-[#FAFAF7] transition-colors"
        onClick={() => toggleOrderDetails(order.id)}
      >
        <div className="space-y-3">
          {/* Ligne 1: N° PO + Badge Statut + Chevron */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-bold text-[#191919] text-sm sm:text-base">{order.id}</span>
              <motion.div
                animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0"
              >
                <ArrowDownRight className="w-4 h-4 text-[#666663]" />
              </motion.div>
            </div>
            {showStatus && (
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border inline-block shrink-0 ${status.color}`}>
                {status.label}
              </span>
            )}
          </div>
          
          {/* Ligne 2: Fournisseur */}
          <div className="flex items-center gap-2">
            <span className="text-[#666663] text-xs sm:text-sm">Fournisseur:</span>
            <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.supplier}</span>
          </div>
          
          {/* Ligne 3: Entrepôt */}
          {warehouseName && (
            <div className="flex items-center gap-2">
              <span className="text-[#666663] text-xs sm:text-sm">Entrepôt de livraison:</span>
              <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{warehouseName}</span>
            </div>
          )}
          
          {/* Ligne 4: Infos principales */}
          <div className="text-xs sm:text-sm space-y-1">
            <div>
              <span className="text-[#666663]">Date: </span>
              <span className="text-[#191919]">{formatConfirmedDate(order.createdAt)}</span>
            </div>
            <div>
              <span className="text-[#666663]">Total: </span>
              <span className="text-[#191919] font-bold">{formatCurrency(roundToTwoDecimals(order.total))}</span>
            </div>
            {/* ETA - Livraison estimée */}
            {etaInfo && (
              <div className="flex items-center gap-1">
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

          {/* Ligne 5: Récapitulatif de réconciliation - Toujours affiché pour les PO en réconciliation */}
          {order.status === 'reconciliation' && (
            <div className={`border rounded-lg px-3 py-2 mt-2 space-y-1 ${
              (order.missingQuantityTotal > 0 || order.damagedQuantityTotal > 0) 
                ? 'bg-red-50 border-red-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`w-4 h-4 ${
                  (order.missingQuantityTotal > 0 || order.damagedQuantityTotal > 0) 
                    ? 'text-red-600' 
                    : 'text-yellow-600'
                }`} />
                <span className={`text-xs font-semibold ${
                  (order.missingQuantityTotal > 0 || order.damagedQuantityTotal > 0) 
                    ? 'text-red-700' 
                    : 'text-yellow-700'
                }`}>
                  {order.missingQuantityTotal > 0 || order.damagedQuantityTotal > 0 
                    ? '⚠️ Écarts de livraison détectés' 
                    : '📋 En attente de réconciliation'}
                </span>
              </div>
              
              {/* Afficher les totaux s'il y a des écarts */}
              {(order.missingQuantityTotal > 0 || order.damagedQuantityTotal > 0) && (
                <div className="space-y-1">
                  {order.missingQuantityTotal > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-red-600">❌ Total manquant:</span>
                      <span className="font-bold text-red-700">{order.missingQuantityTotal} unités</span>
                    </div>
                  )}
                  {order.damagedQuantityTotal > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-orange-600">🔴 Total endommagé:</span>
                      <span className="font-bold text-orange-700">{order.damagedQuantityTotal} unités</span>
                    </div>
                  )}
                  
                  {/* Afficher un résumé par SKU si disponible */}
                  {((order.missingQuantitiesBySku && Object.keys(order.missingQuantitiesBySku).length > 0) ||
                    (order.damagedQuantitiesBySku && Object.keys(order.damagedQuantitiesBySku).length > 0)) && (
                    <div className="pt-1 mt-1 border-t border-red-200">
                      <div className="text-xs font-medium text-red-700 mb-1">Détails par produit:</div>
                      {(() => {
                        // Combiner tous les SKU avec des écarts (manquants ou endommagés)
                        const allSkuWithIssues = new Set([
                          ...(order.missingQuantitiesBySku ? Object.keys(order.missingQuantitiesBySku) : []),
                          ...(order.damagedQuantitiesBySku ? Object.keys(order.damagedQuantitiesBySku) : [])
                        ]);
                        
                        return Array.from(allSkuWithIssues).map(sku => {
                          const missingQty = order.missingQuantitiesBySku?.[sku] || 0;
                          const damagedQty = order.damagedQuantitiesBySku?.[sku] || 0;
                          const product = products?.find(p => p.sku === sku);
                          
                          if (missingQty === 0 && damagedQty === 0) return null;
                          
                          return (
                            <div key={sku} className="text-xs text-red-600 pl-2">
                              • {product?.name || sku}: 
                              {missingQty > 0 && <span className="font-bold ml-1">-{missingQty} manquant{missingQty > 1 ? 's' : ''}</span>}
                              {damagedQty > 0 && <span className="font-bold ml-1 text-orange-600">, {damagedQty} endommagé{damagedQty > 1 ? 's' : ''}</span>}
                            </div>
                          );
                        }).filter(Boolean);
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Ligne 6: Informations de transit (numéro de suivi et URL seulement) */}
          {(displayData.trackingNumber || displayData.trackingUrl) && (
            <div className="flex items-center justify-between bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg px-3 py-2 mt-2">
              <div className="flex items-center gap-2">
                <Truck className="w-3 h-3 text-[#666663]" />
                <span className="text-xs text-[#666663]">Numéro de suivi:</span>
                
                {/* Numéro de suivi */}
                {displayData.trackingNumber && (
                  <span className="text-xs text-[#191919] font-mono font-medium">{displayData.trackingNumber}</span>
                )}
              </div>
              
              {/* Bouton de tracking avec détection du transporteur */}
              {displayData.trackingUrl && isValidUrl(formatTrackingUrl(displayData.trackingUrl)) && (
                <a 
                  href={formatTrackingUrl(displayData.trackingUrl)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#191919] text-white rounded hover:bg-[#333333] transition-colors text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  {getTrackingLinkText(displayData.trackingUrl)}
                </a>
              )}
            </div>
          )}
          
          {/* Bouton d'action */}
          {showActions && actionButton && (
            <div className="pt-2" onClick={(e) => e.stopPropagation()}>
              {actionButton}
            </div>
          )}
        </div>
      </div>
      
      {/* Détails des produits - Expansible */}
      <AnimatePresence>
        {expandedOrders[order.id] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-[#E5E4DF] bg-white"
          >
            <div className="p-3 sm:p-4">
              <h4 className="font-semibold text-sm text-[#666663] mb-2">Produits commandés:</h4>
              
              
              {compactMode ? (
                // Mode compact - une ligne par produit
                <div className="space-y-1">
                  {order.items?.map((item, idx) => {
                    const product = products?.find(p => p.sku === item.sku);
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {product?.imageUrl ? (
                            <ImagePreview
                              src={product.imageUrl}
                              alt={product?.name || item.sku}
                              thumbClassName="w-8 h-8 rounded-md object-cover flex-shrink-0 bg-[#E5E4DF]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-[#E5E4DF] flex items-center justify-center text-[10px] text-[#666663] flex-shrink-0">
                              {(product?.name || item.sku || '?').charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[#191919] font-medium truncate block">
                              {product?.name || item.sku}
                            </span>
                            <span className="text-[#666663] text-xs">
                              SKU: {item.sku}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <span className="text-[#191919] font-bold">
                            {item.quantity} × {formatCurrency(roundToTwoDecimals(item.pricePerUnit))}
                          </span>
                          <span className="text-[#666663] ml-2">
                            = {formatCurrency(roundToTwoDecimals(item.quantity * item.pricePerUnit))}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Mode détaillé - cartes pour chaque produit
                <div className="space-y-2">
                  {order.items?.map((item, idx) => {
                    const product = products?.find(p => p.sku === item.sku);
                    
                    // Récupérer les quantités manquantes et endommagées depuis l'objet order
                    const missingQty = order.missingQuantitiesBySku?.[item.sku] || 0;
                    const damagedQty = order.damagedQuantitiesBySku?.[item.sku] || 0;
                    const hasReconciliationData = order.status === 'reconciliation' && (missingQty > 0 || damagedQty > 0);
                    
                    return (
                      <div key={idx} className="bg-[#FAFAF7] rounded border border-[#E5E4DF] p-2 sm:p-3">
                        <div className="space-y-2">
                          {/* Nom du produit + image */}
                          <div className="flex items-start gap-2">
                            {product?.imageUrl ? (
                              <ImagePreview
                                src={product.imageUrl}
                                alt={product?.name || item.sku}
                                thumbClassName="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-[#E5E4DF]"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-md bg-[#E5E4DF] flex items-center justify-center text-[11px] text-[#666663] flex-shrink-0">
                                {(product?.name || item.sku || '?').charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-[#191919] text-xs sm:text-sm">
                                {product?.name || item.sku}
                              </div>
                              <div className="text-xs text-[#666663] mt-0.5">
                                SKU: {item.sku}
                              </div>
                            </div>
                          </div>
                          
                          {/* Infos quantité et prix en grid */}
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
                          
                          {/* Informations de réconciliation - Affichage amélioré */}
                          {(order.status === 'reconciliation' || hasReconciliationData) && (
                            <div className={`mt-2 pt-2 border-t rounded p-2 space-y-1 ${
                              hasReconciliationData 
                                ? 'border-red-200 bg-red-50' 
                                : 'border-gray-200 bg-gray-50'
                            }`}>
                              {hasReconciliationData ? (
                                <>
                                  <div className="font-semibold text-red-700 text-xs mb-1">⚠️ Écarts détectés</div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-[#666663]">Commandé:</span>
                                      <span className="font-bold text-[#191919] ml-1">{item.quantity}</span>
                                    </div>
                                    {item.receivedQuantity !== undefined && (
                                      <div>
                                        <span className="text-green-600">Reçu sain:</span>
                                        <span className="font-bold text-green-700 ml-1">{item.receivedQuantity}</span>
                                      </div>
                                    )}
                                  </div>
                                  {missingQty > 0 && (
                                    <div className="flex justify-between text-xs bg-red-100 rounded px-2 py-1">
                                      <span className="text-red-600">❌ Manquant:</span>
                                      <span className="font-bold text-red-700">{missingQty} unités</span>
                                    </div>
                                  )}
                                  {damagedQty > 0 && (
                                    <div className="flex justify-between text-xs bg-orange-100 rounded px-2 py-1">
                                      <span className="text-orange-600">🔴 Endommagé:</span>
                                      <span className="font-bold text-orange-700">{damagedQty} unités</span>
                                    </div>
                                  )}
                                  {item.discrepancyNotes && (
                                    <div className="text-xs pt-1 border-t border-red-200">
                                      <span className="text-red-600 font-medium">Notes: </span>
                                      <span className="text-red-700 italic">{item.discrepancyNotes}</span>
                                    </div>
                                  )}
                                </>
                              ) : order.status === 'reconciliation' ? (
                                <div className="text-xs text-yellow-700">
                                  📋 Données de réconciliation en cours de traitement
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Total de la commande */}
              <div className="mt-3 pt-3 border-t border-[#E5E4DF] flex justify-between">
                <span className="font-semibold text-[#666663] text-sm">Total:</span>
                <span className="font-bold text-[#191919]">{formatCurrency(roundToTwoDecimals(order.total))}</span>
              </div>
              
              {/* Section Commentaires */}
              <div className="mt-4 pt-4 border-t border-[#E5E4DF]">
                <CommentSection 
                  purchaseOrderId={order.id}
                  purchaseOrderNumber={order.id}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
