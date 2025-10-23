import React from 'react';
import { motion } from 'framer-motion';
import { History, Download, Filter, Calendar, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../shared/Button';
import { toast } from 'sonner';

export const HistoryTab = ({
  orders,
  products,
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
      case 'received': return 'Reçue';
      case 'completed': return 'Complétée';
      case 'reconciliation': return 'À réconcilier';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const roundToTwoDecimals = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  // Fonction pour exporter l'historique en CSV (version complète)
  const exportHistoryToCSV = () => {
    // Générer le CSV avec détail des produits
    const headers = ['N° Commande', 'Fournisseur', 'Date Création', 'Date Confirmation', 'Date Expédition', 'Date Réception', 'Statut', 'SKU', 'Nom Produit', 'Quantité', 'Prix Unitaire (€)', 'Total Ligne (€)', 'Total Commande (€)', 'Suivi'];
    const rows = [];
    
    filteredOrders.forEach(order => {
      // Pour chaque commande, créer une ligne par produit
      order.items?.forEach((item, index) => {
        const product = products.find(p => p.sku === item.sku);
        const lineTotal = roundToTwoDecimals(item.quantity * item.pricePerUnit);
        
        rows.push([
          order.id,
          order.supplier,
          formatDate(order.createdAt),
          formatDate(order.confirmedAt) || '-',
          formatDate(order.shippedAt) || '-',
          formatDate(order.receivedAt) || '-',
          getStatusLabel(order.status),
          item.sku,
          product?.name || item.sku,
          item.quantity,
          roundToTwoDecimals(item.pricePerUnit).toFixed(2),
          lineTotal.toFixed(2),
          // Afficher le total de la commande seulement sur la première ligne de chaque commande
          index === 0 ? roundToTwoDecimals(order.total).toFixed(2) : '',
          index === 0 ? (order.trackingNumber || '-') : ''
        ]);
      });
    });

    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Créer le fichier et le télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `historique-commandes-detaille-${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const totalItems = rows.length;
    toast.success(`Export CSV réussi : ${filteredOrders.length} commande(s), ${totalItems} ligne(s) de produits exportée(s)`);
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
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-200 shrink-0">
              <History className="w-6 h-6 text-orange-600 shrink-0" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Historique des Commandes</h2>
              <p className="text-sm text-gray-600">Consultez toutes vos commandes passées et leur statut</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={exportHistoryToCSV}
          >
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200 shrink-0">
            <Filter className="w-6 h-6 text-blue-600 shrink-0" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
            <p className="text-sm text-gray-600">Filtrez l'historique selon vos critères</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtre par statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending_confirmation">En attente</option>
              <option value="preparing">En traitement</option>
              <option value="in_transit">En transit</option>
              <option value="received">Reçues</option>
              <option value="completed">Complétées</option>
              <option value="reconciliation">À réconcilier</option>
            </select>
          </div>

          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={historyDateStart}
              onChange={(e) => setHistoryDateStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={historyDateEnd}
              onChange={(e) => setHistoryDateEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center border border-green-200 shrink-0">
            <Calendar className="w-6 h-6 text-green-600 shrink-0" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Commandes ({filteredOrders.length})
            </h3>
            <p className="text-sm text-gray-600">Historique filtré des commandes</p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
            <p className="text-gray-600">Ajustez vos filtres pour voir plus de résultats</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-900">
                      #{order.poNumber || order.id}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </div>
                    {order.supplier && (
                      <div className="text-sm text-gray-600">
                        {order.supplier}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900">
                      {order.total ? `${order.total.toFixed(2)}€` : 'N/A'}
                    </div>
                    <button
                      onClick={() => toggleOrderDetails(order.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedOrders[order.id] ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Détails de la commande */}
                {expandedOrders[order.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Informations</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Créée le: {formatDate(order.createdAt)}</div>
                          {order.confirmedAt && <div>Confirmée le: {formatDate(order.confirmedAt)}</div>}
                          {order.shippedAt && <div>Expédiée le: {formatDate(order.shippedAt)}</div>}
                          {order.receivedAt && <div>Reçue le: {formatDate(order.receivedAt)}</div>}
                          {order.trackingNumber && <div>Suivi: {order.trackingNumber}</div>}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Produits</h4>
                        <div className="space-y-1">
                          {order.items?.map((item, index) => {
                            const product = products.find(p => p.sku === item.sku);
                            return (
                              <div key={index} className="text-sm text-gray-600">
                                {product?.name || item.sku} - {item.quantity} unités
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
