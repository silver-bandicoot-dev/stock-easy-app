import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../shared/Button';
import { DISCREPANCY_TYPES } from '../../../constants/stockEasyConstants';

export const ReconciliationModal = ({
  isOpen,
  onClose,
  order,
  products,
  onConfirm,
  initialData
}) => {
  const [receivedItems, setReceivedItems] = useState({});
  const [discrepancies, setDiscrepancies] = useState({});
  const [damages, setDamages] = useState({});
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      // Initialiser les données avec les quantités commandées
      const initialReceivedItems = {};
      const initialDiscrepancies = {};
      const initialDamages = {};

      order.items?.forEach(item => {
        // Utiliser les valeurs existantes si disponibles, sinon les quantités commandées
        const existingReceived = item.receivedQuantity !== undefined ? item.receivedQuantity : item.quantity;
        const existingDamaged = item.damagedQuantity || 0;
        const totalReceived = existingReceived + existingDamaged;
        const discrepancy = totalReceived - item.quantity;

        // Stocker en string pour permettre des champs vides dans les inputs
        initialReceivedItems[item.sku] = existingReceived?.toString() ?? '';
        initialDiscrepancies[item.sku] = discrepancy;
        initialDamages[item.sku] = existingDamaged;
      });

      setReceivedItems(initialReceivedItems);
      setDiscrepancies(initialDiscrepancies);
      setDamages(initialDamages);
      setNotes('');
    }
  }, [isOpen, order]);

  const handleReceivedQuantityChange = (sku, quantity) => {
    const orderedQuantity = order.items?.find(item => item.sku === sku)?.quantity || 0;
    const receivedQty = parseInt(quantity || 0, 10) || 0;
    const damageQty = damages[sku] || 0;
    // L'écart doit prendre en compte le total reçu (sain + endommagé)
    const totalReceived = receivedQty + damageQty;
    const discrepancy = totalReceived - orderedQuantity;

    setReceivedItems(prev => ({
      ...prev,
      // On garde la valeur brute pour l'input afin de permettre la suppression du 0
      [sku]: quantity
    }));

    setDiscrepancies(prev => ({
      ...prev,
      [sku]: discrepancy
    }));
  };

  const handleDamageQuantityChange = (sku, quantity) => {
    const damageQty = parseInt(quantity || 0, 10) || 0;
    const orderedQuantity = order.items?.find(item => item.sku === sku)?.quantity || 0;
    const receivedQty = parseInt((receivedItems[sku] ?? 0), 10) || 0;
    // Recalculer l'écart quand la quantité endommagée change
    const totalReceived = receivedQty + damageQty;
    const discrepancy = totalReceived - orderedQuantity;

    setDamages(prev => ({
      ...prev,
      [sku]: damageQty
    }));

    // Mettre à jour l'écart aussi
    setDiscrepancies(prev => ({
      ...prev,
      [sku]: discrepancy
    }));
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    try {
      const reconciliationData = {
        receivedItems,
        discrepancies,
        damages,
        notes
      };

      await onConfirm(reconciliationData);
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotals = () => {
    if (!order || !order.items) {
      return {
        totalOrdered: 0,
        totalReceived: 0,
        totalDiscrepancies: 0,
        totalDamages: 0
      };
    }

    const totalOrdered = Object.values(order.items).reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    const totalReceived = Object.values(receivedItems).reduce((sum, qty) => {
      const numericQty = parseInt(qty || 0, 10) || 0;
      return sum + numericQty;
    }, 0);
    const totalDiscrepancies = Object.values(discrepancies).reduce((sum, qty) => sum + Math.abs(qty || 0), 0);
    const totalDamages = Object.values(damages).reduce((sum, qty) => sum + (qty || 0), 0);

    return {
      totalOrdered,
      totalReceived,
      totalDiscrepancies,
      totalDamages
    };
  };

  if (!isOpen || !order) return null;

  const totals = calculateTotals();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Réconciliation de commande ${order.poNumber || order.id}`}
      size="large"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isProcessing}
            icon={isProcessing ? undefined : CheckCircle}
          >
            {isProcessing ? 'Traitement...' : 'Confirmer la réconciliation'}
          </Button>
        </div>
      }
    >

        {/* Résumé des totaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Commandé</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{totals.totalOrdered}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Reçu</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{totals.totalReceived}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Écarts</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{totals.totalDiscrepancies}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Endommagés</span>
            </div>
            <p className="text-2xl font-bold text-red-900">{totals.totalDamages}</p>
          </div>
        </div>

        {/* Liste des produits */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Articles reçus</h3>
          <div className="space-y-3">
            {order.items?.map(item => {
              const product = products.find(p => p.sku === item.sku);
              const rawReceived = receivedItems[item.sku];
              const receivedQty = rawReceived === undefined ? '' : rawReceived;
              const numericReceivedQty = parseInt(rawReceived || 0, 10) || 0;
              const discrepancy = discrepancies[item.sku] || 0;
              const damageQty = damages[item.sku] || 0;

              return (
                <div key={item.sku} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.sku}</h4>
                      <p className="text-sm text-gray-600">{product?.name || 'Produit inconnu'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Commandé: {item.quantity}</p>
                      {discrepancy !== 0 && (
                        <p className={`text-sm font-medium ${discrepancy > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Écart: {discrepancy > 0 ? '+' : ''}{discrepancy}
                        </p>
                      )}
                      {damageQty > 0 && (
                        <p className="text-sm font-medium text-red-600">
                          Endommagé: {damageQty}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité reçue saine
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={receivedQty}
                        onChange={(e) => handleReceivedQuantityChange(item.sku, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité endommagée
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={damageQty}
                        onChange={(e) => handleDamageQuantityChange(item.sku, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total reçu
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">
                        {numericReceivedQty + damageQty}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ajoutez des notes sur la réception..."
          />
        </div>

    </Modal>
  );
};