import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook pour synchroniser les données en temps réel avec Supabase
 * Système de synchronisation globale qui écoute TOUS les changements importants
 * @param {Function} onDataChange - Callback appelé quand les données changent
 * @param {boolean} enabled - Active/désactive la sync
 */
export const useSupabaseSync = (onDataChange, enabled = true) => {
  const onDataChangeRef = useRef(onDataChange);
  
  // Mettre à jour la référence du callback
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    if (!enabled || !onDataChange) return;

    console.log('🔄 Supabase Real-time: Démarrage des subscriptions complètes');

    // S'abonner aux changements sur toutes les tables importantes
    const subscriptions = [];

    // Produits - Changements critiques pour ML, analytics, dashboard
    const productsSubscription = supabase
      .channel('products_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'produits' },
        (payload) => {
          console.log('📦 Produit changé:', payload.eventType, payload.new?.sku || payload.old?.sku);
          onDataChangeRef.current?.();
        }
      )
      .subscribe();
    subscriptions.push(productsSubscription);

    // Commandes - Impact sur analytics et dashboard
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'commandes' },
        (payload) => {
          console.log('📋 Commande changée:', payload.eventType, payload.new?.id || payload.old?.id);
          onDataChangeRef.current?.();
        }
      )
      .subscribe();
    subscriptions.push(ordersSubscription);

    // Articles de commande - Impact sur les calculs de stock
    const orderItemsSubscription = supabase
      .channel('order_items_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'articles_commande' },
        (payload) => {
          console.log('📄 Article commande changé:', payload.eventType);
          onDataChangeRef.current?.();
        }
      )
      .subscribe();
    subscriptions.push(orderItemsSubscription);

    // Fournisseurs - Changements de MOQ, leadTimeDays, etc.
    const suppliersSubscription = supabase
      .channel('suppliers_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'fournisseurs' },
        (payload) => {
          console.log('🏭 Fournisseur changé:', payload.eventType, payload.new?.name || payload.old?.name);
          // Les changements de fournisseur impactent les produits (MOQ, leadTimeDays)
          onDataChangeRef.current?.();
        }
      )
      .subscribe();
    subscriptions.push(suppliersSubscription);

    // Warehouses - Impact sur les commandes et stock
    const warehousesSubscription = supabase
      .channel('warehouses_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'warehouses' },
        (payload) => {
          console.log('🏢 Warehouse changé:', payload.eventType, payload.new?.name || payload.old?.name);
          onDataChangeRef.current?.();
        }
      )
      .subscribe();
    subscriptions.push(warehousesSubscription);

    // Sales History - CRITIQUE pour ventes_jour_moy_30j, rotation, ML
    const salesHistorySubscription = supabase
      .channel('sales_history_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sales_history' },
        (payload) => {
          console.log('💰 Historique de ventes changé:', payload.eventType, payload.new?.sku || payload.old?.sku);
          // Les ventes impactent directement ventes_jour_moy_30j, rotation, analytics, ML
          onDataChangeRef.current?.();
        }
      )
      .subscribe();
    subscriptions.push(salesHistorySubscription);

    // Paramètres - CRITIQUE pour tous les calculs (multiplicateur, seuils, etc.)
    const parametersSubscription = supabase
      .channel('parameters_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'parametres' },
        (payload) => {
          console.log('⚙️ Paramètre changé:', payload.eventType, payload.new?.param_name || payload.old?.param_name);
          // Les paramètres impactent ventes_jour_ajustees, tous les calculs, ML
          onDataChangeRef.current?.();
        }
      )
      .subscribe();
    subscriptions.push(parametersSubscription);

    // Cleanup: se désabonner quand le composant se démonte
    return () => {
      console.log('🔄 Supabase Real-time: Arrêt des subscriptions');
      subscriptions.forEach(sub => {
        supabase.removeChannel(sub);
      });
    };
  }, [enabled]);
};

export default useSupabaseSync;

