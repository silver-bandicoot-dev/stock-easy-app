import { supabase } from '../lib/supabaseClient';

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
      
      if (updates.missingQuantitiesBySku) {
        reconciliationUpdate.missing_quantities_by_sku = updates.missingQuantitiesBySku;
      }
      
      if (updates.damagedQuantitiesBySku) {
        reconciliationUpdate.damaged_quantities_by_sku = updates.damagedQuantitiesBySku;
      }
      
      if (updates.items) {
        reconciliationUpdate.items = updates.items;
      }
      
      console.log('📤 Envoi mise à jour réconciliation:', reconciliationUpdate);
      
      // Mettre à jour directement dans la table commandes
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
    } else {
      console.log('⚠️ Aucune donnée de réconciliation à enregistrer');
    }
    
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
      p_sku: sku,
      p_product_name: updates.productName,
      p_supplier: updates.supplier,
      p_lead_time_days: updates.leadTimeDays,
      p_moq: updates.moq,
      p_order_point: updates.orderPoint,
      p_max_stock: updates.maxStock
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur mise à jour produit:', error);
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
        notes: supplierData.notes ?? null
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
        notes: updates.notes ?? null
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
      p_location: warehouseData.location,
      p_capacity: warehouseData.capacity
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur création entrepôt:', error);
    return { success: false, error: error.message };
  }
}

export async function updateWarehouse(warehouseId, updates) {
  try {
    const { data, error } = await supabase.rpc('update_warehouse', {
      p_warehouse_id: warehouseId,
      p_name: updates.name,
      p_location: updates.location,
      p_capacity: updates.capacity
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur mise à jour entrepôt:', error);
    return { success: false, error: error.message };
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

export async function assignSupplierToProduct(sku, supplierName) {
  try {
    const { data, error } = await supabase.rpc('assign_supplier_to_product', {
      p_sku: sku,
      p_supplier_name: supplierName
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur assignation fournisseur:', error);
    throw error;
  }
}

export async function removeSupplierFromProduct(sku, supplierName) {
  try {
    const { data, error } = await supabase.rpc('remove_supplier_from_product', {
      p_sku: sku,
      p_supplier_name: supplierName
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur retrait fournisseur du produit:', error);
    throw error;
  }
}

export default {
  getAllData,
  getSalesHistory,
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
  removeSupplierFromProduct
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
