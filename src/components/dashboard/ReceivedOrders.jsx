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
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center border border-green-200 shrink-0">
          <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h2 className="text-lg font-bold text-[#191919]">Commandes reçues</h2>
            <InfoTooltip content={tooltips.received} />
          </div>
          <p className="text-sm text-[#666663]">{receivedOrders.length} commande(s)</p>
        </div>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {receivedOrders.length === 0 ? (
          <p className="text-[#666663] text-center py-8 text-sm">Aucune commande reçue</p>
        ) : (
          receivedOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              className="flex justify-between items-center p-3 bg-[#FAFAF7] rounded-lg hover:bg-[#F0F0EB] transition-colors border border-[#E5E4DF]">
              <div className="min-w-0">
                <p className="font-medium text-[#191919] text-sm truncate">{order.id}</p>
                <p className="text-xs text-[#666663] truncate">
                  {formatConfirmedDate(order.receivedAt)}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="font-bold text-green-600 text-sm">
                  {order.items?.length || 0} produits
                </p>
                <p className="text-xs text-[#666663]">
                  {order.needsReconciliation ? 'À réconcilier' : 'Complète'}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
      {receivedOrders.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#E5E4DF]">
          <button
            onClick={handleViewDetails}
            className="w-full text-sm text-green-600 hover:text-green-700 font-medium">
            Voir tous les détails →
          </button>
        </div>
      )}
    </div>
  );
};




