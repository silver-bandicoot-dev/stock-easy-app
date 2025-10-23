import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { KPICard } from '../features/KPICard/KPICard';
import { DateRangePicker } from './DateRangePicker';
import { ComparisonSelector } from './ComparisonSelector';
import { ChartModal } from '../features/ChartModal/ChartModal';
import { useAnalytics } from '../../hooks/useAnalytics';

export const AnalyticsTab = ({
  products,
  orders,
  suppliers,
  warehouses
}) => {
  // États locaux pour les contrôles d'analytics
  const [dateRange, setDateRange] = useState('30d');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [comparisonType, setComparisonType] = useState('same_last_year');
  
  // États pour le modal de graphique
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [chartModalOpen, setChartModalOpen] = useState(false);

  // Utiliser le hook useAnalytics pour calculer les KPIs
  const analyticsData = useAnalytics(products, orders, dateRange, customRange, comparisonType);

  // Configuration des KPIs avec leurs métadonnées
  const kpiTitles = {
    skuAvailability: 'Taux de Disponibilité des SKU',
    inventoryValuation: 'Valeur de l\'Inventaire',
    salesLost: 'Ventes Perdues - Rupture de Stock',
    overstockCost: 'Valeur Surstocks Profonds'
  };

  // Fonction pour ouvrir le modal de graphique
  const openChartModal = (kpiKey) => {
    setSelectedKPI(kpiKey);
    setChartModalOpen(true);
  };

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* En-tête avec contrôles - Version compacte */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#191919]">Indicateurs Clés de l'Inventaire</h2>
            <p className="text-sm text-[#666663] mt-1">
              KPIs ayant un impact direct sur vos résultats financiers
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
          </div>
          
          <div className="flex-1">
            <ComparisonSelector
              value={comparisonType}
              onChange={setComparisonType}
              disabled={dateRange === 'custom'}
            />
          </div>
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
          <p className="text-red-700">Erreur: {analyticsData.error}</p>
        </div>
      ) : (
        <>
          {/* Indicateurs Clés de l'Inventaire */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Taux de Disponibilité des SKU"
              value={analyticsData.skuAvailability.value}
              change={analyticsData.skuAvailability.change}
              changePercent={analyticsData.skuAvailability.changePercent}
              trend={analyticsData.skuAvailability.trend}
              description={analyticsData.skuAvailability.description}
              chartData={analyticsData.skuAvailability.chartData}
              comparisonPeriod={analyticsData.skuAvailability.comparisonPeriod}
              onClick={() => openChartModal('skuAvailability')}
            />
            
            <KPICard
              title="Valeur de l'Inventaire"
              value={analyticsData.inventoryValuation.value}
              change={analyticsData.inventoryValuation.change}
              changePercent={analyticsData.inventoryValuation.changePercent}
              trend={analyticsData.inventoryValuation.trend}
              description={analyticsData.inventoryValuation.description}
              chartData={analyticsData.inventoryValuation.chartData}
              comparisonPeriod={analyticsData.inventoryValuation.comparisonPeriod}
              onClick={() => openChartModal('inventoryValuation')}
            />
            
            <KPICard
              title="Ventes Perdues - Rupture de Stock"
              value={analyticsData.salesLost.value}
              change={analyticsData.salesLost.change}
              changePercent={analyticsData.salesLost.changePercent}
              trend={analyticsData.salesLost.trend}
              description={analyticsData.salesLost.description}
              chartData={analyticsData.salesLost.chartData}
              comparisonPeriod={analyticsData.salesLost.comparisonPeriod}
              onClick={() => openChartModal('salesLost')}
            />
            
            <KPICard
              title="Valeur Surstocks Profonds"
              value={analyticsData.overstockCost.value}
              change={analyticsData.overstockCost.change}
              changePercent={analyticsData.overstockCost.changePercent}
              trend={analyticsData.overstockCost.trend}
              description={analyticsData.overstockCost.description}
              chartData={analyticsData.overstockCost.chartData}
              comparisonPeriod={analyticsData.overstockCost.comparisonPeriod}
              onClick={() => openChartModal('overstockCost')}
            />
          </div>

          {/* Section Insights Actionnables */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
            <h3 className="text-xl font-bold text-[#191919] mb-4">Insights Actionnables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Insight 1: Disponibilité */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Disponibilité des SKU</h4>
                <p className="text-sm text-blue-800">
                  {analyticsData.skuAvailability.rawValue > 80 
                    ? "Excellent taux de disponibilité ! Vos clients peuvent compter sur vous."
                    : analyticsData.skuAvailability.rawValue > 60
                    ? "Bon taux de disponibilité, mais il y a de la marge d'amélioration."
                    : "Attention ! Votre taux de disponibilité est faible. Risque de perte de ventes."
                  }
                </p>
              </div>

              {/* Insight 2: Ventes Perdues */}
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">Ventes Perdues</h4>
                <p className="text-sm text-red-800">
                  {analyticsData.salesLost.rawValue < 1000
                    ? "Faibles pertes de ventes. Votre gestion des stocks est efficace."
                    : analyticsData.salesLost.rawValue < 5000
                    ? "Pertes de ventes modérées. Surveillez vos points de commande."
                    : "Pertes de ventes importantes ! Revoyez votre stratégie de réapprovisionnement."
                  }
                </p>
              </div>

              {/* Insight 3: Surstocks */}
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">Surstocks</h4>
                <p className="text-sm text-orange-800">
                  {analyticsData.overstockCost.rawValue < 2000
                    ? "Faible niveau de surstock. Votre optimisation est efficace."
                    : analyticsData.overstockCost.rawValue < 10000
                    ? "Surstock modéré. Surveillez vos niveaux de sécurité."
                    : "Surstock important ! Optimisez vos points de commande et niveaux de sécurité."
                  }
                </p>
              </div>

              {/* Insight 4: Valeur Inventaire */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Valeur de l'Inventaire</h4>
                <p className="text-sm text-green-800">
                  {analyticsData.inventoryValuation.rawValue > 100000
                    ? "Inventaire de grande valeur. Surveillez attentivement les rotations."
                    : analyticsData.inventoryValuation.rawValue > 50000
                    ? "Inventaire de valeur modérée. Maintenez un bon équilibre."
                    : "Inventaire de faible valeur. Opportunité d'augmenter les stocks."
                  }
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de graphique détaillé */}
      {chartModalOpen && selectedKPI && (
        <ChartModal
          isOpen={chartModalOpen}
          onClose={() => setChartModalOpen(false)}
          title={kpiTitles[selectedKPI]}
          kpiData={analyticsData[selectedKPI]}
        />
      )}

    </motion.div>
  );
};