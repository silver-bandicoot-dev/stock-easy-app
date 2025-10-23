import React from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { StockFilters } from './StockFilters';
import { StockGrid } from './StockGrid';

export const StockTab = ({
  products,
  suppliers,
  stockLevelFilter,
  setStockLevelFilter,
  searchTerm,
  setSearchTerm,
  onViewDetails
}) => {
  return (
    <motion.div
      key="stock"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-200 shrink-0">
            <Package className="w-6 h-6 text-purple-600 shrink-0" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#191919]">Gestion du Stock</h1>
            <p className="text-[#666663]">Surveillez et gérez votre inventaire</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <StockFilters
        stockLevelFilter={stockLevelFilter}
        setStockLevelFilter={setStockLevelFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Grille des produits */}
      <StockGrid
        products={products}
        suppliers={suppliers}
        stockLevelFilter={stockLevelFilter}
        searchTerm={searchTerm}
        onViewDetails={onViewDetails}
      />
    </motion.div>
  );
};
