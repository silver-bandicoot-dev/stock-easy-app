import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Package, Bell, Mail, X, Check, Truck, Clock, AlertCircle, CheckCircle, Eye, Settings, Info, Edit2, Activity, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Upload, FileText, Calendar, RefreshCw, Plus, User, LogOut, Warehouse, Brain, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import NotificationBell from './components/notifications/NotificationBell';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash.debounce';
import api from './services/apiService';
import { InfoTooltip, tooltips } from './components/ui/InfoTooltip';
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

import Sidebar from './components/layout/Sidebar';
import { useAnalytics } from './hooks/useAnalytics';
import { checkAndSaveKPISnapshot } from './utils/kpiScheduler';
import { generateInsights } from './utils/insightGenerator';
import { calculateMetrics } from './utils/calculations';
import { formatUnits, formatPrice, roundToTwoDecimals, roundToInteger } from './utils/decimalUtils';

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

// ============================================
// IMPORTS DES HOOKS PERSONNALISÉS
// ============================================
import { useStockData } from './hooks/useStockData';
import { useOrderManagement } from './hooks/useOrderManagement';
import { useSupplierManagement } from './hooks/useSupplierManagement';

// ============================================
// FONCTIONS API - Importées depuis apiService
// ============================================
// L'objet 'api' est maintenant importé depuis './services/apiService'
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
    loadData,
    syncData
  } = useStockData();
  
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
    editingSupplier,
    supplierFormData,
    handleOpenSupplierModal,
    handleCloseSupplierModal,
    handleSupplierFormChange,
    handleSaveSupplier,
    handleDeleteSupplier
  } = useSupplierManagement(suppliers, loadData);

  // États restants pour l'UI et la navigation
  const [activeTab, setActiveTab] = useState(MAIN_TABS.DASHBOARD);
  const [trackTabSection, setTrackTabSection] = useState(TRACK_TABS.EN_COURS_COMMANDE);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [orderCreationModalOpen, setOrderCreationModalOpen] = useState(false);
  const [selectedProductsFromTable, setSelectedProductsFromTable] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [receivingModalOpen, setReceivingModalOpen] = useState(false);
  const [receivingProducts, setReceivingProducts] = useState([]);
  const [tempReceivedQty, setTempReceivedQty] = useState({});
  const [editingParam, setEditingParam] = useState(null);
  const [tempParamValue, setTempParamValue] = useState('');
  const [reconciliationModalOpen, setReconciliationModalOpen] = useState(false);
  const [reconciliationOrder, setReconciliationOrder] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [customRange, setCustomRange] = useState(null);
  const [comparisonType, setComparisonType] = useState('previous');
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyDateStart, setHistoryDateStart] = useState('');
  
  // Stock Level filters
  const [stockLevelFilter, setStockLevelFilter] = useState(STOCK_FILTERS.ALL);
  const [stockLevelSupplierFilter, setStockLevelSupplierFilter] = useState('all');
  const [stockLevelSearch, setStockLevelSearch] = useState('');
  const [historyDateEnd, setHistoryDateEnd] = useState('');
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [discrepancyItems, setDiscrepancyItems] = useState({});
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [damageItems, setDamageItems] = useState({});
  const [damageNotes, setDamageNotes] = useState('');
  // NOUVEAU: Modal unifié pour réconciliation complète
  const [unifiedReconciliationModalOpen, setUnifiedReconciliationModalOpen] = useState(false);
  const [unifiedReconciliationItems, setUnifiedReconciliationItems] = useState({});
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [reclamationEmailModalOpen, setReclamationEmailModalOpen] = useState(false);
  const [reclamationEmailContent, setReclamationEmailContent] = useState('');
  const [currentReclamationOrder, setCurrentReclamationOrder] = useState(null);

  // NOUVEAUX ÉTATS pour les sous-onglets de Paramètres
  const [parametersSubTab, setParametersSubTab] = useState(SETTINGS_TABS.GENERAL);
  const [analyticsSubTab, setAnalyticsSubTab] = useState(ANALYTICS_TABS.KPIS);
  const [aiSubTab, setAiSubTab] = useState(AI_TABS.OVERVIEW);
  
  // NOUVEAUX ÉTATS pour CORRECTION 5 et 6
  const [discrepancyTypes, setDiscrepancyTypes] = useState({});
  const [damagedQuantities, setDamagedQuantities] = useState({});
  const [unsavedParameterChanges, setUnsavedParameterChanges] = useState({});
  const [isSavingParameters, setIsSavingParameters] = useState(false);


  // CORRECTION 3: Gestion de l'expansion des détails de commandes
  const [expandedOrders, setExpandedOrders] = useState({});

  // NOUVEAUX ÉTATS pour Paramètres Généraux
  const [seuilSurstockProfond, setSeuilSurstockProfond] = useState(90);
  const [deviseDefaut, setDeviseDefaut] = useState('EUR');
  const [multiplicateurDefaut, setMultiplicateurDefaut] = useState(1.2);

  // NOUVEAUX ÉTATS pour Mapping
  const [assignSupplierModalOpen, setAssignSupplierModalOpen] = useState(false);
  const [productToMap, setProductToMap] = useState(null);
  const [selectedSupplierForMapping, setSelectedSupplierForMapping] = useState('');

  // ============================================
  // HANDLERS PARAMÈTRES GÉNÉRAUX
  // ============================================

  const handleUpdateSeuilSurstock = async (newValue) => {
    try {
      await api.updateParameter('SeuilSurstockProfond', newValue);
      setSeuilSurstockProfond(newValue);
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
        toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas configurée dans Google Apps Script', {
          description: 'Consultez le fichier GOOGLE_APPS_SCRIPT_BACKEND_V1.md pour ajouter cette fonction',
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
      await api.updateParameter('DeviseDefaut', newDevise);
      setDeviseDefaut(newDevise);
      console.log(`✅ Devise mise à jour : ${newDevise}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour devise:', error);
      if (error.message?.includes('Action non reconnue') || error.message?.includes('Action inconnue')) {
        toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas configurée dans Google Apps Script', {
          description: 'Consultez le fichier GOOGLE_APPS_SCRIPT_BACKEND_V1.md pour ajouter cette fonction',
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
      await api.updateParameter('MultiplicateurDefaut', newValue);
      setMultiplicateurDefaut(newValue);
      console.log(`✅ Multiplicateur mis à jour : ${newValue}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour multiplicateur:', error);
      if (error.message?.includes('Action non reconnue') || error.message?.includes('Action inconnue')) {
        toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas configurée dans Google Apps Script', {
          description: 'Consultez le fichier GOOGLE_APPS_SCRIPT_BACKEND_V1.md pour ajouter cette fonction',
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
      await api.deleteWarehouse(warehouse.name);
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
    if (!selectedSupplierForMapping) {
      toast.warning('Veuillez sélectionner un fournisseur');
      return;
    }
    
    try {
      await api.assignSupplierToProduct(productToMap.sku, selectedSupplierForMapping);
      console.log(`✅ Fournisseur assigné à ${productToMap.sku}`);
      await loadData();
      handleCloseAssignSupplierModal();
    } catch (error) {
      console.error('❌ Erreur assignation fournisseur:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  };

  const handleRemoveSupplierFromProduct = async (sku) => {
    const confirm = window.confirm(
      `⚠️ Retirer le fournisseur de ce produit ?\n\n` +
      `Le produit n'aura plus de fournisseur assigné.`
    );
    
    if (!confirm) return;
    
    try {
      await api.removeSupplierFromProduct(sku);
      console.log(`✅ Fournisseur retiré de ${sku}`);
      await loadData();
    } catch (error) {
      console.error('❌ Erreur suppression assignation:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const enrichedProducts = useMemo(() => products.map(p => calculateMetrics(p, seuilSurstockProfond)), [products, seuilSurstockProfond]);

  const productsByStatus = useMemo(() => {
    return {
      to_order: enrichedProducts.filter(p => p.qtyToOrder > 0),
      watch: enrichedProducts.filter(p => p.qtyToOrder === 0 && p.stock < p.reorderPoint * 1.2),
      in_transit: enrichedProducts.filter(p => {
        return orders.some(o => 
          o.status === 'in_transit' && 
          o.items.some(item => item.sku === p.sku)
        );
      }),
      received: enrichedProducts.filter(p => {
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

  // CALCUL DES VRAIS KPIs ANALYTICS avec historique Firestore
  const analyticsData = useAnalytics(enrichedProducts, orders, dateRange, customRange, comparisonType);
  
  // Génération des insights actionnables basés sur les KPIs
  const insights = useMemo(() => {
    if (analyticsData.loading || analyticsData.error || !analyticsData.skuAvailability) {
      console.log('⚠️ Pas de données analytics pour générer les insights');
      return [];
    }
    return generateInsights(analyticsData, enrichedProducts, orders, setActiveTab);
  }, [analyticsData, enrichedProducts, orders, setActiveTab]);
  
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
      checkAndSaveKPISnapshot(currentUser.uid, enrichedProducts, orders)
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
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Erreurs: ${errors.map(e => e.error).join(', ')}`);
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
      return `- ${p.name} (SKU: ${p.sku}) - Quantité: ${qty} unités - Prix unitaire: ${roundToTwoDecimals(p.buyPrice).toFixed(2)}€`;
    }).join('\n');
    
    const total = roundToTwoDecimals(products.reduce((sum, p) => {
      const qty = orderQuantities[p.sku] || p.qtyToOrder;
      return sum + (qty * p.buyPrice);
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

TOTAL: ${total.toFixed(2)}€${warehouseInfo}

Merci de nous confirmer la disponibilité et la date de livraison estimée.

Conditions habituelles: ${supplierInfo.leadTimeDays} jours - MOQ respecté

Cordialement,
${getUserSignature()}`
    };
  };


  const sendOrder = async () => {
    try {
      const productsToOrder = toOrderBySupplier[selectedSupplier];
      const total = roundToTwoDecimals(productsToOrder.reduce((sum, p) => {
        const qty = orderQuantities[p.sku] || p.qtyToOrder;
        return sum + (qty * p.buyPrice);
      }, 0));
      
      const orderData = {
        id: generatePONumber(),
        supplier: selectedSupplier,
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
      
      toast.success('Commande créée et sauvegardée dans Google Sheets !', {
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
      const productsToOrder = toOrderBySupplier[selectedSupplier];
      const total = roundToTwoDecimals(productsToOrder.reduce((sum, p) => {
        const qty = orderQuantities[p.sku] || p.qtyToOrder;
        return sum + (qty * p.buyPrice);
      }, 0));
      
      const orderData = {
        id: generatePONumber(),
        supplier: selectedSupplier,
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
        const total = roundToTwoDecimals(products.reduce((sum, p) => sum + (p.orderQuantity * p.buyPrice), 0));
        
        const orderData = {
          id: generatePONumber(),
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


  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };


  
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
    
    setDiscrepancyItems(initialItems);
    setDiscrepancyTypes(initialTypes);
    setDamagedQuantities(initialDamaged);
    setReconciliationModalOpen(true);
  };
  
  const updateDiscrepancyItem = (sku, field, value, orderedQuantity) => {
    setDiscrepancyItems(prev => ({
      ...prev,
      [sku]: {
        ...prev[sku],
        [field]: value
      }
    }));
  };
  
  const confirmReconciliationWithQuantities = async () => {
    try {
      if (!reconciliationOrder) return;
      
      console.log('🔍 Début de la réconciliation:', reconciliationOrder.id);
      console.log('Quantités reçues:', discrepancyItems);
      console.log('Types de problèmes:', discrepancyTypes);
      console.log('Quantités endommagées:', damagedQuantities);
      
      // Préparer les items avec quantités et types de problèmes
      const updatedItems = reconciliationOrder.items.map(item => {
        const receivedQty = parseInt(discrepancyItems[item.sku]?.received, 10);
        const damagedQty = parseInt(damagedQuantities[item.sku] || 0, 10);
        const notes = discrepancyItems[item.sku]?.notes || '';
        
        // Validation
        if (isNaN(receivedQty) || receivedQty < 0) {
          throw new Error(`Quantité invalide pour ${item.sku}`);
        }
        if (isNaN(damagedQty) || damagedQty < 0) {
          throw new Error(`Quantité endommagée invalide pour ${item.sku}`);
        }
        
        // Calculer le total reçu (sain + endommagé)
        const totalReceived = receivedQty + damagedQty;
        
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
      
      // Sauvegarder dans la base de données
      const updatePayload = {
        status: hasProblems ? 'reconciliation' : 'completed',
        receivedAt: new Date().toISOString().split('T')[0],
        hasDiscrepancy: hasProblems,
        items: updatedItems
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
      setDiscrepancyItems({});
      setDamagedQuantities({});
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
      const discrepancyList = Object.entries(discrepancyItems)
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
        const receivedQty = discrepancyItems[item.sku]?.received;
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
      const stockUpdates = Object.entries(discrepancyItems).map(([sku, data]) => {
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
      setDiscrepancyItems({});
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
        
        return {
          sku: item.sku,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          receivedQuantity: receivedQty,
          damagedQuantity: damagedQty,
          validatedQuantity: validatedQty,
          quantityDiscrepancy: item.quantity - receivedQty
        };
      });

      console.log('=== DEBUG RÉCONCILIATION UNIFIÉE ===');
      console.log('Items mis à jour:', updatedItems);
      
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
        items: updatedItems
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
    
    let email = `Objet: Réclamation - Commande ${order.id}\n\n`;
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
    const headers = ['N° Commande', 'Fournisseur', 'Date Création', 'Date Confirmation', 'Date Expédition', 'Date Réception', 'Statut', 'SKU', 'Nom Produit', 'Quantité', 'Prix Unitaire (€)', 'Total Ligne (€)', 'Total Commande (€)', 'Suivi'];
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
          roundToTwoDecimals(item.pricePerUnit).toFixed(2),
          lineTotal.toFixed(2),
          // Afficher le total de la commande seulement sur la première ligne de chaque commande
          index === 0 ? roundToTwoDecimals(order.total).toFixed(2) : '',
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

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#F0F0EB] flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-12 h-12 text-black mx-auto mb-4" />
          </motion.div>
          <p className="text-lg font-medium text-[#191919]">Chargement depuis Google Sheets...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right" 
        expand={true}
        richColors 
        closeButton
        duration={4000}
      />
      <div className="min-h-screen bg-[#F0F0EB]">
        {/* Sidebar Component */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
          syncData={syncData}
          syncing={syncing}
          analyticsSubTab={analyticsSubTab}
          setAnalyticsSubTab={setAnalyticsSubTab}
          aiSubTab={aiSubTab}
          setAiSubTab={setAiSubTab}
        />

        {/* Main Content - Pleine hauteur avec padding pour sidebar desktop */}
        <div className="md:ml-64 min-h-screen">
          {/* Spacer pour le header mobile uniquement */}
          <div className="md:hidden h-[72px]" />
          
          
          {/* Content Area avec NotificationBell intégré */}
          <div className="relative min-h-screen">
            {/* NotificationBell flottant en haut à droite avec fond - Masqué sur mobile */}
            <div className="hidden md:block absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
              <div className="bg-white rounded-lg shadow-md p-2">
                <NotificationBell />
              </div>
            </div>

            {/* Contenu principal avec padding */}
            <div className="p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20">

      <div className="max-w-7xl mx-auto">
        
        {/* DASHBOARD TAB */}
        <AnimatePresence mode="wait">
          {activeTab === MAIN_TABS.DASHBOARD && (
            <DashboardTab 
              productsByStatus={productsByStatus}
              orders={orders}
              setActiveTab={setActiveTab}
              setTrackTabSection={setTrackTabSection}
            />
          )}

          {/* ONGLET ACTIONS */}
          {activeTab === MAIN_TABS.ACTIONS && (
            <ActionsTab
              productsByStatus={productsByStatus}
              toOrderBySupplier={toOrderBySupplier}
              suppliers={suppliers}
              warehouses={warehouses}
              selectedWarehouse={selectedWarehouse}
              setSelectedWarehouse={setSelectedWarehouse}
              orderQuantities={orderQuantities}
              updateOrderQuantity={updateOrderQuantity}
              generatePONumber={generatePONumber}
              orders={orders}
              handleCreateOrder={handleCreateOrderFromTable}
              handleOpenEmailModal={openEmailModal}
              orderCreationModalOpen={orderCreationModalOpen}
              setOrderCreationModalOpen={setOrderCreationModalOpen}
              selectedProductsFromTable={selectedProductsFromTable}
              setSelectedProductsFromTable={setSelectedProductsFromTable}
            />
          )}

          {/* TRACK & MANAGE TAB */}
          {activeTab === MAIN_TABS.TRACK && (
            <TrackTab
              orders={orders}
              trackTabSection={trackTabSection}
              setTrackTabSection={setTrackTabSection}
              expandedOrders={expandedOrders}
              toggleOrderDetails={toggleOrderDetails}
              confirmOrder={confirmOrder}
              shipOrder={shipOrder}
              receiveOrder={receiveOrder}
              reconciliationOrder={reconciliationOrder}
              setReconciliationOrder={setReconciliationOrder}
              reconciliationModalOpen={reconciliationModalOpen}
              setReconciliationModalOpen={setReconciliationModalOpen}
              openReconciliationModal={openReconciliationModal}
              receivedQuantities={receivedQuantities}
              setReceivedQuantities={setReceivedQuantities}
              discrepancyTypes={discrepancyTypes}
              setDiscrepancyTypes={setDiscrepancyTypes}
              damagedQuantities={damagedQuantities}
              setDamagedQuantities={setDamagedQuantities}
              discrepancyModalOpen={discrepancyModalOpen}
              setDiscrepancyModalOpen={setDiscrepancyModalOpen}
              damageModalOpen={damageModalOpen}
              setDamageModalOpen={setDamageModalOpen}
              unifiedReconciliationModalOpen={unifiedReconciliationModalOpen}
              setUnifiedReconciliationModalOpen={setUnifiedReconciliationModalOpen}
              currentReclamationOrder={currentReclamationOrder}
              setCurrentReclamationOrder={setCurrentReclamationOrder}
              reclamationEmailModalOpen={reclamationEmailModalOpen}
              setReclamationEmailModalOpen={setReclamationEmailModalOpen}
              loadData={loadData}
            />
          )}

          {/* STOCK TAB */}
          {activeTab === MAIN_TABS.STOCK && (
            <StockTab
              products={products}
              suppliers={suppliers}
              stockLevelFilter={stockLevelFilter}
              setStockLevelFilter={setStockLevelFilter}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          )}

          {/* ANALYTICS TAB */}
          {activeTab === MAIN_TABS.ANALYTICS && (
            <AnalyticsTab
              products={products}
              orders={orders}
              suppliers={suppliers}
              warehouses={warehouses}
              dateRange={dateRange}
              setDateRange={setDateRange}
              comparisonPeriod={comparisonPeriod}
              setComparisonPeriod={setComparisonPeriod}
            />
          )}

        </div> {/* Fin contenu principal avec padding */}
      </div> {/* Fin Content Area relative */}
    </div> {/* Fin Main Content md:ml-64 */}
  </div> {/* Fin min-h-screen */}
</>
);
};

export default StockEasy;
