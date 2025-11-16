import React, { useRef, useEffect } from 'react';
import { SearchItem } from './SearchItem';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';

/**
 * Composant SearchDropdown - Affiche les résultats de recherche groupés par catégorie
 * @param {Array} results - Résultats groupés par catégorie
 * @param {boolean} loading - État de chargement
 * @param {number} activeIndex - Index de l'élément actif (navigation clavier)
 * @param {Function} onItemClick - Callback lors du clic sur un item
 * @param {string} query - Terme de recherche pour le highlighting
 * @param {boolean} show - Si le dropdown est visible
 * @param {Function} getQuickActions - Fonction pour obtenir les actions rapides d'un item
 */
export const SearchDropdown = ({ results, loading, activeIndex, onItemClick, query, show, getQuickActions }) => {
  const { currentUser } = useAuth();
  const dropdownRef = useRef(null);
  const activeItemRef = useRef(null);

  // Auto-scroll vers l'élément actif lors de la navigation clavier
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeIndex]);

  if (!show) return null;

  // Aplatir les résultats pour la navigation clavier
  const flatItems = results.flatMap((group) =>
    group.items.map((item) => ({ ...item, category: group.category }))
  );

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-[500px] overflow-y-auto z-50 animate-slide-down"
    >
      {/* Message si non authentifié */}
      {!currentUser && query.length >= 2 && (
        <div className="py-8 px-4 text-center text-warning-600 bg-warning-50">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-semibold">Authentification requise</p>
          <p className="text-xs mt-1">Connectez-vous pour rechercher des produits</p>
        </div>
      )}

      {currentUser && loading && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
          <span className="text-sm text-neutral-600">Recherche en cours...</span>
        </div>
      )}

      {currentUser && !loading && results.length === 0 && query.length >= 2 && (
        <div className="py-8 px-4 text-center text-neutral-500">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm font-semibold">Aucun résultat trouvé</p>
          <p className="text-xs mt-1">Essayez un autre terme de recherche</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="py-2">
          {results.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-2 last:mb-0">
              {/* En-tête de catégorie */}
              <div className="px-4 py-2 flex items-center gap-2 bg-neutral-50 border-b border-neutral-100">
                <TrendingUp className="w-4 h-4 text-neutral-500" />
                <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  {group.category}
                </h3>
                <span className="text-xs text-neutral-500">({group.items.length})</span>
              </div>

              {/* Liste des items de la catégorie */}
              {group.items.map((item, itemIndex) => {
                // Calculer l'index global pour la navigation clavier
                const globalIndex = flatItems.findIndex(
                  (flatItem) =>
                    flatItem.id === item.id &&
                    flatItem.category === group.category
                );
                const isActive = globalIndex === activeIndex;

                return (
                  <div
                    key={item.id}
                    ref={isActive ? activeItemRef : null}
                  >
                    <SearchItem
                      item={item}
                      isActive={isActive}
                      onClick={onItemClick}
                      highlightText={query}
                      quickActions={getQuickActions ? getQuickActions(item) : []}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Footer avec indicateur */}
      {!loading && results.length > 0 && (
        <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100 text-center">
          <p className="text-xs text-neutral-500">
            Utilisez <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[10px] font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[10px] font-mono">↓</kbd> pour naviguer • <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[10px] font-mono">Entrée</kbd> pour sélectionner • <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[10px] font-mono">Échap</kbd> pour fermer
          </p>
        </div>
      )}
    </div>
  );
};

