import React, { useMemo, useEffect } from 'react';
import { AlertCircle, ShoppingCart, Package, ChevronRight } from 'lucide-react';
import { InfoTooltip, tooltips } from '../ui/InfoTooltip';
import { formatUnits } from '../../utils/decimalUtils';
import { useCurrency } from '../../contexts/CurrencyContext';

export const ProductsToOrder = ({ products, onViewDetails, onQuickOrder }) => {
  const { format: formatCurrency } = useCurrency();

  useEffect(() => {
    if (products.length > 0) {
      console.log('📦 ProductsToOrder - Données reçues:', products.length, 'produits');
    }
  }, [products]);

  const formatStockoutDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const daysUntilStockout = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilStockout <= 0) return 'Maintenant';
      if (daysUntilStockout === 1) return 'Demain';
      return `${daysUntilStockout}j`;
    } catch (e) {
      return null;
    }
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => (a.orderPriority || 5) - (b.orderPriority || 5));
  }, [products]);

  const hasCritical = products.some(p => (p.stockoutRisk || 0) > 70);

  return (
    <div className="bg-white rounded-lg border border-[#E1E3E5] overflow-hidden">
      {/* Header - Style Shopify sobre */}
      <div className="border-b border-[#E1E3E5] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${
              hasCritical ? 'bg-[#FFF4F4]' : 'bg-[#F6F6F7]'
            }`}>
              <AlertCircle className={`w-4 h-4 ${hasCritical ? 'text-[#D72C0D]' : 'text-[#5C5F62]'}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-medium text-[#191919]">
                  À commander
                </h2>
                <InfoTooltip content={tooltips.toOrder} />
              </div>
              <p className="text-xs text-[#6B7177]">
                {products.length} produit{products.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {hasCritical && (
            <span className="text-[10px] font-medium text-[#D72C0D] bg-[#FFF4F4] border border-[#FED3D1] px-1.5 py-0.5 rounded">
              Urgent
            </span>
          )}
        </div>
      </div>
      
      {/* Liste des produits */}
      <div className="divide-y divide-[#E1E3E5]">
        {products.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-10 h-10 bg-[#F6F6F7] rounded-full flex items-center justify-center mx-auto mb-2">
              <ShoppingCart className="w-5 h-5 text-[#8C9196]" />
            </div>
            <p className="text-sm font-medium text-[#191919]">Tout est en ordre</p>
            <p className="text-xs text-[#6B7177] mt-0.5">Aucune commande requise</p>
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto">
            {sortedProducts.map((p) => {
              const qtyToOrderRemaining = p.qtyToOrderRemaining !== undefined 
                ? p.qtyToOrderRemaining 
                : (p.qtyToOrder || 0);
              const stockoutDateFormatted = formatStockoutDate(p.stockoutDate);
              const isCritical = (p.stockoutRisk || 0) > 70;
              const hasQtyInTransit = (p.qtyInTransit || 0) > 0;

              return (
                <div
                  key={p.sku}
                  onClick={() => onViewDetails?.(p)}
                  className={`
                    group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                    ${isCritical ? 'bg-[#FFF4F4] hover:bg-[#FFECEC]' : 'hover:bg-[#F6F6F7]'}
                  `}
                >
                  {/* Info principale */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-[#191919] truncate">
                        {p.name}
                      </h3>
                      {isCritical && (
                        <span className="shrink-0 w-1.5 h-1.5 bg-[#D72C0D] rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#6B7177]">
                        Stock: {formatUnits(p.stock)}
                      </span>
                      {hasQtyInTransit && (
                        <span className="text-xs text-[#6B7177] flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {formatUnits(p.qtyInTransit)} transit
                        </span>
                      )}
                      {stockoutDateFormatted && (
                        <span className="text-xs text-[#6B7177]">
                          Rupture: {stockoutDateFormatted}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Quantité */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-semibold text-[#191919]">
                      {formatUnits(qtyToOrderRemaining)}
                    </div>
                    <div className="text-[10px] text-[#6B7177]">à commander</div>
                  </div>
                  
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

