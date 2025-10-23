import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { InfoTooltip, tooltips } from '../ui/InfoTooltip';
import { formatUnits } from '../../utils/decimalUtils';

export const ProductsToOrder = ({ products }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-200 shrink-0">
          <AlertCircle className="w-6 h-6 text-[#EF1C43] shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <h2 className="text-lg font-bold text-[#191919]">Produits à commander</h2>
            <InfoTooltip content={tooltips.toOrder} />
          </div>
          <p className="text-sm text-[#666663]">{products.length} produit(s)</p>
        </div>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {products.length === 0 ? (
          <p className="text-[#666663] text-center py-8 text-sm">Rien à commander</p>
        ) : (
          products.map((p, index) => (
            <motion.div
              key={p.sku}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              className="flex justify-between items-center p-3 bg-[#FAFAF7] rounded-lg hover:bg-[#F0F0EB] transition-colors border border-[#E5E4DF]">
              <div className="min-w-0">
                <p className="font-medium text-[#191919] text-sm truncate">{p.name}</p>
                <p className="text-xs text-[#666663] truncate">{p.supplier}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="font-bold text-[#EF1C43] text-sm">{formatUnits(p.qtyToOrder)} unités</p>
                <p className="text-xs text-[#666663]">Stock: {formatUnits(p.stock)}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
