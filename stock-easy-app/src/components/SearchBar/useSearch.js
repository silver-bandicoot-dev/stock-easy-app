import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { 
  normalizeText, 
  fuzzyMatch, 
  detectSearchType, 
  rankResults,
  buildSearchPattern,
  buildSearchPatterns,
  buildSmartQuery,
  calculateRelevanceScore
} from '../../utils/searchUtils';

const SEARCH_HISTORY_KEY = 'stock_easy_search_history';
const MAX_HISTORY_ITEMS = 3; // Limité à 3 recherches récentes

/**
 * Hook personnalisé pour la recherche intelligente avec autocomplétion
 * @param {string} query - Terme de recherche
 * @returns {Object} État et méthodes de recherche
 */
export const useSearch = (query) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debouncedQuery = useDebounce(query, 300);
  const { currentUser } = useAuth();

  // Récupérer l'historique de recherche depuis localStorage
  const getSearchHistory = useCallback(() => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err);
      return [];
    }
  }, []);

  // Sauvegarder un terme dans l'historique
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

      // Éviter les doublons (corrigé : utiliser AND au lieu de OR)
      const filteredHistory = history.filter(
        (item) => !(item.query === searchTerm && item.type === resultType)
      );

      const updatedHistory = [newEntry, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS); // Limité à 3
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (err) {
      console.error('Erreur lors de la sauvegarde dans l\'historique:', err);
    }
  }, [getSearchHistory]);

  // Effacer l'historique
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (err) {
      console.error('Erreur lors de l\'effacement de l\'historique:', err);
    }
  }, []);

  // Recherche dans la base de données Supabase
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    // Vérifier que l'utilisateur est authentifié
    if (!currentUser) {
      console.warn('🔍 SearchBar: Utilisateur non authentifié, recherche impossible');
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Normaliser la requête pour gérer les accents
      const normalizedQuery = normalizeText(searchQuery);
      
      // Construire des patterns optimisés via l'utilitaire
      const searchPatterns = buildSearchPatterns(searchQuery);
      
      // Détecter le type de recherche souhaité
      const searchType = detectSearchType(searchQuery);
      
      console.log('🔍 Recherche lancée:', {
        patterns: searchPatterns,
        query: searchQuery,
        normalized: normalizedQuery,
        detectedType: searchType,
        user: currentUser?.email
      });

      // Construire les requêtes selon le type détecté
      const promises = [];
      
      // Produits (recherche intelligente)
      // On inclut si type='product' ou type='all'
      if (!searchType.type || searchType.type === 'product' || searchType.type === 'all') {
        promises.push(
        supabase
          .from('produits')
          .select('sku, nom_produit, stock_actuel, fournisseur, prix_vente, image_url, prix_achat, health_status')
            .or(buildSmartQuery(
              ['sku', 'nom_produit', 'fournisseur'],
              searchPatterns
            ))
            .limit(20) // Augmenté à 20 pour avoir plus de candidats pour le scoring
        );
      } else {
        promises.push(Promise.resolve({ data: [], error: null })); // Placeholder pour garder l'index
      }

      // Fournisseurs
      if (!searchType.type || searchType.type === 'supplier' || searchType.type === 'all') {
        const supplierQuery = supabase
          .from('fournisseurs')
          .select('id, nom_fournisseur, email, lead_time_days, commercial_contact_phone, commercial_contact_email, notes')
          .or(buildSmartQuery(
            ['nom_fournisseur', 'email', 'commercial_contact_email'],
            searchPatterns
          ))
          .limit(10);
        
        promises.push(supplierQuery);
      } else {
        promises.push(Promise.resolve({ data: [], error: null }));
      }

      // Commandes
      if (!searchType.type || searchType.type === 'order' || searchType.type === 'all') {
        promises.push(
        supabase
          .from('commandes')
          .select('id, supplier, status, total, created_at, tracking_number, warehouse_id')
            .or(buildSmartQuery(
              ['id', 'supplier', 'tracking_number'],
              searchPatterns
            ))
          .order('created_at', { ascending: false })
            .limit(10)
        );
      } else {
        promises.push(Promise.resolve({ data: [], error: null }));
      }

      // Entrepôts
      if (!searchType.type || searchType.type === 'warehouse' || searchType.type === 'all') {
        promises.push(
        supabase
          .from('warehouses')
          .select('id, name, address, city, country, postal_code, notes')
            .or(buildSmartQuery(
              ['name', 'city', 'address'],
              searchPatterns
            ))
            .limit(5)
        );
      } else {
        promises.push(Promise.resolve({ data: [], error: null }));
      }

      const results = await Promise.all(promises);
      
      // Gestion des erreurs
      results.forEach((res, index) => {
        if (res.error) {
          console.error(`Erreur recherche ${index}:`, res.error);
        }
      });
      
      console.log('🔍 Résultats bruts Supabase:', {
        totalResults: results.length,
        results: results.map((r, i) => ({
          index: i,
          count: r.data?.length || 0,
          error: r.error?.message,
          sampleData: r.data?.slice(0, 2) // Aperçu des données
        }))
      });
      
      // Extraire les résultats selon le type de recherche
      let resultIndex = 0;
      let produitsRes = results[resultIndex++];
      let fournisseursRes = results[resultIndex++];
      let commandesRes = results[resultIndex++];
      let warehousesRes = results[resultIndex++];

      // Structurer les résultats par catégorie avec filtrage fuzzy
      const groupedResults = [];

      // Filtrer et trier les produits par pertinence avec le nouveau scoring
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
            _relevanceScore: calculateRelevanceScore(searchQuery, p, 'product')
          }))
          .filter(item => item._relevanceScore > 0)
          .sort((a, b) => b._relevanceScore - a._relevanceScore)
          .slice(0, 10); // Augmenté à 10 pour meilleure couverture

        if (products.length > 0) {
        groupedResults.push({
            category: 'Produits',
            items: products
          });
        }
      }

      // Filtrer et trier les fournisseurs par pertinence avec le nouveau scoring
      if (fournisseursRes?.data && fournisseursRes.data.length > 0) {
        const suppliers = fournisseursRes.data
          .map(f => {
            const score = calculateRelevanceScore(searchQuery, f, 'supplier');
            const normalizedName = normalizeText(f.nom_fournisseur || '');
            const normalizedQuery = normalizeText(searchQuery);
            const matchesName = normalizedName.includes(normalizedQuery);
            
            return {
              id: f.id,
              type: 'supplier',
              title: f.nom_fournisseur,
              subtitle: f.email || f.commercial_contact_email || 'Pas de contact',
              meta: `Lead time: ${f.lead_time_days || 14} jours${f.commercial_contact_phone ? ` • ${f.commercial_contact_phone}` : ''}`,
              data: f,
              _relevanceScore: score > 0 ? score : (matchesName ? 10 : 0) // Fallback pour correspondance partielle
            };
          })
          .filter(item => item._relevanceScore > 0)
          .sort((a, b) => b._relevanceScore - a._relevanceScore)
          .slice(0, 5);

        if (suppliers.length > 0) {
        groupedResults.push({
            category: 'Fournisseurs',
            items: suppliers
          });
        }
      }

      // Filtrer et trier les commandes par pertinence avec le nouveau scoring
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
              _relevanceScore: calculateRelevanceScore(searchQuery, c, 'order')
            };
          })
          .filter(item => item._relevanceScore > 0)
          .sort((a, b) => b._relevanceScore - a._relevanceScore)
          .slice(0, 5);

        if (orders.length > 0) {
          groupedResults.push({
            category: 'Commandes',
            items: orders
        });
        }
      }

      // Filtrer et trier les entrepôts par pertinence avec le nouveau scoring
      if (warehousesRes?.data && warehousesRes.data.length > 0) {
        const warehouses = warehousesRes.data
          .map(w => ({
            id: w.id,
            type: 'warehouse',
            title: w.name,
            subtitle: `${w.city || 'Localisation non définie'}${w.address ? ` • ${w.address}` : ''}`,
            meta: `${w.country || 'France'}${w.postal_code ? ` • ${w.postal_code}` : ''}`,
            data: w,
            _relevanceScore: calculateRelevanceScore(searchQuery, w, 'warehouse')
          }))
          .filter(item => item._relevanceScore > 0)
          .sort((a, b) => b._relevanceScore - a._relevanceScore)
          .slice(0, 3);

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

      // Si aucun résultat, afficher l'historique (limité à 3)
      if (groupedResults.length === 0 && searchQuery.length >= 2) {
        const history = getSearchHistory();
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
      }

      setResults(groupedResults);
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, getSearchHistory]);

  // Exécuter la recherche lorsque la query debounced change
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      // Afficher l'historique si la recherche est vide (limité à 3)
      const history = getSearchHistory();
      if (history.length > 0) {
        setResults([
          {
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
          },
        ]);
      } else {
        setResults([]);
      }
    }
  }, [debouncedQuery, performSearch, getSearchHistory]);

  return {
    results,
    loading,
    error,
    saveToHistory,
    clearHistory,
    getSearchHistory,
  };
};
