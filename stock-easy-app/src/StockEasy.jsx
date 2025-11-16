import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Package, Bell, Mail, X, Check, Truck, Clock, AlertCircle, CheckCircle, Eye, Settings, Info, Edit2, Activity, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Upload, FileText, Calendar, RefreshCw, Plus, User, LogOut, Warehouse, Brain, AtSign, Compass, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/SupabaseAuthContext';
import NotificationBell from './components/notifications/NotificationBell';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash.debounce';
import api from './services/apiAdapter';
import { HealthBar } from './components/ui/HealthBar';
import { Modal } from './components/ui/Modal';
import { KPICard } from './components/features/KPICard';
import { SubTabsNavigation } from './components/features/SubTabsNavigation';
import { ProductSelectionTable } from './components/features/ProductSelectionTable';
import { StockHealthDashboard } from './components/features/StockHealthDashboard';
import { SupplierHealthSummary } from './components/features/SupplierHealthSummary';
import { DateRangePicker } from './components/features/DateRangePicker';
import { InsightAlert } from './components/features/InsightAlert';
import { ChartModal } from './components/features/ChartModal';
import { ComparisonSelector } from './components/features/ComparisonSelector';
import { AIMainDashboard } from './components/ml';
import { AssignSupplierModal } from './components/settings/AssignSupplierModal';
import { SupplierModal } from './components/settings/SupplierModal';
import { GestionFournisseurs } from './components/settings/GestionFournisseurs';
import { MappingSKUFournisseur } from './components/settings/MappingSKUFournisseur';
import { ParametresGeneraux } from './components/settings/ParametresGeneraux';
import { GestionWarehouses } from './components/settings/GestionWarehouses';
import CommentSection from './components/comments/CommentSection';
import { InlineModalsContainer } from './components/modals/InlineModalsContainer';

import Sidebar from './components/layout/Sidebar';
import { Logo } from './components/ui/Logo';
import { SearchBar, SearchModal } from './components/SearchBar';
import { useInlineModals } from './hooks/useInlineModals';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { checkAndSaveKPISnapshot } from './utils/kpiScheduler';
import { calculateMetrics } from './utils/calculations';
import { formatUnits, formatPrice, roundToTwoDecimals, roundToInteger } from './utils/decimalUtils';
import { formatCurrency } from './utils/formatting';
import { CurrencyProvider } from './contexts/CurrencyContext';

// ============================================
// IMPORTS DES CONSTANTES ET UTILITAIRES
// ============================================
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_LABELS_EMOJI,
  ORDER_STATUS_COLORS,
  DISCREPANCY_TYPES,
  MAIN_TABS,
  TRACK_TABS,
  STOCK_TABS,
  SETTINGS_TABS,
  ANALYTICS_TABS,
  AI_TABS,
  STOCK_FILTERS,
  CURRENCIES,
  DEFAULT_PARAMETERS,
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  SYNC_INTERVALS,
  DISPLAY_LIMITS
} from './constants/stockEasyConstants';

import {
  formatConfirmedDate,
  daysBetween,
  calculateDaysRemaining,
  isToday,
  formatDateForAPI
} from './utils/dateUtils';

// ============================================
// IMPORTS DES COMPOSANTS SHARED
// ============================================
import { Button } from './components/shared/Button';

// ============================================
// IMPORTS DES COMPOSANTS DASHBOARD
// ============================================
import { DashboardTab } from './components/dashboard/DashboardTab';
import { ActionsTab } from './components/actions/ActionsTab';
import { TrackTab } from './components/track/TrackTab';
import { StockTab } from './components/stock/StockTab';
import { AnalyticsTab } from './components/analytics/AnalyticsTab';
import { HistoryTab } from './components/history/HistoryTab';
import { SettingsTab } from './components/settings/SettingsTab';
import { AITab } from './components/ai/AITab';
import ProfilePage from './components/profile/ProfilePage';

// ============================================
// IMPORTS DES MODALS
// ============================================
import { ReconciliationModal } from './components/track/modals/ReconciliationModal';
import { ReclamationEmailModal } from './components/track/modals/ReclamationEmailModal';
import { ShipOrderModal } from './components/modals/ShipOrderModal';

// ============================================
// IMPORTS DES HOOKS PERSONNALISÉS
// ============================================
import { useStockData } from './hooks/useStockData';
import { useOrderManagement } from './hooks/useOrderManagement';
import { useSupplierManagement } from './hooks/useSupplierManagement';
import { useModals } from './hooks/useModals';
import { useReconciliation } from './hooks/useReconciliation';
import { useEmailGeneration } from './hooks/useEmailGeneration';
import { useShipOrderModal } from './hooks/useShipOrderModal';
import { useAutoNotifications } from './hooks/useAutoNotifications';
import { useMLWeeklyNotifications } from './hooks/useMLWeeklyNotifications';

// ============================================
// FONCTIONS API - Importées depuis apiAdapter
// ============================================
// L'objet 'api' est maintenant importé depuis './services/apiAdapter'
// Toutes les fonctions API sont centralisées dans ce service pour une meilleure maintenabilité

// ============================================
// FONCTIONS UTILITAIRES
// ============================================


// ============================================
// COMPOSANT PRINCIPAL
// ============================================
const StockEasy = () => {
  // Auth et Navigation
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  // Helper pour générer la signature de l'utilisateur dans les emails
  const getUserSignature = () => {
    if (currentUser && currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName} ${currentUser.lastName}`;
    } else if (currentUser && currentUser.displayName) {
      return currentUser.displayName;
    }
    return "L'équipe stockeasy";
  };

  // Note: roundToTwoDecimals est maintenant remplacé par roundToTwoDecimalsDecimals importé depuis utils/decimalUtils

  // Handler pour la déconnexion
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  // Hook pour les données
  const {
    loading,
    syncing,
    products,
    suppliers,
    warehouses,
    orders,
    parameters,
    setParameters,
    loadData,
    syncData
  } = useStockData();

  // Hook pour la synchronisation en temps réel
  useSupabaseSync(() => {
    console.log('🔄 Real-time: Changement détecté, rechargement des données...');
    loadData();
  }, true);

  // NOUVEAUX ÉTATS pour Paramètres Généraux (déclaré tôt car utilisé dans useAutoNotifications)
  const [seuilSurstockProfond, setSeuilSurstockProfond] = useState(90);
  const [deviseDefaut, setDeviseDefaut] = useState('EUR');
  const [multiplicateurDefaut, setMultiplicateurDefaut] = useState(1.2);

  // Hook pour les notifications automatiques - DÉSACTIVÉ
  // Les notifications automatiques sont désormais gérées uniquement pour :
  // 1. Les mentions (@user) dans les commentaires
  // 2. Les recommandations ML hebdomadaires et critiques
  useAutoNotifications(
    { products, orders, suppliers },
    {
      enabled: false, // Désactivé complètement
      stockCheckInterval: 60 * 60 * 1000,
      unmappedCheckInterval: 6 * 60 * 60 * 1000,
      weeklyReportDay: 1,
      weeklyReportHour: 9,
      orderDelayedInterval: 12 * 60 * 60 * 1000,
      orderDiscrepancyInterval: 6 * 60 * 60 * 1000,
      surstockCheckHour: 8,
      supplierInfoInterval: 12 * 60 * 60 * 1000,
      surstockThresholdDays: seuilSurstockProfond || 90
    }
  );

  // Hook pour les notifications ML hebdomadaires et critiques
  // TODO: Passer les vraies prévisions ML quand le modèle est actif
  useMLWeeklyNotifications(products, {}, {
    enabled: true,
    weeklyDay: 1, // Lundi
    weeklyHour: 9, // 9h du matin
    criticalCheckInterval: 24 * 60 * 60 * 1000 // Vérifier les alertes critiques toutes les 24h
  });
  
  // Hook pour la gestion des commandes
  const {
    orderQuantities,
    setOrderQuantities,
    selectedWarehouse,
    setSelectedWarehouse,
    updateOrderQuantity,
    generatePONumber,
    confirmOrder,
    shipOrder,
    receiveOrder
  } = useOrderManagement(loadData);
  
  // Hook pour la gestion des fournisseurs
  const {
    supplierModalOpen,
    setSupplierModalOpen,
    editingSupplier,
    setEditingSupplier,
    supplierFormData,
    setSupplierFormData,
    handleOpenSupplierModal,
    handleCloseSupplierModal,
    handleSupplierFormChange,
    handleSaveSupplier,
    handleDeleteSupplier
  } = useSupplierManagement(suppliers, loadData);

  // ============================================
  // NOUVEAUX HOOKS POUR LES MODALS ET FONCTIONNALITÉS
  // ============================================
  
  // Hook pour la gestion centralisée des modals
  const {
    emailModal,
    orderCreationModal,
    receivingModal,
    reconciliationModal,
    reclamationEmailModal,
    supplierModal,
    assignSupplierModal,
    warehouseModal,
    emailModalHandlers,
    orderCreationModalHandlers,
    receivingModalHandlers,
    reconciliationModalHandlers,
    reclamationEmailModalHandlers,
    supplierModalHandlers,
    assignSupplierModalHandlers,
    warehouseModalHandlers
  } = useModals();

  // Hook pour la logique de réconciliation
  const reconciliationLogic = useReconciliation(loadData);

  // Hook pour la génération d'emails
  const emailGeneration = useEmailGeneration();

  // Hook pour les modales inline
  const inlineModals = useInlineModals();

  // Hook pour la modale d'expédition
  const shipOrderModal = useShipOrderModal();

  // Handler pour ouvrir la modale d'expédition
  const handleShipOrder = (orderId) => {
    shipOrderModal.openModal(orderId);
  };

  // Handler pour confirmer l'expédition
  const handleConfirmShipOrder = async (trackingNumber, trackingUrl) => {
    try {
      await shipOrder(shipOrderModal.orderId, trackingNumber, trackingUrl, suppliers, orders);
      shipOrderModal.closeModal();
    } catch (error) {
      console.error('❌ Erreur lors de l\'expédition:', error);
    }
  };

  // États restants pour l'UI et la navigation
  const [activeTab, setActiveTab] = useState(MAIN_TABS.DASHBOARD);
  const [trackTabSection, setTrackTabSection] = useState(TRACK_TABS.EN_COURS_COMMANDE);

  // Gérer la redirection depuis /profile vers l'onglet profil
  useEffect(() => {
    if (location.state?.targetTab) {
      setActiveTab(location.state.targetTab);
      // Nettoyer l'état pour éviter de réactiver l'onglet à chaque re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [selectedProductsFromTable, setSelectedProductsFromTable] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [receivingProducts, setReceivingProducts] = useState([]);
  const [tempReceivedQty, setTempReceivedQty] = useState({});
  const [editingParam, setEditingParam] = useState(null);
  const [tempParamValue, setTempParamValue] = useState('');
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyDateStart, setHistoryDateStart] = useState('');
  
  // Stock Level filters
  const [stockLevelFilter, setStockLevelFilter] = useState(STOCK_FILTERS.ALL);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockLevelSupplierFilter, setStockLevelSupplierFilter] = useState('all');
  const [stockLevelSearch, setStockLevelSearch] = useState('');
  const [historyDateEnd, setHistoryDateEnd] = useState('');
  
  // NOUVEAUX ÉTATS pour les sous-onglets de Paramètres
  const [parametersSubTab, setParametersSubTab] = useState(SETTINGS_TABS.GENERAL);
  const [analyticsSubTab, setAnalyticsSubTab] = useState(ANALYTICS_TABS.KPIS);
  const [aiSubTab, setAiSubTab] = useState(AI_TABS.OVERVIEW);
  
  // NOUVEAUX ÉTATS pour CORRECTION 5 et 6
  const [discrepancyTypes, setDiscrepancyTypes] = useState({});
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [unsavedParameterChanges, setUnsavedParameterChanges] = useState({});
  const [isSavingParameters, setIsSavingParameters] = useState(false);
  
  // États pour le menu mobile et la recherche mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);


  // CORRECTION 3: Gestion de l'expansion des détails de commandes
  const [expandedOrders, setExpandedOrders] = useState({});

  // Fonction pour voir les détails d'un produit
  const onViewDetails = (product) => {
    console.log('Voir détails du produit:', product);
    // Rediriger vers l'onglet Actions (Recommandations de commande)
    setActiveTab(MAIN_TABS.ACTIONS);
  };

  // Fonction pour naviguer vers un onglet spécifique avec sous-onglet optionnel
  const onNavigateToTab = (tabName, subTabName = null) => {
    // Mapper les noms d'onglets aux constantes MAIN_TABS
    const tabMap = {
      'settings': MAIN_TABS.SETTINGS,
      'track': MAIN_TABS.TRACK,
      'actions': MAIN_TABS.ACTIONS,
      'stock': MAIN_TABS.STOCK,
      'analytics': MAIN_TABS.ANALYTICS
    };
    
    const mappedTab = tabMap[tabName] || tabName;
    setActiveTab(mappedTab);
    
    // Gérer les sous-onglets si nécessaire
    if (subTabName === 'mapping') {
      setParametersSubTab(SETTINGS_TABS.MAPPING);
    }
    // Autres sous-onglets peuvent être ajoutés ici
  };

  // Fonctions pour la gestion des entrepôts
  const handleOpenWarehouseModal = (warehouse = null) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setWarehouseFormData({
        name: warehouse.name || '',
        address: warehouse.address || '',
        city: warehouse.city || '',
        postalCode: warehouse.postalCode || '',
        country: warehouse.country || '',
        contactPerson: warehouse.contactPerson || '',
        phone: warehouse.phone || '',
        email: warehouse.email || ''
      });
    } else {
      setEditingWarehouse(null);
      setWarehouseFormData({
        name: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        contactPerson: '',
        phone: '',
        email: ''
      });
    }
    setWarehouseModalOpen(true);
  };

  const handleCloseWarehouseModal = () => {
    setWarehouseModalOpen(false);
    setEditingWarehouse(null);
    setWarehouseFormData({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      contactPerson: '',
      phone: '',
      email: ''
    });
  };

  const handleWarehouseFormChange = (field, value) => {
    setWarehouseFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveWarehouse = async (data) => {
    try {
      const formData = data || warehouseFormData;
      await api.createWarehouse(formData);
      toast.success('Entrepôt créé avec succès');
      loadData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'entrepôt:', error);
      toast.error('Erreur lors de la sauvegarde de l\'entrepôt');
      throw error;
    }
  };

  const updateParameterState = (key, value) => {
    setParameters(prev => {
      const current = prev && !Array.isArray(prev) ? prev : {};
      return {
        ...current,
        [key]: value
      };
    });
  };

  useEffect(() => {
    if (!parameters || Array.isArray(parameters)) {
      return;
    }

    const { seuilSurstockProfond: seuil, deviseDefaut: devise, multiplicateurDefaut: multiplicateur } = parameters;

    if (seuil !== undefined && seuil !== null) {
      const parsedSeuil = Number(seuil);
      if (!Number.isNaN(parsedSeuil) && parsedSeuil !== seuilSurstockProfond) {
        setSeuilSurstockProfond(parsedSeuil);
      }
    }

    if (devise && devise !== deviseDefaut) {
      setDeviseDefaut(devise);
    }

    if (multiplicateur !== undefined && multiplicateur !== null) {
      const parsedMultiplicateur = Number(multiplicateur);
      if (!Number.isNaN(parsedMultiplicateur) && Math.abs(parsedMultiplicateur - multiplicateurDefaut) > 0.0001) {
        setMultiplicateurDefaut(parsedMultiplicateur);
      }
    }
  }, [parameters, deviseDefaut, multiplicateurDefaut, seuilSurstockProfond]);

  // NOUVEAUX ÉTATS pour Gestion des Entrepôts
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [warehouseFormData, setWarehouseFormData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    contactPerson: '',
    phone: '',
    email: ''
  });

  // NOUVEAUX ÉTATS pour Mapping
  const [assignSupplierModalOpen, setAssignSupplierModalOpen] = useState(false);
  const [isSavingSupplierMapping, setIsSavingSupplierMapping] = useState(false);
  const [productToMap, setProductToMap] = useState(null);
  const [selectedSupplierForMapping, setSelectedSupplierForMapping] = useState('');
  const [selectedProductForMapping, setSelectedProductForMapping] = useState(null);

  // ============================================
  // HANDLERS PARAMÈTRES GÉNÉRAUX
  // ============================================

  const handleUpdateSeuilSurstock = async (newValue) => {
    try {
      const result = await api.updateParameter('SeuilSurstockProfond', newValue);
      if (!result?.success) {
        throw new Error(result?.error || 'Échec de la mise à jour du seuil de surstock');
      }
      setSeuilSurstockProfond(newValue);
      updateParameterState('seuilSurstockProfond', newValue);
      console.log(`✅ Seuil surstock mis à jour : ${newValue}j`);
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour seuil:', error);
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Problème de connexion. Vérifiez votre connexion Internet.', {
          action: {
            label: 'Réessayer',
            onClick: () => handleUpdateSeuilSurstock(newValue)
          }
        });
      } else if (error.message?.includes('Action non reconnue') || error.message?.includes('Action inconnue')) {
        toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas disponible', {
          description: 'Vérifiez la connexion à Supabase',
          duration: 10000
        });
      } else {
        toast.error(`Erreur lors de la sauvegarde: ${error.message}`);
      }
      throw error;
    }
  };

  const handleUpdateDevise = async (newDevise) => {
    try {
      const result = await api.updateParameter('DeviseDefaut', newDevise);
      if (!result?.success) {
        throw new Error(result?.error || 'Échec de la mise à jour de la devise');
      }
      setDeviseDefaut(newDevise);
      updateParameterState('deviseDefaut', newDevise);
      console.log(`✅ Devise mise à jour : ${newDevise}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour devise:', error);
      if (error.message?.includes('Action non reconnue') || error.message?.includes('Action inconnue')) {
        toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas disponible', {
          description: 'Vérifiez la connexion à Supabase',
          duration: 10000
        });
      } else {
        toast.error(`Erreur lors de la sauvegarde de la devise: ${error.message}`);
      }
      throw error;
    }
  };

  const handleUpdateMultiplicateur = async (newValue) => {
    try {
      const result = await api.updateParameter('MultiplicateurDefaut', newValue);
      if (!result?.success) {
        throw new Error(result?.error || 'Échec de la mise à jour du multiplicateur');
      }
      setMultiplicateurDefaut(newValue);
      updateParameterState('multiplicateurDefaut', newValue);
      console.log(`✅ Multiplicateur mis à jour : ${newValue}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour multiplicateur:', error);
      if (error.message?.includes('Action non reconnue') || error.message?.includes('Action inconnue')) {
        toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas disponible', {
          description: 'Vérifiez la connexion à Supabase',
          duration: 10000
        });
      } else {
        toast.error(`Erreur lors de la sauvegarde du multiplicateur: ${error.message}`);
      }
      throw error;
    }
  };

  // ============================================
  // GESTION DES WAREHOUSES
  // ============================================
  
  const handleCreateWarehouse = async (warehouseData) => {
    try {
      console.log('📦 Création warehouse:', warehouseData);
      await api.createWarehouse(warehouseData);
      await loadData();
      toast.success('Entrepôt créé avec succès !');
    } catch (error) {
      console.error('❌ Erreur création warehouse:', error);
      toast.error('Erreur lors de la création: ' + error.message);
      throw error;
    }
  };

  const handleUpdateWarehouse = async (warehouseName, warehouseData) => {
    try {
      console.log('📦 Modification warehouse:', warehouseName, warehouseData);
      await api.updateWarehouse(warehouseName, warehouseData);
      await loadData();
      toast.success('Entrepôt modifié avec succès !');
    } catch (error) {
      console.error('❌ Erreur modification warehouse:', error);
      toast.error('Erreur lors de la modification: ' + error.message);
      throw error;
    }
  };

  const handleDeleteWarehouse = async (warehouse) => {
    try {
      console.log('🗑️ Suppression warehouse:', warehouse.name);
      // Utiliser l'ID si disponible, sinon utiliser le nom comme identifiant
      const warehouseId = warehouse.id || warehouse.name;
      await api.deleteWarehouse(warehouseId);
      await loadData();
      toast.success('Entrepôt supprimé avec succès !');
    } catch (error) {
      console.error('❌ Erreur suppression warehouse:', error);
      toast.error('Erreur lors de la suppression: ' + error.message);
      throw error;
    }
  };


  // ============================================
  // HANDLERS MAPPING
  // ============================================

  const handleOpenAssignSupplierModal = (product) => {
    setProductToMap(product);
    setSelectedSupplierForMapping(product.supplier || '');
    setAssignSupplierModalOpen(true);
  };

  const handleCloseAssignSupplierModal = () => {
    setAssignSupplierModalOpen(false);
    setProductToMap(null);
    setSelectedSupplierForMapping('');
  };

  const handleAssignSupplier = async () => {
    if (!inlineModals.emailOrderModal.selectedSupplierForMapping) {
      toast.warning('Veuillez sélectionner un fournisseur');
      return;
    }
    
    try {
      await api.assignSupplierToProduct(productToMap.sku, inlineModals.emailOrderModal.selectedSupplierForMapping);
      console.log(`✅ Fournisseur assigné à ${productToMap.sku}`);
      await loadData();
      handleCloseAssignSupplierModal();
      toast.success('Fournisseur assigné avec succès');
    } catch (error) {
      console.error('❌ Erreur assignation fournisseur:', error);
      const errorMessage = error?.message || 'Erreur lors de l\'assignation du fournisseur';
      toast.error(errorMessage);
    }
  };

  const handleSaveSupplierMapping = async (supplierName, assignedSkus = []) => {
    if (!supplierName) {
      return;
    }

    const desiredSkus = Array.from(new Set(assignedSkus.filter(Boolean)));
    const currentSkus = products
      .filter((product) => product.supplier === supplierName)
      .map((product) => product.sku);

    const desiredSet = new Set(desiredSkus);
    const currentSet = new Set(currentSkus);

    const skusToAssign = desiredSkus.filter((sku) => !currentSet.has(sku));
    const skusToRemove = currentSkus.filter((sku) => !desiredSet.has(sku));

    const hasDifferences =
      skusToAssign.length > 0 ||
      skusToRemove.length > 0 ||
      desiredSkus.length !== currentSkus.length;

    if (!hasDifferences) {
      toast.info('Aucune modification à sauvegarder pour ce fournisseur.');
      return;
    }

    try {
      setIsSavingSupplierMapping(true);

      await Promise.all([
        ...desiredSkus.map((sku) => api.assignSupplierToProduct(sku, supplierName)),
        ...skusToRemove.map((sku) => api.removeSupplierFromProduct(sku, supplierName))
      ]);

      toast.success(`Mapping fournisseur mis à jour pour ${supplierName}`);
      await loadData();
    } catch (error) {
      console.error('❌ Erreur sauvegarde mapping fournisseur:', error);
      const errorMessage = error?.message || 'Erreur lors de la sauvegarde du mapping fournisseur';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSavingSupplierMapping(false);
    }
  };

  const handleRemoveSupplierFromProduct = async (sku) => {
    const confirm = window.confirm(
      `⚠️ Retirer le fournisseur de ce produit ?\n\n` +
      `Le produit n'aura plus de fournisseur assigné.`
    );
    
    if (!confirm) return;
    
    try {
      const product = products.find((item) => item.sku === sku);
      const supplierName = product?.supplier || null;
      await api.removeSupplierFromProduct(sku, supplierName);
      console.log(`✅ Fournisseur retiré de ${sku}`);
      await loadData();
    } catch (error) {
      console.error('❌ Erreur suppression assignation:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const enrichedProducts = useMemo(() => products.map(p => calculateMetrics(p, seuilSurstockProfond)), [products, seuilSurstockProfond]);

  const productsByStatus = useMemo(() => {
    // Calculer les quantités déjà en commande pour chaque produit
    // (commandes avec statut pending_confirmation, preparing, ou in_transit)
    const quantitiesInOrder = {};
    // Calculer les quantités en transit spécifiquement
    const quantitiesInTransit = {};
    
    orders
      .filter(o => ['pending_confirmation', 'preparing', 'in_transit'].includes(o.status))
      .forEach(order => {
        order.items?.forEach(item => {
          if (!quantitiesInOrder[item.sku]) {
            quantitiesInOrder[item.sku] = 0;
          }
          quantitiesInOrder[item.sku] += item.quantity || 0;
          
          // Quantités en transit spécifiquement
          if (order.status === 'in_transit') {
            if (!quantitiesInTransit[item.sku]) {
              quantitiesInTransit[item.sku] = 0;
            }
            quantitiesInTransit[item.sku] += item.quantity || 0;
          }
        });
      });

    // Enrichir les produits avec les quantités en commande et en transit
    const enrichedWithOrderInfo = enrichedProducts.map(p => ({
      ...p,
      qtyInOrder: quantitiesInOrder[p.sku] || 0,
      qtyInTransit: quantitiesInTransit[p.sku] || 0,
      // Quantité résiduelle à commander (quantité nécessaire - quantité déjà commandée)
      qtyToOrderRemaining: Math.max(0, (p.qtyToOrder || 0) - (quantitiesInOrder[p.sku] || 0))
    }));

    return {
      // Un produit doit apparaître dans "Produits à commander" seulement si
      // la quantité à commander dépasse ce qui est déjà commandé
      // Et on affiche la quantité résiduelle
      to_order: enrichedWithOrderInfo.filter(p => {
        const qtyToOrder = p.qtyToOrder || 0;
        const qtyInOrder = p.qtyInOrder || 0;
        // Afficher seulement si la quantité nécessaire dépasse ce qui est déjà en commande
        return qtyToOrder > qtyInOrder;
      }),
      watch: enrichedWithOrderInfo.filter(p => {
        const qtyToOrder = p.qtyToOrder || 0;
        const qtyInOrder = p.qtyInOrder || 0;
        // Ne pas afficher dans "watch" si c'est déjà dans "to_order"
        return qtyToOrder <= qtyInOrder && p.stock < p.reorderPoint * 1.2;
      }),
      in_transit: enrichedWithOrderInfo.filter(p => {
        return orders.some(o => 
          o.status === 'in_transit' && 
          o.items.some(item => item.sku === p.sku)
        );
      }),
      received: enrichedWithOrderInfo.filter(p => {
        return orders.some(o => 
          o.status === 'received' && 
          o.items.some(item => item.sku === p.sku)
        );
      })
    };
  }, [enrichedProducts, orders]);

  const toOrderBySupplier = useMemo(() => {
    const grouped = {};
    productsByStatus.to_order.forEach(p => {
      if (!grouped[p.supplier]) {
        grouped[p.supplier] = [];
      }
      grouped[p.supplier].push(p);
    });
    return grouped;
  }, [productsByStatus]);

  const notifications = useMemo(() => {
    const notifs = [];
    
    if (productsByStatus.to_order.length > 0) {
      notifs.push({
        type: 'warning',
        message: `${productsByStatus.to_order.length} produit(s) à commander`,
        count: productsByStatus.to_order.length
      });
    }
    
    productsByStatus.in_transit.forEach(p => {
      const order = orders.find(o => o.items.some(item => item.sku === p.sku) && o.status === 'in_transit');
      if (order && order.shippedAt) {
        const daysSinceShip = Math.floor((new Date() - new Date(order.shippedAt)) / (1000 * 60 * 60 * 24));
        const daysRemaining = p.leadTimeDays - daysSinceShip;
        if (daysRemaining <= 3) {
          notifs.push({
            type: 'info',
            message: `${p.name} arrive dans ~${daysRemaining} jour(s)`,
            product: p.name
          });
        }
      }
    });
    
    if (orders.filter(o => o.status === 'received').length > 0) {
      notifs.push({
        type: 'success',
        message: `${orders.filter(o => o.status === 'received').length} commande(s) à valider`,
        count: orders.filter(o => o.status === 'received').length
      });
    }
    
    return notifs;
  }, [productsByStatus, orders]);

  
  // Fonction pour ouvrir le modal de graphique détaillé
  const openChartModal = (kpiKey) => {
    console.log('📊 Ouverture du modal pour KPI:', kpiKey);
    setSelectedKPI(kpiKey);
    setChartModalOpen(true);
  };
  
  // Mapping des clés KPI vers leurs titres
  const kpiTitles = {
    skuAvailability: 'Taux de Disponibilité des SKU',
    inventoryValuation: 'Valeur de l\'Inventaire',
    salesLost: 'Ventes Perdues - Rupture de Stock',
    overstockCost: 'Valeur Surstocks Profonds'
  };
  
  // Sauvegarde automatique du snapshot KPI quotidien
  useEffect(() => {
    if (currentUser?.uid && enrichedProducts.length > 0 && orders.length > 0) {
      console.log('🔄 Vérification et sauvegarde du snapshot KPI quotidien...');
      checkAndSaveKPISnapshot(currentUser.uid, enrichedProducts, orders, seuilSurstockProfond)
        .then(result => {
          if (result.success) {
            console.log('✅ Snapshot KPI:', result.message);
          }
        })
        .catch(error => {
          console.error('❌ Erreur sauvegarde snapshot KPI:', error);
        });
    }
  }, [currentUser?.uid, enrichedProducts, orders]);

  const updateProductParam = async (sku, field, value) => {
    try {
      await api.updateProduct(sku, { [field]: value });
      await loadData();
      console.log('✅ Produit mis à jour');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      if (error.message?.includes('404')) {
        toast.error('Produit introuvable. Actualisez la page.', {
          action: {
            label: 'Actualiser',
            onClick: () => loadData()
          }
        });
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Problème de connexion. Vérifiez votre connexion Internet.');
      } else {
        toast.error(`Erreur lors de la mise à jour : ${error.message || 'Erreur inconnue'}`);
      }
    }
  };

  const startEditParam = (sku, field, currentValue) => {
    setEditingParam({ sku, field });
    setTempParamValue(currentValue !== null ? currentValue.toString() : '');
  };

  const saveParam = async () => {
    if (editingParam) {
      const value = tempParamValue === '' ? null : parseFloat(tempParamValue);
      await updateProductParam(editingParam.sku, editingParam.field, value);
      setEditingParam(null);
      setTempParamValue('');
    }
  };

  const cancelEditParam = () => {
    setEditingParam(null);
    setTempParamValue('');
  };
  
  const handleParameterChange = (paramName, value) => {
    console.log('Modification paramètre:', paramName, '=', value);
    setUnsavedParameterChanges(prev => ({
      ...prev,
      [paramName]: value
    }));
  };
  
  const saveAllParameters = async () => {
    if (Object.keys(unsavedParameterChanges).length === 0) {
      toast.info('Aucune modification à sauvegarder');
      return;
    }
    
    setIsSavingParameters(true);
    
    try {
      console.log('💾 Sauvegarde des paramètres:', unsavedParameterChanges);
      
      // Sauvegarder chaque paramètre modifié
      const savePromises = Object.entries(unsavedParameterChanges).map(([paramName, value]) => {
        console.log(`  - ${paramName}: ${value}`);
        return api.updateParameter(paramName, value);
      });
      
      const results = await Promise.all(savePromises);
      console.log('Résultats de sauvegarde:', results);
      
      // Vérifier les erreurs
      const errors = results.filter(r => !r?.success);
      if (errors.length > 0) {
        throw new Error(`Erreurs: ${errors.map(e => e.error || 'Erreur inconnue').join(', ')}`);
      }
      
      // Recharger les données pour obtenir les paramètres mis à jour
      await loadData();
      
      // Nettoyer les modifications non sauvegardées
      setUnsavedParameterChanges({});
      
      toast.success(`${Object.keys(unsavedParameterChanges).length} paramètre(s) sauvegardé(s) avec succès!`, {
        duration: 4000
      });
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres:', error);
      toast.error('Erreur lors de la sauvegarde: ' + error.message, {
        duration: 6000
      });
    } finally {
      setIsSavingParameters(false);
    }
  };

  const openEmailModal = (supplier) => {
    // Initialiser les quantités éditables avec les recommandations
    const products = toOrderBySupplier[supplier];
    const quantities = {};
    products.forEach(p => {
      quantities[p.sku] = p.qtyToOrder; // Quantité recommandée par défaut
    });
    setOrderQuantities(quantities);
    setSelectedSupplier(supplier);
    
    // Réinitialiser le warehouse sélectionné
    const warehousesList = Object.values(warehouses);
    if (warehousesList.length > 0) {
      setSelectedWarehouse(warehousesList[0].name); // Sélectionner le premier par défaut
    } else {
      setSelectedWarehouse(null);
    }
    
    setEmailModalOpen(true);
  };

  const generateEmailDraft = (supplier, products) => {
    const supplierInfo = suppliers[supplier];
    const productList = products.map(p => {
      const qty = orderQuantities[p.sku] || p.qtyToOrder;
      return `- ${p.name} (SKU: ${p.sku}) - Quantité: ${qty} unités - Prix unitaire: ${formatCurrency(roundToTwoDecimals(p.buyPrice), deviseDefaut)}`;
    }).join('\n');
    
    const total = roundToTwoDecimals(products.reduce((sum, p) => {
      const qty = orderQuantities[p.sku] || p.qtyToOrder;
      // Utiliser l'investissement si disponible, sinon calculer qty * buyPrice
      return sum + (p.investment || (qty * p.buyPrice) || 0);
    }, 0));
    
    // Informations d'entrepôt
    const warehouseInfo = selectedWarehouse && warehouses[selectedWarehouse] 
      ? `\n\nEntrepôt de livraison : ${selectedWarehouse}\nAdresse :\n${warehouses[selectedWarehouse].address}\n${warehouses[selectedWarehouse].postalCode} ${warehouses[selectedWarehouse].city}\n${warehouses[selectedWarehouse].country}`
      : '';
    
    return {
      to: supplierInfo.email || 'email@fournisseur.com',
      subject: `Commande stockeasy - ${new Date().toLocaleDateString('fr-FR')}`,
      body: `Bonjour,

Nous souhaitons passer la commande suivante :

${productList}

TOTAL: ${formatCurrency(total, deviseDefaut)}${warehouseInfo}

Merci de nous confirmer la disponibilité et la date de livraison estimée.

Conditions habituelles: ${supplierInfo.leadTimeDays} jours - MOQ respecté

Cordialement,
${getUserSignature()}`
    };
  };


  const sendOrder = async () => {
    try {
      const productsToOrder = toOrderBySupplier[inlineModals.emailOrderModal.selectedSupplier];
      const total = roundToTwoDecimals(productsToOrder.reduce((sum, p) => {
        const qty = orderQuantities[p.sku] || p.qtyToOrder;
        // Utiliser l'investissement si disponible, sinon calculer qty * buyPrice
        // Si la quantité modifiée diffère de qtyToOrder, recalculer
        if (orderQuantities[p.sku] && orderQuantities[p.sku] !== p.qtyToOrder) {
          return sum + (orderQuantities[p.sku] * p.buyPrice);
        }
        return sum + (p.investment || (qty * p.buyPrice) || 0);
      }, 0));
      
      const orderData = {
        id: generatePONumber(orders),
        supplier: inlineModals.emailOrderModal.selectedSupplier,
        warehouseId: selectedWarehouse, // Ajouter le warehouse
        warehouseName: selectedWarehouse, // Nom de l'entrepôt pour affichage
        status: 'pending_confirmation',
        total: total,
        createdAt: new Date().toISOString().split('T')[0],
        items: productsToOrder.map(p => ({
          sku: p.sku,
          quantity: orderQuantities[p.sku] || p.qtyToOrder,
          pricePerUnit: p.buyPrice
        })),
        notes: ''
      };
      
      await api.createOrder(orderData);
      await loadData();
      
      setEmailModalOpen(false);
      setSelectedSupplier(null);
      
      toast.success('Commande créée et sauvegardée dans Supabase !', {
        action: {
          label: 'Voir',
          onClick: () => setActiveTab('track')
        },
        duration: 6000
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création de la commande:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  };

  const createOrderWithoutEmail = async () => {
    try {
      const selectedSupplier = inlineModals.emailOrderModal.selectedSupplier;
      const selectedWarehouse = inlineModals.emailOrderModal.selectedWarehouse;
      const productsToOrder = toOrderBySupplier[selectedSupplier];
      
      if (!selectedWarehouse) {
        toast.error('Veuillez sélectionner un entrepôt');
        return;
      }
      
      const total = roundToTwoDecimals(productsToOrder.reduce((sum, p) => {
        const qty = inlineModals.emailOrderModal.orderQuantities[p.sku] || p.qtyToOrder;
        // Utiliser l'investissement si disponible et quantité non modifiée, sinon calculer qty * buyPrice
        if (inlineModals.emailOrderModal.orderQuantities[p.sku] && inlineModals.emailOrderModal.orderQuantities[p.sku] !== p.qtyToOrder) {
          return sum + (inlineModals.emailOrderModal.orderQuantities[p.sku] * p.buyPrice);
        }
        return sum + (p.investment || (qty * p.buyPrice) || 0);
      }, 0));
      
      const orderData = {
        id: generatePONumber(orders),
        supplier: selectedSupplier,
        warehouseId: selectedWarehouse,
        warehouseName: selectedWarehouse,
        status: 'pending_confirmation',
        total: total,
        createdAt: new Date().toISOString().split('T')[0],
        items: productsToOrder.map(p => ({
          sku: p.sku,
          quantity: inlineModals.emailOrderModal.orderQuantities[p.sku] || p.qtyToOrder,
          pricePerUnit: p.buyPrice
        })),
        notes: ''
      };
      
      await api.createOrder(orderData);
      await loadData();
      
      inlineModals.emailOrderModal.closeEmailModal();
      
      toast.success('Commande créée sans envoi d\'email !', {
        action: {
          label: 'Voir',
          onClick: () => setActiveTab('track')
        },
        duration: 6000
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création de la commande:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  };

  // Handler pour ouvrir le modal d'email
  const handleOpenEmailModal = (supplier, products) => {
    // Utiliser le système inline qui fonctionnait avant
    inlineModals.emailOrderModal.openEmailModal(supplier);
    
    // Pré-remplir les quantités dans le système inline
    products.forEach(p => {
      inlineModals.emailOrderModal.updateOrderQuantity(p.sku, p.qtyToOrder);
    });
    
    // Sélectionner le premier warehouse par défaut
    const warehousesList = Object.values(warehouses);
    if (warehousesList.length > 0) {
      inlineModals.emailOrderModal.setSelectedWarehouse(warehousesList[0].name);
    }
  };

  const handleCreateOrderFromTable = async (selectedProducts) => {
    // selectedProducts est une Map<sku, quantity>
    
    // Grouper les produits par fournisseur
    const productsBySupplier = {};
    
    selectedProducts.forEach((quantity, sku) => {
      const product = enrichedProducts.find(p => p.sku === sku);
      if (!product || !product.supplier) return;
      
      if (!productsBySupplier[product.supplier]) {
        productsBySupplier[product.supplier] = [];
      }
      
      productsBySupplier[product.supplier].push({
        ...product,
        orderQuantity: quantity
      });
    });
    
    // Si un seul fournisseur, ouvrir directement la modal email
    if (Object.keys(productsBySupplier).length === 1) {
      const supplier = Object.keys(productsBySupplier)[0];
      const products = productsBySupplier[supplier];
      
      // Pré-remplir orderQuantities
      const quantities = {};
      products.forEach(p => {
        quantities[p.sku] = p.orderQuantity;
      });
      setOrderQuantities(quantities);
      setSelectedSupplier(supplier);
      
      // Sélectionner le premier warehouse par défaut
      const warehousesList = Object.values(warehouses);
      if (warehousesList.length > 0) {
        setSelectedWarehouse(warehousesList[0].name);
      }
      
      setEmailModalOpen(true);
    } else {
      // Si plusieurs fournisseurs, créer plusieurs commandes ou afficher un choix
      toast.info('Plusieurs fournisseurs détectés. Créer des commandes séparées...', {
        duration: 4000
      });
      
      const warehousesList = Object.values(warehouses);
      
      // Option : créer automatiquement une commande par fournisseur
      for (const [supplier, products] of Object.entries(productsBySupplier)) {
        // Créer la commande sans email pour chaque fournisseur
        // Utiliser l'investissement si disponible, sinon calculer orderQuantity * buyPrice
        const total = roundToTwoDecimals(products.reduce((sum, p) => {
          // Si orderQuantity diffère de qtyToOrder, recalculer
          if (p.orderQuantity && p.orderQuantity !== p.qtyToOrder) {
            return sum + (p.orderQuantity * p.buyPrice);
          }
          return sum + (p.investment || (p.orderQuantity * p.buyPrice) || 0);
        }, 0));
        
        const orderData = {
          id: generatePONumber(orders),
          supplier: supplier,
          warehouseId: warehousesList[0]?.name || null,
          status: 'pending_confirmation',
          total: total,
          createdAt: new Date().toISOString().split('T')[0],
          items: products.map(p => ({
            sku: p.sku,
            quantity: p.orderQuantity,
            pricePerUnit: p.buyPrice
          })),
          notes: 'Commande créée depuis la table de sélection'
        };
        
        await api.createOrder(orderData);
      }
      
      await loadData();
      toast.success(`${Object.keys(productsBySupplier).length} commande(s) créée(s) !`, {
        duration: 4000
      });
    }
  };

  // Handler pour créer une commande simple (pour les boutons dans OrderBySupplier)
  const handleCreateOrder = async (supplier, products) => {
    if (!selectedWarehouse) {
      toast.error('Veuillez sélectionner un entrepôt');
      return;
    }

    try {
      const poNumber = generatePONumber(orders);
      const orderData = {
        poNumber,
        supplier,
        warehouse: selectedWarehouse,
        status: 'pending',
        items: products.map(p => ({
          sku: p.sku,
          quantity: orderQuantities[p.sku] || p.qtyToOrder,
          pricePerUnit: p.buyPrice
        })),
        notes: `Commande pour ${supplier}`
      };

      await api.createOrder(orderData);
      await loadData();
      toast.success(`Commande créée pour ${supplier} !`);
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('order');

    if (!orderId) {
      return;
    }

    if (!orders || orders.length === 0) {
      return;
    }

    setActiveTab(MAIN_TABS.TRACK);

    const targetOrder = orders.find(order => order.id === orderId);
    if (targetOrder) {
      const statusToSectionMap = {
        pending_confirmation: TRACK_TABS.EN_COURS_COMMANDE,
        preparing: TRACK_TABS.PREPARATION,
        in_transit: TRACK_TABS.EN_TRANSIT,
        received: TRACK_TABS.COMMANDES_RECUES,
        reconciliation: TRACK_TABS.RECONCILIATION
      };

      const targetSection =
        statusToSectionMap[targetOrder.status] ?? TRACK_TABS.EN_COURS_COMMANDE;

      setTrackTabSection(targetSection);
      setExpandedOrders(prev => ({
        ...prev,
        [orderId]: true
      }));
    } else {
      toast.error('Commande introuvable');
    }

    navigate(location.pathname, { replace: true });
  }, [location.search, orders, navigate]);


  
  const openReconciliationModal = (order) => {
    setReconciliationOrder(order);
    
    // Initialiser les quantités reçues avec les quantités commandées par défaut
    const initialItems = {};
    const initialTypes = {};
    const initialDamaged = {};
    
    order.items.forEach(item => {
      initialItems[item.sku] = {
        received: item.receivedQuantity !== undefined ? item.receivedQuantity : item.quantity,
        notes: item.discrepancyNotes || ''
      };
      initialTypes[item.sku] = item.discrepancyType || 'none';
      initialDamaged[item.sku] = item.damagedQuantity || 0; // Quantités endommagées
    });
    
    inlineModals.reconciliationModal.setDiscrepancyItems(initialItems);
    setDiscrepancyTypes(initialTypes);
    inlineModals.reconciliationModal.setDamagedQuantities(initialDamaged);
    setReconciliationModalOpen(true);
  };
  
  const updateDiscrepancyItem = (sku, field, value, orderedQuantity) => {
    inlineModals.reconciliationModal.setDiscrepancyItems(prev => ({
      ...prev,
      [sku]: {
        ...prev[sku],
        [field]: value
      }
    }));
  };
  
  const confirmReconciliationWithQuantities = async () => {
    console.log('🚀 FONCTION APPELÉE: confirmReconciliationWithQuantities');
    try {
      if (!reconciliationOrder) {
        console.log('❌ PAS DE COMMANDE EN RÉCONCILIATION');
        return;
      }
      
      console.log('🔍 Début de la réconciliation:', reconciliationOrder.id);
      console.log('Quantités reçues:', inlineModals.reconciliationModal.discrepancyItems);
      console.log('Types de problèmes:', discrepancyTypes);
      console.log('Quantités endommagées:', inlineModals.reconciliationModal.damagedQuantities);
      
      // Préparer les items avec quantités et types de problèmes
      const updatedItems = reconciliationOrder.items.map(item => {
        const receivedQty = parseInt(inlineModals.reconciliationModal.discrepancyItems[item.sku]?.received, 10);
        const damagedQty = parseInt(inlineModals.reconciliationModal.damagedQuantities[item.sku] || 0, 10);
        const notes = inlineModals.reconciliationModal.discrepancyItems[item.sku]?.notes || '';
        
        // Validation
        if (isNaN(receivedQty) || receivedQty < 0) {
          throw new Error(`Quantité invalide pour ${item.sku}`);
        }
        if (isNaN(damagedQty) || damagedQty < 0) {
          throw new Error(`Quantité endommagée invalide pour ${item.sku}`);
        }
        
        // Calculer le total reçu (sain + endommagé)
        const totalReceived = receivedQty + damagedQty;
        
        // Calculer l'écart de quantité (commande - total reçu)
        const discrepancyQty = item.quantity - totalReceived;
        
        // Déterminer le type de problème
        let itemType = 'none';
        const hasMissing = totalReceived < item.quantity;
        const hasDamaged = damagedQty > 0;
        
        if (hasMissing && hasDamaged) {
          itemType = 'missing_and_damaged'; // Les deux problèmes
        } else if (hasMissing) {
          itemType = 'missing';
        } else if (hasDamaged) {
          itemType = 'damaged';
        }
        
        return {
          sku: item.sku,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          receivedQuantity: receivedQty,
          damagedQuantity: damagedQty,
          discrepancyType: itemType,
          discrepancyQuantity: discrepancyQty,
          discrepancyNotes: notes
        };
      });
      
      console.log('Items mis à jour:', updatedItems);
      
      // Vérifier s'il y a des problèmes
      const hasProblems = updatedItems.some(item => 
        item.receivedQuantity < item.quantity || 
        item.damagedQuantity > 0
      );
      
      console.log('A des problèmes:', hasProblems);
      
      // Calculer les quantités manquantes et endommagées par SKU
      const missingQuantitiesBySku = {};
      const damagedQuantitiesBySku = {};
      
      updatedItems.forEach(item => {
        const missing = item.quantity - (item.receivedQuantity + item.damagedQuantity);
        if (missing > 0) {
          missingQuantitiesBySku[item.sku] = missing;
        }
        if (item.damagedQuantity > 0) {
          damagedQuantitiesBySku[item.sku] = item.damagedQuantity;
        }
      });
      
      // Sauvegarder dans la base de données
      const updatePayload = {
        status: hasProblems ? 'reconciliation' : 'completed',
        receivedAt: new Date().toISOString().split('T')[0],
        hasDiscrepancy: hasProblems,
        items: updatedItems,
        missingQuantitiesBySku: missingQuantitiesBySku,
        damagedQuantitiesBySku: damagedQuantitiesBySku
      };
      
      console.log('Payload de mise à jour:', updatePayload);
      
      await api.updateOrderStatus(reconciliationOrder.id, updatePayload);
      
      // Mettre à jour le stock uniquement pour les quantités reçues saines
      // NE PAS ajouter les produits endommagés au stock
      const stockUpdates = updatedItems
        .map(item => ({
          sku: item.sku,
          quantityToAdd: item.receivedQuantity // Seulement les quantités saines
        }))
        .filter(update => update.quantityToAdd > 0); // Ne traiter que les quantités > 0
      
      console.log('Mises à jour du stock:', stockUpdates);
      
      if (stockUpdates.length > 0) {
        await api.updateStock(stockUpdates);
        console.log('✅ Stock mis à jour avec succès');
      }
      
      // Recharger les données
      await loadData();
      
      // Fermer la modal et nettoyer les états
      setReconciliationModalOpen(false);
      setReconciliationOrder(null);
      inlineModals.reconciliationModal.setDiscrepancyItems({});
      inlineModals.reconciliationModal.setDamagedQuantities({});
      setDiscrepancyTypes({});
      
      toast.success(
        hasProblems ? 
          'Réception enregistrée avec écarts. Commande déplacée vers "Réconciliation".' : 
          'Réception validée et stock mis à jour avec succès!',
        { duration: 5000 }
      );
      
      // Rediriger vers l'onglet Réconciliation si des problèmes sont détectés
      if (hasProblems) {
        setTrackTabSection('reconciliation');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation de la réception: ' + error.message);
    }
  };
  
  const confirmReconciliation = async (hasDiscrepancy) => {
    try {
      if (hasDiscrepancy) {
        // NOUVEAU: Ouvrir le modal unifié de réconciliation
        setReconciliationModalOpen(false);
        const initialUnifiedData = {};
        reconciliationOrder.items.forEach(item => {
          initialUnifiedData[item.sku] = {
            ordered: item.quantity,
            received: item.quantity, // par défaut, à ajuster par l'utilisateur
            damaged: 0 // par défaut, pas d'endommagé
          };
        });
        setUnifiedReconciliationItems(initialUnifiedData);
        setReconciliationNotes('');
        setUnifiedReconciliationModalOpen(true);
      } else {
        // CORRECTION 1: Réception conforme - mise à jour automatique du stock
        console.log('=== DEBUG CORRECTION 1 - Réception conforme ===');
        
        // Convertir les quantités en nombres pour éviter #NUM!
        const stockUpdates = reconciliationOrder.items.map(item => {
          const quantity = parseInt(item.quantity, 10) || 0;
          console.log(`Stock ${item.sku}: +${quantity} unités (type: ${typeof quantity})`);
          return {
            sku: item.sku,
            quantityToAdd: quantity
          };
        });
        
        console.log('Stock updates:', stockUpdates);
        
        // Mettre à jour le stock AVANT de marquer comme completed
        await api.updateStock(stockUpdates);
        
        // Puis marquer la commande comme complétée
        await api.updateOrderStatus(reconciliationOrder.id, {
          status: 'completed',
          receivedAt: new Date().toISOString().split('T')[0],
          completedAt: new Date().toISOString().split('T')[0]
        });
        
        await loadData();
        setReconciliationModalOpen(false);
        setReconciliationOrder(null);
        
        toast.success('Réception validée ! Stock mis à jour automatiquement.');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const submitDiscrepancy = async () => {
    try {
      // Créer l'email de réclamation
      const discrepancyList = Object.entries(inlineModals.reconciliationModal.discrepancyItems)
        .filter(([sku, data]) => data.ordered !== data.received)
        .map(([sku, data]) => {
          const product = products.find(p => p.sku === sku);
          return `- ${product?.name || sku} (SKU: ${sku})\n  Commandé: ${data.ordered} | Reçu: ${data.received} | Écart: ${data.received - data.ordered}`;
        })
        .join('\n\n');
      
      const claimEmail = `Objet: Réclamation - Commande ${reconciliationOrder.id}\n\nBonjour,\n\nNous avons constaté des écarts entre les quantités commandées et reçues :\n\n${discrepancyList}\n\nMerci de nous confirmer ces écarts et de procéder à l'envoi des quantités manquantes.\n\nCordialement,\n${getUserSignature()}`;
      
      console.log('EMAIL DE RÉCLAMATION GÉNÉRÉ:', claimEmail);
      toast.success('Email de réclamation généré !', {
        description: 'Le contenu a été préparé',
        duration: 4000
      });
      
      // CORRECTION 4A: Mettre à jour la commande avec les quantités reçues
      const updatedItems = reconciliationOrder.items.map(item => {
        const receivedQty = inlineModals.reconciliationModal.discrepancyItems[item.sku]?.received;
        return {
          sku: item.sku,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          receivedQuantity: receivedQty !== undefined ? parseInt(receivedQty, 10) : parseInt(item.quantity, 10)
        };
      });
      
      console.log('=== DEBUG CORRECTION 4A ===');
      console.log('Items mis à jour avec receivedQuantity:', updatedItems);
      
      await api.updateOrderStatus(reconciliationOrder.id, {
        status: 'reconciliation',
        receivedAt: new Date().toISOString().split('T')[0],
        hasDiscrepancy: true,
        items: updatedItems
      });
      
      // CORRECTION 1: Mettre à jour le stock avec les quantités réellement reçues (conversion en nombre)
      const stockUpdates = Object.entries(inlineModals.reconciliationModal.discrepancyItems).map(([sku, data]) => {
        const quantityReceived = parseInt(data.received, 10) || 0;
        console.log(`Stock update pour ${sku}: +${quantityReceived} unités`);
        return {
          sku,
          quantityToAdd: quantityReceived
        };
      });
      
      console.log('=== DEBUG CORRECTION 1 ===');
      console.log('Stock updates:', stockUpdates);
      
      await api.updateStock(stockUpdates);
      
      await loadData();
      setDiscrepancyModalOpen(false);
      inlineModals.reconciliationModal.setDiscrepancyItems({});
      setReconciliationOrder(null);
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la soumission');
    }
  };

  const openDamageModal = () => {
    // ANCIEN: Rediriger vers le modal unifié
    confirmReconciliation(true);
  };

  // NOUVEAU: Fonction de soumission du modal unifié de réconciliation
  const submitUnifiedReconciliation = async () => {
    try {
      // Calculer les écarts et préparer les données
      const hasQuantityDiscrepancy = Object.entries(unifiedReconciliationItems).some(
        ([sku, data]) => data.ordered !== data.received
      );
      const hasDamage = Object.entries(unifiedReconciliationItems).some(
        ([sku, data]) => data.damaged > 0
      );
      
      // Mettre à jour les items avec les quantités reçues, endommagées et validées
      const updatedItems = reconciliationOrder.items.map(item => {
        const data = unifiedReconciliationItems[item.sku];
        const receivedQty = parseInt(data.received, 10) || 0;
        const damagedQty = parseInt(data.damaged, 10) || 0;
        const validatedQty = receivedQty - damagedQty;
        const totalReceived = receivedQty + damagedQty;
        const discrepancyQty = item.quantity - totalReceived;
        
        return {
          sku: item.sku,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          receivedQuantity: receivedQty,
          damagedQuantity: damagedQty,
          discrepancyQuantity: discrepancyQty,
          validatedQuantity: validatedQty,
          quantityDiscrepancy: discrepancyQty
        };
      });

      // Calculer les quantités manquantes et endommagées par SKU
      const missingQuantitiesBySku = {};
      const damagedQuantitiesBySku = {};
      
      updatedItems.forEach(item => {
        const missing = item.quantity - (item.receivedQuantity + item.damagedQuantity);
        if (missing > 0) {
          missingQuantitiesBySku[item.sku] = missing;
        }
        if (item.damagedQuantity > 0) {
          damagedQuantitiesBySku[item.sku] = item.damagedQuantity;
        }
      });

      console.log('=== DEBUG RÉCONCILIATION UNIFIÉE ===');
      console.log('Items mis à jour:', updatedItems);
      console.log('Quantités manquantes par SKU:', missingQuantitiesBySku);
      console.log('Quantités endommagées par SKU:', damagedQuantitiesBySku);
      
      // Générer les emails de réclamation si nécessaire
      if (hasQuantityDiscrepancy || hasDamage) {
        let claimEmail = `Objet: Réclamation - Commande ${reconciliationOrder.id}\n\nBonjour,\n\nNous avons reçu la commande ${reconciliationOrder.id} mais constatons les problèmes suivants :\n\n`;
        
        if (hasQuantityDiscrepancy) {
          const discrepancyList = Object.entries(unifiedReconciliationItems)
            .filter(([sku, data]) => data.ordered !== data.received)
            .map(([sku, data]) => {
              const product = products.find(p => p.sku === sku);
              return `- ${product?.name || sku} (SKU: ${sku})\n  📦 Commandé: ${data.ordered} | Reçu: ${data.received} | Écart: ${data.received - data.ordered}`;
            })
            .join('\n\n');
          
          claimEmail += `**ÉCARTS DE QUANTITÉ:**\n\n${discrepancyList}\n\n`;
        }
        
        if (hasDamage) {
          const damagedList = Object.entries(unifiedReconciliationItems)
            .filter(([sku, data]) => data.damaged > 0)
            .map(([sku, data]) => {
              const product = products.find(p => p.sku === sku);
              return `- ${product?.name || sku} (SKU: ${sku})\n  ⚠️ Endommagé: ${data.damaged} / ${data.received} reçus`;
            })
            .join('\n\n');
          
          claimEmail += `**MARCHANDISES ENDOMMAGÉES:**\n\n${damagedList}\n\n`;
        }
        
        if (reconciliationNotes) {
          claimEmail += `**Notes supplémentaires:**\n${reconciliationNotes}\n\n`;
        }
        
        claimEmail += `Merci de procéder aux actions correctives nécessaires.\n\nCordialement,\n${getUserSignature()}`;
        
        console.log('EMAIL DE RÉCLAMATION GÉNÉRÉ:', claimEmail);
        toast.success('Email de réclamation généré !', {
          description: 'Le contenu a été préparé',
          duration: 4000
        });
      }
      
      // Mettre à jour le statut de la commande
      await api.updateOrderStatus(reconciliationOrder.id, {
        status: 'reconciliation',
        receivedAt: new Date().toISOString().split('T')[0],
        hasDiscrepancy: hasQuantityDiscrepancy,
        hasDamage: hasDamage,
        items: updatedItems,
        missingQuantitiesBySku: missingQuantitiesBySku,
        damagedQuantitiesBySku: damagedQuantitiesBySku
      });
      
      // Mettre à jour le stock avec les quantités validées (reçues - endommagées)
      const stockUpdates = Object.entries(unifiedReconciliationItems).map(([sku, data]) => {
        const validatedQty = parseInt(data.received, 10) - parseInt(data.damaged, 10);
        console.log(`Stock update pour ${sku}: +${validatedQty} unités (reçu: ${data.received}, endommagé: ${data.damaged})`);
        return {
          sku,
          quantityToAdd: validatedQty
        };
      });
      
      console.log('Stock updates:', stockUpdates);
      await api.updateStock(stockUpdates);
      
      await loadData();
      setUnifiedReconciliationModalOpen(false);
      setUnifiedReconciliationItems({});
      setReconciliationNotes('');
      setReconciliationOrder(null);
      
      toast.success('Réconciliation enregistrée avec succès !');
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la soumission de la réconciliation');
    }
  };

  const submitDamageReport = async () => {
    try {
      const damagedList = Object.entries(damageItems)
        .filter(([sku, data]) => data.damaged > 0)
        .map(([sku, data]) => {
          const product = products.find(p => p.sku === sku);
          return `- ${product?.name || sku} (SKU: ${sku})\n  Quantité endommagée: ${data.damaged} / ${data.total}`;
        })
        .join('\n\n');
      
      const damageEmail = `Objet: Réclamation - Marchandises endommagées - Commande ${reconciliationOrder.id}\n\nBonjour,\n\nNous avons reçu la commande ${reconciliationOrder.id} mais certains produits sont arrivés endommagés :\n\n${damagedList}\n\nNotes: ${damageNotes || 'Aucune note supplémentaire'}\n\nMerci de procéder au remplacement de ces articles.\n\nCordialement,\n${getUserSignature()}`;
      
      console.log('EMAIL RÉCLAMATION DOMMAGES:', damageEmail);
      toast.success('Email de réclamation pour dommages généré !', {
        description: 'Le contenu a été préparé',
        duration: 4000
      });
      
      // CORRECTION 1: Mettre à jour le stock avec uniquement les produits non endommagés (conversion en nombre)
      const stockUpdates = Object.entries(damageItems).map(([sku, data]) => {
        const quantityGood = parseInt(data.total, 10) - parseInt(data.damaged, 10);
        console.log(`Stock update pour ${sku}: +${quantityGood} unités (total: ${data.total}, endommagé: ${data.damaged})`);
        return {
          sku,
          quantityToAdd: quantityGood
        };
      });
      
      await api.updateStock(stockUpdates);
      await api.updateOrderStatus(reconciliationOrder.id, {
        status: 'reconciliation',
        receivedAt: new Date().toISOString().split('T')[0],
        hasDiscrepancy: true,
        damageReport: true
      });
      
      await loadData();
      setDamageModalOpen(false);
      setDamageItems({});
      setDamageNotes('');
      setReconciliationOrder(null);
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la soumission');
    }
  };

  // CORRECTION 4B: Fonction pour générer l'email de réclamation
  const generateReclamationEmail = (order) => {
    // Filtrer les items avec problèmes
    const missingItems = order.items.filter(i => {
      const totalReceived = (i.receivedQuantity || 0) + (i.damagedQuantity || 0);
      return totalReceived < i.quantity;
    });
    
    const damagedItems = order.items.filter(i => (i.damagedQuantity || 0) > 0);
    
    const supplierData = suppliers[order.supplier] || {};
    const reclamationEmail =
      supplierData.reclamationContactEmail ||
      supplierData.commercialContactEmail ||
      supplierData.email ||
      '';
    const reclamationName = supplierData.reclamationContactName || supplierData.commercialContactName || '';
    const reclamationPhone = supplierData.reclamationContactPhone || supplierData.commercialContactPhone || '';

    let email = `À: ${reclamationEmail}\n`;
    email += `Objet: Réclamation - Commande ${order.id}\n\n`;
    email += `Bonjour,\n\n`;
    email += `Nous avons réceptionné la commande ${order.id} mais constatons les problèmes suivants :\n\n`;
    
    if (missingItems.length > 0) {
      email += `🔴 QUANTITÉS MANQUANTES:\n`;
      email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      missingItems.forEach(item => {
        const product = products.find(p => p.sku === item.sku);
        const totalReceived = (item.receivedQuantity || 0) + (item.damagedQuantity || 0);
        const missing = item.quantity - totalReceived;
        email += `\n▸ ${product?.name || item.sku}\n`;
        email += `  SKU: ${item.sku}\n`;
        email += `  Commandé: ${item.quantity} unités\n`;
        email += `  Reçu sain: ${item.receivedQuantity || 0} unités\n`;
        if (item.damagedQuantity > 0) {
          email += `  Reçu endommagé: ${item.damagedQuantity} unités\n`;
          email += `  Total reçu: ${totalReceived} unités\n`;
        }
        email += `  Manquant: ${missing} unités\n`;
        if (item.discrepancyNotes) {
          email += `  Notes: ${item.discrepancyNotes}\n`;
        }
      });
      email += `\n`;
    }
    
    if (damagedItems.length > 0) {
      email += `⚠️ PRODUITS ENDOMMAGÉS:\n`;
      email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      damagedItems.forEach(item => {
        const product = products.find(p => p.sku === item.sku);
        const totalReceived = (item.receivedQuantity || 0) + (item.damagedQuantity || 0);
        const missing = item.quantity - totalReceived;
        email += `\n▸ ${product?.name || item.sku}\n`;
        email += `  SKU: ${item.sku}\n`;
        email += `  Quantité endommagée: ${item.damagedQuantity} unités\n`;
        if (missing > 0) {
          email += `  Note: Également ${missing} unités manquantes (voir section ci-dessus)\n`;
        }
        if (item.discrepancyNotes) {
          email += `  Description: ${item.discrepancyNotes}\n`;
        }
      });
      email += `\n`;
    }
    
    email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    email += `Merci de procéder rapidement au remplacement ou à l'envoi des articles manquants/endommagés.\n\n`;
    if (reclamationName || reclamationPhone) {
      email += `Contact réclamations côté fournisseur: ${reclamationName || 'N/A'}${reclamationPhone ? ` - Tél: ${reclamationPhone}` : ''}\n\n`;
    }
    email += `Cordialement,\n`;
    email += `${getUserSignature()}`;
    
    return email;
  };

  // CORRECTION 4B: Fonction pour ouvrir le modal de réclamation
  const openReclamationModal = (order) => {
    const emailContent = generateReclamationEmail(order);
    setReclamationEmailContent(emailContent);
    setCurrentReclamationOrder(order);
    setReclamationEmailModalOpen(true);
  };

  // CORRECTION 4B: Fonction pour copier l'email dans le presse-papier
  const copyReclamationToClipboard = () => {
    navigator.clipboard.writeText(reclamationEmailContent);
    toast.success('Email copié dans le presse-papier !');
  };

  // CORRECTION 4C: Fonction pour valider sans réclamation
  const validateWithoutReclamation = async (order) => {
    const confirm = window.confirm(
      `Êtes-vous sûr de vouloir valider cette commande sans envoyer de réclamation ?\n\n` +
      `Les quantités reçues seront enregistrées comme définitives et le stock sera ajusté en conséquence.`
    );
    
    if (!confirm) return;
    
    try {
      console.log('=== VALIDATION SANS RÉCLAMATION ===');
      
      // CORRECTION 1 & 4C: Ajuster le stock avec les quantités RÉELLEMENT reçues
      const stockUpdates = order.items.map(item => {
        const quantityReceived = parseInt(item.receivedQuantity, 10) || 0;
        console.log(`Stock ${item.sku}: +${quantityReceived} unités reçues`);
        return {
          sku: item.sku,
          quantityToAdd: quantityReceived
        };
      });
      
      console.log('Stock updates:', stockUpdates);
      
      // Mettre à jour le stock
      await api.updateStock(stockUpdates);
      
      // Marquer la commande comme completed
      await api.updateOrderStatus(order.id, {
        status: 'completed',
        completedAt: new Date().toISOString().split('T')[0]
      });
      
      await loadData();
      
      toast.success(`Commande ${order.id} validée avec les quantités reçues.`);
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  // Fonction pour exporter l'historique en CSV
  const exportHistoryToCSV = () => {
    // Filtrer les commandes selon les critères actuels
    const filteredOrders = orders.filter(o => {
      // Filtrage par statut
      if (historyFilter !== 'all' && o.status !== historyFilter) return false;
      
      // Filtrage par dates
      if (historyDateStart || historyDateEnd) {
        const orderDate = new Date(o.createdAt);
        if (historyDateStart && orderDate < new Date(historyDateStart)) return false;
        if (historyDateEnd && orderDate > new Date(historyDateEnd)) return false;
      }
      
      return true;
    });

    // Générer le CSV avec détail des produits
    const priceHeader = `Prix Unitaire (${currencySymbol})`;
    const lineTotalHeader = `Total Ligne (${currencySymbol})`;
    const orderTotalHeader = `Total Commande (${currencySymbol})`;
    const headers = ['N° Commande', 'Fournisseur', 'Date Création', 'Date Confirmation', 'Date Expédition', 'Date Réception', 'Statut', 'SKU', 'Nom Produit', 'Quantité', priceHeader, lineTotalHeader, orderTotalHeader, 'Suivi'];
    const rows = [];
    
    const statusLabels = {
      pending_confirmation: 'En attente',
      preparing: 'En traitement',
      in_transit: 'En transit',
      received: 'Reçues',
      completed: 'Complétée',
      reconciliation: 'À réconcilier'
    };
    
    filteredOrders.forEach(order => {
      // Pour chaque commande, créer une ligne par produit
      order.items.forEach((item, index) => {
        const product = products.find(p => p.sku === item.sku);
        const lineTotal = roundToTwoDecimals(item.quantity * item.pricePerUnit);
        
        rows.push([
          order.id,
          order.supplier,
          formatConfirmedDate(order.createdAt) || order.createdAt,
          formatConfirmedDate(order.confirmedAt) || order.confirmedAt || '-',
          formatConfirmedDate(order.shippedAt) || order.shippedAt || '-',
          formatConfirmedDate(order.receivedAt) || order.receivedAt || '-',
          statusLabels[order.status] || order.status,
          item.sku,
          product?.name || item.sku,
          item.quantity,
          formatWithCurrency(roundToTwoDecimals(item.pricePerUnit)),
          formatWithCurrency(lineTotal),
          // Afficher le total de la commande seulement sur la première ligne de chaque commande
          index === 0 ? formatWithCurrency(roundToTwoDecimals(order.total)) : '',
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

  // ============================================
  // NOUVEAUX HANDLERS POUR LES MODALS ET FONCTIONNALITÉS
  // ============================================

  // Handler pour ouvrir le modal de réconciliation
  const handleStartReconciliation = (order) => {
    reconciliationModalHandlers.open(order);
  };

  // Handler pour confirmer la réconciliation - Logique directe qui fonctionne
  const handleReconciliationConfirm = async (reconciliationData) => {
    try {
      const order = reconciliationModal.data.order;
      
      console.log('🔥 handleReconciliationConfirm APPELÉE');
      console.log('🔥 reconciliationData:', reconciliationData);
      console.log('🔥 order:', order);
      
      // Analyser les données pour déterminer s'il y a des écarts ou dommages
      const hasDiscrepancies = Object.values(reconciliationData.discrepancies || {}).some(d => d !== 0);
      const hasDamages = Object.values(reconciliationData.damages || {}).some(d => d > 0);
      
      console.log('🔥 hasDiscrepancies:', hasDiscrepancies, 'hasDamages:', hasDamages);
      
      if (hasDiscrepancies || hasDamages) {
        // Calculer les quantités manquantes et endommagées par SKU
        const missingQuantitiesBySku = {};
        const damagedQuantitiesBySku = {};
        
        // Le modal envoie receivedItems = quantités reçues, damages = quantités endommagées
        order.items.forEach(item => {
          const ordered = item.quantity || 0;
          const receivedSaine = parseInt(reconciliationData.receivedItems?.[item.sku] || 0, 10);
          const damaged = parseInt(reconciliationData.damages?.[item.sku] || 0, 10);
          
          // Missing = Commandé - (Reçu sain + Endommagé)
          const missing = ordered - receivedSaine - damaged;
          
          console.log(`📦 ${item.sku}: commandé=${ordered}, reçu=${receivedSaine}, endommagé=${damaged}, manquant=${missing}`);
          
          if (missing > 0) {
            missingQuantitiesBySku[item.sku] = missing;
          }
          if (damaged > 0) {
            damagedQuantitiesBySku[item.sku] = damaged;
          }
        });
        
        console.log('📦 missingQuantitiesBySku:', missingQuantitiesBySku);
        console.log('📦 damagedQuantitiesBySku:', damagedQuantitiesBySku);
        
        // Mettre à jour les items avec les quantités reçues et endommagées
        const updatedItems = order.items.map(item => {
          const receivedSaine = parseInt(reconciliationData.receivedItems?.[item.sku] || 0, 10);
          const damaged = parseInt(reconciliationData.damages?.[item.sku] || 0, 10);
          
          return {
            ...item,
            receivedQuantity: receivedSaine,
            damagedQuantity: damaged
          };
        });
        
        console.log('📦 updatedItems:', updatedItems);
        
        // Il y a des écarts ou dommages - passer au statut 'reconciliation'
        await api.updateOrderStatus(order.id, {
          status: 'reconciliation',
          receivedAt: new Date().toISOString().split('T')[0],
          hasDiscrepancy: hasDiscrepancies,
          damageReport: hasDamages,
          items: updatedItems,
          missingQuantitiesBySku: missingQuantitiesBySku,
          damagedQuantitiesBySku: damagedQuantitiesBySku
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
          reconciliationData.notes || getUserSignature(),
          products
        );
        
        if (emailContent) {
          reclamationEmailModalHandlers.open(order, emailContent);
        }
        
        toast.success('Commande mise en réconciliation avec réclamation générée');
      } else {
        // Pas d'écarts - marquer comme complétée
        await api.updateOrderStatus(order.id, {
          status: 'completed',
          receivedAt: new Date().toISOString().split('T')[0],
          completedAt: new Date().toISOString().split('T')[0],
          hasDiscrepancy: false,
          damageReport: false
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
      await loadData();
      
    } catch (error) {
      console.error('Erreur lors de la réconciliation:', error);
      toast.error('Erreur lors de la réconciliation');
    }
  };

  // Handler pour envoyer une commande par email
  const handleSendOrder = async () => {
    try {
      const selectedSupplier = inlineModals.emailOrderModal.selectedSupplier;
      const selectedWarehouse = inlineModals.emailOrderModal.selectedWarehouse;
      const productsToOrder = toOrderBySupplier[selectedSupplier];
      
      if (!selectedWarehouse) {
        toast.error('Veuillez sélectionner un entrepôt');
        return;
      }
      
      const total = roundToTwoDecimals(productsToOrder.reduce((sum, p) => {
        const qty = inlineModals.emailOrderModal.orderQuantities[p.sku] || p.qtyToOrder;
        return sum + (qty * p.buyPrice);
      }, 0));
      
      const orderData = {
        id: generatePONumber(orders),
        supplier: selectedSupplier,
        warehouseId: selectedWarehouse,
        warehouseName: selectedWarehouse,
        status: 'pending_confirmation',
        total: total,
        createdAt: new Date().toISOString().split('T')[0],
        items: productsToOrder.map(p => ({
          sku: p.sku,
          quantity: inlineModals.emailOrderModal.orderQuantities[p.sku] || p.qtyToOrder,
          pricePerUnit: p.buyPrice
        })),
        notes: ''
      };

      await api.createOrder(orderData);
      await loadData();
      
      // Générer et envoyer l'email
      const emailContent = emailGeneration.generateOrderEmailDraft(
        selectedSupplier,
        productsToOrder,
        selectedWarehouse,
        inlineModals.emailOrderModal.orderQuantities,
        getUserSignature(),
        suppliers,
        warehouses
      );
      
      // Ici vous pouvez ajouter la logique d'envoi d'email
      console.log('📧 Email généré:', emailContent);
      
      inlineModals.emailOrderModal.closeEmailModal();
      toast.success('Commande créée et email généré avec succès !', {
        action: {
          label: 'Voir',
          onClick: () => setActiveTab('track')
        },
        duration: 6000
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création de la commande:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  };

  // Handler pour créer une commande sans email
  const handleCreateOrderWithoutEmail = async () => {
    try {
      const selectedSupplier = inlineModals.emailOrderModal.selectedSupplier;
      const selectedWarehouse = inlineModals.emailOrderModal.selectedWarehouse;
      const productsToOrder = toOrderBySupplier[selectedSupplier];
      
      if (!selectedWarehouse) {
        toast.error('Veuillez sélectionner un entrepôt');
        return;
      }
      
      const total = roundToTwoDecimals(productsToOrder.reduce((sum, p) => {
        const qty = inlineModals.emailOrderModal.orderQuantities[p.sku] || p.qtyToOrder;
        return sum + (qty * p.buyPrice);
      }, 0));
      
      const orderData = {
        id: generatePONumber(orders),
        supplier: selectedSupplier,
        warehouseId: selectedWarehouse,
        warehouseName: selectedWarehouse,
        status: 'pending_confirmation',
        total: total,
        createdAt: new Date().toISOString().split('T')[0],
        items: productsToOrder.map(p => ({
          sku: p.sku,
          quantity: inlineModals.emailOrderModal.orderQuantities[p.sku] || p.qtyToOrder,
          pricePerUnit: p.buyPrice
        })),
        notes: ''
      };

      await api.createOrder(orderData);
      await loadData();
      
      inlineModals.emailOrderModal.closeEmailModal();
      toast.success('Commande créée avec succès !', {
        action: {
          label: 'Voir',
          onClick: () => setActiveTab('track')
        },
        duration: 6000
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création de la commande:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  };

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfilePhoto = async () => {
      try {
        const { getCurrentUserProfile } = await import('./services/profileService');
        const { data } = await getCurrentUserProfile();
        if (!isMounted) return;
        if (data?.photo_url) {
          setProfilePhotoUrl(data.photo_url);
        } else if (data?.photoUrl) {
          setProfilePhotoUrl(data.photoUrl);
        }
      } catch (e) {
        console.warn('Impossible de charger la photo de profil:', e);
      }
    };

    loadProfilePhoto();

    return () => {
      isMounted = false;
    };
  }, []);

  const userDisplayName =
    (currentUser?.firstName && currentUser?.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser?.displayName ||
        currentUser?.user_metadata?.full_name ||
        currentUser?.email ||
        '') || '';

  const userInitials = useMemo(() => {
    if (!userDisplayName) return '';
    const parts = userDisplayName.split(' ').filter(Boolean);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [userDisplayName]);

  const userAvatarUrl =
    profilePhotoUrl ||
    currentUser?.photoURL ||
    currentUser?.avatar_url ||
    currentUser?.user_metadata?.avatar_url ||
    currentUser?.user_metadata?.photoUrl ||
    null;

  const handleOpenProfilePage = () => {
    setActiveTab(MAIN_TABS.PROFILE);
    setIsProfileMenuOpen(false);
  };

  const handleProfileLogout = async () => {
    setIsProfileMenuOpen(false);
    await handleLogout();
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#FAFAF7] flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-12 h-12 text-black mx-auto mb-4" />
          </motion.div>
          <p className="text-lg font-medium text-[#191919]">Chargement depuis Supabase...</p>
        </div>
      </motion.div>
    );
  }

  const currencyCode = deviseDefaut || DEFAULT_PARAMETERS.deviseDefaut;
  const currencySymbol = (CURRENCIES.find(currency => currency.code === currencyCode)?.symbol) || currencyCode;
  const formatWithCurrency = (amount, options) => formatCurrency(amount, currencyCode, options);

  return (
    <CurrencyProvider code={currencyCode}>
      <>
        <Toaster 
          position="top-right" 
          expand={true}
          richColors 
          closeButton
          duration={4000}
        />
        
        {/* Barre horizontale supérieure - Desktop */}
        <div className="hidden md:flex fixed top-0 left-0 right-0 z-[60] bg-[#FAFAF7] border-b border-[#E5E4DF] h-16 items-center">
             {/* Logo centré dans la zone sidebar (w-64 = 256px) */}
             <div className="w-64 flex items-center justify-center shrink-0">
               <Logo size="small" showText={true} theme="light" />
             </div>
             
             {/* SearchBar centrée par rapport à toute la largeur de l'app */}
             <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
               <SearchBar 
                 setActiveTab={setActiveTab}
                 setParametersSubTab={setParametersSubTab}
                 setTrackTabSection={setTrackTabSection}
                 setStockLevelSearch={setStockLevelSearch}
                 onSupplierSelect={(supplierData) => {
                   // Convertir les données Supabase vers le format attendu
                   const supplierForModal = {
                     name: supplierData.nom_fournisseur,
                     email: supplierData.email || '',
                     leadTimeDays: supplierData.lead_time_days || 14,
                     moq: supplierData.moq || 1,
                     notes: supplierData.notes || ''
                   };
                   handleOpenSupplierModal(supplierForModal);
                 }}
               />
             </div>
             
             {/* Notification + Profil à droite */}
             <div className="ml-auto flex items-center gap-4 pr-4 sm:pr-6 lg:pr-8">

                {/* Zone notifications + profil */}
                <div className="flex items-center gap-4">
                  <NotificationBell variant="inline" />
                  
                  {/* Bouton Synchroniser */}
                  <button
                    onClick={syncData}
                    disabled={syncing}
                    className="p-2 rounded-lg hover:bg-[#E5E4DF] transition-colors disabled:opacity-50"
                    aria-label="Synchroniser"
                    title="Synchroniser"
                  >
                    <RefreshCw className={`w-5 h-5 text-[#191919] ${syncing ? 'animate-spin' : ''}`} />
                  </button>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsProfileMenuOpen((open) => !open)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-[#E5E4DF] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#E5E4DF] overflow-hidden flex items-center justify-center text-sm font-semibold text-[#191919]">
                        {userAvatarUrl ? (
                          <img
                            src={userAvatarUrl}
                            alt={userDisplayName || 'Profil'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{userInitials || 'U'}</span>
                        )}
                      </div>
                      <div className="hidden sm:flex flex-col items-start">
                        <span className="text-xs text-[#666663]">Mon profil</span>
                        <span className="text-sm font-medium text-[#191919] truncate max-w-[120px]">
                          {userDisplayName || 'Utilisateur'}
                        </span>
                      </div>
                    </button>

                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#E5E4DF] bg-white shadow-lg py-1 text-sm z-40">
                        <button
                          type="button"
                          onClick={handleOpenProfilePage}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#FAFAF7] text-left text-[#191919]"
                        >
                          <User className="w-4 h-4 text-[#666663]" />
                          <span>Mon profil</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleProfileLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#FAFAF7] text-left text-[#EF1C43]"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Se déconnecter</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
        </div>

        {/* Barre horizontale supérieure - Mobile */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-[#FAFAF7] border-b border-[#E5E4DF] h-16 flex items-center px-4">
          {/* Bouton Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-[#E5E4DF] transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6 text-[#191919]" />
          </button>

          {/* Logo centré */}
          <div className="flex-1 flex items-center justify-center">
            <Logo size="small" showText={true} theme="light" />
          </div>

          {/* Icônes à droite : Recherche + Notification + Sync */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2 rounded-lg hover:bg-[#E5E4DF] transition-colors"
              aria-label="Rechercher"
            >
              <Compass className="w-5 h-5 text-[#191919]" />
            </button>
            <NotificationBell variant="inline" />
            <button
              onClick={syncData}
              disabled={syncing}
              className="p-2 rounded-lg hover:bg-[#E5E4DF] transition-colors disabled:opacity-50"
              aria-label="Synchroniser"
            >
              <RefreshCw className={`w-5 h-5 text-[#191919] ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Modal de recherche mobile */}
        <SearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          setActiveTab={setActiveTab}
          setParametersSubTab={setParametersSubTab}
          setTrackTabSection={setTrackTabSection}
          setStockLevelSearch={setStockLevelSearch}
          onSupplierSelect={(supplierData) => {
            const supplierForModal = {
              name: supplierData.nom_fournisseur,
              email: supplierData.email || '',
              leadTimeDays: supplierData.lead_time_days || 14,
              moq: supplierData.moq || 1,
              notes: supplierData.notes || ''
            };
            handleOpenSupplierModal(supplierForModal);
          }}
        />

        {/* Contenu principal avec sidebar */}
        <div className="min-h-screen bg-[#FAFAF7]">
            {/* Spacer pour compenser la hauteur du menu fixe */}
            <div className="h-16" />

            {/* Sidebar Component - Commence sous le menu horizontal */}
            <Sidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleLogout={handleLogout}
            analyticsSubTab={analyticsSubTab}
            setAnalyticsSubTab={setAnalyticsSubTab}
            aiSubTab={aiSubTab}
            setAiSubTab={setAiSubTab}
            settingsSubTab={parametersSubTab}
            setSettingsSubTab={setParametersSubTab}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            />

            {/* Main Content */}
            <div className="md:ml-64 min-h-screen bg-[#FAFAF7]">
            {/* Content Area */}
            <div className="relative min-h-screen">
              {/* Contenu principal avec padding */}
              <div className="p-4 sm:p-6 lg:p-8 pt-10 sm:pt-12 lg:pt-14">
                <div className="max-w-7xl mx-auto">
                  {/* DASHBOARD TAB */}
                  <AnimatePresence mode="wait">
                  {activeTab === MAIN_TABS.DASHBOARD && (
                    <DashboardTab 
                      productsByStatus={productsByStatus}
                      orders={orders}
                      enrichedProducts={enrichedProducts}
                      onViewDetails={onViewDetails}
                    />
                  )}

                  {/* ONGLET ACTIONS */}
                  {activeTab === MAIN_TABS.ACTIONS && (
                    <ActionsTab
                      productsByStatus={productsByStatus}
                      toOrderBySupplier={toOrderBySupplier}
                      suppliers={suppliers}
                      warehouses={warehouses}
                      orderQuantities={orderQuantities}
                      updateOrderQuantity={updateOrderQuantity}
                      generatePONumber={generatePONumber}
                      orders={orders}
                      handleCreateOrder={handleCreateOrderFromTable}
                      handleOpenEmailModal={handleOpenEmailModal}
                      loadData={loadData}
                      getUserSignature={getUserSignature}
                      // Nouveaux props pour les modals
                      emailModal={emailModal}
                      emailModalHandlers={emailModalHandlers}
                      emailGeneration={emailGeneration}
                      allProducts={enrichedProducts}
                    />
                  )}

                  {/* TRACK & MANAGE TAB */}
                  {activeTab === MAIN_TABS.TRACK && (
                    <TrackTab
                      orders={orders}
                      products={products}
                      trackTabSection={trackTabSection}
                      setTrackTabSection={setTrackTabSection}
                      expandedOrders={expandedOrders}
                      toggleOrderDetails={toggleOrderDetails}
                      confirmOrder={confirmOrder}
                      shipOrder={handleShipOrder}
                      receiveOrder={receiveOrder}
                      suppliers={suppliers}
                      warehouses={warehouses}
                      loadData={loadData}
                      // Nouveaux props pour les modals
                      reconciliationModal={reconciliationModal}
                      reconciliationModalHandlers={reconciliationModalHandlers}
                      reclamationEmailModal={reclamationEmailModal}
                      reclamationEmailModalHandlers={reclamationEmailModalHandlers}
                      reconciliationLogic={reconciliationLogic}
                      emailGeneration={emailGeneration}
                    />
                  )}

                  {/* STOCK TAB */}
                  {activeTab === MAIN_TABS.STOCK && (
                    <StockTab
                      products={enrichedProducts}
                      suppliers={suppliers}
                      orders={orders}
                      stockLevelFilter={stockLevelFilter}
                      setStockLevelFilter={setStockLevelFilter}
                      stockLevelSupplierFilter={stockLevelSupplierFilter}
                      setStockLevelSupplierFilter={setStockLevelSupplierFilter}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      onViewDetails={onViewDetails}
                    />
                  )}

                  {/* ANALYTICS TAB */}
                  {activeTab === MAIN_TABS.ANALYTICS && (
                    <AnalyticsTab
                      products={enrichedProducts}
                      orders={orders}
                      suppliers={suppliers}
                      warehouses={warehouses}
                      seuilSurstockProfond={seuilSurstockProfond}
                    />
                  )}

                  {/* AI TAB */}
                  {activeTab === MAIN_TABS.AI && (
                    <AITab
                      products={products}
                      orders={orders}
                      aiSubTab={aiSubTab}
                      setAiSubTab={setAiSubTab}
                    />
                  )}

                  {/* HISTORY TAB */}
                  {activeTab === MAIN_TABS.HISTORY && (
                    <HistoryTab
                      orders={orders}
                      products={products}
                      suppliers={suppliers}
                      warehouses={warehouses}
                      historyFilter={historyFilter}
                      setHistoryFilter={setHistoryFilter}
                      historyDateStart={historyDateStart}
                      setHistoryDateStart={setHistoryDateStart}
                      historyDateEnd={historyDateEnd}
                      setHistoryDateEnd={setHistoryDateEnd}
                      expandedOrders={expandedOrders}
                      toggleOrderDetails={toggleOrderDetails}
                    />
                  )}

                  {/* SETTINGS TAB */}
                  {activeTab === MAIN_TABS.SETTINGS && (
                    <SettingsTab
                      parametersSubTab={parametersSubTab}
                      setParametersSubTab={setParametersSubTab}
                      products={products}
                      suppliers={suppliers}
                      warehouses={warehouses}
                      parameters={parameters}
                      setParameters={setParameters}
                      loadData={loadData}
                      // Props pour ParametresGeneraux
                      seuilSurstockProfond={seuilSurstockProfond}
                      onUpdateSeuilSurstock={handleUpdateSeuilSurstock}
                      deviseDefaut={deviseDefaut}
                      onUpdateDevise={handleUpdateDevise}
                      multiplicateurDefaut={multiplicateurDefaut}
                      onUpdateMultiplicateur={handleUpdateMultiplicateur}
                      // Props pour GestionFournisseurs
                      supplierModalOpen={supplierModalOpen}
                      setSupplierModalOpen={setSupplierModalOpen}
                      editingSupplier={editingSupplier}
                      setEditingSupplier={setEditingSupplier}
                      supplierFormData={supplierFormData}
                      setSupplierFormData={setSupplierFormData}
                      handleOpenSupplierModal={handleOpenSupplierModal}
                      handleCloseSupplierModal={handleCloseSupplierModal}
                      handleSupplierFormChange={handleSupplierFormChange}
                      handleSaveSupplier={handleSaveSupplier}
                      handleDeleteSupplier={handleDeleteSupplier}
                      // Props pour MappingSKUFournisseur
                      assignSupplierModalOpen={assignSupplierModalOpen}
                      setAssignSupplierModalOpen={setAssignSupplierModalOpen}
                      selectedProductForMapping={selectedProductForMapping}
                      setSelectedProductForMapping={setSelectedProductForMapping}
                      handleSaveSupplierMapping={handleSaveSupplierMapping}
                      isSavingSupplierMapping={isSavingSupplierMapping}
                      // Props pour GestionWarehouses
                      warehouseModalOpen={warehouseModalOpen}
                      setWarehouseModalOpen={setWarehouseModalOpen}
                      editingWarehouse={editingWarehouse}
                      setEditingWarehouse={setEditingWarehouse}
                      warehouseFormData={warehouseFormData}
                      setWarehouseFormData={setWarehouseFormData}
                      handleOpenWarehouseModal={handleOpenWarehouseModal}
                      handleCloseWarehouseModal={handleCloseWarehouseModal}
                      handleWarehouseFormChange={handleWarehouseFormChange}
                      handleSaveWarehouse={handleSaveWarehouse}
                      handleDeleteWarehouse={handleDeleteWarehouse}
                    />
                  )}

                  {/* PROFILE TAB */}
                  {activeTab === MAIN_TABS.PROFILE && (
                    <ProfilePage />
                  )}

                  </AnimatePresence>
                </div> {/* Fin max-w-7xl mx-auto */}
              </div> {/* Fin contenu principal avec padding */}
              </div> {/* Fin Content Area relative */}
            </div> {/* Fin Main Content md:ml-64 */}
          </div> {/* Fin min-h-screen */}

          {/* ============================================
              MODALS
          ============================================ */}
          
          {/* Modal de réconciliation */}
          <ReconciliationModal
            isOpen={reconciliationModal.isOpen}
            onClose={reconciliationModalHandlers.close}
            order={reconciliationModal.data.order}
            products={products}
            onConfirm={handleReconciliationConfirm}
          />

          {/* Modal d'email de réclamation */}
          <ReclamationEmailModal
            isOpen={reclamationEmailModal.isOpen}
            onClose={reclamationEmailModalHandlers.close}
            order={reclamationEmailModal.data.order}
            emailContent={reclamationEmailModal.data.emailContent}
            onCopy={emailGeneration.copyToClipboard}
          />

          {/* Modal d'expédition */}
          <ShipOrderModal
            isOpen={shipOrderModal.isOpen}
            onClose={shipOrderModal.closeModal}
            onConfirm={handleConfirmShipOrder}
            trackingNumber={shipOrderModal.trackingNumber}
            setTrackingNumber={shipOrderModal.setTrackingNumber}
            trackingUrl={shipOrderModal.trackingUrl}
            setTrackingUrl={shipOrderModal.setTrackingUrl}
          />

          {/* Modal de gestion des fournisseurs */}
          <SupplierModal
            isOpen={supplierModalOpen}
            onClose={handleCloseSupplierModal}
            formData={supplierFormData}
            onChange={handleSupplierFormChange}
            onSave={handleSaveSupplier}
            isEditing={!!editingSupplier}
          />

          {/* Modal d'assignation de fournisseur */}
          <AssignSupplierModal
            isOpen={assignSupplierModalOpen}
            onClose={handleCloseAssignSupplierModal}
            product={productToMap}
            suppliers={suppliers}
            selectedSupplier={selectedSupplierForMapping}
            onSupplierChange={setSelectedSupplierForMapping}
            onAssign={handleAssignSupplier}
          />

          {/* Conteneur des modales inline */}
          <InlineModalsContainer
            emailOrderModal={inlineModals.emailOrderModal}
            warehouses={warehouses}
            toOrderBySupplier={toOrderBySupplier}
            emailGeneration={emailGeneration}
            getUserSignature={getUserSignature}
            handleCreateOrderWithoutEmail={handleCreateOrderWithoutEmail}
            handleSendOrder={handleSendOrder}
            suppliers={suppliers}
            reconciliationModal={inlineModals.reconciliationModal}
            products={products}
            confirmReconciliationWithQuantities={confirmReconciliationWithQuantities}
            reclamationEmailModal={inlineModals.reclamationEmailModal}
          />
        </>
      </CurrencyProvider>
  );
};

export default StockEasy;
