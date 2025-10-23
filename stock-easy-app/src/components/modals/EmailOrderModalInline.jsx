import React from 'react';
import { Mail, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { roundToTwoDecimals } from '../../utils/decimalUtils';

export const EmailOrderModalInline = ({
  isOpen,
  onClose,
  selectedSupplier,
  toOrderBySupplier,
  warehouses,
  selectedWarehouse,
  setSelectedWarehouse,
  orderQuantities,
  updateOrderQuantity,
  emailGeneration,
  getUserSignature,
  handleCreateOrderWithoutEmail,
  handleSendOrder
}) => {
  if (!isOpen || !selectedSupplier) return null;

  const productsToOrder = toOrderBySupplier[selectedSupplier];
  const email = emailGeneration.generateOrderEmailDraft(
    selectedSupplier,
    productsToOrder,
    selectedWarehouse,
    orderQuantities,
    getUserSignature()
  );
  const totalAmount = roundToTwoDecimals(productsToOrder.reduce((sum, p) => {
    const qty = orderQuantities[p.sku] || p.qtyToOrder;
    return sum + (qty * p.buyPrice);
  }, 0));

  return (
    <Modal
      isOpen={isOpen && selectedSupplier}
      onClose={onClose}
      title={`Commande - ${selectedSupplier}`}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleCreateOrderWithoutEmail}
            disabled={!selectedWarehouse}
          >
            Créer commande sans email
          </Button>
          <Button 
            variant="primary" 
            icon={Mail} 
            onClick={handleSendOrder}
            disabled={!selectedWarehouse}
          >
            Envoyer email et créer commande
          </Button>
        </div>
      }
    >
      {/* Sélection de l'entrepôt */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[#191919] mb-2">
          Entrepôt de livraison *
        </label>
        {Object.keys(warehouses).length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">Aucun entrepôt configuré</p>
              <p className="text-sm text-yellow-700 mt-1">
                Veuillez d'abord créer un entrepôt dans Paramètres → Entrepôts
              </p>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* Liste des produits avec quantités éditables */}
      <div className="space-y-3 mb-6">
        <h4 className="font-semibold text-[#191919]">Produits à commander:</h4>
        {productsToOrder.map((product, index) => (
          <div key={product.sku} className="flex items-center gap-4 p-3 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]">
            <div className="flex-1 min-w-0">
              <h5 className="font-medium text-[#191919] text-sm truncate">{product.name}</h5>
              <p className="text-xs text-[#666663] truncate">SKU: {product.sku}</p>
              <p className="text-xs text-[#666663]">Prix: {roundToTwoDecimals(product.buyPrice).toFixed(2)}€</p>
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
        ))}
      </div>

      {/* Total */}
      <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[#E5E4DF] mb-6">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-[#191919]">Total de la commande:</span>
          <span className="font-bold text-[#191919] text-lg">{totalAmount.toFixed(2)}€</span>
        </div>
      </div>

      {/* Aperçu de l'email */}
      <div className="space-y-3">
        <h4 className="font-semibold text-[#191919]">Aperçu de l'email:</h4>
        <div className="bg-white border border-[#E5E4DF] rounded-lg p-4 max-h-60 overflow-y-auto">
          <div className="space-y-2 text-sm">
            <div><strong>À:</strong> {email.to}</div>
            <div><strong>Objet:</strong> {email.subject}</div>
            <div className="mt-3">
              <strong>Corps:</strong>
              <pre className="whitespace-pre-wrap text-xs mt-2 p-2 bg-[#FAFAF7] rounded border">{email.body}</pre>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
