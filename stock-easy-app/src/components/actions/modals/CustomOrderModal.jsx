import React, { useState, useEffect } from 'react';
import { Mail, Package, AlertCircle } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { roundToTwoDecimals } from '../../../utils/decimalUtils';

export const CustomOrderModal = ({
  isOpen,
  onClose,
  selectedProducts,
  warehouses,
  emailGeneration,
  getUserSignature,
  suppliers,
  onConfirm
}) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [orderQuantities, setOrderQuantities] = useState({});
  const [editableEmail, setEditableEmail] = useState('');
  const [editableSubject, setEditableSubject] = useState('');
  const [editableBody, setEditableBody] = useState('');

  // Parser l'email pour extraire les parties
  const parseEmail = (content) => {
    if (!content) return { to: '', subject: '', body: '' };
    
    const lines = content.split('\n');
    let to = '';
    let subject = '';
    let body = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('À:')) {
        to = line.replace('À:', '').trim();
      } else if (line.startsWith('Objet:')) {
        subject = line.replace('Objet:', '').trim();
      } else if (line.startsWith('Bonjour,')) {
        body = lines.slice(i).join('\n');
        break;
      }
    }
    
    return { to, subject, body };
  };

  // Initialiser les quantités quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && selectedProducts && selectedProducts.length > 0) {
      const quantities = {};
      selectedProducts.forEach(p => {
        quantities[p.sku] = p.qtyToOrder || p.quantity || 0;
      });
      setOrderQuantities(quantities);
      
      // Sélectionner le premier entrepôt par défaut
      const warehousesList = Object.values(warehouses);
      if (warehousesList.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(warehousesList[0].name);
      }
    }
  }, [isOpen, selectedProducts, warehouses]);

  // Générer l'email quand les données changent
  useEffect(() => {
    if (isOpen && selectedProducts && selectedProducts.length > 0 && selectedWarehouse) {
      const supplier = selectedProducts[0]?.supplier;
      if (supplier) {
        // Générer l'email avec les données actuelles
        const emailContent = emailGeneration.generateOrderEmailDraft(
          supplier,
          selectedProducts,
          selectedWarehouse,
          orderQuantities,
          getUserSignature(),
          suppliers,
          warehouses
        );
        
        const parsed = parseEmail(emailContent);
        setEditableEmail(parsed.to);
        setEditableSubject(parsed.subject);
        setEditableBody(parsed.body);
      }
    }
  }, [isOpen, selectedProducts, selectedWarehouse, orderQuantities]);

  if (!isOpen || !selectedProducts || selectedProducts.length === 0) return null;

  const updateOrderQuantity = (sku, quantity) => {
    setOrderQuantities(prev => ({
      ...prev,
      [sku]: quantity
    }));
  };

  const totalAmount = roundToTwoDecimals(selectedProducts.reduce((sum, p) => {
    const qty = orderQuantities[p.sku] || p.qtyToOrder || 0;
    return sum + (qty * (p.buyPrice || 0));
  }, 0));

  const supplier = selectedProducts[0]?.supplier;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer une commande personnalisée"
      size="large"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} size="sm">
            Annuler
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => onConfirm('without_email', selectedWarehouse, orderQuantities)}
            disabled={!selectedWarehouse}
            size="sm"
          >
            Créer commande sans email
          </Button>
          <Button 
            variant="primary" 
            icon={Mail} 
            onClick={() => onConfirm('with_email', selectedWarehouse, orderQuantities, {
              to: editableEmail,
              subject: editableSubject,
              body: editableBody
            })}
            disabled={!selectedWarehouse}
            size="sm"
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
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
            required
          >
            <option value="">Sélectionner un entrepôt</option>
            {Object.values(warehouses).map((warehouse) => (
              <option key={warehouse.name} value={warehouse.name}>
                {warehouse.name} - {warehouse.city}, {warehouse.country}
              </option>
            ))}
          </select>
        )}
        {selectedWarehouse && warehouses[selectedWarehouse] && (
          <div className="mt-2 text-sm text-[#666663] bg-[#FAFAF7] p-3 rounded-lg">
            <p className="font-medium text-[#191919] mb-1">Adresse de livraison :</p>
            <p>{warehouses[selectedWarehouse].address}</p>
            <p>{warehouses[selectedWarehouse].postalCode} {warehouses[selectedWarehouse].city}</p>
            <p>{warehouses[selectedWarehouse].country}</p>
          </div>
        )}
      </div>

      {/* Informations du fournisseur */}
      {supplier && (
        <div className="mb-6 p-4 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[#191919]" />
            <span className="font-semibold text-[#191919]">{supplier}</span>
          </div>
          <p className="text-sm text-[#666663]">{selectedProducts.length} produit(s) sélectionné(s)</p>
        </div>
      )}

      {/* Section d'édition des quantités */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-semibold text-[#191919] mb-2 text-sm">Ajuster les quantités</h4>
        <div className="space-y-2">
          {selectedProducts.map(p => (
            <div key={p.sku} className="bg-white rounded p-2 border border-[#E5E4DF]">
              <div className="grid grid-cols-4 gap-2 items-center">
                <div className="col-span-2">
                  <div className="font-medium text-[#191919] text-xs truncate">{p.name}</div>
                  <div className="text-xs text-[#666663]">
                    SKU: {p.sku} • Quantité: {orderQuantities[p.sku] || p.qtyToOrder || 0}
                  </div>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={Math.ceil(orderQuantities[p.sku] || 0)}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      updateOrderQuantity(p.sku, value);
                    }}
                    className="w-full px-2 py-1 border border-[#E5E4DF] rounded text-center text-sm font-bold"
                  />
                </div>
                <div className="text-xs text-right text-[#666663]">
                  {roundToTwoDecimals((orderQuantities[p.sku] || 0) * (p.buyPrice || 0)).toFixed(2)}€
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-blue-200 flex justify-between items-center">
          <span className="text-sm text-[#666663]">Total:</span>
          <span className="text-lg font-bold text-[#191919]">{totalAmount.toFixed(2)}€</span>
        </div>
      </div>
      
      {/* Prévisualisation email */}
      <div className="space-y-3">
        <h4 className="font-semibold text-[#191919]">Prévisualisation email</h4>
        <div>
          <label className="block text-sm font-medium text-[#666663] mb-1">À:</label>
          <input 
            value={editableEmail} 
            onChange={(e) => setEditableEmail(e.target.value)}
            className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-white text-[#191919] text-sm focus:outline-none focus:ring-2 focus:ring-black" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#666663] mb-1">Objet:</label>
          <input 
            value={editableSubject} 
            onChange={(e) => setEditableSubject(e.target.value)}
            className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-white text-[#191919] text-sm focus:outline-none focus:ring-2 focus:ring-black" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#666663] mb-1">Message:</label>
          <textarea 
            value={editableBody} 
            onChange={(e) => setEditableBody(e.target.value)}
            rows={8} 
            className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-white text-[#191919] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-black" 
          />
        </div>
      </div>
    </Modal>
  );
};

