import React, { useState, useMemo } from 'react';
import { Filter, Search, ShoppingCart, Check, X, Package, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { toast } from 'sonner';

export function ProductSelectionTable({ products, suppliers, onCreateOrder }) {
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
      newMap.set(product.sku, Math.round(product.qtyToOrder || 0));
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
        newMap.set(product.sku, Math.round(product.qtyToOrder || 0));
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
    toast.success(`${newMap.size} produits à commander sélectionnés`);
  };

  // Appliquer quantité en masse
  const applyBulkQuantity = () => {
    const qty = parseInt(bulkQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Veuillez entrer une quantité valide');
      return;
    }

    const newMap = new Map(selectedProducts);
    selectedProducts.forEach((_, sku) => {
      newMap.set(sku, qty);
    });
    setSelectedProducts(newMap);
    setBulkQuantity('');
    toast.success(`Quantité ${qty} appliquée à ${selectedProducts.size} produits`);
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
              placeholder="Rechercher par SKU ou nom..."
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
              <option value="all">Tous les fournisseurs</option>
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
              <option value="all">Tous les statuts</option>
              <option value="to_order">À commander</option>
              <option value="watch">À surveiller</option>
              <option value="ok">Stock OK</option>
            </select>
          </div>
        </div>

        {/* Compteur de résultats */}
        <div className="mt-3 flex items-center justify-between text-sm text-[#666663]">
          <span>
            {sortedAndFilteredProducts.length} produit{sortedAndFilteredProducts.length > 1 ? 's' : ''} affiché{sortedAndFilteredProducts.length > 1 ? 's' : ''}
          </span>
          {selectedProducts.size > 0 && (
            <span className="font-semibold text-[#8B5CF6]">
              {selectedProducts.size} sélectionné{selectedProducts.size > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Actions en masse */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4">
        <h3 className="text-sm font-semibold text-[#191919] mb-3">Actions en masse</h3>
        <div className="flex flex-wrap gap-3">
          {/* Sélectionner tous à commander */}
          <button
            onClick={selectAllToOrder}
            className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            Sélectionner tous à commander
          </button>

          {/* Appliquer quantité */}
          {selectedProducts.size > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                placeholder="Quantité"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value)}
                className="w-24 px-3 py-2 border border-[#E5E4DF] rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              />
              <button
                onClick={applyBulkQuantity}
                className="px-4 py-2 bg-[#40403E] text-white rounded-lg hover:bg-[#666663] transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Hash className="w-4 h-4" />
                Appliquer à la sélection
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
                <SortableHeader column="sku">SKU</SortableHeader>
                <SortableHeader column="name">Nom</SortableHeader>
                <SortableHeader column="supplier">Fournisseur</SortableHeader>
                <SortableHeader column="stock" align="center">Stock</SortableHeader>
                <SortableHeader column="qtyToOrder" align="center">Recommandé</SortableHeader>
                <SortableHeader column="price" align="right">Prix</SortableHeader>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#666663] uppercase tracking-wider">
                  Quantité
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-[#E5E4DF]">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <Package className="w-12 h-12 text-[#666663] mx-auto mb-3" />
                    <p className="text-[#666663]">Aucun produit trouvé</p>
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

                      {/* Nom */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[#191919]">
                          {product.name}
                        </span>
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
                          {product.buyPrice?.toFixed(2) || '0.00'}€
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
                            
                            // Si le produit est sélectionné ou si on vient de saisir une valeur, mettre à jour
                            if (isSelected && value) {
                              updateQuantity(product.sku, newQty);
                            } else if (!isSelected && newQty > 0) {
                              // Si le produit n'est pas sélectionné mais qu'on a saisi une quantité, le sélectionner
                              const newSelectedMap = new Map(selectedProducts);
                              newSelectedMap.set(product.sku, newQty);
                              setSelectedProducts(newSelectedMap);
                            }
                          }}
                          onKeyDown={(e) => {
                            // Permettre de valider avec Enter
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                          }}
                          placeholder="0"
                          className="w-24 px-3 py-2 border rounded-lg text-center font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-[#8B5CF6] bg-white text-[#191919]"
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
                Page {currentPage} sur {totalPages} • {sortedAndFilteredProducts.length} produits au total
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
      {selectedProducts.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleCreateOrder}
            className="bg-[#8B5CF6] text-white px-6 py-4 rounded-xl shadow-2xl hover:bg-[#7C3AED] transition-all flex items-center gap-3 font-semibold group"
          >
            <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Créer une commande</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {selectedProducts.size}
            </span>
          </button>
        </div>
      )}

      {/* Message si aucune sélection */}
      {selectedProducts.size === 0 && sortedAndFilteredProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold text-blue-900 mb-1">Guide d'utilisation</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Sélection :</strong> Cochez les produits ou utilisez "Sélectionner tous à commander"</li>
                <li><strong>Quantités :</strong> Ajustez individuellement ou en masse</li>
                <li><strong>Tri :</strong> Cliquez sur les en-têtes de colonnes pour trier</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductSelectionTable;
