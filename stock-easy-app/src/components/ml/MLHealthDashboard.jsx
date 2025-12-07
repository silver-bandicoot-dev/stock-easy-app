/**
 * Dashboard de Santé du Machine Learning
 * 
 * Affiche les métriques de performance ML en temps réel
 * 
 * @module components/ml/MLHealthDashboard
 */

import React, { useMemo } from 'react';
import { 
  Activity, 
  Brain, 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  HardDrive,
  BarChart3,
  Settings,
  PlayCircle
} from 'lucide-react';
import { useMLMonitoring } from '../../hooks/useMLMonitoring';
import { useTranslation } from 'react-i18next';

/**
 * Dashboard principal de santé ML
 */
export function MLHealthDashboard({ onEvaluate, onRetrain, model, salesHistory }) {
  const { t } = useTranslation();
  const [actionFeedback, setActionFeedback] = React.useState(null);
  
  const { 
    metrics, 
    refresh, 
    triggerEvaluation, 
    triggerRetraining, 
    clearAllCaches,
    isHealthy 
  } = useMLMonitoring();

  // Affiche un message de feedback temporaire
  const showFeedback = (message, type = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Traduire les recommandations venant du service
  const translateRecommendation = (rec) => {
    if (!rec || !rec.message) return rec;
    
    // Traduire les messages courants du service autoRetraining
    if (rec.message.includes('No evaluation performed')) {
      return {
        ...rec,
        message: t('analytics.mlHealth.recommendations.noEvaluation')
      };
    }
    if (rec.message.includes('Model performance degraded')) {
      const mapeMatch = rec.message.match(/MAPE: (\d+(?:\.\d+)?|null)/);
      const mape = mapeMatch ? mapeMatch[1] : 'N/A';
      return {
        ...rec,
        message: t('analytics.mlHealth.recommendations.performanceDegraded', { mape })
      };
    }
    if (rec.message.includes('Retraining will be available')) {
      const dateMatch = rec.message.match(/after (.+)$/);
      const date = dateMatch ? dateMatch[1] : '';
      return {
        ...rec,
        message: t('analytics.mlHealth.recommendations.retrainingScheduled', { date })
      };
    }
    if (rec.message.includes('Model performing well')) {
      const accuracyMatch = rec.message.match(/Accuracy: (\d+(?:\.\d+)?)%/);
      const accuracy = accuracyMatch ? accuracyMatch[1] : 'N/A';
      return {
        ...rec,
        message: t('analytics.mlHealth.recommendations.goodPerformance', { accuracy })
      };
    }
    
    return rec;
  };

  // Recommandations traduites (filtrer les doublons déjà dans alerts)
  const translatedRecommendations = useMemo(() => {
    return metrics.recommendations.map(translateRecommendation);
  }, [metrics.recommendations, t]);

  // Les boutons fonctionnent toujours - soit via props, soit via actions par défaut
  const handleRefresh = async () => {
    try {
      console.log('🔄 MLHealthDashboard: Rafraîchissement...');
      await refresh();
      showFeedback(`✅ ${t('analytics.mlHealth.feedback.refreshed')}`);
    } catch (error) {
      console.error('❌ Erreur rafraîchissement:', error);
      showFeedback(`❌ ${t('analytics.mlHealth.feedback.error')}: ${error.message}`, 'error');
    }
  };

  const handleClearCaches = () => {
    try {
      console.log('🗑️ MLHealthDashboard: Vidage des caches...');
      clearAllCaches();
      showFeedback(`✅ ${t('analytics.mlHealth.feedback.cachesCleared')}`);
    } catch (error) {
      console.error('❌ Erreur vidage caches:', error);
      showFeedback(`❌ ${t('analytics.mlHealth.feedback.error')}: ${error.message}`, 'error');
    }
  };

  const handleEvaluate = async () => {
    try {
      console.log('📊 MLHealthDashboard: Évaluation...');
      if (onEvaluate) {
        onEvaluate();
        showFeedback(`✅ ${t('analytics.mlHealth.feedback.evaluationStarted')}`);
      } else if (model && salesHistory) {
        await triggerEvaluation(model, salesHistory);
        showFeedback(`✅ ${t('analytics.mlHealth.feedback.modelEvaluated')}`);
      } else {
        // Action par défaut : rafraîchir les métriques
        await refresh();
        showFeedback(`✅ ${t('analytics.mlHealth.feedback.metricsRefreshed')}`);
      }
    } catch (error) {
      console.error('❌ Erreur évaluation:', error);
      showFeedback(`❌ ${t('analytics.mlHealth.feedback.error')}: ${error.message}`, 'error');
    }
  };

  const handleRetrain = async () => {
    try {
      console.log('🔁 MLHealthDashboard: Recalcul...');
      if (onRetrain) {
        onRetrain();
        showFeedback(`✅ ${t('analytics.mlHealth.feedback.retrainingStarted')}`);
      } else if (model && salesHistory) {
        await triggerRetraining(model, salesHistory);
        showFeedback(`✅ ${t('analytics.mlHealth.feedback.modelRetrained')}`);
      } else {
        // Action par défaut : vider les caches pour forcer un recalcul
        clearAllCaches();
        await refresh();
        showFeedback(`✅ ${t('analytics.mlHealth.feedback.cachesRecalculated')}`);
      }
    } catch (error) {
      console.error('❌ Erreur recalcul:', error);
      showFeedback(`❌ ${t('analytics.mlHealth.feedback.error')}: ${error.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback des actions */}
      {actionFeedback && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-pulse ${
          actionFeedback.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {actionFeedback.type === 'error' ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{actionFeedback.message}</span>
        </div>
      )}

      {/* En-tête avec score global */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              isHealthy ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Brain className={`w-6 h-6 ${
                isHealthy ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#191919]">
                {t('analytics.mlHealth.title')}
              </h2>
              <p className="text-sm text-[#666663]">
                {t('analytics.mlHealth.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={metrics.isLoading}
              className="p-2 rounded-lg border border-[#E5E4DF] hover:bg-[#FAFAF7] transition-colors disabled:opacity-50"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-5 h-5 text-[#666663] ${metrics.isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleClearCaches}
              disabled={metrics.isLoading}
              className="p-2 rounded-lg border border-[#E5E4DF] hover:bg-[#FAFAF7] transition-colors disabled:opacity-50"
              title="Vider les caches"
            >
              <HardDrive className="w-5 h-5 text-[#666663]" />
            </button>
          </div>
        </div>

        {/* Score de santé global */}
        <HealthScoreCard 
          score={metrics.healthScore} 
          status={metrics.healthStatus}
          lastRefresh={metrics.lastRefresh}
        />
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={BarChart3}
          label={t('analytics.mlHealth.accuracy')}
          value={metrics.accuracy !== null ? `${metrics.accuracy}%` : '--'}
          status={getAccuracyStatus(metrics.accuracy)}
          subtitle={t('analytics.mlHealth.accuracySubtitle')}
        />
        <MetricCard
          icon={TrendingDown}
          label={t('analytics.mlHealth.mape')}
          value={metrics.mape !== null ? `${metrics.mape}%` : '--'}
          status={getMAPEStatus(metrics.mape)}
          subtitle={t('analytics.mlHealth.mapeSubtitle')}
          inverted
        />
        <MetricCard
          icon={Database}
          label={t('analytics.mlHealth.features')}
          value={metrics.featuresCount}
          status="neutral"
          subtitle={t('analytics.mlHealth.featuresSubtitle')}
        />
        <MetricCard
          icon={Zap}
          label={t('analytics.mlHealth.cacheHit')}
          value={`${metrics.cacheHitRate}%`}
          status={getCacheStatus(metrics.cacheHitRate)}
          subtitle={t('analytics.mlHealth.cacheHitSubtitle')}
        />
      </div>

      {/* Alertes et Recommandations */}
      {(metrics.alerts.length > 0 || translatedRecommendations.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <h3 className="text-lg font-bold text-[#191919] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            {t('analytics.mlHealth.alertsTitle')}
          </h3>
          
          <div className="space-y-3">
            {/* Alertes (déjà en français depuis useMLMonitoring) */}
            {metrics.alerts.map(alert => (
              <AlertItem 
                key={alert.id} 
                alert={alert}
                onAction={alert.action === 'evaluate' ? handleEvaluate : 
                         alert.action === 'retraining' ? handleRetrain : null}
                actionLabel={t('analytics.mlHealth.alerts.fix')}
              />
            ))}
            
            {/* Recommandations traduites */}
            {translatedRecommendations.map(rec => (
              <RecommendationItem key={rec.type} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Actions et Contrôles */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-lg font-bold text-[#191919] mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#666663]" />
          {t('analytics.mlHealth.actionsTitle')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            icon={PlayCircle}
            title={t('analytics.mlHealth.evaluateTitle')}
            description={t('analytics.mlHealth.evaluateDesc')}
            buttonText={t('analytics.mlHealth.evaluateButton')}
            onClick={handleEvaluate}
            disabled={metrics.isLoading}
            variant="primary"
          />
          <ActionCard
            icon={RefreshCw}
            title={t('analytics.mlHealth.recalculateTitle')}
            description={t('analytics.mlHealth.recalculateDesc')}
            buttonText={t('analytics.mlHealth.recalculateButton')}
            onClick={handleRetrain}
            disabled={metrics.isLoading}
            variant="secondary"
          />
        </div>
      </div>

      {/* Détails techniques */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-lg font-bold text-[#191919] mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#666663]" />
          {t('analytics.mlHealth.technicalDetails')}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TechStat 
            label={t('analytics.mlHealth.lastEvaluation')} 
            value={metrics.lastEvaluation ? formatRelativeTime(metrics.lastEvaluation, t) : t('analytics.mlHealth.never')}
          />
          <TechStat 
            label={t('analytics.mlHealth.lastRetraining')} 
            value={metrics.lastRetraining ? formatRelativeTime(metrics.lastRetraining, t) : t('analytics.mlHealth.never')}
          />
          <TechStat 
            label={t('analytics.mlHealth.status')} 
            value={getStatusLabel(metrics.retrainingStatus, t)}
            highlight={metrics.retrainingStatus !== 'idle'}
          />
          <TechStat 
            label={t('analytics.mlHealth.autoRetraining')} 
            value={metrics.isRetrainingEnabled ? t('analytics.mlHealth.enabled') : t('analytics.mlHealth.disabled')}
          />
        </div>

        {/* Historique des réentraînements */}
        {metrics.retrainingHistory.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#E5E4DF]">
            <h4 className="text-sm font-semibold text-[#666663] mb-3">
              {t('analytics.mlHealth.retrainingHistory')}
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {metrics.retrainingHistory.slice().reverse().map((entry, index) => (
                <HistoryEntry key={index} entry={entry} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// SOUS-COMPOSANTS
// ========================================

/**
 * Carte de score de santé
 */
function HealthScoreCard({ score, status, lastRefresh }) {
  const statusConfig = {
    excellent: { color: 'text-green-600', bg: 'bg-green-100', label: 'Excellent' },
    good: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Bon' },
    warning: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'À surveiller' },
    critical: { color: 'text-red-600', bg: 'bg-red-100', label: 'Critique' }
  };
  
  const config = statusConfig[status] || statusConfig.good;

  return (
    <div className={`${config.bg} rounded-xl p-6 flex items-center justify-between`}>
      <div>
        <p className="text-sm font-medium text-[#666663] mb-1">Score de Santé ML</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${config.color}`}>
            {score ?? '--'}
          </span>
          <span className="text-lg text-[#666663]">/100</span>
        </div>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>
      
      <div className="text-right">
        <div className={`w-24 h-24 rounded-full border-8 ${config.color.replace('text', 'border')} flex items-center justify-center`}>
          {status === 'excellent' || status === 'good' ? (
            <CheckCircle className={`w-10 h-10 ${config.color}`} />
          ) : (
            <AlertTriangle className={`w-10 h-10 ${config.color}`} />
          )}
        </div>
        {lastRefresh && (
          <p className="text-xs text-[#666663] mt-2">
            Mis à jour {formatRelativeTime(lastRefresh)}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Carte de métrique
 */
function MetricCard({ icon: Icon, label, value, status, subtitle, inverted = false }) {
  const statusColors = {
    good: inverted ? 'text-green-600' : 'text-green-600',
    warning: 'text-orange-600',
    bad: inverted ? 'text-red-600' : 'text-red-600',
    neutral: 'text-[#191919]'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-[#666663]" />
        <span className="text-sm font-medium text-[#666663]">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${statusColors[status]}`}>
        {value}
      </p>
      <p className="text-xs text-[#666663] mt-1">{subtitle}</p>
    </div>
  );
}

/**
 * Item d'alerte
 */
function AlertItem({ alert, onAction, actionLabel = 'Corriger' }) {
  const typeConfig = {
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertTriangle },
    warning: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: AlertTriangle },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: Activity }
  };

  const config = typeConfig[alert.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 flex items-start gap-3`}>
      <Icon className={`w-5 h-5 ${config.text} shrink-0 mt-0.5`} />
      <div className="flex-1">
        <p className={`font-semibold ${config.text}`}>{alert.title}</p>
        <p className="text-sm text-[#666663] mt-1">{alert.message}</p>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className={`px-3 py-1 text-sm font-medium rounded-lg ${config.text} hover:bg-white/50 transition-colors`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Item de recommandation
 */
function RecommendationItem({ recommendation }) {
  const priorityConfig = {
    high: 'border-l-red-500',
    medium: 'border-l-orange-500',
    info: 'border-l-blue-500'
  };

  return (
    <div className={`bg-[#FAFAF7] border border-[#E5E4DF] border-l-4 ${priorityConfig[recommendation.priority]} rounded-lg p-4`}>
      <p className="font-medium text-[#191919]">{recommendation.message}</p>
    </div>
  );
}

/**
 * Carte d'action
 */
function ActionCard({ icon: Icon, title, description, buttonText, onClick, disabled, variant }) {
  const variants = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-[#191919] hover:bg-[#333333] text-white'
  };

  return (
    <div className="bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-white rounded-lg border border-[#E5E4DF]">
          <Icon className="w-5 h-5 text-[#666663]" />
        </div>
        <div>
          <p className="font-semibold text-[#191919]">{title}</p>
          <p className="text-sm text-[#666663]">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
      >
        {buttonText}
      </button>
    </div>
  );
}

/**
 * Statistique technique
 */
function TechStat({ label, value, highlight = false }) {
  return (
    <div className="bg-[#FAFAF7] rounded-lg p-3">
      <p className="text-xs text-[#666663] mb-1">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-purple-600' : 'text-[#191919]'}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * Entrée d'historique
 */
function HistoryEntry({ entry }) {
  const date = new Date(entry.timestamp);
  
  return (
    <div className="flex items-center justify-between text-sm bg-[#FAFAF7] rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${entry.success ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-[#666663]">
          {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <div className="text-right">
        {entry.success ? (
          <span className="text-green-600">
            MAPE: {entry.newMAPE ?? entry.previousMAPE ?? '--'}%
          </span>
        ) : (
          <span className="text-red-600">Échec</span>
        )}
      </div>
    </div>
  );
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function getAccuracyStatus(accuracy) {
  if (accuracy === null) return 'neutral';
  if (accuracy >= 85) return 'good';
  if (accuracy >= 70) return 'warning';
  return 'bad';
}

function getMAPEStatus(mape) {
  if (mape === null) return 'neutral';
  if (mape <= 10) return 'good';
  if (mape <= 20) return 'warning';
  return 'bad';
}

function getCacheStatus(hitRate) {
  if (hitRate >= 70) return 'good';
  if (hitRate >= 50) return 'warning';
  return 'bad';
}

function getStatusLabel(status, t) {
  if (t) {
    const key = `analytics.mlHealth.statusLabels.${status}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  
  // Fallback si pas de traduction
  const labels = {
    idle: 'En attente',
    evaluating: 'Évaluation...',
    training: 'Entraînement...',
    validating: 'Validation...'
  };
  return labels[status] || status;
}

function formatRelativeTime(timestamp, t) {
  if (!timestamp) return '';
  
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(seconds / 86400);
  
  // Utiliser des traductions si disponibles, sinon fallback français
  if (seconds < 60) {
    return t ? t('common.justNow', 'à l\'instant') : 'à l\'instant';
  }
  if (seconds < 3600) {
    return t ? t('common.minutesAgo', { count: minutes }, `il y a ${minutes} min`) : `il y a ${minutes} min`;
  }
  if (seconds < 86400) {
    return t ? t('common.hoursAgo', { count: hours }, `il y a ${hours}h`) : `il y a ${hours}h`;
  }
  return t ? t('common.daysAgo', { count: days }, `il y a ${days}j`) : `il y a ${days}j`;
}

export default MLHealthDashboard;

