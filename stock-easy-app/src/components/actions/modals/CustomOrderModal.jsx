import React, { useState, useEffect, useMemo } from 'react';
import { Mail, AlertCircle, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import { Modal, ModalFooter, ModalSection } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { roundToTwoDecimals } from '../../../utils/decimalUtils';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { ImagePreview } from '../../ui/ImagePreview';
import { EmailSendOptions } from '../../ui/EmailSendOptions';
import emailService from '../../../services/emailService';
import { useTranslation } from 'react-i18next';

export const CustomOrderModal = ({
  isOpen,
  onClose,
  selectedProducts,
  warehouses,
  getUserSignature,
  suppliers,
  onConfirm
}) => {
  const { format: formatCurrency } = useCurrency();
  const { t } = useTranslation();
  
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [orderQuantities, setOrderQuantities] = useState({});
  const [editableEmail, setEditableEmail] = useState('');
  const [editableSubject, setEditableSubject] = useState('');
  const [editableBody, setEditableBody] = useState('');

  // Récupérer le fournisseur depuis les produits sélectionnés
  const supplierName = useMemo(() => {
    return selectedProducts?.[0]?.supplier || '';
  }, [selectedProducts]);

  // Trouver les informations du fournisseur
  const supplierInfo = useMemo(() => {
    if (!supplierName || !suppliers) return null;
    return Array.isArray(suppliers)
      ? suppliers.find(s => s.name === supplierName)
      : suppliers[supplierName] || Object.values(suppliers).find(s => s.name === supplierName);
  }, [supplierName, suppliers]);

  // Trouver les informations de l'entrepôt
  const warehouseInfo = useMemo(() => {
    if (!selectedWarehouse || !warehouses) return null;
    return warehouses[selectedWarehouse] || Object.values(warehouses).find(w => w.name === selectedWarehouse);
  }, [selectedWarehouse, warehouses]);

  // Calculer le total de la commande
  const totalAmount = useMemo(() => {
    if (!selectedProducts) return 0;
    return roundToTwoDecimals(
      selectedProducts.reduce((sum, p) => {
        const qty = orderQuantities[p.sku] ?? p.qtyToOrder ?? 0;
        return sum + (qty * (p.buyPrice || 0));
      }, 0)
    );
  }, [selectedProducts, orderQuantities]);

  // Initialiser les quantités quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && selectedProducts && selectedProducts.length > 0) {
      const quantities = {};
      selectedProducts.forEach(p => {
        quantities[p.sku] = p.qtyToOrder || p.quantity || 0;
      });
      setOrderQuantities(quantities);
      
      // Sélectionner le premier entrepôt par défaut
      const warehousesList = Object.values(warehouses || {});
      if (warehousesList.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(warehousesList[0].name);
      }
    }
  }, [isOpen, selectedProducts, warehouses]);

  // Générer l'email quand les données changent
  useEffect(() => {
    if (!isOpen || !selectedProducts || selectedProducts.length === 0 || !selectedWarehouse) {
      return;
    }

    const email = emailService.generateOrderEmail({
      supplierName: supplierName,
      products: selectedProducts,
      quantities: orderQuantities,
      supplier: supplierInfo,
      warehouse: warehouseInfo ? { ...warehouseInfo, name: selectedWarehouse } : { name: selectedWarehouse },
      signature: getUserSignature?.() || '',
      formatCurrency,
      t
    });

    setEditableEmail(email.to);
    setEditableSubject(email.subject);
    setEditableBody(email.body);
  }, [isOpen, selectedProducts, selectedWarehouse, orderQuantities, supplierInfo, warehouseInfo, getUserSignature, formatCurrency, t, supplierName]);

  // Reset les champs quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setEditableEmail('');
      setEditableSubject('');
      setEditableBody('');
      setSelectedWarehouse('');
    }
  }, [isOpen]);

  // Validation de l'email
  const isEmailValid = emailService.isValidEmail(editableEmail);

  // Mettre à jour une quantité
  const updateOrderQuantity = (sku, quantity) => {
    setOrderQuantities(prev => ({
      ...prev,
      [sku]: quantity
    }));
  };

  // Handler pour créer sans email
  const handleCreateWithoutEmail = () => {
    onConfirm('without_email', selectedWarehouse, orderQuantities);
  };

  // Handler pour envoyer et créer
  const handleSendAndCreate = () => {
    onConfirm('with_email', selectedWarehouse, orderQuantities, {
      to: editableEmail,
      subject: editableSubject,
      body: editableBody
    });
  };

  if (!isOpen || !selectedProducts || selectedProducts.length === 0) return null;

  return (
    <Modal
      isOpen={isOpen && selectedProducts?.length > 0}
      onClose={onClose}
      title={t('customOrderModal.title', 'Commande personnalisée - {{supplier}}', { supplier: supplierName })}
      icon={Package}
      size="lg"
      footer={
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            {t('customOrderModal.cancel', 'Annuler')}
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleCreateWithoutEmail}
            disabled={!selectedWarehouse}
          >
            {t('customOrderModal.createWithoutEmail', 'Créer sans email')}
          </Button>
          <Button 
            variant="primary" 
            icon={Mail} 
            onClick={handleSendAndCreate}
            disabled={!selectedWarehouse || !isEmailValid}
          >
            {t('customOrderModal.sendAndCreate', 'Envoyer et créer')}
          </Button>
        </ModalFooter>
      }
    >
      {/* Sélection de l'entrepôt */}
      <ModalSection title={t('customOrderModal.deliveryWarehouse', 'Entrepôt de livraison')} className="mb-6">
        {Object.keys(warehouses || {}).length === 0 ? (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-warning-800 font-medium">
                {t('customOrderModal.noWarehouseConfigured', 'Aucun entrepôt configuré')}
              </p>
              <p className="text-sm text-warning-700 mt-1">
                {t('customOrderModal.createWarehouseFirst', "Veuillez d'abord créer un entrepôt dans Paramètres → Entrepôts")}
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
              <option value="">{t('customOrderModal.selectWarehouse', 'Sélectionner un entrepôt')}</option>
              {Object.values(warehouses).map((warehouse) => (
                <option key={warehouse.name} value={warehouse.name}>
                  {warehouse.name} - {warehouse.city}, {warehouse.country}
                </option>
              ))}
            </select>
            {warehouseInfo && (
              <div className="mt-2 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <p className="font-medium text-neutral-900 mb-1">
                  {t('customOrderModal.deliveryAddress', 'Adresse de livraison :')}
                </p>
                <p>{warehouseInfo.address}</p>
                <p>{warehouseInfo.postalCode} {warehouseInfo.city}</p>
                <p>{warehouseInfo.country}</p>
              </div>
            )}
          </>
        )}
      </ModalSection>

      {/* Section d'édition des quantités */}
      <ModalSection title={t('customOrderModal.productsToOrder', 'Produits à commander')} className="mb-6">
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {selectedProducts.map(p => (
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
                        {t('customOrderModal.sku', 'SKU')}: {p.sku} • {t('customOrderModal.rec', 'Rec')}: {Math.ceil(p.qtyToOrder || 0)}
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
            <span className="text-sm font-medium text-neutral-700">
              {t('customOrderModal.orderTotal', 'Total commande :')}
            </span>
            <span className="text-xl font-bold text-neutral-900">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </ModalSection>
      
      {/* Prévisualisation email */}
      <ModalSection 
        title={t('customOrderModal.orderEmail', 'Email de commande')}
        description={t('customOrderModal.emailDescription', 'Vérifiez et modifiez le contenu avant envoi')}
        className="mb-4"
      >
        <div className="space-y-4">
          {/* Destinataire */}
          <div>
            <label className="label-base flex items-center gap-2">
              {t('customOrderModal.to', 'À:')}
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
              <p className="helper-text text-warning-600">
                {t('customOrderModal.invalidEmail', 'Adresse email invalide')}
              </p>
            )}
          </div>

          {/* Objet */}
          <div>
            <label className="label-base">{t('customOrderModal.subject', 'Objet:')}</label>
            <input 
              type="text"
              value={editableSubject} 
              onChange={(e) => setEditableSubject(e.target.value)}
              className="input-base"
              placeholder={t('customOrderModal.subjectPlaceholder', "Objet de l'email")}
            />
          </div>

          {/* Corps du message */}
          <div>
            <label className="label-base">{t('customOrderModal.message', 'Message:')}</label>
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
