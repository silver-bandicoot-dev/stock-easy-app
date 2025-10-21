/**
 * Panneau d'alertes ML intelligentes
 * @module components/ml/MLAlertPanel
 */

import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Package,
  Clock,
  ShoppingCart
} from 'lucide-react';
import { generateMLAlerts, generateAutoRecommendations } from '../../services/ml/alertService';

export function MLAlertPanel({ products, forecasts, onOrderClick }) {
  // Générer les alertes
  const alerts = useMemo(() => {
    return generateMLAlerts(products, forecasts);
  }, [products, forecasts]);

  // Générer les recommandations
  const recommendations = useMemo(() => {
    return generateAutoRecommendations(products, forecasts);
  }, [products, forecasts]);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const totalUrgentRecommendations = recommendations.filter(r => r.urgency === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Résumé des alertes */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-xl font-bold text-[#191919] mb-4">
          Alertes Intelligentes
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <AlertSummaryCard
            icon={AlertTriangle}
            label="Critiques"
            count={criticalAlerts.length}
            color="red"
          />
          <AlertSummaryCard
            icon={AlertCircle}
            label="Importantes"
            count={highAlerts.length}
            color="orange"
          />
          <AlertSummaryCard
            icon={ShoppingCart}
            label="Commandes Urgentes"
            count={totalUrgentRecommendations}
            color="purple"
          />
        </div>

        {/* Liste des alertes */}
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.slice(0, 5).map(alert => (
              <AlertItem key={alert.id} alert={alert} onOrderClick={onOrderClick} />
            ))}
            
            {alerts.length > 5 && (
              <p className="text-sm text-[#666663] text-center pt-2">
                + {alerts.length - 5} autres alertes
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-[#666663]">
            <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune alerte pour le moment</p>
            <p className="text-sm">Vos stocks sont en bonne santé ! 🎉</p>
          </div>
        )}
      </div>

      {/* Recommandations de commande */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <h3 className="text-xl font-bold text-[#191919] mb-4">
            💡 Recommandations de Commande
          </h3>
          
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((rec, index) => (
              <RecommendationItem 
                key={rec.sku} 
                recommendation={rec} 
                index={index}
                onOrderClick={onOrderClick}
              />
            ))}
          </div>

          {recommendations.length > 5 && (
            <p className="text-sm text-[#666663] text-center pt-4 mt-4 border-t border-[#E5E4DF]">
              + {recommendations.length - 5} autres recommandations
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Carte résumé d'alertes
 */
function AlertSummaryCard({ icon: Icon, label, count, color }) {
  const colorClasses = {
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" />
        <p className="text-xs font-medium uppercase">{label}</p>
      </div>
      <p className="text-3xl font-bold">{count}</p>
    </div>
  );
}

/**
 * Item d'alerte
 */
function AlertItem({ alert, onOrderClick }) {
  const severityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: AlertTriangle,
      badge: 'bg-red-600 text-white'
    },
    high: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: AlertCircle,
      badge: 'bg-orange-600 text-white'
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: Info,
      badge: 'bg-yellow-600 text-white'
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: Info,
      badge: 'bg-blue-600 text-white'
    }
  };

  const config = severityConfig[alert.severity] || severityConfig.medium;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 ${config.text}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold">{alert.message}</p>
            <span className={`${config.badge} text-xs px-2 py-1 rounded uppercase font-medium shrink-0`}>
              {alert.severity}
            </span>
          </div>
          <p className="text-sm opacity-90 mb-2">{alert.details}</p>
          
          {alert.daysUntilStockout && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Rupture dans {alert.daysUntilStockout} jours</span>
            </div>
          )}

          {alert.recommendedOrder > 0 && onOrderClick && (
            <button
              onClick={() => onOrderClick(alert.sku, alert.recommendedOrder)}
              className="mt-3 text-sm font-medium hover:underline flex items-center gap-1"
            >
              <ShoppingCart className="w-4 h-4" />
              Commander {alert.recommendedOrder} unités
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Item de recommandation
 */
function RecommendationItem({ recommendation, index, onOrderClick }) {
  const urgencyColors = {
    urgent: 'border-l-4 border-l-red-500',
    normal: 'border-l-4 border-l-purple-500'
  };

  return (
    <div className={`bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg p-4 ${urgencyColors[recommendation.urgency]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {recommendation.urgency === 'urgent' && (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded uppercase font-medium">
                Urgent
              </span>
            )}
            <p className="font-semibold text-[#191919]">
              {index + 1}. {recommendation.productName}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm text-[#666663] mb-2">
            <div>
              <span className="font-medium">Quantité:</span> {recommendation.quantity} unités
            </div>
            <div>
              <span className="font-medium">Coût estimé:</span> {recommendation.estimatedCost.toFixed(2)}€
            </div>
            <div>
              <span className="font-medium">Fournisseur:</span> {recommendation.supplier || 'Non assigné'}
            </div>
            <div>
              <span className="font-medium">Criticité:</span> {recommendation.criticalityScore}/100
            </div>
          </div>

          <p className="text-sm text-[#666663]">
            <span className="font-medium">Raison:</span> {recommendation.reason}
          </p>
        </div>

        {onOrderClick && (
          <button
            onClick={() => onOrderClick(recommendation.sku, recommendation.quantity)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2 shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            Commander
          </button>
        )}
      </div>
    </div>
  );
}

