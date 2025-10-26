import React from 'react';
import { Check, Info } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const ReconciliationModalInline = ({
  isOpen,
  onClose,
  reconciliationOrder,
  products,
  discrepancyItems,
  setDiscrepancyItems,
  damagedQuantities,
  setDamagedQuantities,
  confirmReconciliationWithQuantities
}) => {
  if (!isOpen || !reconciliationOrder) return null;

  return (
    <Modal
      isOpen={isOpen && reconciliationOrder}
      onClose={onClose}
      title="Vérification de la réception"
      footer={
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button 
            variant="success" 
            icon={Check}
            onClick={confirmReconciliationWithQuantities}
          >
            Valider la réception
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Commande: {reconciliationOrder.id}</h4>
              <p className="text-sm text-blue-700">
                Fournisseur: {reconciliationOrder.supplier}<br />
                Saisissez les quantités réellement reçues et leur état pour chaque produit.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {reconciliationOrder.items.map((item, idx) => {
            const product = products.find(p => p.sku === item.sku);
            const currentReceived = discrepancyItems[item.sku]?.received !== undefined 
              ? discrepancyItems[item.sku].received 
              : item.quantity;
            const currentDamaged = damagedQuantities[item.sku] || 0;
            
            // Calculer le total reçu (sain + endommagé)
            const totalReceived = parseInt(currentReceived || 0) + parseInt(currentDamaged || 0);
            const hasMissing = totalReceived < item.quantity;
            const hasDamaged = parseInt(currentDamaged) > 0;
            const missingQuantity = item.quantity - totalReceived;
            
            return (
              <div key={idx} className="border border-[#E5E4DF] rounded-lg p-4 bg-[#FAFAF7]">
                <div className="mb-3">
                  <span className="font-medium text-[#191919]">{product?.name || item.sku}</span>
                  <span className="text-xs text-[#666663] ml-2">({item.sku})</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Quantité commandée */}
                  <div>
                    <label className="text-xs text-[#666663] block mb-1">📦 Commandé</label>
                    <input 
                      type="number" 
                      value={item.quantity}
                      disabled
                      className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg bg-white text-[#666663] text-center"
                    />
                  </div>
                  
                  {/* Quantité reçue saine */}
                  <div>
                    <label className="text-xs text-[#666663] block mb-1">✅ Reçu sain</label>
                    <input 
                      type="number" 
                      min="0"
                      max={item.quantity}
                      value={currentReceived}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setDiscrepancyItems(prev => ({
                          ...prev,
                          [item.sku]: {
                            ...prev[item.sku],
                            received: value
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  
                  {/* Quantité endommagée */}
                  <div>
                    <label className="text-xs text-[#666663] block mb-1">🔴 Endommagé</label>
                    <input 
                      type="number" 
                      min="0"
                      max={item.quantity}
                      value={currentDamaged}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setDamagedQuantities(prev => ({
                          ...prev,
                          [item.sku]: value
                        }));
                      }}
                      className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  
                  {/* Résumé */}
                  <div className="sm:col-span-1 col-span-2">
                    <label className="text-xs text-[#666663] block mb-1">📊 Résumé</label>
                    <div className="text-xs space-y-1">
                      <div className={`p-2 rounded ${hasMissing ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {hasMissing ? `❌ ${missingQuantity} manquantes` : '✅ Quantité OK'}
                      </div>
                      {hasDamaged && (
                        <div className="p-2 rounded bg-orange-50 text-orange-700">
                          ⚠️ {currentDamaged} endommagées
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
