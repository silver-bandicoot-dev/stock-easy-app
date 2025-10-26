import React from 'react';
import { motion } from 'framer-motion';
import { Package, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { StockProductCard } from './StockProductCard';
import { STOCK_FILTERS } from '../../constants/stockEasyConstants';

export const StockGrid = ({ 
  products, 
  suppliers, 
  stockLevelFilter, 
  searchTerm, 
  onViewDetails 
}) => {
  // Filtrer les produits
  const filteredProducts = products.filter(product => {
    // Filtre par recherche
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !product.sku.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtre par niveau de stock
    switch (stockLevelFilter) {
      case STOCK_FILTERS.LOW:
        return product.stock > 0 && product.stock <= product.minStock;
      case STOCK_FILTERS.OUT_OF_STOCK:
        return product.stock === 0;
      case STOCK_FILTERS.NORMAL:
        return product.stock > product.minStock && product.stock <= product.minStock * 2;
      case STOCK_FILTERS.HIGH:
        return product.stock > product.minStock * 2;
      case STOCK_FILTERS.ALL:
      default:
        return true;
    }
  });

  // Statistiques
  const stats = {
    total: products.length,
    low: products.filter(p => p.stock > 0 && p.stock <= p.minStock).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    normal: products.filter(p => p.stock > p.minStock && p.stock <= p.minStock * 2).length,
    high: products.filter(p => p.stock > p.minStock * 2).length
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center border border-green-200 shrink-0">
            <TrendingUp className="w-6 h-6 text-green-600 shrink-0" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#191919]">Statistiques de Stock</h2>
            <p className="text-sm text-[#666663]">Vue d'ensemble de votre inventaire</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-[#FAFAF7] rounded-lg">
            <div className="text-2xl font-bold text-[#191919]">{stats.total}</div>
            <div className="text-sm text-[#666663]">Total</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <div className="text-sm text-red-600">Rupture</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{stats.low}</div>
            <div className="text-sm text-orange-600">Stock faible</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.normal}</div>
            <div className="text-sm text-blue-600">Normal</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.high}</div>
            <div className="text-sm text-green-600">Élevé</div>
          </div>
        </div>
      </div>

      {/* Grille des produits */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-200 shrink-0">
            <Package className="w-6 h-6 text-purple-600 shrink-0" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#191919]">Produits ({filteredProducts.length})</h2>
            <p className="text-sm text-[#666663]">
              {searchTerm ? `Résultats pour "${searchTerm}"` : 'Liste de tous vos produits'}
            </p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-[#666663] mx-auto mb-4 shrink-0" />
            <h3 className="text-lg font-semibold text-[#191919] mb-2">Aucun produit trouvé</h3>
            <p className="text-[#666663]">
              {searchTerm 
                ? `Aucun produit ne correspond à "${searchTerm}"`
                : 'Aucun produit ne correspond aux filtres sélectionnés'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <StockProductCard
                key={product.sku}
                product={product}
                suppliers={suppliers}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
