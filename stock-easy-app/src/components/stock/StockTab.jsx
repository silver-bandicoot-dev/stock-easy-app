import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Download, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import { HealthBar } from '../ui/HealthBar';
import { InfoTooltip } from '../ui/InfoTooltip';
import { ImagePreview } from '../ui/ImagePreview';
import { StockKPIBar } from './StockKPIBar';
import { StockDetailPanel } from './StockDetailPanel';
import { formatUnits, formatSalesPerDay } from '../../utils/decimalUtils';
import { formatETA } from '../../utils/dateUtils';
import { exportInventoryReport } from '../../utils/exportInventory';

// Onglets de statut style Shopify
const STATUS_TABS = [
  { key: 'all', label: 'Tous', status: null },
  { key: 'urgent', label: 'Urgents', status: 'urgent' },
  { key: 'warning', label: 'À Surveiller', status: 'warning' },
  { key: 'healthy', label: 'En Bonne Santé', status: 'healthy' }
];

export const StockTab = ({
  products,
  suppliers,
  orders,
  stockLevelFilter,
  setStockLevelFilter,
  stockLevelSupplierFilter,
  setStockLevelSupplierFilter,
  searchTerm,
  setSearchTerm,
  onViewDetails,
  onCreateOrder
}) => {
  // États locaux
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'healthPercentage', direction: 'asc' });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  // Synchroniser l'onglet avec le filtre externe si fourni
  useEffect(() => {
    if (stockLevelFilter && stockLevelFilter !== 'all') {
      setActiveTab(stockLevelFilter);
    }
  }, [stockLevelFilter]);

  // Calculer les statistiques de santé
  const healthStats = useMemo(() => {
    const urgentProducts = products?.filter(p => p.healthStatus === 'urgent') || [];
    const warningProducts = products?.filter(p => p.healthStatus === 'warning') || [];
    const healthyProducts = products?.filter(p => p.healthStatus === 'healthy') || [];
    
    // Calculer la rotation moyenne
    const productsWithRotation = products?.filter(p => p.rotationRate && p.rotationRate > 0) || [];
    const avgRotation = productsWithRotation.length > 0
      ? productsWithRotation.reduce((sum, p) => sum + p.rotationRate, 0) / productsWithRotation.length
      : 0;

    return {
      urgentCount: urgentProducts.length,
      warningCount: warningProducts.length,
      healthyCount: healthyProducts.length,
      totalProducts: products?.length || 0,
      avgRotation
    };
  }, [products]);

  // Options fournisseurs
  const supplierOptions = useMemo(() => {
    const uniqueSuppliers = new Set();
    
    if (suppliers && typeof suppliers === 'object') {
      Object.keys(suppliers).forEach(name => {
        if (name) uniqueSuppliers.add(name);
      });
    }
    
    products?.forEach(product => {
      if (product?.supplier) uniqueSuppliers.add(product.supplier);
    });
    
    return Array.from(uniqueSuppliers).sort((a, b) => a.localeCompare(b));
  }, [products, suppliers]);

  const hasUnassignedProducts = useMemo(
    () => products?.some(product => !product?.supplier),
    [products]
  );

  // État pour le recalcul dynamique des jours restants
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculer les quantités en transit et commandées
  const productOrderQuantities = useMemo(() => {
    const quantities = {};
    if (!orders || orders.length === 0) return quantities;

    products?.forEach(product => {
      let inTransitQty = 0;
      let orderedQty = 0;
      let earliestETA = null;

      orders.forEach(order => {
        const orderItem = order.items?.find(item => item.sku === product.sku);
        if (orderItem) {
          const qty = orderItem.quantity || 0;
          if (order.status === 'in_transit') {
            inTransitQty += qty;
            if (order.eta) {
              const etaDate = new Date(order.eta);
              if (!earliestETA || etaDate < new Date(earliestETA)) {
                earliestETA = order.eta;
              }
            }
          } else if (order.status === 'pending_confirmation' || order.status === 'preparing') {
            orderedQty += qty;
          }
        }
      });

      if (inTransitQty > 0 || orderedQty > 0) {
        quantities[product.sku] = { inTransit: inTransitQty, ordered: orderedQty, eta: earliestETA };
      }
    });

    return quantities;
  }, [products, orders, currentTime]);

  // Filtrer les produits
  const filteredProducts = useMemo(() => {
    let filtered = products || [];

    // Filtrer par statut (onglet actif)
    const currentTab = STATUS_TABS.find(t => t.key === activeTab);
    if (currentTab?.status) {
      filtered = filtered.filter(p => p.healthStatus === currentTab.status);
    }

    // Filtrer par fournisseur
    if (stockLevelSupplierFilter && stockLevelSupplierFilter !== 'all') {
      if (stockLevelSupplierFilter === 'none') {
        filtered = filtered.filter(p => !p?.supplier);
      } else {
        filtered = filtered.filter(p => p?.supplier === stockLevelSupplierFilter);
      }
    }

    // Filtrer par recherche
    if (searchTerm?.trim()) {
      const query = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.supplier?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, activeTab, stockLevelSupplierFilter, searchTerm]);

  // Trier les produits
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [filteredProducts, sortConfig]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, page, pageSize]);

  const totalPages = Math.ceil(sortedProducts.length / pageSize);

  // Reset page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [activeTab, stockLevelSupplierFilter, searchTerm]);

  // Compter par onglet
  const tabCounts = useMemo(() => ({
    all: products?.length || 0,
    urgent: healthStats.urgentCount,
    warning: healthStats.warningCount,
    healthy: healthStats.healthyCount
  }), [products, healthStats]);

  // Handlers
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (setStockLevelFilter) {
      setStockLevelFilter(tabKey === 'all' ? 'all' : tabKey);
    }
  };

  const handleKpiClick = (status) => {
    handleTabChange(status);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleClosePanel = () => {
    setSelectedProduct(null);
  };

  // Export du rapport d'inventaire
  const handleExportInventory = () => {
    const toastId = toast.loading('Génération du rapport...');
    try {
      const result = exportInventoryReport(sortedProducts);
      if (result.success) {
        toast.success(
          `Rapport téléchargé ! ${result.totalProducts} produits • Valeur: ${result.totalStockValue.toLocaleString('fr-FR')} €`, 
          { id: toastId }
        );
      } else {
        toast.error(result.message || 'Erreur lors de l\'export', { id: toastId });
      }
    } catch (error) {
      toast.error('Erreur lors de l\'export', { id: toastId });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStockLevelSupplierFilter('all');
    setActiveTab('all');
    if (setStockLevelFilter) setStockLevelFilter('all');
    setShowFilters(false);
  };

  const hasActiveFilters = searchTerm || stockLevelSupplierFilter !== 'all';

  return (
    <motion.div
      key="stock"
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
            Niveaux de Stock 📊
          </h1>
          <p className="text-sm text-[#6B7177] mt-0.5">
            Gérez la santé de votre inventaire
          </p>
        </div>
        <button
          onClick={handleExportInventory}
          className="flex items-center gap-2 px-4 py-2 bg-[#191919] text-white rounded-full text-sm font-medium hover:bg-[#333] transition-colors shadow-sm"
        >
          <FileDown className="w-4 h-4" />
          <span>Télécharger l'inventaire</span>
        </button>
      </div>

      {/* KPIs cliquables */}
      <section>
        <StockKPIBar
          urgentCount={healthStats.urgentCount}
          warningCount={healthStats.warningCount}
          healthyCount={healthStats.healthyCount}
          totalProducts={healthStats.totalProducts}
          avgRotation={healthStats.avgRotation}
          onKpiClick={handleKpiClick}
          activeTab={activeTab}
        />
      </section>

      {/* Onglets de statut - Style pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
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
            placeholder="Rechercher par nom, SKU, fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E1E3E5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919] focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-[#6B7177] hover:text-[#191919]" />
            </button>
          )}
        </div>

        {/* Filtres rapides */}
        <div className="flex items-center gap-2">
          <select
            value={stockLevelSupplierFilter}
            onChange={(e) => setStockLevelSupplierFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#E1E3E5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919]"
          >
            <option value="all">Tous les fournisseurs</option>
            {hasUnassignedProducts && (
              <option value="none">Non assigné</option>
            )}
            {supplierOptions.map(supplier => (
              <option key={supplier} value={supplier}>
                {supplier}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-[#191919] text-white'
                : 'bg-white border border-[#E1E3E5] text-[#191919] hover:border-[#8A8C8E]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-white" />
            )}
          </button>
        </div>

        {/* Filtres avancés inline */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 w-full mt-2">
            <div className="text-sm text-[#6B7177]">
              {sortedProducts.length} produit{sortedProducts.length > 1 ? 's' : ''} affiché{sortedProducts.length > 1 ? 's' : ''}
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tableau et panel de détail */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Tableau - Style léger avec bordure subtile */}
        <div className={`flex-1 bg-white rounded-lg border border-[#E1E3E5] overflow-hidden flex flex-col ${selectedProduct ? 'hidden lg:flex lg:w-1/2 xl:w-3/5' : ''}`}>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F6F6F7] border-b border-[#E1E3E5] sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider cursor-pointer hover:text-[#191919]"
                    onClick={() => handleSort('stock')}
                  >
                    Stock {sortConfig.key === 'stock' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider cursor-pointer hover:text-[#191919]"
                    onClick={() => handleSort('daysOfStock')}
                  >
                    Autonomie {sortConfig.key === 'daysOfStock' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span>En transit</span>
                      <InfoTooltip content="Quantités en cours de réapprovisionnement" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider cursor-pointer hover:text-[#191919]"
                    onClick={() => handleSort('rotationRate')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Rotation</span>
                      <InfoTooltip content="Nombre de fois que le stock se renouvelle par an" />
                      {sortConfig.key === 'rotationRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider cursor-pointer hover:text-[#191919]"
                    onClick={() => handleSort('healthPercentage')}
                  >
                    Santé {sortConfig.key === 'healthPercentage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E1E3E5]">
                {paginatedProducts.map(product => (
                  <tr 
                    key={product.sku} 
                    className={`hover:bg-[#FAFAF7] transition-colors cursor-pointer ${
                      selectedProduct?.sku === product.sku ? 'bg-[#FAFAF7]' : ''
                    }`}
                    onClick={() => handleSelectProduct(product)}
                  >
                    {/* Produit */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl || product.sku ? (
                          <ImagePreview
                            src={product.imageUrl}
                            alt={product.name}
                            sku={product.sku}
                            thumbClassName="w-11 h-11 rounded-md object-cover flex-shrink-0 bg-[#E5E4DF]"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-md bg-[#E5E4DF] flex items-center justify-center text-xs text-[#666663] flex-shrink-0">
                            {product.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <div className="font-bold text-[#191919] text-sm truncate">{product.name}</div>
                          <div className="text-xs text-[#666663]">{product.sku}</div>
                          <div className="text-xs text-[#666663] mt-0.5">
                            {formatSalesPerDay(product.salesPerDay ?? 0)} ventes/jour
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Fournisseur */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="font-medium text-[#191919] text-sm">{product.supplier || 'Non assigné'}</div>
                        <div className="text-xs text-[#666663]">
                          Délai: {product.leadTimeDays || 0}j
                        </div>
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="font-bold text-[#191919] text-sm">{formatUnits(product.stock)}</div>
                        <div className="text-xs text-[#666663]">
                          Seuil: {product.reorderPoint || 0}
                        </div>
                      </div>
                    </td>

                    {/* Autonomie */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <div className={`font-bold text-sm ${
                          product.healthStatus === 'urgent' ? 'text-red-600' :
                          product.healthStatus === 'warning' ? 'text-orange-500' :
                          'text-green-600'
                        }`}>
                          {product.daysOfStock || 0}j
                        </div>
                        {product.isDeepOverstock && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#D1D5DB] bg-[#F9FAFB] text-[#6B7280] text-[10px] font-medium w-fit">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Surstock
                          </div>
                        )}
                        {product.qtyToOrder > 0 && (
                          <div className="text-xs text-red-600 font-medium">
                            → {formatUnits(product.qtyToOrder)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* En transit */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {productOrderQuantities[product.sku] ? (
                          <>
                            {productOrderQuantities[product.sku].inTransit > 0 && (
                              <div className="text-sm font-medium text-purple-600">
                                {formatUnits(productOrderQuantities[product.sku].inTransit)}
                                {productOrderQuantities[product.sku].eta && (
                                  <span className="text-xs text-[#666663] ml-1">
                                    ({formatETA(productOrderQuantities[product.sku].eta).formatted})
                                  </span>
                                )}
                              </div>
                            )}
                            {productOrderQuantities[product.sku].ordered > 0 && (
                              <div className="text-sm font-medium text-yellow-600">
                                +{formatUnits(productOrderQuantities[product.sku].ordered)} cmd
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-[#666663]">-</div>
                        )}
                      </div>
                    </td>

                    {/* Rotation */}
                    <td className="px-4 py-4">
                      {product.rotationRate > 0 ? (
                        <div className={`font-bold text-sm ${
                          product.rotationRate > 6 ? 'text-green-600' :
                          product.rotationRate > 2 ? 'text-blue-600' :
                          'text-orange-600'
                        }`}>
                          {product.rotationRate.toFixed(1)}x
                        </div>
                      ) : (
                        <div className="text-sm text-[#666663]">N/A</div>
                      )}
                    </td>

                    {/* Santé */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <div className="text-sm font-bold text-[#191919]">
                          {Math.round(product.healthPercentage || 0)}%
                        </div>
                        <div className="w-16">
                          <HealthBar percentage={product.healthPercentage || 0} status={product.healthStatus} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty state */}
            {paginatedProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="w-12 h-12 text-[#E1E3E5] mb-4" />
                <h3 className="text-lg font-medium text-[#191919] mb-2">Aucun produit trouvé</h3>
                <p className="text-sm text-[#6B7177] mb-4">
                  Essayez de modifier vos filtres ou votre recherche
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-[#191919] font-medium underline"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-[#E1E3E5] px-4 py-3 flex items-center justify-between bg-[#F6F6F7]">
              <span className="text-sm text-[#6B7177]">
                {sortedProducts.length} produit{sortedProducts.length > 1 ? 's' : ''} • Page {page} sur {totalPages}
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
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
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
          {selectedProduct && (
            <StockDetailPanel
              product={selectedProduct}
              orderQuantities={productOrderQuantities[selectedProduct.sku]}
              onClose={handleClosePanel}
              onCreateOrder={onCreateOrder}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default StockTab;
