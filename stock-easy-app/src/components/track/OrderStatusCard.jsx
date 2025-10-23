import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Truck, Package, AlertTriangle, ArrowDownRight } from 'lucide-react';
import { Button } from '../shared/Button';
import { formatConfirmedDate, calculateDaysRemaining } from '../../utils/dateUtils';
import { ORDER_STATUS_LABELS_EMOJI, ORDER_STATUS_LABELS } from '../../constants/stockEasyConstants';
import { roundToTwoDecimals } from '../../utils/decimalUtils';

export const OrderStatusCard = ({ 
  order, 
  suppliers, 
  expandedOrders, 
  toggleOrderDetails, 
  confirmOrder, 
  shipOrder, 
  receiveOrder,
  onStartReconciliation
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_confirmation': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'preparing': return <Package className="w-4 h-4 text-blue-600" />;
      case 'in_transit': return <Truck className="w-4 h-4 text-orange-600" />;
      case 'received': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'reconciliation': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_confirmation': return 'text-yellow-600';
      case 'preparing': return 'text-blue-600';
      case 'in_transit': return 'text-orange-600';
      case 'received': return 'text-green-600';
      case 'reconciliation': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getActionButton = (status) => {
    switch (status) {
      case 'pending_confirmation':
        return (
          <Button
            variant="success"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              confirmOrder(order.id);
            }}
            className="shrink-0"
          >
            Confirmer
          </Button>
        );
      case 'preparing':
        return (
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              shipOrder(order.id);
            }}
            className="shrink-0"
          >
            Expédier
          </Button>
        );
      case 'in_transit':
        return (
          <Button
            variant="success"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStartReconciliation(order);
            }}
            className="shrink-0"
          >
            Valider la réception
          </Button>
        );
      case 'received':
        return (
          <div className="text-sm text-green-600 font-medium">
            En attente de validation
          </div>
        );
      case 'reconciliation':
        return (
          <div className="text-sm text-red-600 font-medium">
            À réconcilier
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#FAFAF7] rounded-lg border border-[#E5E4DF] overflow-hidden">
      {/* Header de la commande - Cliquable */}
      <div 
        className="p-3 sm:p-4 cursor-pointer hover:bg-[#F5F5F0] transition-colors"
        onClick={() => toggleOrderDetails(order.id)}
      >
        <div className="space-y-3">
          {/* Ligne 1: N° PO + Chevron */}
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
          </div>
          
          {/* Ligne 2: Fournisseur */}
          <div className="flex items-center gap-2">
            <span className="text-[#666663] text-xs sm:text-sm">Fournisseur:</span>
            <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.supplier}</span>
          </div>
          
          {/* Ligne 3: Entrepôt */}
          {(order.warehouseName || order.warehouseId) && (
            <div className="flex items-center gap-2">
              <span className="text-[#666663] text-xs sm:text-sm">Entrepôt de livraison:</span>
              <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.warehouseName || order.warehouseId}</span>
            </div>
          )}
          
          {/* Ligne 4: Infos */}
          <div className="text-xs sm:text-sm space-y-1">
            <div>
              <span className="text-[#666663]">Date: </span>
              <span className="text-[#191919]">{formatConfirmedDate(order.createdAt)}</span>
            </div>
            <div>
              <span className="text-[#666663]">Total: </span>
              <span className="text-[#191919] font-bold">{roundToTwoDecimals(order.total).toFixed(2)}€</span>
            </div>
          </div>
          
          {/* Bouton d'action */}
          <div className="pt-2" onClick={(e) => e.stopPropagation()}>
            {getActionButton(order.status)}
          </div>
        </div>
      </div>

      {/* Détails de la commande - Expandable */}
      {expandedOrders[order.id] && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-[#E5E4DF] p-3 sm:p-4"
        >
          <div className="space-y-3">
            {/* Statut */}
            <div className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                {ORDER_STATUS_LABELS_EMOJI[order.status]} {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>

            {/* Informations de livraison */}
            {order.shippedAt && (
              <div className="text-xs text-[#666663]">
                <div>Expédié le: {formatConfirmedDate(order.shippedAt)}</div>
                {order.leadTimeDays && (
                  <div>
                    Livraison prévue: {calculateDaysRemaining(order.shippedAt, order.leadTimeDays)} jours restants
                  </div>
                )}
              </div>
            )}

            {/* Liste des produits */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[#191919]">Produits commandés:</h4>
              <div className="space-y-1">
                {order.products?.map((product, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-[#191919] truncate">{product.name}</span>
                    <span className="text-[#666663] ml-2 shrink-0">
                      {product.quantity} × {roundToTwoDecimals(product.price).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
