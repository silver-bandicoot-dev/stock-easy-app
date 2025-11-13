import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { getKPIHistory, calculatePeriodComparison } from '../services/kpiHistoryService';

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
 * @returns {object} Données analytics avec KPIs, tendances et graphiques
 */
export function useAnalytics(products, orders, dateRange = '30d', customRange = null, comparisonType = 'previous') {
  const { currentUser } = useAuth();
  const { format: formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const formatCurrencyNoDecimals = (amount) =>
    formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // ========================================
  // CALCUL DES KPIs ACTUELS
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
    const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
    const salesLostCount = outOfStockProducts.length;
    const salesLostAmount = outOfStockProducts.reduce((sum, p) => {
      // Estimation basée sur les ventes moyennes * prix
      const avgDailySales = p.salesPerDay || p.avgDailySales || 0;
      const daysOutOfStock = 7; // Estimation moyenne
      const price = p.buyPrice || p.price || 0;
      return sum + (avgDailySales * daysOutOfStock * price);
    }, 0);

    // Calcul du surstock
    const overstockProducts = products.filter(p => p.isDeepOverstock === true);
    const overstockSKUs = overstockProducts.length;
    const overstockCost = overstockProducts.reduce((sum, p) => {
      const currentStock = p.stock || 0;
      const excessStock = Math.max(0, currentStock - (p.securityStock || 0) * 2);
      const price = p.buyPrice || p.price || 0;
      return sum + (excessStock * price);
    }, 0);

    // Calcul de la valeur de l'inventaire (Inventory Valuation)
    const inventoryValuation = products.reduce((sum, p) => {
      const productValue = (p.stock || 0) * (p.buyPrice || 0);
      return sum + productValue;
    }, 0);

    const kpis = {
      skuAvailabilityRate: Math.round(skuAvailabilityRate * 100) / 100,
      availableSKUs,
      totalSKUs,
      salesLostAmount: Math.round(salesLostAmount * 100) / 100,
      salesLostCount,
      overstockCost: Math.round(overstockCost * 100) / 100,
      overstockSKUs,
      inventoryValuation: Math.round(inventoryValuation * 100) / 100
    };

    console.log('✅ KPIs calculés:', kpis);
    return kpis;
  }, [products, orders]);

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
      end = new Date();
      start = new Date();
      
      // Calculer la période actuelle
      let days = 30;
      if (dateRange === '7d') days = 7;
      else if (dateRange === '30d') days = 30;
      else if (dateRange === '90d') days = 90;
      else if (dateRange === '1y') days = 365;
      
      start.setDate(end.getDate() - days);
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
      // Ajouter les données supplémentaires
      availableSKUs: currentKPIs.availableSKUs,
      totalSKUs: currentKPIs.totalSKUs,
      salesLostCount: currentKPIs.salesLostCount,
      overstockSKUs: currentKPIs.overstockSKUs
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
      inventoryValuation: comparisonData.reduce((sum, d) => sum + (d.inventoryValuation || 0), 0) / comparisonData.length
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
      }))
    };
  }, [history, startDate, endDate]);

  // ========================================
  // CONSTRUCTION DES OBJETS KPI FINAUX
  // ========================================
  const analytics = useMemo(() => {
    console.log('🎯 Construction des analytics finaux');

    // SKU Availability
    const skuAvailabilityComparison = comparisonKPIs 
      ? calculatePeriodComparison(periodCurrentKPIs.skuAvailabilityRate, comparisonKPIs.skuAvailabilityRate)
      : { change: 0, changePercent: 0, trend: 'neutral' };

    // Sales Lost
    const salesLostComparison = comparisonKPIs
      ? calculatePeriodComparison(periodCurrentKPIs.salesLostAmount, comparisonKPIs.salesLostAmount)
      : { change: 0, changePercent: 0, trend: 'neutral' };

    // Overstock
    const overstockComparison = comparisonKPIs
      ? calculatePeriodComparison(periodCurrentKPIs.overstockCost, comparisonKPIs.overstockCost)
      : { change: 0, changePercent: 0, trend: 'neutral' };

    // Inventory Valuation
    const inventoryValuationComparison = comparisonKPIs
      ? calculatePeriodComparison(periodCurrentKPIs.inventoryValuation, comparisonKPIs.inventoryValuation)
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

    const result = {
      skuAvailability: {
        value: `${periodCurrentKPIs.skuAvailabilityRate.toFixed(1)}%`,
        rawValue: periodCurrentKPIs.skuAvailabilityRate,
        change: skuAvailabilityComparison.change,
        changePercent: skuAvailabilityComparison.changePercent,
        trend: skuAvailabilityComparison.trend,
        chartData: chartData.skuAvailability,
        description: `${periodCurrentKPIs.availableSKUs} SKUs disponibles sur ${periodCurrentKPIs.totalSKUs}`,
        comparisonPeriod: comparisonPeriodLabel,
        comparisonValue: comparisonKPIs?.skuAvailabilityRate.toFixed(1) || null
      },
      salesLost: {
        value: formatCurrencyNoDecimals(periodCurrentKPIs.salesLostAmount),
        rawValue: periodCurrentKPIs.salesLostAmount,
        change: salesLostComparison.change,
        changePercent: salesLostComparison.changePercent,
        trend: salesLostComparison.trend,
        chartData: chartData.salesLost,
        description: `${periodCurrentKPIs.salesLostCount} SKUs en rupture`,
        comparisonPeriod: comparisonPeriodLabel,
        comparisonValue: comparisonKPIs?.salesLostAmount !== undefined
          ? formatCurrencyNoDecimals(comparisonKPIs.salesLostAmount)
          : null
      },
      overstockCost: {
        value: formatCurrencyNoDecimals(periodCurrentKPIs.overstockCost),
        rawValue: periodCurrentKPIs.overstockCost,
        change: overstockComparison.change,
        changePercent: overstockComparison.changePercent,
        trend: overstockComparison.trend,
        chartData: chartData.overstock,
        description: `${periodCurrentKPIs.overstockSKUs} SKUs en surstock`,
        comparisonPeriod: comparisonPeriodLabel,
        comparisonValue: comparisonKPIs?.overstockCost !== undefined
          ? formatCurrencyNoDecimals(comparisonKPIs.overstockCost)
          : null
      },
      inventoryValuation: {
        value: formatCurrency(periodCurrentKPIs.inventoryValuation, {
          minimumFractionDigits: 0
        }),
        rawValue: periodCurrentKPIs.inventoryValuation,
        change: inventoryValuationComparison.change,
        changePercent: inventoryValuationComparison.changePercent,
        trend: inventoryValuationComparison.trend,
        chartData: chartData.inventoryValuation,
        description: `Valeur monétaire totale de votre inventaire (stock × coût unitaire)`,
        comparisonPeriod: comparisonPeriodLabel,
        comparisonValue: comparisonKPIs?.inventoryValuation !== undefined
          ? formatCurrency(comparisonKPIs.inventoryValuation, { minimumFractionDigits: 0 })
          : null
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

