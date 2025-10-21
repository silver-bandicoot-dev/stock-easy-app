/**
 * Dashboard de détection d'anomalies en temps réel
 * @module components/ml/AnomalyDashboard
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Clock,
  Package,
  Truck,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader,
  Bell
} from 'lucide-react';
import { useAnomalyDetection } from '../../hooks/ml/useAnomalyDetection';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ANOMALY_TYPES } from '../../services/ml/anomalyDetector';

export function AnomalyDashboard({ products, orders }) {
  const {
    anomalies,
    stats,
    isDetecting,
    isReady,
    error,
    lastCheck,
    detectAnomalies,
    resolveAnomaly,
    getAnomaliesByType,
    getAnomaliesBySeverity
  } = useAnomalyDetection(products, orders);

  const [selectedType, setSelectedType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  // Filtrer les anomalies
  const filteredAnomalies = anomalies.filter(anomaly => {
    if (selectedType !== 'all' && anomaly.type !== selectedType) return false;
    if (selectedSeverity !== 'all' && anomaly.severity !== selectedSeverity) return false;
    return true;
  });

  // Préparer les données pour la timeline
  const timelineData = prepareTimelineData(anomalies);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#191919]">
                🚨 Détection d'Anomalies en Temps Réel
              </h2>
              <p className="text-sm text-[#666663]">
                Surveillance intelligente des comportements inhabituels
              </p>
            </div>
          </div>

          {/* Bouton Actualiser */}
          <div className="flex items-center gap-3">
            {lastCheck && (
              <span className="text-sm text-[#666663]">
                Dernière vérification : {format(lastCheck, 'HH:mm', { locale: fr })}
              </span>
            )}
            <button
              onClick={detectAnomalies}
              disabled={isDetecting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              {isDetecting ? 'Détection...' : 'Actualiser'}
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* État de détection */}
        {isDetecting && (
          <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            <Loader className="w-5 h-5 animate-spin shrink-0" />
            <span>Analyse en cours des patterns de ventes et fournisseurs...</span>
          </div>
        )}
      </div>

      {/* Statistiques d'anomalies */}
      {isReady && stats && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <h3 className="text-lg font-semibold text-[#191919] mb-4">
            📊 Résumé des Anomalies
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={AlertTriangle}
              label="Critiques"
              count={stats.critical || 0}
              color="red"
            />
            <StatCard
              icon={AlertCircle}
              label="Importantes"
              count={stats.high || 0}
              color="orange"
            />
            <StatCard
              icon={Info}
              label="Moyennes"
              count={stats.medium || 0}
              color="yellow"
            />
            <StatCard
              icon={CheckCircle}
              label="Faibles"
              count={stats.low || 0}
              color="blue"
            />
          </div>
        </div>
      )}

      {/* Timeline des anomalies */}
      {isReady && timelineData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <h3 className="text-lg font-semibold text-[#191919] mb-4">
            📈 Timeline des Anomalies (30 jours)
          </h3>
          
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E4DF" />
              <XAxis 
                dataKey="date" 
                stroke="#666663"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#666663"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E5E4DF',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              />
              <ReferenceLine y={0} stroke="#666663" />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filtres */}
      {isReady && anomalies.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Filtre par type */}
            <div>
              <label className="block text-sm font-medium text-[#191919] mb-2">
                Type d'anomalie
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Toutes ({anomalies.length})</option>
                <option value={ANOMALY_TYPES.DEMAND_SPIKE}>
                  Pics de ventes ({getAnomaliesByType(ANOMALY_TYPES.DEMAND_SPIKE).length})
                </option>
                <option value={ANOMALY_TYPES.DEMAND_DROP}>
                  Chutes de ventes ({getAnomaliesByType(ANOMALY_TYPES.DEMAND_DROP).length})
                </option>
                <option value={ANOMALY_TYPES.SUPPLIER_DELAY}>
                  Délais fournisseur ({getAnomaliesByType(ANOMALY_TYPES.SUPPLIER_DELAY).length})
                </option>
                <option value={ANOMALY_TYPES.SUPPLIER_QUALITY}>
                  Problèmes qualité ({getAnomaliesByType(ANOMALY_TYPES.SUPPLIER_QUALITY).length})
                </option>
              </select>
            </div>

            {/* Filtre par sévérité */}
            <div>
              <label className="block text-sm font-medium text-[#191919] mb-2">
                Sévérité
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-4 py-2 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Toutes</option>
                <option value="critical">Critiques ({stats.critical || 0})</option>
                <option value="high">Importantes ({stats.high || 0})</option>
                <option value="medium">Moyennes ({stats.medium || 0})</option>
                <option value="low">Faibles ({stats.low || 0})</option>
              </select>
            </div>
          </div>

          {/* Liste des anomalies */}
          <div className="space-y-3">
            {filteredAnomalies.length > 0 ? (
              filteredAnomalies.map(anomaly => (
                <AnomalyCard
                  key={anomaly.id}
                  anomaly={anomaly}
                  onResolve={() => resolveAnomaly(anomaly.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-[#666663]">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600 opacity-50" />
                <p>Aucune anomalie détectée avec ces filtres</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message si aucune anomalie */}
      {isReady && anomalies.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <h3 className="text-xl font-semibold text-[#191919] mb-2">
            Aucune anomalie détectée !
          </h3>
          <p className="text-[#666663]">
            Vos stocks et fournisseurs fonctionnent normalement. Tout va bien ! 🎉
          </p>
        </div>
      )}

      {/* Message initial */}
      {!isReady && !isDetecting && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-12 text-center">
          <Loader className="w-16 h-16 mx-auto mb-4 text-red-600 animate-pulse" />
          <p className="text-[#666663]">
            Initialisation de la détection d'anomalies...
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Carte statistique
 */
function StatCard({ icon: Icon, label, count, color }) {
  const colorClasses = {
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200'
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
 * Carte d'anomalie
 */
function AnomalyCard({ anomaly, onResolve }) {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: AlertTriangle,
      badge: 'bg-red-600'
    },
    high: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: AlertCircle,
      badge: 'bg-orange-600'
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: Info,
      badge: 'bg-yellow-600'
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: Info,
      badge: 'bg-blue-600'
    }
  };

  const config = severityConfig[anomaly.severity] || severityConfig.medium;
  const Icon = config.icon;

  // Icône selon le type
  const TypeIcon = 
    anomaly.type === ANOMALY_TYPES.DEMAND_SPIKE ? TrendingUp :
    anomaly.type === ANOMALY_TYPES.DEMAND_DROP ? TrendingDown :
    anomaly.type === ANOMALY_TYPES.SUPPLIER_DELAY ? Clock :
    anomaly.type === ANOMALY_TYPES.SUPPLIER_QUALITY ? Package :
    Truck;

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg ${config.text}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 hover:opacity-90 transition-opacity"
      >
        <TypeIcon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 text-left">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold">{anomaly.message}</p>
            <span className={`${config.badge} text-white text-xs px-2 py-1 rounded uppercase font-medium shrink-0`}>
              {anomaly.severity}
            </span>
          </div>
          <p className="text-sm opacity-90 mb-2">{anomaly.details}</p>
          <div className="flex items-center gap-4 text-xs">
            <span>📅 {format(new Date(anomaly.date), 'dd MMM yyyy', { locale: fr })}</span>
            <span>📦 {anomaly.sku}</span>
            {anomaly.zScore && <span>📊 Z-score: {anomaly.zScore}</span>}
          </div>
        </div>
        <div className="shrink-0">
          {expanded ? <TrendingUp className="w-5 h-5 rotate-180" /> : <TrendingDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Détails étendus */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-current/20">
          <div className="mt-4 space-y-3">
            {/* Recommandations */}
            {anomaly.recommendations && anomaly.recommendations.length > 0 && (
              <div>
                <p className="font-semibold mb-2">💡 Actions Recommandées:</p>
                <div className="space-y-2">
                  {anomaly.recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white/50 rounded-lg p-3">
                      <p className="font-medium text-sm">{rec.description}</p>
                      <p className="text-xs opacity-75 mt-1">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Métriques */}
            {anomaly.metrics && (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(anomaly.metrics).map(([key, value]) => (
                  <div key={key} className="bg-white/50 rounded p-2">
                    <p className="text-xs opacity-75 capitalize">{key}</p>
                    <p className="font-semibold">{typeof value === 'number' ? value.toFixed(1) : value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton résoudre */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve();
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-white text-current border border-current/30 rounded-lg hover:bg-current/10 transition-colors font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Marquer comme Résolue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Prépare les données pour la timeline
 */
function prepareTimelineData(anomalies) {
  // Grouper par date
  const byDate = {};
  
  anomalies.forEach(anomaly => {
    const date = format(new Date(anomaly.date), 'dd/MM', { locale: fr });
    byDate[date] = (byDate[date] || 0) + 1;
  });

  // Convertir en array pour le graphique
  return Object.entries(byDate)
    .map(([date, count]) => ({ date, count }))
    .slice(-30); // 30 derniers jours
}

