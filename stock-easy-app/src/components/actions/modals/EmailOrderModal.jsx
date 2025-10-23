import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Send, FileText, Calculator, Package } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../shared/Button';
import { formatPrice } from '../../../utils/decimalUtils';

export const EmailOrderModal = ({
  isOpen,
  onClose,
  supplier,
  products,
  suppliers,
  warehouses,
  selectedWarehouse,
  onWarehouseChange,
  orderQuantities,
  onQuantityChange,
  onSendEmail,
  onCreateWithoutEmail,
  generateEmailDraft,
  getUserSignature
}) => {
  const [emailContent, setEmailContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userSignature, setUserSignature] = useState('');

  // Initialiser la signature avec les informations du profil utilisateur
  useEffect(() => {
    if (isOpen && getUserSignature) {
      setUserSignature(getUserSignature());
    } else if (isOpen) {
      setUserSignature('L\'équipe StockEasy');
    }
  }, [isOpen, getUserSignature]);

  useEffect(() => {
    if (isOpen && supplier && products) {
      generateEmailContent();
    }
  }, [isOpen, supplier, products, selectedWarehouse, orderQuantities]);

  const generateEmailContent = async () => {
    if (!supplier || !products || !selectedWarehouse) return;

    setIsGenerating(true);
    try {
      const content = generateEmailDraft(
        supplier,
        products,
        selectedWarehouse,
        orderQuantities,
        userSignature
      );
      setEmailContent(content);
    } catch (error) {
      console.error('Erreur lors de la génération de l\'email:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateTotals = () => {
    if (!products || !Array.isArray(products)) {
      return { totalAmount: 0, totalItems: 0 };
    }

    let totalAmount = 0;
    let totalItems = 0;

    products.forEach(product => {
      const quantity = orderQuantities[product.sku] || 0;
      if (quantity > 0) {
        const unitPrice = product.supplierPrice || product.price || 0;
        totalAmount += quantity * unitPrice;
        totalItems += quantity;
      }
    });

    return { totalAmount, totalItems };
  };

  const handleSendEmail = async () => {
    try {
      await onSendEmail();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
    }
  };

  const handleCreateWithoutEmail = async () => {
    try {
      await onCreateWithoutEmail();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  if (!isOpen || !supplier || !products) return null;

  const { totalAmount, totalItems } = calculateTotals();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="p-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Email de commande</h2>
              <p className="text-sm text-gray-600">Fournisseur: {supplier}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Sélection de l'entrepôt */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entrepôt de livraison
          </label>
          <select
            value={selectedWarehouse || ''}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionner un entrepôt</option>
            {Object.values(warehouses).map(warehouse => (
              <option key={warehouse.id} value={warehouse.name}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        {/* Résumé de la commande */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Résumé de la commande</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nombre d'articles</p>
              <p className="text-lg font-semibold text-gray-900">{totalItems}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Montant total</p>
              <p className="text-lg font-semibold text-gray-900">{formatPrice(totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Liste des produits */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles commandés</h3>
          <div className="space-y-3">
            {products
              .filter(product => orderQuantities[product.sku] > 0)
              .map(product => {
                const quantity = orderQuantities[product.sku];
                const unitPrice = product.supplierPrice || product.price || 0;
                const totalPrice = quantity * unitPrice;

                return (
                  <div key={product.sku} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{product.sku}</p>
                        <p className="text-sm text-gray-600">{product.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{quantity} × {formatPrice(unitPrice)}</p>
                        <p className="font-semibold text-gray-900">{formatPrice(totalPrice)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Contenu de l'email */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Contenu de l'email</h3>
            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              onClick={generateEmailContent}
              disabled={isGenerating}
            >
              {isGenerating ? 'Génération...' : 'Régénérer'}
            </Button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {emailContent || 'Génération du contenu...'}
            </pre>
          </div>
        </div>

        {/* Signature */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signature
          </label>
          <input
            type="text"
            value={userSignature}
            onChange={(e) => setUserSignature(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Votre nom ou signature"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            variant="secondary"
            icon={FileText}
            onClick={handleCreateWithoutEmail}
          >
            Créer sans email
          </Button>
          <Button
            variant="primary"
            icon={Send}
            onClick={handleSendEmail}
            disabled={!selectedWarehouse || !emailContent}
          >
            Envoyer par email
          </Button>
        </div>
      </div>
    </Modal>
  );
};