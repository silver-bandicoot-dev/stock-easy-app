import React, { useState, useMemo } from 'react';
import { Plus, Mail, Clock, Package, Truck, AlertCircle, Edit2, X } from 'lucide-react';
import { Button } from '../../ui/Button';

/**
 * Composant de mapping entre produits et fournisseurs
 * @param {Object} props
 * @param {Array} props.products - Liste des produits
 * @param {Object} props.suppliers - Map des fournisseurs
 * @param {Function} props.onOpenAssignModal - Callback pour ouvrir le modal d'assignation
 * @param {Function} props.onRemoveSupplier - Callback pour retirer un fournisseur
 * @returns {JSX.Element}
 */
export function MappingSKUFournisseur({ 
  products, 
  suppliers, 
  onOpenAssignModal,
  onRemoveSupplier
}) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const suppliersList = useMemo(() => Object.values(suppliers), [suppliers]);
  
  const filteredProducts = useMemo(() => 
    products.filter(p => {
      const matchesSearch = 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (filter === 'without_supplier') return !p.supplier;
      if (filter === 'with_supplier') return !!p.supplier;
      return true;
    }),
    [products, searchTerm, filter]
  );
  
  const stats = {
    total: products.length,
    withSupplier: products.filter(p => p.supplier).length,
    withoutSupplier: products.filter(p => !p.supplier).length
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[#191919]">🔗 Mapping Produits ↔ Fournisseurs</h3>
        <p className="text-sm text-[#666663] mt-1">
          Associez chaque produit à son fournisseur principal
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-[#E5E4DF] p-4">
          <div className="text-sm text-[#666663]">Total produits</div>
          <div className="text-2xl font-bold text-[#191919]">{stats.total}</div>
        </div>
        
        <div className="bg-white rounded-lg border border-[#E5E4DF] p-4">
          <div className="text-sm text-[#666663]">Avec fournisseur</div>
          <div className="text-2xl font-bold text-green-600">{stats.withSupplier}</div>
        </div>
        
        <div className="bg-white rounded-lg border border-[#E5E4DF] p-4">
          <div className="text-sm text-[#666663]">Sans fournisseur</div>
          <div className="text-2xl font-bold text-[#EF1C43]">{stats.withoutSupplier}</div>
        </div>
      </div>
      
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-3 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6] bg-white"
        >
          <option value="all">Tous les produits ({stats.total})</option>
          <option value="with_supplier">Avec fournisseur ({stats.withSupplier})</option>
          <option value="without_supplier">Sans fournisseur ({stats.withoutSupplier})</option>
        </select>
      </div>
      
      {/* Liste des produits */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-[#FAFAF7] rounded-xl">
            <p className="text-[#666663]">Aucun produit trouvé</p>
          </div>
        ) : (
          filteredProducts.map(product => {
            const supplier = suppliers[product.supplier];
            const hasSupplier = !!product.supplier;
            
            return (
              <div 
                key={product.sku}
                className={`
                  bg-white rounded-xl shadow-sm border-2 p-6 transition-all
                  ${hasSupplier ? 'border-[#E5E4DF]' : 'border-orange-200 bg-orange-50'}
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-semibold text-[#191919]">
                        {product.sku}
                      </h4>
                      <span className="text-sm text-[#666663]">•</span>
                      <span className="text-sm text-[#666663]">{product.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-[#666663]">
                      <span>📦 Stock: {product.stock}</span>
                    </div>
                  </div>
                </div>
                
                {hasSupplier ? (
                  <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[#E5E4DF]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-4 h-4 text-[#8B5CF6]" />
                          <span className="font-semibold text-[#191919]">
                            {supplier?.name || product.supplier}
                          </span>
                        </div>
                        
                        {supplier && (
                          <div className="space-y-1 text-sm text-[#666663]">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <span>{supplier.email}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Délai: {supplier.leadTimeDays}j</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Package className="w-3 h-3" />
                                <span>MOQ: {supplier.moq}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => onOpenAssignModal(product)}
                          className="p-2 text-[#8B5CF6] hover:bg-purple-50 rounded-lg transition-all"
                          title="Changer de fournisseur"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => onRemoveSupplier(product.sku)}
                          className="p-2 text-[#EF1C43] hover:bg-red-50 rounded-lg transition-all"
                          title="Retirer le fournisseur"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-orange-100 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Aucun fournisseur assigné</span>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => onOpenAssignModal(product)}
                      icon={Plus}
                    >
                      Assigner
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

