import React, { useState, useMemo } from 'react';
import { Plus, Mail, Clock, Package, FileText, Info, Edit2, X } from 'lucide-react';
import { Button } from '../../ui/Button';

/**
 * Composant de gestion des fournisseurs
 * @param {Object} props
 * @param {Object} props.suppliers - Map des fournisseurs
 * @param {Array} props.products - Liste des produits
 * @param {Function} props.onOpenModal - Callback pour ouvrir le modal
 * @param {Function} props.onDelete - Callback de suppression
 * @returns {JSX.Element}
 */
export function GestionFournisseurs({ 
  suppliers, 
  products,
  onOpenModal, 
  onDelete 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const suppliersList = useMemo(() => Object.values(suppliers), [suppliers]);
  
  const filteredSuppliers = useMemo(() => 
    suppliersList.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [suppliersList, searchTerm]
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#191919]">🏭 Gestion des Fournisseurs</h3>
          <p className="text-sm text-[#666663] mt-1">
            {suppliersList.length} fournisseur(s) actif(s)
          </p>
        </div>
        
        <Button 
          onClick={() => onOpenModal(null)}
          icon={Plus}
          variant="primary"
        >
          Nouveau fournisseur
        </Button>
      </div>
      
      {/* Recherche */}
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Rechercher un fournisseur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-10 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6] transition-all"
        />
      </div>
      
      {/* Liste des fournisseurs */}
      <div className="space-y-4">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-12 bg-[#FAFAF7] rounded-xl">
            <p className="text-[#666663]">
              {searchTerm ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur créé'}
            </p>
          </div>
        ) : (
          filteredSuppliers.map(supplier => {
            const productsCount = products.filter(p => p.supplier === supplier.name).length;
            
            return (
              <div 
                key={supplier.name}
                className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-[#191919] mb-2">
                      {supplier.name}
                    </h4>
                    
                    <div className="space-y-1 text-sm text-[#666663]">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span>{supplier.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>Délai: {supplier.leadTimeDays}j</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 shrink-0" />
                          <span>MOQ: {supplier.moq || 'N/A'} unités</span>
                        </div>
                      </div>
                      
                      {supplier.notes && (
                        <div className="flex items-start gap-2 mt-2">
                          <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="italic">{supplier.notes}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span className="font-medium">
                          {productsCount} produit(s) assigné(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onOpenModal(supplier)}
                      className="p-2 text-[#8B5CF6] hover:bg-purple-50 rounded-lg transition-all"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => onDelete(supplier)}
                      className="p-2 text-[#EF1C43] hover:bg-red-50 rounded-lg transition-all"
                      title="Supprimer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

