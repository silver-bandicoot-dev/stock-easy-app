import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Package, ClipboardCheck } from 'lucide-react';
import { Modal, ModalFooter, ModalSection } from '../../ui/Modal';
import { Button } from '../../ui/Button';

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
      const initialReceivedItems = {};
      const initialDiscrepancies = {};
      const initialDamages = {};

      order.items?.forEach(item => {
        const existingReceived = item.receivedQuantity !== undefined ? item.receivedQuantity : item.quantity;
        const existingDamaged = item.damagedQuantity || 0;
        const totalReceived = existingReceived + existingDamaged;
        const discrepancy = totalReceived - item.quantity;

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
    const totalReceived = receivedQty + damageQty;
    const discrepancy = totalReceived - orderedQuantity;

    setReceivedItems(prev => ({
      ...prev,
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
    const totalReceived = receivedQty + damageQty;
    const discrepancy = totalReceived - orderedQuantity;

    setDamages(prev => ({
      ...prev,
      [sku]: damageQty
    }));

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
      title={`Réconciliation ${order.poNumber || order.id}`}
      icon={ClipboardCheck}
      size="lg"
      footer={
        <ModalFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Annuler
          </Button>
          <Button
            variant="success"
            onClick={handleConfirm}
            loading={isProcessing}
            icon={CheckCircle}
          >
            Confirmer la réconciliation
          </Button>
        </ModalFooter>
      }
    >
      {/* Résumé des totaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-primary-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-medium text-primary-900">Commandé</span>
          </div>
          <p className="text-2xl font-bold text-primary-900">{totals.totalOrdered}</p>
        </div>
        <div className="bg-success-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-success-600" />
            <span className="text-xs font-medium text-success-900">Reçu</span>
          </div>
          <p className="text-2xl font-bold text-success-900">{totals.totalReceived}</p>
        </div>
        <div className="bg-warning-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-warning-600" />
            <span className="text-xs font-medium text-warning-900">Écarts</span>
          </div>
          <p className="text-2xl font-bold text-warning-900">{totals.totalDiscrepancies}</p>
        </div>
        <div className="bg-danger-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-danger-600" />
            <span className="text-xs font-medium text-danger-900">Endommagés</span>
          </div>
          <p className="text-2xl font-bold text-danger-900">{totals.totalDamages}</p>
        </div>
      </div>

      {/* Liste des produits */}
      <ModalSection title="Articles reçus" className="mb-6">
        <div className="space-y-3">
          {order.items?.map(item => {
            const product = products.find(p => p.sku === item.sku);
            const rawReceived = receivedItems[item.sku];
            const receivedQty = rawReceived === undefined ? '' : rawReceived;
            const numericReceivedQty = parseInt(rawReceived || 0, 10) || 0;
            const discrepancy = discrepancies[item.sku] || 0;
            const damageQty = damages[item.sku] || 0;

            return (
              <div key={item.sku} className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-neutral-900">{item.sku}</h4>
                    <p className="text-sm text-neutral-500">{product?.name || 'Produit inconnu'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-500">Commandé: <span className="font-medium text-neutral-700">{item.quantity}</span></p>
                    {discrepancy !== 0 && (
                      <p className={`text-sm font-medium ${discrepancy > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        Écart: {discrepancy > 0 ? '+' : ''}{discrepancy}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="label-base">
                      Quantité reçue saine
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={receivedQty}
                      onChange={(e) => handleReceivedQuantityChange(item.sku, e.target.value)}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="label-base">
                      Quantité endommagée
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={damageQty}
                      onChange={(e) => handleDamageQuantityChange(item.sku, e.target.value)}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="label-base">
                      Total reçu
                    </label>
                    <div className="px-3.5 py-2.5 bg-neutral-100 rounded-lg text-neutral-700 font-medium border border-neutral-200">
                      {numericReceivedQty + damageQty}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ModalSection>

      {/* Notes */}
      <ModalSection title="Notes" description="Ajoutez des observations sur la réception (optionnel)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="textarea-base"
          placeholder="Ajoutez des notes sur la réception..."
        />
      </ModalSection>
    </Modal>
  );
};
