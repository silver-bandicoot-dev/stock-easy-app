import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ShoppingCart, Eye, TrendingDown, DollarSign, Calendar, Package } from 'lucide-react';
import { InfoTooltip, tooltips } from '../ui/InfoTooltip';
import { formatUnits } from '../../utils/decimalUtils';
import { useCurrency } from '../../contexts/CurrencyContext';

export const ProductsToOrder = ({ products, onViewDetails, onQuickOrder }) => {
  const { format: formatCurrency } = useCurrency();

  // Debug: Log pour vérifier les données
  useEffect(() => {
    if (products.length > 0) {
      console.log('📦 ProductsToOrder - Données reçues:', products.length, 'produits');
      console.log('📦 Premier produit:', {
        sku: products[0].sku,
        name: products[0].name,
        moq: products[0].moq,
        qtyToOrder: products[0].qtyToOrder,
        stockoutDate: products[0].stockoutDate,
        stockoutRisk: products[0].stockoutRisk,
        qtyInTransit: products[0].qtyInTransit,
        orderPriority: products[0].orderPriority
      });
    }
  }, [products]);

  // Fonction pour formater la date de rupture (format relatif uniforme)
  const formatStockoutDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const daysUntilStockout = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilStockout <= 0) return 'Maintenant';
      if (daysUntilStockout === 1) return 'Demain';
      return `Dans ${daysUntilStockout} jours`;
    } catch (e) {
      return null;
    }
  };

  // Trier les produits par priorité (par défaut)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => (a.orderPriority || 5) - (b.orderPriority || 5));
  }, [products]);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
      {/* Header amélioré */}
      <div className="bg-gradient-to-r from-red-50 to-red-100/50 border-b border-[#E5E4DF] p-6">
        <div className="space-y-4">
          {/* Première ligne : Titre et badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <AlertCircle className="w-6 h-6 text-white shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#191919]">Produits à commander</h2>
                  <InfoTooltip content={tooltips.toOrder} />
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm font-semibold text-[#EF1C43]">
                    {products.length}
                  </span>
                  <span className="text-sm text-[#666663]">produit(s) nécessitent une action</span>
                </div>
              </div>
            </div>
            {products.length > 0 && (
              <div className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full shrink-0">
                Urgent
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-[#666663] font-medium">Rien à commander</p>
              <p className="text-xs text-[#666663] mt-1">Tous vos stocks sont à jour</p>
            </div>
          ) : (
            sortedProducts.map((p, index) => {
              // Utiliser la quantité résiduelle à commander (après déduction des commandes en cours)
              const qtyToOrderRemaining = p.qtyToOrderRemaining !== undefined 
                ? p.qtyToOrderRemaining 
                : (p.qtyToOrder || 0);
              const moqWarning = p.moq && qtyToOrderRemaining < p.moq;
              const stockoutDateFormatted = formatStockoutDate(p.stockoutDate);
              const hasHighStockoutRisk = (p.stockoutRisk || 0) > 50;
              const hasQtyInTransit = (p.qtyInTransit || 0) > 0;

              return (
              <motion.div
                key={p.sku}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="group relative bg-gradient-to-r from-red-50/50 to-transparent rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-red-100 hover:border-red-300"
              >
                {/* Badges multiples en haut à droite */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                  {moqWarning && (
                    <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      MOQ: {p.moq}
                    </div>
                  )}
                  {hasHighStockoutRisk && (
                    <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      RISQUE {p.stockoutRisk}%
                    </div>
                  )}
                  {!moqWarning && !hasHighStockoutRisk && (
                    <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      URGENT
                    </div>
                  )}
                </div>
                
                <div className="flex items-start justify-between gap-4 pr-16">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-bold text-[#191919] text-sm leading-tight">{p.name}</h3>
                    </div>
                    <p className="text-xs text-[#666663] mb-3 truncate">{p.supplier || 'Non assigné'}</p>
                    
                    {/* Barre de santé */}
                    {p.healthPercentage !== undefined && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-[#666663]">Santé</span>
                          <span className="text-[10px] font-bold text-red-600">{Math.round(p.healthPercentage)}%</span>
                        </div>
                        <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"
                            style={{ width: `${Math.max(5, p.healthPercentage)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Informations de stock */}
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-red-600" />
                        <span className="text-[#666663]">Stock: </span>
                        <span className="font-bold text-[#191919]">{formatUnits(p.stock)}</span>
                      </div>
                      {(p.qtyInTransit || 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-purple-600" />
                          <span className="text-[#666663]">En transit: </span>
                          <span className="font-bold text-purple-600">{formatUnits(p.qtyInTransit || 0)}</span>
                        </div>
                      )}
                      {stockoutDateFormatted && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-orange-600" />
                          <span className="text-[#666663]">Rupture: </span>
                          <span className="font-bold text-orange-600">{stockoutDateFormatted}</span>
                        </div>
                      )}
                      {(p.investment || (qtyToOrderRemaining > 0 && p.buyPrice)) && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="text-[#666663]">Investissement: </span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(p.investment || (qtyToOrderRemaining * p.buyPrice) || 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#EF1C43] mb-1">
                        {formatUnits(qtyToOrderRemaining)}
                      </div>
                      <div className="text-[10px] text-[#666663] uppercase font-medium">
                        {p.qtyInOrder > 0 ? 'À commander' : 'Unités'}
                      </div>
                      {p.qtyInOrder > 0 && (
                        <div className="text-[10px] text-purple-600 font-medium mt-1">
                          ({p.qtyInOrder} commandé{p.qtyInOrder > 1 ? 's' : ''})
                        </div>
                      )}
                      {moqWarning && (
                        <div className="text-[10px] text-orange-600 font-bold mt-1">
                          Min: {p.moq}
                        </div>
                      )}
                    </div>
                    
                    {/* Boutons d'action */}
                    {onQuickOrder && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickOrder(p);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Commander
                      </button>
                    )}
                    {onViewDetails && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(p);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-white border border-[#E5E4DF] hover:border-[#191919] text-[#191919] text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5"
                      >
                        <Eye className="w-3 h-3" />
                        Détails
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
