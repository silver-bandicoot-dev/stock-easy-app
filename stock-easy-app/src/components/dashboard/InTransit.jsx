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
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
      {/* Header amélioré */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 border-b border-[#E5E4DF] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <Truck className="w-6 h-6 text-white shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#191919]">En transit</h2>
                <InfoTooltip content={tooltips.inTransit} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-purple-600">{inTransitOrders.length}</span>
                <span className="text-sm text-[#666663]">commande(s) en cours de livraison</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {inTransitOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-[#666663] font-medium">Aucune commande en transit</p>
              <p className="text-xs text-[#666663] mt-1">Toutes vos commandes sont livrées ou en attente</p>
            </div>
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="group relative bg-gradient-to-r from-purple-50/50 to-transparent rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-purple-100 hover:border-purple-300"
              >
                {badgeText && (
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>
                )}
                
                <div className="flex items-start justify-between gap-4 pr-16">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#191919] text-sm mb-2">{order.id}</h3>
                    <div className="flex items-center gap-2 text-xs text-[#666663] mb-3">
                      <Calendar className="w-3 h-3" />
                      <span>Expédié le {formatConfirmedDate(order.shippedAt)}</span>
                    </div>
                    <p className="text-xs text-[#666663]">
                      {order.items?.length || 0} produit(s) • {order.supplier || 'Fournisseur inconnu'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${etaColorClass}`}>{etaLabel}</p>
                      <p className="text-[10px] text-[#666663] uppercase font-medium mt-1">Livraison</p>
                    </div>
                  </div>
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
              className="w-full px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-semibold hover:bg-purple-50 rounded-lg transition-colors">
              Voir tous les détails →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
