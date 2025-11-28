import React, { useEffect } from 'react';
import { Eye, ChevronRight, Package } from 'lucide-react';
import { InfoTooltip, tooltips } from '../ui/InfoTooltip';
import { formatUnits } from '../../utils/decimalUtils';
import { HEALTH_STATUS } from '../../utils/constants';

export const ProductsToWatch = ({ products, onViewDetails }) => {
  useEffect(() => {
    if (products.length > 0) {
      console.log('👁️ ProductsToWatch - Données reçues:', products.length, 'produits');
    }
  }, [products]);

  return (
    <div className="bg-white rounded-lg border border-[#E1E3E5] overflow-hidden">
      {/* Header - Style Shopify sobre */}
      <div className="border-b border-[#E1E3E5] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-[#FFF8E6]">
              <Eye className="w-4 h-4 text-[#8A6116]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-medium text-[#191919]">
                  À surveiller
                </h2>
                <InfoTooltip content={tooltips.watch} />
              </div>
              <p className="text-xs text-[#6B7177]">
                {products.length} produit{products.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Liste des produits */}
      <div className="divide-y divide-[#E1E3E5]">
        {products.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-10 h-10 bg-[#F6F6F7] rounded-full flex items-center justify-center mx-auto mb-2">
              <Eye className="w-5 h-5 text-[#8C9196]" />
            </div>
            <p className="text-sm font-medium text-[#191919]">Tout va bien</p>
            <p className="text-xs text-[#6B7177] mt-0.5">Aucun produit à surveiller</p>
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto">
            {products.map((p) => {
              const hasQtyInTransit = (p.qtyInTransit || 0) > 0;
              const daysLeft = p.daysOfStock && p.daysOfStock !== 999 ? Math.round(p.daysOfStock) : null;

              return (
                <div
                  key={p.sku}
                  onClick={() => onViewDetails?.(p)}
                  className="group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F6F6F7] transition-colors"
                >
                  {/* Info principale */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#191919] truncate">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#6B7177]">
                        Stock: {formatUnits(p.stock)} / Seuil: {formatUnits(p.reorderPoint)}
                      </span>
                      {hasQtyInTransit && (
                        <span className="text-xs text-[#6B7177] flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {formatUnits(p.qtyInTransit)} transit
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Jours restants */}
                  {daysLeft !== null && (
                    <div className="text-right shrink-0">
                      <div className="text-base font-semibold text-[#191919]">
                        {daysLeft}j
                      </div>
                      <div className="text-[10px] text-[#6B7177]">restants</div>
                    </div>
                  )}
                  
                  {/* Chevron */}
                  <ChevronRight className="w-4 h-4 text-[#8C9196] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
