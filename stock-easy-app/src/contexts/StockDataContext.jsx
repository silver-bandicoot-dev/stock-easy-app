import React, { createContext, useContext, useMemo, useEffect, useRef, useState } from 'react';
import { useStockData } from '../hooks/useStockData';
import { useOrderManagement } from '../hooks/useOrderManagement';
import { useSupplierManagement } from '../hooks/useSupplierManagement';
import { useSupplierMapping } from '../hooks/useSupplierMapping';
import { useWarehouseActions } from '../hooks/useWarehouseActions';
import { useParameterEditing } from '../hooks/useParameterEditing';
import { useParameterState } from '../hooks/useParameterState';
import { useReconciliation } from '../hooks/useReconciliation';
import { useEmailGeneration } from '../hooks/useEmailGeneration';
import { useShipOrderModal } from '../hooks/useShipOrderModal';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useProductStatus } from '../hooks/useProductStatus';
import { useAutoNotifications } from '../hooks/useAutoNotifications';
import { useMLWeeklyNotifications } from '../hooks/useMLWeeklyNotifications';
import { useSupabaseSync } from '../hooks/useSupabaseSync';
import { useModalContext } from './ModalContext';
import { useAuth } from './SupabaseAuthContext';
import * as OrderHandlers from '../handlers/orderHandlers';
import * as ReconciliationHandlers from '../handlers/reconciliationHandlers';
import * as EmailUtils from '../utils/emailUtils';
import { calculateMetrics } from '../utils/calculations';
import { checkAndSaveKPISnapshot } from '../utils/kpiScheduler';
import { getCurrentUserProfile } from '../services/companyService';
import api from '../services/apiAdapter';

const StockDataContext = createContext(null);

export const StockDataProvider = ({ children }) => {
  // 0. Contextes externes (Auth & Modals)
  const modalContext = useModalContext();
  const { 
    reconciliationModal, 
    reconciliationModalHandlers,
    reclamationEmailModalHandlers,
    inlineModals
  } = modalContext;

  const { currentUser } = useAuth();
  
  // Profil complet de l'utilisateur (prénom, nom, société)
  const [userProfile, setUserProfile] = useState(null);
  
  // Charger le profil complet quand l'utilisateur est connecté
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser?.id) {
        setUserProfile(null);
        return;
      }
      
      try {
        const { data, error } = await getCurrentUserProfile();
        if (!error && data) {
          setUserProfile(data);
        }
      } catch (err) {
        console.warn('⚠️ Impossible de charger le profil utilisateur:', err);
      }
    };
    
    loadUserProfile();
  }, [currentUser?.id]);
  
  // Génère la signature de l'utilisateur avec prénom, nom et société
  const getUserSignature = () => {
    // Priorité au profil complet
    if (userProfile) {
      const firstName = userProfile.first_name || '';
      const lastName = userProfile.last_name || '';
      const companyName = userProfile.company?.name || '';
      
      if (firstName || lastName) {
        const fullName = `${firstName} ${lastName}`.trim();
        return companyName ? `${fullName}\n${companyName}` : fullName;
      }
    }
    
    // Fallback sur currentUser
    if (currentUser) {
      if (currentUser.firstName && currentUser.lastName) {
        return `${currentUser.firstName} ${currentUser.lastName}`;
      }
      if (currentUser.displayName) {
        return currentUser.displayName;
      }
      if (currentUser.email) {
        return currentUser.email.split('@')[0];
      }
    }
    
    // Dernier recours - ne JAMAIS retourner "L'équipe Stockeasy"
    return '';
  };

  // 1. UI & Navigation (basée sur l'URL)
  const tabManagement = useAppNavigation();
  const { setActiveTab } = tabManagement;

  // 2. Chargement des données
  const stockData = useStockData();
  const { 
    products, 
    orders, 
    suppliers, 
    warehouses,
    parameters, 
    loadData, 
    setParameters 
  } = stockData;

  // 3. Synchro Temps Réel
  useSupabaseSync(() => {
    console.log('🔄 Real-time: Changement détecté, rechargement des données...');
    loadData();
  }, true);

  // 4. Gestion des Paramètres
  const parameterState = useParameterState(parameters);
  const {
    setSeuilSurstockProfond,
    setDeviseDefaut,
    setMultiplicateurDefaut
  } = parameterState;

  const parameterEditing = useParameterEditing(api, loadData, setParameters, {
    setSeuilSurstockProfond,
    setDeviseDefaut,
    setMultiplicateurDefaut
  });

  // 5. Logique Métier (Calculs & Statuts)
  const enrichedProducts = useMemo(() => {
    if (!products) return [];
    return products.map(p => calculateMetrics(p, parameterState.seuilSurstockProfond));
  }, [products, parameterState.seuilSurstockProfond]);

  const productStatus = useProductStatus(enrichedProducts, orders);
  const { productsByStatus, toOrderBySupplier, notifications } = productStatus;

  // 5b. Sauvegarde automatique des snapshots KPI (une fois par jour)
  // Permet d'avoir de vraies données historiques pour les graphiques d'évolution
  const kpiSnapshotSaveAttempted = useRef(false);
  
  useEffect(() => {
    // Ne sauvegarder qu'une fois par session et seulement si on a des données
    if (kpiSnapshotSaveAttempted.current) return;
    if (!enrichedProducts || enrichedProducts.length === 0) return;
    if (!currentUser?.uid) return;
    
    const companyId = currentUser.company_id || currentUser.user_metadata?.company_id;
    
    // Marquer comme tenté pour éviter les appels multiples
    kpiSnapshotSaveAttempted.current = true;
    
    // Sauvegarder le snapshot KPI de manière asynchrone
    checkAndSaveKPISnapshot(
      companyId, 
      enrichedProducts, 
      orders || [], 
      parameterState.seuilSurstockProfond
    ).then(result => {
      if (result?.success) {
        console.log('📊 Snapshot KPI du jour sauvegardé avec succès');
      }
    }).catch(error => {
      // Ne pas bloquer l'app si la sauvegarde échoue
      console.warn('⚠️ Impossible de sauvegarder le snapshot KPI:', error.message);
    });
  }, [enrichedProducts, orders, currentUser, parameterState.seuilSurstockProfond]);

  // 6. Notifications Automatiques
  // Notifications automatiques désactivées (gérées uniquement pour mentions et ML)
  useAutoNotifications(
    { products, orders, suppliers },
    {
      enabled: false, // Désactivé complètement selon configuration originale
      stockCheckInterval: 60 * 60 * 1000,
      unmappedCheckInterval: 6 * 60 * 60 * 1000,
      weeklyReportDay: 1,
      weeklyReportHour: 9,
      orderDelayedInterval: 12 * 60 * 60 * 1000,
      orderDiscrepancyInterval: 6 * 60 * 60 * 1000,
      surstockCheckHour: 8,
      supplierInfoInterval: 12 * 60 * 60 * 1000,
      surstockThresholdDays: parameterState.seuilSurstockProfond || 90
    }
  );

  // Notifications ML hebdomadaires et critiques
  useMLWeeklyNotifications(products, {}, {
    enabled: true,
    weeklyDay: 1, // Lundi
    weeklyHour: 9, // 9h du matin
    criticalCheckInterval: 24 * 60 * 60 * 1000 // Vérifier les alertes critiques toutes les 24h
  });


  // 7. Gestion des Commandes et Fournisseurs
  const orderManagement = useOrderManagement(loadData);
  const supplierManagement = useSupplierManagement(suppliers, loadData);
  const supplierMapping = useSupplierMapping(products, loadData);
  const warehouseActions = useWarehouseActions(api, loadData);
  
  // 8. Utilitaires et Hooks Spéciaux
  const reconciliationLogic = useReconciliation(loadData);
  const emailGeneration = useEmailGeneration();
  const shipOrderModal = useShipOrderModal();

  // 9. Handlers Composés
  
  const handleShipOrder = (orderId) => {
    return OrderHandlers.handleShipOrder(shipOrderModal, orderId);
  };

  const handleConfirmShipOrder = async (trackingNumber, trackingUrl) => {
    return await OrderHandlers.handleConfirmShipOrder(
      orderManagement.shipOrder,
      shipOrderModal,
      trackingNumber,
      trackingUrl,
      suppliers,
      orders
    );
  };

  const handleReconciliationConfirm = async (reconciliationData) => {
    return await ReconciliationHandlers.handleReconciliationConfirm(
      reconciliationData,
      reconciliationModal,
      api,
      loadData,
      reconciliationModalHandlers,
      reclamationEmailModalHandlers,
      emailGeneration,
      getUserSignature,
      products
    );
  };

    // Valeur exposée
    const value = useMemo(() => ({
      // Données brutes & Enrichies
      ...stockData,
      enrichedProducts,
      productsByStatus,
      toOrderBySupplier,
      notifications,
      
      // Utilisateur
      currentUser,
    getUserSignature,

    // Contextes logiques
    tabManagement,
    parameterState,
    parameterEditing,
    orderManagement,
    supplierManagement,
    supplierMapping,
    warehouseActions,
    reconciliationLogic,
    emailGeneration,
    shipOrderModal,
    
    // Handlers pré-câblés
    handlers: {
      handleShipOrder,
      handleConfirmShipOrder,
      handleReconciliationConfirm
    },

    // Raccourcis utiles
    refreshData: loadData,
    api
  }), [
    stockData, 
    enrichedProducts,
    productsByStatus,
    toOrderBySupplier,
    notifications,
    currentUser,
    tabManagement,
    parameterState, 
    parameterEditing, 
    orderManagement, 
    supplierManagement, 
    supplierMapping, 
    warehouseActions,
    reconciliationLogic,
    emailGeneration,
    shipOrderModal,
    reconciliationModal,
    reconciliationModalHandlers,
    reclamationEmailModalHandlers,
    products
  ]);

  return (
    <StockDataContext.Provider value={value}>
      {children}
    </StockDataContext.Provider>
  );
};

export const useStockContext = () => {
  const context = useContext(StockDataContext);
  if (!context) {
    throw new Error('useStockContext must be used within a StockDataProvider');
  }
  return context;
};
