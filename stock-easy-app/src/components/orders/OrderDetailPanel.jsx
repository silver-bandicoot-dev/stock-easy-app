import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  MessageSquare
} from 'lucide-react';
import { ImagePreview } from '../ui/ImagePreview';
import CommentSection from '../comments/CommentSection';
import { formatConfirmedDate, calculateETA, formatETA } from '../../utils/dateUtils';
import { formatTrackingUrl, getTrackingLinkText, isValidUrl } from '../../utils/trackingUtils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants/stockEasyConstants';
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
  formatCurrency
}) => {
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
  const etaInfo = formatETA(calculatedETA, true);

  // Statut badges
  const getStatusBadge = (status) => {
    const colors = ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.pending_confirmation;
    const label = ORDER_STATUS_LABELS[status] || status;
    
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
            Confirmer la Commande
          </button>
        );
      
      case 'preparing':
        if (showShippingForm) {
          return (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Numéro de suivi"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919]"
              />
              <input
                type="text"
                placeholder="URL de tracking (optionnel)"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowShippingForm(false)}
                  className="flex-1 px-4 py-2.5 border border-[#E5E4DF] rounded-lg font-medium hover:bg-[#FAFAF7] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onShip(order.id, { trackingNumber, trackingUrl });
                    setShowShippingForm(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  Confirmer Expédition
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
            Marquer comme Expédiée
          </button>
        );
      
      case 'in_transit':
        return (
          <button
            onClick={() => onReceive(order.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Marquer comme Reçue
          </button>
        );
      
      case 'received':
        return (
          <button
            onClick={() => onStartReconciliation(order)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Démarrer la Réconciliation
          </button>
        );
      
      case 'reconciliation':
        return (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
              <AlertTriangle className="w-4 h-4" />
              Réconciliation en cours
            </div>
            <p className="text-sm text-red-600">
              Vérifiez les écarts et traitez les réclamations si nécessaire.
            </p>
          </div>
        );
      
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
            <span className="hidden sm:inline">Retour</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#E5E4DF] rounded-lg transition-colors">
              <Edit className="w-4 h-4 text-[#666663]" />
            </button>
            <button className="p-2 hover:bg-[#E5E4DF] rounded-lg transition-colors">
              <MoreHorizontal className="w-4 h-4 text-[#666663]" />
            </button>
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
                  <h3 className="font-semibold text-[#191919]">Produits Commandés</h3>
                </div>
                <span className="text-sm text-[#666663]">{order.items?.length || 0} article(s)</span>
              </div>
            </div>
            
            <div className="divide-y divide-[#E5E4DF]">
              {order.items?.map((item, idx) => {
                const product = products?.find(p => p.sku === item.sku);
                const lineTotal = roundToTwoDecimals((item.quantity || 0) * (item.pricePerUnit || 0));
                
                return (
                  <div key={idx} className="p-4 flex items-start gap-3">
                    {product?.imageUrl ? (
                      <ImagePreview
                        src={product.imageUrl}
                        alt={product?.name || item.sku}
                        thumbClassName="w-12 h-12 rounded-lg object-cover bg-[#E5E4DF] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#E5E4DF] flex items-center justify-center text-sm text-[#666663] flex-shrink-0">
                        {(product?.name || item.sku || '?').charAt(0)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#191919] text-sm truncate">
                        {product?.name || item.sku}
                      </h4>
                      <p className="text-xs text-[#666663]">SKU: {item.sku}</p>
                      
                      {/* Infos de réconciliation si présentes */}
                      {order.status === 'reconciliation' && (
                        <div className="mt-2 space-y-1">
                          {order.missingQuantitiesBySku?.[item.sku] > 0 && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                              -{order.missingQuantitiesBySku[item.sku]} manquant
                            </span>
                          )}
                          {order.damagedQuantitiesBySku?.[item.sku] > 0 && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded ml-1">
                              {order.damagedQuantitiesBySku[item.sku]} endommagé
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
                <span className="font-medium text-[#666663]">Total</span>
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
              <h3 className="font-semibold text-[#191919]">Fournisseur</h3>
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
                <h3 className="font-semibold text-[#191919]">Entrepôt de Destination</h3>
              </div>
              <p className="text-sm font-medium text-[#191919]">{warehouseName}</p>
            </div>
          )}

          {/* Section Suivi */}
          {(order.trackingNumber || order.trackingUrl) && (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-[#191919]" />
                <h3 className="font-semibold text-[#191919]">Suivi de Livraison</h3>
              </div>
              <div className="space-y-2">
                {order.trackingNumber && (
                  <p className="text-sm text-[#666663]">
                    N° de suivi: <span className="font-mono font-medium text-[#191919]">{order.trackingNumber}</span>
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
                <h3 className="font-semibold text-[#191919]">Livraison Estimée</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${
                  etaInfo.isPast ? 'text-red-600' :
                  etaInfo.isUrgent ? 'text-orange-600' :
                  'text-[#191919]'
                }`}>
                  {etaInfo.formatted}
                </span>
                {etaInfo.daysRemaining !== null && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    etaInfo.isPast ? 'bg-red-100 text-red-700' :
                    etaInfo.isUrgent ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {etaInfo.isPast ? `${Math.abs(etaInfo.daysRemaining)}j de retard` :
                     etaInfo.daysRemaining === 0 ? 'Aujourd\'hui' :
                     etaInfo.daysRemaining === 1 ? 'Demain' :
                     `dans ${etaInfo.daysRemaining}j`}
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
                <h3 className="font-semibold text-[#191919]">Timeline & Commentaires</h3>
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

