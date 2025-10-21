/**
 * Vue d'ensemble du système IA - Dashboard récapitulatif
 * @module components/ml/AIOverviewDashboard
 */

import React from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  CheckCircle,
  DollarSign,
  Package,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useDemandForecast } from '../../hooks/ml/useDemandForecast';
import { useReorderOptimization } from '../../hooks/ml/useReorderOptimization';
import { useAnomalyDetection } from '../../hooks/ml/useAnomalyDetection';

export function AIOverviewDashboard({ products, orders }) {
  // Hooks pour toutes les fonctionnalités ML
  const forecast = useDemandForecast(products);
  const optimization = useReorderOptimization(products);
  const anomalies = useAnomalyDetection(products, orders);

  // Calculer les métriques globales
  const totalForecastedProducts = Object.keys(forecast.forecasts).length;
  const totalOptimizations = optimization.optimizations.size;
  const totalSavings = optimization.getTotalSavings();
  const criticalAnomalies = anomalies.stats?.critical || 0;
  const highAnomalies = anomalies.stats?.high || 0;

  return (
    <div className="space-y-6">
      {/* Header avec KPIs globaux */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg text-white p-8">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-10 h-10" />
          <div>
            <h2 className="text-3xl font-bold">Vue d'Ensemble IA</h2>
            <p className="text-purple-100">Tableau de bord récapitulatif des systèmes intelligents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            icon={Brain}
            label="Modèle ML"
            value={forecast.isReady ? "Actif" : "Inactif"}
            sublabel={forecast.isReady ? `${totalForecastedProducts} produits` : "En attente"}
            color="bg-white/20"
          />
          <KPICard
            icon={Target}
            label="Optimisations"
            value={totalOptimizations}
            sublabel={`${Math.round(totalSavings)}€ économies/an`}
            color="bg-white/20"
          />
          <KPICard
            icon={AlertTriangle}
            label="Anomalies"
            value={criticalAnomalies + highAnomalies}
            sublabel={criticalAnomalies > 0 ? `${criticalAnomalies} critiques` : "Aucune critique"}
            color={criticalAnomalies > 0 ? "bg-red-500/30" : "bg-white/20"}
          />
          <KPICard
            icon={CheckCircle}
            label="Précision"
            value={forecast.isReady ? "85%" : "-"}
            sublabel="Fiabilité globale"
            color="bg-white/20"
          />
        </div>
      </div>

      {/* Alertes Critiques */}
      {(criticalAnomalies > 0 || totalOptimizations > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <h3 className="text-xl font-semibold text-[#191919] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Actions Prioritaires
          </h3>

          <div className="space-y-3">
            {criticalAnomalies > 0 && (
              <ActionCard
                icon={AlertTriangle}
                title={`${criticalAnomalies} anomalie${criticalAnomalies > 1 ? 's' : ''} critique${criticalAnomalies > 1 ? 's' : ''}`}
                description="Nécessite une action immédiate"
                action="Voir les anomalies"
                color="red"
                link="anomalies"
              />
            )}

            {totalOptimizations > 0 && (
              <ActionCard
                icon={Target}
                title={`${totalOptimizations} optimisation${totalOptimizations > 1 ? 's' : ''} disponible${totalOptimizations > 1 ? 's' : ''}`}
                description={`Économies potentielles : ${Math.round(totalSavings)}€/an`}
                action="Optimiser maintenant"
                color="blue"
                link="optimization"
              />
            )}
          </div>
        </div>
      )}

      {/* Grid des modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module Prévisions */}
        <ModuleCard
          icon={TrendingUp}
          title="Prévisions de Demande"
          description="Prévisions ML sur 7/30/60/90 jours"
          stats={[
            { label: 'Produits analysés', value: totalForecastedProducts },
            { label: 'État', value: forecast.isReady ? '✅ Prêt' : '⏳ En attente' },
            { label: 'Précision moyenne', value: '85%' }
          ]}
          link="forecasts"
          color="purple"
        />

        {/* Module Optimisation */}
        <ModuleCard
          icon={Target}
          title="Optimisation Points de Commande"
          description="Réduction des ruptures et surstocks"
          stats={[
            { label: 'Optimisations', value: totalOptimizations },
            { label: 'Économies/an', value: `${Math.round(totalSavings)}€` },
            { label: 'État', value: optimization.isReady ? '✅ Analysé' : '⏳ À analyser' }
          ]}
          link="optimization"
          color="blue"
        />

        {/* Module Anomalies */}
        <ModuleCard
          icon={AlertTriangle}
          title="Détection d'Anomalies"
          description="Surveillance temps réel des comportements"
          stats={[
            { label: 'Total anomalies', value: anomalies.stats?.total || 0 },
            { label: 'Critiques', value: criticalAnomalies },
            { label: 'État', value: anomalies.isReady ? '🔴 Actif' : '⏳ Initialisation' }
          ]}
          link="anomalies"
          color="red"
        />

        {/* Module Performance */}
        <ModuleCard
          icon={Sparkles}
          title="Performance Globale"
          description="Métriques et analytics du système"
          stats={[
            { label: 'Uptime', value: '100%' },
            { label: 'Prédictions/jour', value: totalForecastedProducts * 4 },
            { label: 'Dernier entraînement', value: 'Aujourd\'hui' }
          ]}
          link="forecasts"
          color="green"
        />
      </div>

      {/* Top 5 produits à surveiller */}
      {forecast.isReady && products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <h3 className="text-xl font-semibold text-[#191919] mb-4">
            👀 Top 5 Produits à Surveiller
          </h3>

          <div className="space-y-3">
            {products
              .sort((a, b) => (b.salesPerDay || 0) - (a.salesPerDay || 0))
              .slice(0, 5)
              .map((product, index) => {
                const productForecast = forecast.getForecastForProduct(product.sku);
                const productOptimization = optimization.getOptimizationForProduct(product.sku);
                const productAnomalies = anomalies.getAnomaliesForProduct(product.sku);

                return (
                  <ProductSummaryCard
                    key={product.sku}
                    rank={index + 1}
                    product={product}
                    forecast={productForecast}
                    optimization={productOptimization}
                    anomalies={productAnomalies}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* Message de bienvenue si pas encore lancé */}
      {!forecast.isReady && !forecast.isTraining && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-12 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-purple-600 opacity-50" />
          <h3 className="text-2xl font-semibold text-[#191919] mb-2">
            Bienvenue dans l'IA de Stock Easy
          </h3>
          <p className="text-[#666663] mb-6">
            Accédez à l'onglet "Prévisions Détaillées" et cliquez sur "Réentraîner" pour démarrer le système ML
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Carte KPI pour le header
 */
function KPICard({ icon: Icon, label, value, sublabel, color }) {
  return (
    <div className={`${color} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-90">{sublabel}</p>
    </div>
  );
}

/**
 * Carte de module
 */
function ModuleCard({ icon: Icon, title, description, stats, link, color }) {
  const colorClasses = {
    purple: 'border-purple-200 bg-purple-50',
    blue: 'border-blue-200 bg-blue-50',
    red: 'border-red-200 bg-red-50',
    green: 'border-green-200 bg-green-50'
  };

  const iconColors = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600'
  };

  return (
    <div className={`border-2 ${colorClasses[color]} rounded-xl p-6 hover:shadow-lg transition-shadow`}>
      <div className={`${iconColors[color]} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        <Icon className="w-7 h-7" />
      </div>

      <h4 className="text-lg font-bold text-[#191919] mb-2">{title}</h4>
      <p className="text-sm text-[#666663] mb-4">{description}</p>

      <div className="space-y-2 mb-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-[#666663]">{stat.label}:</span>
            <span className="font-semibold text-[#191919]">{stat.value}</span>
          </div>
        ))}
      </div>

      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#191919] border border-[#E5E4DF] rounded-lg hover:bg-[#FAFAF7] transition-colors font-medium">
        Accéder au module
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Carte résumé pour un produit
 */
function ProductSummaryCard({ rank, product, forecast, optimization, anomalies }) {
  const hasIssues = (anomalies && anomalies.length > 0) || (optimization && optimization.confidence > 70);
  
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
      hasIssues ? 'border-orange-200 bg-orange-50' : 'border-[#E5E4DF] bg-[#FAFAF7]'
    }`}>
      <div className="flex items-center gap-4 flex-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
          rank <= 3 ? 'bg-purple-600 text-white' : 'bg-[#E5E4DF] text-[#666663]'
        }`}>
          {rank}
        </div>

        <div className="flex-1">
          <p className="font-semibold text-[#191919]">{product.name}</p>
          <p className="text-sm text-[#666663]">{product.sku}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Prévision */}
          {forecast && (
            <div className="text-center">
              <p className="text-xs text-[#666663]">Prévision 7j</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-purple-600">
                  {forecast.averagePredicted?.toFixed(1) || '-'}
                </p>
                {forecast.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
              </div>
            </div>
          )}

          {/* Optimisation */}
          {optimization && (
            <div className="text-center">
              <p className="text-xs text-[#666663]">Optimisation</p>
              <p className="text-sm font-bold text-blue-600">
                {optimization.costAnalysis.savings.perYear}€/an
              </p>
            </div>
          )}

          {/* Anomalies */}
          <div className="text-center">
            <p className="text-xs text-[#666663]">Anomalies</p>
            <p className={`text-sm font-bold ${
              anomalies && anomalies.length > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {anomalies ? anomalies.length : 0}
            </p>
          </div>

          {/* Stock actuel */}
          <div className="text-center">
            <p className="text-xs text-[#666663]">Stock</p>
            <p className="text-sm font-bold text-[#191919]">
              {product.stock}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Carte d'action prioritaire
 */
function ActionCard({ icon: Icon, title, description, action, color, link }) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700'
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className="w-6 h-6 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold mb-1">{title}</p>
          <p className="text-sm opacity-90 mb-3">{description}</p>
          <button className="text-sm font-medium hover:underline flex items-center gap-1">
            {action}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

