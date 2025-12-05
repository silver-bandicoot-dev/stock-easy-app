import React, { useState, useEffect, useMemo } from 'react';
import { Mail, AlertCircle, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import { Modal, ModalFooter, ModalSection } from '../ui/Modal';
import { Button } from '../ui/Button';
import { roundToTwoDecimals } from '../../utils/decimalUtils';
import { useCurrency } from '../../contexts/CurrencyContext';
import { ImagePreview } from '../ui/ImagePreview';
import { EmailSendOptions } from '../ui/EmailSendOptions';
import emailService from '../../services/emailService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  
  // Trouver les informations du fournisseur et de l'entrepôt
  const supplierInfo = useMemo(() => {
    if (!selectedSupplier || !suppliers) return null;
    return Array.isArray(suppliers)
      ? suppliers.find(s => s.name === selectedSupplier)
      : suppliers[selectedSupplier] || Object.values(suppliers).find(s => s.name === selectedSupplier);
  }, [selectedSupplier, suppliers]);

  const warehouseInfo = useMemo(() => {
    if (!selectedWarehouse || !warehouses) return null;
    return warehouses[selectedWarehouse] || Object.values(warehouses).find(w => w.name === selectedWarehouse);
  }, [selectedWarehouse, warehouses]);

  const productsToOrder = useMemo(() => {
    if (!selectedSupplier || !toOrderBySupplier) return [];
    return toOrderBySupplier[selectedSupplier] || [];
  }, [selectedSupplier, toOrderBySupplier]);

  // Calculer le total
  const totalAmount = useMemo(() => {
    return roundToTwoDecimals(
      productsToOrder.reduce((sum, p) => {
        const qty = orderQuantities[p.sku] ?? p.qtyToOrder ?? 0;
        return sum + (qty * (p.buyPrice || 0));
      }, 0)
    );
  }, [productsToOrder, orderQuantities]);

  // Générer l'email quand les conditions sont réunies
  useEffect(() => {
    // Ne générer que si le modal est ouvert ET qu'on a toutes les données nécessaires
    if (!isOpen || !selectedSupplier || !selectedWarehouse) {
      return;
    }
    
    // Récupérer les produits directement depuis toOrderBySupplier
    // (en cas de problème de timing avec productsToOrder)
    const products = toOrderBySupplier?.[selectedSupplier] || productsToOrder;
    
    // Attendre que les données soient prêtes
    if (!products || products.length === 0) {
      return;
    }

    const email = emailService.generateOrderEmail({
      supplierName: selectedSupplier,
      products: products,
      quantities: orderQuantities,
      supplier: supplierInfo,
      warehouse: warehouseInfo ? { ...warehouseInfo, name: selectedWarehouse } : { name: selectedWarehouse },
      signature: getUserSignature?.() || '',
      formatCurrency,
      t // Passer la fonction de traduction pour i18n
    });

    setEditableEmail(email.to);
    setEditableSubject(email.subject);
    setEditableBody(email.body);
  }, [isOpen, selectedSupplier, selectedWarehouse, toOrderBySupplier, productsToOrder, orderQuantities, supplierInfo, warehouseInfo, getUserSignature, formatCurrency, t]);

  // Reset les champs quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setEditableEmail('');
      setEditableSubject('');
      setEditableBody('');
    }
  }, [isOpen]);

  // Validation de l'email
  const isEmailValid = emailService.isValidEmail(editableEmail);

  if (!isOpen || !selectedSupplier) return null;

  return (
    <Modal
      isOpen={isOpen && selectedSupplier}
      onClose={onClose}
      title={t('emailOrderModal.title', 'Commande - {{supplier}}', { supplier: selectedSupplier })}
      icon={Mail}
      size="lg"
      footer={
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            {t('emailOrderModal.cancel', 'Annuler')}
          </Button>
          <Button 
            variant="primary" 
            icon={Package} 
            onClick={handleCreateOrderWithoutEmail}
            disabled={!selectedWarehouse}
          >
            {t('emailOrderModal.createOrder', 'Créer la commande')}
          </Button>
        </ModalFooter>
      }
    >
      {/* Sélection de l'entrepôt */}
      <ModalSection title={t('emailOrderModal.deliveryWarehouse', 'Entrepôt de livraison')} className="mb-6">
        {Object.keys(warehouses || {}).length === 0 ? (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-warning-800 font-medium">{t('emailOrderModal.noWarehouseConfigured', 'Aucun entrepôt configuré')}</p>
              <p className="text-sm text-warning-700 mt-1">
                {t('emailOrderModal.createWarehouseFirst', "Veuillez d'abord créer un entrepôt dans Paramètres → Entrepôts")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <select
              value={selectedWarehouse || ''}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="select-base"
              required
            >
              {Object.values(warehouses).map((warehouse) => (
                <option key={warehouse.name} value={warehouse.name}>
                  {warehouse.name} - {warehouse.city}, {warehouse.country}
                </option>
              ))}
            </select>
            {warehouseInfo && (
              <div className="mt-2 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <p className="font-medium text-neutral-900 mb-1">{t('emailOrderModal.deliveryAddress', 'Adresse de livraison :')}</p>
                <p>{warehouseInfo.address}</p>
                <p>{warehouseInfo.postalCode} {warehouseInfo.city}</p>
                <p>{warehouseInfo.country}</p>
              </div>
            )}
          </>
        )}
      </ModalSection>

      {/* Section d'édition des quantités */}
      <ModalSection title={t('emailOrderModal.productsToOrder', 'Produits à commander')} className="mb-6">
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {productsToOrder.map(p => (
              <div key={p.sku} className="bg-white rounded-lg p-3 border border-neutral-200">
                <div className="grid grid-cols-4 gap-3 items-center">
                  <div className="col-span-2 flex items-center gap-3">
                    {p.imageUrl ? (
                      <ImagePreview
                        src={p.imageUrl}
                        alt={p.name}
                        thumbClassName="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-neutral-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 flex-shrink-0 font-medium">
                        {p.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900 text-sm truncate">{p.name}</div>
                      <div className="text-xs text-neutral-500">
                        {t('emailOrderModal.sku', 'SKU')}: {p.sku} • {t('emailOrderModal.rec', 'Rec')}: {Math.ceil(p.qtyToOrder || 0)}
                      </div>
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
                      className="input-base text-center font-semibold"
                    />
                  </div>
                  <div className="text-sm text-right font-medium text-neutral-700">
                    {formatCurrency(roundToTwoDecimals((orderQuantities[p.sku] ?? p.qtyToOrder ?? 0) * (p.buyPrice || 0)))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-primary-200 flex justify-between items-center">
            <span className="text-sm font-medium text-neutral-700">{t('emailOrderModal.orderTotal', 'Total commande :')}</span>
            <span className="text-xl font-bold text-neutral-900">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </ModalSection>
      
      {/* Prévisualisation email */}
      <ModalSection 
        title={t('emailOrderModal.orderEmail', 'Email de commande')}
        description={t('emailOrderModal.emailDescription', 'Vérifiez et modifiez le contenu avant envoi')}
        className="mb-4"
      >
        <div className="space-y-4">
          {/* Destinataire */}
          <div>
            <label className="label-base flex items-center gap-2">
              {t('emailOrderModal.to', 'À:')}
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
              className={`input-base ${!isEmailValid && editableEmail ? 'border-warning-400 focus:border-warning-500 focus:ring-warning-500/20' : ''}`}
              placeholder="email@fournisseur.com"
            />
            {!isEmailValid && editableEmail && (
              <p className="helper-text text-warning-600">{t('emailOrderModal.invalidEmail', 'Adresse email invalide')}</p>
            )}
          </div>

          {/* Objet */}
          <div>
            <label className="label-base">{t('emailOrderModal.subject', 'Objet:')}</label>
            <input 
              type="text"
              value={editableSubject} 
              onChange={(e) => setEditableSubject(e.target.value)}
              className="input-base"
              placeholder={t('emailOrderModal.subjectPlaceholder', "Objet de l'email")}
            />
          </div>

          {/* Corps du message */}
          <div>
            <label className="label-base">{t('emailOrderModal.message', 'Message:')}</label>
            <textarea 
              value={editableBody} 
              onChange={(e) => setEditableBody(e.target.value)}
              rows={12} 
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
