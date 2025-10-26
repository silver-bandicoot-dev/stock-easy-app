import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const KPITabs = ({ analyticsData, comparisonType }) => {
  const [selectedKPI, setSelectedKPI] = useState('skuAvailability');

  // Vérifications de sécurité
  if (!analyticsData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-[#666663]">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  // Configuration des KPIs avec leurs métadonnées
  const kpiConfig = {
    skuAvailability: {
      title: 'Taux de Disponibilité des SKU',
      icon: TrendingUp,
      color: '#3B82F6',
      format: (kpiData) => kpiData?.value || '0%',
      unit: '%'
    },
    inventoryValuation: {
      title: 'Valeur de l\'Inventaire',
      icon: TrendingUp,
      color: '#10B981',
      format: (kpiData) => kpiData?.value || '€0',
      unit: '€'
    },
    salesLost: {
      title: 'Ventes Perdues - Rupture de Stock',
      icon: TrendingDown,
      color: '#EF4444',
      format: (kpiData) => kpiData?.value || '€0',
      unit: '€'
    },
    overstockCost: {
      title: 'Valeur Surstocks Profonds',
      icon: TrendingDown,
      color: '#F59E0B',
      format: (kpiData) => kpiData?.value || '€0',
      unit: '€'
    }
  };

  // Générer des données de courbe simples et fiables
  const getChartData = (kpiKey) => {
    // Toujours générer des données de démonstration pour l'instant
    const days = 30;
    const data = [];
    const comparisonData = [];
    
    // Générer des données réalistes avec une tendance
    for (let i = 0; i < days; i++) {
      const baseValue = 50 + Math.sin(i * 0.2) * 15; // Courbe sinusoïdale
      const variation = (Math.random() - 0.5) * 10;
      const value = Math.max(0, Math.min(100, baseValue + variation));
      data.push(value);
      
      // Données de comparaison légèrement différentes
      const compValue = baseValue * 0.9 + variation * 0.8;
      comparisonData.push(Math.max(0, Math.min(100, compValue)));
    }
    
    console.log('📊 Chart data generated:', { data: data.slice(0, 5), comparisonData: comparisonData.slice(0, 5) });
    return { data, comparisonData };
  };

  // Obtenir les données du KPI sélectionné
  const currentKPI = analyticsData[selectedKPI];
  const comparisonKPI = analyticsData.comparison?.[selectedKPI];
  const config = kpiConfig[selectedKPI];
  
  // Calculer le changement pour le KPI sélectionné
  const change = currentKPI?.changePercent || 0;
  
  // Générer les données de courbe
  const chartData = getChartData(selectedKPI);
  
  // Log pour débogage
  console.log('🎯 Selected KPI:', selectedKPI);
  console.log('📈 Chart data points:', chartData.data.length);
  console.log('🎨 Config color:', config?.color);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
      {/* En-tête avec onglets KPIs */}
      <div className="border-b border-[#E5E4DF]">
        <div className="flex">
          {Object.entries(kpiConfig).map(([key, config]) => {
            const kpiData = analyticsData[key];
            const comparisonData = analyticsData.comparison?.[key];
            
            const changeValue = kpiData?.changePercent || 0;
            const isSelected = selectedKPI === key;
            const Icon = config.icon;

            return (
              <button
                key={key}
                onClick={() => setSelectedKPI(key)}
                className={`flex-1 px-4 py-3 text-left transition-colors ${
                  isSelected 
                    ? 'bg-[#F8F9FA] border-b-2 border-black' 
                    : 'hover:bg-[#FAFAF7]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-[#666663]'}`} />
                    <span className={`text-sm font-medium ${isSelected ? 'text-black' : 'text-[#666663]'}`}>
                      {config.title}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${isSelected ? 'text-black' : 'text-[#191919]'}`}>
                      {config.format(kpiData)}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {changeValue !== 0 ? (
                        <>
                          {changeValue > 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                          <span className={changeValue > 0 ? 'text-green-600' : 'text-red-600'}>
                            {Math.abs(changeValue).toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-400">—</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone de courbe */}
      <div className="p-6">
        {/* Titre de la courbe */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#191919]">
            {config?.title || 'KPI'}
          </h3>
          <p className="text-sm text-[#666663]">
            Évolution sur les 30 derniers jours
          </p>
        </div>

        {/* Graphique simple - Style KPICard exact */}
        <div className="h-20 mt-auto">
          <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
            {/* Courbe principale (période actuelle) */}
            <polyline
              fill="none"
              stroke={config?.color || '#3B82F6'}
              strokeWidth="2"
              points={chartData.data.map((val, i) => `${(i / (chartData.data.length - 1)) * 300},${80 - (val / 100) * 80}`).join(' ')}
            />
            
            {/* Courbe de comparaison (pointillée) */}
            <polyline
              fill="none"
              stroke={config?.color || '#3B82F6'}
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.7"
              points={chartData.comparisonData.map((val, i) => `${(i / (chartData.comparisonData.length - 1)) * 300},${80 - (val / 100) * 80}`).join(' ')}
            />
          </svg>
        </div>

        {/* Légende */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config?.color || '#3B82F6' }}></div>
            <span className="text-sm text-[#666663]">Période actuelle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: config?.color || '#3B82F6' }}></div>
            <span className="text-sm text-[#666663]">
              {comparisonType === 'previous' ? 'Période précédente' : 'Même période l\'an dernier'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};