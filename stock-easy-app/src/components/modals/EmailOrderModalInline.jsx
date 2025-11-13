import React, { useState, useEffect } from 'react';
import { Mail, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { roundToTwoDecimals } from '../../utils/decimalUtils';
import { useCurrency } from '../../contexts/CurrencyContext';

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
  handleSendOrder,
  suppliers
}) => {
  const [editableEmail, setEditableEmail] = useState('');
  const [editableSubject, setEditableSubject] = useState('');
  const [editableBody, setEditableBody] = useState('');
  const { format: formatCurrency } = useCurrency();

  // Initialiser les valeurs éditables quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && selectedSupplier) {
      const emailContent = emailGeneration.generateOrderEmailDraft(
        selectedSupplier,
        toOrderBySupplier[selectedSupplier],
        selectedWarehouse,
        orderQuantities,
        getUserSignature(),
        suppliers,
        warehouses
      );
      
      const parsedEmail = parseEmail(emailContent);
      setEditableEmail(parsedEmail.to);
      setEditableSubject(parsedEmail.subject);
      setEditableBody(parsedEmail.body);
    }
  }, [isOpen, selectedSupplier, selectedWarehouse, orderQuantities]);

  if (!isOpen || !selectedSupplier) return null;

  const productsToOrder = toOrderBySupplier[selectedSupplier];
  
  // Debug logs
  console.log('🔍 Debug EmailOrderModalInline:');
  console.log('- selectedSupplier:', selectedSupplier);
  console.log('- productsToOrder:', productsToOrder);
  console.log('- selectedWarehouse:', selectedWarehouse);
  console.log('- orderQuantities:', orderQuantities);
  console.log('- getUserSignature():', getUserSignature());
  
  const emailContent = emailGeneration.generateOrderEmailDraft(
    selectedSupplier,
    productsToOrder,
    selectedWarehouse,
    orderQuantities,
    getUserSignature(),
    suppliers,
    warehouses
  );
  
  console.log('- Generated email:', emailContent);
  
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
  
  const email = parseEmail(emailContent);
  const totalAmount = roundToTwoDecimals(productsToOrder.reduce((sum, p) => {
    const qty = orderQuantities[p.sku] || p.qtyToOrder;
    return sum + (qty * p.buyPrice);
  }, 0));

  return (
    <Modal
      isOpen={isOpen && selectedSupplier}
      onClose={onClose}
      title={`Commande - ${selectedSupplier}`}
      size="large"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} size="sm">
            Annuler
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleCreateOrderWithoutEmail}
            disabled={!selectedWarehouse}
            size="sm"
          >
            Créer commande sans email
          </Button>
          <Button 
            variant="primary" 
            icon={Mail} 
            onClick={handleSendOrder}
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
            value={selectedWarehouse || ''}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
            required
          >
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

      {/* Section d'édition des quantités */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-semibold text-[#191919] mb-2 text-sm">Ajuster les quantités</h4>
        <div className="space-y-2">
          {productsToOrder.map(p => (
            <div key={p.sku} className="bg-white rounded p-2 border border-[#E5E4DF]">
              <div className="grid grid-cols-4 gap-2 items-center">
                <div className="col-span-2">
                  <div className="font-medium text-[#191919] text-xs truncate">{p.name}</div>
                  <div className="text-xs text-[#666663]">
                    SKU: {p.sku} • Rec: {Math.ceil(p.qtyToOrder || 0)}
                  </div>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={orderQuantities[p.sku] !== undefined ? Math.ceil(orderQuantities[p.sku]) : Math.ceil(p.qtyToOrder || 0)}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      updateOrderQuantity(p.sku, value);
                    }}
                    className="w-full px-2 py-1 border border-[#E5E4DF] rounded text-center text-sm font-bold"
                  />
                </div>
                <div className="text-xs text-right text-[#666663]">
                  {formatCurrency(roundToTwoDecimals((orderQuantities[p.sku] || p.qtyToOrder) * p.buyPrice))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-blue-200 flex justify-between items-center">
          <span className="text-sm text-[#666663]">Total:</span>
          <span className="text-lg font-bold text-[#191919]">{formatCurrency(totalAmount)}</span>
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
