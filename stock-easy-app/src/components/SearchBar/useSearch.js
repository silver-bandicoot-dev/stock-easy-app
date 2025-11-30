import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { 
  normalizeText, 
  detectSearchType,
  getSearchVariants,
  translateSearchTerm
} from '../../utils/searchUtils';
import { toast } from 'sonner';

const SEARCH_HISTORY_KEY = 'stock_easy_search_history';
const SEARCH_CACHE_KEY = 'stock_easy_search_cache';
const SEARCH_TRENDS_KEY = 'stock_easy_search_trends';
const MAX_HISTORY_ITEMS = 3; // Limité à 3 recherches récentes
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes de cache
const MAX_CACHE_ENTRIES = 50; // Limiter le cache à 50 entrées

/**
 * Hook personnalisé pour la recherche intelligente avec autocomplétion
 * @param {string} query - Terme de recherche
 * @returns {Object} État et méthodes de recherche
 */
export const useSearch = (query) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const debouncedQuery = useDebounce(query, 300);
  const { currentUser } = useAuth();
  const errorToastShownRef = useRef(false);

  // ============================================
  // GESTION DU CACHE LOCAL
  // ============================================
  
  const getCache = useCallback(() => {
    try {
      const cache = localStorage.getItem(SEARCH_CACHE_KEY);
      return cache ? JSON.parse(cache) : {};
    } catch (err) {
      return {};
    }
  }, []);

  const setCache = useCallback((searchTerm, data) => {
    try {
      const cache = getCache();
      const normalizedTerm = normalizeText(searchTerm);
      
      // Nettoyer les entrées expirées
      const now = Date.now();
      const cleanedCache = {};
      let count = 0;
      
      Object.entries(cache).forEach(([key, value]) => {
        if (value.expiry > now && count < MAX_CACHE_ENTRIES - 1) {
          cleanedCache[key] = value;
          count++;
        }
      });
      
      // Ajouter la nouvelle entrée
      cleanedCache[normalizedTerm] = {
        data,
        expiry: now + CACHE_DURATION_MS
      };
      
      localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cleanedCache));
    } catch (err) {
      console.warn('Cache write failed:', err);
    }
  }, [getCache]);

  const getCachedResults = useCallback((searchTerm) => {
    try {
      const cache = getCache();
      const normalizedTerm = normalizeText(searchTerm);
      const cached = cache[normalizedTerm];
      
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }
      return null;
    } catch (err) {
      return null;
    }
  }, [getCache]);

  // ============================================
  // GESTION DES TENDANCES DE RECHERCHE
  // ============================================
  
  const getTrends = useCallback(() => {
    try {
      const trends = localStorage.getItem(SEARCH_TRENDS_KEY);
      return trends ? JSON.parse(trends) : {};
    } catch (err) {
      return {};
    }
  }, []);

  const updateTrends = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    try {
      const trends = getTrends();
      const normalizedTerm = normalizeText(searchTerm);
      
      if (!trends[normalizedTerm]) {
        trends[normalizedTerm] = { count: 0, lastUsed: 0, term: searchTerm };
      }
      
      trends[normalizedTerm].count += 1;
      trends[normalizedTerm].lastUsed = Date.now();
      
      // Garder seulement les 100 tendances les plus récentes
      const sortedTrends = Object.entries(trends)
        .sort((a, b) => b[1].lastUsed - a[1].lastUsed)
        .slice(0, 100);
      
      const cleanedTrends = Object.fromEntries(sortedTrends);
      localStorage.setItem(SEARCH_TRENDS_KEY, JSON.stringify(cleanedTrends));
    } catch (err) {
      console.warn('Trends update failed:', err);
    }
  }, [getTrends]);

  const getTopTrends = useCallback((limit = 5) => {
    try {
      const trends = getTrends();
      return Object.values(trends)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(t => t.term);
    } catch (err) {
      return [];
    }
  }, [getTrends]);

  // ============================================
  // GESTION DE L'HISTORIQUE
  // ============================================

  const getSearchHistory = useCallback(() => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err);
      return [];
    }
  }, []);

  const saveToHistory = useCallback((searchTerm, resultType, resultData) => {
    if (!searchTerm || searchTerm.length < 2) return;

    try {
      const history = getSearchHistory();
      const newEntry = {
        query: searchTerm,
        type: resultType,
        data: resultData,
        timestamp: Date.now(),
      };

      // Éviter les doublons
      const filteredHistory = history.filter(
        (item) => !(item.query === searchTerm && item.type === resultType)
      );

      const updatedHistory = [newEntry, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      // Mettre à jour les tendances
      updateTrends(searchTerm);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde dans l\'historique:', err);
    }
  }, [getSearchHistory, updateTrends]);

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (err) {
      console.error('Erreur lors de l\'effacement de l\'historique:', err);
    }
  }, []);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(SEARCH_CACHE_KEY);
    } catch (err) {
      console.error('Erreur lors de l\'effacement du cache:', err);
    }
  }, []);

  // Recherche dans la base de données Supabase
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }

    // Vérifier que l'utilisateur est authentifié
    if (!currentUser) {
      console.warn('🔍 SearchBar: Utilisateur non authentifié, recherche impossible');
      setResults([]);
      return;
    }

    // Vérifier le cache d'abord
    const cachedResults = getCachedResults(searchQuery);
    if (cachedResults) {
      setResults(cachedResults);
      setSearchError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSearchError(null);

    try {
      // Normaliser la requête pour gérer les accents
      const normalizedQuery = normalizeText(searchQuery);
      
      // Détecter le type de recherche souhaité
      const searchType = detectSearchType(searchQuery);
      
      // Obtenir les variantes de recherche multilingues (FR, EN, ES)
      // Cela permet à un utilisateur américain de chercher "white shirt" 
      // et trouver "chemise blanc" dans la base de données
      const searchVariants = getSearchVariants(searchQuery);
      const translatedQuery = translateSearchTerm(searchQuery);
      
      // Utiliser la query traduite pour la recherche principale
      // et inclure l'originale comme fallback
      const primarySearchTerm = translatedQuery || searchQuery;
      
      console.log('🔍 Recherche multilingue:', {
        original: searchQuery,
        translated: translatedQuery,
        variants: searchVariants
      });
      
      // Construire les requêtes - On lance TOUTES les recherches pour ne rien rater
      const promises = [
        // Produits - recherche avec le terme traduit
        supabase.rpc('search_products_fuzzy', {
          search_term: primarySearchTerm,
          limit_count: 20
        }),
        // Fournisseurs
        supabase.rpc('search_suppliers_fuzzy', {
          search_term: primarySearchTerm,
          limit_count: 10
        }),
        // Commandes
        supabase.rpc('search_orders_fuzzy', {
          search_term: primarySearchTerm,
          limit_count: 10
        }),
        // Entrepôts
        supabase.rpc('search_warehouses_fuzzy', {
          search_term: primarySearchTerm,
          limit_count: 5
        })
      ];
      
      // Si la query traduite est différente de l'originale, 
      // faire aussi une recherche avec l'originale pour ne rien manquer
      if (translatedQuery !== searchQuery && translatedQuery !== normalizedQuery) {
        promises.push(
          supabase.rpc('search_products_fuzzy', {
            search_term: searchQuery,
            limit_count: 10
          })
        );
      }

      // Utiliser allSettled pour qu'une erreur ne bloque pas tout
      const resultsSettled = await Promise.allSettled(promises);
      
      const results = resultsSettled.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason });
      
      // Compter les erreurs RPC et afficher un toast si nécessaire
      const failedSearches = [];
      const searchNames = ['Produits', 'Fournisseurs', 'Commandes', 'Entrepôts'];
      
      results.forEach((res, index) => {
        if (res.error) {
          failedSearches.push(searchNames[index]);
          console.warn(`⚠️ Recherche ${searchNames[index]} a échoué:`, res.error.message || res.error);
        }
      });
      
      // Afficher une notification si des recherches ont échoué (mais seulement une fois)
      if (failedSearches.length > 0 && !errorToastShownRef.current) {
        errorToastShownRef.current = true;
        const errorMsg = failedSearches.length === 4 
          ? 'La recherche est temporairement indisponible'
          : `Recherche partielle : ${failedSearches.join(', ')} indisponible(s)`;
        
        setSearchError(errorMsg);
        toast.warning(errorMsg, { 
          duration: 3000,
          id: 'search-rpc-error'
        });
        
        // Reset le flag après un délai
        setTimeout(() => {
          errorToastShownRef.current = false;
        }, 10000);
      }
      
      // Extraire les résultats selon le type de recherche
      let resultIndex = 0;
      let produitsRes = results[resultIndex++];
      let fournisseursRes = results[resultIndex++];
      let commandesRes = results[resultIndex++];
      let warehousesRes = results[resultIndex++];
      
      // Fusionner les résultats de produits supplémentaires (recherche originale)
      // si une recherche secondaire a été effectuée
      if (results.length > 4 && results[4]?.data) {
        const additionalProducts = results[4].data;
        if (produitsRes?.data) {
          // Fusionner en évitant les doublons (par SKU)
          const existingSkus = new Set(produitsRes.data.map(p => p.sku));
          const newProducts = additionalProducts.filter(p => !existingSkus.has(p.sku));
          produitsRes.data = [...produitsRes.data, ...newProducts];
        } else {
          produitsRes = results[4];
        }
      }

      // Structurer les résultats par catégorie
      const groupedResults = [];

      // Produits (déjà triés par pertinence via RPC)
      if (produitsRes?.data && produitsRes.data.length > 0) {
        const products = produitsRes.data
          .map(p => ({
            id: p.sku,
            type: 'product',
            title: p.nom_produit,
            subtitle: `SKU: ${p.sku} • Stock: ${p.stock_actuel || 0}${p.prix_vente ? ` • ${p.prix_vente.toFixed(2)}€` : ''}`,
            meta: p.fournisseur || 'Pas de fournisseur',
            image: p.image_url,
            healthStatus: p.health_status,
            data: p,
            _relevanceScore: p.similarity_score // Score retourné par la RPC
          }));

        if (products.length > 0) {
          groupedResults.push({
            category: 'Produits',
            items: products
          });
        }
      }

      // Fournisseurs
      if (fournisseursRes?.data && fournisseursRes.data.length > 0) {
        const suppliers = fournisseursRes.data
          .map(f => ({
            id: f.id,
            type: 'supplier',
            title: f.nom_fournisseur,
            subtitle: f.email || f.commercial_contact_email || 'Pas de contact',
            meta: `Lead time: ${f.lead_time_days || 14} jours${f.commercial_contact_phone ? ` • ${f.commercial_contact_phone}` : ''}`,
            data: f,
            _relevanceScore: f.similarity_score
          }));

        if (suppliers.length > 0) {
          groupedResults.push({
            category: 'Fournisseurs',
            items: suppliers
          });
        }
      }

      // Commandes
      if (commandesRes?.data && commandesRes.data.length > 0) {
        const orders = commandesRes.data
          .map(c => {
            // Formater le statut en français
            const statusLabels = {
              'pending_confirmation': '⏳ En attente',
              'preparing': '📦 Préparation',
              'in_transit': '🚚 En transit',
              'received': '✅ Reçue',
              'completed': '✅ Complétée',
              'reconciliation': '⚠️ Réconciliation'
            };
            const statusLabel = statusLabels[c.status] || c.status;
            
            return {
              id: c.id,
              type: 'order',
              title: `Commande #${c.id?.substring(0, 8) || 'N/A'}`,
              subtitle: `${c.supplier}${c.tracking_number ? ` • 📦 ${c.tracking_number}` : ''}`,
              meta: `${statusLabel}${c.total ? ` • ${c.total.toFixed(2)}€` : ''}`,
              data: c,
              _relevanceScore: c.similarity_score
            };
          });

        if (orders.length > 0) {
          groupedResults.push({
            category: 'Commandes',
            items: orders
          });
        }
      }

      // Entrepôts
      if (warehousesRes?.data && warehousesRes.data.length > 0) {
        const warehouses = warehousesRes.data
          .map(w => ({
            id: w.id,
            type: 'warehouse',
            title: w.name,
            subtitle: `${w.city || 'Localisation non définie'}${w.address ? ` • ${w.address}` : ''}`,
            meta: `${w.country || 'France'}${w.postal_code ? ` • ${w.postal_code}` : ''}`,
            data: w,
            _relevanceScore: w.similarity_score
          }));

        if (warehouses.length > 0) {
          groupedResults.push({
            category: 'Entrepôts',
            items: warehouses
          });
        }
      }

      // Si un type de recherche a été détecté, prioriser cette catégorie
      if (searchType.priority && groupedResults.length > 1) {
        const priorityIndex = groupedResults.findIndex(
          group => group.category.toLowerCase().includes(searchType.type)
        );
        if (priorityIndex > 0) {
          const priorityGroup = groupedResults.splice(priorityIndex, 1)[0];
          groupedResults.unshift(priorityGroup);
        }
      }

      // Si aucun résultat, afficher l'historique et les tendances
      if (groupedResults.length === 0 && searchQuery.length >= 2) {
        const history = getSearchHistory();
        const topTrends = getTopTrends(3);
        
        if (history.length > 0) {
          groupedResults.push({
            category: 'Historique récent',
            items: history.slice(0, 3).map((h, idx) => ({
              id: `history-${idx}`,
              type: h.type || 'history',
              title: h.query,
              subtitle: h.data?.title || h.data?.nom_produit || '',
              meta: 'Recherche récente',
              isHistory: true,
              data: h.data,
            })),
          });
        }
        
        // Ajouter les suggestions de tendances si différentes de l'historique
        if (topTrends.length > 0) {
          const historyTerms = history.map(h => normalizeText(h.query));
          const uniqueTrends = topTrends.filter(t => !historyTerms.includes(normalizeText(t)));
          
          if (uniqueTrends.length > 0) {
            groupedResults.push({
              category: 'Suggestions populaires',
              items: uniqueTrends.slice(0, 3).map((trend, idx) => ({
                id: `trend-${idx}`,
                type: 'history',
                title: trend,
                subtitle: 'Recherche fréquente',
                meta: '🔥 Tendance',
                isHistory: true,
                data: null,
              })),
            });
          }
        }
      }

      // Sauvegarder dans le cache si des résultats ont été trouvés
      if (groupedResults.length > 0) {
        setCache(searchQuery, groupedResults);
      }

      setResults(groupedResults);
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError(err.message);
      setSearchError('Une erreur est survenue lors de la recherche');
      toast.error('Erreur de recherche. Veuillez réessayer.', {
        id: 'search-error',
        duration: 3000
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, getSearchHistory, getCachedResults, setCache, getTopTrends]);

  // Exécuter la recherche lorsque la query debounced change
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      // Afficher l'historique et les tendances si la recherche est vide
      const history = getSearchHistory();
      const topTrends = getTopTrends(3);
      const resultGroups = [];
      
      if (history.length > 0) {
        resultGroups.push({
          category: 'Recherches récentes',
          items: history.slice(0, 3).map((h, idx) => ({
            id: `history-${idx}`,
            type: h.type || 'history',
            title: h.query,
            subtitle: h.data?.title || h.data?.nom_produit || '',
            meta: 'Recherche récente',
            isHistory: true,
            data: h.data,
          })),
        });
      }
      
      // Ajouter les tendances populaires si différentes de l'historique
      if (topTrends.length > 0) {
        const historyTerms = history.map(h => normalizeText(h.query));
        const uniqueTrends = topTrends.filter(t => !historyTerms.includes(normalizeText(t)));
        
        if (uniqueTrends.length > 0) {
          resultGroups.push({
            category: 'Recherches populaires',
            items: uniqueTrends.slice(0, 3).map((trend, idx) => ({
              id: `trend-${idx}`,
              type: 'history',
              title: trend,
              subtitle: 'Recherche fréquente',
              meta: '🔥 Tendance',
              isHistory: true,
              data: null,
            })),
          });
        }
      }
      
      setResults(resultGroups);
      setSearchError(null);
    }
  }, [debouncedQuery, performSearch, getSearchHistory, getTopTrends]);

  return {
    results,
    loading,
    error,
    searchError,
    saveToHistory,
    clearHistory,
    clearCache,
    getSearchHistory,
    getTopTrends,
    updateTrends,
  };
};
