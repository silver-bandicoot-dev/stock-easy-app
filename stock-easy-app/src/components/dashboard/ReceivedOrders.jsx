import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { InfoTooltip, tooltips } from '../ui/InfoTooltip';
import { formatConfirmedDate } from '../../utils/dateUtils';

export const ReceivedOrders = ({ orders, setActiveTab, setTrackTabSection }) => {
  const receivedOrders = orders.filter(order => order.status === 'received');

  const handleViewDetails = () => {
    setActiveTab('track');
    setTrackTabSection('commandes_recues');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
      {/* Header amélioré */}
      <div className="bg-gradient-to-r from-green-50 to-green-100/50 border-b border-[#E5E4DF] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
              <CheckCircle className="w-6 h-6 text-white shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#191919]">Commandes reçues</h2>
                <InfoTooltip content={tooltips.received} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-green-600">{receivedOrders.length}</span>
                <span className="text-sm text-[#666663]">commande(s) à valider</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {receivedOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-[#666663] font-medium">Aucune commande reçue</p>
              <p className="text-xs text-[#666663] mt-1">Toutes vos commandes sont validées</p>
            </div>
          ) : (
            receivedOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="group relative bg-gradient-to-r from-green-50/50 to-transparent rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-green-100 hover:border-green-300"
              >
                {order.needsReconciliation && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      À RÉCONCILIER
                    </div>
                  </div>
                )}
                
                <div className="flex items-start justify-between gap-4 pr-20">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#191919] text-sm mb-2">{order.id}</h3>
                    <div className="flex items-center gap-2 text-xs text-[#666663] mb-3">
                      <CheckCircle className="w-3 h-3" />
                      <span>Reçu le {formatConfirmedDate(order.receivedAt)}</span>
                    </div>
                    <p className="text-xs text-[#666663]">
                      {order.items?.length || 0} produit(s) • {order.supplier || 'Fournisseur inconnu'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {order.items?.length || 0}
                      </p>
                      <p className="text-[10px] text-[#666663] uppercase font-medium mt-1">Produits</p>
                    </div>
                    {!order.needsReconciliation && (
                      <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                        Complète
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        {receivedOrders.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#E5E4DF]">
            <button
              onClick={handleViewDetails}
              className="w-full px-4 py-2 text-sm text-green-600 hover:text-green-700 font-semibold hover:bg-green-50 rounded-lg transition-colors">
              Voir tous les détails →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
