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
  const [supplierFilter, setSupplierFilter] = useState('all');

  const filteredOrders = orders.filter(order => {
    // Filtre par statut selon la section
    let matchesStatus = false;
    switch (sectionKey) {
      case 'en_cours_commande': matchesStatus = order.status === 'pending_confirmation'; break;
      case 'preparation': matchesStatus = order.status === 'preparing'; break;
      case 'en_transit': matchesStatus = order.status === 'in_transit'; break;
      case 'commandes_recues': matchesStatus = order.status === 'received'; break;
      case 'reconciliation': matchesStatus = order.status === 'reconciliation'; break;
      default: matchesStatus = false;
    }
    
    if (!matchesStatus) return false;
    
    // Filtre par fournisseur
    if (supplierFilter !== 'all' && order.supplier !== supplierFilter) return false;
    
    return true;
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
      className="space-y-3"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#191919] shrink-0" />
        <h2 className="text-base sm:text-lg font-bold text-[#191919]">{title}</h2>
        <span className="text-sm text-[#666663]">({filteredOrders.length})</span>
      </div>
      
      {/* Filtres et tri */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        {/* Filtre par fournisseur */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-[#666663]">Fournisseur :</span>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="border border-[#E5E4DF] rounded-md px-2 py-1 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#191919]"
          >
            <option value="all">Tous les fournisseurs</option>
            {Object.values(suppliers || {}).map(supplier => (
              <option key={supplier.name} value={supplier.name}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Contrôles de tri des PO */}
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
