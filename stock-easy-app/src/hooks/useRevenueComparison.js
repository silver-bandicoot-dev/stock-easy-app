import { useState, useEffect, useCallback } from 'react';
import { getMonthlyRevenueStats, getRevenueSummary } from '../services/apiAdapter';

/**
 * Hook pour récupérer et gérer les données de comparaison CA vs Objectifs
 * 
 * @param {number} months - Nombre de mois à récupérer (défaut: 12)
 * @returns {Object} { data, summary, loading, error, refetch }
 */
export function useRevenueComparison(months = 12) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les données mensuelles et le résumé en parallèle
      const [monthlyData, summaryData] = await Promise.all([
        getMonthlyRevenueStats(months),
        getRevenueSummary()
      ]);

      // Transformer les données pour le graphique
      const chartData = (monthlyData || []).map(month => ({
        // Date et label
        date: month.month_date,
        label: month.month_label,
        
        // Valeurs brutes
        actualRevenue: Number(month.actual_revenue) || 0,
        targetDefault: Number(month.target_default) || 0,
        targetML: Number(month.target_ml) || 0,
        
        // Multiplicateurs
        defaultMultiplier: Number(month.default_multiplier) || 1.2,
        avgMLMultiplier: Number(month.avg_ml_multiplier) || 1.2,
        
        // Écarts en %
        varianceDefaultPct: Number(month.variance_default_pct) || 0,
        varianceMLPct: Number(month.variance_ml_pct) || 0,
        
        // Mois en cours ?
        isCurrentMonth: isCurrentMonth(month.month_date)
      }));

      // Calculer des métriques supplémentaires pour le résumé
      const enhancedSummary = summaryData ? {
        ...summaryData,
        ytdRevenue: Number(summaryData.ytd_revenue) || 0,
        ytdTargetDefault: Number(summaryData.ytd_target_default) || 0,
        ytdTargetML: Number(summaryData.ytd_target_ml) || 0,
        defaultAccuracyPct: Number(summaryData.default_accuracy_pct) || 0,
        mlAccuracyPct: Number(summaryData.ml_accuracy_pct) || 0,
        monthsWithData: Number(summaryData.months_with_data) || 0,
        
        // Le ML est-il plus précis ?
        mlIsBetter: (Number(summaryData.ml_accuracy_pct) || 0) > (Number(summaryData.default_accuracy_pct) || 0),
        
        // Écart de précision
        accuracyDiff: Math.abs(
          (Number(summaryData.ml_accuracy_pct) || 0) - (Number(summaryData.default_accuracy_pct) || 0)
        ).toFixed(1)
      } : null;

      setData(chartData);
      setSummary(enhancedSummary);
      
    } catch (err) {
      console.error('❌ Erreur useRevenueComparison:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    summary,
    loading,
    error,
    refetch: fetchData,
    
    // Helpers
    hasEnoughData: data.length >= 2,
    hasAnyRevenue: data.some(d => d.actualRevenue > 0)
  };
}

/**
 * Vérifie si une date est dans le mois en cours
 */
function isCurrentMonth(dateStr) {
  if (!dateStr) return false;
  
  const date = new Date(dateStr);
  const now = new Date();
  
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export default useRevenueComparison;

