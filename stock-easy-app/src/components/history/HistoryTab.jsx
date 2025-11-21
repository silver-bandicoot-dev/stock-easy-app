import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../shared/Button';
import { OrderCard } from '../shared/OrderCard';
import { toast } from 'sonner';
import { formatConfirmedDate } from '../../utils/dateUtils';
import { useCurrency } from '../../contexts/CurrencyContext';
import api from '../../services/apiAdapter';

export const HistoryTab = ({
  orders: initialOrders, // Ignoré en faveur du chargement serveur
  products,
  suppliers,
  warehouses = {},
  historyFilter,
  setHistoryFilter,
  historySupplierFilter,
  setHistorySupplierFilter,
  historyDateStart,
  setHistoryDateStart,
  historyDateEnd,
  setHistoryDateEnd,
  expandedOrders,
  toggleOrderDetails
}) => {
  const { format: formatCurrency } = useCurrency();
  
  // États pour la pagination serveur
  const [remoteOrders, setRemoteOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1 });
  const [aggregates, setAggregates] = useState(null);
  const [sortBy, setSortBy] = useState('created_at_desc'); // Modifié pour correspondre au backend si besoin

  // Charger les données quand les filtres ou la page changent
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const result = await api.getOrdersPaginated({
          page,
          pageSize,
          status: historyFilter,
          supplier: historySupplierFilter,
          startDate: historyDateStart,
          endDate: historyDateEnd
        });
        
        setRemoteOrders(result.data || []);
        setMeta(result.meta || { totalCount: 0, totalPages: 1 });
        setAggregates(result.aggregates || null);
      } catch (error) {
        console.error('Erreur chargement historique:', error);
        toast.error('Impossible de charger l\'historique des commandes');
      } finally {
        setLoading(false);
      }
    };

    // Debounce pour éviter trop d'appels si les filtres changent vite ? 
    // Pour l'instant appel direct
    fetchHistory();
  }, [page, pageSize, historyFilter, historySupplierFilter, historyDateStart, historyDateEnd]);

  // Réinitialiser la page à 1 quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [historyFilter, historySupplierFilter, historyDateStart, historyDateEnd]);

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

  const handleExportCSV = async () => {
    const toastId = toast.loading('Préparation de l\'export...');
    try {
      // Récupérer TOUTES les données correspondant aux filtres pour l'export
      // On utilise une grande taille de page
      const result = await api.getOrdersPaginated({
        page: 1,
        pageSize: 10000, // Limite arbitraire haute
        status: historyFilter,
        supplier: historySupplierFilter,
        startDate: historyDateStart,
        endDate: historyDateEnd
      });

      const exportOrders = result.data || [];

      const csvData = exportOrders.map(order => {
        const orderLine = {
          'N° Commande': order.id,
          'Fournisseur': order.supplier,
          'Statut': getStatusLabel(order.status),
          'Date': formatConfirmedDate(order.createdAt),
          'Total': formatCurrency(order.total),
          'Produits': order.items ? order.items.length : 0,
          'Entrepôt': order.warehouseName || order.warehouseId || 'Non spécifié',
          'Suivi': order.trackingNumber || 'Non disponible'
        };
        
        // Ajouter les détails des produits
        if (order.items) {
          order.items.forEach((item, index) => {
            const product = products.find(p => p.sku === item.sku);
            orderLine[`Produit ${index + 1}`] = product?.name || item.sku;
            orderLine[`SKU ${index + 1}`] = item.sku;
            orderLine[`Quantité ${index + 1}`] = item.quantity;
            orderLine[`Prix ${index + 1}`] = formatCurrency(item.pricePerUnit);
          });
        }
        
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
      
      toast.success('Export CSV réussi !', { id: toastId });
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast.error('Erreur lors de l\'export CSV', { id: toastId });
    }
  };

  // Calculer les totaux à partir des agrégats serveur
  const stats = useMemo(() => {
    if (!aggregates) return {
      totalCount: 0,
      completedCount: 0,
      inProgressCount: 0,
      totalAmount: 0
    };

    const statusCounts = aggregates.statusCounts || {};
    
    const completed = Number(statusCounts.completed || 0);
    const inProgress = 
      Number(statusCounts.pending_confirmation || 0) + 
      Number(statusCounts.preparing || 0) + 
      Number(statusCounts.in_transit || 0) +
      Number(statusCounts.received || 0) +
      Number(statusCounts.reconciliation || 0);

    return {
      totalCount: aggregates.totalCount || 0,
      completedCount: completed,
      inProgressCount: inProgress,
      totalAmount: aggregates.totalAmount || 0
    };
  }, [aggregates]);

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#191919] mb-1 sm:mb-2">Historique des Commandes</h2>
              <p className="text-xs sm:text-sm text-[#666663]">Consultez toutes vos commandes passées et leur statut (Mode Serveur)</p>
            </div>
            <Button
              onClick={handleExportCSV}
              variant="primary"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </Button>
          </div>
          
          {/* Filtres */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3 sm:flex-wrap">
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
            
            <select 
              value={historySupplierFilter}
              onChange={(e) => setHistorySupplierFilter(e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg text-[#191919] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">Tous les fournisseurs</option>
              {Object.values(suppliers || {}).map(supplier => (
                <option key={supplier.name} value={supplier.name}>
                  {supplier.name}
                </option>
              ))}
            </select>
            
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

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-[#FAFAF7] rounded-lg p-3 sm:p-4 border border-[#E5E4DF]">
            <div className="text-xl sm:text-2xl font-bold text-[#191919]">{stats.totalCount}</div>
            <div className="text-xs sm:text-sm text-[#666663] mt-1">Total commandes</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {stats.completedCount}
            </div>
            <div className="text-xs sm:text-sm text-[#666663] mt-1">Complétées</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
            <div className="text-xl sm:text-2xl font-bold text-[#64A4F2]">
              {stats.inProgressCount}
            </div>
            <div className="text-xs sm:text-sm text-[#666663] mt-1">En cours</div>
          </div>
          <div className="bg-[#FAFAF7] rounded-lg p-3 sm:p-4 border border-[#E5E4DF]">
            <div className="text-xl sm:text-2xl font-bold text-[#191919]">
              {formatCurrency(stats.totalAmount)}
            </div>
            <div className="text-xs sm:text-sm text-[#666663] mt-1">Montant total</div>
          </div>
        </div>
      </div>

      {/* Loader ou Liste */}
      {loading ? (
        <div className="flex justify-center items-center py-12 bg-white rounded-xl border border-[#E5E4DF]">
          <Loader2 className="w-8 h-8 animate-spin text-[#191919]" />
        </div>
      ) : (
        <div className="space-y-3">
          {remoteOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-8">
              <p className="text-[#666663] text-center text-sm">Aucune commande trouvée pour ces critères</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {remoteOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    products={products}
                    suppliers={suppliers}
                    warehouses={warehouses}
                    expandedOrders={expandedOrders}
                    toggleOrderDetails={toggleOrderDetails}
                    showStatus={true}
                    showActions={false}
                    compactMode={false}
                  />
                ))}
              </div>

              {/* Contrôles de pagination */}
              {meta.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </Button>
                  <span className="text-sm text-[#666663] font-medium">
                    Page {page} sur {meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};
