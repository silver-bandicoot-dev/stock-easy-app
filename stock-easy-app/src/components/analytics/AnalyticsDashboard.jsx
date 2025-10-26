import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import { KPICard } from './KPICard';
import { DateRangePicker } from './DateRangePicker';
import { ComparisonSelector } from './ComparisonSelector';

export const AnalyticsDashboard = ({
  analyticsData,
  dateRange,
  setDateRange,
  customRange,
  setCustomRange,
  comparisonType,
  setComparisonType
}) => {
  const kpis = [
    {
      title: "Taux de Disponibilité des SKU",
      value: analyticsData.skuAvailability?.value || 0,
      change: analyticsData.skuAvailability?.change || 0,
      changePercent: analyticsData.skuAvailability?.changePercent || 0,
      icon: BarChart3,
      color: 'blue'
    },
    {
      title: "Valeur Totale du Stock",
      value: analyticsData.totalStockValue?.value || 0,
      change: analyticsData.totalStockValue?.change || 0,
      changePercent: analyticsData.totalStockValue?.changePercent || 0,
      icon: BarChart3,
      color: 'green'
    },
    {
      title: "Rotation des Stocks",
      value: analyticsData.stockTurnover?.value || 0,
      change: analyticsData.stockTurnover?.change || 0,
      changePercent: analyticsData.stockTurnover?.changePercent || 0,
      icon: BarChart3,
      color: 'orange'
    },
    {
      title: "Taux de Rupture",
      value: analyticsData.outOfStockRate?.value || 0,
      change: analyticsData.outOfStockRate?.change || 0,
      changePercent: analyticsData.outOfStockRate?.changePercent || 0,
      icon: BarChart3,
      color: 'red'
    }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-[#191919]" />
          <h1 className="text-2xl font-bold text-[#191919]">Indicateurs Clés de l'Inventaire</h1>
        </div>
        <p className="text-sm text-[#666663] ml-11">
          Suivez en temps réel les principaux KPIs ayant un impact direct sur vos résultats financiers
        </p>
      </div>

      {/* Contrôles */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex flex-col gap-4 mb-6">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
          
          <ComparisonSelector
            value={comparisonType}
            onChange={setComparisonType}
            disabled={dateRange === 'custom'}
          />
        </div>
      </div>

      {/* État de chargement */}
      {analyticsData.loading ? (
        <div className="flex items-center justify-center h-40 bg-white rounded-xl shadow-sm border border-[#E5E4DF]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#666663]" />
          <span className="ml-2 text-[#666663]">Chargement des analytics...</span>
        </div>
      ) : analyticsData.error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">Erreur: {analyticsData.error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
              <KPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                changePercent={kpi.changePercent}
                icon={kpi.icon}
                color={kpi.color}
                isLoading={analyticsData.loading}
              />
            ))}
          </div>

          {/* Graphiques et analyses supplémentaires */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique des tendances */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <h3 className="text-lg font-semibold text-[#191919] mb-4">Tendances des Stocks</h3>
              <div className="h-64 flex items-center justify-center bg-[#FAFAF7] rounded-lg">
                <p className="text-[#666663]">Graphique des tendances (à implémenter)</p>
              </div>
            </div>

            {/* Analyse des fournisseurs */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <h3 className="text-lg font-semibold text-[#191919] mb-4">Performance par Fournisseur</h3>
              <div className="h-64 flex items-center justify-center bg-[#FAFAF7] rounded-lg">
                <p className="text-[#666663]">Analyse des fournisseurs (à implémenter)</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
