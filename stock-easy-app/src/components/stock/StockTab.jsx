import React from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { StockHealthDashboard } from '../features/StockHealthDashboard';
import { HealthBar } from '../ui/HealthBar';
import { formatUnits } from '../../utils/decimalUtils';

export const StockTab = ({
  products,
  suppliers,
  stockLevelFilter,
  setStockLevelFilter,
  searchTerm,
  setSearchTerm,
  onViewDetails
}) => {
  // Calculer les statistiques de santé
  const urgentCount = products.filter(p => p.healthStatus === 'urgent').length;
  const warningCount = products.filter(p => p.healthStatus === 'warning').length;
  const healthyCount = products.filter(p => p.healthStatus === 'healthy').length;

  return (
    <motion.div
      key="stock"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header et Dashboard */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-200 shrink-0">
              <Package className="w-6 h-6 text-purple-600 shrink-0" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#191919]">Santé de l'Inventaire</h2>
              <p className="text-sm text-[#666663]">Visualisez la disponibilité actuelle de chaque SKU avec filtres et tri</p>
            </div>
          </div>
        </div>
        
        {/* Dashboard global de santé */}
        <div className="mb-6">
          <StockHealthDashboard 
            totalUrgent={urgentCount}
            totalWarning={warningCount}
            totalHealthy={healthyCount}
            totalProducts={products.length}
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
                className="px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-[#191919] text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Tous les fournisseurs</option>
                {[...new Set(products.map(p => p.supplier))].map(supplier => (
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
                  const matchesSearch = searchTerm === '' || 
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.sku.toLowerCase().includes(searchTerm.toLowerCase());
                  return matchesStatus && matchesSearch;
                })
                .map(product => (
                  <tr key={product.sku} className="hover:bg-[#FAFAF7] transition-colors">
                    {/* Produit */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="font-bold text-[#191919] text-sm">{product.name}</div>
                        <div className="text-xs text-[#666663]">{product.sku}</div>
                        <div className="text-xs text-[#666663] mt-1">
                          Ventes/jour: <span className="font-medium">{product.salesPerDay?.toFixed(1) || '0.0'}</span>
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