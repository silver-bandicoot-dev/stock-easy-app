import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  ChevronLeft,
  Package,
  Truck,
  Building2,
  Calendar,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Edit,
  MoreHorizontal,
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  FileText,
  MessageSquare,
  Share2
} from 'lucide-react';
import { ImagePreview } from '../ui/ImagePreview';
import CommentSection from '../comments/CommentSection';
import { formatConfirmedDate, calculateETA, formatETA } from '../../utils/dateUtils';
import { formatTrackingUrl, getTrackingLinkText, isValidUrl } from '../../utils/trackingUtils';
import { ORDER_STATUS_COLORS } from '../../constants/stockEasyConstants';
import { roundToTwoDecimals } from '../../utils/decimalUtils';

export const OrderDetailPanel = ({
  order,
  suppliers,
  products,
  warehouses,
  onClose,
  onConfirm,
  onShip,
  onReceive,
  onStartReconciliation,
  onGenerateReclamation,
  onCompleteReconciliation,
  onReceiveReplacement,
  onShare,
  onEdit,
  formatCurrency
}) => {
  const { t } = useTranslation();
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  // Résoudre les données
  const supplier = Object.values(suppliers || {}).find(s => s.name === order.supplier);
  const warehouseName = order.warehouseId && warehouses[order.warehouseId]
    ? warehouses[order.warehouseId].name
    : (order.warehouseName || order.warehouseId);

  // Calculer l'ETA
  const calculatedETA = order.eta || calculateETA(
    order.confirmedAt || order.createdAt,
    null,
    suppliers,
    order.supplier
  );
  
  // Pour les commandes complétées, utiliser la date de réception/complétion comme référence
  // au lieu de la date actuelle pour le calcul du retard
  const isOrderCompleted = order.status === 'completed';
  const referenceDate = isOrderCompleted 
    ? (order.receivedAt || order.completedAt || order.reconciliation_confirmed_at)
    : null;
  
  const etaInfo = formatETA(calculatedETA, true, { 
    referenceDate, 
    isCompleted: isOrderCompleted 
  });

  // Statut badges
  const getStatusBadge = (status) => {
    const colors = ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.pending_confirmation;
    const label = t(`orders.status.${status}`) || status;
    
    const statusIcons = {
      pending_confirmation: Clock,
      preparing: Package,
      in_transit: Truck,
      received: CheckCircle,
      completed: CheckCircle,
      reconciliation: AlertTriangle
    };
    
    const Icon = statusIcons[status] || Clock;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </span>
    );
  };

  // Actions selon le statut
  const renderActionButton = () => {
    switch (order.status) {
      case 'pending_confirmation':
        return (
          <button
            onClick={() => onConfirm(order.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#191919] text-white rounded-lg font-medium hover:bg-[#333333] transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            {t('orderDetail.buttons.confirmOrder')}
          </button>
        );
      
      case 'preparing':
        if (showShippingForm) {
          return (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={t('orderDetail.form.trackingNumberPlaceholder')}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919]"
              />
              <input
                type="text"
                placeholder={t('orderDetail.form.trackingUrlPlaceholder')}
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowShippingForm(false)}
                  className="flex-1 px-4 py-2.5 border border-[#E5E4DF] rounded-lg font-medium hover:bg-[#FAFAF7] transition-colors"
                >
                  {t('orderDetail.form.cancel')}
                </button>
                <button
                  onClick={() => {
                    onShip(order.id, { trackingNumber, trackingUrl });
                    setShowShippingForm(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  {t('orderDetail.form.confirmShipment')}
                </button>
              </div>
            </div>
          );
        }
        return (
          <button
            onClick={() => setShowShippingForm(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            <Truck className="w-4 h-4" />
            {t('orderDetail.buttons.markAsShipped')}
          </button>
        );
      
      case 'in_transit':
        return (
          <button
            onClick={() => onReceive(order.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            {t('orderDetail.buttons.markAsReceived')}
          </button>
        );
      
      case 'received':
        return (
          <button
            onClick={() => onStartReconciliation(order)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            {t('orderDetail.buttons.startReconciliation')}
          </button>
        );
      
      case 'reconciliation':
        // Vérifier s'il y a des écarts (manquants ou endommagés)
        const hasMissingItems = order.missingQuantitiesBySku && 
          Object.values(order.missingQuantitiesBySku).some(qty => qty > 0);
        const hasDamagedItems = order.damagedQuantitiesBySku && 
          Object.values(order.damagedQuantitiesBySku).some(qty => qty > 0);
        const hasDiscrepancies = hasMissingItems || hasDamagedItems;
        
        return (
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                <AlertTriangle className="w-4 h-4" />
                {t('orderDetail.reconciliation.inProgress')}
              </div>
              <p className="text-sm text-amber-600">
                {t('orderDetail.reconciliation.checkDiscrepancies')}
              </p>
            </div>
            
            {/* Boutons d'action pour la réconciliation */}
            <div className="flex flex-col gap-2">
              {/* Bouton Générer réclamation - affiché seulement s'il y a des écarts */}
              {hasDiscrepancies && onGenerateReclamation && (
                <button
                  onClick={() => onGenerateReclamation(order)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {t('orderDetail.buttons.generateReclamation')}
                </button>
              )}
              
              {/* Bouton Terminer la réconciliation */}
              {onCompleteReconciliation && (
                <button
                  onClick={() => onCompleteReconciliation(order.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('orderDetail.buttons.completeReconciliation')}
                </button>
              )}
            </div>
          </div>
        );
      
      case 'completed':
        // Vérifier s'il y a des articles à remplacer (manquants ou endommagés)
        const hasMissingOrDamaged = (order.missing_quantity_total || order.missingQuantityTotal || 0) > 0 ||
          (order.damaged_quantity_total || order.damagedQuantityTotal || 0) > 0;
        
        if (hasMissingOrDamaged && onReceiveReplacement) {
          return (
            <button
              onClick={() => onReceiveReplacement(order)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Package className="w-4 h-4" />
              {t('orderDetail.buttons.receiveReplacement', 'Recevoir les remplacements')}
            </button>
          );
        }
        return null;
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      className="w-full lg:w-1/2 xl:w-2/5 bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden flex flex-col"
    >
      {/* Header du panel */}
      <div className="p-4 border-b border-[#E5E4DF] bg-[#FAFAF7]">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm text-[#666663] hover:text-[#191919] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('orderDetail.back')}</span>
          </button>
          <div className="flex items-center gap-2">
            {/* Bouton Partager */}
            {onShare && (
              <button 
                onClick={() => onShare(order.id)}
                className="p-2 hover:bg-[#E5E4DF] rounded-lg transition-colors group"
                title={t('orderDetail.share')}
              >
                <Share2 className="w-4 h-4 text-[#666663] group-hover:text-[#191919]" />
              </button>
            )}
            {/* Bouton Éditer - uniquement pour pending_confirmation et preparing */}
            {onEdit && ['pending_confirmation', 'preparing'].includes(order.status) && (
              <button 
                onClick={() => onEdit(order)}
                className="p-2 hover:bg-[#E5E4DF] rounded-lg transition-colors group"
                title={t('orderDetail.edit', 'Modifier la commande')}
              >
                <Edit className="w-4 h-4 text-[#666663] group-hover:text-[#191919]" />
              </button>
            )}
            {/* Bouton Éditer désactivé pour les autres statuts */}
            {onEdit && !['pending_confirmation', 'preparing'].includes(order.status) && (
              <button 
                disabled
                className="p-2 rounded-lg transition-colors opacity-40 cursor-not-allowed"
                title={t('orderDetail.editDisabled', 'Modification non disponible pour ce statut')}
              >
                <Edit className="w-4 h-4 text-[#666663]" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#E5E4DF] rounded-lg transition-colors lg:hidden"
            >
              <X className="w-4 h-4 text-[#666663]" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-[#191919]">{order.id}</h2>
          {getStatusBadge(order.status)}
        </div>
        
        <p className="text-sm text-[#666663]">
          {formatConfirmedDate(order.createdAt)} • {order.supplier}
        </p>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          
          {/* Section Produits */}
          <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#E5E4DF] bg-[#FAFAF7]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#191919]" />
                  <h3 className="font-semibold text-[#191919]">{t('orderDetail.productsOrdered')}</h3>
                </div>
                <span className="text-sm text-[#666663]">{t('orderDetail.itemsCount', { count: order.items?.length || 0 })}</span>
              </div>
            </div>
            
            <div className="divide-y divide-[#E5E4DF]">
              {order.items?.map((item, idx) => {
                // Recherche case-insensitive du produit pour trouver l'image et le nom
                const product = products?.find(p => 
                  p.sku?.toLowerCase() === item.sku?.toLowerCase()
                );
                const lineTotal = roundToTwoDecimals((item.quantity || 0) * (item.pricePerUnit || 0));
                
                // Déterminer l'image à afficher (produit trouvé ou item lui-même)
                const imageUrl = product?.imageUrl || item.imageUrl || item.image_url;
                // Déterminer le nom à afficher (produit trouvé, item, ou formatage du SKU)
                const displayName = product?.name || item.name || item.productName || item.product_name;
                
                return (
                  <div key={idx} className="p-4 flex items-start gap-3">
                    {imageUrl ? (
                      <ImagePreview
                        src={imageUrl}
                        alt={displayName || item.sku}
                        thumbClassName="w-12 h-12 rounded-lg object-cover bg-[#E5E4DF] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#E5E4DF] flex items-center justify-center text-sm text-[#666663] flex-shrink-0">
                        {(displayName || item.sku || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#191919] text-sm truncate">
                        {displayName || item.sku}
                      </h4>
                      <p className="text-xs text-[#666663]">SKU: {item.sku}</p>
                      
                      {/* Infos de réconciliation si présentes */}
                      {order.status === 'reconciliation' && (
                        <div className="mt-2 space-y-1">
                          {order.missingQuantitiesBySku?.[item.sku] > 0 && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                              -{order.missingQuantitiesBySku[item.sku]} {t('orderDetail.reconciliation.missing')}
                            </span>
                          )}
                          {order.damagedQuantitiesBySku?.[item.sku] > 0 && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded ml-1">
                              {order.damagedQuantitiesBySku[item.sku]} {t('orderDetail.reconciliation.damaged')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-[#666663]">
                        {formatCurrency(item.pricePerUnit)} × {item.quantity}
                      </p>
                      <p className="font-semibold text-[#191919]">
                        {formatCurrency(lineTotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Total et actions */}
            <div className="p-4 bg-[#FAFAF7] border-t border-[#E5E4DF]">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-[#666663]">{t('orderDetail.total')}</span>
                <span className="text-xl font-bold text-[#191919]">
                  {formatCurrency(roundToTwoDecimals(order.total))}
                </span>
              </div>
              
              {/* Boutons d'action */}
              <div className="flex gap-2">
                {renderActionButton()}
              </div>
            </div>
          </div>

          {/* Section Fournisseur */}
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-[#191919]" />
              <h3 className="font-semibold text-[#191919]">{t('orderDetail.supplier')}</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#191919]">{order.supplier}</p>
              {supplier?.email && (
                <div className="flex items-center gap-2 text-sm text-[#666663]">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${supplier.email}`} className="hover:text-[#191919]">
                    {supplier.email}
                  </a>
                </div>
              )}
              {supplier?.phone && (
                <div className="flex items-center gap-2 text-sm text-[#666663]">
                  <Phone className="w-4 h-4" />
                  <span>{supplier.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section Entrepôt */}
          {warehouseName && (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-[#191919]" />
                <h3 className="font-semibold text-[#191919]">{t('orderDetail.destinationWarehouse')}</h3>
              </div>
              <p className="text-sm font-medium text-[#191919]">{warehouseName}</p>
            </div>
          )}

          {/* Section Suivi */}
          {(order.trackingNumber || order.trackingUrl) && (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-[#191919]" />
                <h3 className="font-semibold text-[#191919]">{t('orderDetail.deliveryTracking')}</h3>
              </div>
              <div className="space-y-2">
                {order.trackingNumber && (
                  <p className="text-sm text-[#666663]">
                    {t('orderDetail.trackingNumber')}: <span className="font-mono font-medium text-[#191919]">{order.trackingNumber}</span>
                  </p>
                )}
                {order.trackingUrl && isValidUrl(formatTrackingUrl(order.trackingUrl)) && (
                  <a
                    href={formatTrackingUrl(order.trackingUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#191919] text-white rounded-lg text-sm font-medium hover:bg-[#333333] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {getTrackingLinkText(order.trackingUrl)}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Section ETA */}
          {etaInfo && (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-[#191919]" />
                <h3 className="font-semibold text-[#191919]">{t('orderDetail.estimatedDelivery')}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${
                  etaInfo.isCompleted ? 'text-[#191919]' :
                  etaInfo.isPast ? 'text-red-600' :
                  etaInfo.isUrgent ? 'text-orange-600' :
                  'text-[#191919]'
                }`}>
                  {etaInfo.formatted}
                </span>
                {etaInfo.daysRemaining !== null && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    etaInfo.isCompleted 
                      ? (etaInfo.isPast ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700')
                      : (etaInfo.isPast ? 'bg-red-100 text-red-700' :
                         etaInfo.isUrgent ? 'bg-orange-100 text-orange-700' :
                         'bg-blue-100 text-blue-700')
                  }`}>
                    {etaInfo.isCompleted 
                      ? (etaInfo.isPast 
                          ? t('orderDetail.deliveredLate', { count: Math.abs(etaInfo.daysRemaining) })
                          : etaInfo.daysRemaining === 0 
                            ? t('orderDetail.deliveredOnTime')
                            : t('orderDetail.deliveredEarly', { count: etaInfo.daysRemaining }))
                      : (etaInfo.isPast 
                          ? t('orderDetail.daysLate', { count: Math.abs(etaInfo.daysRemaining) })
                          : etaInfo.daysRemaining === 0 
                            ? t('orderDetail.today')
                            : etaInfo.daysRemaining === 1 
                              ? t('orderDetail.tomorrow')
                              : t('orderDetail.inDays', { count: etaInfo.daysRemaining }))}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Section Timeline / Commentaires */}
          <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#E5E4DF] bg-[#FAFAF7]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#191919]" />
                <h3 className="font-semibold text-[#191919]">{t('orderDetail.timelineComments')}</h3>
              </div>
            </div>
            <div className="p-4">
              <CommentSection 
                purchaseOrderId={order.id}
                purchaseOrderNumber={order.id}
              />
            </div>
          </div>
          
        </div>
      </div>
    </motion.div>
  );
};

