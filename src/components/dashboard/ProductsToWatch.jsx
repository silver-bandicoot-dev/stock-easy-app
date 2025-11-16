import React from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { InfoTooltip, tooltips } from '../ui/InfoTooltip';
import { formatUnits } from '../../utils/decimalUtils';
import { ImagePreview } from '../ui/ImagePreview';

export const ProductsToWatch = ({ products }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-200 shrink-0">
          <Eye className="w-6 h-6 text-orange-600 shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h2 className="text-lg font-bold text-[#191919]">Produits à surveiller</h2>
            <InfoTooltip content={tooltips.watch} />
          </div>
          <p className="text-sm text-[#666663]">{products.length} produit(s)</p>
        </div>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {products.length === 0 ? (
          <p className="text-[#666663] text-center py-8 text-sm">Rien à surveiller</p>
        ) : (
          products.map((p, index) => (
            <motion.div
              key={p.sku}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              className="flex justify-between items-center p-3 bg-[#FAFAF7] rounded-lg hover:bg-[#F0F0EB] transition-colors border border-[#E5E4DF]">
              <div className="flex items-center gap-3 min-w-0">
                {p.imageUrl ? (
                  <ImagePreview
                    src={p.imageUrl}
                    alt={p.name}
                    thumbClassName="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-[#E5E4DF]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-[#E5E4DF] flex items-center justify-center text-xs text-[#666663] flex-shrink-0">
                    {p.name?.charAt(0) || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-[#191919] text-sm truncate">{p.name}</p>
                  <p className="text-xs text-[#666663] truncate">{p.supplier}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="font-bold text-orange-600 text-sm">{formatUnits(p.stock)} unités</p>
                <p className="text-xs text-[#666663]">Seuil: {formatUnits(p.reorderPoint)}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};








