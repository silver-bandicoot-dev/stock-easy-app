import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { HealthBar } from '../ui/HealthBar';
import { InfoTooltip } from '../ui/InfoTooltip';
import { StockHealthDashboard } from '../features/StockHealthDashboard';
import { ImagePreview } from '../ui/ImagePreview';
import { formatUnits, formatSalesPerDay } from '../../utils/decimalUtils';
import { formatETA } from '../../utils/dateUtils';

export const StockTab = ({
  products,
  suppliers,
  orders,
  stockLevelFilter,
  setStockLevelFilter,
  stockLevelSupplierFilter,
  setStockLevelSupplierFilter,
  searchTerm,
  setSearchTerm,
  onViewDetails
}) => {
  // Calculer les statistiques de santé
  const urgentCount = products ? products.filter(p => p.healthStatus === 'urgent').length : 0;
  const warningCount = products ? products.filter(p => p.healthStatus === 'warning').length : 0;
  const healthyCount = products ? products.filter(p => p.healthStatus === 'healthy').length : 0;
  const totalProducts = products ? products.length : 0;
  const supplierOptions = useMemo(() => {
    const uniqueSuppliers = new Set();
    
    if (suppliers && typeof suppliers === 'object') {
      Object.keys(suppliers).forEach(name => {
        if (name) {
          uniqueSuppliers.add(name);
        }
      });
    }
    
    products.forEach(product => {
      if (product?.supplier) {
        uniqueSuppliers.add(product.supplier);
      }
    });
    
    return Array.from(uniqueSuppliers).sort((a, b) => a.localeCompare(b));
  }, [products, suppliers]);
  
  const hasUnassignedProducts = useMemo(
    () => products.some(product => !product?.supplier),
    [products]
  );

  // État pour forcer le recalcul dynamique des jours restants
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mise à jour périodique pour recalculer les jours restants dynamiquement
  useEffect(() => {
    // Mise à jour toutes les heures pour recalculer les jours restants
    // Cela permet de voir les changements au fil du temps (passage de +1j à "Aujourd'hui", etc.)
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 60 * 1000); // 1 heure

    return () => clearInterval(interval);
  }, []);

  // Calculer les quantités en transit et commandées pour chaque produit
  const productOrderQuantities = useMemo(() => {
    const quantities = {};
    
    if (!orders || orders.length === 0) {
      return quantities;
    }

    products.forEach(product => {
      let inTransitQty = 0;
      let orderedQty = 0;
      let earliestETA = null; // ETA la plus proche pour les commandes en transit

      orders.forEach(order => {
        // Vérifier si cette commande contient ce produit
        const orderItem = order.items?.find(item => item.sku === product.sku);
        if (orderItem) {
          const qty = orderItem.quantity || 0;
          
          // Statuts considérés comme "en transit"
          if (order.status === 'in_transit') {
            inTransitQty += qty;
            // Récupérer l'ETA de cette commande si disponible
            if (order.eta) {
              const etaDate = new Date(order.eta);
              // Garder l'ETA la plus proche
              if (!earliestETA || etaDate < new Date(earliestETA)) {
                earliestETA = order.eta;
              }
            }
          }
          // Statuts considérés comme "commandé" (en attente de confirmation, en préparation, etc.)
          else if (order.status === 'pending_confirmation' || order.status === 'preparing') {
            orderedQty += qty;
          }
        }
      });

      if (inTransitQty > 0 || orderedQty > 0) {
        quantities[product.sku] = {
          inTransit: inTransitQty,
          ordered: orderedQty,
          eta: earliestETA
        };
      }
    });

    return quantities;
  }, [products, orders, currentTime]);
  
  return (
    <motion.div
      key="stock"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Section Santé de l'Inventaire */}
      {products && products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-200 shrink-0">
                <Package className="w-6 h-6 text-purple-600 shrink-0" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#191919]">Santé de l'Inventaire</h2>
                <p className="text-sm text-[#666663]">Vue d'ensemble de l'état de vos stocks</p>
              </div>
            </div>
          </div>
          <StockHealthDashboard 
            totalUrgent={urgentCount}
            totalWarning={warningCount}
            totalHealthy={healthyCount}
            totalProducts={totalProducts}
          />
        </div>
      )}

      {/* Table des produits */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
        {/* Header de la table avec filtres */}
        <div className="bg-[#FAFAF7] border-b border-[#E5E4DF] p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#191919]">Produits en Stock</h3>
                <InfoTooltip content="Les ventes/jour affichées sont ajustées par notre moteur de prévision (saisonnalité, tendance, fiabilité fournisseur). Nous affichons aussi la moyenne brute sur 30 jours lorsque disponible." />
              </div>
              <span className="text-sm text-[#666663]">
                {products.length} produit(s) au total
              </span>
            </div>
            
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={stockLevelFilter}
                onChange={(e) => setStockLevelFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-[#191919] text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Tous les statuts</option>
                <option value="urgent">Urgent (rouge)</option>
                <option value="warning">Attention (orange)</option>
                <option value="healthy">Bon (vert)</option>
              </select>
              
              <select 
                value={stockLevelSupplierFilter}
                onChange={(e) => setStockLevelSupplierFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-[#191919] text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Tous les fournisseurs</option>
                {hasUnassignedProducts && (
                  <option value="none">Non assigné</option>
                )}
                {supplierOptions.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-[#191919] text-sm focus:outline-none focus:ring-2 focus:ring-black placeholder-[#666663]"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FAFAF7] border-b border-[#E5E4DF]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                  Autonomie
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span>En transit / Commandé</span>
                    <InfoTooltip 
                      content="Quantités en cours de réapprovisionnement. 'En transit' indique les quantités expédiées par le fournisseur. 'Commandé' indique les quantités en attente de confirmation ou en préparation." 
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span>Rotation</span>
                    <InfoTooltip 
                      content="Nombre de fois que le stock se renouvelle en une année (rotations/an). Calculé : (Ventes/jour × 365) / Stock. Une rotation élevée (>6 rot/an) indique une bonne dynamique commerciale. Une rotation faible (<2 rot/an) peut indiquer un risque de surstock ou d'obsolescence." 
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                  Santé
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E4DF]">
              {products
                .filter(product => {
                  const matchesStatus = stockLevelFilter === 'all' || product.healthStatus === stockLevelFilter;
                  const matchesSupplier = 
                    stockLevelSupplierFilter === 'all' ||
                    (stockLevelSupplierFilter === 'none' && !product?.supplier) ||
                    product?.supplier === stockLevelSupplierFilter;
                  const matchesSearch = searchTerm === '' || 
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.sku.toLowerCase().includes(searchTerm.toLowerCase());
                  return matchesStatus && matchesSupplier && matchesSearch;
                })
                .map(product => (
                  <tr key={product.sku} className="hover:bg-[#FAFAF7] transition-colors">
                    {/* Produit */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <ImagePreview
                            src={product.imageUrl}
                            alt={product.name}
                            thumbClassName="w-11 h-11 rounded-md object-cover flex-shrink-0 bg-[#E5E4DF]"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-md bg-[#E5E4DF] flex items-center justify-center text-xs text-[#666663] flex-shrink-0">
                            {product.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="font-bold text-[#191919] text-sm">{product.name}</div>
                          <div className="text-xs text-[#666663]">{product.sku}</div>
                          <div className="text-xs text-[#666663] mt-1 space-y-0.5">
                            <div>
                              Ventes/jour (ajustées)&nbsp;
                              <span className="font-medium">
                                {formatSalesPerDay(product.salesPerDay ?? 0)}
                              </span>
                            </div>
                            {(product.sales30d ?? null) !== null && !Number.isNaN(Number(product.sales30d)) && (
                              <div className="text-[11px] text-[#8A8A86]">
                                Moyenne brute 30j&nbsp;
                                <span className="font-medium">
                                  {formatSalesPerDay(Number(product.sales30d) / 30)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Fournisseur */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="font-medium text-[#191919] text-sm">{product.supplier || 'Non assigné'}</div>
                        <div className="text-xs text-[#666663]">
                          Délai: {product.leadTimeDays || 0} jours
                        </div>
                      </div>
                    </td>
                    
                    {/* Stock */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="font-bold text-[#191919] text-sm">{formatUnits(product.stock)} unités</div>
                        <div className="text-xs text-[#666663]">
                          Point: {product.reorderPoint || 0} • MOQ: {product.moq || 0}
                        </div>
                      </div>
                    </td>
                    
                    {/* Autonomie */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className={`font-bold text-sm ${
                          product.healthStatus === 'urgent' ? 'text-red-600' :
                          product.healthStatus === 'warning' ? 'text-orange-500' :
                          'text-green-600'
                        }`}>
                          {product.daysOfStock || 0} jours
                        </div>
                        {product.qtyToOrder > 0 && (
                          <div className="text-xs text-red-600 font-medium">
                            Commander {formatUnits(product.qtyToOrder)}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* En transit / Commandé */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {productOrderQuantities[product.sku] ? (
                          <>
                            {productOrderQuantities[product.sku].inTransit > 0 && (
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-purple-600">
                                  En transit: {formatUnits(productOrderQuantities[product.sku].inTransit)}
                                </div>
                                {(() => {
                                  const etaInfo = productOrderQuantities[product.sku].eta 
                                    ? formatETA(productOrderQuantities[product.sku].eta)
                                    : null;
                                  
                                  if (etaInfo) {
                                    const daysText = etaInfo.daysRemaining !== null
                                      ? etaInfo.daysRemaining > 0 
                                        ? `+${etaInfo.daysRemaining}j` 
                                        : etaInfo.daysRemaining === 0 
                                          ? 'Aujourd\'hui' 
                                          : `${etaInfo.daysRemaining}j`
                                      : '';
                                    
                                    return (
                                      <div className={`text-xs ${
                                        etaInfo.isPast ? 'text-red-600 font-semibold' :
                                        etaInfo.isUrgent ? 'text-orange-600 font-medium' :
                                        'text-[#666663]'
                                      }`}>
                                        ETA: {etaInfo.formatted}
                                        {daysText && <span className="ml-1">({daysText})</span>}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                            {productOrderQuantities[product.sku].ordered > 0 && (
                              <div className="text-sm font-medium text-yellow-600">
                                Commandé: {formatUnits(productOrderQuantities[product.sku].ordered)}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-[#666663]">-</div>
                        )}
                      </div>
                    </td>
                    
                    {/* Rotation */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        {product.rotationRate !== undefined && product.rotationRate !== null && product.rotationRate > 0 ? (
                          <>
                            <div className={`font-bold text-sm ${
                              product.rotationRate > 6 ? 'text-green-600' : // > 6 rotations/an = rapide
                              product.rotationRate > 2 ? 'text-blue-600' :   // 2-6 rotations/an = modérée
                              'text-orange-600'                              // < 2 rotations/an = lente
                            }`}>
                              {Math.round(product.rotationRate * 100) / 100} rot/an
                            </div>
                            <div className="text-xs text-[#666663]">
                              {product.rotationRate > 6 ? 'Rapide' :
                               product.rotationRate > 2 ? 'Modérée' :
                               'Lente'}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-[#666663]">N/A</div>
                        )}
                      </div>
                    </td>
                    
                    {/* Santé */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start">
                        <div className="text-sm font-bold text-[#191919]">
                          {Math.round(product.healthPercentage || 0)}%
                        </div>
                        <div className="w-16 mt-1">
                          <HealthBar percentage={product.healthPercentage || 0} status={product.healthStatus} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};