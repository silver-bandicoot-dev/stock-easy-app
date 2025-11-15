import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Clock, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { TrackSection } from './TrackSection';
import { TRACK_TABS } from '../../constants/stockEasyConstants';
import api from '../../services/apiAdapter';
import { toast } from 'sonner';

export const TrackTab = ({
  trackTabSection,
  setTrackTabSection,
  orders,
  suppliers,
  products,
  warehouses = {},
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
  emailGeneration,
  loadData
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

  // Handler pour confirmer la réconciliation - Utilise la logique originale qui fonctionnait
  const handleReconciliationConfirm = async (reconciliationData) => {
    try {
      const order = reconciliationModal.data.order;
      
      // Analyser les données pour déterminer s'il y a des écarts ou dommages
      console.log('🔍 DONNÉES REÇUES:', reconciliationData);
      const hasDiscrepancies = Object.values(reconciliationData.discrepancies || {}).some(d => d !== 0);
      const hasDamages = Object.values(reconciliationData.damages || {}).some(d => d > 0);
      console.log('🔍 ANALYSE:', { hasDiscrepancies, hasDamages, discrepancies: reconciliationData.discrepancies, damages: reconciliationData.damages });
      
      if (hasDiscrepancies || hasDamages) {
        console.log('✅ ENTRÉE DANS LE IF - Il y a des écarts/dommages');
        // Calculer les quantités manquantes et endommagées par SKU
        const missingQuantitiesBySku = {};
        const damagedQuantitiesBySku = {};
        
        // Le modal envoie receivedItems = quantités SAINES reçues, damages = quantités endommagées
        // Construire les items avec toutes les données de réconciliation
        const updatedItems = order.items.map(item => {
          const ordered = item.quantity || 0;
          const receivedSaine = parseInt(reconciliationData.receivedItems?.[item.sku]?.received || reconciliationData.receivedItems?.[item.sku] || 0, 10);
          const damaged = parseInt(reconciliationData.damages?.[item.sku] || 0, 10);
          
          // Missing = Commandé - (Reçu sain + Endommagé)
          const missing = ordered - receivedSaine - damaged;
          const totalReceived = receivedSaine + damaged;
          
          // Déterminer le type de problème
          let discrepancyType = 'none';
          if (missing > 0 && damaged > 0) {
            discrepancyType = 'missing_and_damaged';
          } else if (missing > 0) {
            discrepancyType = 'missing';
          } else if (damaged > 0) {
            discrepancyType = 'damaged';
          }
          
          console.log(`📦 ${item.sku}: commandé=${ordered}, reçu sain=${receivedSaine}, endommagé=${damaged}, manquant=${missing}`);
          
          if (missing > 0) {
            missingQuantitiesBySku[item.sku] = missing;
          }
          if (damaged > 0) {
            damagedQuantitiesBySku[item.sku] = damaged;
          }
          
          return {
            sku: item.sku,
            quantity: ordered,
            pricePerUnit: item.pricePerUnit,
            receivedQuantity: receivedSaine,
            damagedQuantity: damaged,
            discrepancyType: discrepancyType,
            discrepancyQuantity: missing,
            discrepancyNotes: reconciliationData.notes || null
          };
        });
        
        console.log('📦 Résumé réconciliation:', { missingQuantitiesBySku, damagedQuantitiesBySku });
        console.log('📦 Items mis à jour:', updatedItems);
        
        // Il y a des écarts ou dommages - passer au statut 'reconciliation'
        await api.updateOrderStatus(order.id, {
          status: 'reconciliation',
          receivedAt: new Date().toISOString().split('T')[0],
          hasDiscrepancy: hasDiscrepancies,
          damageReport: hasDamages,
          missingQuantitiesBySku: missingQuantitiesBySku,
          damagedQuantitiesBySku: damagedQuantitiesBySku,
          items: updatedItems
        });
        
        // Mettre à jour le stock avec les quantités reçues
        const stockUpdates = Object.entries(reconciliationData.receivedItems || {}).map(([sku, data]) => {
          const quantityReceived = parseInt(data.received || data, 10) || 0;
          return {
            sku,
            quantityToAdd: quantityReceived
          };
        });
        
        await api.updateStock(stockUpdates);
        
        reconciliationModalHandlers.close();
        
        // Générer l'email de réclamation si nécessaire
        const emailContent = emailGeneration.generateReclamationEmail(
          order,
          reconciliationData.receivedItems,
          reconciliationData.damages,
          reconciliationData.notes || 'L\'équipe StockEasy',
          products
        );
        
        if (emailContent) {
          reclamationEmailModalHandlers.open(order, emailContent);
        }
        
        toast.success('Commande mise en réconciliation avec réclamation générée');
      } else {
        // Pas d'écarts - marquer comme complétée
        // Construire les items avec les quantités reçues (sans écarts)
        const completedItems = order.items.map(item => {
          const receivedSaine = parseInt(reconciliationData.receivedItems?.[item.sku]?.received || reconciliationData.receivedItems?.[item.sku] || item.quantity || 0, 10);
          
          return {
            sku: item.sku,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            receivedQuantity: receivedSaine,
            damagedQuantity: 0,
            discrepancyType: 'none',
            discrepancyQuantity: 0,
            discrepancyNotes: null
          };
        });
        
        await api.updateOrderStatus(order.id, {
          status: 'completed',
          receivedAt: new Date().toISOString().split('T')[0],
          completedAt: new Date().toISOString().split('T')[0],
          hasDiscrepancy: false,
          damageReport: false,
          items: completedItems
        });
        
        // Mettre à jour le stock
        const stockUpdates = Object.entries(reconciliationData.receivedItems || {}).map(([sku, data]) => {
          const quantityReceived = parseInt(data.received || data, 10) || 0;
          return {
            sku,
            quantityToAdd: quantityReceived
          };
        });
        
        await api.updateStock(stockUpdates);
        
        reconciliationModalHandlers.close();
        toast.success('Réconciliation validée - Commande complétée');
      }
      
      // Recharger les données
      if (typeof loadData === 'function') {
        await loadData();
      }
      
    } catch (error) {
      console.error('Erreur lors de la réconciliation:', error);
      toast.error('Erreur lors de la réconciliation');
    }
  };

  // Handler pour confirmer qu'une commande en réconciliation est terminée
  const handleConfirmReconciliation = async (orderId) => {
    try {
      // Appeler la fonction RPC pour confirmer la réconciliation
      const result = await api.confirmOrderReconciliation(orderId);
      
      if (result.success) {
        toast.success('Réconciliation confirmée! La commande a été archivée.');
        
        // Recharger les données
        if (typeof loadData === 'function') {
          await loadData();
        }
      } else {
        toast.error(result.error || 'Erreur lors de la confirmation de la réconciliation');
      }
    } catch (error) {
      console.error('Erreur lors de la confirmation de la réconciliation:', error);
      toast.error('Erreur lors de la confirmation de la réconciliation');
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
        <p className="text-xs sm:text-sm text-[#666663]">
          Suivez vos commandes et gérez les réceptions
        </p>
        
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
              products={products}
              warehouses={warehouses}
              expandedOrders={expandedOrders}
              toggleOrderDetails={toggleOrderDetails}
              confirmOrder={confirmOrder}
              shipOrder={shipOrder}
              receiveOrder={receiveOrder}
              onStartReconciliation={handleStartReconciliation}
              onConfirmReconciliation={handleConfirmReconciliation}
            />
          )
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
