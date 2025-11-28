import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Package, 
  Truck, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  RotateCw,
  ShoppingCart,
  Building2,
  ExternalLink
} from 'lucide-react';
import { HealthBar } from '../ui/HealthBar';
import { ImagePreview } from '../ui/ImagePreview';
import { formatUnits, formatSalesPerDay } from '../../utils/decimalUtils';
import { formatETA } from '../../utils/dateUtils';

export const StockDetailPanel = ({ 
  product, 
  orderQuantities,
  onClose,
  onCreateOrder
}) => {
  if (!product) return null;

  const statusConfig = {
    urgent: {
      label: 'Action Immédiate',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    warning: {
      label: 'À Surveiller',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    healthy: {
      label: 'En Bonne Santé',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  };

  const status = statusConfig[product.healthStatus] || statusConfig.healthy;
  const quantities = orderQuantities || {};

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-full lg:w-1/2 xl:w-2/5 bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="bg-[#FAFAF7] border-b border-[#E5E4DF] p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {product.imageUrl || product.sku ? (
              <ImagePreview
                src={product.imageUrl}
                alt={product.name}
                sku={product.sku}
                thumbClassName="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-[#E5E4DF]"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[#E5E4DF] flex items-center justify-center text-lg text-[#666663] flex-shrink-0">
                <Package className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#191919] truncate">{product.name}</h2>
              <p className="text-sm text-[#666663]">{product.sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#E5E4DF] transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-[#666663]" />
          </button>
        </div>

        {/* Badge statut */}
        <div className="mt-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.bgColor} ${status.color} ${status.borderColor} border`}>
            {product.healthStatus === 'urgent' && <AlertTriangle className="w-3.5 h-3.5" />}
            {status.label}
          </span>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Santé du stock */}
        <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[#E5E4DF]">
          <h3 className="text-sm font-semibold text-[#191919] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Santé du Stock
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-3xl font-bold ${status.color}`}>
                  {Math.round(product.healthPercentage || 0)}%
                </span>
                <span className="text-sm text-[#666663]">de santé</span>
              </div>
              <HealthBar 
                percentage={product.healthPercentage || 0} 
                status={product.healthStatus}
                className="h-2.5"
              />
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-2 gap-3">
          {/* Stock actuel */}
          <div className="bg-white rounded-lg p-4 border border-[#E5E4DF]">
            <div className="flex items-center gap-2 text-[#666663] mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Stock Actuel</span>
            </div>
            <div className="text-2xl font-bold text-[#191919]">
              {formatUnits(product.stock)}
            </div>
            <div className="text-xs text-[#666663]">unités</div>
          </div>

          {/* Autonomie */}
          <div className="bg-white rounded-lg p-4 border border-[#E5E4DF]">
            <div className="flex items-center gap-2 text-[#666663] mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Autonomie</span>
            </div>
            <div className={`text-2xl font-bold ${status.color}`}>
              {product.daysOfStock || 0}
            </div>
            <div className="text-xs text-[#666663]">jours restants</div>
          </div>

          {/* Ventes/jour */}
          <div className="bg-white rounded-lg p-4 border border-[#E5E4DF]">
            <div className="flex items-center gap-2 text-[#666663] mb-1">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Ventes/Jour</span>
            </div>
            <div className="text-2xl font-bold text-[#191919]">
              {formatSalesPerDay(product.salesPerDay ?? 0)}
            </div>
            <div className="text-xs text-[#666663]">ajustées ML</div>
          </div>

          {/* Rotation */}
          <div className="bg-white rounded-lg p-4 border border-[#E5E4DF]">
            <div className="flex items-center gap-2 text-[#666663] mb-1">
              <RotateCw className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Rotation</span>
            </div>
            <div className={`text-2xl font-bold ${
              product.rotationRate > 6 ? 'text-green-600' :
              product.rotationRate > 2 ? 'text-blue-600' :
              'text-orange-600'
            }`}>
              {product.rotationRate ? `${product.rotationRate.toFixed(1)}x` : 'N/A'}
            </div>
            <div className="text-xs text-[#666663]">par an</div>
          </div>
        </div>

        {/* Fournisseur */}
        <div className="bg-white rounded-lg p-4 border border-[#E5E4DF]">
          <h3 className="text-sm font-semibold text-[#191919] mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Fournisseur
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[#666663] mb-1">Nom</div>
              <div className="font-medium text-[#191919]">{product.supplier || 'Non assigné'}</div>
            </div>
            <div>
              <div className="text-xs text-[#666663] mb-1">Délai de livraison</div>
              <div className="font-medium text-[#191919]">{product.leadTimeDays || 0} jours</div>
            </div>
            <div>
              <div className="text-xs text-[#666663] mb-1">Point de commande</div>
              <div className="font-medium text-[#191919]">{product.reorderPoint || 0} unités</div>
            </div>
            <div>
              <div className="text-xs text-[#666663] mb-1">MOQ</div>
              <div className="font-medium text-[#191919]">{product.moq || 0} unités</div>
            </div>
          </div>
        </div>

        {/* En transit / Commandé */}
        {(quantities.inTransit > 0 || quantities.ordered > 0) && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Réapprovisionnement en cours
            </h3>
            <div className="space-y-2">
              {quantities.inTransit > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">En transit</span>
                  <div className="text-right">
                    <span className="font-bold text-purple-900">{formatUnits(quantities.inTransit)} unités</span>
                    {quantities.eta && (
                      <div className="text-xs text-purple-600">
                        ETA: {formatETA(quantities.eta).formatted}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {quantities.ordered > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-700">Commandé</span>
                  <span className="font-bold text-yellow-900">{formatUnits(quantities.ordered)} unités</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alerte surstock */}
        {product.isDeepOverstock && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Surstock profond détecté</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Ce produit a un stock supérieur à la normale. Considérez une action promotionnelle ou une réduction des prochaines commandes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quantité à commander */}
        {product.qtyToOrder > 0 && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-red-900">Commande recommandée</h4>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatUnits(product.qtyToOrder)} unités
                </p>
              </div>
              {onCreateOrder && (
                <button
                  onClick={() => onCreateOrder(product)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Commander
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer avec actions */}
      <div className="border-t border-[#E5E4DF] p-4 bg-[#FAFAF7]">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#666663] hover:text-[#191919] transition-colors"
          >
            Fermer
          </button>
          {product.shopifyProductId && (
            <a
              href={`https://admin.shopify.com/products/${product.shopifyProductId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#191919] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Voir sur Shopify
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StockDetailPanel;

