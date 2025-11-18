import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Package, Mail, FileText, TrendingUp, Edit, Truck, ExternalLink, ShoppingBag, MapPin, Warehouse as WarehouseIcon } from 'lucide-react';
import { useSearch } from './useSearch';
import { SearchDropdown } from './SearchDropdown';
import { useNavigate } from 'react-router-dom';

/**
 * Composant SearchBar - Barre de recherche intelligente avec autocomplétion
 * @param {string} placeholder - Texte placeholder
 * @param {Function} onSelect - Callback optionnel lors de la sélection d'un résultat
 * @param {Function} setActiveTab - Fonction pour changer l'onglet actif (pour navigation interne)
 * @param {Function} setParametersSubTab - Fonction pour changer le sous-onglet Paramètres
 * @param {Function} setTrackTabSection - Fonction pour changer le sous-onglet Track
 * @param {Function} setStockLevelSearch - Fonction pour filtrer dans l'onglet Stock
 * @param {string} className - Classes CSS additionnelles
 */
export const SearchBar = ({ 
  placeholder = 'Rechercher un produit, fournisseur, commande...', 
  onSelect, 
  setActiveTab,
  setParametersSubTab,
  setTrackTabSection,
  setStockLevelSearch,
  onSupplierSelect,
  className = '' 
}) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const { results, loading, saveToHistory } = useSearch(query);

  // Aplatir les résultats pour la navigation clavier
  const flatItems = results.flatMap((group) => group.items);

  // Gérer le clic en dehors pour fermer le dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Raccourci clavier Cmd/Ctrl + K pour focus
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setShowDropdown(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Gérer la sélection d'un item
  const handleItemSelect = useCallback(
    (item) => {
      // Sauvegarder dans l'historique
      saveToHistory(query, item.type, item.data);

      // Fermer le dropdown
      setShowDropdown(false);
      setQuery('');
      setActiveIndex(-1);

      // Callback personnalisé si fourni
      if (onSelect) {
        onSelect(item);
        return;
      }

      // Navigation selon le type
      // Si setActiveTab est fourni, utiliser la navigation par onglets
      // Sinon, utiliser React Router
      if (setActiveTab) {
        // Navigation par onglets (pour StockEasy)
        console.log('🔍 Navigation vers:', item.type, item.id, item.data);
        
        switch (item.type) {
          case 'product':
            // Aller à l'onglet Stock et filtrer par le produit
            setActiveTab('stock-level');
            if (setStockLevelSearch) {
              // Filtrer par le nom du produit ou SKU
              setStockLevelSearch(item.id); // Le SKU
            }
            break;
            
          case 'supplier':
            // Aller à l'onglet Settings avec sous-onglet Fournisseurs
            setActiveTab('settings');
            if (setParametersSubTab) {
              setParametersSubTab('suppliers');
            }
            // Appeler le callback pour ouvrir la fiche du fournisseur
            if (onSupplierSelect) {
              // Délai pour laisser le temps à l'onglet de changer
              setTimeout(() => {
                onSupplierSelect(item.data);
              }, 100);
            }
            console.log('🔍 Fournisseur sélectionné:', item.id, item.data);
            break;
            
          case 'order':
            // Aller à l'onglet Track avec le bon sous-onglet selon le statut
            setActiveTab('track');
            if (setTrackTabSection && item.data?.status) {
              // Mapper le statut vers le bon sous-onglet
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
            console.log('🔍 Commande sélectionnée:', item.id, item.data);
            break;
            
          case 'warehouse':
            // Aller à l'onglet Settings avec sous-onglet Entrepôts
            setActiveTab('settings');
            if (setParametersSubTab) {
              setParametersSubTab('warehouses');
            }
            console.log('🏭 Entrepôt sélectionné:', item.id, item.data);
            break;
            
          case 'history':
            // Relancer la recherche depuis l'historique
            setQuery(item.title);
            setShowDropdown(true);
            break;
            
          default:
            break;
        }
      } else {
        // Navigation React Router (fallback)
        switch (item.type) {
          case 'product':
            navigate(`/?tab=stock&sku=${item.id}`);
            break;
          case 'supplier':
            navigate(`/?tab=settings&section=suppliers&id=${item.id}`);
            break;
          case 'order':
            navigate(`/?tab=track&order=${item.id}`);
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
    [query, saveToHistory, onSelect, navigate, setActiveTab, setParametersSubTab, setTrackTabSection, setStockLevelSearch, onSupplierSelect]
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
        setShowDropdown(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
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

  // Gérer le focus de l'input
  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  // Effacer la recherche
  const handleClear = () => {
    setQuery('');
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Obtenir les actions rapides selon le type d'élément
  const getQuickActions = useCallback((item) => {
    const actions = [];
    
    switch (item.type) {
      case 'product':
        actions.push({
          label: 'Commander',
          icon: ShoppingBag,
          onClick: (item) => {
            console.log('🛒 Commander produit:', item.id);
            // TODO: Ouvrir modal de commande rapide
            if (setActiveTab) {
              setActiveTab('actions');
            }
          }
        });
        actions.push({
          label: 'Historique',
          icon: TrendingUp,
          onClick: (item) => {
            console.log('📊 Voir historique:', item.id);
            if (setActiveTab) {
              setActiveTab('history');
              // TODO: Filtrer par SKU
            }
          }
        });
        actions.push({
          label: 'Éditer',
          icon: Edit,
          onClick: (item) => {
            console.log('✏️ Éditer produit:', item.id);
            // TODO: Ouvrir modal d'édition
          }
        });
        break;
        
      case 'supplier':
        actions.push({
          label: 'Email',
          icon: Mail,
          onClick: (item) => {
            console.log('✉️ Envoyer email:', item.data.email);
            if (item.data.email) {
              window.location.href = `mailto:${item.data.email}`;
            }
          }
        });
        actions.push({
          label: 'Produits',
          icon: Package,
          onClick: (item) => {
            console.log('📦 Voir produits du fournisseur:', item.id);
            if (setActiveTab) {
              setActiveTab('stock-level');
              // TODO: Filtrer par fournisseur
            }
          }
        });
        actions.push({
          label: 'Stats',
          icon: TrendingUp,
          onClick: (item) => {
            console.log('📈 Statistiques fournisseur:', item.id);
            if (setActiveTab) {
              setActiveTab('analytics');
            }
          }
        });
        break;
        
      case 'order':
        actions.push({
          label: 'Détails',
          icon: FileText,
          onClick: (item) => {
            console.log('📋 Voir détails commande:', item.id);
            if (setActiveTab && setTrackTabSection && item.data?.status) {
              setActiveTab('track');
              const statusToTab = {
                'pending_confirmation': 'en_cours_commande',
                'preparing': 'preparation',
                'in_transit': 'en_transit',
                'received': 'commandes_recues',
                'reconciliation': 'reconciliation',
                'completed': 'completed'
              };
              setTrackTabSection(statusToTab[item.data.status] || 'en_cours_commande');
            }
          }
        });
        if (item.data?.tracking_number) {
          actions.push({
            label: 'Tracking',
            icon: Truck,
            onClick: (item) => {
              console.log('🚚 Voir tracking:', item.data.tracking_number);
              // TODO: Ouvrir lien de tracking
            }
          });
        }
        actions.push({
          label: 'Contacter',
          icon: Mail,
          onClick: (item) => {
            console.log('📧 Contacter fournisseur:', item.data.supplier);
            // TODO: Ouvrir modal email
          }
        });
        break;
        
      case 'warehouse':
        actions.push({
          label: 'Voir stocks',
          icon: Package,
          onClick: (item) => {
            console.log('📦 Voir stocks entrepôt:', item.id);
            if (setActiveTab) {
              setActiveTab('stock-level');
              // TODO: Filtrer par entrepôt
            }
          }
        });
        actions.push({
          label: 'Localiser',
          icon: MapPin,
          onClick: (item) => {
            console.log('📍 Localiser entrepôt:', item.data.address);
            if (item.data.address) {
              const query = encodeURIComponent(item.data.address);
              window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
            }
          }
        });
        actions.push({
          label: 'Éditer',
          icon: Edit,
          onClick: (item) => {
            console.log('✏️ Éditer entrepôt:', item.id);
            // TODO: Ouvrir modal d'édition
          }
        });
        break;
        
      default:
        break;
    }
    
    return actions;
  }, [setActiveTab, setTrackTabSection]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input de recherche */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-neutral-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-28 py-3 
            text-sm text-neutral-900 placeholder-neutral-500
            bg-white border border-neutral-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all
            shadow-sm hover:shadow-md
          "
        />

        {/* Boutons à droite */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Indicateur de chargement */}
          {loading && (
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          )}

          {/* Indicateur de raccourci clavier ⌘K - affiché seulement si pas de query et pas de focus */}
          {!query && !loading && !showDropdown && (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium text-neutral-500 bg-white/60 border border-neutral-200/80 rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-sm">
              <span className="text-[11px] leading-none font-semibold">⌘</span>
              <span className="text-[11px] leading-none font-mono font-semibold">K</span>
            </kbd>
          )}

          {/* Bouton Clear */}
          {query && !loading && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-neutral-100 rounded transition-colors"
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown des résultats */}
      <SearchDropdown
        results={results}
        loading={loading}
        activeIndex={activeIndex}
        onItemClick={handleItemSelect}
        query={query}
        show={showDropdown && (query.length >= 2 || results.length > 0)}
        getQuickActions={getQuickActions}
      />
    </div>
  );
};

