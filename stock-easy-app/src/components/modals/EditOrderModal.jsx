import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Save, Plus, Minus, Trash2, AlertTriangle, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../shared/Button';
import { roundToTwoDecimals } from '../../utils/decimalUtils';

/**
 * Modale pour éditer un Purchase Order (PO)
 * Permet de modifier les quantités, prix et ajouter/supprimer des items
 * Disponible uniquement pour les statuts: pending_confirmation, preparing
 */
export const EditOrderModal = ({
  isOpen,
  onClose,
  order,
  products = [],
  onSave,
  isProcessing = false
}) => {
  const { t } = useTranslation();
  
  // État local pour les items édités
  const [editedItems, setEditedItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  // Initialiser les items quand la commande change
  useEffect(() => {
    if (order?.items) {
      setEditedItems(order.items.map(item => ({
        ...item,
        originalQuantity: item.quantity,
        originalPrice: item.pricePerUnit
      })));
      setNotes(order.notes || '');
    }
  }, [order]);
  
  // Produits disponibles pour ajout (non déjà dans la commande)
  const availableProducts = useMemo(() => {
    if (!products || !editedItems) return [];
    const existingSkus = editedItems.map(item => item.sku);
    return products.filter(p => 
      !existingSkus.includes(p.sku) &&
      p.supplier === order?.supplier
    );
  }, [products, editedItems, order?.supplier]);
  
  // Produits filtrés par recherche
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return availableProducts.slice(0, 10);
    const query = searchQuery.toLowerCase();
    return availableProducts
      .filter(p => 
        p.sku?.toLowerCase().includes(query) ||
        p.name?.toLowerCase().includes(query) ||
        p.nomProduit?.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [availableProducts, searchQuery]);
  
  // Calculer le nouveau total
  const newTotal = useMemo(() => {
    return editedItems.reduce((sum, item) => {
      return sum + roundToTwoDecimals((item.quantity || 0) * (item.pricePerUnit || 0));
    }, 0);
  }, [editedItems]);
  
  // Vérifier s'il y a des modifications
  const hasChanges = useMemo(() => {
    if (!order?.items) return false;
    
    // Vérifier si le nombre d'items a changé
    if (editedItems.length !== order.items.length) return true;
    
    // Vérifier si les items ont changé
    return editedItems.some(item => {
      const original = order.items.find(o => o.sku === item.sku);
      if (!original) return true;
      return item.quantity !== original.quantity || 
             item.pricePerUnit !== original.pricePerUnit;
    }) || notes !== (order.notes || '');
  }, [editedItems, order, notes]);
  
  // Mettre à jour la quantité d'un item
  const updateQuantity = (sku, delta) => {
    setEditedItems(prev => prev.map(item => {
      if (item.sku !== sku) return item;
      const newQty = Math.max(1, (item.quantity || 0) + delta);
      return { ...item, quantity: newQty };
    }));
  };
  
  // Mettre à jour la quantité directement
  const setQuantity = (sku, value) => {
    const qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 1) return;
    setEditedItems(prev => prev.map(item => {
      if (item.sku !== sku) return item;
      return { ...item, quantity: qty };
    }));
  };
  
  // Mettre à jour le prix unitaire
  const setPrice = (sku, value) => {
    const price = parseFloat(value);
    if (isNaN(price) || price < 0) return;
    setEditedItems(prev => prev.map(item => {
      if (item.sku !== sku) return item;
      return { ...item, pricePerUnit: roundToTwoDecimals(price) };
    }));
  };
  
  // Supprimer un item
  const removeItem = (sku) => {
    if (editedItems.length <= 1) {
      // Ne pas permettre de supprimer le dernier item
      return;
    }
    setEditedItems(prev => prev.filter(item => item.sku !== sku));
  };
  
  // Ajouter un produit
  const addProduct = (product) => {
    const newItem = {
      sku: product.sku,
      name: product.name || product.nomProduit,
      quantity: product.moq || 1,
      pricePerUnit: product.buyPrice || product.prixAchat || 0,
      isNew: true
    };
    setEditedItems(prev => [...prev, newItem]);
    setShowAddProduct(false);
    setSearchQuery('');
  };
  
  // Sauvegarder les modifications
  const handleSave = () => {
    if (!hasChanges) return;
    
    const updates = {
      items: editedItems.map(item => ({
        sku: item.sku,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit
      })),
      notes,
      total: roundToTwoDecimals(newTotal)
    };
    
    onSave(order.id, updates);
  };
  
  if (!isOpen || !order) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#E5E4DF] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#191919]">
                  {t('editOrder.title', 'Modifier la Commande')}
                </h2>
                <p className="text-sm text-[#666663]">
                  {order.id} • {order.supplier}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F5F5F0] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#666663]" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 flex-1 overflow-y-auto">
            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700">
                {t('editOrder.info', 'Modifiez les quantités et prix des articles. Les modifications seront sauvegardées dans votre système.')}
              </p>
            </div>
            
            {/* Liste des articles */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[#191919]">
                  {t('editOrder.items', 'Articles')} ({editedItems.length})
                </h3>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {t('editOrder.addProduct', 'Ajouter un produit')}
                </button>
              </div>
              
              {/* Recherche pour ajouter un produit */}
              {showAddProduct && (
                <div className="border border-[#E5E4DF] rounded-lg p-3 bg-[#FAFAF7]">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666663]" />
                    <input
                      type="text"
                      placeholder={t('editOrder.searchProduct', 'Rechercher un produit...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  {filteredProducts.length > 0 ? (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <button
                          key={product.sku}
                          onClick={() => addProduct(product)}
                          className="w-full text-left p-2 hover:bg-white rounded-lg transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-[#191919]">
                              {product.name || product.nomProduit}
                            </p>
                            <p className="text-xs text-[#666663]">{product.sku}</p>
                          </div>
                          <Plus className="w-4 h-4 text-blue-600" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#666663] text-center py-2">
                      {t('editOrder.noProducts', 'Aucun produit disponible')}
                    </p>
                  )}
                </div>
              )}
              
              {/* Items existants */}
              {editedItems.map((item, idx) => (
                <div
                  key={item.sku}
                  className={`border rounded-lg p-3 ${item.isNew ? 'border-green-300 bg-green-50' : 'border-[#E5E4DF]'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#191919] truncate">
                        {item.name || item.productName || item.sku}
                      </p>
                      <p className="text-xs text-[#666663]">SKU: {item.sku}</p>
                      {item.isNew && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {t('editOrder.newItem', 'Nouveau')}
                        </span>
                      )}
                    </div>
                    {editedItems.length > 1 && (
                      <button
                        onClick={() => removeItem(item.sku)}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors group"
                        title={t('editOrder.removeItem', 'Supprimer')}
                      >
                        <Trash2 className="w-4 h-4 text-[#666663] group-hover:text-red-600" />
                      </button>
                    )}
                  </div>
                  
                  {/* Contrôles de quantité et prix */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Quantité */}
                    <div>
                      <label className="text-xs text-[#666663] mb-1 block">
                        {t('editOrder.quantity', 'Quantité')}
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.sku, -1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center bg-[#F5F5F0] border border-[#E5E4DF] rounded-lg hover:bg-[#E5E4DF] transition-colors disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => setQuantity(item.sku, e.target.value)}
                          className="w-16 text-center px-2 py-1.5 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => updateQuantity(item.sku, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-[#F5F5F0] border border-[#E5E4DF] rounded-lg hover:bg-[#E5E4DF] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {item.originalQuantity !== undefined && item.quantity !== item.originalQuantity && (
                        <p className="text-xs text-amber-600 mt-1">
                          {t('editOrder.wasQuantity', 'Était')}: {item.originalQuantity}
                        </p>
                      )}
                    </div>
                    
                    {/* Prix unitaire */}
                    <div>
                      <label className="text-xs text-[#666663] mb-1 block">
                        {t('editOrder.unitPrice', 'Prix unitaire')}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666663]">€</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.pricePerUnit}
                          onChange={(e) => setPrice(item.sku, e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {item.originalPrice !== undefined && item.pricePerUnit !== item.originalPrice && (
                        <p className="text-xs text-amber-600 mt-1">
                          {t('editOrder.wasPrice', 'Était')}: €{item.originalPrice}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Sous-total ligne */}
                  <div className="mt-2 text-right">
                    <span className="text-sm text-[#666663]">
                      {t('editOrder.lineTotal', 'Total')}: 
                    </span>
                    <span className="ml-1 font-semibold text-[#191919]">
                      €{roundToTwoDecimals((item.quantity || 0) * (item.pricePerUnit || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Notes */}
            <div className="mb-4">
              <label className="text-sm font-medium text-[#191919] mb-1 block">
                {t('editOrder.notes', 'Notes')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('editOrder.notesPlaceholder', 'Notes additionnelles...')}
                className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
            </div>
            
            {/* Avertissement si modifications */}
            {hasChanges && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  {t('editOrder.unsavedChanges', 'Vous avez des modifications non sauvegardées.')}
                </p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-[#E5E4DF] bg-[#FAFAF7]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-[#666663]">
                {t('editOrder.newTotal', 'Nouveau total')}:
              </div>
              <div className="text-xl font-bold text-[#191919]">
                €{newTotal.toFixed(2)}
              </div>
            </div>
            
            {order.total !== newTotal && (
              <p className="text-xs text-amber-600 mb-3 text-right">
                {t('editOrder.originalTotal', 'Total original')}: €{roundToTwoDecimals(order.total).toFixed(2)}
              </p>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1"
              >
                {t('common.cancel', 'Annuler')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!hasChanges || isProcessing}
                icon={Save}
                className="flex-1"
              >
                {isProcessing 
                  ? t('common.saving', 'Sauvegarde...')
                  : t('editOrder.save', 'Sauvegarder')
                }
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditOrderModal;


