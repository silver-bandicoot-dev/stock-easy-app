import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, AlertTriangle, TrendingDown, Calendar, Package } from 'lucide-react';
import { InfoTooltip, tooltips } from '../ui/InfoTooltip';
import { formatUnits } from '../../utils/decimalUtils';

export const ProductsToWatch = ({ products, onViewDetails }) => {
  // Debug: Log pour vérifier les données
  useEffect(() => {
    if (products.length > 0) {
      console.log('👁️ ProductsToWatch - Données reçues:', products.length, 'produits');
      console.log('👁️ Premier produit:', {
        sku: products[0].sku,
        name: products[0].name,
        stockoutDate: products[0].stockoutDate,
        stockoutRisk: products[0].stockoutRisk,
        daysOfStock: products[0].daysOfStock
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
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
      {/* Header plus sobre et cohérent */}
      <div className="border-b border-[#E5E4DF] px-6 py-4 bg-[#F9F8F5]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-[#E5E4DF]">
              <Eye className="w-5 h-5 text-[#F97316] shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#191919] uppercase tracking-wide">
                  Produits à surveiller
                </h2>
                <InfoTooltip content={tooltips.watch} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-[#191919]">
                  {products.length}
                </span>
                <span className="text-sm text-[#666663]">produit(s) proches du seuil</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#F3F2EE] rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-[#666663]" />
              </div>
              <p className="text-[#191919] font-medium">Rien à surveiller</p>
              <p className="text-xs text-[#666663] mt-1">Tous vos stocks sont sécurisés</p>
            </div>
          ) : (
            products.map((p, index) => {
              const stockoutDateFormatted = formatStockoutDate(p.stockoutDate);
              const hasHighStockoutRisk = (p.stockoutRisk || 0) > 50;
              const hasQtyInTransit = (p.qtyInTransit || 0) > 0;
              const hasQtyInOrder = (p.qtyInOrder || 0) > 0;

              return (
              <motion.div
                key={p.sku}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                  whileHover={{ x: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
                  className="group relative rounded-lg p-4 border border-[#E5E4DF] bg-white transition-all duration-200"
              >
                  {/* Badge attention plus neutre */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                  {hasHighStockoutRisk && (
                      <div className="bg-[#FDECEC] text-[10px] font-medium text-[#B3261E] px-2 py-0.5 rounded-full">
                        Risque {p.stockoutRisk}%
                    </div>
                  )}
                    <div className="bg-[#FFF4E5] text-[10px] font-medium text-[#8A4A00] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                      <span>À surveiller</span>
                  </div>
                </div>
                
                <div className="flex items-start justify-between gap-4 pr-20">
                  <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <h3 className="font-medium text-[#191919] text-sm leading-tight">
                          {p.name}
                        </h3>
                    </div>
                      <p className="text-xs text-[#666663] mb-3 truncate">
                        {p.supplier || 'Non assigné'}
                      </p>
                    
                      {/* Barre de progression plus discrète */}
                    {p.healthPercentage !== undefined && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-medium text-[#666663]">
                              Santé
                            </span>
                            <span className="text-[10px] font-semibold text-[#191919]">
                              {Math.round(p.healthPercentage)}%
                            </span>
                        </div>
                          <div className="h-1.5 bg-[#F3F2EE] rounded-full overflow-hidden">
                          <div 
                              className="h-full bg-[#F97316] transition-all duration-500"
                            style={{ width: `${Math.max(5, p.healthPercentage)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Informations de stock */}
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <div className="flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-[#F97316]" />
                        <span className="text-[#666663]">Stock: </span>
                          <span className="font-semibold text-[#191919]">
                            {formatUnits(p.stock)}
                          </span>
                      </div>
                      {hasQtyInTransit && (
                        <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-[#666663]" />
                          <span className="text-[#666663]">En transit: </span>
                            <span className="font-semibold text-[#191919]">
                              {formatUnits(p.qtyInTransit || 0)}
                            </span>
                        </div>
                      )}
                      {hasQtyInOrder && (
                        <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-[#666663]" />
                          <span className="text-[#666663]">Commandé: </span>
                            <span className="font-semibold text-[#191919]">
                              {formatUnits(p.qtyInOrder || 0)}
                            </span>
                        </div>
                      )}
                      <div className="text-[#666663]">
                          Seuil:{' '}
                          <span className="font-semibold text-[#191919]">
                            {formatUnits(p.reorderPoint)}
                          </span>
                      </div>
                      {p.daysOfStock && p.daysOfStock !== 999 && (
                        <div className="text-[#666663]">
                            Autonomie:{' '}
                            <span className="font-semibold text-[#191919]">
                              {Math.round(p.daysOfStock)} jours
                            </span>
                        </div>
                      )}
                      {stockoutDateFormatted && (
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#666663]" />
                          <span className="text-[#666663]">Rupture: </span>
                            <span className="font-semibold text-[#191919]">
                              {stockoutDateFormatted}
                            </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                        <div className="text-lg font-semibold text-[#191919] mb-1">
                        {formatUnits(p.stock)}
                      </div>
                        <div className="text-[10px] text-[#666663] uppercase font-medium tracking-wide">
                          Unités
                        </div>
                    </div>
                    
                    {/* Bouton d'action */}
                    {onViewDetails && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(p);
                        }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-white border border-[#E5E4DF] hover:border-[#191919] text-[#191919] text-xs font-semibold rounded-lg flex items-center gap-1.5"
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
