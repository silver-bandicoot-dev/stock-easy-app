import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Calendar } from 'lucide-react';
import { InfoTooltip, tooltips } from '../ui/InfoTooltip';
import { formatConfirmedDate, calculateDaysRemaining, calculateETA, formatETA } from '../../utils/dateUtils';

export const InTransit = ({ orders, suppliers = {}, setActiveTab, setTrackTabSection }) => {
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
          <div className="flex items-center gap-1">
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
          inTransitOrders.map((order, index) => {
            const leadTime = order.leadTimeDays ?? order.leadTime ?? null;
            const leadTimeNumeric =
              leadTime === null || leadTime === undefined ? null : Number(leadTime);
            const hasLeadTime = leadTimeNumeric !== null && !Number.isNaN(leadTimeNumeric);

            const baseDate = order.confirmedAt || order.shippedAt || order.createdAt;
            const resolvedETA =
              order.eta ||
              calculateETA(baseDate, hasLeadTime ? leadTimeNumeric : null, suppliers, order.supplier);

            const etaInfo = formatETA(resolvedETA, true);
            const daysRemaining = hasLeadTime
              ? calculateDaysRemaining(order.shippedAt, leadTimeNumeric)
              : null;

            let etaColorClass = 'text-[#666663]';
            let etaLabel = 'Indisponible';
            let badgeText = null;
            let badgeClass = 'bg-blue-50 text-blue-700';

            if (etaInfo) {
              etaLabel = etaInfo.formatted;
              if (etaInfo.daysRemaining !== null) {
                if (etaInfo.isPast) {
                  badgeText = `Retard de ${Math.abs(etaInfo.daysRemaining)} jour${Math.abs(etaInfo.daysRemaining) > 1 ? 's' : ''}`;
                  badgeClass = 'bg-red-100 text-red-700';
                } else if (etaInfo.daysRemaining === 0) {
                  badgeText = 'Aujourd\'hui';
                  badgeClass = 'bg-blue-50 text-blue-700';
                } else if (etaInfo.daysRemaining === 1) {
                  badgeText = 'Demain';
                  badgeClass = 'bg-blue-50 text-blue-700';
                } else if (etaInfo.daysRemaining > 1) {
                  badgeText = `Dans ${etaInfo.daysRemaining} jours`;
                  badgeClass = 'bg-blue-50 text-blue-700';
                }
              }
            } else if (resolvedETA) {
              const formattedFallback = formatETA(resolvedETA, false);
              etaLabel = formattedFallback?.formatted || resolvedETA;
            } else if (hasLeadTime && daysRemaining !== null && daysRemaining !== undefined) {
              if (daysRemaining === 0) {
                etaLabel = 'Aujourd\'hui';
                badgeText = 'Livraison imminente';
                badgeClass = 'bg-blue-50 text-blue-700';
              } else if (daysRemaining === 1) {
                etaLabel = 'Demain';
                badgeText = 'Dans 1 jour';
                badgeClass = 'bg-blue-50 text-blue-700';
              } else {
                etaLabel = `Dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`;
                badgeText = `ETA calculée (${daysRemaining}j)`;
                badgeClass = 'bg-blue-50 text-blue-700';
              }
            }

            if (etaLabel !== 'Indisponible') {
              etaColorClass = 'text-[#191919]';
            }

            return (
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
                  <div className="flex items-center justify-end gap-1 text-xs text-[#666663]">
                    <Calendar className="w-3 h-3" />
                    <span>Livraison estimée :</span>
                  </div>
                  <p className={`text-sm ${etaColorClass}`}>{etaLabel}</p>
                  {badgeText && (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
                      {badgeText}
                    </span>
                  )}
                  <p className="text-xs text-[#666663] mt-1">{order.items?.length || 0} produits</p>
                </div>
              </motion.div>
            );
          })
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
