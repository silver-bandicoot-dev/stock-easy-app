import React from 'react';
import { Clock, CheckCircle, Truck, Package, AlertTriangle } from 'lucide-react';
import { Button } from '../shared/Button';
import { OrderCard } from '../shared/OrderCard';

export const OrderStatusCard = ({ 
  order, 
  suppliers, 
  products,
  expandedOrders, 
  toggleOrderDetails, 
  confirmOrder, 
  shipOrder, 
  receiveOrder,
  onStartReconciliation
}) => {
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
              receiveOrder(order.id);
            }}
            className="shrink-0"
          >
            Valider la réception
          </Button>
        );
      case 'received':
        return (
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStartReconciliation(order);
            }}
            className="shrink-0"
          >
            Réconcilier
          </Button>
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
    <OrderCard
      order={order}
      products={products}
      suppliers={suppliers}
      expandedOrders={expandedOrders}
      toggleOrderDetails={toggleOrderDetails}
      showStatus={false}
      showActions={true}
      actionButton={getActionButton(order.status)}
      compactMode={true}
    />
  );
};
