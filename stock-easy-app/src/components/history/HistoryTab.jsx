import React from 'react';
import { motion } from 'framer-motion';
import { History, Download, Filter, Calendar } from 'lucide-react';
import { Button } from '../shared/Button';

export const HistoryTab = ({
  orders,
  historyFilter,
  setHistoryFilter,
  historyDateStart,
  setHistoryDateStart,
  historyDateEnd,
  setHistoryDateEnd,
  onExportHistory
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
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
      case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'received': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmée';
      case 'shipped': return 'Expédiée';
      case 'received': return 'Reçue';
      case 'cancelled': return 'Annulée';
      default: return status;
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
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-200 shrink-0">
              <History className="w-6 h-6 text-orange-600 shrink-0" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Historique des Commandes</h2>
              <p className="text-sm text-gray-600">Consultez l'historique complet de vos commandes</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={onExportHistory}
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
              <option value="confirmed">Confirmées</option>
              <option value="shipped">Expédiées</option>
              <option value="received">Reçues</option>
              <option value="cancelled">Annulées</option>
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
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {order.total ? `${order.total.toFixed(2)}€` : 'N/A'}
                  </div>
                </div>
                
                {order.supplier && (
                  <div className="mt-2 text-sm text-gray-600">
                    Fournisseur: {order.supplier.name}
                  </div>
                )}
                
                {order.products && order.products.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {order.products.length} produit(s)
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
