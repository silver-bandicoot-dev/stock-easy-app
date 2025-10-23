import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Mail, Package } from 'lucide-react';
import { Button } from '../shared/Button';
import { InfoTooltip, tooltips } from '../ui/InfoTooltip';
import { formatUnits } from '../../utils/decimalUtils';

export const OrderBySupplier = ({ 
  toOrderBySupplier, 
  suppliers, 
  warehouses, 
  selectedWarehouse, 
  setSelectedWarehouse,
  orderQuantities,
  updateOrderQuantity,
  generatePONumber,
  orders,
  handleCreateOrder,
  handleOpenEmailModal
}) => {
  return (
    <div className="space-y-6">
      {Object.keys(toOrderBySupplier).length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 shrink-0" />
          <h3 className="text-lg font-semibold text-[#191919] mb-2">Aucun produit à commander</h3>
          <p className="text-[#666663]">Tous vos stocks sont à jour !</p>
        </div>
      ) : (
        Object.entries(toOrderBySupplier).map(([supplier, products]) => (
          <motion.div
            key={supplier}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-200 shrink-0">
                <AlertCircle className="w-6 h-6 text-[#EF1C43] shrink-0" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#191919]">{supplier}</h2>
                <p className="text-sm text-[#666663]">{products.length} produit(s) à commander</p>
              </div>
            </div>

            {/* Sélection de l'entrepôt */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#191919] mb-2">
                Entrepôt de destination
              </label>
              <select
                value={selectedWarehouse || ''}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full p-3 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Sélectionner un entrepôt</option>
                {Object.values(warehouses).map(warehouse => (
                  <option key={warehouse.name} value={warehouse.name}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Liste des produits */}
            <div className="space-y-3 mb-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.sku}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="flex items-center gap-4 p-4 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#191919] text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-[#666663] truncate">SKU: {product.sku}</p>
                    <p className="text-xs text-[#666663]">Stock actuel: {formatUnits(product.stock)} unités</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#191919]">Quantité suggérée</p>
                      <p className="text-lg font-bold text-[#EF1C43]">{formatUnits(product.qtyToOrder)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-[#666663]">Quantité:</label>
                      <input
                        type="number"
                        min="0"
                        value={orderQuantities[product.sku] || product.qtyToOrder}
                        onChange={(e) => updateOrderQuantity(product.sku, e.target.value)}
                        className="w-20 p-2 border border-[#E5E4DF] rounded text-center text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-[#E5E4DF]">
              <Button
                variant="primary"
                icon={Package}
                onClick={() => handleCreateOrder(supplier, products)}
                disabled={!selectedWarehouse}
                className="flex-1 sm:flex-none"
              >
                Créer la commande
              </Button>
              <Button
                variant="outline"
                icon={Mail}
                onClick={() => handleOpenEmailModal(supplier, products)}
                disabled={!selectedWarehouse}
                className="flex-1 sm:flex-none"
              >
                Envoyer email
              </Button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};
