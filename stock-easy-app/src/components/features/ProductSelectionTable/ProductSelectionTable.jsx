import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, Search, Check, X, Package, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../shared/Button';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { ImagePreview } from '../../ui/ImagePreview';

export function ProductSelectionTable({ products, suppliers, onCreateOrder }) {
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();
  const [selectedProducts, setSelectedProducts] = useState(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // États pour le tri
  const [sortColumn, setSortColumn] = useState('sku');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // État pour les actions en masse
  const [bulkQuantity, setBulkQuantity] = useState('');
  
  // État pour gérer les valeurs en cours de saisie
  const [editingQuantities, setEditingQuantities] = useState(new Map());

  // Filtrage et tri des produits
  const sortedAndFilteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Filtre recherche
      const matchesSearch = !searchTerm || 
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtre fournisseur
      const matchesSupplier = supplierFilter === 'all' || product.supplier === supplierFilter;

      // Filtre statut
      let matchesStatus = true;
      if (statusFilter === 'to_order') {
        matchesStatus = product.qtyToOrder > 0;
      } else if (statusFilter === 'watch') {
        matchesStatus = product.status?.includes('⚠️') || product.status?.includes('Surveiller');
      } else if (statusFilter === 'ok') {
        matchesStatus = product.status?.includes('✅') || product.status?.includes('OK');
      }

      return matchesSearch && matchesSupplier && matchesStatus;
    });

    // Tri
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortColumn) {
        case 'sku':
          aVal = a.sku;
          bVal = b.sku;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'supplier':
          aVal = a.supplier || '';
          bVal = b.supplier || '';
          break;
        case 'stock':
          aVal = a.stock || 0;
          bVal = b.stock || 0;
          break;
        case 'qtyToOrder':
          aVal = a.qtyToOrder || 0;
          bVal = b.qtyToOrder || 0;
          break;
        case 'price':
          aVal = a.buyPrice || 0;
          bVal = b.buyPrice || 0;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' 
          ? aVal - bVal
          : bVal - aVal;
      }
    });

    return filtered;
  }, [products, searchTerm, supplierFilter, statusFilter, sortColumn, sortDirection]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedAndFilteredProducts.slice(startIndex, endIndex);
  }, [sortedAndFilteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAndFilteredProducts.length / itemsPerPage);

  // Fonction de tri
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset à la première page
  };

  // Toggle sélection d'un produit
  const toggleProductSelection = (product) => {
    const newMap = new Map(selectedProducts);
    if (newMap.has(product.sku)) {
      newMap.delete(product.sku);
    } else {
      const baseQty = product.qtyToOrder && product.qtyToOrder > 0
        ? Math.round(product.qtyToOrder)
        : product.moq && product.moq > 0
          ? Math.round(product.moq)
          : 1;
      newMap.set(product.sku, baseQty);
    }
    setSelectedProducts(newMap);
  };

  // Toggle Select All (page actuelle)
  const toggleSelectAll = () => {
    const pageProducts = paginatedProducts;
    const allPageSelected = pageProducts.every(p => selectedProducts.has(p.sku));
    
    const newMap = new Map(selectedProducts);
    
    if (allPageSelected) {
      // Désélectionner tous les produits de la page
      pageProducts.forEach(p => newMap.delete(p.sku));
    } else {
      // Sélectionner tous les produits de la page
      pageProducts.forEach(product => {
        const baseQty = product.qtyToOrder && product.qtyToOrder > 0
          ? Math.round(product.qtyToOrder)
          : product.moq && product.moq > 0
            ? Math.round(product.moq)
            : 1;
        newMap.set(product.sku, baseQty);
      });
    }
    setSelectedProducts(newMap);
  };

  // Sélectionner tous les produits à commander
  const selectAllToOrder = () => {
    const newMap = new Map();
    sortedAndFilteredProducts.forEach(product => {
      if (product.qtyToOrder > 0) {
        newMap.set(product.sku, Math.round(product.qtyToOrder));
      }
    });
    setSelectedProducts(newMap);
    toast.success(t('productSelection.bulkActions.selectedSuccess', { count: newMap.size }));
  };

  // Appliquer quantité en masse
  const applyBulkQuantity = () => {
    const qty = parseInt(bulkQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error(t('productSelection.bulkActions.invalidQuantity'));
      return;
    }

    const newMap = new Map(selectedProducts);
    selectedProducts.forEach((_, sku) => {
      newMap.set(sku, qty);
    });
    setSelectedProducts(newMap);
    setBulkQuantity('');
    toast.success(t('productSelection.bulkActions.quantityApplied', { qty, count: selectedProducts.size }));
  };

  // Mettre à jour la quantité
  const updateQuantity = (sku, quantity) => {
    const newMap = new Map(selectedProducts);
    const qty = Math.max(0, parseInt(quantity) || 0);
    newMap.set(sku, qty);
    setSelectedProducts(newMap);
  };

  // Gérer la création de commande
  const handleCreateOrder = () => {
    if (selectedProducts.size === 0) return;
    onCreateOrder(selectedProducts);
  };

  // Composant pour header triable
  const SortableHeader = ({ column, children, align = 'left' }) => {
    const isSorted = sortColumn === column;
    const Icon = isSorted ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    
    return (
      <th 
        className={`px-4 py-3 text-${align} text-xs font-semibold text-[#666663] uppercase tracking-wider cursor-pointer hover:bg-[#F0F0EB] transition-colors select-none`}
        onClick={() => handleSort(column)}
      >
        <div className={`flex items-center gap-2 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
          <span>{children}</span>
          <Icon className={`w-3 h-3 ${isSorted ? 'text-[#8B5CF6]' : 'text-[#999]'}`} />
        </div>
      </th>
    );
  };

  const allPageSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProducts.has(p.sku));
  const somePageSelected = paginatedProducts.some(p => selectedProducts.has(p.sku)) && !allPageSelected;

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666663]" />
            <input
              type="text"
              placeholder={t('productSelection.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-[#191919]"
            />
          </div>

          {/* Filtre fournisseur */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666663]" />
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-[#191919] appearance-none bg-white"
            >
              <option value="all">{t('productSelection.allSuppliers')}</option>
              {Object.keys(suppliers).map(supplierName => (
                <option key={supplierName} value={supplierName}>
                  {supplierName}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666663]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-[#191919] appearance-none bg-white"
            >
              <option value="all">{t('productSelection.statusFilter.all')}</option>
              <option value="to_order">{t('productSelection.statusFilter.toOrder')}</option>
              <option value="watch">{t('productSelection.statusFilter.watch')}</option>
              <option value="ok">{t('productSelection.statusFilter.ok')}</option>
            </select>
          </div>
        </div>

        {/* Compteur de résultats */}
        <div className="mt-3 flex items-center justify-between text-sm text-[#666663]">
          <span>
            {t('productSelection.productsShown', { count: sortedAndFilteredProducts.length })}
          </span>
          {selectedProducts.size > 0 && (
            <span className="font-semibold text-[#8B5CF6]">
              {t('productSelection.selected', { count: selectedProducts.size })}
            </span>
          )}
        </div>
      </div>

      {/* Actions en masse */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4">
        <h3 className="text-sm font-semibold text-[#191919] mb-3">{t('productSelection.bulkActions.title')}</h3>
        <div className="flex flex-wrap gap-3">
          {/* Sélectionner tous à commander */}
          <button
            onClick={selectAllToOrder}
            className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            {t('productSelection.bulkActions.selectAllToOrder')}
          </button>

          {/* Appliquer quantité */}
          {selectedProducts.size > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                placeholder={t('productSelection.bulkActions.quantityPlaceholder')}
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value)}
                className="w-24 px-3 py-2 border border-[#E5E4DF] rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              />
              <button
                onClick={applyBulkQuantity}
                className="px-4 py-2 bg-[#40403E] text-white rounded-lg hover:bg-[#666663] transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Hash className="w-4 h-4" />
                {t('productSelection.bulkActions.applyToSelection')}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header sticky */}
            <thead className="bg-[#FAFAF7] border-b border-[#E5E4DF] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={input => {
                      if (input) input.indeterminate = somePageSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[#E5E4DF] text-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6] cursor-pointer"
                  />
                </th>
                <SortableHeader column="sku">{t('productSelection.columns.sku')}</SortableHeader>
                <SortableHeader column="name">{t('productSelection.columns.name')}</SortableHeader>
                <SortableHeader column="supplier">{t('productSelection.columns.supplier')}</SortableHeader>
                <SortableHeader column="stock" align="center">{t('productSelection.columns.stock')}</SortableHeader>
                <SortableHeader column="qtyToOrder" align="center">{t('productSelection.columns.recommended')}</SortableHeader>
                <SortableHeader column="price" align="right">{t('productSelection.columns.price')}</SortableHeader>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#666663] uppercase tracking-wider">
                  {t('productSelection.columns.quantity')}
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-[#E5E4DF]">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <Package className="w-12 h-12 text-[#666663] mx-auto mb-3" />
                    <p className="text-[#666663]">{t('productSelection.empty')}</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const isSelected = selectedProducts.has(product.sku);
                  const quantity = selectedProducts.get(product.sku) || 0;
                  
                  return (
                    <tr
                      key={product.sku}
                      className={`hover:bg-[#FAFAF7] transition-colors ${
                        isSelected ? 'bg-[#8B5CF6]/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProductSelection(product)}
                          className="w-4 h-4 rounded border-[#E5E4DF] text-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6] cursor-pointer"
                        />
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-semibold text-[#191919]">
                          {product.sku}
                        </span>
                      </td>

                      {/* Nom + image */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <ImagePreview
                              src={product.imageUrl}
                              alt={product.name}
                              thumbClassName="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-[#E5E4DF]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-[#E5E4DF] flex items-center justify-center text-xs text-[#666663] flex-shrink-0">
                              {product.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <span className="text-sm font-medium text-[#191919]">
                            {product.name}
                          </span>
                        </div>
                      </td>

                      {/* Fournisseur */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#666663]">
                          {product.supplier || '-'}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-[#191919]">
                          {product.stock}
                        </span>
                      </td>

                      {/* Qty recommandée */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${
                          product.qtyToOrder > 0 ? 'text-[#EF1C43]' : 'text-green-600'
                        }`}>
                          {Math.round(product.qtyToOrder || 0)}
                        </span>
                      </td>

                      {/* Prix */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-[#191919]">
                          {formatCurrency(product.buyPrice || 0)}
                        </span>
                      </td>

                      {/* Quantité input */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editingQuantities.has(product.sku) ? editingQuantities.get(product.sku) : (isSelected ? quantity : '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            const newMap = new Map(editingQuantities);
                            newMap.set(product.sku, value);
                            setEditingQuantities(newMap);
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            const newQty = parseInt(value) || 0;
                            
                            // Nettoyer l'état d'édition
                            const newMap = new Map(editingQuantities);
                            newMap.delete(product.sku);
                            setEditingQuantities(newMap);
                            
                            const newSelectedMap = new Map(selectedProducts);
                            
                            if (newQty > 0) {
                              // Si la quantité est > 0, ajouter/mettre à jour le produit dans la sélection
                              newSelectedMap.set(product.sku, newQty);
                              setSelectedProducts(newSelectedMap);
                            } else if (isSelected) {
                              // Si la quantité est 0 et que le produit était sélectionné, le retirer
                              newSelectedMap.delete(product.sku);
                              setSelectedProducts(newSelectedMap);
                            }
                          }}
                          onKeyDown={(e) => {
                            // Permettre de valider avec Enter
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                          }}
                          disabled={!isSelected}
                          placeholder="0"
                          className="w-24 px-3 py-2 border rounded-lg text-center font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-[#8B5CF6] bg-white text-[#191919] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-[#E5E4DF] bg-[#FAFAF7] px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Info pagination */}
              <div className="text-sm text-[#666663]">
                {t('productSelection.pagination.page')} {currentPage} {t('productSelection.pagination.of')} {totalPages} • {sortedAndFilteredProducts.length} {t('productSelection.pagination.total')}
              </div>

              {/* Contrôles pagination */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-[#E5E4DF] rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Pages */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#8B5CF6] text-white'
                            : 'border border-[#E5E4DF] text-[#191919] hover:bg-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-[#E5E4DF] rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bouton sticky - Créer une commande */}
      {/* Afficher le bouton seulement si onCreateOrder est fourni (usage dans modal) */}
      {selectedProducts.size > 0 && onCreateOrder && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="primary"
            icon={Package}
            onClick={handleCreateOrder}
            className="shadow-2xl"
          >
            <span>{t('productSelection.createOrder')}</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {selectedProducts.size}
            </span>
          </Button>
        </div>
      )}

      {/* Message si aucune sélection */}
      {selectedProducts.size === 0 && sortedAndFilteredProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold text-blue-900 mb-1">{t('productSelection.guide.title')}</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>{t('productSelection.guide.selection')} :</strong> {t('productSelection.guide.selectionDesc')}</li>
                <li><strong>{t('productSelection.guide.quantities')} :</strong> {t('productSelection.guide.quantitiesDesc')}</li>
                <li><strong>{t('productSelection.guide.sorting')} :</strong> {t('productSelection.guide.sortingDesc')}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductSelectionTable;
