import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Search, 
  Filter,
  ChevronUp,
  ChevronDown,
  Package,
  DollarSign,
  BarChart3,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { exportInventoryReport } from '../../utils/exportInventory';
import { useCurrency } from '../../contexts/CurrencyContext';

/**
 * Helper pour formater le prix avec le contexte de devise
 */
const useFormatPrice = () => {
  const { format } = useCurrency();
  return (amount) => format(amount);
};

/**
 * Composant KPI pour les statistiques de l'inventaire
 */
const InventoryKPI = ({ icon: Icon, label, value, subValue, trend }) => (
  <div className="bg-white rounded-xl border border-[#E5E4DF] p-4 flex items-center gap-4">
    <div className="p-3 rounded-lg bg-[#FAFAF7]">
      <Icon className="w-5 h-5 text-[#191919]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-[#666663] truncate">{label}</p>
      <p className="text-lg font-semibold text-[#191919]">{value}</p>
      {subValue && (
        <p className="text-xs text-[#666663] truncate">{subValue}</p>
      )}
    </div>
    {trend && (
      <div className={`px-2 py-1 rounded text-xs font-medium ${
        trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
      }`}>
        {trend > 0 ? '+' : ''}{trend}%
      </div>
    )}
  </div>
);

/**
 * InventoryTab - Source de vérité pour l'inventaire du marchand
 * Affiche un tableau complet avec toutes les informations d'inventaire
 */
export const InventoryTab = ({ products = [], suppliers = [] }) => {
  const formatPrice = useFormatPrice();
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'sku', direction: 'asc' });

  // Calcul des totaux
  const totals = useMemo(() => {
    let totalUnits = 0;
    let totalStockValue = 0;
    let totalSaleValue = 0;
    let totalProducts = products.length;
    let outOfStock = 0;

    products.forEach(product => {
      const qty = product.stock || 0;
      const buyPrice = product.buyPrice || 0;
      const sellPrice = product.sellPrice || 0;
      
      totalUnits += qty;
      totalStockValue += qty * buyPrice;
      totalSaleValue += qty * sellPrice;
      
      if (qty === 0) outOfStock++;
    });

    return {
      totalProducts,
      totalUnits,
      totalStockValue,
      totalSaleValue,
      outOfStock,
      potentialMargin: totalSaleValue - totalStockValue
    };
  }, [products]);

  // Filtrage et tri des produits
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.sku?.toLowerCase() || '').includes(term) ||
        (p.name?.toLowerCase() || '').includes(term) ||
        (p.supplier?.toLowerCase() || '').includes(term)
      );
    }

    // Filtre par fournisseur
    if (supplierFilter !== 'all') {
      filtered = filtered.filter(p => p.supplier === supplierFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Gestion des valeurs nulles
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      // Tri numérique
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Tri texte
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [products, searchTerm, supplierFilter, sortConfig]);

  // Gestion du tri
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Export CSV
  const handleExportInventory = () => {
    const toastId = toast.loading('Préparation du rapport...');
    try {
      const result = exportInventoryReport(filteredProducts);
      if (result.success) {
        toast.success(`Rapport exporté ! ${result.totalProducts} produits, ${formatPrice(result.totalStockValue)} de valeur`, { id: toastId });
      } else {
        toast.error(result.message || 'Erreur lors de l\'export', { id: toastId });
      }
    } catch (error) {
      toast.error('Erreur lors de l\'export', { id: toastId });
    }
  };

  // Icône de tri
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-[#999]" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3.5 h-3.5 text-[#191919]" />
      : <ChevronDown className="w-3.5 h-3.5 text-[#191919]" />;
  };

  // Liste des fournisseurs uniques
  const uniqueSuppliers = useMemo(() => {
    const supplierSet = new Set(products.map(p => p.supplier).filter(Boolean));
    return Array.from(supplierSet).sort();
  }, [products]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#191919]">Inventaire</h1>
          <p className="text-sm text-[#666663] mt-1">
            Source de vérité de votre stock • {totals.totalProducts} références
          </p>
        </div>
        <button
          onClick={handleExportInventory}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#191919] text-white rounded-lg hover:bg-[#333] transition-colors font-medium shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Télécharger l'inventaire</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InventoryKPI
          icon={Package}
          label="Total Références"
          value={totals.totalProducts.toLocaleString('fr-FR')}
          subValue={`${totals.outOfStock} en rupture`}
        />
        <InventoryKPI
          icon={BarChart3}
          label="Unités en Stock"
          value={totals.totalUnits.toLocaleString('fr-FR')}
        />
        <InventoryKPI
          icon={DollarSign}
          label="Valeur du Stock (coût)"
          value={formatPrice(totals.totalStockValue)}
        />
        <InventoryKPI
          icon={DollarSign}
          label="Valeur du Stock (vente)"
          value={formatPrice(totals.totalSaleValue)}
          subValue={`Marge potentielle: ${formatPrice(totals.potentialMargin)}`}
        />
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666663]" />
          <input
            type="text"
            placeholder="Rechercher par SKU, nom ou fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919]/20 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666663]" />
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919]/20 bg-white appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="all">Tous les fournisseurs</option>
            {uniqueSuppliers.map(supplier => (
              <option key={supplier} value={supplier}>{supplier}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-[#E5E4DF] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFAF7] border-b border-[#E5E4DF]">
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider cursor-pointer hover:bg-[#E5E4DF]/50 transition-colors"
                  onClick={() => handleSort('sku')}
                >
                  <div className="flex items-center gap-1.5">
                    SKU
                    <SortIcon columnKey="sku" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider cursor-pointer hover:bg-[#E5E4DF]/50 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    Nom du produit
                    <SortIcon columnKey="name" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider cursor-pointer hover:bg-[#E5E4DF]/50 transition-colors"
                  onClick={() => handleSort('supplier')}
                >
                  <div className="flex items-center gap-1.5">
                    Fournisseur
                    <SortIcon columnKey="supplier" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-semibold text-[#666663] uppercase tracking-wider cursor-pointer hover:bg-[#E5E4DF]/50 transition-colors"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Quantité
                    <SortIcon columnKey="stock" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-semibold text-[#666663] uppercase tracking-wider cursor-pointer hover:bg-[#E5E4DF]/50 transition-colors"
                  onClick={() => handleSort('buyPrice')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Prix achat HT
                    <SortIcon columnKey="buyPrice" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-semibold text-[#666663] uppercase tracking-wider cursor-pointer hover:bg-[#E5E4DF]/50 transition-colors"
                  onClick={() => handleSort('sellPrice')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Prix vente HT
                    <SortIcon columnKey="sellPrice" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#666663] uppercase tracking-wider">
                  Valeur stock (coût)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#666663] uppercase tracking-wider">
                  Valeur stock (vente)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E4DF]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-[#E5E4DF]" />
                      <p className="text-[#666663]">Aucun produit trouvé</p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-sm text-[#191919] underline hover:no-underline"
                        >
                          Effacer la recherche
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => {
                  const qty = product.stock || 0;
                  const buyPrice = product.buyPrice || 0;
                  const sellPrice = product.sellPrice || 0;
                  const stockValueCost = qty * buyPrice;
                  const stockValueSale = qty * sellPrice;
                  const isOutOfStock = qty === 0;

                  return (
                    <tr 
                      key={product.sku || index}
                      className={`hover:bg-[#FAFAF7] transition-colors ${isOutOfStock ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-[#191919] font-medium">
                          {product.sku || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#191919] line-clamp-2">
                          {product.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#666663]">
                          {product.supplier || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${
                          isOutOfStock ? 'text-red-600' : 'text-[#191919]'
                        }`}>
                          {qty.toLocaleString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-[#666663]">
                          {formatPrice(buyPrice)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-[#666663]">
                          {formatPrice(sellPrice)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-[#191919]">
                          {formatPrice(stockValueCost)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-[#191919]">
                          {formatPrice(stockValueSale)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Ligne de total */}
            {filteredProducts.length > 0 && (
              <tfoot>
                <tr className="bg-[#FAFAF7] border-t-2 border-[#E5E4DF]">
                  <td className="px-4 py-3 font-semibold text-[#191919]" colSpan={3}>
                    TOTAL ({filteredProducts.length} produits)
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#191919]">
                    {filteredProducts.reduce((sum, p) => sum + (p.stock || 0), 0).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right text-[#666663]">-</td>
                  <td className="px-4 py-3 text-right text-[#666663]">-</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#191919]">
                    {formatPrice(filteredProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.buyPrice || 0)), 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#191919]">
                    {formatPrice(filteredProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.sellPrice || 0)), 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Info sur l'export */}
      <div className="flex items-start gap-3 p-4 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]">
        <Download className="w-5 h-5 text-[#666663] mt-0.5 shrink-0" />
        <div className="text-sm text-[#666663]">
          <p className="font-medium text-[#191919]">Export CSV comptable</p>
          <p className="mt-1">
            Le fichier téléchargé contient toutes les données de l'inventaire filtré, 
            incluant les totaux de valorisation. Compatible avec Excel et tous les logiciels comptables.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryTab;

