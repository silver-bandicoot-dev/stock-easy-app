import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useSearch } from './useSearch';
import { SearchDropdown } from './SearchDropdown';
import { useNavigate } from 'react-router-dom';

/**
 * Composant SearchModal - Modal de recherche plein écran pour mobile
 * Utilise le même système d'animation que le Modal de base mais avec une variante "search"
 * 
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {Function} onClose - Callback pour fermer le modal
 * @param {Function} setActiveTab - Fonction pour changer l'onglet actif
 * @param {Function} setParametersSubTab - Fonction pour changer le sous-onglet Paramètres
 * @param {Function} setStockLevelSearch - Fonction pour filtrer dans l'onglet Stock
 * @param {Function} onSupplierSelect - Callback lors de la sélection d'un fournisseur
 */
export const SearchModal = ({ 
  isOpen,
  onClose,
  setActiveTab,
  setParametersSubTab,
  setStockLevelSearch,
  onSupplierSelect
}) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { results, loading, saveToHistory, searchError } = useSearch(query);

  // Aplatir les résultats pour la navigation clavier
  const flatItems = results.flatMap((group) => group.items);

  // Gestion du body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setShowDropdown(false);
      setActiveIndex(-1);
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Gérer la sélection d'un item
  const handleItemSelect = useCallback(
    (item) => {
      saveToHistory(query, item.type, item.data);
      onClose();
      setQuery('');
      setShowDropdown(false);
      setActiveIndex(-1);

      if (setActiveTab) {
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
            setActiveTab('orders');
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
    [query, saveToHistory, onClose, navigate, setActiveTab, setParametersSubTab, setStockLevelSearch, onSupplierSelect]
  );

  // Gérer la navigation clavier
  const handleKeyDown = (event) => {
    if (!showDropdown || flatItems.length === 0) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      return;
    }

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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Panel - Slide from top */}
          <motion.div
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-[101] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Recherche"
          >
            {/* Header avec champ de recherche */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-200">
              <button
                onClick={onClose}
                className="
                  p-2 rounded-lg 
                  text-neutral-600 hover:text-neutral-900
                  hover:bg-neutral-100 
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20
                "
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
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
                    text-sm text-neutral-900 placeholder:text-neutral-400
                    bg-neutral-50 border border-neutral-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                    focus:bg-white
                    transition-all
                  "
                />

                {/* Bouton Clear */}
                {query && !loading && (
                  <button
                    onClick={handleClear}
                    className="
                      absolute right-3 top-1/2 -translate-y-1/2 
                      p-1 rounded 
                      text-neutral-400 hover:text-neutral-600
                      hover:bg-neutral-200 
                      transition-colors
                    "
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* Indicateur de chargement */}
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            {/* Résultats */}
            <div className="max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar">
              <SearchDropdown
                results={results}
                loading={loading}
                activeIndex={activeIndex}
                onItemClick={handleItemSelect}
                query={query}
                show={showDropdown && (query.length >= 2 || results.length > 0)}
                isMobile={true}
                searchError={searchError}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Utiliser un portal pour rendre à la racine du DOM
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return null;
};
