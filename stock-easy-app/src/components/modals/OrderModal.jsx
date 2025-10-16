import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Search, Package, Calendar, DollarSign } from 'lucide-react';
import Button from '../ui/Button/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { toast } from 'sonner';

export const OrderModal = ({ 
  isOpen, 
  onClose, 
  order = null,
  suppliers = [],
  products = [],
  onSubmit 
}) => {
  const [formData, setFormData] = useState({
    supplier: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    orderNumber: '',
    items: [],
    status: 'pending',
    notes: '',
    shippingCost: 0,
    taxAmount: 0
  });

  const [itemSearch, setItemSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Initialiser avec les données existantes si édition
  useEffect(() => {
    if (order) {
      setFormData({
        supplier: order.supplier || '',
        orderDate: order.orderDate || new Date().toISOString().split('T')[0],
        expectedDeliveryDate: order.expectedDeliveryDate || '',
        orderNumber: order.orderNumber || '',
        items: order.items || [],
        status: order.status || 'pending',
        notes: order.notes || '',
        shippingCost: order.shippingCost || 0,
        taxAmount: order.taxAmount || 0
      });
    }
  }, [order]);

  // Recherche de produits
  useEffect(() => {
    if (itemSearch.length > 0) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(itemSearch.toLowerCase())
      ).slice(0, 5);
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [itemSearch, products]);

  // Ajouter un produit à la commande
  const addItem = (product) => {
    const existingItem = formData.items.find(item => item.sku === product.sku);
    
    if (existingItem) {
      // Incrémenter la quantité si déjà présent
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.sku === product.sku
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }));
    } else {
      // Ajouter nouveau produit
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, {
          sku: product.sku,
          name: product.name,
          quantity: 1,
          unitCost: product.cost || 0,
          totalCost: product.cost || 0
        }]
      }));
    }
    
    setItemSearch('');
    setShowProductSearch(false);
    toast.success(`${product.name} ajouté à la commande`);
  };

  // Mettre à jour la quantité d'un item
  const updateItemQuantity = (sku, delta) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.sku === sku
          ? {
              ...item,
              quantity: Math.max(0, item.quantity + delta),
              totalCost: Math.max(0, item.quantity + delta) * item.unitCost
            }
          : item
      ).filter(item => item.quantity > 0) // Retirer si quantité = 0
    }));
  };

  // Supprimer un item
  const removeItem = (sku) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.sku !== sku)
    }));
    toast.success('Produit retiré de la commande');
  };

  // Calculer les totaux
  const subtotal = formData.items.reduce((sum, item) => sum + item.totalCost, 0);
  const total = subtotal + Number(formData.shippingCost) + Number(formData.taxAmount);

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.supplier) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        subtotal,
        total,
        id: order?.id || `ORD-${Date.now()}`
      });
      
      toast.success(order ? 'Commande mise à jour' : 'Commande créée avec succès');
      onClose();
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement de la commande');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {order ? 'Modifier la commande' : 'Nouvelle commande'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Ajoutez des produits et gérez votre commande fournisseur
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Fournisseur *"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                required
              >
                <option value="">Sélectionner un fournisseur</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>

              <Input
                label="N° de commande"
                value={formData.orderNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                placeholder="ORD-2025-001"
                icon={Package}
              />

              <Input
                label="Date de commande *"
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                required
                icon={Calendar}
              />

              <Input
                label="Date de livraison prévue"
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                icon={Calendar}
              />
            </div>

            {/* Recherche et ajout de produits */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ajouter des produits *
              </label>
              
              <div className="relative">
                <Input
                  value={itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setShowProductSearch(true);
                  }}
                  onFocus={() => setShowProductSearch(true)}
                  placeholder="Rechercher un produit par nom ou SKU..."
                  icon={Search}
                />

                {/* Résultats de recherche */}
                {showProductSearch && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.map(product => (
                      <button
                        key={product.sku}
                        type="button"
                        onClick={() => addItem(product)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {product.cost?.toFixed(2)}€
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {product.quantite}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Liste des produits ajoutés */}
            {formData.items.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Produits dans la commande ({formData.items.length})
                </label>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {formData.items.map(item => (
                    <div
                      key={item.sku}
                      className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Contrôles de quantité */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.sku, -1)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.sku, 1)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        {/* Prix total */}
                        <div className="text-right w-24">
                          <p className="font-medium text-gray-900">
                            {item.totalCost.toFixed(2)}€
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.unitCost.toFixed(2)}€/u
                          </p>
                        </div>

                        {/* Bouton supprimer */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.sku)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Frais supplémentaires */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Frais de port"
                type="number"
                step="0.01"
                min="0"
                value={formData.shippingCost}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: e.target.value }))}
                icon={DollarSign}
                placeholder="0.00"
              />

              <Input
                label="Taxes"
                type="number"
                step="0.01"
                min="0"
                value={formData.taxAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, taxAmount: e.target.value }))}
                icon={DollarSign}
                placeholder="0.00"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Informations supplémentaires sur la commande..."
              />
            </div>

            {/* Résumé des totaux */}
            {formData.items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de port</span>
                  <span className="font-medium">{Number(formData.shippingCost).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes</span>
                  <span className="font-medium">{Number(formData.taxAmount).toFixed(2)}€</span>
                </div>
                <div className="pt-2 border-t border-gray-300 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-blue-600">{total.toFixed(2)}€</span>
                </div>
              </div>
            )}
          </form>

          {/* Footer avec actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={formData.items.length === 0 || !formData.supplier}
            >
              {order ? 'Mettre à jour' : 'Créer la commande'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
