import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Package, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { OrderStatusCard } from './OrderStatusCard';

export const TrackSection = ({ 
  sectionKey,
  title,
  icon: Icon,
  orders,
  suppliers,
  expandedOrders,
  toggleOrderDetails,
  confirmOrder,
  shipOrder,
  receiveOrder,
  onStartReconciliation
}) => {
  const filteredOrders = orders.filter(order => {
    switch (sectionKey) {
      case 'en_cours_commande': return order.status === 'pending_confirmation';
      case 'preparation': return order.status === 'preparing';
      case 'en_transit': return order.status === 'in_transit';
      case 'commandes_recues': return order.status === 'received';
      case 'reconciliation': return order.status === 'reconciliation';
      default: return false;
    }
  });

  return (
    <motion.div
      key={sectionKey}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#191919] shrink-0" />
        <h2 className="text-base sm:text-lg font-bold text-[#191919]">{title}</h2>
        <span className="text-sm text-[#666663]">({filteredOrders.length})</span>
      </div>
      
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <p className="text-[#666663] text-center py-8 text-sm">Aucune commande dans cette section</p>
        ) : (
          filteredOrders.map(order => (
            <OrderStatusCard
              key={order.id}
              order={order}
              suppliers={suppliers}
              expandedOrders={expandedOrders}
              toggleOrderDetails={toggleOrderDetails}
              confirmOrder={confirmOrder}
              shipOrder={shipOrder}
              receiveOrder={receiveOrder}
              onStartReconciliation={onStartReconciliation}
            />
          ))
        )}
      </div>
    </motion.div>
  );
};
