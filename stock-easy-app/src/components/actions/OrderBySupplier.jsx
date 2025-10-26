import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Mail, Package } from 'lucide-react';
import { Button } from '../shared/Button';
import { InfoTooltip } from '../ui/InfoTooltip';
import { formatUnits } from '../../utils/decimalUtils';

export const OrderBySupplier = ({ 
  toOrderBySupplier, 
  suppliers, 
  warehouses, 
  orderQuantities,
  updateOrderQuantity,
  generatePONumber,
  orders,
  handleCreateOrder,
  handleOpenEmailModal,
  emailModalHandlers
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
            className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#FAFAF7] border-b border-[#E5E4DF] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-200 shrink-0">
                    <AlertCircle className="w-6 h-6 text-[#EF1C43] shrink-0" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#191919]">{supplier}</h2>
                    <p className="text-sm text-[#666663]">{products.length} produit(s) à commander</p>
                  </div>
                </div>
              </div>
            </div>


            {/* Table des produits */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAF7] border-b border-[#E5E4DF]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                      Stock Actuel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                      Quantité Suggérée
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider">
                      Quantité à Commander
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E4DF]">
                  {products.map((product, index) => (
                    <motion.tr
                      key={product.sku}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="hover:bg-[#FAFAF7] transition-colors"
                    >
                      {/* Produit */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="font-bold text-[#191919] text-sm">{product.name}</div>
                          <div className="text-xs text-[#666663]">SKU: {product.sku}</div>
                          <div className="text-xs text-[#666663] mt-1">
                            Point de commande: {formatUnits(product.reorderPoint || 0)}
                          </div>
                        </div>
                      </td>
                      
                      {/* Stock Actuel */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="font-bold text-[#191919] text-sm">{formatUnits(product.stock)} unités</div>
                          <div className="text-xs text-[#666663]">
                            MOQ: {formatUnits(product.moq || 0)}
                          </div>
                        </div>
                      </td>
                      
                      {/* Quantité Suggérée */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="font-bold text-[#EF1C43] text-sm">{formatUnits(product.qtyToOrder)}</div>
                          <div className="text-xs text-[#666663]">
                            Autonomie: {product.daysOfStock || 0} jours
                          </div>
                        </div>
                      </td>
                      
                      {/* Quantité à Commander */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={orderQuantities[product.sku] || product.qtyToOrder}
                            onChange={(e) => updateOrderQuantity(product.sku, e.target.value)}
                            className="w-20 p-2 border border-[#E5E4DF] rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-black"
                          />
                          <span className="text-xs text-[#666663]">unités</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions globales */}
            <div className="p-4 border-t border-[#E5E4DF] bg-[#FAFAF7]">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  icon={Package}
                  onClick={() => handleOpenEmailModal(supplier, products)}
                  className="flex-1 sm:flex-none"
                >
                  Commander
                </Button>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};