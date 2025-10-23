import React from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Filter, Eye, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { formatUnits } from '../../utils/decimalUtils';
import { STOCK_FILTERS } from '../../constants/stockEasyConstants';

export const StockFilters = ({ 
  stockLevelFilter, 
  setStockLevelFilter, 
  searchTerm, 
  setSearchTerm 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200 shrink-0">
          <Filter className="w-6 h-6 text-blue-600 shrink-0" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#191919]">Filtres de Stock</h2>
          <p className="text-sm text-[#666663]">Filtrez et recherchez vos produits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666663]" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Filtre par niveau de stock */}
        <div>
          <select
            value={stockLevelFilter}
            onChange={(e) => setStockLevelFilter(e.target.value)}
            className="w-full p-3 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value={STOCK_FILTERS.ALL}>Tous les produits</option>
            <option value={STOCK_FILTERS.LOW}>Stock faible</option>
            <option value={STOCK_FILTERS.OUT_OF_STOCK}>Rupture de stock</option>
            <option value={STOCK_FILTERS.NORMAL}>Stock normal</option>
            <option value={STOCK_FILTERS.HIGH}>Stock élevé</option>
          </select>
        </div>
      </div>
    </div>
  );
};
