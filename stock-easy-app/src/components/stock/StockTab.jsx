import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { HealthBar } from '../ui/HealthBar';
import { InfoTooltip } from '../ui/InfoTooltip';
import { formatUnits, formatSalesPerDay } from '../../utils/decimalUtils';

export const StockTab = ({
  products,
  suppliers,
  stockLevelFilter,
  setStockLevelFilter,
  stockLevelSupplierFilter,
  setStockLevelSupplierFilter,
  searchTerm,
  setSearchTerm,
  onViewDetails
}) => {
  const supplierOptions = useMemo(() => {
    const uniqueSuppliers = new Set();
    
    if (suppliers && typeof suppliers === 'object') {
      Object.keys(suppliers).forEach(name => {
        if (name) {
          uniqueSuppliers.add(name);
        }
      });
    }
    
    products.forEach(product => {
      if (product?.supplier) {
        uniqueSuppliers.add(product.supplier);
      }
    });
    
    return Array.from(uniqueSuppliers).sort((a, b) => a.localeCompare(b));
  }, [products, suppliers]);
  
  const hasUnassignedProducts = useMemo(
    () => products.some(product => !product?.supplier),
    [products]
  );
  
  return (
    <motion.div
      key="stock"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Table des produits */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
        {/* Header de la table avec filtres */}
        <div className="bg-[#FAFAF7] border-b border-[#E5E4DF] p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#191919]">Produits en Stock</h3>
                <InfoTooltip content="Les ventes/jour affichées sont ajustées par notre moteur de prévision (saisonnalité, tendance, fiabilité fournisseur). Nous affichons aussi la moyenne brute sur 30 jours lorsque disponible." />
              </div>
              <span className="text-sm text-[#666663]">
                {products.length} produit(s) au total
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
                {hasUnassignedProducts && (
                  <option value="none">Non assigné</option>
                )}
                {supplierOptions.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              {products
                .filter(product => {
                  const matchesStatus = stockLevelFilter === 'all' || product.healthStatus === stockLevelFilter;
                  const matchesSupplier = 
                    stockLevelSupplierFilter === 'all' ||
                    (stockLevelSupplierFilter === 'none' && !product?.supplier) ||
                    product?.supplier === stockLevelSupplierFilter;
                  const matchesSearch = searchTerm === '' || 
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.sku.toLowerCase().includes(searchTerm.toLowerCase());
                  return matchesStatus && matchesSupplier && matchesSearch;
                })
                .map(product => (
                  <tr key={product.sku} className="hover:bg-[#FAFAF7] transition-colors">
                    {/* Produit */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="font-bold text-[#191919] text-sm">{product.name}</div>
                        <div className="text-xs text-[#666663]">{product.sku}</div>
                        <div className="text-xs text-[#666663] mt-1 space-y-0.5">
                          <div>
                            Ventes/jour (ajustées)&nbsp;
                            <span className="font-medium">
                              {formatSalesPerDay(product.salesPerDay ?? 0)}
                            </span>
                          </div>
                          {(product.sales30d ?? null) !== null && !Number.isNaN(Number(product.sales30d)) && (
                            <div className="text-[11px] text-[#8A8A86]">
                              Moyenne brute 30j&nbsp;
                              <span className="font-medium">
                                {formatSalesPerDay(Number(product.sales30d) / 30)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* Fournisseur */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="font-medium text-[#191919] text-sm">{product.supplier || 'Non assigné'}</div>
                        <div className="text-xs text-[#666663]">
                          Délai: {product.leadTimeDays || 0} jours
                        </div>
                      </div>
                    </td>
                    
                    {/* Stock */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="font-bold text-[#191919] text-sm">{formatUnits(product.stock)} unités</div>
                        <div className="text-xs text-[#666663]">
                          Point: {product.reorderPoint || 0} • MOQ: {product.moq || 0}
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
                          {product.daysOfStock || 0} jours
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
                          {Math.round(product.healthPercentage || 0)}%
                        </div>
                        <div className="w-16 mt-1">
                          <HealthBar percentage={product.healthPercentage || 0} status={product.healthStatus} />
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
  );
};