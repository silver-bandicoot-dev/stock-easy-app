/**
 * Dashboard des insights ML
 * @module components/ml/MLInsightsDashboard
 */

import React, { Component } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { useDemandForecast } from '../../hooks/ml/useDemandForecast';
import { InfoTooltip } from '../ui/InfoTooltip';

// Error Boundary pour capturer les erreurs
class MLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Erreur dans MLInsightsDashboard:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#191919]">
                Prévisions IA
              </h2>
              <p className="text-sm text-red-600">
                Une erreur s'est produite
              </p>
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-[#666663] mb-2">Le module ML n'a pas pu se charger</p>
            <p className="text-sm text-[#666663]">
              Erreur: {this.state.error?.message || 'Inconnue'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MLInsightsDashboardInner({ products }) {
  const {
    forecasts,
    isTraining,
    isReady,
    error,
    trainingProgress,
    retrain,
    getForecastForProduct
  } = useDemandForecast(products);

  // Protection si products n'est pas défini
  if (!products || !Array.isArray(products) || products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#191919]">
              Prévisions IA
            </h2>
            <p className="text-sm text-[#666663]">
              Prédictions intelligentes de la demande
            </p>
          </div>
        </div>
        <div className="text-center py-8 text-[#666663]">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Chargement des produits...</p>
          <p className="text-sm">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  // Top 3 produits par ventes
  const topProducts = [...products]
    .sort((a, b) => (b.salesPerDay || 0) - (a.salesPerDay || 0))
    .slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#191919]">
              Prévisions IA
            </h2>
            <p className="text-sm text-[#666663]">
              Prédictions intelligentes de la demande
            </p>
          </div>
        </div>

        {/* Bouton réentraîner */}
        <button
          onClick={retrain}
          disabled={isTraining}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isTraining ? 'animate-spin' : ''}`} />
          {isTraining ? 'Entraînement...' : 'Réentraîner'}
        </button>
      </div>

      {/* Statut */}
      <div className="mb-6">
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isTraining && (
          <div className="space-y-2">
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
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">Modèle prêt - {Object.keys(forecasts).length} produits analysés</span>
          </div>
        )}

        {!isReady && !isTraining && !error && (
          <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Cliquez sur "Réentraîner" pour générer des prévisions</span>
          </div>
        )}
      </div>

      {/* Prévisions Top 3 */}
      {isReady && Object.keys(forecasts).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#191919] mb-4">
            📈 Top 3 Produits - Prévisions 7 Jours
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topProducts.map(product => {
              const forecast = getForecastForProduct(product.sku);
              
              if (!forecast) return null;

              return (
                <ForecastCard
                  key={product.sku}
                  product={product}
                  forecast={forecast}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Message si pas de données */}
      {isReady && Object.keys(forecasts).length === 0 && (
        <div className="text-center py-8 text-[#666663]">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucune prévision disponible</p>
          <p className="text-sm">Réentraînez le modèle pour générer des prévisions</p>
        </div>
      )}
    </div>
  );
}

/**
 * Carte de prévision pour un produit
 */
function ForecastCard({ product, forecast }) {
  const isUpTrend = forecast.trend === 'up';
  const confidenceColor = 
    forecast.confidence >= 80 ? 'text-green-600' :
    forecast.confidence >= 60 ? 'text-yellow-600' :
    'text-red-600';

  return (
    <div className="border border-[#E5E4DF] rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Nom produit */}
      <div className="mb-3">
        <p className="text-sm text-[#666663]">{product.sku}</p>
        <p className="font-semibold text-[#191919] truncate">{product.name}</p>
      </div>

      {/* Prévision */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-[#191919]">
          {forecast.averagePredicted.toFixed(1)}
        </span>
        <span className="text-sm text-[#666663]">unités/jour</span>
      </div>

      {/* Tendance */}
      <div className={`flex items-center gap-1 mb-3 ${
        isUpTrend ? 'text-green-600' : 'text-red-600'
      }`}>
        {isUpTrend ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isUpTrend ? 'En hausse' : 'En baisse'}
        </span>
        <InfoTooltip content={tooltips.mlTrend} />
      </div>

      {/* Confiance */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <div className="flex items-center gap-1">
            <span className="text-[#666663]">Confiance</span>
            <InfoTooltip content={tooltips.mlConfidence} />
          </div>
          <span className={`font-medium ${confidenceColor}`}>
            {forecast.confidence.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full"
            style={{ width: `${forecast.confidence}%` }}
          />
        </div>
      </div>

      {/* Recommandation */}
      <div className="pt-3 border-t border-[#E5E4DF]">
        <div className="flex items-center gap-1 mb-1">
          <p className="text-xs text-[#666663]">Recommandation</p>
          <InfoTooltip content={tooltips.mlRecommendedOrder} />
        </div>
        <p className="text-sm font-semibold text-[#191919]">
          {forecast.recommendedOrder > 0 ? (
            <>Commander <span className="text-purple-600">{forecast.recommendedOrder}</span> unités</>
          ) : (
            <span className="text-green-600">Stock suffisant</span>
          )}
        </p>
      </div>
    </div>
  );
}

// Export avec Error Boundary
export function MLInsightsDashboard({ products }) {
  return (
    <MLErrorBoundary>
      <MLInsightsDashboardInner products={products} />
    </MLErrorBoundary>
  );
}

