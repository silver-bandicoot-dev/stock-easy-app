import { supabase } from '../lib/supabaseClient';

/**
 * Sauvegarde un snapshot quotidien des KPIs dans Supabase
 * @param {string} companyId - ID de l'entreprise (optionnel, récupéré depuis l'utilisateur si non fourni)
 * @param {object} kpiData - Données KPI à sauvegarder
 * @returns {Promise<void>}
 */
export async function saveKPISnapshot(companyId, kpiData) {
  try {
    console.log('📊 saveKPISnapshot - Début de sauvegarde pour companyId:', companyId);
    
    // Récupérer l'utilisateur actuel si companyId n'est pas fourni
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Si companyId n'est pas fourni, essayer de le récupérer depuis le profil utilisateur
    if (!companyId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.company_id) {
        companyId = profile.company_id;
      }
    }

    // Créer la date du jour au format YYYY-MM-DD
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    console.log('📅 Date du snapshot:', dateString);
    
    // Structure du snapshot pour Supabase
    const snapshot = {
      user_id: user.id,
      company_id: companyId || null,
      snapshot_date: dateString,
      sku_availability_rate: kpiData.skuAvailabilityRate || 0,
      available_skus: kpiData.availableSKUs || 0,
      total_skus: kpiData.totalSKUs || 0,
      sales_lost_amount: kpiData.salesLostAmount || 0,
      sales_lost_count: kpiData.salesLostCount || 0,
      overstock_cost: kpiData.overstockCost || 0,
      overstock_skus: kpiData.overstockSKUs || 0,
      inventory_valuation: kpiData.inventoryValuation || 0
    };
    
    console.log('📦 Données du snapshot:', snapshot);
    
    // Utiliser la fonction RPC pour sauvegarder
    const { data, error } = await supabase.rpc('save_kpi_snapshot', {
      p_kpi_data: snapshot
    });
    
    if (error) {
      console.error('❌ Erreur RPC save_kpi_snapshot:', error);
      throw error;
    }
    
    console.log('✅ Snapshot sauvegardé avec succès:', dateString);
    
    return { success: true, date: dateString, data };
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du snapshot KPI:', error);
    throw error;
  }
}

/**
 * Récupère l'historique des KPIs pour une période donnée
 * @param {string} companyId - ID de l'entreprise (optionnel)
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @returns {Promise<Array>} Tableau d'objets KPI triés par date
 */
export async function getKPIHistory(companyId, startDate, endDate) {
  try {
    console.log('📊 getKPIHistory - Récupération historique pour companyId:', companyId);
    console.log('📅 Période:', startDate, 'à', endDate);
    
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Construire la requête
    let query = supabase
      .from('kpi_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .lte('snapshot_date', endDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    // Filtrer par company_id si fourni
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    console.log('🔍 Exécution de la requête Supabase...');
    
    // Exécuter la requête
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Erreur Supabase:', error);
      throw error;
    }
    
    console.log('📈 Nombre de snapshots récupérés:', data?.length || 0);
    
    // Transformer les données pour correspondre au format attendu
    const history = (data || []).map((row) => ({
      id: row.id,
      date: new Date(row.snapshot_date),
      dateString: row.snapshot_date,
      skuAvailabilityRate: row.sku_availability_rate || 0,
      availableSKUs: row.available_skus || 0,
      totalSKUs: row.total_skus || 0,
      salesLostAmount: row.sales_lost_amount || 0,
      salesLostCount: row.sales_lost_count || 0,
      overstockCost: row.overstock_cost || 0,
      overstockSKUs: row.overstock_skus || 0,
      inventoryValuation: row.inventory_valuation || 0
    }));
    
    console.log('✅ Historique récupéré:', history.length, 'entrées');
    if (history.length > 0) {
      console.log('📊 Premier snapshot:', history[0]);
      console.log('📊 Dernier snapshot:', history[history.length - 1]);
    }
    
    return history;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique KPI:', error);
    throw error;
  }
}

/**
 * Calcule la comparaison entre deux périodes
 * @param {object} currentData - Données de la période actuelle
 * @param {object} previousData - Données de la période précédente
 * @returns {object} Objet avec change, changePercent, et trend
 */
export function calculatePeriodComparison(currentData, previousData) {
  try {
    console.log('📊 calculatePeriodComparison - Calcul de comparaison');
    console.log('📈 Données actuelles:', currentData);
    console.log('📉 Données précédentes:', previousData);
    
    // Si pas de données précédentes, retourner des valeurs neutres
    if (!previousData || previousData === 0) {
      console.log('⚠️ Pas de données précédentes disponibles');
      return {
        change: 0,
        changePercent: 0,
        trend: 'neutral'
      };
    }
    
    // Calculer la différence absolue
    const change = currentData - previousData;
    
    // Calculer le pourcentage de variation
    const changePercent = previousData !== 0 
      ? ((currentData - previousData) / Math.abs(previousData)) * 100 
      : 0;
    
    // Déterminer la tendance
    let trend = 'neutral';
    if (change > 0) {
      trend = 'up';
    } else if (change < 0) {
      trend = 'down';
    }
    
    const result = {
      change: Math.round(change * 100) / 100, // Arrondir à 2 décimales
      changePercent: Math.round(changePercent * 100) / 100, // Arrondir à 2 décimales
      trend
    };
    
    console.log('✅ Résultat de la comparaison:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Erreur lors du calcul de comparaison:', error);
    return {
      change: 0,
      changePercent: 0,
      trend: 'neutral'
    };
  }
}
