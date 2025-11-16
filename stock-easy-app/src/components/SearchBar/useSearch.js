import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/SupabaseAuthContext';

const SEARCH_HISTORY_KEY = 'stock_easy_search_history';
const MAX_HISTORY_ITEMS = 10;

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

      // Éviter les doublons
      const filteredHistory = history.filter(
        (item) => item.query !== searchTerm || item.type !== resultType
      );

      const updatedHistory = [newEntry, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
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
      const searchPattern = `%${searchQuery}%`;
      
      console.log('🔍 Recherche lancée:', {
        pattern: searchPattern,
        query: searchQuery,
        user: currentUser?.email
      });

      // Recherche parallèle dans produits, fournisseurs, commandes et entrepôts
      const [produitsRes, fournisseursRes, commandesRes, warehousesRes] = await Promise.all([
        // Recherche ÉLARGIE dans les produits (SKU, nom, fournisseur, catégorie)
        supabase
          .from('produits')
          .select('sku, nom_produit, stock_actuel, fournisseur, prix_vente, image_url, prix_achat, categorie, health_status')
          .or(`sku.ilike.${searchPattern},nom_produit.ilike.${searchPattern},fournisseur.ilike.${searchPattern},categorie.ilike.${searchPattern}`)
          .limit(10), // Augmenté de 5 à 10

        // Recherche ÉLARGIE dans les fournisseurs (nom, email, téléphone)
        supabase
          .from('fournisseurs')
          .select('id, nom_fournisseur, email, lead_time_days, telephone, adresse')
          .or(`nom_fournisseur.ilike.${searchPattern},email.ilike.${searchPattern},telephone.ilike.${searchPattern}`)
          .limit(5), // Augmenté de 3 à 5

        // Recherche ÉLARGIE dans les commandes (ID, fournisseur, statut, numéro de suivi)
        supabase
          .from('commandes')
          .select('id, supplier, status, total, created_at, tracking_number, warehouse_name')
          .or(`id.ilike.${searchPattern},supplier.ilike.${searchPattern},tracking_number.ilike.${searchPattern},warehouse_name.ilike.${searchPattern}`)
          .order('created_at', { ascending: false })
          .limit(5), // Augmenté de 3 à 5

        // Recherche dans les ENTREPÔTS ⭐ NOUVEAU
        supabase
          .from('warehouses')
          .select('id, name, location, address, city, country, capacity, notes')
          .or(`name.ilike.${searchPattern},location.ilike.${searchPattern},address.ilike.${searchPattern},city.ilike.${searchPattern}`)
          .limit(3),
      ]);
      
      console.log('🔍 Résultats bruts Supabase:', {
        produits: {
          count: produitsRes.data?.length || 0,
          data: produitsRes.data,
          error: produitsRes.error
        },
        fournisseurs: {
          count: fournisseursRes.data?.length || 0,
          data: fournisseursRes.data,
          error: fournisseursRes.error
        },
        commandes: {
          count: commandesRes.data?.length || 0,
          data: commandesRes.data,
          error: commandesRes.error
        },
        entrepots: {
          count: warehousesRes.data?.length || 0,
          data: warehousesRes.data,
          error: warehousesRes.error
        }
      });

      // Gestion des erreurs individuelles
      if (produitsRes.error) throw produitsRes.error;
      if (fournisseursRes.error) throw fournisseursRes.error;
      if (commandesRes.error) throw commandesRes.error;
      if (warehousesRes.error) throw warehousesRes.error;

      // Structurer les résultats par catégorie
      const groupedResults = [];

      if (produitsRes.data && produitsRes.data.length > 0) {
        groupedResults.push({
          category: 'Produits',
          items: produitsRes.data.map((p) => ({
            id: p.sku,
            type: 'product',
            title: p.nom_produit,
            subtitle: `SKU: ${p.sku} • Stock: ${p.stock_actuel || 0}${p.prix_vente ? ` • ${p.prix_vente.toFixed(2)}€` : ''}`,
            meta: p.fournisseur || 'Pas de fournisseur',
            image: p.image_url,
            healthStatus: p.health_status,
            data: p,
          })),
        });
      }

      if (fournisseursRes.data && fournisseursRes.data.length > 0) {
        groupedResults.push({
          category: 'Fournisseurs',
          items: fournisseursRes.data.map((f) => ({
            id: f.id,
            type: 'supplier',
            title: f.nom_fournisseur,
            subtitle: f.email || f.telephone || 'Pas de contact',
            meta: `Lead time: ${f.lead_time_days || 14} jours${f.adresse ? ` • ${f.adresse}` : ''}`,
            data: f,
          })),
        });
      }

      if (commandesRes.data && commandesRes.data.length > 0) {
        groupedResults.push({
          category: 'Commandes',
          items: commandesRes.data.map((c) => {
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
              meta: `${statusLabel}${c.total ? ` • ${c.total.toFixed(2)}€` : ''}${c.warehouse_name ? ` • ${c.warehouse_name}` : ''}`,
              data: c,
            };
          }),
        });
      }

      // Résultats ENTREPÔTS ⭐ NOUVEAU
      if (warehousesRes.data && warehousesRes.data.length > 0) {
        groupedResults.push({
          category: 'Entrepôts',
          items: warehousesRes.data.map((w) => ({
            id: w.id,
            type: 'warehouse',
            title: w.name,
            subtitle: `${w.city || w.location || 'Localisation non définie'}${w.address ? ` • ${w.address}` : ''}`,
            meta: `${w.country || 'France'}${w.capacity ? ` • Capacité: ${w.capacity} unités` : ''}`,
            data: w,
          })),
        });
      }

      // Si aucun résultat, afficher l'historique
      if (groupedResults.length === 0 && searchQuery.length >= 2) {
        const history = getSearchHistory();
        if (history.length > 0) {
          groupedResults.push({
            category: 'Historique récent',
            items: history.slice(0, 5).map((h, idx) => ({
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
      // Afficher l'historique si la recherche est vide
      const history = getSearchHistory();
      if (history.length > 0) {
        setResults([
          {
            category: 'Recherches récentes',
            items: history.slice(0, 5).map((h, idx) => ({
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

