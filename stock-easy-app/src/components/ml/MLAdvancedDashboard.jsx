/**
 * Dashboard ML avancé avec visualisations et analytics
 * @module components/ml/MLAdvancedDashboard
 */

import React, { useState } from 'react';
import { 
  Brain, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Loader,
  TrendingUp,
  Save,
  Calendar
} from 'lucide-react';
import { useDemandForecast } from '../../hooks/ml/useDemandForecast';
import { collectSalesHistory } from '../../services/ml/dataCollector';
import { ForecastTrendChart } from './ForecastTrendChart';
import { DemandHeatmap } from './DemandHeatmap';
import { PredictionVsReality } from './PredictionVsReality';
import { MLAlertPanel } from './MLAlertPanel';

export function MLAdvancedDashboard({ products }) {
  const {
    forecasts,
    isTraining,
    isReady,
    error,
    trainingProgress,
    retrain,
    getForecastForProduct,
    savePredictionsForTracking,
    compareWithReality
  } = useDemandForecast(products);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [forecastPeriod, setForecastPeriod] = useState(30); // 7, 30, 60, 90 jours

  // Charger l'historique des ventes au montage
  React.useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await collectSalesHistory();
        setSalesHistory(history);
      } catch (err) {
        console.error('Erreur chargement historique:', err);
      }
    };
    loadHistory();
  }, []);

  // Top produits par ventes
  const topProducts = [...products]
    .sort((a, b) => (b.salesPerDay || 0) - (a.salesPerDay || 0))
    .slice(0, 5);

  // Sélectionner le premier produit par défaut
  React.useEffect(() => {
    if (!selectedProduct && topProducts.length > 0) {
      setSelectedProduct(topProducts[0]);
    }
  }, [topProducts, selectedProduct]);

  const forecast = selectedProduct ? getForecastForProduct(selectedProduct.sku) : null;
  const productHistory = salesHistory.filter(s => s.sku === selectedProduct?.sku);
  
  // Données de comparaison (si disponibles)
  const comparisonData = selectedProduct 
    ? compareWithReality(selectedProduct.sku, productHistory)
    : [];

  // Obtenir les prévisions selon la période sélectionnée
  const getForecastByPeriod = () => {
    if (!forecast) return [];
    
    switch (forecastPeriod) {
      case 7: return forecast.next7Days || [];
      case 30: return forecast.next30Days || [];
      case 60: return forecast.next60Days || [];
      case 90: return forecast.next90Days || [];
      default: return forecast.next30Days || [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#191919]">
                Prévisions IA Avancées
              </h2>
              <p className="text-sm text-[#666663]">
                Analytics et visualisations des prévisions de demande
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={savePredictionsForTracking}
              disabled={!isReady || Object.keys(forecasts).length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Sauvegarder les prévisions pour comparaison future"
            >
              <Save className="w-4 h-4" />
              Sauvegarder
            </button>
            
            <button
              onClick={retrain}
              disabled={isTraining}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isTraining ? 'animate-spin' : ''}`} />
              {isTraining ? 'Entraînement...' : 'Réentraîner'}
            </button>
          </div>
        </div>

        {/* Statut */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isTraining && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-purple-600">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="font-medium">Entraînement en cours...</span>
              <span className="text-sm">({trainingProgress}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${trainingProgress}%` }}
              />
            </div>
          </div>
        )}

        {isReady && !isTraining && !error && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-4">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">
              Modèle prêt - {Object.keys(forecasts).length} produits analysés
            </span>
          </div>
        )}

        {/* Sélection du produit */}
        {isReady && topProducts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[#191919] mb-2">
              Produit à analyser
            </label>
            <select
              value={selectedProduct?.sku || ''}
              onChange={(e) => {
                const product = products.find(p => p.sku === e.target.value);
                setSelectedProduct(product);
              }}
              className="w-full px-4 py-2 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {topProducts.map(product => (
                <option key={product.sku} value={product.sku}>
                  {product.name} ({product.sku}) - {product.salesPerDay?.toFixed(1) || 0} ventes/jour
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sélection de la période de prévision */}
        {isReady && forecast && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-[#191919] mb-2">
              Période de prévision
            </label>
            <div className="flex gap-2">
              {[7, 30, 60, 90].map(days => (
                <button
                  key={days}
                  onClick={() => setForecastPeriod(days)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    forecastPeriod === days
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#E5E4DF]'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {days} jours
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alertes et Recommandations */}
      {isReady && Object.keys(forecasts).length > 0 && (
        <MLAlertPanel
          products={products}
          forecasts={forecasts}
          onOrderClick={(sku, quantity) => {
            console.log(`Commander ${quantity} unités de ${sku}`);
            // TODO: Intégrer avec le système de commande
          }}
        />
      )}

      {/* Visualisations */}
      {isReady && selectedProduct && forecast && (
        <>
          {/* Graphique de tendances */}
          <ForecastTrendChart
            product={selectedProduct}
            forecast30Days={getForecastByPeriod()}
            historicalData={productHistory}
          />

          {/* Grid de 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Heatmap par jour */}
            <DemandHeatmap
              salesHistory={productHistory}
              product={selectedProduct}
            />

            {/* Comparaison prévisions vs réalité */}
            <PredictionVsReality
              comparisonData={comparisonData}
              product={selectedProduct}
            />
          </div>

          {/* Résumé des prévisions multi-périodes */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
            <h3 className="text-xl font-bold text-[#191919] mb-4">
              📅 Prévisions Multi-Périodes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ForecastSummaryCard
                period="7 jours"
                average={forecast.averagePredicted?.toFixed(1) || 0}
                total={forecast.next7Days?.reduce((a, b) => a + b, 0) || 0}
                trend={forecast.trend}
              />
              <ForecastSummaryCard
                period="30 jours"
                average={forecast.avg30Days?.toFixed(1) || 0}
                total={forecast.next30Days?.reduce((a, b) => a + b, 0) || 0}
                trend={forecast.next30Days?.at(-1) > forecast.next30Days?.at(0) ? 'up' : 'down'}
              />
              <ForecastSummaryCard
                period="60 jours"
                average={forecast.avg60Days?.toFixed(1) || 0}
                total={forecast.next60Days?.reduce((a, b) => a + b, 0) || 0}
                trend={forecast.next60Days?.at(-1) > forecast.next60Days?.at(0) ? 'up' : 'down'}
              />
              <ForecastSummaryCard
                period="90 jours"
                average={forecast.avg90Days?.toFixed(1) || 0}
                total={forecast.next90Days?.reduce((a, b) => a + b, 0) || 0}
                trend={forecast.next90Days?.at(-1) > forecast.next90Days?.at(0) ? 'up' : 'down'}
              />
            </div>
          </div>
        </>
      )}

      {/* Message si pas de données */}
      {isReady && !selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 text-center py-12">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50 text-[#666663]" />
          <p className="text-[#666663]">Sélectionnez un produit pour voir les prévisions détaillées</p>
        </div>
      )}

      {!isReady && !isTraining && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-blue-500" />
          <p className="text-[#191919] font-medium mb-2">Modèle pas encore entraîné</p>
          <p className="text-sm text-[#666663]">Cliquez sur "Réentraîner" pour générer des prévisions</p>
        </div>
      )}
    </div>
  );
}

/**
 * Carte résumé de prévision pour une période
 */
function ForecastSummaryCard({ period, average, total, trend }) {
  return (
    <div className="border border-[#E5E4DF] rounded-lg p-4 hover:shadow-md transition-shadow">
      <p className="text-sm text-[#666663] mb-2">{period}</p>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold text-[#191919]">{average}</span>
        <span className="text-xs text-[#666663]">unités/j</span>
      </div>
      <p className="text-sm text-[#666663] mb-2">Total: {total} unités</p>
      <div className={`flex items-center gap-1 text-xs ${
        trend === 'up' ? 'text-green-600' : 'text-red-600'
      }`}>
        <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
        <span>{trend === 'up' ? 'En hausse' : 'En baisse'}</span>
      </div>
    </div>
  );
}

