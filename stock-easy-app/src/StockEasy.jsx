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

  // CORRECTION 1: Gestion des quantités éditables dans la modal de commande
  const [selectedProductsFromTable, setSelectedProductsFromTable] = useState(new Map());

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

  const generatePONumber = () => {
    // Trouve le numéro PO le plus élevé actuel
    const poNumbers = orders
      .map(o => {
        const match = o.id.match(/^PO-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);
    
    const nextNumber = poNumbers.length > 0 ? Math.max(...poNumbers) + 1 : 1;
    return `PO-${String(nextNumber).padStart(3, '0')}`;
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

  const confirmOrder = async (orderId) => {
    try {
      const confirmedAt = new Date().toISOString();
      console.log('Confirmation commande:', orderId, 'Date:', confirmedAt);
      
      await api.updateOrderStatus(orderId, {
        status: 'preparing',
        confirmedAt: confirmedAt
      });
      
      await loadData();
      toast.success('Commande confirmée et en cours de préparation!');
    } catch (error) {
      console.error('❌ Erreur confirmation:', error);
      toast.error('Erreur lors de la confirmation');
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const shipOrder = async (orderId) => {
    const tracking = prompt('Entrez le numéro de suivi (optionnel - laissez vide pour passer):');
    // Tracking optionnel - on peut continuer même sans numéro
    try {
      await api.updateOrderStatus(orderId, {
        status: 'in_transit',
        shippedAt: new Date().toISOString().split('T')[0],
        trackingNumber: tracking || ''
      });
      await loadData();
      console.log('✅ Commande expédiée');
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const receiveOrder = async (orderId) => {
    try {
      console.log('📦 Confirmation de réception de la commande:', orderId);
      
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        toast.error('Commande introuvable');
        return;
      }

      // Simplement changer le statut à 'received' sans ouvrir la modale
      await api.updateOrderStatus(orderId, {
        status: 'received',
        receivedAt: new Date().toISOString().split('T')[0]
      });

      // Recharger les données pour mettre à jour l'affichage
      await loadData();

      toast.success(`Commande ${orderId} marquée comme reçue !`, {
        description: 'Vous pouvez maintenant valider les quantités reçues.',
        duration: 4000
      });

      // Changer automatiquement vers l'onglet "Commandes Reçues"
      setTrackTabSection('commandes_recues');

    } catch (error) {
      console.error('❌ Erreur lors de la confirmation de réception:', error);
      toast.error('Erreur lors de la confirmation: ' + error.message);
    }
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
              handleCreateOrder={handleCreateOrder}
              handleOpenEmailModal={handleOpenEmailModal}
              orderCreationModalOpen={orderCreationModalOpen}
              setOrderCreationModalOpen={setOrderCreationModalOpen}
              selectedProductsFromTable={selectedProductsFromTable}
              setSelectedProductsFromTable={setSelectedProductsFromTable}
            />
          )}

          {/* TRACK & MANAGE TAB */}
          {activeTab === MAIN_TABS.TRACK && (
            <motion.div
              key="track"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6">
            
            {/* Header avec titre et sous-titre */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="w-8 h-8 text-[#191919]" />
                <h1 className="text-2xl font-bold text-[#191919]">Track & Manage</h1>
              </div>
              <p className="text-[#666663] ml-11">Suivez vos commandes et gérez les réceptions</p>
              
              {/* Onglets de navigation - Optimisés mobile */}
              <div className="flex gap-2 mt-6 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
                <button
                  onClick={() => setTrackTabSection('en_cours_commande')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                    trackTabSection === 'en_cours_commande'
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                  }`}
                >
                  <span className="hidden sm:inline">En Cours de Commande</span>
                  <span className="sm:hidden">En Cours</span>
                  <span className="ml-1">({orders.filter(o => o.status === 'pending_confirmation').length})</span>
                </button>
                <button
                  onClick={() => setTrackTabSection('preparation')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                    trackTabSection === 'preparation'
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                  }`}
                >
                  <span className="hidden sm:inline">En cours de préparation</span>
                  <span className="sm:hidden">Préparation</span>
                  <span className="ml-1">({orders.filter(o => o.status === 'preparing').length})</span>
                </button>
                <button
                  onClick={() => setTrackTabSection('en_transit')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                    trackTabSection === 'en_transit'
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                  }`}
                >
                  En Transit ({orders.filter(o => o.status === 'in_transit').length})
                </button>
                <button
                  onClick={() => setTrackTabSection('commandes_recues')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                    trackTabSection === 'commandes_recues'
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                  }`}
                >
                  <span className="hidden sm:inline">Commandes Reçues</span>
                  <span className="sm:hidden">Reçues</span>
                  <span className="ml-1">({orders.filter(o => o.status === 'received').length})</span>
                </button>
                <button
                  onClick={() => setTrackTabSection('reconciliation')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                    trackTabSection === 'reconciliation'
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                  }`}
                >
                  Réconciliation ({orders.filter(o => o.status === 'reconciliation').length})
                </button>
              </div>
            </div>

            {/* Contenu de chaque section */}
            {trackTabSection === 'en_cours_commande' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-[#191919]">En Cours de Commande</h2>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'pending_confirmation').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande en attente</p>
                ) : (
                  orders.filter(o => o.status === 'pending_confirmation').map(order => (
                    <div key={order.id} className="bg-[#FAFAF7] rounded-lg border border-[#E5E4DF] overflow-hidden">
                      {/* Header de la commande - Cliquable - Optimisé mobile */}
                      <div 
                        className="p-3 sm:p-4 cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <div className="space-y-3">
                          {/* Ligne 1: N° PO + Chevron */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-bold text-[#191919] text-sm sm:text-base">{order.id}</span>
                              <motion.div
                                animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="shrink-0"
                              >
                                <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                              </motion.div>
                            </div>
                          </div>
                          
                          {/* Ligne 2: Fournisseur */}
                          <div className="flex items-center gap-2">
                            <span className="text-[#666663] text-xs sm:text-sm">Fournisseur:</span>
                            <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.supplier}</span>
                          </div>
                          
                          {/* Ligne 3: Entrepôt */}
                          {(order.warehouseName || order.warehouseId) && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#666663] text-xs sm:text-sm">Entrepôt de livraison:</span>
                              <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.warehouseName || order.warehouseId}</span>
                            </div>
                          )}
                          
                          {/* Ligne 4: Infos */}
                          <div className="text-xs sm:text-sm space-y-1">
                            <div>
                              <span className="text-[#666663]">Date: </span>
                              <span className="text-[#191919]">{formatConfirmedDate(order.createdAt)}</span>
                            </div>
                            <div>
                              <span className="text-[#666663]">Total: </span>
                              <span className="text-[#191919] font-bold">{roundToTwoDecimals(order.total).toFixed(2)}€</span>
                            </div>
                          </div>
                          
                          {/* Bouton d'action */}
                          <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="success"
                              size="sm"
                              icon={Check}
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmOrder(order.id);
                              }}
                              className="w-full sm:w-auto"
                            >
                              <span className="hidden sm:inline">Confirmer réception email</span>
                              <span className="sm:hidden">Confirmer réception</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Détails des produits - Expansible */}
                      <AnimatePresence>
                        {expandedOrders[order.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#E5E4DF] bg-white"
                          >
                            <div className="p-4">
                              <h4 className="font-semibold text-sm text-[#666663] mb-3">Produits commandés:</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                  const product = products.find(p => p.sku === item.sku);
                                  return (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-[#FAFAF7] rounded border border-[#E5E4DF]">
                                      <div className="flex-1">
                                        <div className="font-medium text-[#191919] text-sm">
                                          {product?.name || item.sku}
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          SKU: {item.sku}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-[#191919]">
                                          {formatUnits(item.quantity)} unités
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          {roundToTwoDecimals(item.pricePerUnit).toFixed(2)}€/unité
                                        </div>
                                      </div>
                                      <div className="ml-4 text-right font-bold text-[#191919] min-w-[80px]">
                                        {roundToTwoDecimals(item.quantity * item.pricePerUnit).toFixed(2)}€
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 pt-3 border-t border-[#E5E4DF] flex justify-between">
                                <span className="font-semibold text-[#666663]">Total:</span>
                                <span className="font-bold text-[#191919] text-lg">{roundToTwoDecimals(order.total).toFixed(2)}€</span>
                              </div>
                              
                              {/* Section Commentaires */}
                              <div className="mt-6 pt-6 border-t border-[#E5E4DF]">
                                <CommentSection 
                                  purchaseOrderId={order.id}
                                  purchaseOrderNumber={order.id}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            {/* En cours de préparation */}
            {trackTabSection === 'preparation' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#64A4F2] shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-[#191919]">En cours de préparation</h2>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'preparing').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande en préparation</p>
                ) : (
                  orders.filter(o => o.status === 'preparing').map(order => (
                    <div key={order.id} className="bg-[#FAFAF7] rounded-lg border border-[#E5E4DF] overflow-hidden">
                      {/* Header de la commande - Cliquable - Optimisé mobile */}
                      <div 
                        className="p-3 sm:p-4 cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <div className="space-y-3">
                          {/* Ligne 1: N° PO + Chevron */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-bold text-[#191919] text-sm sm:text-base">{order.id}</span>
                              <motion.div
                                animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="shrink-0"
                              >
                                <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                              </motion.div>
                            </div>
                          </div>
                          
                          {/* Ligne 2: Fournisseur */}
                          <div className="flex items-center gap-2">
                            <span className="text-[#666663] text-xs sm:text-sm">Fournisseur:</span>
                            <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.supplier}</span>
                          </div>
                          
                          {/* Ligne 3: Entrepôt */}
                          {(order.warehouseName || order.warehouseId) && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#666663] text-xs sm:text-sm">Entrepôt de livraison:</span>
                              <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.warehouseName || order.warehouseId}</span>
                            </div>
                          )}
                          
                          {/* Ligne 4: Infos */}
                          <div className="text-xs sm:text-sm space-y-1">
                            <div>
                              <span className="text-[#666663]">Date création: </span>
                              <span className="text-[#191919]">{formatConfirmedDate(order.createdAt)}</span>
                            </div>
                            {order.confirmedAt && (
                              <div className="text-green-600">
                                ✓ Confirmée le {formatConfirmedDate(order.confirmedAt)}
                              </div>
                            )}
                            <div>
                              <span className="text-[#666663]">Total: </span>
                              <span className="text-[#191919] font-bold">{roundToTwoDecimals(order.total).toFixed(2)}€</span>
                            </div>
                          </div>
                          
                          {/* Bouton d'action */}
                          <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Truck}
                              onClick={(e) => {
                                e.stopPropagation();
                                shipOrder(order.id);
                              }}
                              className="w-full sm:w-auto"
                            >
                              <span className="hidden sm:inline">Marquer comme expédiée</span>
                              <span className="sm:hidden">Expédiée</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Détails des produits - Expansible */}
                      <AnimatePresence>
                        {expandedOrders[order.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#E5E4DF] bg-white"
                          >
                            <div className="p-4">
                              <h4 className="font-semibold text-sm text-[#666663] mb-3">Produits commandés:</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                  const product = products.find(p => p.sku === item.sku);
                                  return (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-[#FAFAF7] rounded border border-[#E5E4DF]">
                                      <div className="flex-1">
                                        <div className="font-medium text-[#191919] text-sm">
                                          {product?.name || item.sku}
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          SKU: {item.sku}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-[#191919]">
                                          {formatUnits(item.quantity)} unités
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          {roundToTwoDecimals(item.pricePerUnit).toFixed(2)}€/unité
                                        </div>
                                      </div>
                                      <div className="ml-4 text-right font-bold text-[#191919] min-w-[80px]">
                                        {roundToTwoDecimals(item.quantity * item.pricePerUnit).toFixed(2)}€
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 pt-3 border-t border-[#E5E4DF] flex justify-between">
                                <span className="font-semibold text-[#666663]">Total:</span>
                                <span className="font-bold text-[#191919] text-lg">{roundToTwoDecimals(order.total).toFixed(2)}€</span>
                              </div>
                              
                              {/* Section Commentaires */}
                              <div className="mt-6 pt-6 border-t border-[#E5E4DF]">
                                <CommentSection 
                                  purchaseOrderId={order.id}
                                  purchaseOrderNumber={order.id}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            {/* En Transit */}
            {trackTabSection === 'en_transit' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-[#191919]">En Transit</h2>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'in_transit').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande en transit</p>
                ) : (
                  orders.filter(o => o.status === 'in_transit').map(order => (
                    <div key={order.id} className="bg-[#FAFAF7] rounded-lg border border-[#E5E4DF] overflow-hidden">
                      {/* Header de la commande - Cliquable - Optimisé mobile */}
                      <div 
                        className="p-3 sm:p-4 cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <div className="space-y-3">
                          {/* Ligne 1: N° PO + Chevron */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-bold text-[#191919] text-sm sm:text-base">{order.id}</span>
                              <motion.div
                                animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="shrink-0"
                              >
                                <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                              </motion.div>
                            </div>
                          </div>
                          
                          {/* Ligne 2: Fournisseur */}
                          <div className="flex items-center gap-2">
                            <span className="text-[#666663] text-xs sm:text-sm">Fournisseur:</span>
                            <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.supplier}</span>
                          </div>
                          
                          {/* Ligne 3: Entrepôt */}
                          {(order.warehouseName || order.warehouseId) && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#666663] text-xs sm:text-sm">Entrepôt de livraison:</span>
                              <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.warehouseName || order.warehouseId}</span>
                            </div>
                          )}
                          
                          {/* Ligne 4: Infos */}
                          <div className="text-xs sm:text-sm space-y-1">
                            <div>
                              <span className="text-[#666663]">Créée le: </span>
                              <span className="text-[#191919]">{formatConfirmedDate(order.createdAt)}</span>
                            </div>
                            {order.confirmedAt && (
                              <div className="text-green-600">
                                ✓ Confirmée le {formatConfirmedDate(order.confirmedAt)}
                              </div>
                            )}
                            {order.shippedAt && (
                              <div className="text-purple-600">
                                🚚 Expédiée le {formatConfirmedDate(order.shippedAt)}
                              </div>
                            )}
                            {order.trackingNumber && (
                              <div>
                                <span className="text-[#666663]">Suivi: </span>
                                <span className="text-purple-600 font-mono break-all">{order.trackingNumber}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-[#666663]">Total: </span>
                              <span className="text-[#191919] font-bold">{roundToTwoDecimals(order.total).toFixed(2)}€</span>
                            </div>
                          </div>
                          
                          {/* Bouton d'action */}
                          <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="success"
                              size="sm"
                              icon={CheckCircle}
                              onClick={(e) => {
                                e.stopPropagation();
                                receiveOrder(order.id);
                              }}
                              className="w-full sm:w-auto"
                            >
                              <span className="hidden sm:inline">Marquer comme reçue</span>
                              <span className="sm:hidden">Reçue</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Détails des produits - Expansible */}
                      <AnimatePresence>
                        {expandedOrders[order.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#E5E4DF] bg-white"
                          >
                            <div className="p-4">
                              <h4 className="font-semibold text-sm text-[#666663] mb-3">Produits commandés:</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                  const product = products.find(p => p.sku === item.sku);
                                  return (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-[#FAFAF7] rounded border border-[#E5E4DF]">
                                      <div className="flex-1">
                                        <div className="font-medium text-[#191919] text-sm">
                                          {product?.name || item.sku}
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          SKU: {item.sku}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-[#191919]">
                                          {formatUnits(item.quantity)} unités
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          {roundToTwoDecimals(item.pricePerUnit).toFixed(2)}€/unité
                                        </div>
                                      </div>
                                      <div className="ml-4 text-right font-bold text-[#191919] min-w-[80px]">
                                        {roundToTwoDecimals(item.quantity * item.pricePerUnit).toFixed(2)}€
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 pt-3 border-t border-[#E5E4DF] flex justify-between">
                                <span className="font-semibold text-[#666663]">Total:</span>
                                <span className="font-bold text-[#191919] text-lg">{roundToTwoDecimals(order.total).toFixed(2)}€</span>
                              </div>
                              
                              {/* Section Commentaires */}
                              <div className="mt-6 pt-6 border-t border-[#E5E4DF]">
                                <CommentSection 
                                  purchaseOrderId={order.id}
                                  purchaseOrderNumber={order.id}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            {/* Commandes Reçues */}
            {trackTabSection === 'commandes_recues' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-[#191919]">Commandes Reçues</h2>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'received').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande reçue</p>
                ) : (
                  orders.filter(o => o.status === 'received').map(order => (
                    <div key={order.id} className="bg-[#FAFAF7] rounded-lg border border-[#E5E4DF] overflow-hidden">
                      {/* Header de la commande - Optimisé mobile */}
                      <div 
                        className="p-3 sm:p-4 cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <div className="space-y-3">
                          {/* Ligne 1: N° PO + Chevron */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-bold text-[#191919] text-sm sm:text-base">{order.id}</span>
                              <motion.div
                                animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="shrink-0"
                              >
                                <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                              </motion.div>
                            </div>
                          </div>
                          
                          {/* Ligne 2: Fournisseur */}
                          <div className="flex items-center gap-2">
                            <span className="text-[#666663] text-xs sm:text-sm">Fournisseur:</span>
                            <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.supplier}</span>
                          </div>
                          
                          {/* Ligne 3: Entrepôt */}
                          {(order.warehouseName || order.warehouseId) && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#666663] text-xs sm:text-sm">Entrepôt de livraison:</span>
                              <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.warehouseName || order.warehouseId}</span>
                            </div>
                          )}
                          
                          {/* Ligne 4: Infos */}
                          <div className="text-xs sm:text-sm space-y-1">
                            <div>
                              <span className="text-[#666663]">Créée le: </span>
                              <span className="text-[#191919]">{formatConfirmedDate(order.createdAt)}</span>
                            </div>
                            {order.receivedAt && (
                              <div className="text-green-600">
                                ✓ Reçue le {formatConfirmedDate(order.receivedAt)}
                              </div>
                            )}
                            <div>
                              <span className="text-[#666663]">Total: </span>
                              <span className="text-[#191919] font-bold">{roundToTwoDecimals(order.total).toFixed(2)}€</span>
                            </div>
                          </div>
                          
                          {/* Bouton d'action */}
                          <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="success"
                              size="sm"
                              icon={CheckCircle}
                              onClick={(e) => {
                                e.stopPropagation();
                                openReconciliationModal(order);
                              }}
                              className="w-full sm:w-auto"
                            >
                              <span className="hidden sm:inline">Valider réception</span>
                              <span className="sm:hidden">Valider</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Détails des produits */}
                      <AnimatePresence>
                        {expandedOrders[order.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#E5E4DF] bg-white"
                          >
                            <div className="p-4">
                              <h4 className="font-semibold text-sm text-[#666663] mb-3">Produits commandés:</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                  const product = products.find(p => p.sku === item.sku);
                                  return (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-[#FAFAF7] rounded border border-[#E5E4DF]">
                                      <div className="flex-1">
                                        <div className="font-medium text-[#191919] text-sm">
                                          {product?.name || item.sku}
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          SKU: {item.sku}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-[#191919]">
                                          {formatUnits(item.quantity)} unités
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          {roundToTwoDecimals(item.pricePerUnit).toFixed(2)}€/unité
                                        </div>
                                      </div>
                                      <div className="ml-4 text-right font-bold text-[#191919] min-w-[80px]">
                                        {roundToTwoDecimals(item.quantity * item.pricePerUnit).toFixed(2)}€
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 pt-3 border-t border-[#E5E4DF] flex justify-between">
                                <span className="font-semibold text-[#666663]">Total:</span>
                                <span className="font-bold text-[#191919] text-lg">{roundToTwoDecimals(order.total).toFixed(2)}€</span>
                              </div>
                              
                              {/* Section Commentaires */}
                              <div className="mt-6 pt-6 border-t border-[#E5E4DF]">
                                <CommentSection 
                                  purchaseOrderId={order.id}
                                  purchaseOrderNumber={order.id}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            {/* Réconciliation */}
            {trackTabSection === 'reconciliation' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#EF1C43] shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-[#191919]">Réconciliation</h2>
              </div>
              <div className="space-y-3">
                {/* DEBUG INFO */}
                {(() => {
                  const reconciliationOrders = orders.filter(o => o.status === 'reconciliation');
                  const receivedOrders = orders.filter(o => o.status === 'received');
                  const ordersWithDiscrepancy = orders.filter(o => o.hasDiscrepancy === true);
                  
                  console.log('=== DEBUG RÉCONCILIATION ===');
                  console.log('Total commandes:', orders.length);
                  console.log('Commandes status=reconciliation:', reconciliationOrders.length);
                  console.log('Commandes status=received:', receivedOrders.length);
                  console.log('Commandes avec hasDiscrepancy:', ordersWithDiscrepancy.length);
                  console.log('Détails commandes avec écarts:', ordersWithDiscrepancy);
                  
                  return null;
                })()}
                
                {orders.filter(o => o.status === 'reconciliation').length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#666663] text-sm mb-2">Aucune commande à réconcilier</p>
                    <p className="text-xs text-[#999] mt-4">
                      Debug: {orders.length} commandes totales • 
                      {orders.filter(o => o.hasDiscrepancy).length} avec écarts détectés • 
                      {orders.filter(o => o.status === 'received').length} avec status 'received'
                    </p>
                    {orders.filter(o => o.hasDiscrepancy).length > 0 && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-left">
                        <p className="text-sm text-yellow-800 font-medium mb-2">
                          ⚠️ Attention: {orders.filter(o => o.hasDiscrepancy).length} commande(s) avec écarts détectés mais pas en statut 'reconciliation'
                        </p>
                        <div className="text-xs text-yellow-700 space-y-1">
                          {orders.filter(o => o.hasDiscrepancy).map(o => (
                            <div key={o.id}>
                              • {o.id} - Status actuel: {o.status}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  orders.filter(o => o.status === 'reconciliation').map(order => {
                    const isDamage = order.damageReport === true;
                    const bgColor = isDamage ? 'bg-orange-50' : 'bg-red-50';
                    const borderColor = isDamage ? 'border-orange-500' : 'border-[#EF1C43]';
                    const badgeBgColor = isDamage ? 'bg-orange-500/20' : 'bg-[#EF1C43]/20';
                    const badgeTextColor = isDamage ? 'text-orange-600' : 'text-[#EF1C43]';
                    const badgeText = isDamage ? '⚠️ RÉCEPTION ENDOMMAGÉE' : '📦 ÉCART DE QUANTITÉ';
                    
                    return (
                    <div key={order.id} className={`${bgColor} rounded-lg border-l-4 ${borderColor} overflow-hidden`}>
                      {/* Header de la commande - Cliquable - Optimisé mobile */}
                      <div 
                        className="p-3 sm:p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <div className="space-y-3">
                          {/* Ligne 1: N° PO + Badge + Chevron */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                              <span className="font-bold text-[#191919] text-sm sm:text-base">{order.id}</span>
                              <motion.div
                                animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="shrink-0"
                              >
                                <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                              </motion.div>
                            </div>
                            <span className={`px-2 py-1 ${badgeBgColor} ${badgeTextColor} rounded text-xs font-medium shrink-0`}>
                              <span className="hidden sm:inline">{badgeText}</span>
                              <span className="sm:hidden">{isDamage ? '⚠️ Endommagée' : '📦 Écart'}</span>
                            </span>
                          </div>
                          
                          {/* Ligne 2: Fournisseur */}
                          <div className="flex items-center gap-2">
                            <span className="text-[#666663] text-xs sm:text-sm">Fournisseur:</span>
                            <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.supplier}</span>
                          </div>
                          
                          {/* Ligne 3: Entrepôt */}
                          {(order.warehouseName || order.warehouseId) && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#666663] text-xs sm:text-sm">Entrepôt de livraison:</span>
                              <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.warehouseName || order.warehouseId}</span>
                            </div>
                          )}
                          
                          {/* Ligne 4: Infos */}
                          <div className="text-xs sm:text-sm space-y-1">
                            <div>
                              <span className="text-[#666663]">Créée le: </span>
                              <span className="text-[#191919]">{formatConfirmedDate(order.createdAt)}</span>
                            </div>
                            {order.receivedAt && (
                              <div className="text-[#666663]">
                                📦 Reçue le {formatConfirmedDate(order.receivedAt)}
                              </div>
                            )}
                            <div>
                              <span className="text-[#666663]">Total: </span>
                              <span className="text-[#191919] font-bold">{order.total}€</span>
                            </div>
                          </div>
                          
                          {/* Boutons d'action */}
                          <div className="pt-2 flex flex-col sm:flex-row gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Mail}
                              onClick={(e) => {
                                e.stopPropagation();
                                openReclamationModal(order);
                              }}
                              className="w-full sm:w-auto"
                            >
                              <span className="hidden sm:inline">Envoyer réclamation</span>
                              <span className="sm:hidden">Réclamation</span>
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              icon={CheckCircle}
                              onClick={(e) => {
                                e.stopPropagation();
                                openReconciliationModal(order);
                              }}
                              className="w-full sm:w-auto"
                            >
                              <span className="hidden sm:inline">Valider réception</span>
                              <span className="sm:hidden">Valider</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Détails des produits - Expansible */}
                      <AnimatePresence>
                        {expandedOrders[order.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#E5E4DF] bg-white"
                          >
                            <div className="p-4">
                              <h4 className="font-semibold text-sm text-[#666663] mb-3">Détails de réconciliation:</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                  const product = products.find(p => p.sku === item.sku);
                                  const receivedHealthy = item.receivedQuantity !== undefined ? item.receivedQuantity : 0;
                                  const damaged = item.damagedQuantity !== undefined ? item.damagedQuantity : 0;
                                  const totalReceived = receivedHealthy + damaged;
                                  const missing = item.quantity - totalReceived;
                                  const hasIssues = missing > 0 || damaged > 0;
                                  
                                  return (
                                    <div key={idx} className={`p-3 rounded border ${hasIssues ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-[#E5E4DF]'}`}>
                                      <div className="font-medium text-[#191919] mb-2">
                                        {product?.name || item.sku} <span className="text-xs text-[#666663]">(SKU: {item.sku})</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        <div>
                                          <span className="text-[#666663]">📦 Commandé: </span>
                                          <span className="font-bold text-[#191919]">{formatUnits(item.quantity)}</span>
                                        </div>
                                        <div>
                                          <span className="text-[#666663]">✅ Reçu sain: </span>
                                          <span className="font-bold text-green-600">{receivedHealthy}</span>
                                        </div>
                                        {damaged > 0 && (
                                          <>
                                            <div>
                                              <span className="text-[#666663]">🔴 Endommagé: </span>
                                              <span className="font-bold text-orange-600">{damaged}</span>
                                            </div>
                                            <div>
                                              <span className="text-[#666663]">Total reçu: </span>
                                              <span className="font-bold text-[#191919]">{totalReceived}</span>
                                            </div>
                                          </>
                                        )}
                                        {missing > 0 && (
                                          <div className={damaged > 0 ? 'col-span-2' : ''}>
                                            <span className="text-[#666663]">⚠️ Manquant: </span>
                                            <span className="font-bold text-[#EF1C43]">{missing}</span>
                                          </div>
                                        )}
                                        <div className={missing > 0 ? '' : 'col-span-2'}>
                                          <span className="text-[#666663]">💾 Ajouté au stock: </span>
                                          <span className="font-bold text-blue-600">{receivedHealthy}</span>
                                        </div>
                                      </div>
                                      {item.discrepancyNotes && (
                                        <div className="mt-2 pt-2 border-t border-[#E5E4DF]">
                                          <span className="text-[#666663] text-xs">📝 Notes: </span>
                                          <span className="text-[#191919] text-xs italic">{item.discrepancyNotes}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {/* Section Commentaires */}
                              <div className="mt-6 pt-6 border-t border-[#E5E4DF]">
                                <CommentSection 
                                  purchaseOrderId={order.id}
                                  purchaseOrderNumber={order.id}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
            )}

            </motion.div>
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
              onViewDetails={handleViewProductDetails}
            />
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6">
            
            {/* Section KPIs (plus besoin de sous-onglets) */}
            <>
                <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
                  <h2 className="text-2xl font-bold text-[#191919] mb-2">Indicateurs Clés de l'Inventaire</h2>
                  <p className="text-sm text-[#666663] mb-6">
                    Suivez en temps réel les principaux KPIs ayant un impact direct sur vos résultats financiers
                  </p>
              
              <div className="flex flex-col gap-4 mb-6">
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  customRange={customRange}
                  onCustomRangeChange={setCustomRange}
                />
                
                <ComparisonSelector
                  value={comparisonType}
                  onChange={setComparisonType}
                  disabled={dateRange === 'custom'}
                />
              </div>
            </div>

            {/* État de chargement */}
            {analyticsData.loading ? (
              <div className="flex items-center justify-center h-40 bg-white rounded-xl shadow-sm border border-[#E5E4DF]">
                <RefreshCw className="w-6 h-6 animate-spin text-[#666663]" />
                <span className="ml-2 text-[#666663]">Chargement des analytics...</span>
              </div>
            ) : analyticsData.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">Erreur: {analyticsData.error}</p>
              </div>
            ) : (
              <>
                {/* KPI Cards - Toutes avec la même hauteur */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* KPI 1: Disponibilité */}
                <KPICard
                  title="Taux de Disponibilité des SKU"
                  value={analyticsData.skuAvailability.value}
                  change={analyticsData.skuAvailability.change}
                  changePercent={analyticsData.skuAvailability.changePercent}
                  trend={analyticsData.skuAvailability.trend}
                  description={analyticsData.skuAvailability.description}
                  chartData={analyticsData.skuAvailability.chartData}
                  comparisonPeriod={analyticsData.skuAvailability.comparisonPeriod}
                  onClick={() => openChartModal('skuAvailability')}
                />
                
                {/* KPI 2: Inventory Valuation */}
                <KPICard
                  title="Valeur de l'Inventaire"
                  value={analyticsData.inventoryValuation.value}
                  change={analyticsData.inventoryValuation.change}
                  changePercent={analyticsData.inventoryValuation.changePercent}
                  trend={analyticsData.inventoryValuation.trend}
                  description={analyticsData.inventoryValuation.description}
                  chartData={analyticsData.inventoryValuation.chartData}
                  comparisonPeriod={analyticsData.inventoryValuation.comparisonPeriod}
                  onClick={() => openChartModal('inventoryValuation')}
                />
                
                {/* KPI 3: Ventes Perdues */}
                <KPICard
                  title="Ventes Perdues - Rupture de Stock"
                  value={analyticsData.salesLost.value}
                  change={analyticsData.salesLost.change}
                  changePercent={analyticsData.salesLost.changePercent}
                  trend={analyticsData.salesLost.trend}
                  description={analyticsData.salesLost.description}
                  chartData={analyticsData.salesLost.chartData}
                  comparisonPeriod={analyticsData.salesLost.comparisonPeriod}
                  onClick={() => openChartModal('salesLost')}
                />
                
                {/* KPI 4: Surstocks */}
                <KPICard
                  title="Valeur Surstocks Profonds"
                  value={analyticsData.overstockCost.value}
                  change={analyticsData.overstockCost.change}
                  changePercent={analyticsData.overstockCost.changePercent}
                  trend={analyticsData.overstockCost.trend}
                  description={analyticsData.overstockCost.description}
                  chartData={analyticsData.overstockCost.chartData}
                  comparisonPeriod={analyticsData.overstockCost.comparisonPeriod}
                  onClick={() => openChartModal('overstockCost')}
                />
              </div>

              {/* Insights séparés - Affichage sous les KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {/* Insights pour KPI 1 */}
                <div className="space-y-3">
                  {insights
                    .filter(insight => insight.kpi === 'skuAvailability')
                    .map(insight => (
                      <InsightAlert
                        key={insight.id}
                        type={insight.type}
                        message={insight.message}
                        actionLabel={insight.actionLabel}
                        onActionClick={insight.action}
                      />
                    ))
                  }
                </div>
                
                {/* Insights pour KPI 2 */}
                <div className="space-y-3">
                  {insights
                    .filter(insight => insight.kpi === 'inventoryValuation')
                    .map(insight => (
                      <InsightAlert
                        key={insight.id}
                        type={insight.type}
                        message={insight.message}
                        actionLabel={insight.actionLabel}
                        onActionClick={insight.action}
                      />
                    ))
                  }
                </div>
                
                {/* Insights pour KPI 3 */}
                <div className="space-y-3">
                  {insights
                    .filter(insight => insight.kpi === 'salesLost')
                    .map(insight => (
                      <InsightAlert
                        key={insight.id}
                        type={insight.type}
                        message={insight.message}
                        actionLabel={insight.actionLabel}
                        onActionClick={insight.action}
                      />
                    ))
                  }
                </div>
                
                {/* Insights pour KPI 4 */}
                <div className="space-y-3">
                  {insights
                    .filter(insight => insight.kpi === 'overstockCost')
                    .map(insight => (
                      <InsightAlert
                        key={insight.id}
                        type={insight.type}
                        message={insight.message}
                        actionLabel={insight.actionLabel}
                        onActionClick={insight.action}
                      />
                    ))
                  }
                </div>
              </div>
              </>
            )}

            {/* Insights globaux - Affichage regroupé des insights non liés à un KPI spécifique */}
            {!analyticsData.loading && !analyticsData.error && insights.filter(i => i.kpi === 'global').length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
                <h3 className="text-lg font-bold text-[#191919] mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#191919]" />
                  Alertes Importantes
                </h3>
                <div className="space-y-3">
                  {insights
                    .filter(insight => insight.kpi === 'global')
                    .map(insight => (
                      <InsightAlert
                        key={insight.id}
                        type={insight.type}
                        message={insight.message}
                        actionLabel={insight.actionLabel}
                        onActionClick={insight.action}
                        />
                      ))
                    }
                  </div>
                </div>
            )}
              </>
          </motion.div>
        )}

        {/* Modal de graphique détaillé */}
        <ChartModal
          isOpen={chartModalOpen}
          onClose={() => setChartModalOpen(false)}
          kpiData={selectedKPI ? analyticsData[selectedKPI] : null}
          title={selectedKPI ? kpiTitles[selectedKPI] : ''}
        />

          {/* IA & PRÉVISIONS TAB */}
          {activeTab === 'ai-forecasts' && (
            <div className="space-y-6">
              <AIMainDashboard
                products={enrichedProducts}
                orders={orders}
                aiSubTab={aiSubTab}
                setAiSubTab={setAiSubTab}
              />
            </div>
          )}

          {/* STOCK LEVEL TAB */}
          {activeTab === 'stock-level' && (
            <motion.div
              key="stock-level"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6">
              
              {/* Header et Dashboard */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#191919] mb-2">Santé de l'Inventaire</h2>
                  <p className="text-sm text-[#666663]">Visualisez la disponibilité actuelle de chaque SKU avec filtres et tri</p>
                </div>
                
                {/* Dashboard global de santé */}
                <div className="mb-6">
                  <StockHealthDashboard 
                    totalUrgent={enrichedProducts.filter(p => p.healthStatus === 'urgent').length}
                    totalWarning={enrichedProducts.filter(p => p.healthStatus === 'warning').length}
                    totalHealthy={enrichedProducts.filter(p => p.healthStatus === 'healthy').length}
                    totalProducts={enrichedProducts.length}
                  />
                </div>
              </div>

              {/* Table des produits */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
                {/* Header de la table avec filtres */}
                <div className="bg-[#FAFAF7] border-b border-[#E5E4DF] p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <h3 className="text-lg font-bold text-[#191919]">Produits en Stock</h3>
                      <span className="text-sm text-[#666663]">
                        {enrichedProducts.length} produit(s) au total
                      </span>
                    </div>
                    
                    {/* Filtres */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select 
                        value={stockLevelFilter}
                        onChange={(e) => setStockLevelFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-[#191919] text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="urgent">Urgent (rouge)</option>
                        <option value="warning">Attention (orange)</option>
                        <option value="healthy">Bon (vert)</option>
                      </select>
                      
                      <select 
                        value={stockLevelSupplierFilter}
                        onChange={(e) => setStockLevelSupplierFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-[#191919] text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="all">Tous les fournisseurs</option>
                        {[...new Set(enrichedProducts.map(p => p.supplier))].map(supplier => (
                          <option key={supplier} value={supplier}>{supplier}</option>
                        ))}
                      </select>
                      
                      <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        value={stockLevelSearch}
                        onChange={(e) => setStockLevelSearch(e.target.value)}
                        className="px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-[#191919] text-sm focus:outline-none focus:ring-2 focus:ring-black placeholder-[#666663]"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#FAFAF7] border-b border-[#E5E4DF]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                          Produit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                          Fournisseur
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                          Autonomie
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                          Santé
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#E5E4DF]">
                      {enrichedProducts
                        .filter(product => {
                          const matchesStatus = stockLevelFilter === 'all' || product.healthStatus === stockLevelFilter;
                          const matchesSupplier = stockLevelSupplierFilter === 'all' || product.supplier === stockLevelSupplierFilter;
                          const matchesSearch = stockLevelSearch === '' || 
                            product.name.toLowerCase().includes(stockLevelSearch.toLowerCase()) ||
                            product.sku.toLowerCase().includes(stockLevelSearch.toLowerCase());
                          return matchesStatus && matchesSupplier && matchesSearch;
                        })
                        .map(product => (
                          <tr key={product.sku} className="hover:bg-[#FAFAF7] transition-colors">
                            {/* Produit */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <div className="font-bold text-[#191919] text-sm">{product.name}</div>
                                <div className="text-xs text-[#666663]">{product.sku}</div>
                                <div className="text-xs text-[#666663] mt-1">
                                  Ventes/jour: <span className="font-medium">{product.salesPerDay.toFixed(1)}</span>
                                </div>
                              </div>
                            </td>
                            
                            {/* Fournisseur */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <div className="font-medium text-[#191919] text-sm">{product.supplier}</div>
                                <div className="text-xs text-[#666663]">
                                  Délai: {product.leadTimeDays} jours
                                </div>
                              </div>
                            </td>
                            
                            {/* Stock */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <div className="font-bold text-[#191919] text-sm">{formatUnits(product.stock)} unités</div>
                                <div className="text-xs text-[#666663]">
                                  Point: {product.reorderPoint} • MOQ: {product.moq}
                                </div>
                              </div>
                            </td>
                            
                            {/* Autonomie */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <div className={`font-bold text-sm ${
                                  product.healthStatus === 'urgent' ? 'text-red-600' :
                                  product.healthStatus === 'warning' ? 'text-orange-500' :
                                  'text-green-600'
                                }`}>
                                  {product.daysOfStock} jours
                                </div>
                                {product.qtyToOrder > 0 && (
                                  <div className="text-xs text-red-600 font-medium">
                                    Commander {formatUnits(product.qtyToOrder)}
                                  </div>
                                )}
                              </div>
                            </td>
                            
                            {/* Santé */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col items-start">
                                <div className="text-sm font-bold text-[#191919]">
                                  {Math.round(product.healthPercentage)}%
                                </div>
                                <div className="w-16 mt-1">
                                  <HealthBar percentage={product.healthPercentage} status={product.healthStatus} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* HISTORIQUE TAB */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4 sm:p-6">
              {/* Header et filtres optimisés mobile */}
              <div className="space-y-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#191919] mb-1 sm:mb-2">Historique des Commandes</h2>
                  <p className="text-xs sm:text-sm text-[#666663]">Consultez toutes vos commandes passées et leur statut</p>
                </div>
                
                {/* Filtres en colonne sur mobile, ligne sur desktop */}
                <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3 sm:flex-wrap">
                  {/* Sélecteur de statut en premier sur mobile (plus important) */}
                  <select 
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg text-[#191919] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending_confirmation">En attente</option>
                    <option value="preparing">En traitement</option>
                    <option value="in_transit">En transit</option>
                    <option value="received">Reçues</option>
                    <option value="completed">Complétées</option>
                    <option value="reconciliation">À réconcilier</option>
                  </select>
                  
                  {/* Dates en grid sur mobile */}
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <label className="text-xs sm:text-sm text-[#666663] font-medium">Du:</label>
                      <input
                        type="date"
                        value={historyDateStart}
                        onChange={(e) => setHistoryDateStart(e.target.value)}
                        className="px-2 sm:px-3 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg text-[#191919] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <label className="text-xs sm:text-sm text-[#666663] font-medium">Au:</label>
                      <input
                        type="date"
                        value={historyDateEnd}
                        onChange={(e) => setHistoryDateEnd(e.target.value)}
                        className="px-2 sm:px-3 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg text-[#191919] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* KPIs en grid responsive */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-[#FAFAF7] rounded-lg p-3 sm:p-4 border border-[#E5E4DF]">
                  <div className="text-xl sm:text-2xl font-bold text-[#191919]">{orders.length}</div>
                  <div className="text-xs sm:text-sm text-[#666663] mt-1">Total commandes</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {orders.filter(o => o.status === 'completed').length}
                  </div>
                  <div className="text-xs sm:text-sm text-[#666663] mt-1">Complétées</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                  <div className="text-xl sm:text-2xl font-bold text-[#64A4F2]">
                    {orders.filter(o => o.status === 'in_transit' || o.status === 'preparing' || o.status === 'pending_confirmation').length}
                  </div>
                  <div className="text-xs sm:text-sm text-[#666663] mt-1">En cours</div>
                </div>
                <div className="bg-[#FAFAF7] rounded-lg p-3 sm:p-4 border border-[#E5E4DF]">
                  <div className="text-xl sm:text-2xl font-bold text-[#191919]">
                    {orders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}€
                  </div>
                  <div className="text-xs sm:text-sm text-[#666663] mt-1">Montant total</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {orders
                .filter(o => {
                  // Filtrage par statut
                  if (historyFilter !== 'all' && o.status !== historyFilter) return false;
                  
                  // Filtrage par dates
                  if (historyDateStart || historyDateEnd) {
                    const orderDate = new Date(o.createdAt);
                    if (historyDateStart && orderDate < new Date(historyDateStart)) return false;
                    if (historyDateEnd && orderDate > new Date(historyDateEnd)) return false;
                  }
                  
                  return true;
                })
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-8">
                    <p className="text-[#666663] text-center text-sm">Aucune commande trouvée pour ces critères</p>
                  </div>
                ) : (
                  orders
                    .filter(o => {
                      // Filtrage par statut
                      if (historyFilter !== 'all' && o.status !== historyFilter) return false;
                      
                      // Filtrage par dates
                      if (historyDateStart || historyDateEnd) {
                        const orderDate = new Date(o.createdAt);
                        if (historyDateStart && orderDate < new Date(historyDateStart)) return false;
                        if (historyDateEnd && orderDate > new Date(historyDateEnd)) return false;
                      }
                      
                      return true;
                    })
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map(order => {
                      const statusConfig = {
                        pending_confirmation: { label: 'En attente', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
                        preparing: { label: 'En traitement', color: 'bg-blue-50 text-[#64A4F2] border-blue-200' },
                        in_transit: { label: 'En transit', color: 'bg-purple-50 text-purple-600 border-purple-200' },
                        received: { label: 'Reçues', color: 'bg-green-50 text-green-600 border-green-200' },
                        completed: { label: 'Complétée', color: 'bg-green-50 text-green-600 border-green-200' },
                        reconciliation: { label: 'À réconcilier', color: 'bg-red-50 text-[#EF1C43] border-red-200' }
                      };
                      
                      const status = statusConfig[order.status] || { label: order.status || 'Inconnu', color: 'bg-gray-50 text-gray-600 border-gray-200' };
                      
                      return (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
                          {/* Header de la commande - Cliquable */}
                          <div 
                            className="p-3 sm:p-4 cursor-pointer hover:bg-[#FAFAF7] transition-colors"
                            onClick={() => toggleOrderDetails(order.id)}
                          >
                            {/* Layout mobile-first optimisé */}
                            <div className="space-y-3">
                              {/* Ligne 1: N° PO + Badge Statut + Chevron */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="font-bold text-[#191919] text-sm sm:text-base">{order.id}</span>
                                  <motion.div
                                    animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="shrink-0"
                                  >
                                    <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                                  </motion.div>
                                </div>
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border inline-block shrink-0 ${status.color}`}>
                                  {status.label}
                                </span>
                              </div>
                              
                              {/* Ligne 2: Fournisseur */}
                              <div className="flex items-center gap-2">
                                <span className="text-[#666663] text-xs sm:text-sm">Fournisseur:</span>
                                <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.supplier}</span>
                              </div>
                              
                              {/* Ligne 3: Entrepôt */}
                              {(order.warehouseName || order.warehouseId) && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[#666663] text-xs sm:text-sm">Entrepôt de livraison:</span>
                                  <span className="text-[#191919] font-medium text-xs sm:text-sm truncate">{order.warehouseName || order.warehouseId}</span>
                                </div>
                              )}
                              
                              {/* Ligne 4: Infos principales en grid */}
                              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                                <div>
                                  <span className="text-[#666663]">Date: </span>
                                  <span className="text-[#191919]">{formatConfirmedDate(order.createdAt)}</span>
                                </div>
                                <div>
                                  <span className="text-[#666663]">Produits: </span>
                                  <span className="text-[#191919] font-medium">{order.items.length}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[#666663]">Total: </span>
                                  <span className="text-[#191919] font-bold text-sm sm:text-base">{roundToTwoDecimals(order.total).toFixed(2)}€</span>
                                </div>
                                {order.trackingNumber && (
                                  <div className="col-span-2">
                                    <span className="text-[#666663]">Suivi: </span>
                                    <span className="text-[#191919] font-mono text-xs break-all">{order.trackingNumber}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Détails des produits - Expansible */}
                          <AnimatePresence>
                            {expandedOrders[order.id] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t border-[#E5E4DF] bg-white"
                              >
                                <div className="p-3 sm:p-4">
                                  <h4 className="font-semibold text-xs sm:text-sm text-[#666663] mb-3">Produits commandés:</h4>
                                  <div className="space-y-2">
                                    {order.items.map((item, idx) => {
                                      const product = products.find(p => p.sku === item.sku);
                                      return (
                                        <div key={idx} className="bg-[#FAFAF7] rounded border border-[#E5E4DF] p-2 sm:p-3">
                                          {/* Layout mobile optimisé */}
                                          <div className="space-y-2">
                                            {/* Nom du produit */}
                                            <div>
                                              <div className="font-medium text-[#191919] text-xs sm:text-sm">
                                                {product?.name || item.sku}
                                              </div>
                                              <div className="text-xs text-[#666663] mt-0.5">
                                                SKU: {item.sku}
                                              </div>
                                            </div>
                                            
                                            {/* Infos quantité et prix en grid */}
                                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E5E4DF]">
                                              <div>
                                                <div className="text-[#666663]">Quantité</div>
                                                <div className="font-bold text-[#191919]">{formatUnits(item.quantity)} unités</div>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-[#666663]">Prix unitaire</div>
                                                <div className="font-medium text-[#191919]">{roundToTwoDecimals(item.pricePerUnit).toFixed(2)}€</div>
                                              </div>
                                              <div className="col-span-2 pt-1 border-t border-[#E5E4DF]">
                                                <div className="flex justify-between items-center">
                                                  <span className="text-[#666663] font-medium">Total ligne</span>
                                                  <span className="font-bold text-[#191919] text-sm">{roundToTwoDecimals(item.quantity * item.pricePerUnit).toFixed(2)}€</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* Total de la commande */}
                                  <div className="mt-3 pt-3 border-t-2 border-[#E5E4DF] flex justify-between items-center">
                                    <span className="font-semibold text-[#666663] text-sm">Total commande:</span>
                                    <span className="font-bold text-[#191919] text-lg">{roundToTwoDecimals(order.total).toFixed(2)}€</span>
                                  </div>
                                  
                                  {/* Informations supplémentaires */}
                                  <div className="mt-4 pt-4 border-t border-[#E5E4DF] space-y-2 text-xs sm:text-sm">
                                    {order.confirmedAt && (
                                      <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <span className="text-[#666663] font-medium">Date confirmation:</span>
                                        <span className="text-[#191919]">{formatConfirmedDate(order.confirmedAt)}</span>
                                      </div>
                                    )}
                                    {order.shippedAt && (
                                      <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <span className="text-[#666663] font-medium">Date expédition:</span>
                                        <span className="text-[#191919]">{formatConfirmedDate(order.shippedAt)}</span>
                                      </div>
                                    )}
                                    {order.receivedAt && (
                                      <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <span className="text-[#666663] font-medium">Date réception:</span>
                                        <span className="text-[#191919]">{formatConfirmedDate(order.receivedAt)}</span>
                                      </div>
                                    )}
                                    {order.trackingNumber && (
                                      <div className="flex flex-col sm:flex-row sm:gap-2">
                                        <span className="text-[#666663] font-medium">Suivi:</span>
                                        <span className="text-[#191919] font-mono text-xs break-all">{order.trackingNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Section Commentaires */}
                                  <div className="mt-6 pt-6 border-t border-[#E5E4DF]">
                                    <CommentSection 
                                      purchaseOrderId={order.id}
                                      purchaseOrderNumber={order.id}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                )}
            </div>

            <div className="flex justify-center sm:justify-end">
              <Button variant="primary" icon={Upload} onClick={exportHistoryToCSV} className="w-full sm:w-auto">
                <span className="hidden sm:inline">Exporter en CSV</span>
                <span className="sm:hidden">Exporter CSV</span>
              </Button>
            </div>
            </motion.div>
          )}

          {/* ONGLET PARAMETRES */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-[#191919] mb-2">⚙️ Paramètres</h2>
              <p className="text-[#666663]">Gérez la configuration de votre application</p>
            </div>
            
            {/* Navigation des sous-onglets */}
            <SubTabsNavigation 
              tabs={[
                { id: 'general', label: 'Général', icon: Settings },
                { id: 'products', label: 'Produits', icon: Package },
                { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
                { id: 'mapping', label: 'Mapping', icon: Activity },
                { id: 'warehouses', label: 'Entrepôts', icon: Warehouse }
              ]}
              activeTab={parametersSubTab}
              onChange={setParametersSubTab}
            />
            
            {/* Contenu dynamique selon le sous-onglet */}
            {parametersSubTab === 'general' && (
              <div className="space-y-6">
                {/* Indicateur de modifications non sauvegardées */}
                {Object.keys(unsavedParameterChanges).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-yellow-800">
                            {Object.keys(unsavedParameterChanges).length} modification(s) non sauvegardée(s)
                          </span>
                          <div className="text-xs text-yellow-700 mt-1">
                            Cliquez sur "Sauvegarder" pour appliquer vos modifications
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        onClick={saveAllParameters}
                        disabled={isSavingParameters}
                        icon={isSavingParameters ? RefreshCw : Check}
                        className={isSavingParameters ? 'animate-pulse' : ''}
                      >
                        {isSavingParameters ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {/* Formulaire des paramètres */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-[#191919]">
                        Multiplicateur par défaut
                      </label>
                      {unsavedParameterChanges.MultiplicateurDefaut !== undefined && (
                        <span className="text-xs text-yellow-600 font-medium">● Modifié</span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="3"
                      value={
                        unsavedParameterChanges.MultiplicateurDefaut !== undefined 
                          ? unsavedParameterChanges.MultiplicateurDefaut 
                          : (parameters.MultiplicateurDefaut || 1.2)
                      }
                      onChange={(e) => handleParameterChange('MultiplicateurDefaut', parseFloat(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-[#E5E4DF] rounded-lg text-[#191919] font-semibold focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-colors"
                    />
                    <p className="text-xs text-[#666663] mt-2">
                      📊 Coefficient appliqué aux ventes moyennes pour calculer les quantités à commander (recommandé: 1.2 à 1.5)
                    </p>
                  </div>
                  
                  <div className="border-t border-[#E5E4DF] pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-[#191919]">
                        Devise par défaut
                      </label>
                      {unsavedParameterChanges.DeviseDefaut !== undefined && (
                        <span className="text-xs text-yellow-600 font-medium">● Modifié</span>
                      )}
                    </div>
                    <select
                      value={
                        unsavedParameterChanges.DeviseDefaut !== undefined 
                          ? unsavedParameterChanges.DeviseDefaut 
                          : (parameters.DeviseDefaut || 'EUR')
                      }
                      onChange={(e) => handleParameterChange('DeviseDefaut', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#E5E4DF] rounded-lg text-[#191919] font-semibold focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-colors"
                    >
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="USD">USD ($) - Dollar américain</option>
                      <option value="GBP">GBP (£) - Livre sterling</option>
                      <option value="CHF">CHF (Fr.) - Franc suisse</option>
                    </select>
                    <p className="text-xs text-[#666663] mt-2">
                      💰 Devise utilisée pour l'affichage des prix dans l'application
                    </p>
                  </div>
                  
                  <div className="border-t border-[#E5E4DF] pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-[#191919]">
                        Seuil surstock profond (jours)
                      </label>
                      {unsavedParameterChanges.SeuilSurstockProfond !== undefined && (
                        <span className="text-xs text-yellow-600 font-medium">● Modifié</span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="30"
                      max="365"
                      value={
                        unsavedParameterChanges.SeuilSurstockProfond !== undefined 
                          ? unsavedParameterChanges.SeuilSurstockProfond 
                          : (parameters.SeuilSurstockProfond || 90)
                      }
                      onChange={(e) => handleParameterChange('SeuilSurstockProfond', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-[#E5E4DF] rounded-lg text-[#191919] font-semibold focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-colors"
                    />
                    <p className="text-xs text-[#666663] mt-2">
                      ⚠️ Au-delà de ce seuil × 2, le produit est considéré en surstock profond et apparaît dans les alertes
                    </p>
                    <div className="mt-2 text-xs text-[#191919] bg-[#FAFAF7] border border-[#E5E4DF] rounded px-3 py-2">
                      Seuil actuel: <strong>{(unsavedParameterChanges.SeuilSurstockProfond || parameters.SeuilSurstockProfond || 90) * 2} jours</strong>
                    </div>
                  </div>
                </div>
                
                {/* Bouton de sauvegarde répété en bas */}
                {Object.keys(unsavedParameterChanges).length > 0 && (
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUnsavedParameterChanges({});
                        toast.info('Modifications annulées');
                      }}
                      disabled={isSavingParameters}
                    >
                      Annuler les modifications
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={saveAllParameters}
                      disabled={isSavingParameters}
                      icon={isSavingParameters ? RefreshCw : Check}
                      className={isSavingParameters ? 'animate-pulse' : ''}
                    >
                      {isSavingParameters ? 'Sauvegarde en cours...' : 'Sauvegarder tous les paramètres'}
                    </Button>
                  </div>
                )}
                
                {/* Section d'aide */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <strong>Comment ça marche ?</strong>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-blue-800">
                        <li>Modifiez les valeurs selon vos besoins</li>
                        <li>Un indicateur jaune apparaît pour les modifications non sauvegardées</li>
                        <li>Cliquez sur "Sauvegarder" pour appliquer définitivement les changements</li>
                        <li>Les paramètres sont stockés dans Google Sheets et persistants</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {parametersSubTab === 'products' && (
              <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#191919] mb-2">Paramètres des produits</h2>
                  <p className="text-sm text-[#666663]">Ajustez les paramètres de prévision pour chaque produit selon vos besoins.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#FAFAF7] border-b border-[#E5E4DF]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase">Produit</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase">Fournisseur</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#666663] uppercase">
                          <div className="inline-flex items-center justify-center">
                            Multiplicateur
                            <InfoTooltip content={tooltips.multiplier} />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#666663] uppercase">
                          <div className="inline-flex items-center justify-center">
                            Stock Sécurité (jours)
                            <InfoTooltip content={tooltips.securityStock} />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[#666663] uppercase">
                          <div className="inline-flex items-center justify-end">
                            Point de Commande
                            <InfoTooltip content={tooltips.reorderPoint} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E4DF]">
                      {enrichedProducts.map(p => (
                        <tr key={p.sku} className="hover:bg-[#FAFAF7] transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-[#191919] text-sm">{p.name}</p>
                              <p className="text-xs text-[#666663]">{p.sku}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#191919]">{p.supplier}</td>
                          <td className="px-4 py-3 text-center">
                            {editingParam?.sku === p.sku && editingParam?.field === 'multiplier' ? (
                              <div className="inline-flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={tempParamValue}
                                  onChange={(e) => setTempParamValue(e.target.value)}
                                  className="w-20 px-2 py-1 border-2 border-black rounded text-sm text-center bg-white text-[#191919] font-medium focus:outline-none focus:ring-2 focus:ring-black"
                                  autoFocus
                                />
                                <button onClick={saveParam} className="text-green-600 hover:text-green-700 p-1 focus:outline-none focus:ring-2 focus:ring-green-600 rounded">
                                  <Check className="w-4 h-4 shrink-0" />
                                </button>
                                <button onClick={cancelEditParam} className="text-[#EF1C43] hover:text-red-700 p-1 focus:outline-none focus:ring-2 focus:ring-[#EF1C43] rounded">
                                  <X className="w-4 h-4 shrink-0" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditParam(p.sku, 'multiplier', p.multiplier)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-[#F0F0EB] hover:bg-[#E5E4DF] rounded text-sm font-medium text-[#191919] transition-colors focus:outline-none focus:ring-2 focus:ring-black"
                              >
                                {p.multiplier}×
                                <Edit2 className="w-3 h-3 shrink-0" />
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {editingParam?.sku === p.sku && editingParam?.field === 'customSecurityStock' ? (
                              <div className="inline-flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  step="1"
                                  value={tempParamValue}
                                  onChange={(e) => setTempParamValue(e.target.value)}
                                  placeholder="Auto"
                                  className="w-20 px-2 py-1 border-2 border-black rounded text-sm text-center bg-white text-[#191919] font-medium focus:outline-none focus:ring-2 focus:ring-black"
                                  autoFocus
                                />
                                <button onClick={saveParam} className="text-green-600 hover:text-green-700 p-1 focus:outline-none focus:ring-2 focus:ring-green-600 rounded">
                                  <Check className="w-4 h-4 shrink-0" />
                                </button>
                                <button onClick={cancelEditParam} className="text-[#EF1C43] hover:text-red-700 p-1 focus:outline-none focus:ring-2 focus:ring-[#EF1C43] rounded">
                                  <X className="w-4 h-4 shrink-0" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditParam(p.sku, 'customSecurityStock', p.customSecurityStock)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-[#F0F0EB] hover:bg-[#E5E4DF] rounded text-sm font-medium text-[#191919] transition-colors focus:outline-none focus:ring-2 focus:ring-black"
                              >
                                {p.securityStock} jours
                                {p.customSecurityStock === undefined || p.customSecurityStock === null ? (
                                  <span className="text-xs text-[#666663] ml-1">(auto)</span>
                                ) : (
                                  <span className="text-xs text-green-600 ml-1">(custom)</span>
                                )}
                                <Edit2 className="w-3 h-3 shrink-0" />
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-block px-3 py-1 bg-blue-50 text-[#64A4F2] rounded text-sm font-medium border border-blue-200">
                              {p.reorderPoint} unités
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]">
                  <h3 className="font-semibold text-[#191919] mb-2 inline-flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#666663] shrink-0" />
                    Guide d'utilisation
                  </h3>
                  <ul className="space-y-2 text-sm text-[#191919]">
                    <li><strong>Multiplicateur :</strong> Ajustez selon la saisonnalité (0.3 = hors saison, 1 = normal, 5 = BFCM/pic)</li>
                    <li><strong>Stock Sécurité :</strong> Par défaut calculé à 20% du délai fournisseur. Personnalisez selon vos besoins (laissez vide pour revenir au mode auto)</li>
                    <li><strong>Point de Commande :</strong> Calculé automatiquement, se met à jour en temps réel</li>
                    <li><strong>Modifications :</strong> Toutes les modifications sont sauvegardées automatiquement dans Google Sheets</li>
                  </ul>
                </div>
              </div>
            )}
            
            {parametersSubTab === 'suppliers' && (
              <>
                <GestionFournisseurs
                  suppliers={suppliers}
                  products={products}
                  onOpenModal={handleOpenSupplierModal}
                  onDelete={handleDeleteSupplier}
                />
                
                <SupplierModal
                  isOpen={supplierModalOpen}
                  onClose={handleCloseSupplierModal}
                  formData={supplierFormData}
                  onChange={handleSupplierFormChange}
                  onSave={handleSaveSupplier}
                  isEditing={!!editingSupplier}
                />
              </>
            )}
            
            {parametersSubTab === 'mapping' && (
              <>
                <MappingSKUFournisseur
                  products={products}
                  suppliers={suppliers}
                  onOpenAssignModal={handleOpenAssignSupplierModal}
                  onRemoveSupplier={handleRemoveSupplierFromProduct}
                />
                
                <AssignSupplierModal
                  isOpen={assignSupplierModalOpen}
                  onClose={handleCloseAssignSupplierModal}
                  product={productToMap}
                  suppliers={suppliers}
                  selectedSupplier={selectedSupplierForMapping}
                  onSelectSupplier={setSelectedSupplierForMapping}
                  onAssign={handleAssignSupplier}
                />
                </>
              )}

              {/* Sub-tab Warehouses */}
              {parametersSubTab === 'warehouses' && (
                <GestionWarehouses
                  warehouses={warehouses}
                  onCreateWarehouse={handleCreateWarehouse}
                  onUpdateWarehouse={handleUpdateWarehouse}
                  onDeleteWarehouse={handleDeleteWarehouse}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {notificationsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[65]" 
              onClick={() => setNotificationsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed right-4 top-20 w-96 bg-white rounded-xl shadow-2xl border border-[#E5E4DF] z-[70]">
            <div className="p-4 border-b border-[#E5E4DF]">
              <h3 className="font-bold text-[#191919]">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#666663]">
                  Aucune notification
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={idx} className={`p-4 border-b border-[#E5E4DF] hover:bg-[#FAFAF7] transition-colors ${
                    notif.type === 'warning' ? 'bg-red-50' : 
                    notif.type === 'info' ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <p className="text-sm text-[#191919]">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Email */}
      <Modal
        isOpen={emailModalOpen && selectedSupplier}
        onClose={() => {
          setEmailModalOpen(false);
          setOrderQuantities({});
        }}
        title={`Commande - ${selectedSupplier}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setEmailModalOpen(false);
              setOrderQuantities({});
            }}>
              Annuler
            </Button>
            <Button 
              variant="secondary" 
              onClick={createOrderWithoutEmail}
              disabled={!selectedWarehouse}
            >
              Créer commande sans email
            </Button>
            <Button 
              variant="primary" 
              icon={Mail} 
              onClick={sendOrder}
              disabled={!selectedWarehouse}
            >
              Envoyer email et créer commande
            </Button>
          </div>
        }
      >
        {selectedSupplier && (() => {
          const productsToOrder = toOrderBySupplier[selectedSupplier];
          const email = generateEmailDraft(selectedSupplier, productsToOrder);
          const totalAmount = roundToTwoDecimals(productsToOrder.reduce((sum, p) => {
            const qty = orderQuantities[p.sku] || p.qtyToOrder;
            return sum + (qty * p.buyPrice);
          }, 0));
          
          return (
            <>
              {/* Sélection de l'entrepôt */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#191919] mb-2">
                  Entrepôt de livraison *
                </label>
                {Object.keys(warehouses).length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">Aucun entrepôt configuré</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Veuillez d'abord créer un entrepôt dans Paramètres → Entrepôts
                      </p>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedWarehouse || ''}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    required
                  >
                    {Object.values(warehouses).map((warehouse) => (
                      <option key={warehouse.name} value={warehouse.name}>
                        {warehouse.name} - {warehouse.city}, {warehouse.country}
                      </option>
                    ))}
                  </select>
                )}
                {selectedWarehouse && warehouses[selectedWarehouse] && (
                  <div className="mt-2 text-sm text-[#666663] bg-[#FAFAF7] p-3 rounded-lg">
                    <p className="font-medium text-[#191919] mb-1">Adresse de livraison :</p>
                    <p>{warehouses[selectedWarehouse].address}</p>
                    <p>{warehouses[selectedWarehouse].postalCode} {warehouses[selectedWarehouse].city}</p>
                    <p>{warehouses[selectedWarehouse].country}</p>
                  </div>
                )}
              </div>

              {/* Section d'édition des quantités */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-[#191919] mb-3">Ajuster les quantités</h4>
                <div className="space-y-3">
                  {productsToOrder.map(p => (
                    <div key={p.sku} className="bg-white rounded-lg p-3 border border-[#E5E4DF]">
                      <div className="grid grid-cols-3 gap-3 items-center">
                        <div className="col-span-2">
                          <div className="font-medium text-[#191919] text-sm">{p.name}</div>
                          <div className="text-xs text-[#666663]">
                            SKU: {p.sku} • Recommandé: {formatUnits(p.qtyToOrder)} unités
                          </div>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            value={orderQuantities[p.sku] !== undefined ? orderQuantities[p.sku] : p.qtyToOrder}
                            onChange={(e) => updateOrderQuantity(p.sku, e.target.value)}
                            className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg text-center font-bold"
                          />
                          <div className="text-xs text-right text-[#666663] mt-1">
                            {roundToTwoDecimals((orderQuantities[p.sku] || p.qtyToOrder) * p.buyPrice).toFixed(2)}€
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                  <span className="text-sm text-[#666663]">Total de la commande:</span>
                  <span className="text-xl font-bold text-[#191919]">{totalAmount.toFixed(2)}€</span>
                </div>
              </div>
              
              {/* Prévisualisation email */}
              <div className="space-y-3">
                <h4 className="font-semibold text-[#191919]">Prévisualisation email</h4>
                <div>
                  <label className="block text-sm font-medium text-[#666663] mb-1">À:</label>
                  <input value={email.to} readOnly className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#666663] mb-1">Objet:</label>
                  <input value={email.subject} readOnly className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#666663] mb-1">Message:</label>
                  <textarea value={email.body} readOnly rows={10} className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] font-mono text-xs" />
                </div>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Modal Reconciliation */}
      <Modal
        isOpen={reconciliationModalOpen && reconciliationOrder}
        onClose={() => {
          setReconciliationModalOpen(false);
          setReconciliationOrder(null);
          setDiscrepancyItems({});
          setDiscrepancyTypes({});
        }}
        title="Vérification de la réception"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setReconciliationModalOpen(false);
                setReconciliationOrder(null);
                setDiscrepancyItems({});
                setDiscrepancyTypes({});
                setDamagedQuantities({});
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="success" 
              icon={Check}
              onClick={confirmReconciliationWithQuantities}
            >
              Valider la réception
            </Button>
          </div>
        }
      >
        {reconciliationOrder && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Commande: {reconciliationOrder.id}</h4>
                  <p className="text-sm text-blue-700">
                    Fournisseur: {reconciliationOrder.supplier}<br />
                    Saisissez les quantités réellement reçues et leur état pour chaque produit.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {reconciliationOrder.items.map((item, idx) => {
                const product = products.find(p => p.sku === item.sku);
                const currentReceived = discrepancyItems[item.sku]?.received !== undefined 
                  ? discrepancyItems[item.sku].received 
                  : item.quantity;
                const currentDamaged = damagedQuantities[item.sku] || 0;
                
                // Calculer le total reçu (sain + endommagé)
                const totalReceived = parseInt(currentReceived || 0) + parseInt(currentDamaged || 0);
                const hasMissing = totalReceived < item.quantity;
                const hasDamaged = parseInt(currentDamaged) > 0;
                const missingQuantity = item.quantity - totalReceived;
                
                return (
                  <div key={idx} className="border border-[#E5E4DF] rounded-lg p-4 bg-[#FAFAF7]">
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="font-medium text-[#191919]">{product?.name || item.sku}</span>
                          <span className="text-xs text-[#666663] ml-2">({item.sku})</span>
                        </div>
                          <span className="text-sm text-[#666663] font-semibold">
                            Commandé: {formatUnits(item.quantity)}
                          </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs font-medium text-[#666663] mb-1 block">
                          Quantité reçue saine
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={currentReceived}
                          onChange={(e) => updateDiscrepancyItem(item.sku, 'received', e.target.value, item.quantity)}
                          className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg text-[#191919] font-semibold focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-[#666663] mb-1 block">
                          Quantité endommagée
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={currentDamaged}
                          onChange={(e) => setDamagedQuantities(prev => ({
                            ...prev,
                            [item.sku]: parseInt(e.target.value) || 0
                          }))}
                          className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg text-[#191919] font-semibold focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] outline-none"
                        />
                      </div>
                    </div>
                    
                    {/* Indicateurs visuels automatiques */}
                    {(hasMissing || hasDamaged) && (
                      <div className="space-y-2">
                        {hasMissing && (
                          <div className="flex items-center gap-2 p-2 rounded text-xs bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-4 h-4" />
                            <span>⚠️ Manquant: {formatUnits(missingQuantity)} unités (total reçu: {formatUnits(totalReceived)}/{formatUnits(item.quantity)})</span>
                          </div>
                        )}
                        {hasDamaged && (
                          <div className="flex items-center gap-2 p-2 rounded text-xs bg-red-100 text-red-800">
                            <AlertCircle className="w-4 h-4" />
                            <span>🔴 Endommagé: {formatUnits(currentDamaged)} unités (ne seront pas ajoutées au stock)</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {(hasMissing || hasDamaged) && (
                      <div className="border-t border-[#E5E4DF] pt-3 mt-3">
                        <label className="text-xs font-medium text-[#666663] mb-1 block">
                          Notes sur le problème
                        </label>
                        <input
                          type="text"
                          placeholder="Décrivez le problème (optionnel)..."
                          value={discrepancyItems[item.sku]?.notes || ''}
                          onChange={(e) => updateDiscrepancyItem(item.sku, 'notes', e.target.value, item.quantity)}
                          className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg text-sm text-[#191919] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <strong className="text-blue-900">Comment ça marche :</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li><strong>Quantité reçue saine</strong> : Entrez le nombre d'unités en bon état</li>
                    <li><strong>Quantité endommagée</strong> : Entrez le nombre d'unités abîmées reçues</li>
                    <li><strong>Exemple :</strong> Commandé 200 → Reçu 199 saines + 1 endommagée = 200 total ✅ (rien ne manque)</li>
                    <li>Un manquant est détecté uniquement si : <strong>(saines + endommagées) &lt; commandé</strong></li>
                    <li>Seules les <strong>quantités saines</strong> seront ajoutées au stock</li>
                    <li>Un email de réclamation sera généré <strong>automatiquement</strong> en cas de problème</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Gestion des Écarts */}
      <Modal
        isOpen={discrepancyModalOpen && reconciliationOrder}
        onClose={() => setDiscrepancyModalOpen(false)}
        title={`Gestion des écarts - ${reconciliationOrder?.id}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setDiscrepancyModalOpen(false);
                setReconciliationModalOpen(true);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              icon={Mail}
              onClick={submitDiscrepancy}
            >
              Générer réclamation
            </Button>
          </div>
        }
      >
        {reconciliationOrder && (
          <>
            <div className="mb-4">
              <p className="text-sm text-[#666663]">
                Saisissez les quantités réellement reçues pour chaque produit :
              </p>
            </div>
            <div className="space-y-3">
              {reconciliationOrder.items.map((item, idx) => {
                const product = products.find(p => p.sku === item.sku);
                return (
                  <div key={idx} className="border border-[#E5E4DF] rounded-lg p-4 bg-[#FAFAF7]">
                    <div className="mb-2">
                      <span className="font-medium text-[#191919]">{product?.name || item.sku}</span>
                      <span className="text-xs text-[#666663] ml-2">({item.sku})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">Commandé</label>
                        <input 
                          type="number" 
                          value={discrepancyItems[item.sku]?.ordered || item.quantity}
                          disabled
                          className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg bg-white text-[#666663] text-center"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">Reçu</label>
                        <input 
                          type="number" 
                          value={discrepancyItems[item.sku]?.received || item.quantity}
                          onChange={(e) => setDiscrepancyItems({
                            ...discrepancyItems,
                            [item.sku]: {
                              ordered: item.quantity,
                              received: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-[#191919] text-center font-medium focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">Écart</label>
                        <div className={`w-full px-3 py-2 rounded-lg text-center font-bold ${
                          (discrepancyItems[item.sku]?.received || item.quantity) - item.quantity < 0 
                            ? 'bg-red-50 text-[#EF1C43]' 
                            : 'bg-green-50 text-green-600'
                        }`}>
                          {(discrepancyItems[item.sku]?.received || item.quantity) - item.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Modal>

      {/* Modal Réception Endommagée */}
      <Modal
        isOpen={damageModalOpen && reconciliationOrder}
        onClose={() => setDamageModalOpen(false)}
        title={`Marchandises endommagées - ${reconciliationOrder?.id}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setDamageModalOpen(false);
                setReconciliationModalOpen(true);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="danger" 
              icon={Mail}
              onClick={submitDamageReport}
            >
              Envoyer réclamation
            </Button>
          </div>
        }
      >
        {reconciliationOrder && (
          <>
            <div className="mb-4">
              <p className="text-sm text-[#666663]">
                Indiquez les quantités endommagées pour chaque produit :
              </p>
            </div>
            <div className="space-y-3">
              {reconciliationOrder.items.map((item, idx) => {
                const product = products.find(p => p.sku === item.sku);
                return (
                  <div key={idx} className="border border-[#E5E4DF] rounded-lg p-4 bg-[#FAFAF7]">
                    <div className="mb-2">
                      <span className="font-medium text-[#191919]">{product?.name || item.sku}</span>
                      <span className="text-xs text-[#666663] ml-2">({item.sku})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">Quantité totale</label>
                        <input 
                          type="number" 
                          value={item.quantity}
                          disabled
                          className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg bg-white text-[#666663] text-center"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">Quantité endommagée</label>
                        <input 
                          type="number" 
                          min="0"
                          max={item.quantity}
                          value={damageItems[item.sku]?.damaged || 0}
                          onChange={(e) => setDamageItems({
                            ...damageItems,
                            [item.sku]: {
                              total: item.quantity,
                              damaged: Math.min(parseInt(e.target.value) || 0, item.quantity)
                            }
                          })}
                          className="w-full px-3 py-2 border-2 border-[#EF1C43] rounded-lg bg-white text-[#191919] text-center font-medium focus:outline-none focus:ring-2 focus:ring-[#EF1C43]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-[#191919] block mb-2">Notes / Commentaires (optionnel)</label>
              <textarea
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                rows={3}
                placeholder="Décrivez l'état des produits endommagés..."
                className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-white text-[#191919] focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
          </>
        )}
      </Modal>

      {/* NOUVEAU: Modal Unifié de Réconciliation (Écarts + Endommagés) */}
      <Modal
        isOpen={unifiedReconciliationModalOpen && reconciliationOrder}
        onClose={() => setUnifiedReconciliationModalOpen(false)}
        title={`Réconciliation complète - ${reconciliationOrder?.id}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setUnifiedReconciliationModalOpen(false);
                setReconciliationModalOpen(true);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              icon={Check}
              onClick={submitUnifiedReconciliation}
            >
              Valider la réconciliation
            </Button>
          </div>
        }
      >
        {reconciliationOrder && (
          <>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">
                📋 Saisissez pour chaque produit :
              </p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4">
                <li>• <strong>Quantité reçue</strong> : nombre total d'unités livrées</li>
                <li>• <strong>Quantité endommagée</strong> : nombre d'unités abîmées parmi celles reçues</li>
                <li>• La <strong>quantité validée</strong> sera calculée automatiquement (Reçue - Endommagée)</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              {reconciliationOrder.items.map((item, idx) => {
                const product = products.find(p => p.sku === item.sku);
                const data = unifiedReconciliationItems[item.sku] || { 
                  ordered: item.quantity, 
                  received: item.quantity, 
                  damaged: 0 
                };
                const validated = parseInt(data.received, 10) - parseInt(data.damaged, 10);
                const discrepancy = parseInt(data.ordered, 10) - parseInt(data.received, 10);
                
                return (
                  <div key={idx} className="border border-[#E5E4DF] rounded-lg p-4 bg-[#FAFAF7]">
                    <div className="mb-3">
                      <span className="font-medium text-[#191919]">{product?.name || item.sku}</span>
                      <span className="text-xs text-[#666663] ml-2">({item.sku})</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Quantité commandée */}
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">📦 Commandé</label>
                        <input 
                          type="number" 
                          value={data.ordered}
                          disabled
                          className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg bg-white text-[#666663] text-center font-medium"
                        />
                      </div>
                      
                      {/* Quantité reçue */}
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">📥 Reçu</label>
                        <input 
                          type="number" 
                          min="0"
                          value={data.received}
                          onChange={(e) => setUnifiedReconciliationItems({
                            ...unifiedReconciliationItems,
                            [item.sku]: {
                              ...data,
                              received: Math.max(0, parseInt(e.target.value) || 0)
                            }
                          })}
                          className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-[#191919] text-center font-medium focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      
                      {/* Quantité endommagée */}
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">⚠️ Endommagé</label>
                        <input 
                          type="number" 
                          min="0"
                          max={data.received}
                          value={data.damaged}
                          onChange={(e) => setUnifiedReconciliationItems({
                            ...unifiedReconciliationItems,
                            [item.sku]: {
                              ...data,
                              damaged: Math.min(Math.max(0, parseInt(e.target.value) || 0), parseInt(data.received, 10))
                            }
                          })}
                          className="w-full px-3 py-2 border-2 border-[#EF1C43] rounded-lg bg-white text-[#191919] text-center font-medium focus:outline-none focus:ring-2 focus:ring-[#EF1C43]"
                        />
                      </div>
                      
                      {/* Quantité validée (calculée) */}
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">✅ Validé</label>
                        <div className={`w-full px-3 py-2 rounded-lg text-center font-bold ${
                          validated >= data.ordered 
                            ? 'bg-green-50 text-green-600 border border-green-200' 
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {validated}
                        </div>
                      </div>
                    </div>
                    
                    {/* Résumé des écarts */}
                    <div className="mt-3 pt-3 border-t border-[#E5E4DF] grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded ${
                        discrepancy === 0 ? 'bg-green-50' : discrepancy > 0 ? 'bg-red-50' : 'bg-blue-50'
                      }`}>
                        <span className="text-[#666663]">Écart de quantité: </span>
                        <span className={`font-bold ${
                          discrepancy === 0 ? 'text-green-600' : discrepancy > 0 ? 'text-[#EF1C43]' : 'text-blue-600'
                        }`}>
                          {discrepancy > 0 ? `-${formatUnits(discrepancy)}` : discrepancy < 0 ? `+${formatUnits(Math.abs(discrepancy))}` : '0'} unités
                        </span>
                      </div>
                      <div className="p-2 rounded bg-orange-50">
                        <span className="text-[#666663]">Perte (endommagé): </span>
                        <span className="font-bold text-orange-600">
                          {formatUnits(data.damaged)} unités
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4">
              <label className="text-sm font-medium text-[#191919] block mb-2">📝 Notes / Commentaires (optionnel)</label>
              <textarea
                value={reconciliationNotes}
                onChange={(e) => setReconciliationNotes(e.target.value)}
                rows={3}
                placeholder="Ajoutez des notes sur les écarts ou les dommages constatés..."
                className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-white text-[#191919] focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
          </>
        )}
      </Modal>

      {/* CORRECTION 4B: Modal Email de Réclamation */}
      <Modal
        isOpen={reclamationEmailModalOpen && currentReclamationOrder}
        onClose={() => setReclamationEmailModalOpen(false)}
        title={`Réclamation - ${currentReclamationOrder?.id || ''}`}
        footer={
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => setReclamationEmailModalOpen(false)}
            >
              Fermer
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                icon={FileText}
                onClick={copyReclamationToClipboard}
              >
                Copier dans le presse-papier
              </Button>
              <Button 
                variant="primary" 
                icon={Mail}
                onClick={() => {
                  const subject = `Réclamation - Commande ${currentReclamationOrder?.id || ''}`;
                  const body = encodeURIComponent(reclamationEmailContent);
                  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
                }}
              >
                Envoyer email de réclamation
              </Button>
            </div>
          </div>
        }
      >
        {currentReclamationOrder && (
          <>
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold text-blue-900 mb-2">Email de réclamation prêt</p>
                  <p>Vous pouvez modifier le texte ci-dessous, puis :</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li><strong>Copier</strong> pour coller dans votre client email</li>
                    <li><strong>Envoyer</strong> pour ouvrir directement votre client email</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="my-4">
              <textarea
                value={reclamationEmailContent}
                onChange={(e) => setReclamationEmailContent(e.target.value)}
                rows={20}
                className="w-full p-4 border-2 border-[#E5E4DF] rounded-lg font-mono text-sm bg-[#FAFAF7] text-[#191919] focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
          </>
        )}
      </Modal>

            </div> {/* Fin contenu principal avec padding */}
          </div> {/* Fin Content Area relative */}
        </div> {/* Fin Main Content md:ml-64 */}
      </div> {/* Fin min-h-screen */}
    </>
  );
};

export default StockEasy;
