import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Send, FileText, Calculator, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal, ModalFooter, ModalSection } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { formatPrice } from '../../../utils/decimalUtils';
import { ImagePreview } from '../../ui/ImagePreview';
import { EmailSendOptions } from '../../ui/EmailSendOptions';
import emailService from '../../../services/emailService';
import { toast } from 'sonner';

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
  const [editableEmail, setEditableEmail] = useState('');
  const [editableSubject, setEditableSubject] = useState('');
  const [editableBody, setEditableBody] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Trouver les informations du fournisseur
  const supplierInfo = useMemo(() => {
    if (!supplier || !suppliers) return null;
    return Array.isArray(suppliers)
      ? suppliers.find(s => s.name === supplier)
      : suppliers[supplier] || Object.values(suppliers).find(s => s.name === supplier);
  }, [supplier, suppliers]);

  // Trouver les informations de l'entrepôt
  const warehouseInfo = useMemo(() => {
    if (!selectedWarehouse || !warehouses) return null;
    return warehouses[selectedWarehouse] || Object.values(warehouses).find(w => w.name === selectedWarehouse);
  }, [selectedWarehouse, warehouses]);

  // Calculer les totaux
  const { totalAmount, totalItems } = useMemo(() => {
    if (!products || !Array.isArray(products)) {
      return { totalAmount: 0, totalItems: 0 };
    }

    let amount = 0;
    let items = 0;

    products.forEach(product => {
      const quantity = orderQuantities?.[product.sku] || 0;
      if (quantity > 0) {
        const unitPrice = product.supplierPrice || product.buyPrice || product.price || 0;
        amount += quantity * unitPrice;
        items += quantity;
      }
    });

    return { totalAmount: amount, totalItems: items };
  }, [products, orderQuantities]);

  // Générer l'email quand les paramètres changent
  useEffect(() => {
    if (!isOpen || !supplier || !products || !selectedWarehouse) return;

    const email = emailService.generateOrderEmail({
      supplierName: supplier,
      products: products.filter(p => (orderQuantities?.[p.sku] || 0) > 0),
      quantities: orderQuantities,
      supplier: supplierInfo,
      warehouse: warehouseInfo ? { ...warehouseInfo, name: selectedWarehouse } : { name: selectedWarehouse },
      signature: getUserSignature?.() || '',
      formatCurrency: formatPrice
    });

    setEditableEmail(email.to);
    setEditableSubject(email.subject);
    setEditableBody(email.body);
  }, [isOpen, supplier, products, selectedWarehouse, orderQuantities, supplierInfo, warehouseInfo]);

  // Validation de l'email
  const isEmailValid = emailService.isValidEmail(editableEmail);

  // Handlers
  const handleSendEmail = async () => {
    setIsProcessing(true);
    try {
      await onSendEmail();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast.error('Erreur lors de l\'envoi de la commande');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateWithoutEmail = async () => {
    setIsProcessing(true);
    try {
      await onCreateWithoutEmail();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !supplier || !products) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Email de commande"
      icon={Mail}
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
            variant="secondary"
            icon={FileText}
            onClick={handleCreateWithoutEmail}
            disabled={isProcessing || !selectedWarehouse}
            loading={isProcessing}
          >
            Créer sans email
          </Button>
          <Button
            variant="primary"
            icon={Send}
            onClick={handleSendEmail}
            disabled={isProcessing || !selectedWarehouse || !isEmailValid}
            loading={isProcessing}
          >
            Envoyer et créer
          </Button>
        </ModalFooter>
      }
    >
      {/* En-tête avec info fournisseur */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
          <Package className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <p className="text-sm text-primary-600">Fournisseur</p>
          <p className="font-semibold text-primary-900">{supplier}</p>
        </div>
      </div>

      {/* Sélection de l'entrepôt */}
      <ModalSection title="Entrepôt de livraison" className="mb-6">
        <select
          value={selectedWarehouse || ''}
          onChange={(e) => onWarehouseChange(e.target.value)}
          className="select-base"
        >
          <option value="">Sélectionner un entrepôt</option>
          {Object.values(warehouses || {}).map(warehouse => (
            <option key={warehouse.id || warehouse.name} value={warehouse.name}>
              {warehouse.name} - {warehouse.city}, {warehouse.country}
            </option>
          ))}
        </select>
        {warehouseInfo && (
          <div className="mt-2 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
            <p className="font-medium text-neutral-900 mb-1">Adresse :</p>
            <p>{warehouseInfo.address}</p>
            <p>{warehouseInfo.postalCode} {warehouseInfo.city}, {warehouseInfo.country}</p>
          </div>
        )}
      </ModalSection>

      {/* Résumé de la commande */}
      <ModalSection className="mb-6">
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-neutral-600" />
            <h3 className="font-semibold text-neutral-900">Résumé</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg border border-neutral-100">
              <p className="text-sm text-neutral-500">Articles</p>
              <p className="text-2xl font-bold text-neutral-900">{totalItems}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-neutral-100">
              <p className="text-sm text-neutral-500">Montant total</p>
              <p className="text-2xl font-bold text-primary-600">{formatPrice(totalAmount)}</p>
            </div>
          </div>
        </div>
      </ModalSection>

      {/* Liste des produits */}
      <ModalSection title="Articles commandés" className="mb-6">
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {products
            .filter(product => (orderQuantities?.[product.sku] || 0) > 0)
            .map(product => {
              const quantity = orderQuantities?.[product.sku] || 0;
              const unitPrice = product.supplierPrice || product.buyPrice || product.price || 0;
              const totalPrice = quantity * unitPrice;

              return (
                <div key={product.sku} className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      <ImagePreview
                        src={product.imageUrl}
                        alt={product.name}
                        thumbClassName="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-neutral-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center text-xs text-neutral-600 flex-shrink-0 font-medium">
                        {product.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-neutral-900 text-sm">{product.name}</p>
                      <p className="text-xs text-neutral-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-500">{quantity} × {formatPrice(unitPrice)}</p>
                    <p className="font-semibold text-neutral-900">{formatPrice(totalPrice)}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </ModalSection>

      {/* Contenu de l'email */}
      <ModalSection 
        title="Contenu de l'email"
        description="Vérifiez et modifiez le contenu avant envoi"
      >
        <div className="space-y-4">
          {/* Destinataire */}
          <div>
            <label className="label-base flex items-center gap-2">
              Destinataire
              {isEmailValid ? (
                <CheckCircle2 className="w-4 h-4 text-success-500" />
              ) : editableEmail && (
                <AlertTriangle className="w-4 h-4 text-warning-500" />
              )}
            </label>
            <input 
              type="email"
              value={editableEmail} 
              onChange={(e) => setEditableEmail(e.target.value)}
              className={`input-base ${!isEmailValid && editableEmail ? 'border-warning-400' : ''}`}
              placeholder="email@fournisseur.com"
            />
          </div>

          {/* Objet */}
          <div>
            <label className="label-base">Objet</label>
            <input 
              type="text"
              value={editableSubject} 
              onChange={(e) => setEditableSubject(e.target.value)}
              className="input-base"
            />
          </div>

          {/* Corps */}
          <div>
            <label className="label-base">Message</label>
            <textarea 
              value={editableBody} 
              onChange={(e) => setEditableBody(e.target.value)}
              rows={10} 
              className="input-base font-mono text-sm resize-y min-h-[200px]"
            />
          </div>
        </div>

        {/* Options d'envoi Gmail / Outlook */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <EmailSendOptions
            to={editableEmail}
            subject={editableSubject}
            body={editableBody}
          />
        </div>
      </ModalSection>
    </Modal>
  );
};
