import React from 'react';
import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { InfoTooltip } from '../ui/InfoTooltip';
import { formatConfirmedDate, calculateDaysRemaining } from '../../utils/dateUtils';

const tooltips = {
  inTransit: "Commandes en cours de livraison par les fournisseurs."
};

export const InTransit = ({ orders, setActiveTab, setTrackTabSection }) => {
  const inTransitOrders = orders.filter(order => order.status === 'in_transit');

  const handleViewDetails = () => {
    setActiveTab('track');
    setTrackTabSection('en_transit');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-200 shrink-0">
          <Truck className="w-6 h-6 text-purple-600 shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <h2 className="text-lg font-bold text-[#191919]">En transit</h2>
            <InfoTooltip content={tooltips.inTransit} />
          </div>
          <p className="text-sm text-[#666663]">{inTransitOrders.length} commande(s)</p>
        </div>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {inTransitOrders.length === 0 ? (
          <p className="text-[#666663] text-center py-8 text-sm">Aucune commande en transit</p>
        ) : (
          inTransitOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              className="flex justify-between items-center p-3 bg-[#FAFAF7] rounded-lg hover:bg-[#F0F0EB] transition-colors border border-[#E5E4DF]">
              <div className="min-w-0">
                <p className="font-medium text-[#191919] text-sm truncate">{order.id}</p>
                <p className="text-xs text-[#666663] truncate">
                  {formatConfirmedDate(order.shippedAt)}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="font-bold text-purple-600 text-sm">
                  {calculateDaysRemaining(order.shippedAt, order.leadTimeDays)} jours
                </p>
                <p className="text-xs text-[#666663]">{order.items?.length || 0} produits</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
      {inTransitOrders.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#E5E4DF]">
          <button
            onClick={handleViewDetails}
            className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium">
            Voir tous les détails →
          </button>
        </div>
      )}
    </div>
  );
};
