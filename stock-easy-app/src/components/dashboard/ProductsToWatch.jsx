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
      {/* Header amélioré */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-[#E5E4DF] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
              <Eye className="w-6 h-6 text-white shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#191919]">Produits à surveiller</h2>
                <InfoTooltip content={tooltips.watch} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-orange-600">{products.length}</span>
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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-[#666663] font-medium">Rien à surveiller</p>
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
                whileHover={{ scale: 1.02, x: 4 }}
                className="group relative bg-gradient-to-r from-orange-50/50 to-transparent rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-orange-100 hover:border-orange-300"
              >
                {/* Badge attention */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                  {hasHighStockoutRisk && (
                    <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      RISQUE {p.stockoutRisk}%
                    </div>
                  )}
                  <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>SURVEILLER</span>
                  </div>
                </div>
                
                <div className="flex items-start justify-between gap-4 pr-20">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-bold text-[#191919] text-sm leading-tight">{p.name}</h3>
                    </div>
                    <p className="text-xs text-[#666663] mb-3 truncate">{p.supplier || 'Non assigné'}</p>
                    
                    {/* Barre de progression */}
                    {p.healthPercentage !== undefined && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-[#666663]">Santé</span>
                          <span className="text-[10px] font-bold text-orange-600">{Math.round(p.healthPercentage)}%</span>
                        </div>
                        <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                            style={{ width: `${Math.max(5, p.healthPercentage)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Informations de stock */}
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-orange-600" />
                        <span className="text-[#666663]">Stock: </span>
                        <span className="font-bold text-[#191919]">{formatUnits(p.stock)}</span>
                      </div>
                      {hasQtyInTransit && (
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-purple-600" />
                          <span className="text-[#666663]">En transit: </span>
                          <span className="font-bold text-purple-600">{formatUnits(p.qtyInTransit || 0)}</span>
                        </div>
                      )}
                      {hasQtyInOrder && (
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-blue-600" />
                          <span className="text-[#666663]">Commandé: </span>
                          <span className="font-bold text-blue-600">{formatUnits(p.qtyInOrder || 0)}</span>
                        </div>
                      )}
                      <div className="text-[#666663]">
                        Seuil: <span className="font-medium">{formatUnits(p.reorderPoint)}</span>
                      </div>
                      {p.daysOfStock && p.daysOfStock !== 999 && (
                        <div className="text-[#666663]">
                          Autonomie: <span className="font-medium text-orange-600">{Math.round(p.daysOfStock)} jours</span>
                        </div>
                      )}
                      {stockoutDateFormatted && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-orange-600" />
                          <span className="text-[#666663]">Rupture: </span>
                          <span className="font-bold text-orange-600">{stockoutDateFormatted}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600 mb-1">
                        {formatUnits(p.stock)}
                      </div>
                      <div className="text-[10px] text-[#666663] uppercase font-medium">Unités</div>
                    </div>
                    
                    {/* Bouton d'action */}
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
