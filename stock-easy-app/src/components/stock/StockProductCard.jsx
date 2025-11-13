import React from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { formatUnits } from '../../utils/decimalUtils';
import { STOCK_FILTERS } from '../../constants/stockEasyConstants';
import { useCurrency } from '../../contexts/CurrencyContext';

export const StockProductCard = ({ product, suppliers, onViewDetails }) => {
  const { format: formatCurrency } = useCurrency();
  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { status: 'out', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: AlertTriangle };
    if (stock <= minStock) return { status: 'low', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: AlertTriangle };
    if (stock > minStock * 2) return { status: 'high', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: CheckCircle };
    return { status: 'normal', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: Package };
  };

  const stockInfo = getStockStatus(product.stock, product.minStock);
  const Icon = stockInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#191919] text-lg mb-1 truncate">{product.name}</h3>
          <p className="text-sm text-[#666663] mb-2">SKU: {product.sku}</p>
          <p className="text-sm text-[#666663]">Fournisseur: {suppliers[product.supplierId]?.name || 'N/A'}</p>
        </div>
        <div className={`w-12 h-12 ${stockInfo.bgColor} rounded-lg flex items-center justify-center border ${stockInfo.borderColor} shrink-0`}>
          <Icon className={`w-6 h-6 ${stockInfo.color} shrink-0`} />
        </div>
      </div>

      <div className="space-y-3">
        {/* Informations de stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#666663] mb-1">Stock actuel</p>
            <p className={`text-lg font-bold ${stockInfo.color}`}>
              {formatUnits(product.stock)} unités
            </p>
          </div>
          <div>
            <p className="text-xs text-[#666663] mb-1">Stock minimum</p>
            <p className="text-lg font-bold text-[#191919]">
              {formatUnits(product.minStock)} unités
            </p>
          </div>
        </div>

        {/* Prix */}
        <div className="pt-3 border-t border-[#E5E4DF]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-[#666663] mb-1">Prix d'achat</p>
              <p className="text-lg font-bold text-[#191919]">
                {formatCurrency(product.buyPrice || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#666663] mb-1">Prix de vente</p>
              <p className="text-lg font-bold text-[#191919]">
                {formatCurrency(product.sellPrice || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-[#E5E4DF]">
          <button
            onClick={() => onViewDetails(product)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FAFAF7] hover:bg-[#F0F0EB] text-[#191919] rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Voir les détails</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
