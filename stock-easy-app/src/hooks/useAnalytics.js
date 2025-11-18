import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { getKPIHistory, calculatePeriodComparison } from '../services/kpiHistoryService';
import { calculateOverstockExcessValue } from '../utils/calculations';
import { validateProducts, logValidationWarnings } from '../utils/validators';
import { calculateAnalyticsKPIs } from '../utils/analyticsKPIs';

/**
 * Calcule la période de comparaison selon le type choisi
 * @param {Date} currentStart - Début de la période actuelle
 * @param {Date} currentEnd - Fin de la période actuelle
 * @param {string} comparisonType - Type de comparaison
 * @returns {object|array} Période(s) de comparaison
 */
function getComparisonPeriod(currentStart, currentEnd, comparisonType) {
  const duration = currentEnd.getTime() - currentStart.getTime();
  
  console.log('📊 Calcul de la période de comparaison:', comparisonType);
  console.log('📅 Période actuelle:', currentStart, 'à', currentEnd);
  console.log('⏱️ Durée:', Math.ceil(duration / (1000 * 3600 * 24)), 'jours');
  
  switch(comparisonType) {
    case 'previous':
      // Période équivalente précédente
      const prevEnd = new Date(currentStart.getTime() - 1); // Jour avant le début actuel
      const prevStart = new Date(currentStart.getTime() - duration);
      console.log('📊 Période précédente:', prevStart, 'à', prevEnd);
      return {
        start: prevStart,
        end: prevEnd
      };
    
    case 'year_ago':
    case 'same_last_year':
      // Même période l'année dernière
      const yearAgoStart = new Date(currentStart);
      yearAgoStart.setFullYear(yearAgoStart.getFullYear() - 1);
      const yearAgoEnd = new Date(currentEnd);
      yearAgoEnd.setFullYear(yearAgoEnd.getFullYear() - 1);
      console.log('📊 Même période l\'année dernière:', yearAgoStart, 'à', yearAgoEnd);
      return {
        start: yearAgoStart,
        end: yearAgoEnd
      };
    
    case 'average':
      // Moyenne historique des 12 dernières périodes équivalentes
      const periods = [];
      for (let i = 1; i <= 12; i++) {
        periods.push({
          start: new Date(currentStart.getTime() - (duration * i)),
          end: new Date(currentStart.getTime() - (duration * (i - 1)))
        });
      }
      console.log('📊 Moyenne de 12 périodes:', periods.length);
      return periods; // Retourne un array pour moyenne
    
    default:
      return {
        start: new Date(currentStart.getTime() - duration),
        end: new Date(currentStart.getTime() - 1)
      };
  }
}

/**
 * Hook personnalisé pour gérer les analytics avec historique
 * @param {Array} products - Liste des produits enrichis
 * @param {Array} orders - Liste des commandes
 * @param {string} dateRange - Période sélectionnée ('7d', '30d', '90d', 'custom')
 * @param {object} customRange - { startDate, endDate } pour mode custom
 * @param {string} comparisonType - Type de comparaison ('previous' | 'year_ago' | 'average')
 * @param {number} seuilSurstockProfond - Seuil de surstock profond en jours (défaut: 90)
 * @returns {object} Données analytics avec KPIs, tendances et graphiques
 */
export function useAnalytics(products, orders, dateRange = '30d', customRange = null, comparisonType = 'previous', seuilSurstockProfond = 90) {
  const { currentUser } = useAuth();
  const { format: formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const formatCurrencyNoDecimals = (amount) =>
    formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // ========================================
  // VALIDATION DES DONNÉES PRODUITS
  // ========================================
  useEffect(() => {
    if (products && products.length > 0) {
      const validationResult = validateProducts(products);
      logValidationWarnings(validationResult);
    }
  }, [products]);

  // ========================================
  // CALCUL DES KPIs ACTUELS
  // Recalcul automatique quand products, orders, ou seuilSurstockProfond changent
  // ========================================
  const currentKPIs = useMemo(() => {
    console.log('📊 useAnalytics - Calcul des KPIs actuels');
    console.log('📦 Nombre de produits:', products?.length || 0);
    console.log('📋 Nombre de commandes:', orders?.length || 0);

    if (!products || products.length === 0) {
      console.log('⚠️ Aucun produit disponible pour calculer les KPIs');
      return {
        skuAvailabilityRate: 0,
        availableSKUs: 0,
        totalSKUs: 0,
        salesLostAmount: 0,
        salesLostCount: 0,
        overstockCost: 0,
        overstockSKUs: 0,
        inventoryValuation: 0
      };
    }

    // Calcul de la disponibilité SKU
    const totalSKUs = products.length;
    const availableSKUs = products.filter(p => (p.stock || 0) > 0).length;
    const skuAvailabilityRate = totalSKUs > 0 ? (availableSKUs / totalSKUs) * 100 : 0;

    // Calcul des ventes perdues
    // 📊 VENTES PERDUES - APPROCHE FACTUELLE (ANALYTICS)
    // Cette estimation compte uniquement les produits en rupture totale (stock = 0)
    // pour refléter les pertes réelles actuelles, pas les risques futurs.
    // Note : Diffère du Dashboard qui inclut tous les produits urgents (approche proactive)
    const outOfStockProducts = products.filter(p => (p.stock || 0) === 0 && (p.salesPerDay || 0) > 0);
    const salesLostCount = outOfStockProducts.length;
    const salesLostAmount = outOfStockProducts.reduce((sum, p) => {
      // Estimation basée sur les ventes moyennes * prix de vente (pas d'achat)
      // Utiliser sellPrice pour être cohérent avec le Dashboard et refléter les revenus perdus
      const avgDailySales = p.salesPerDay || p.avgDailySales || 0;
      const daysOutOfStock = 7; // Estimation moyenne de rupture
      const sellPrice = p.sellPrice || p.buyPrice || 0; // Utiliser prix de vente pour ventes perdues
      return sum + (avgDailySales * daysOutOfStock * sellPrice);
    }, 0);

    // Calcul du surstock profond (approche 2 : valeur de l'excédent uniquement)
    // Un produit est en surstock profond si son autonomie (daysOfStock) >= seuil configuré
    // La valeur du surstock profond = valeur de l'excédent (excédent en jours × ventes/jour × prix)
    // Utiliser la fonction utilitaire pour garantir la cohérence du calcul
    const overstockProducts = products.filter(p => p.isDeepOverstock === true);
    const overstockSKUs = overstockProducts.length;
    const overstockSKUList = overstockProducts.map(p => p.sku || p.name || 'N/A').slice(0, 10); // Limiter à 10 SKU pour la lisibilité
    const overstockCost = overstockProducts.reduce((sum, p) => {
      const excessValue = calculateOverstockExcessValue(p, seuilSurstockProfond);
      return sum + excessValue;
    }, 0);

    // Calcul de la valeur de l'inventaire (Inventory Valuation)
    const inventoryValuation = products.reduce((sum, p) => {
      const productValue = (p.stock || 0) * (p.buyPrice || 0);
      return sum + productValue;
    }, 0);

    // Calcul des ventes annuelles projetées (basées sur salesPerDay)
    const annualSalesValue = products.reduce((sum, p) => {
      const dailySales = p.salesPerDay || p.avgDailySales || 0;
      const sellPrice = p.sellPrice || p.buyPrice || 0;
      return sum + (dailySales * 365 * sellPrice);
    }, 0);

    // Calcul du taux de rotation moyen (coverage ratio)
    const avgStockCoverageDays = products
      .filter(p => (p.salesPerDay || p.avgDailySales || 0) > 0)
      .reduce((sum, p) => {
        const dailySales = p.salesPerDay || p.avgDailySales || 0;
        const coverageDays = (p.stock || 0) / dailySales;
        return sum + coverageDays;
      }, 0);
    const avgCoverageDays = products.filter(p => (p.salesPerDay || p.avgDailySales || 0) > 0).length > 0
      ? avgStockCoverageDays / products.filter(p => (p.salesPerDay || p.avgDailySales || 0) > 0).length
      : 0;

    // Ratio inventaire / ventes annuelles (indicateur de santé)
    const inventoryToSalesRatio = annualSalesValue > 0
      ? (inventoryValuation / annualSalesValue) * 100
      : 0;

    // Taux de rupture (pourcentage de SKUs en rupture)
    const outOfStockRate = totalSKUs > 0 ? (salesLostCount / totalSKUs) * 100 : 0;

    // Calculer les KPIs supplémentaires en temps réel
    const additionalKPIs = calculateAnalyticsKPIs(products, orders, null, null);
    
    const kpis = {
      skuAvailabilityRate: Math.round(skuAvailabilityRate * 100) / 100,
      availableSKUs,
      totalSKUs,
      salesLostAmount: Math.round(salesLostAmount * 100) / 100,
      salesLostCount,
      overstockCost: Math.round(overstockCost * 100) / 100,
      overstockSKUs,
      overstockSKUList, // Liste des SKU en surstock profond
      inventoryValuation: Math.round(inventoryValuation * 100) / 100,
      annualSalesValue: Math.round(annualSalesValue * 100) / 100,
      avgCoverageDays: Math.round(avgCoverageDays * 100) / 100,
      inventoryToSalesRatio: Math.round(inventoryToSalesRatio * 100) / 100,
      outOfStockRate: Math.round(outOfStockRate * 100) / 100,
      // KPIs supplémentaires en temps réel
      mappingPercentage: additionalKPIs.mappingPercentage?.rawValue || 0,
      totalProducts: additionalKPIs.totalProducts?.rawValue || 0,
      healthyPercentage: additionalKPIs.healthyPercentage?.rawValue || 0,
      totalGrossMargin: additionalKPIs.totalGrossMargin?.rawValue || 0,
      totalPotentialRevenue: additionalKPIs.totalPotentialRevenue?.rawValue || 0,
      fastRotatingProducts: additionalKPIs.fastRotatingProducts?.rawValue || 0
    };

    console.log('✅ KPIs calculés:', kpis);
    return kpis;
  }, [products, orders, seuilSurstockProfond]);

  // ========================================
  // CALCUL DES DATES DE PÉRIODE
  // ========================================
  const { startDate, endDate, comparisonPeriod, fetchStartDate } = useMemo(() => {
    console.log('📅 Calcul des dates pour période:', dateRange, 'comparisonType:', comparisonType);
    
    let start, end;
    
    // Gérer le mode custom
    if (dateRange === 'custom' && (customRange?.startDate && customRange?.endDate) || (customRange?.start && customRange?.end)) {
      // Gérer les deux formats possibles : startDate/endDate ou start/end
      if (customRange.startDate && customRange.endDate) {
        start = new Date(customRange.startDate);
        end = new Date(customRange.endDate);
        console.log('📅 Mode personnalisé (startDate/endDate):', customRange.startDate, 'à', customRange.endDate);
      } else if (customRange.start && customRange.end) {
        start = new Date(customRange.start);
        end = new Date(customRange.end);
        console.log('📅 Mode personnalisé (start/end):', customRange.start, 'à', customRange.end);
      }
    } else {
      // Mode preset
      if (dateRange === 'yesterday') {
        // Hier : du début de la journée d'hier à la fin de la journée d'hier
        end = new Date();
        end.setDate(end.getDate() - 1); // Hier
        end.setHours(23, 59, 59, 999); // Fin de la journée d'hier
        
        start = new Date();
        start.setDate(start.getDate() - 1); // Hier
        start.setHours(0, 0, 0, 0); // Début de la journée d'hier
      } else {
        // Autres périodes
        end = new Date();
        start = new Date();
        
        // Calculer la période actuelle
        let days = 30;
        if (dateRange === '7d') days = 7;
        else if (dateRange === '30d') days = 30;
        else if (dateRange === '90d') days = 90;
        else if (dateRange === '1y') days = 365;
        
        start.setDate(end.getDate() - days);
        start.setHours(0, 0, 0, 0); // Début de la journée
        end.setHours(23, 59, 59, 999); // Fin de la journée
      }
    }
    
    // Calculer la période de comparaison selon le type
    const comparison = getComparisonPeriod(start, end, comparisonType);
    
    // Déterminer la date de début pour la requête Firestore
    // Pour 'average', on a besoin de toutes les périodes
    let fetchStart;
    if (comparisonType === 'average' && Array.isArray(comparison)) {
      // Prendre la date la plus ancienne
      fetchStart = comparison[comparison.length - 1].start;
    } else {
      fetchStart = comparison.start;
    }
    
    console.log('📊 Période actuelle:', start, 'à', end);
    console.log('📊 Fetch depuis:', fetchStart);
    
    return {
      startDate: start,
      endDate: end,
      comparisonPeriod: comparison,
      fetchStartDate: fetchStart
    };
  }, [dateRange, customRange, comparisonType]);

  // ========================================
  // CHARGEMENT DE L'HISTORIQUE DEPUIS FIRESTORE
  // ========================================
  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      if (!currentUser?.uid) {
        console.log('⚠️ Pas d\'utilisateur connecté, skip chargement historique');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Chargement de l\'historique KPI...');
        console.log('📅 Fetch depuis:', fetchStartDate, 'jusqu\'à', endDate);
        
        // Récupérer l'historique pour la période actuelle ET de comparaison
        const allHistory = await getKPIHistory(
          currentUser.uid,
          fetchStartDate,
          endDate
        );
        
        if (isMounted) {
          setHistory(allHistory);
          console.log('✅ Historique chargé:', allHistory.length, 'entrées');
          
          // Même sans historique, on peut afficher les KPIs actuels
          if (allHistory.length === 0) {
            console.log('ℹ️ Pas d\'historique disponible, affichage des KPIs actuels uniquement');
          }
        }
      } catch (err) {
        console.error('❌ Erreur chargement historique:', err);
        console.error('Détails erreur:', err);
        
        if (isMounted) {
          // Ne pas bloquer l'affichage si erreur Firestore
          setError(null); // Ignorer l'erreur pour afficher quand même les KPIs actuels
          setHistory([]); // Continuer avec historique vide
          console.log('ℹ️ Erreur Firestore ignorée, affichage des KPIs actuels');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('✅ Loading terminé');
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [currentUser, dateRange, startDate, endDate, fetchStartDate, comparisonType]);

  // ========================================
  // CALCUL DES KPIs DE LA PÉRIODE ACTUELLE (DEPUIS L'HISTORIQUE)
  // ========================================
  const periodCurrentKPIs = useMemo(() => {
    if (history.length === 0) {
      console.log('⚠️ Pas d\'historique, utilisation des KPIs actuels');
      return currentKPIs;
    }

    // Filtrer l'historique pour la période actuelle
    const periodData = history.filter(h => {
      const historyDate = new Date(h.date);
      return historyDate >= startDate && historyDate <= endDate;
    });

    if (periodData.length === 0) {
      console.log('⚠️ Pas de données pour la période actuelle, utilisation des KPIs actuels');
      return currentKPIs;
    }

    console.log('📊 Calcul des KPIs de la période actuelle:', periodData.length, 'points');

    // Calculer les moyennes pour la période actuelle
    const avgKPIs = {
      skuAvailabilityRate: periodData.reduce((sum, d) => sum + d.skuAvailabilityRate, 0) / periodData.length,
      salesLostAmount: periodData.reduce((sum, d) => sum + d.salesLostAmount, 0) / periodData.length,
      overstockCost: periodData.reduce((sum, d) => sum + d.overstockCost, 0) / periodData.length,
      inventoryValuation: periodData.reduce((sum, d) => sum + (d.inventoryValuation || 0), 0) / periodData.length,
      // KPIs supplémentaires depuis l'historique
      mappingPercentage: periodData.reduce((sum, d) => sum + (d.mappingPercentage || 0), 0) / periodData.length,
      totalProducts: periodData.reduce((sum, d) => sum + (d.totalProducts || 0), 0) / periodData.length,
      healthyPercentage: periodData.reduce((sum, d) => sum + (d.healthyPercentage || 0), 0) / periodData.length,
      totalGrossMargin: periodData.reduce((sum, d) => sum + (d.totalGrossMargin || 0), 0) / periodData.length,
      totalPotentialRevenue: periodData.reduce((sum, d) => sum + (d.totalPotentialRevenue || 0), 0) / periodData.length,
      fastRotatingProducts: periodData.reduce((sum, d) => sum + (d.fastRotatingProducts || 0), 0) / periodData.length,
      // Ajouter les données supplémentaires (utiliser les valeurs actuelles pour les métriques en temps réel)
      availableSKUs: currentKPIs.availableSKUs,
      totalSKUs: currentKPIs.totalSKUs,
      salesLostCount: currentKPIs.salesLostCount,
      overstockSKUs: currentKPIs.overstockSKUs,
      overstockSKUList: currentKPIs.overstockSKUList, // Liste des SKU en surstock profond
      // Nouvelles métriques (calculées en temps réel uniquement)
      annualSalesValue: currentKPIs.annualSalesValue || 0,
      avgCoverageDays: currentKPIs.avgCoverageDays || 0,
      inventoryToSalesRatio: currentKPIs.inventoryToSalesRatio || 0,
      outOfStockRate: currentKPIs.outOfStockRate || 0
    };

    console.log('📊 KPIs période actuelle:', avgKPIs);
    return avgKPIs;
  }, [history, startDate, endDate, currentKPIs]);

  // ========================================
  // CALCUL DES DONNÉES DE COMPARAISON
  // ========================================
  const comparisonKPIs = useMemo(() => {
    if (history.length === 0) {
      console.log('⚠️ Pas d\'historique disponible pour comparaison');
      return null;
    }

    console.log('📊 Calcul des KPIs de comparaison, type:', comparisonType);

    let comparisonData = [];

    // Selon le type de comparaison
    if (comparisonType === 'average' && Array.isArray(comparisonPeriod)) {
      // Mode moyenne : récupérer les données de toutes les périodes
      console.log('📊 Mode moyenne - Calcul sur', comparisonPeriod.length, 'périodes');
      
      comparisonPeriod.forEach((period, index) => {
        const periodData = history.filter(h => {
          const historyDate = new Date(h.date);
          return historyDate >= period.start && historyDate <= period.end;
        });
        if (periodData.length > 0) {
          comparisonData.push(...periodData);
          console.log(`  Période ${index + 1}:`, periodData.length, 'points');
        }
      });
    } else {
      // Mode previous ou year_ago : une seule période
      comparisonData = history.filter(h => {
        const historyDate = new Date(h.date);
        return historyDate >= comparisonPeriod.start && historyDate <= comparisonPeriod.end;
      });
      console.log('📊 Données de comparaison:', comparisonData.length, 'points');
    }

    if (comparisonData.length === 0) {
      console.log('⚠️ Pas de données pour la période de comparaison');
      return null;
    }

    // Calculer les moyennes pour la période de comparaison
    const avgKPIs = {
      skuAvailabilityRate: comparisonData.reduce((sum, d) => sum + d.skuAvailabilityRate, 0) / comparisonData.length,
      salesLostAmount: comparisonData.reduce((sum, d) => sum + d.salesLostAmount, 0) / comparisonData.length,
      overstockCost: comparisonData.reduce((sum, d) => sum + d.overstockCost, 0) / comparisonData.length,
      inventoryValuation: comparisonData.reduce((sum, d) => sum + (d.inventoryValuation || 0), 0) / comparisonData.length,
      // KPIs supplémentaires depuis l'historique
      mappingPercentage: comparisonData.reduce((sum, d) => sum + (d.mappingPercentage || 0), 0) / comparisonData.length,
      totalProducts: comparisonData.reduce((sum, d) => sum + (d.totalProducts || 0), 0) / comparisonData.length,
      healthyPercentage: comparisonData.reduce((sum, d) => sum + (d.healthyPercentage || 0), 0) / comparisonData.length,
      totalGrossMargin: comparisonData.reduce((sum, d) => sum + (d.totalGrossMargin || 0), 0) / comparisonData.length,
      totalPotentialRevenue: comparisonData.reduce((sum, d) => sum + (d.totalPotentialRevenue || 0), 0) / comparisonData.length,
      fastRotatingProducts: comparisonData.reduce((sum, d) => sum + (d.fastRotatingProducts || 0), 0) / comparisonData.length
    };

    console.log('📊 KPIs période de comparaison:', avgKPIs);
    return avgKPIs;
  }, [history, comparisonPeriod, comparisonType]);

  // ========================================
  // TRANSFORMATION EN CHART DATA
  // ========================================
  const chartData = useMemo(() => {
    if (history.length === 0) {
      console.log('⚠️ Pas d\'historique pour les graphiques');
      return {
        skuAvailability: [],
        salesLost: [],
        overstock: []
      };
    }

    // Filtrer uniquement la période actuelle
    const currentPeriodData = history.filter(h => {
      const historyDate = new Date(h.date);
      return historyDate >= startDate && historyDate <= endDate;
    });

    console.log('📈 Données pour graphiques:', currentPeriodData.length, 'points');

    // Limiter à 8-12 points pour une meilleure visualisation
    const maxPoints = 12;
    const step = Math.ceil(currentPeriodData.length / maxPoints);
    const sampledData = currentPeriodData.filter((_, index) => index % step === 0);

    return {
      skuAvailability: sampledData.map(d => ({
        date: d.dateString,
        value: d.skuAvailabilityRate
      })),
      salesLost: sampledData.map(d => ({
        date: d.dateString,
        value: d.salesLostAmount
      })),
      overstock: sampledData.map(d => ({
        date: d.dateString,
        value: d.overstockCost
      })),
      inventoryValuation: sampledData.map(d => ({
        date: d.dateString,
        value: d.inventoryValuation || 0
      })),
      // Graphiques pour KPIs supplémentaires
      mappingPercentage: sampledData.map(d => ({
        date: d.dateString,
        value: d.mappingPercentage || 0
      })),
      totalProducts: sampledData.map(d => ({
        date: d.dateString,
        value: d.totalProducts || 0
      })),
      healthyPercentage: sampledData.map(d => ({
        date: d.dateString,
        value: d.healthyPercentage || 0
      })),
      totalGrossMargin: sampledData.map(d => ({
        date: d.dateString,
        value: d.totalGrossMargin || 0
      })),
      totalPotentialRevenue: sampledData.map(d => ({
        date: d.dateString,
        value: d.totalPotentialRevenue || 0
      })),
      fastRotatingProducts: sampledData.map(d => ({
        date: d.dateString,
        value: d.fastRotatingProducts || 0
      }))
    };
  }, [history, startDate, endDate]);

  // ========================================
  // FONCTION D'ANALYSE INTELLIGENTE DE LA VALEUR D'INVENTAIRE
  // ========================================
  /**
   * Analyse intelligente de la valeur de l'inventaire en tenant compte du contexte métier
   * @param {object} metrics - Métriques actuelles et de comparaison
   * @returns {string} Message d'analyse contextualisé
   */
  const analyzeInventoryValuation = (metrics) => {
    const {
      inventoryValuation,
      annualSalesValue,
      avgCoverageDays,
      inventoryToSalesRatio,
      outOfStockRate,
      salesLostAmount,
      trend,
      changePercent
    } = metrics;

    // Cas 1: Inventaire très faible ET ruptures importantes
    if (inventoryValuation < 20000 && outOfStockRate > 15 && salesLostAmount > 3000) {
      return "Inventaire très insuffisant avec ruptures fréquentes. Augmenter les stocks est urgent pour éviter les pertes de ventes.";
    }

    // Cas 2: Inventaire faible mais rotation rapide (bon signe) + ruptures
    if (inventoryValuation < 50000 && avgCoverageDays < 30 && outOfStockRate > 10) {
      return "Rotation rapide mais stock insuffisant. Augmentez légèrement les niveaux pour réduire les ruptures sans surstock.";
    }

    // Cas 3: Inventaire faible avec bonne rotation et peu de ruptures (normal pour petite entreprise)
    if (inventoryValuation < 50000 && avgCoverageDays < 60 && outOfStockRate < 5) {
      return "Inventaire optimisé avec bonne rotation. Votre niveau actuel semble adapté à votre activité.";
    }

    // Cas 4: Inventaire moyen avec rotation lente
    if (inventoryValuation >= 50000 && inventoryValuation < 100000 && avgCoverageDays > 90) {
      return "Inventaire modéré avec rotation lente. Surveillez les produits à faible rotation et envisagez des promotions.";
    }

    // Cas 5: Inventaire élevé avec rotation lente (surstock)
    if (inventoryValuation >= 100000 && avgCoverageDays > 120) {
      return "Inventaire élevé avec rotation lente. Optimisez les niveaux de stock pour libérer du capital et réduire les coûts de stockage.";
    }

    // Cas 6: Inventaire élevé mais rotation normale + tendance à la hausse
    if (inventoryValuation >= 100000 && avgCoverageDays < 90 && trend === 'up' && changePercent > 10) {
      return "Inventaire en hausse avec rotation saine. Surveillez l'évolution pour éviter le surstock progressif.";
    }

    // Cas 7: Inventaire élevé avec excellente rotation
    if (inventoryValuation >= 100000 && avgCoverageDays < 60 && outOfStockRate < 5) {
      return "Inventaire bien dimensionné avec excellente rotation. Maintenez ce niveau pour garantir la disponibilité.";
    }

    // Cas 8: Ratio inventaire/ventes anormalement élevé (>40%)
    if (inventoryToSalesRatio > 40 && inventoryValuation > 50000) {
      return "Ratio inventaire/ventes élevé. Réduisez les niveaux de stock pour améliorer votre trésorerie.";
    }

    // Cas 9: Ratio inventaire/ventes très faible (<10%) avec ruptures
    if (inventoryToSalesRatio < 10 && outOfStockRate > 10) {
      return "Ratio inventaire/ventes très faible avec ruptures. Augmentez progressivement les stocks pour stabiliser les ventes.";
    }

    // Cas 10: Tendance à la baisse avec ruptures croissantes
    if (trend === 'down' && changePercent < -15 && outOfStockRate > 5) {
      return "Inventaire en baisse avec augmentation des ruptures. Revoyez votre stratégie de réapprovisionnement.";
    }

    // Cas par défaut: Inventaire modéré avec situation équilibrée
    if (inventoryValuation >= 50000 && inventoryValuation < 100000 && avgCoverageDays >= 60 && avgCoverageDays <= 90) {
      return "Inventaire de valeur modérée bien équilibré. Maintenez un suivi régulier pour optimiser continuellement.";
    }

    // Fallback: Message générique basé uniquement sur la valeur
    if (inventoryValuation > 100000) {
      return "Inventaire de grande valeur. Surveillez attentivement les rotations pour optimiser votre capital investi.";
    } else if (inventoryValuation > 50000) {
      return "Inventaire de valeur modérée. Maintenez un bon équilibre entre disponibilité et coûts.";
    } else {
      // Pour les petites valeurs, vérifier si c'est vraiment un problème
      if (outOfStockRate > 5 || salesLostAmount > 2000) {
        return "Inventaire de faible valeur avec signes de sous-stockage. Envisagez d'augmenter les niveaux progressivement.";
      }
      return "Inventaire de faible valeur adapté à votre activité actuelle. Surveillez les ruptures pour ajuster si nécessaire.";
    }
  };

  // ========================================
  // CONSTRUCTION DES OBJETS KPI FINAUX
  // ========================================
  const analytics = useMemo(() => {
    console.log('🎯 Construction des analytics finaux');

    // Utiliser les valeurs actuelles (temps réel) pour les comparaisons
    // SKU Availability
    const skuAvailabilityComparison = comparisonKPIs 
      ? calculatePeriodComparison(currentKPIs.skuAvailabilityRate, comparisonKPIs.skuAvailabilityRate)
      : { change: 0, changePercent: 0, trend: 'neutral' };

    // Sales Lost
    const salesLostComparison = comparisonKPIs
      ? calculatePeriodComparison(currentKPIs.salesLostAmount, comparisonKPIs.salesLostAmount)
      : { change: 0, changePercent: 0, trend: 'neutral' };

    // Overstock
    const overstockComparison = comparisonKPIs
      ? calculatePeriodComparison(currentKPIs.overstockCost, comparisonKPIs.overstockCost)
      : { change: 0, changePercent: 0, trend: 'neutral' };

    // Inventory Valuation
    const inventoryValuationComparison = comparisonKPIs
      ? calculatePeriodComparison(currentKPIs.inventoryValuation, comparisonKPIs.inventoryValuation)
      : { change: 0, changePercent: 0, trend: 'neutral' };

    // Formater la période de comparaison pour l'affichage
    const formatComparisonPeriod = () => {
      if (comparisonType === 'average') {
        return 'moyenne 12 mois';
      } else if (comparisonType === 'year_ago' || comparisonType === 'same_last_year') {
        const yearAgoStart = new Date(startDate);
        yearAgoStart.setFullYear(yearAgoStart.getFullYear() - 1);
        const yearAgoEnd = new Date(endDate);
        yearAgoEnd.setFullYear(yearAgoEnd.getFullYear() - 1);
        
        // Si la période s'étend sur plusieurs mois
        if (yearAgoStart.getMonth() !== yearAgoEnd.getMonth() || yearAgoStart.getFullYear() !== yearAgoEnd.getFullYear()) {
          return `${yearAgoStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${yearAgoEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        return `${yearAgoStart.toLocaleDateString('fr-FR', { day: 'numeric' })}-${yearAgoEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      } else {
        // previous
        if (Array.isArray(comparisonPeriod)) return 'période précédente';
        const start = new Date(comparisonPeriod.start);
        const end = new Date(comparisonPeriod.end);
        
        // Si la période s'étend sur plusieurs mois
        if (start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear()) {
          return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        return `${start.toLocaleDateString('fr-FR', { day: 'numeric' })}-${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }
    };

    const comparisonPeriodLabel = formatComparisonPeriod();

    // Utiliser les valeurs actuelles (temps réel) au lieu de la moyenne de la période
    // Les valeurs affichées doivent refléter l'état actuel, pas une moyenne historique
    const currentValue = currentKPIs.skuAvailabilityRate;
    const currentInventoryValue = currentKPIs.inventoryValuation;
    const currentSalesLost = currentKPIs.salesLostAmount;
    const currentOverstock = currentKPIs.overstockCost;

    const result = {
      skuAvailability: {
        value: `${currentValue.toFixed(1)}%`,
        rawValue: currentValue,
        change: skuAvailabilityComparison.change,
        changePercent: skuAvailabilityComparison.changePercent,
        trend: skuAvailabilityComparison.trend,
        chartData: chartData.skuAvailability,
        description: `${currentKPIs.availableSKUs} SKUs disponibles sur ${currentKPIs.totalSKUs}`,
        comparisonPeriod: comparisonPeriodLabel,
        comparisonValue: comparisonKPIs?.skuAvailabilityRate.toFixed(1) || null
      },
      salesLost: {
        value: formatCurrencyNoDecimals(currentSalesLost),
        rawValue: currentSalesLost,
        change: salesLostComparison.change,
        changePercent: salesLostComparison.changePercent,
        trend: salesLostComparison.trend,
        chartData: chartData.salesLost,
        description: `⚠️ ATTENTION : Différent du Dashboard ! Compte UNIQUEMENT les produits EN RUPTURE TOTALE (stock = 0). Mesure les pertes RÉELLES actuelles, pas les risques futurs. ${currentKPIs.salesLostCount} SKU(s) en rupture. Pour voir les produits à risque, consultez le Dashboard.`,
        comparisonPeriod: comparisonPeriodLabel,
        comparisonValue: comparisonKPIs?.salesLostAmount !== undefined
          ? formatCurrencyNoDecimals(comparisonKPIs.salesLostAmount)
          : null
      },
      overstockCost: {
        value: formatCurrencyNoDecimals(currentOverstock),
        rawValue: currentOverstock,
        change: overstockComparison.change,
        changePercent: overstockComparison.changePercent,
        trend: overstockComparison.trend,
        chartData: chartData.overstock,
        description: `${currentKPIs.overstockSKUs} SKU(s) en surstock profond${currentKPIs.overstockSKUList && currentKPIs.overstockSKUList.length > 0 ? ` : ${currentKPIs.overstockSKUList.join(', ')}${currentKPIs.overstockSKUs > 10 ? ` (+ ${currentKPIs.overstockSKUs - 10} autres)` : ''}` : ''}`,
        comparisonPeriod: comparisonPeriodLabel,
        comparisonValue: comparisonKPIs?.overstockCost !== undefined
          ? formatCurrencyNoDecimals(comparisonKPIs.overstockCost)
          : null
      },
      inventoryValuation: {
        value: formatCurrency(currentInventoryValue, {
          minimumFractionDigits: 0
        }),
        rawValue: currentInventoryValue,
        change: inventoryValuationComparison.change,
        changePercent: inventoryValuationComparison.changePercent,
        trend: inventoryValuationComparison.trend,
        chartData: chartData.inventoryValuation,
        description: `Valeur monétaire totale de votre inventaire (stock × coût unitaire)`,
        comparisonPeriod: comparisonPeriodLabel,
        comparisonValue: comparisonKPIs?.inventoryValuation !== undefined
          ? formatCurrency(comparisonKPIs.inventoryValuation, { minimumFractionDigits: 0 })
          : null,
        // Analyse intelligente avec toutes les métriques contextuelles
        analysis: analyzeInventoryValuation({
          inventoryValuation: currentInventoryValue,
          annualSalesValue: currentKPIs.annualSalesValue || 0,
          avgCoverageDays: currentKPIs.avgCoverageDays || 0,
          inventoryToSalesRatio: currentKPIs.inventoryToSalesRatio || 0,
          outOfStockRate: currentKPIs.outOfStockRate || 0,
          salesLostAmount: currentSalesLost,
          trend: inventoryValuationComparison.trend,
          changePercent: inventoryValuationComparison.changePercent
        })
      },
      // KPIs supplémentaires avec comparaisons réelles depuis l'historique
      // Utiliser les valeurs actuelles (temps réel) calculées depuis les produits
      additionalKPIs: {
        mappingPercentage: {
          value: `${Math.round((currentKPIs.mappingPercentage || 0))}%`,
          rawValue: currentKPIs.mappingPercentage || 0,
          change: comparisonKPIs ? calculatePeriodComparison(currentKPIs.mappingPercentage || 0, comparisonKPIs.mappingPercentage || 0).change : 0,
          changePercent: comparisonKPIs ? calculatePeriodComparison(currentKPIs.mappingPercentage || 0, comparisonKPIs.mappingPercentage || 0).changePercent : 0,
          trend: comparisonKPIs ? calculatePeriodComparison(currentKPIs.mappingPercentage || 0, comparisonKPIs.mappingPercentage || 0).trend : 'neutral',
          chartData: chartData.mappingPercentage || [],
          comparisonPeriod: comparisonPeriodLabel
        },
        totalProducts: {
          value: Math.round(currentKPIs.totalProducts || 0),
          rawValue: currentKPIs.totalProducts || 0,
          change: comparisonKPIs ? calculatePeriodComparison(currentKPIs.totalProducts || 0, comparisonKPIs.totalProducts || 0).change : 0,
          changePercent: comparisonKPIs ? calculatePeriodComparison(currentKPIs.totalProducts || 0, comparisonKPIs.totalProducts || 0).changePercent : 0,
          trend: comparisonKPIs ? calculatePeriodComparison(currentKPIs.totalProducts || 0, comparisonKPIs.totalProducts || 0).trend : 'neutral',
          chartData: chartData.totalProducts || [],
          comparisonPeriod: comparisonPeriodLabel
        },
        healthyPercentage: {
          value: `${Math.round(currentKPIs.healthyPercentage || 0)}%`,
          rawValue: currentKPIs.healthyPercentage || 0,
          change: comparisonKPIs ? calculatePeriodComparison(currentKPIs.healthyPercentage || 0, comparisonKPIs.healthyPercentage || 0).change : 0,
          changePercent: comparisonKPIs ? calculatePeriodComparison(currentKPIs.healthyPercentage || 0, comparisonKPIs.healthyPercentage || 0).changePercent : 0,
          trend: comparisonKPIs ? calculatePeriodComparison(currentKPIs.healthyPercentage || 0, comparisonKPIs.healthyPercentage || 0).trend : 'neutral',
          chartData: chartData.healthyPercentage || [],
          comparisonPeriod: comparisonPeriodLabel
        },
        totalGrossMargin: {
          value: formatCurrency(currentKPIs.totalGrossMargin || 0, { minimumFractionDigits: 0 }),
          rawValue: currentKPIs.totalGrossMargin || 0,
          change: comparisonKPIs ? calculatePeriodComparison(currentKPIs.totalGrossMargin || 0, comparisonKPIs.totalGrossMargin || 0).change : 0,
          changePercent: comparisonKPIs ? calculatePeriodComparison(currentKPIs.totalGrossMargin || 0, comparisonKPIs.totalGrossMargin || 0).changePercent : 0,
          trend: comparisonKPIs ? calculatePeriodComparison(currentKPIs.totalGrossMargin || 0, comparisonKPIs.totalGrossMargin || 0).trend : 'neutral',
          chartData: chartData.totalGrossMargin || [],
          comparisonPeriod: comparisonPeriodLabel
        },
        totalPotentialRevenue: {
          value: formatCurrency(currentKPIs.totalPotentialRevenue || 0, { minimumFractionDigits: 0 }),
          rawValue: currentKPIs.totalPotentialRevenue || 0,
          change: comparisonKPIs ? calculatePeriodComparison(currentKPIs.totalPotentialRevenue || 0, comparisonKPIs.totalPotentialRevenue || 0).change : 0,
          changePercent: comparisonKPIs ? calculatePeriodComparison(currentKPIs.totalPotentialRevenue || 0, comparisonKPIs.totalPotentialRevenue || 0).changePercent : 0,
          trend: comparisonKPIs ? calculatePeriodComparison(currentKPIs.totalPotentialRevenue || 0, comparisonKPIs.totalPotentialRevenue || 0).trend : 'neutral',
          chartData: chartData.totalPotentialRevenue || [],
          comparisonPeriod: comparisonPeriodLabel
        },
        fastRotatingProducts: {
          value: Math.round(currentKPIs.fastRotatingProducts || 0),
          rawValue: currentKPIs.fastRotatingProducts || 0,
          change: comparisonKPIs ? calculatePeriodComparison(currentKPIs.fastRotatingProducts || 0, comparisonKPIs.fastRotatingProducts || 0).change : 0,
          changePercent: comparisonKPIs ? calculatePeriodComparison(currentKPIs.fastRotatingProducts || 0, comparisonKPIs.fastRotatingProducts || 0).changePercent : 0,
          trend: comparisonKPIs ? calculatePeriodComparison(currentKPIs.fastRotatingProducts || 0, comparisonKPIs.fastRotatingProducts || 0).trend : 'neutral',
          chartData: chartData.fastRotatingProducts || [],
          comparisonPeriod: comparisonPeriodLabel
        }
      },
      loading,
      error,
      // Données brutes pour debug
      _debug: {
        currentKPIs,
        comparisonKPIs,
        historyLength: history.length,
        comparisonType
      }
    };

    console.log('✅ Analytics finaux construits');
    console.log('  - skuAvailability:', result.skuAvailability.value);
    console.log('  - salesLost:', result.salesLost.value);
    console.log('  - overstockCost:', result.overstockCost.value);
    console.log('  - inventoryValuation:', result.inventoryValuation.value);
    console.log('  - loading:', result.loading);
    console.log('  - error:', result.error);
    
    return result;
  }, [currentKPIs, comparisonKPIs, chartData, loading, error, history.length, comparisonType, startDate, comparisonPeriod]);

  console.log('🔄 useAnalytics - Retour des analytics:', {
    hasData: !!analytics.skuAvailability,
    loading: analytics.loading,
    error: analytics.error
  });

  return analytics;
}

