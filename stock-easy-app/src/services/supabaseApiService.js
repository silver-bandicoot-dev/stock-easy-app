import { supabase } from '../lib/supabaseClient';
import { invalidateCache } from './cacheService';

// Fonction utilitaire pour convertir snake_case en camelCase
const snakeToCamel = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (typeof obj !== 'object') return obj;

  const newObj = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    newObj[camelKey] = snakeToCamel(obj[key]);
  }
  return newObj;
};

// Récupérer toutes les données
export async function getAllData() {
  try {
    const { data, error } = await supabase.rpc('get_all_data');
    
    if (error) {
      console.error('❌ Erreur Supabase RPC get_all_data:', error);
      throw error;
    }

    console.log('✅ Données Supabase chargées:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données:', error);
    throw error;
  }
}

export async function getSalesHistory({ sku, startDate, endDate } = {}) {
  try {
    const payload = {};

    if (sku) {
      payload.p_sku = sku;
    }
    if (startDate) {
      payload.p_start_date = formatDateForRpc(startDate);
    }
    if (endDate) {
      payload.p_end_date = formatDateForRpc(endDate);
    }

    const { data, error } = await supabase.rpc('get_sales_history', payload);

    if (error) {
      console.error('❌ Erreur Supabase get_sales_history:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Erreur lors du chargement de l’historique des ventes:', error);
    throw error;
  }
}

// Créer une commande
export async function createOrder(orderData) {
  try {
    const payload = {
      p_order_id: orderData.id,
      p_supplier: orderData.supplier,
      p_warehouse_id: orderData.warehouseId,
      p_items: orderData.items.map(item => ({
        sku: item.sku,
        quantity: Number(item.quantity ?? 0),
        pricePerUnit: Number(item.pricePerUnit ?? 0)
      })),
      p_notes: orderData.notes || null
    };

    console.log('🧾 createOrder payload', payload);

    const { data, error } = await supabase.rpc('create_order', payload);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur création commande:', error);
    return { success: false, error: error.message };
  }
}
// Mettre à jour le statut d'une commande
const toTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    // Si c'est une date formatée sans heure, ajouter l'heure par défaut
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value}T00:00:00Z`;
    }
    return value;
  }
  return null;
};

export async function updateOrderStatus(orderId, updates = {}) {
  try {
    const payload = {
      p_order_id: orderId,
      p_status: updates.status || null,
      p_confirmed_at: toTimestamp(updates.confirmedAt || updates.confirmed_at),
      p_shipped_at: toTimestamp(updates.shippedAt || updates.shipped_at),
      p_received_at: toTimestamp(updates.receivedAt || updates.received_at),
      p_completed_at: toTimestamp(updates.completedAt || updates.completed_at),
      p_tracking_number: updates.trackingNumber || updates.tracking_number || null,
      p_tracking_url: updates.trackingUrl || updates.tracking_url || null,
      p_eta: toTimestamp(updates.eta || updates.estimatedArrival || updates.estimated_arrival),
      p_notes: updates.notes || null
    };

    console.log('🚚 updateOrderStatus payload', payload);

    const { data, error } = await supabase.rpc('update_order_status', payload);

    if (error) throw error;
    
    // Si des données de réconciliation sont fournies, les mettre à jour séparément
    console.log('🔍 Vérification données réconciliation:', {
      missingQuantitiesBySku: updates.missingQuantitiesBySku,
      damagedQuantitiesBySku: updates.damagedQuantitiesBySku,
      items: updates.items
    });
    
    if (updates.missingQuantitiesBySku || updates.damagedQuantitiesBySku || updates.items) {
      const reconciliationUpdate = {};
      
      // Calculer explicitement les totaux pour garantir qu'ils sont toujours corrects
      let missingQuantityTotal = 0;
      let damagedQuantityTotal = 0;
      
      if (updates.missingQuantitiesBySku) {
        reconciliationUpdate.missing_quantities_by_sku = updates.missingQuantitiesBySku;
        // Calculer le total des quantités manquantes
        Object.values(updates.missingQuantitiesBySku).forEach(qty => {
          missingQuantityTotal += Number(qty) || 0;
        });
      }
      
      if (updates.damagedQuantitiesBySku) {
        reconciliationUpdate.damaged_quantities_by_sku = updates.damagedQuantitiesBySku;
        // Calculer le total des quantités endommagées
        Object.values(updates.damagedQuantitiesBySku).forEach(qty => {
          damagedQuantityTotal += Number(qty) || 0;
        });
      }
      
      // Inclure les totaux calculés dans la mise à jour
      reconciliationUpdate.missing_quantity_total = missingQuantityTotal;
      reconciliationUpdate.damaged_quantity_total = damagedQuantityTotal;
      
      // Note: Les items ne sont pas stockés dans la table commandes mais dans articles_commande
      // Ils seront mis à jour via la fonction update_order_items_reconciliation ci-dessous
      
      console.log('📤 Envoi mise à jour réconciliation:', reconciliationUpdate);
      console.log('📊 Totaux calculés:', { missingQuantityTotal, damagedQuantityTotal });
      
      // Mettre à jour les colonnes de réconciliation dans la table commandes
      // (sans la colonne items qui n'existe pas - les items sont dans articles_commande)
      const { data: updateData, error: updateError } = await supabase
        .from('commandes')
        .update(reconciliationUpdate)
        .eq('id', orderId)
        .select();
      
      if (updateError) {
        console.error('❌ Erreur mise à jour données réconciliation:', updateError);
      } else {
        console.log('✅ Données de réconciliation mises à jour:', updateData);
      }
      
      // Mettre à jour les articles_commande avec les données de réconciliation
      if (updates.items && Array.isArray(updates.items) && updates.items.length > 0) {
        console.log('📦 Mise à jour des articles_commande avec les données de réconciliation');
        
        // Convertir les items en format JSONB pour la fonction SQL
        const itemsJsonb = updates.items.map(item => {
          // Calculer discrepancyQuantity si non fourni
          const receivedQty = item.receivedQuantity !== undefined ? item.receivedQuantity : 0;
          const damagedQty = item.damagedQuantity !== undefined ? item.damagedQuantity : 0;
          const orderedQty = item.quantity || 0;
          const totalReceived = receivedQty + damagedQty;
          const calculatedDiscrepancyQty = orderedQty - totalReceived;
          
          // Déterminer discrepancyType si non fourni
          let discrepancyType = item.discrepancyType;
          if (!discrepancyType) {
            if (calculatedDiscrepancyQty > 0 && damagedQty > 0) {
              discrepancyType = 'missing_and_damaged';
            } else if (calculatedDiscrepancyQty > 0) {
              discrepancyType = 'missing';
            } else if (damagedQty > 0) {
              discrepancyType = 'damaged';
            } else {
              discrepancyType = 'none';
            }
          }
          
          return {
            sku: item.sku,
            receivedQuantity: receivedQty,
            damagedQuantity: damagedQty,
            discrepancyType: discrepancyType,
            discrepancyQuantity: item.discrepancyQuantity !== undefined ? item.discrepancyQuantity : calculatedDiscrepancyQty,
            discrepancyNotes: item.discrepancyNotes || null
          };
        });
        
        const { data: itemsUpdateData, error: itemsUpdateError } = await supabase.rpc(
          'update_order_items_reconciliation',
          {
            p_order_id: orderId,
            p_items: itemsJsonb
          }
        );
        
        if (itemsUpdateError) {
          console.error('❌ Erreur mise à jour articles_commande:', itemsUpdateError);
        } else {
          console.log('✅ Articles_commande mis à jour:', itemsUpdateData);
        }
      }
    } else {
      console.log('⚠️ Aucune donnée de réconciliation à enregistrer');
    }
    
    // Invalider le cache après modification du statut de commande
    invalidateCache(['orders', 'allData']);
    console.log('🔄 Cache invalidé après mise à jour commande');
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    return { success: false, error: error.message };
  }
}

// Traiter la réconciliation d'une commande
export async function processOrderReconciliation(orderId, receivedItems, damages) {
  try {
    // Transformer les données pour correspondre au format attendu par la RPC
    const items = receivedItems.map(item => {
      const damage = damages.find(d => d.sku === item.sku);
      return {
        sku: item.sku,
        quantity_ordered: item.quantityOrdered,
        quantity_received: item.quantityReceived,
        quantity_damaged: damage ? damage.quantity : 0,
        damage_reason: damage ? damage.reason : null
      };
    });

    const { data, error } = await supabase.rpc('process_order_reconciliation', {
      p_order_id: orderId,
      p_items: items
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur réconciliation:', error);
    return { success: false, error: error.message };
  }
}

// Mettre à jour le stock
export async function updateStock(updates) {
  try {
    const itemsArray = Array.isArray(updates) ? updates : [updates];
    const payload = itemsArray
      .filter(Boolean)
      .map(item => ({
        sku: item.sku || item.SKU || item.productSku,
        quantityToAdd: Number(item.quantityToAdd ?? item.quantity ?? item.newQuantity ?? 0)
      }))
      .filter(item => item.sku);

    if (payload.length === 0) {
      return { success: false, error: 'Aucun item valide pour updateStock' };
    }

    const { data, error } = await supabase.rpc('update_stock', {
      p_items: payload
    });

    if (error) throw error;
    return { success: true, data: data ?? { updatedCount: payload.length } };
  } catch (error) {
    console.error('❌ Erreur mise à jour stock:', error);
    return { success: false, error: error.message };
  }
}

// Mettre à jour un produit
export async function updateProduct(sku, updates) {
  try {
    const { data, error } = await supabase.rpc('update_product', {
      // D'après l'erreur PGRST202, la fonction attend (p_data, p_sku)
      p_data: updates || {},
      p_sku: sku
    });

    if (error) {
      console.error('❌ Erreur Supabase RPC update_product:', error);
      return { success: false, error: error.message || 'Erreur RPC update_product' };
    }

    // Certaines implémentations de update_product retournent un JSON { success, message, product }
    if (data && typeof data === 'object' && data.success === false) {
      console.error('❌ Erreur logique update_product (payload):', data);
      return { success: false, error: data.message || data.error || 'Erreur logique update_product' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur mise à jour produit:', error);
    return { success: false, error: error.message };
  }
}

// Synchroniser le MOQ d'un produit depuis son fournisseur principal
// Utilise la fonction SQL public.sync_moq_from_supplier(p_sku, p_supplier, p_override)
export async function syncProductMoqFromSupplier(sku, supplierName, override = false) {
  try {
    if (!sku || !supplierName) {
      return {
        success: false,
        error: 'SKU et fournisseur sont requis pour synchroniser le MOQ'
      };
    }

    const { data, error } = await supabase.rpc('sync_moq_from_supplier', {
      p_sku: sku,
      p_supplier: supplierName,
      p_override: override
    });

    if (error) throw error;

    if (data && data.success === false) {
      return { success: false, error: data.message || 'Erreur lors de la synchronisation du MOQ' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur synchronisation MOQ produit depuis fournisseur:', error);
    return { success: false, error: error.message };
  }
}

// Gestion des fournisseurs
export async function createSupplier(supplierData) {
  try {
    const { data, error } = await supabase
      .from('fournisseurs')
      .insert({
        nom_fournisseur: supplierData.name,
        email: supplierData.email,
        lead_time_days: Number(supplierData.leadTimeDays) || 0,
        moq_standard: Number(supplierData.moq) || 0,
        notes: supplierData.notes ?? null,
        commercial_contact_name: supplierData.commercialContactName || null,
        commercial_contact_email: supplierData.commercialContactEmail || null,
        commercial_contact_phone: supplierData.commercialContactPhone || null,
        reclamation_contact_name: supplierData.reclamationContactName || null,
        reclamation_contact_email: supplierData.reclamationContactEmail || null,
        reclamation_contact_phone: supplierData.reclamationContactPhone || null,
        reclamation_contact_role: supplierData.reclamationContactRole || null,
        contact_notes: supplierData.contactNotes || null
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur création fournisseur:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSupplier(supplierId, updates) {
  try {
    const { data, error } = await supabase
      .from('fournisseurs')
      .update({
        email: updates.email,
        lead_time_days: Number(updates.leadTimeDays) || 0,
        moq_standard: Number(updates.moq) || 0,
        notes: updates.notes ?? null,
        commercial_contact_name: updates.commercialContactName || null,
        commercial_contact_email: updates.commercialContactEmail || null,
        commercial_contact_phone: updates.commercialContactPhone || null,
        reclamation_contact_name: updates.reclamationContactName || null,
        reclamation_contact_email: updates.reclamationContactEmail || null,
        reclamation_contact_phone: updates.reclamationContactPhone || null,
        reclamation_contact_role: updates.reclamationContactRole || null,
        contact_notes: updates.contactNotes || null
      })
      .eq('id', supplierId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur mise à jour fournisseur:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSupplier(supplierId) {
  try {
    const { data, error } = await supabase
      .from('fournisseurs')
      .delete()
      .eq('id', supplierId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur suppression fournisseur:', error);
    return { success: false, error: error.message };
  }
}

// Gestion des entrepôts
export async function createWarehouse(warehouseData) {
  try {
    const { data, error } = await supabase.rpc('create_warehouse', {
      p_name: warehouseData.name,
      p_address: warehouseData.address || null,
      p_city: warehouseData.city || null,
      p_postal_code: warehouseData.postalCode || null,
      p_country: warehouseData.country || 'France',
      p_notes: warehouseData.notes || null
    });

    if (error) {
      console.error('❌ Erreur Supabase createWarehouse:', error);
      return { success: false, error: error.message || 'Erreur RPC create_warehouse' };
    }

    // Vérifier si la fonction RPC a retourné une erreur dans data
    if (data && typeof data === 'object' && data.success === false) {
      console.error('❌ Erreur logique createWarehouse:', data);
      return { success: false, error: data.error || 'Échec de la création de l\'entrepôt' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur création entrepôt:', error);
    return { success: false, error: error.message || 'Erreur inconnue createWarehouse' };
  }
}

export async function updateWarehouse(warehouseId, updates) {
  try {
    const { data, error } = await supabase.rpc('update_warehouse', {
      p_warehouse_id: warehouseId,
      p_name: updates.name || null,
      p_address: updates.address || null,
      p_city: updates.city || null,
      p_postal_code: updates.postalCode || null,
      p_country: updates.country || null,
      p_notes: updates.notes || null
    });

    if (error) {
      console.error('❌ Erreur Supabase updateWarehouse:', error);
      return { success: false, error: error.message || 'Erreur RPC update_warehouse' };
    }

    // Vérifier si la fonction RPC a retourné une erreur dans data
    if (data && typeof data === 'object' && data.success === false) {
      console.error('❌ Erreur logique updateWarehouse:', data);
      return { success: false, error: data.error || 'Échec de la mise à jour de l\'entrepôt' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur mise à jour entrepôt:', error);
    return { success: false, error: error.message || 'Erreur inconnue updateWarehouse' };
  }
}

export async function deleteWarehouse(warehouseId) {
  try {
    const { data, error } = await supabase.rpc('delete_warehouse', {
      p_warehouse_id: warehouseId
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur suppression entrepôt:', error);
    return { success: false, error: error.message };
  }
}

// Sauvegarder un snapshot KPI
export async function saveKPISnapshot(kpiData) {
  try {
    const { data, error } = await supabase.rpc('save_kpi_snapshot', {
      p_kpi_data: kpiData
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur sauvegarde KPI:', error);
    return { success: false, error: error.message };
  }
}

// Mettre à jour un paramètre général
export async function updateParameter(paramName, paramValue) {
  try {
    console.log(`🔧 updateParameter appelé: ${paramName} = ${paramValue}`);
    
    const { data, error } = await supabase.rpc('update_parameter', {
      p_param_name: paramName,
      p_value: String(paramValue)
    });

    if (error) {
      console.error('❌ Erreur Supabase updateParameter:', error);
      return { success: false, error: error.message || 'Erreur RPC update_parameter', data: null };
    }

    if (!data || (typeof data === 'object' && data.success === false)) {
      const message = (data && (data.message || data.error)) || 'Mise à jour du paramètre échouée';
      console.error('❌ Erreur logique updateParameter:', data);
      return { success: false, error: message, data };
    }

    const expectedValue = String(paramValue);
    const { data: verificationRows, error: verificationError } = await supabase
      .from('parametres')
      .select('nom_parametre, valeur, company_id, updated_at')
      .eq('nom_parametre', paramName)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (verificationError) {
      console.error('⚠️ Impossible de vérifier le paramètre après mise à jour:', verificationError);
      return { success: true, data, verification: null };
    }

    const latestRow = verificationRows?.[0];
    const matches = latestRow?.valeur === expectedValue;

    if (!matches) {
      console.error('❌ La valeur vérifiée ne correspond pas à la valeur attendue', {
        paramName,
        expectedValue,
        latestRow
      });
      return {
        success: false,
        error: `La valeur '${latestRow?.valeur ?? 'null'}' ne correspond pas à '${expectedValue}'`,
        data,
        verification: latestRow
      };
    }

    console.log('✅ Paramètre mis à jour dans Supabase:', {
      rpc: data,
      verification: latestRow
    });

    return { success: true, data, verification: latestRow };
  } catch (error) {
    console.error('❌ Erreur mise à jour paramètre:', error);
    return { success: false, error: error.message || 'Erreur inconnue updateParameter' };
  }
}

// Confirmer la réconciliation d'une commande
export async function confirmOrderReconciliation(orderId) {
  try {
    console.log('🔒 Confirmation réconciliation pour commande:', orderId);

    const { data, error } = await supabase.rpc('confirm_order_reconciliation', {
      p_order_id: orderId
    });

    if (error) {
      console.error('❌ Erreur Supabase confirmOrderReconciliation:', error);
      throw error;
    }
    
    console.log('✅ Réconciliation confirmée:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur confirmation réconciliation:', error);
    return { success: false, error: error.message };
  }
}

// Recalculer l'investissement pour tous les produits
export async function recalculateAllInvestments() {
  try {
    console.log('🔄 Recalcul de l\'investissement pour tous les produits...');

    const { data, error } = await supabase.rpc('recalculate_all_investments');

    if (error) {
      console.error('❌ Erreur Supabase recalculateAllInvestments:', error);
      throw error;
    }
    
    console.log('✅ Investissements recalculés:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur recalcul investissement:', error);
    return { success: false, error: error.message };
  }
}

export async function assignSupplierToProduct(sku, supplierName) {
  try {
    const { data, error } = await supabase.rpc('assign_supplier_to_product', {
      p_sku: sku,
      p_supplier_name: supplierName
    });

    if (error) throw error;
    
    // Vérifier si la fonction RPC a retourné une erreur dans le JSON
    if (data && !data.success) {
      const errorMessage = data.error || 'Erreur lors de l\'assignation du fournisseur';
      throw new Error(errorMessage);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur assignation fournisseur:', error);
    // S'assurer qu'on lance toujours une Error avec un message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(error?.message || 'Erreur lors de l\'assignation du fournisseur');
  }
}

export async function removeSupplierFromProduct(sku, supplierName) {
  try {
    const { data, error } = await supabase.rpc('remove_supplier_from_product', {
      p_sku: sku,
      p_supplier_name: supplierName
    });

    if (error) throw error;
    
    // Vérifier si la fonction RPC a retourné une erreur dans le JSON
    if (data && !data.success) {
      const errorMessage = data.error || 'Erreur lors du retrait du fournisseur';
      throw new Error(errorMessage);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur retrait fournisseur du produit:', error);
    // S'assurer qu'on lance toujours une Error avec un message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(error?.message || 'Erreur lors du retrait du fournisseur');
  }
}

// Récupérer les commandes paginées
export async function getOrdersPaginated({ page = 1, pageSize = 20, status, supplier, startDate, endDate, search } = {}) {
  try {
    const payload = {
      p_page: page,
      p_page_size: pageSize,
      p_status: status === 'all' ? null : status,
      p_supplier: supplier === 'all' ? null : supplier,
      p_start_date: formatDateForRpc(startDate),
      p_end_date: formatDateForRpc(endDate),
      p_search: search || null
    };

    console.log('📄 getOrdersPaginated payload:', payload);

    const { data, error } = await supabase.rpc('get_orders_paginated', payload);

    if (error) {
      console.error('❌ Erreur Supabase get_orders_paginated:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des commandes paginées:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques mensuelles de CA vs Objectifs
 * @param {number} months - Nombre de mois à récupérer (défaut: 12)
 * @returns {Promise<Array>} Statistiques mensuelles
 */
export async function getMonthlyRevenueStats(months = 12) {
  try {
    const { data, error } = await supabase.rpc('get_monthly_revenue_stats', {
      p_months: months
    });

    if (error) {
      console.error('❌ Erreur Supabase get_monthly_revenue_stats:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Erreur lors du chargement des stats mensuelles:', error);
    throw error;
  }
}

/**
 * Récupère le résumé annuel CA vs Objectifs
 * @returns {Promise<Object>} Résumé avec précision des multiplicateurs
 */
export async function getRevenueSummary() {
  try {
    const { data, error } = await supabase.rpc('get_revenue_summary');

    if (error) {
      console.error('❌ Erreur Supabase get_revenue_summary:', error);
      throw error;
    }

    // La fonction retourne un tableau avec une seule ligne
    return data?.[0] || null;
  } catch (error) {
    console.error('❌ Erreur lors du chargement du résumé CA:', error);
    throw error;
  }
}

export default {
  getAllData,
  getOrdersPaginated,
  getSalesHistory,
  getMonthlyRevenueStats,
  getRevenueSummary,
  createOrder,
  updateOrderStatus,
  processOrderReconciliation,
  updateStock,
  updateProduct,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  saveKPISnapshot,
  updateParameter,
  confirmOrderReconciliation,
  assignSupplierToProduct,
  removeSupplierFromProduct,
  syncProductMoqFromSupplier
};


function formatDateForRpc(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
}
