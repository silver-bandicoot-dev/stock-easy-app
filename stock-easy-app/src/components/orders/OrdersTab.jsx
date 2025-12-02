import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Download, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { OrdersKPIBar } from './OrdersKPIBar';
import { OrdersTable } from './OrdersTable';
import { OrderDetailPanel } from './OrderDetailPanel';
import { OrderFilters } from './OrderFilters';
import { ReplacementReceiptModal } from '../modals/ReplacementReceiptModal';
import { EditOrderModal } from '../modals/EditOrderModal';
import api from '../../services/apiAdapter';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { updateShopifyInventory, prepareStockUpdatesFromReconciliation } from '../../services/gadgetService';

export const OrdersTab = ({
  // Data props - Support both naming conventions
  orders: initialOrders = [],
  suppliers = {},
  products,
  enrichedProducts,
  warehouses = {},
  // Expanded state (from parent)
  expandedOrders,
  setExpandedOrders,
  // Actions - Support both new and legacy patterns
  confirmOrder,
  shipOrder,
  receiveOrder,
  handleUpdateOrderStatus,
  handleDeleteOrder,
  handleUpdateQuantityReceived,
  handleReconcileOrder,
  handleUpdateOrderItems,
  // Modal handlers - Support both patterns
  reconciliationModal,
  reconciliationModalHandlers,
  reclamationEmailModal,
  reclamationEmailModalHandlers,
  reconciliationLogic,
  emailGeneration,
  // Individual reconciliation handlers
  handleSaveReconciliation,
  handleCloseAndSaveAsDraft,
  handleDiscardDraft,
  handleUpdateReconciledItem,
  handleAutoReconcile,
  generateReclamationEmail,
  // Other props
  orderEmailModal,
  getUserSignature,
  currentUser,
  loadData
}) => {
  // Use enrichedProducts if products not provided
  const productsList = products || enrichedProducts || [];
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();
  const { resourceParams, clearResourceParams, getShareableUrl, navigateToOrder } = useAppNavigation();

  // Onglets de statut style Shopify
  const STATUS_TABS = [
    { key: 'all', label: t('ordersPage.tabs.all'), status: null },
    { key: 'pending_confirmation', label: t('ordersPage.tabs.pending'), status: 'pending_confirmation' },
    { key: 'preparing', label: t('ordersPage.tabs.preparing'), status: 'preparing' },
    { key: 'in_transit', label: t('ordersPage.tabs.inTransit'), status: 'in_transit' },
    { key: 'received', label: t('ordersPage.tabs.received'), status: 'received' },
    { key: 'reconciliation', label: t('ordersPage.tabs.reconciliation'), status: 'reconciliation' },
    { key: 'completed', label: t('ordersPage.tabs.completed'), status: 'completed' }
  ];
  
  // États
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  
  // État pour la modale de remplacement
  const [replacementModalOrder, setReplacementModalOrder] = useState(null);
  const [isProcessingReplacement, setIsProcessingReplacement] = useState(false);
  
  // État pour la modale d'édition
  const [editModalOrder, setEditModalOrder] = useState(null);
  const [isProcessingEdit, setIsProcessingEdit] = useState(false);
  
  // Filtres avancés
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [remoteOrders, setRemoteOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1 });
  const [aggregates, setAggregates] = useState(null);

  // Charger les données depuis le serveur
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = STATUS_TABS.find(t => t.key === activeTab)?.status;
      
      const result = await api.getOrdersPaginated({
        page,
        pageSize,
        status: statusFilter || 'all',
        supplier: supplierFilter,
        startDate: dateStart,
        endDate: dateEnd,
        search: searchQuery
      });
      
      setRemoteOrders(result.data || []);
      setMeta(result.meta || { totalCount: 0, totalPages: 1 });
      setAggregates(result.aggregates || null);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error(t('ordersPage.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeTab, supplierFilter, dateStart, dateEnd, searchQuery]);

  // Effet pour charger les données
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [activeTab, supplierFilter, dateStart, dateEnd, searchQuery]);

  // Auto-sélectionner une commande depuis l'URL (ex: /app/orders?order=PO-2024-001)
  useEffect(() => {
    if (resourceParams.orderId && initialOrders.length > 0) {
      const orderFromUrl = initialOrders.find(
        o => o.id === resourceParams.orderId || 
             o.id?.toLowerCase() === resourceParams.orderId.toLowerCase()
      );
      
      if (orderFromUrl) {
        setSelectedOrder(orderFromUrl);
        // Effacer le paramètre URL après avoir sélectionné
        clearResourceParams();
      } else {
        // Commande non trouvée
        toast.error(t('ordersPage.orderNotFound', { id: resourceParams.orderId }));
        clearResourceParams();
      }
    }
  }, [resourceParams.orderId, initialOrders, clearResourceParams, t]);

  // Calculer les KPIs toujours à partir des données locales (initialOrders)
  // pour garantir la cohérence avec le filtrage côté client
  const kpis = useMemo(() => {
    const statusCounts = {};
    let totalAmount = 0;
    
    initialOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      totalAmount += order.total || 0;
    });
    
    return {
      today: initialOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
      }).length,
      pending: statusCounts.pending_confirmation || 0,
      preparing: statusCounts.preparing || 0,
      inTransit: statusCounts.in_transit || 0,
      received: statusCounts.received || 0,
      reconciliation: statusCounts.reconciliation || 0,
      completed: statusCounts.completed || 0,
      totalAmount
    };
  }, [initialOrders]);

  // Enrichir les commandes avec les items des données initiales
  // Note: On utilise prioritairement initialOrders pour garantir le filtrage côté client
  const enrichedOrders = useMemo(() => {
    // Créer un map des items par orderId depuis initialOrders
    const itemsByOrderId = {};
    initialOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        itemsByOrderId[order.id] = order.items;
      }
    });
    
    // Enrichir chaque commande avec ses items si manquants
    return initialOrders.map(order => ({
      ...order,
      items: order.items?.length > 0 ? order.items : (itemsByOrderId[order.id] || [])
    }));
  }, [initialOrders]);

  // Filtrer les commandes par statut (côté client)
  const filteredOrders = useMemo(() => {
    // Trouver le statut correspondant à l'onglet actif
    const currentTab = STATUS_TABS.find(t => t.key === activeTab);
    const statusFilter = currentTab?.status;
    
    let filtered = enrichedOrders;
    
    // Filtrer par statut si un onglet spécifique est sélectionné
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Filtrer par fournisseur si sélectionné
    if (supplierFilter && supplierFilter !== 'all') {
      filtered = filtered.filter(order => order.supplier === supplierFilter);
    }
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.id?.toLowerCase().includes(query) ||
        order.supplier?.toLowerCase().includes(query) ||
        order.warehouseName?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [enrichedOrders, activeTab, supplierFilter, searchQuery]);

  // Trier les commandes
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Gérer les dates
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'confirmedAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // Gérer les nombres
      if (sortConfig.key === 'total') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  // Compter par onglet
  const tabCounts = useMemo(() => {
    const counts = {
      all: 0,
      pending_confirmation: kpis.pending,
      preparing: kpis.preparing,
      in_transit: kpis.inTransit,
      received: kpis.received,
      reconciliation: kpis.reconciliation,
      completed: kpis.completed
    };
    counts.all = counts.pending_confirmation + counts.preparing + counts.in_transit + 
                 counts.received + counts.reconciliation + counts.completed;
    return counts;
  }, [kpis]);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleClosePanel = () => {
    setSelectedOrder(null);
  };

  // Copier le lien partageable d'une commande
  const handleShareOrder = useCallback(async (orderId) => {
    const url = getShareableUrl('order', orderId);
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('ordersPage.linkCopied'));
    } catch (err) {
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(t('ordersPage.linkCopied'));
    }
  }, [getShareableUrl, t]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(sortedOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOne = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleExportCSV = async () => {
    const toastId = toast.loading(t('ordersPage.exportPreparing'));
    try {
      const ordersToExport = selectedOrders.length > 0 
        ? sortedOrders.filter(o => selectedOrders.includes(o.id))
        : sortedOrders;

      const csvData = ordersToExport.map(order => ({
        [t('ordersPage.export.orderNumber')]: order.id,
        [t('ordersPage.export.supplier')]: order.supplier,
        [t('ordersPage.export.status')]: t(`orders.status.${order.status}`) || order.status,
        [t('ordersPage.export.date')]: new Date(order.createdAt).toLocaleDateString(),
        [t('ordersPage.export.total')]: formatCurrency(order.total),
        [t('ordersPage.export.products')]: order.items?.length || 0,
        [t('ordersPage.export.warehouse')]: order.warehouseName || order.warehouseId || t('ordersPage.export.notSpecified'),
        [t('ordersPage.export.tracking')]: order.trackingNumber || t('ordersPage.export.notAvailable')
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success(t('ordersPage.exportSuccess'), { id: toastId });
    } catch (error) {
      toast.error(t('ordersPage.exportError'), { id: toastId });
    }
  };

  // Actions sur commande
  const handleConfirmOrder = async (orderId) => {
    if (confirmOrder) {
      await confirmOrder(orderId);
      fetchOrders();
      if (typeof loadData === 'function') {
        await loadData();
      }
    }
  };

  // Pour l'expédition, on ouvre juste la modale (le refresh se fait après confirmation dans la modale)
  const handleShipOrder = (orderId) => {
    if (shipOrder) {
      shipOrder(orderId); // Ouvre la modale d'expédition
    }
  };

  const handleReceiveOrder = async (orderId) => {
    if (receiveOrder) {
      await receiveOrder(orderId);
      fetchOrders();
      if (typeof loadData === 'function') {
        await loadData();
      }
    }
  };

  const handleStartReconciliation = (order) => {
    if (reconciliationModalHandlers?.open) {
      reconciliationModalHandlers.open(order);
    }
  };

  // Confirmation de réconciliation - Utilise l'API via le service importé
  const handleConfirmReconciliation = async (orderId) => {
    try {
      console.log('🔄 Confirmation réconciliation pour:', orderId);
      
      // 1. Trouver la commande dans la liste
      const order = localOrders.find(o => o.id === orderId);
      if (!order) {
        console.error('❌ Commande non trouvée:', orderId);
        toast.error(t('ordersPage.reconciliationError'));
        return;
      }
      
      // 2. Confirmer la réconciliation dans Supabase (met à jour le stock local)
      const result = await api.confirmOrderReconciliation(orderId);
      console.log('📦 Résultat confirmOrderReconciliation:', result);
      
      // La RPC peut retourner { success: true } ou directement les données
      const isSuccess = result?.success === true || (result && !result.error);
      
      if (isSuccess) {
        // 3. Préparer et envoyer les mises à jour vers Shopify via Gadget
        const productsList = products || enrichedProducts || [];
        const stockUpdates = prepareStockUpdatesFromReconciliation(order, productsList);
        
        if (stockUpdates.length > 0 && order.company_id) {
          console.log('🔄 Envoi mise à jour Shopify pour', stockUpdates.length, 'produits');
          
          const shopifyResult = await updateShopifyInventory(order.company_id, stockUpdates);
          
          if (shopifyResult.success) {
            console.log('✅ Inventaire Shopify mis à jour:', shopifyResult);
            toast.success(t('ordersPage.reconciliationConfirmed') + ` (${shopifyResult.processed} produits synchronisés)`);
          } else {
            console.warn('⚠️ Mise à jour Shopify partielle ou échouée:', shopifyResult);
            // On affiche quand même le succès car la réconciliation locale a fonctionné
            toast.success(t('ordersPage.reconciliationConfirmed'));
            if (shopifyResult.error) {
              toast.warning(t('ordersPage.shopifySyncWarning', 'Synchronisation Shopify en attente - vérifiez la configuration'));
            }
          }
        } else {
          toast.success(t('ordersPage.reconciliationConfirmed'));
        }
        
        // 4. Rafraîchir les données locales et globales
        fetchOrders();
        if (typeof loadData === 'function') {
          await loadData();
        }
      } else {
        toast.error(result?.error || result?.message || t('ordersPage.reconciliationError'));
      }
    } catch (error) {
      console.error('❌ Erreur lors de la confirmation de la réconciliation:', error);
      toast.error(t('ordersPage.reconciliationError'));
    }
  };

  // Générer une réclamation fournisseur
  const handleGenerateReclamation = (order) => {
    if (reclamationEmailModalHandlers?.open) {
      reclamationEmailModalHandlers.open(order);
    } else if (reclamationEmailModal?.openReclamationEmailModal) {
      reclamationEmailModal.openReclamationEmailModal(order);
    } else {
      console.warn('⚠️ Modale de réclamation non disponible');
      toast.error(t('ordersPage.reclamationModalUnavailable', 'Impossible d\'ouvrir la modale de réclamation'));
    }
  };

  // Compléter la réconciliation (archiver la commande)
  const handleCompleteReconciliation = async (orderId) => {
    await handleConfirmReconciliation(orderId);
    // Désélectionner la commande après archivage
    setSelectedOrder(null);
  };

  // Ouvrir la modale de réception de remplacement
  const handleOpenReplacementModal = (order) => {
    setReplacementModalOrder(order);
  };

  // Confirmer la réception des articles de remplacement
  const handleConfirmReplacement = async (orderId, replacements) => {
    try {
      setIsProcessingReplacement(true);
      console.log('📦 Réception remplacement pour commande:', orderId, replacements);
      
      // Appeler l'API Supabase
      const result = await api.receiveReplacementItems(orderId, replacements);
      
      if (result.success) {
        toast.success(t('orders.replacement.success', 'Articles de remplacement reçus ! Stock mis à jour.'));
        
        // Fermer la modale
        setReplacementModalOrder(null);
        
        // Rafraîchir les données
        fetchOrders();
        if (typeof loadData === 'function') {
          await loadData();
        }
      } else {
        toast.error(result.error || t('orders.replacement.error', 'Erreur lors de la réception'));
      }
    } catch (error) {
      console.error('❌ Erreur réception remplacement:', error);
      toast.error(t('orders.replacement.error', 'Erreur lors de la réception'));
    } finally {
      setIsProcessingReplacement(false);
    }
  };

  // Ouvrir la modale d'édition
  const handleOpenEditModal = (order) => {
    // Vérifier que le statut permet l'édition
    if (!['pending_confirmation', 'preparing'].includes(order.status)) {
      toast.error(t('editOrder.notAllowed', 'Modification non autorisée pour ce statut'));
      return;
    }
    setEditModalOrder(order);
  };

  // Sauvegarder les modifications de la commande
  const handleSaveOrderEdit = async (orderId, updates) => {
    try {
      setIsProcessingEdit(true);
      console.log('📝 Sauvegarde modifications commande:', orderId, updates);
      
      // Appeler l'API Supabase
      const result = await api.updateOrder(orderId, updates);
      
      if (result.success) {
        toast.success(t('editOrder.success', 'Commande modifiée avec succès !'));
        
        // Fermer la modale
        setEditModalOrder(null);
        
        // Rafraîchir les données
        fetchOrders();
        if (typeof loadData === 'function') {
          await loadData();
        }
        
        // Mettre à jour la commande sélectionnée si c'est la même
        if (selectedOrder?.id === orderId) {
          // Re-sélectionner avec les nouvelles données
          const updatedOrder = { ...selectedOrder, ...updates };
          setSelectedOrder(updatedOrder);
        }
      } else {
        toast.error(result.error || t('editOrder.error', 'Erreur lors de la modification'));
      }
    } catch (error) {
      console.error('❌ Erreur modification commande:', error);
      toast.error(t('editOrder.error', 'Erreur lors de la modification'));
    } finally {
      setIsProcessingEdit(false);
    }
  };

  return (
    <motion.div
      key="orders"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col space-y-6"
    >
      {/* Header - Style Dashboard épuré */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#191919]">
            {t('ordersPage.title')}
          </h1>
          <p className="text-sm text-[#6B7177] mt-0.5">
            {t('ordersPage.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E1E3E5] rounded-full text-sm font-medium text-[#191919] hover:border-[#8A8C8E] transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.export')}</span>
          </button>
        </div>
      </div>

      {/* KPIs cliquables */}
      <section>
        <OrdersKPIBar 
          kpis={kpis} 
          formatCurrency={formatCurrency} 
          onKpiClick={(tab) => setActiveTab(tab)}
          activeTab={activeTab}
        />
      </section>

      {/* Onglets de statut - Style pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-[#191919] text-white shadow-sm'
                : 'bg-white text-[#6B7177] border border-[#E1E3E5] hover:border-[#8A8C8E] hover:text-[#191919]'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#F6F6F7] text-[#6B7177]'
            }`}>
              {tabCounts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Barre de filtres - Style léger */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-[#F6F6F7] rounded-lg">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7177]" />
          <input
            type="text"
            placeholder={t('ordersPage.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E1E3E5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919] focus:border-transparent"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-[#6B7177] hover:text-[#191919]" />
            </button>
          )}
        </div>

        {/* Filtres rapides */}
        <div className="flex items-center gap-2">
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#E1E3E5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919]"
          >
            <option value="all">{t('ordersPage.allSuppliers')}</option>
            {Object.values(suppliers || {}).map(supplier => (
              <option key={supplier.name} value={supplier.name}>
                {supplier.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              showFilters || dateStart || dateEnd
                ? 'bg-[#191919] text-white'
                : 'bg-white border border-[#E1E3E5] text-[#191919] hover:border-[#8A8C8E]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{t('stockPage.filters')}</span>
          </button>
        </div>

        {/* Filtres avancés inline */}
        {showFilters && (
          <div className="w-full mt-2">
            <OrderFilters
              dateStart={dateStart}
              setDateStart={setDateStart}
              dateEnd={dateEnd}
              setDateEnd={setDateEnd}
              onClear={() => {
                setDateStart('');
                setDateEnd('');
              }}
            />
          </div>
        )}
      </div>

      {/* Tableau et panel de détail */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Tableau - Style léger */}
        <div className={`flex-1 bg-white rounded-lg border border-[#E1E3E5] overflow-hidden flex flex-col ${selectedOrder ? 'hidden lg:flex lg:w-1/2 xl:w-3/5' : ''}`}>
          <OrdersTable
            orders={sortedOrders}
            loading={loading}
            suppliers={suppliers}
            products={products}
            warehouses={warehouses}
            selectedOrders={selectedOrders}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onSelectOrder={handleSelectOrder}
            selectedOrder={selectedOrder}
            sortConfig={sortConfig}
            onSort={handleSort}
            formatCurrency={formatCurrency}
            // Handlers pour les boutons d'action
            onConfirmOrder={handleConfirmOrder}
            onShipOrder={handleShipOrder}
            onReceiveOrder={handleReceiveOrder}
            onStartReconciliation={handleStartReconciliation}
            onConfirmReconciliation={handleConfirmReconciliation}
          />

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="border-t border-[#E1E3E5] px-4 py-3 flex items-center justify-between bg-[#F6F6F7]">
              <span className="text-sm text-[#6B7177]">
                {t('ordersPage.pagination.summary', { count: meta.totalCount, page: page, totalPages: meta.totalPages })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-[#E1E3E5] bg-white hover:bg-[#F6F6F7] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="p-2 rounded-lg border border-[#E1E3E5] bg-white hover:bg-[#F6F6F7] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel de détail */}
        <AnimatePresence>
          {selectedOrder && (
            <OrderDetailPanel
              order={selectedOrder}
              suppliers={suppliers}
              products={products}
              warehouses={warehouses}
              onClose={handleClosePanel}
              onConfirm={handleConfirmOrder}
              onShip={handleShipOrder}
              onReceive={handleReceiveOrder}
              onStartReconciliation={handleStartReconciliation}
              onGenerateReclamation={handleGenerateReclamation}
              onCompleteReconciliation={handleCompleteReconciliation}
              onReceiveReplacement={handleOpenReplacementModal}
              onShare={handleShareOrder}
              onEdit={handleOpenEditModal}
              formatCurrency={formatCurrency}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Modale de réception des remplacements */}
      <ReplacementReceiptModal
        isOpen={!!replacementModalOrder}
        onClose={() => setReplacementModalOrder(null)}
        order={replacementModalOrder}
        onConfirm={handleConfirmReplacement}
        isProcessing={isProcessingReplacement}
      />
      
      {/* Modale d'édition de commande */}
      <EditOrderModal
        isOpen={!!editModalOrder}
        onClose={() => setEditModalOrder(null)}
        order={editModalOrder}
        products={productsList}
        onSave={handleSaveOrderEdit}
        isProcessing={isProcessingEdit}
      />
    </motion.div>
  );
};

