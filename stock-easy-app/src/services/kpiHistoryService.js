import { db } from '../config/firebase';
import { collection, doc, setDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';

/**
 * Sauvegarde un snapshot quotidien des KPIs dans Firestore
 * @param {string} companyId - ID de l'entreprise
 * @param {object} kpiData - Données KPI à sauvegarder
 * @returns {Promise<void>}
 */
export async function saveKPISnapshot(companyId, kpiData) {
  try {
    console.log('📊 saveKPISnapshot - Début de sauvegarde pour companyId:', companyId);
    
    // Créer la date du jour au format YYYY-MM-DD
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    console.log('📅 Date du snapshot:', dateString);
    
    // Structure du snapshot
    const snapshot = {
      date: Timestamp.fromDate(today),
      skuAvailabilityRate: kpiData.skuAvailabilityRate || 0,
      availableSKUs: kpiData.availableSKUs || 0,
      totalSKUs: kpiData.totalSKUs || 0,
      salesLostAmount: kpiData.salesLostAmount || 0,
      salesLostCount: kpiData.salesLostCount || 0,
      overstockCost: kpiData.overstockCost || 0,
      overstockSKUs: kpiData.overstockSKUs || 0,
      inventoryValuation: kpiData.inventoryValuation || 0,
      createdAt: Timestamp.now()
    };
    
    console.log('📦 Données du snapshot:', snapshot);
    
    // Référence du document
    const snapshotRef = doc(db, 'companies', companyId, 'kpi_history', dateString);
    
    // Sauvegarder dans Firestore
    await setDoc(snapshotRef, snapshot, { merge: true });
    
    console.log('✅ Snapshot sauvegardé avec succès:', dateString);
    
    return { success: true, date: dateString };
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du snapshot KPI:', error);
    throw error;
  }
}

/**
 * Récupère l'historique des KPIs pour une période donnée
 * @param {string} companyId - ID de l'entreprise
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @returns {Promise<Array>} Tableau d'objets KPI triés par date
 */
export async function getKPIHistory(companyId, startDate, endDate) {
  try {
    console.log('📊 getKPIHistory - Récupération historique pour companyId:', companyId);
    console.log('📅 Période:', startDate, 'à', endDate);
    
    // Référence de la collection
    const historyRef = collection(db, 'companies', companyId, 'kpi_history');
    
    // Créer la query avec filtres de dates
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const q = query(
      historyRef,
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date', 'asc')
    );
    
    console.log('🔍 Exécution de la requête Firestore...');
    
    // Exécuter la requête
    const querySnapshot = await getDocs(q);
    
    console.log('📈 Nombre de snapshots récupérés:', querySnapshot.size);
    
    // Transformer les documents en objets
    const history = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        date: data.date.toDate(),
        dateString: doc.id, // Le document ID est déjà au format YYYY-MM-DD
        skuAvailabilityRate: data.skuAvailabilityRate || 0,
        availableSKUs: data.availableSKUs || 0,
        totalSKUs: data.totalSKUs || 0,
        salesLostAmount: data.salesLostAmount || 0,
        salesLostCount: data.salesLostCount || 0,
        overstockCost: data.overstockCost || 0,
        overstockSKUs: data.overstockSKUs || 0,
        inventoryValuation: data.inventoryValuation || 0
      });
    });
    
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

