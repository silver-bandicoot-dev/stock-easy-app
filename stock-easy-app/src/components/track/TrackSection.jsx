import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Package, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { OrderStatusCard } from './OrderStatusCard';

export const TrackSection = ({ 
  sectionKey,
  title,
  icon: Icon,
  orders,
  suppliers,
  products,
  warehouses = {},
  expandedOrders,
  toggleOrderDetails,
  confirmOrder,
  shipOrder,
  receiveOrder,
  onStartReconciliation,
  onConfirmReconciliation
}) => {
  const [sortBy, setSortBy] = useState('date_desc');

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

  const sortedOrders = useMemo(() => {
    const ordersCopy = [...filteredOrders];
    return ordersCopy.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : null;
      const dateB = b.createdAt ? new Date(b.createdAt) : null;
      const totalA = typeof a.total === 'number' ? a.total : parseFloat(a.total || 0);
      const totalB = typeof b.total === 'number' ? b.total : parseFloat(b.total || 0);

      switch (sortBy) {
        case 'date_asc':
          if (!dateA || !dateB) return 0;
          return dateA - dateB;
        case 'date_desc':
          if (!dateA || !dateB) return 0;
          return dateB - dateA;
        case 'total_asc':
          return totalA - totalB;
        case 'total_desc':
          return totalB - totalA;
        default:
          return 0;
      }
    });
  }, [filteredOrders, sortBy]);

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
      
      {/* Contrôles de tri des PO */}
      <div className="flex justify-end mb-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-[#666663]">Trier par :</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-[#E5E4DF] rounded-md px-2 py-1 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#191919]"
          >
            <option value="date_desc">Date (plus récent)</option>
            <option value="date_asc">Date (plus ancien)</option>
            <option value="total_desc">Montant (décroissant)</option>
            <option value="total_asc">Montant (croissant)</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {sortedOrders.length === 0 ? (
          <p className="text-[#666663] text-center py-8 text-sm">Aucune commande dans cette section</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {sortedOrders.map(order => (
              <OrderStatusCard
                key={order.id}
                order={order}
                suppliers={suppliers}
                products={products}
                warehouses={warehouses}
                expandedOrders={expandedOrders}
                toggleOrderDetails={toggleOrderDetails}
                confirmOrder={confirmOrder}
                shipOrder={shipOrder}
                receiveOrder={receiveOrder}
                onStartReconciliation={onStartReconciliation}
                onConfirmReconciliation={onConfirmReconciliation}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
