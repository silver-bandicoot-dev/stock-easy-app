import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from './useSearch';
import { SearchDropdown } from './SearchDropdown';
import { useNavigate } from 'react-router-dom';

/**
 * Composant SearchModal - Modal de recherche pour mobile
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {Function} onClose - Callback pour fermer le modal
 * @param {Function} setActiveTab - Fonction pour changer l'onglet actif
 * @param {Function} setParametersSubTab - Fonction pour changer le sous-onglet Paramètres
 * @param {Function} setTrackTabSection - Fonction pour changer le sous-onglet Track
 * @param {Function} setStockLevelSearch - Fonction pour filtrer dans l'onglet Stock
 * @param {Function} onSupplierSelect - Callback lors de la sélection d'un fournisseur
 */
export const SearchModal = ({ 
  isOpen,
  onClose,
  setActiveTab,
  setParametersSubTab,
  setTrackTabSection,
  setStockLevelSearch,
  onSupplierSelect
}) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { results, loading, saveToHistory } = useSearch(query);

  // Aplatir les résultats pour la navigation clavier
  const flatItems = results.flatMap((group) => group.items);

  // Focus automatique quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Réinitialiser l'état quand le modal se ferme
      setQuery('');
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // Gérer la sélection d'un item
  const handleItemSelect = useCallback(
    (item) => {
      // Sauvegarder dans l'historique
      saveToHistory(query, item.type, item.data);

      // Fermer le modal et réinitialiser
      onClose();
      setQuery('');
      setShowDropdown(false);
      setActiveIndex(-1);

      // Navigation selon le type
      if (setActiveTab) {
        console.log('🔍 Navigation vers:', item.type, item.id, item.data);
        
        switch (item.type) {
          case 'product':
            setActiveTab('stock-level');
            if (setStockLevelSearch) {
              setStockLevelSearch(item.id);
            }
            break;
            
          case 'supplier':
            setActiveTab('settings');
            if (setParametersSubTab) {
              setParametersSubTab('suppliers');
            }
            if (onSupplierSelect) {
              setTimeout(() => {
                onSupplierSelect(item.data);
              }, 100);
            }
            break;
            
          case 'order':
            setActiveTab('track');
            if (setTrackTabSection && item.data?.status) {
              const statusToTab = {
                'pending_confirmation': 'en_cours_commande',
                'preparing': 'preparation',
                'in_transit': 'en_transit',
                'received': 'commandes_recues',
                'reconciliation': 'reconciliation',
                'completed': 'completed'
              };
              const targetTab = statusToTab[item.data.status] || 'en_cours_commande';
              setTrackTabSection(targetTab);
            }
            break;
            
          case 'warehouse':
            setActiveTab('settings');
            if (setParametersSubTab) {
              setParametersSubTab('warehouses');
            }
            break;
            
          case 'history':
            setQuery(item.title);
            setShowDropdown(true);
            break;
            
          default:
            break;
        }
      }
    },
    [query, saveToHistory, onClose, navigate, setActiveTab, setParametersSubTab, setTrackTabSection, setStockLevelSearch, onSupplierSelect]
  );

  // Gérer la navigation clavier
  const handleKeyDown = (event) => {
    if (!showDropdown || flatItems.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((prev) =>
          prev < flatItems.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        event.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatItems.length) {
          handleItemSelect(flatItems[activeIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        onClose();
        break;

      default:
        break;
    }
  };

  // Gérer les changements de l'input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(true);
    setActiveIndex(-1);
  };

  // Effacer la recherche
  const handleClear = () => {
    setQuery('');
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100]"
          />
          
          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-[101] bg-[#FAFAF7] shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E5E4DF]">
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[#E5E4DF] transition-colors"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5 text-[#191919]" />
              </button>
              
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="w-5 h-5 text-neutral-400" />
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Rechercher un produit, fournisseur, commande..."
                  className="
                    w-full pl-10 pr-10 py-3 
                    text-sm text-neutral-900 placeholder-neutral-500
                    bg-white border border-neutral-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    transition-all
                  "
                />

                {/* Bouton Clear */}
                {query && !loading && (
                  <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded transition-colors"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-4 h-4 text-neutral-500" />
                  </button>
                )}
                
                {/* Indicateur de chargement */}
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[calc(100vh-120px)] overflow-y-auto">
              <SearchDropdown
                results={results}
                loading={loading}
                activeIndex={activeIndex}
                onItemClick={handleItemSelect}
                query={query}
                show={showDropdown && (query.length >= 2 || results.length > 0)}
                isMobile={true}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


