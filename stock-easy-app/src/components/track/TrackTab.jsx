import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Clock, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { TrackSection } from './TrackSection';
import { TRACK_TABS } from '../../constants/stockEasyConstants';

export const TrackTab = ({
  trackTabSection,
  setTrackTabSection,
  orders,
  suppliers,
  expandedOrders,
  toggleOrderDetails,
  confirmOrder,
  shipOrder,
  receiveOrder,
  // Nouveaux props pour les modals
  reconciliationModal,
  reconciliationModalHandlers,
  reclamationEmailModal,
  reclamationEmailModalHandlers,
  reconciliationLogic,
  emailGeneration
}) => {
  const trackSections = [
    {
      key: TRACK_TABS.EN_COURS_COMMANDE,
      title: 'En Cours de Commande',
      icon: Clock,
      shortTitle: 'En Cours'
    },
    {
      key: TRACK_TABS.PREPARATION,
      title: 'En cours de préparation',
      icon: Package,
      shortTitle: 'Préparation'
    },
    {
      key: TRACK_TABS.EN_TRANSIT,
      title: 'En Transit',
      icon: Truck,
      shortTitle: 'En Transit'
    },
    {
      key: TRACK_TABS.COMMANDES_RECUES,
      title: 'Commandes Reçues',
      icon: CheckCircle,
      shortTitle: 'Reçues'
    },
    {
      key: TRACK_TABS.RECONCILIATION,
      title: 'Réconciliation',
      icon: AlertTriangle,
      shortTitle: 'Réconciliation'
    }
  ];

  // Handler pour démarrer la réconciliation
  const handleStartReconciliation = (order) => {
    reconciliationModalHandlers.open(order);
  };

  // Handler pour confirmer la réconciliation
  const handleReconciliationConfirm = async (reconciliationData) => {
    try {
      const result = await reconciliationLogic.processReconciliation(
        reconciliationModal.data.order,
        reconciliationData
      );

      if (result.success) {
        reconciliationModalHandlers.close();
        
        if (result.requiresReclamation) {
          // Générer l'email de réclamation
          const emailContent = emailGeneration.generateReclamationEmail(
            reconciliationModal.data.order,
            reconciliationData.discrepancies,
            reconciliationData.damages,
            'L\'équipe StockEasy'
          );
          
          if (emailContent) {
            reclamationEmailModalHandlers.open(reconciliationModal.data.order, emailContent);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la réconciliation:', error);
    }
  };

  return (
    <motion.div
      key="track"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header avec titre et sous-titre */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3 mb-2">
          <Truck className="w-8 h-8 text-[#191919]" />
          <h1 className="text-2xl font-bold text-[#191919]">Track & Manage</h1>
        </div>
        <p className="text-[#666663] ml-11">Suivez vos commandes et gérez les réceptions</p>
        
        {/* Onglets de navigation - Optimisés mobile */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
          {trackSections.map(section => (
            <button
              key={section.key}
              onClick={() => setTrackTabSection(section.key)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                trackTabSection === section.key
                  ? 'bg-black text-white'
                  : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
              }`}
            >
              <span className="hidden sm:inline">{section.title}</span>
              <span className="sm:hidden">{section.shortTitle}</span>
              <span className="ml-1">
                ({orders.filter(o => {
                  switch (section.key) {
                    case TRACK_TABS.EN_COURS_COMMANDE: return o.status === 'pending_confirmation';
                    case TRACK_TABS.PREPARATION: return o.status === 'preparing';
                    case TRACK_TABS.EN_TRANSIT: return o.status === 'in_transit';
                    case TRACK_TABS.COMMANDES_RECUES: return o.status === 'received';
                    case TRACK_TABS.RECONCILIATION: return o.status === 'reconciliation';
                    default: return false;
                  }
                }).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenu de chaque section */}
      <AnimatePresence mode="wait">
        {trackSections.map(section => (
          trackTabSection === section.key && (
            <TrackSection
              key={section.key}
              sectionKey={section.key}
              title={section.title}
              icon={section.icon}
              orders={orders}
              suppliers={suppliers}
              expandedOrders={expandedOrders}
              toggleOrderDetails={toggleOrderDetails}
              confirmOrder={confirmOrder}
              shipOrder={shipOrder}
              receiveOrder={receiveOrder}
              onStartReconciliation={handleStartReconciliation}
            />
          )
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
