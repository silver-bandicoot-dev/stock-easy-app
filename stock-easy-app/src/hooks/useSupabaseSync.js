import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook pour synchroniser les données en temps réel avec Supabase
 * @param {Function} onDataChange - Callback appelé quand les données changent
 * @param {boolean} enabled - Active/désactive la sync
 */
export const useSupabaseSync = (onDataChange, enabled = true) => {
  useEffect(() => {
    if (!enabled || !onDataChange) return;

    console.log('🔄 Supabase Real-time: Démarrage des subscriptions');

    // S'abonner aux changements sur toutes les tables importantes
    const subscriptions = [];

    // Produits
    const productsSubscription = supabase
      .channel('products_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'produits' },
        (payload) => {
          console.log('📦 Produit changé:', payload);
          onDataChange();
        }
      )
      .subscribe();
    subscriptions.push(productsSubscription);

    // Commandes
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'commandes' },
        (payload) => {
          console.log('📋 Commande changée:', payload);
          onDataChange();
        }
      )
      .subscribe();
    subscriptions.push(ordersSubscription);

    // Articles de commande
    const orderItemsSubscription = supabase
      .channel('order_items_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'articles_commande' },
        (payload) => {
          console.log('📄 Article commande changé:', payload);
          onDataChange();
        }
      )
      .subscribe();
    subscriptions.push(orderItemsSubscription);

    // Fournisseurs
    const suppliersSubscription = supabase
      .channel('suppliers_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'fournisseurs' },
        (payload) => {
          console.log('🏭 Fournisseur changé:', payload);
          onDataChange();
        }
      )
      .subscribe();
    subscriptions.push(suppliersSubscription);

    // Warehouses
    const warehousesSubscription = supabase
      .channel('warehouses_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'warehouses' },
        (payload) => {
          console.log('🏢 Warehouse changé:', payload);
          onDataChange();
        }
      )
      .subscribe();
    subscriptions.push(warehousesSubscription);

    // Cleanup: se désabonner quand le composant se démonte
    return () => {
      console.log('🔄 Supabase Real-time: Arrêt des subscriptions');
      subscriptions.forEach(sub => {
        supabase.removeChannel(sub);
      });
    };
  }, [onDataChange, enabled]);
};

export default useSupabaseSync;

