import React from 'react';
import { motion } from 'framer-motion';
import { History, Download, Filter, Calendar, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../shared/Button';
import { OrderCard } from '../shared/OrderCard';
import { toast } from 'sonner';
import { formatConfirmedDate } from '../../utils/dateUtils';
import { roundToTwoDecimals, formatUnits } from '../../utils/decimalUtils';

export const HistoryTab = ({
  orders,
  products,
  suppliers, // Ajout des fournisseurs
  historyFilter,
  setHistoryFilter,
  historyDateStart,
  setHistoryDateStart,
  historyDateEnd,
  setHistoryDateEnd,
  expandedOrders,
  toggleOrderDetails
}) => {
  // Filtrer les commandes selon les critères
  const filteredOrders = orders.filter(order => {
    // Filtre par statut
    if (historyFilter !== 'all' && order.status !== historyFilter) return false;
    
    // Filtre par date
    if (historyDateStart || historyDateEnd) {
      const orderDate = new Date(order.createdAt);
      if (historyDateStart && orderDate < new Date(historyDateStart)) return false;
      if (historyDateEnd && orderDate > new Date(historyDateEnd)) return false;
    }
    
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_confirmation': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'preparing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_transit': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'received': return 'text-green-600 bg-green-50 border-green-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'reconciliation': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_confirmation': return 'En attente';
      case 'preparing': return 'En traitement';
      case 'in_transit': return 'En transit';
      case 'received': return 'Reçues';
      case 'completed': return 'Complétées';
      case 'reconciliation': return 'À réconcilier';
      default: return status;
    }
  };

  const handleExportCSV = () => {
    try {
      const csvData = filteredOrders.map(order => {
        const orderLine = {
          'N° Commande': order.id,
          'Fournisseur': order.supplier,
          'Statut': getStatusLabel(order.status),
          'Date': formatConfirmedDate(order.createdAt),
          'Total': `${order.total.toFixed(2)}€`,
          'Produits': order.items.length,
          'Entrepôt': order.warehouseName || order.warehouseId || 'Non spécifié',
          'Suivi': order.trackingNumber || 'Non disponible'
        };
        
        // Ajouter les détails des produits
        order.items.forEach((item, index) => {
          const product = products.find(p => p.sku === item.sku);
          orderLine[`Produit ${index + 1}`] = product?.name || item.sku;
          orderLine[`SKU ${index + 1}`] = item.sku;
          orderLine[`Quantité ${index + 1}`] = item.quantity;
          orderLine[`Prix ${index + 1}`] = `${item.pricePerUnit.toFixed(2)}€`;
        });
        
        return orderLine;
      });

      const headers = [
        'N° Commande', 'Fournisseur', 'Statut', 'Date', 'Total', 'Produits', 
        'Entrepôt', 'Suivi'
      ];
      
      // Ajouter les colonnes pour les produits (max 5 produits par commande)
      for (let i = 1; i <= 5; i++) {
        headers.push(`Produit ${i}`, `SKU ${i}`, `Quantité ${i}`, `Prix ${i}`);
      }

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            return `"${value.toString().replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historique_commandes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Export CSV réussi !');
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4 sm:p-6">
        {/* Header et filtres optimisés mobile */}
        <div className="space-y-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#191919] mb-1 sm:mb-2">Historique des Commandes</h2>
            <p className="text-xs sm:text-sm text-[#666663]">Consultez toutes vos commandes passées et leur statut</p>
          </div>
          
          {/* Filtres en colonne sur mobile, ligne sur desktop */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3 sm:flex-wrap">
            {/* Sélecteur de statut en premier sur mobile (plus important) */}
            <select 
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg text-[#191919] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending_confirmation">En attente</option>
              <option value="preparing">En traitement</option>
              <option value="in_transit">En transit</option>
              <option value="received">Reçues</option>
              <option value="completed">Complétées</option>
              <option value="reconciliation">À réconcilier</option>
            </select>
            
            {/* Dates en grid sur mobile */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm text-[#666663] font-medium">Du:</label>
                <input
                  type="date"
                  value={historyDateStart}
                  onChange={(e) => setHistoryDateStart(e.target.value)}
                  className="px-2 sm:px-3 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg text-[#191919] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm text-[#666663] font-medium">Au:</label>
                <input
                  type="date"
                  value={historyDateEnd}
                  onChange={(e) => setHistoryDateEnd(e.target.value)}
                  className="px-2 sm:px-3 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg text-[#191919] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPIs en grid responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-[#FAFAF7] rounded-lg p-3 sm:p-4 border border-[#E5E4DF]">
            <div className="text-xl sm:text-2xl font-bold text-[#191919]">{orders.length}</div>
            <div className="text-xs sm:text-sm text-[#666663] mt-1">Total commandes</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'completed').length}
            </div>
            <div className="text-xs sm:text-sm text-[#666663] mt-1">Complétées</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
            <div className="text-xl sm:text-2xl font-bold text-[#64A4F2]">
              {orders.filter(o => o.status === 'in_transit' || o.status === 'preparing' || o.status === 'pending_confirmation').length}
            </div>
            <div className="text-xs sm:text-sm text-[#666663] mt-1">En cours</div>
          </div>
          <div className="bg-[#FAFAF7] rounded-lg p-3 sm:p-4 border border-[#E5E4DF]">
            <div className="text-xl sm:text-2xl font-bold text-[#191919]">
              {orders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}€
            </div>
            <div className="text-xs sm:text-sm text-[#666663] mt-1">Montant total</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-8">
            <p className="text-[#666663] text-center text-sm">Aucune commande trouvée pour ces critères</p>
          </div>
        ) : (
          filteredOrders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(order => (
              <OrderCard
                key={order.id}
                order={order}
                products={products}
                suppliers={suppliers}
                expandedOrders={expandedOrders}
                toggleOrderDetails={toggleOrderDetails}
                showStatus={true}
                showActions={false}
                compactMode={false}
              />
            ))
        )}
      </div>

      <div className="flex justify-center sm:justify-end">
        <Button
          onClick={handleExportCSV}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>
    </motion.div>
  );
};