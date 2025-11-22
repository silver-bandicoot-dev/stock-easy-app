import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';

interface StockEasyProduct {
  sku: string;
  name: string;
  stock: number;
  price: number;
}

export class StockEasyService {
  private supabase: SupabaseClient;

  constructor() {
    if (!config.stockEasy.supabaseUrl || !config.stockEasy.supabaseServiceRoleKey) {
      throw new Error('Supabase configuration missing');
    }
    
    // Utilisation de la Service Role Key pour contourner les RLS policies
    // car le connecteur est un service backend de confiance
    this.supabase = createClient(
      config.stockEasy.supabaseUrl,
      config.stockEasy.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  /**
   * Envoie une mise à jour de produit vers StockEasy (Table produits)
   */
  async syncProductFromShopify(companyId: string, product: Partial<StockEasyProduct>) {
    logger.info(`Syncing product ${product.sku} to StockEasy (Company: ${companyId})`);
    
    // Upsert dans la table produits
    const { data, error } = await this.supabase
      .from('produits')
      .upsert({
        sku: product.sku,
        company_id: companyId,
        nom: product.name,
        stock_actuel: product.stock,
        prix_vente: product.price,
        // On ne touche pas aux autres champs qui sont gérés dans StockEasy
      }, { onConflict: 'sku,company_id' })
      .select();

    if (error) {
      logger.error('Error syncing product to Supabase', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Envoie une mise à jour d'inventaire vers StockEasy
   */
  async updateInventory(companyId: string, sku: string, quantity: number) {
    logger.info(`Updating inventory for ${sku} in StockEasy: ${quantity}`);
    
    const { data, error } = await this.supabase
      .from('produits')
      .update({ stock_actuel: quantity })
      .eq('sku', sku)
      .eq('company_id', companyId)
      .select();

    if (error) {
      logger.error('Error updating inventory in Supabase', error);
      throw error;
    }

    return data;
  }

  /**
   * Enregistre une commande dans l'historique des ventes (sales_history)
   */
  async processOrder(companyId: string, orderData: any) {
    logger.info(`Processing order in StockEasy (Sales History)`);
    
    const salesRecords = orderData.lineItems.map((item: any) => ({
      company_id: companyId,
      sku: item.sku,
      sale_date: new Date().toISOString().split('T')[0], // Date du jour YYYY-MM-DD
      quantity: item.quantity,
      revenue: item.price * item.quantity,
      source: 'shopify',
      metadata: {
        shopify_order_id: orderData.shopifyOrderId,
        shopify_variant_id: item.variantId
      }
    }));

    const { data, error } = await this.supabase
      .from('sales_history')
      .insert(salesRecords)
      .select();

    if (error) {
      logger.error('Error inserting sales history in Supabase', error);
      throw error;
    }

    // Décrémenter le stock (Optionnel si inventory_levels/update webhook arrive aussi)
    // Mais plus sûr de le faire ici pour l'atomicité
    // Note: Supabase n'a pas de transaction multi-table simple via JS client, 
    // donc on laisse le webhook inventory faire son travail ou on utilise une RPC.
    
    return data;
  }
}
