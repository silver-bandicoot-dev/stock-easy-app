/**
 * Graphique de tendances des prévisions ML sur 30 jours
 * @module components/ml/ForecastTrendChart
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ForecastTrendChart({ product, forecast30Days, historicalData }) {
  // Préparer les données pour le graphique avec une structure unifiée
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Créer un map de toutes les dates avec leurs valeurs
  const dataMap = new Map();
  
  // Ajouter les données historiques (30 derniers jours max)
  if (historicalData && historicalData.length > 0) {
    historicalData.slice(-30).forEach(data => {
      try {
        const dateObj = new Date(data.date);
        if (isNaN(dateObj.getTime())) return; // Skip invalid dates
        const dateKey = dateObj.toISOString().split('T')[0];
        const quantity = Number(data.quantity) || 0;
        
        dataMap.set(dateKey, {
          date: format(dateObj, 'dd/MM', { locale: fr }),
          fullDate: dateKey,
          historique: quantity,
          prevision: null // Sera rempli si chevauchement
        });
      } catch (e) {
        console.warn('Date invalide:', data.date);
      }
    });
  }

  // Ajouter les données de prévisions (30 prochains jours)
  if (forecast30Days && forecast30Days.length > 0) {
    forecast30Days.forEach((quantity, index) => {
      const futureDate = addDays(today, index);
      const dateKey = futureDate.toISOString().split('T')[0];
      const numQuantity = Number(quantity) || 0;
      
      if (dataMap.has(dateKey)) {
        // Mise à jour d'une date existante (transition)
        const existing = dataMap.get(dateKey);
        existing.prevision = numQuantity;
      } else {
        // Nouvelle date
        dataMap.set(dateKey, {
          date: format(futureDate, 'dd/MM', { locale: fr }),
          fullDate: dateKey,
          historique: null,
          prevision: numQuantity
        });
      }
    });
  }
  
  // Convertir en tableau trié par date
  const chartData = Array.from(dataMap.values())
    .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  
  // Ajouter un point de transition pour connecter historique et prévisions
  // Trouver le dernier point historique et le premier point de prévision
  const lastHistoricalIndex = chartData.findLastIndex(d => d.historique !== null);
  const firstPrevisionIndex = chartData.findIndex(d => d.prevision !== null);
  
  // Si les deux existent et ne se chevauchent pas, créer une transition
  if (lastHistoricalIndex >= 0 && firstPrevisionIndex > lastHistoricalIndex) {
    // Le dernier point historique reçoit aussi la première valeur de prévision
    chartData[lastHistoricalIndex].prevision = chartData[firstPrevisionIndex].prevision;
  }
  
  // Debug log pour vérifier les données
  console.log('📊 ForecastTrendChart - données:', {
    historicalCount: historicalData?.length || 0,
    forecastCount: forecast30Days?.length || 0,
    chartDataCount: chartData.length,
    firstEntry: chartData[0],
    lastEntry: chartData[chartData.length - 1],
    transitionPoint: lastHistoricalIndex >= 0 ? chartData[lastHistoricalIndex] : null
  });

  // Calculer les statistiques pour chaque série
  const historiqueValues = chartData.map(d => d.historique).filter(v => v !== null && v !== undefined);
  const previsionValues = chartData.map(d => d.prevision).filter(v => v !== null && v !== undefined);
  
  const maxHistorique = historiqueValues.length > 0 ? Math.max(...historiqueValues) : 0;
  const maxPrevision = previsionValues.length > 0 ? Math.max(...previsionValues) : 0;
  const avgHistorique = historiqueValues.length > 0 ? historiqueValues.reduce((a, b) => a + b, 0) / historiqueValues.length : 0;
  
  console.log('📊 ForecastTrendChart - stats:', { maxHistorique, maxPrevision, avgHistorique, historiqueCount: historiqueValues.length, previsionCount: previsionValues.length });

  // Si pas de données, afficher un message
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-[#191919] mb-1">
              📈 Tendances de Demande - {product?.name || 'Produit'}
            </h3>
            <p className="text-sm text-[#666663]">
              Historique 30 jours + Prévisions 30 jours
            </p>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Données en cours de chargement...</p>
            <p className="text-xs mt-1">
              Historique: {historicalData?.length || 0} | Prévisions: {forecast30Days?.length || 0}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculer la tendance (seulement si on a au moins 7 jours de prévisions)
  let trend = 'up';
  let trendPercent = '0.0';
  
  if (forecast30Days && forecast30Days.length >= 7) {
    const firstWeek = forecast30Days.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
    const lastWeek = forecast30Days.slice(-7).reduce((a, b) => a + b, 0) / 7;
    
    // Éviter la division par zéro
    if (firstWeek > 0) {
      trend = lastWeek > firstWeek ? 'up' : 'down';
      trendPercent = ((lastWeek - firstWeek) / firstWeek * 100).toFixed(1);
    } else if (lastWeek > 0) {
      // Si firstWeek = 0 mais lastWeek > 0, c'est une hausse infinie
      trend = 'up';
      trendPercent = '∞';
    }
  }
  
  // Déterminer si les échelles sont très différentes
  const scaleRatio = maxPrevision > 0 && maxHistorique > 0 ? maxPrevision / maxHistorique : 1;
  const needsDualScale = scaleRatio > 10 || (maxHistorique < 5 && maxPrevision > 50);
  
  console.log('📊 ForecastTrendChart - échelle:', { scaleRatio, needsDualScale, maxHistorique, maxPrevision });
  
  // Si les échelles sont très différentes, normaliser les données pour affichage
  const normalizedChartData = needsDualScale ? chartData.map(d => ({
    ...d,
    // Garder les valeurs originales
    historiqueOriginal: d.historique,
    previsionOriginal: d.prevision,
    // Normaliser pour affichage (mettre historique à l'échelle des prévisions)
    historique: d.historique !== null ? d.historique * (maxPrevision / Math.max(maxHistorique, 1)) : null
  })) : chartData;
  
  // Calculer le domaine Y dynamiquement
  const maxValue = Math.max(maxHistorique, maxPrevision, 1);
  const yDomain = [0, Math.ceil(maxValue * 1.1)];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#191919] mb-1">
            📈 Tendances de Demande - {product?.name || 'Produit'}
          </h3>
          <p className="text-sm text-[#666663]">
            Historique 30 jours + Prévisions 30 jours
          </p>
        </div>
        
        {/* Indicateur de tendance */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {trend === 'up' ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )}
          <span className="font-semibold">
            {trend === 'up' ? '+' : ''}{trendPercent}%
          </span>
        </div>
      </div>

      {/* Message si échelles différentes */}
      {needsDualScale && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          ℹ️ Les données historiques ({avgHistorique.toFixed(1)}/jour) et les prévisions ({(maxPrevision/30).toFixed(0)}/jour) ont des échelles différentes. 
          L'historique est mis à l'échelle pour visualisation.
        </div>
      )}

      {/* Graphique */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={normalizedChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E4DF" />
          <XAxis 
            dataKey="date" 
            stroke="#666663"
            style={{ fontSize: '12px' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#666663"
            style={{ fontSize: '12px' }}
            domain={yDomain}
            label={{ value: 'Quantité', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #E5E4DF',
              borderRadius: '8px',
              padding: '12px'
            }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            formatter={(value, name, props) => {
              // Afficher les valeurs originales dans le tooltip
              if (needsDualScale && name === 'Historique' && props.payload.historiqueOriginal !== undefined) {
                return [props.payload.historiqueOriginal, name];
              }
              return [value, name];
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          {/* Zone historique - Couleur bleue */}
          <Area
            type="monotone"
            dataKey="historique"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="#93c5fd"
            fillOpacity={0.6}
            name="Historique"
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 1, stroke: '#fff' }}
            connectNulls={true}
            isAnimationActive={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          
          {/* Zone prévisions - Couleur violette */}
          <Area
            type="monotone"
            dataKey="prevision"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="#c4b5fd"
            fillOpacity={0.6}
            name="Prévisions ML"
            dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 1, stroke: '#fff' }}
            connectNulls={true}
            isAnimationActive={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats résumées */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#E5E4DF]">
        <div className="text-center">
          <p className="text-sm text-[#666663] mb-1">Moyenne Historique</p>
          <p className="text-2xl font-bold text-[#191919]">
            {historicalData?.length > 0 
              ? (historicalData.reduce((sum, d) => sum + d.quantity, 0) / historicalData.length).toFixed(1)
              : '-'
            }
          </p>
          <p className="text-xs text-[#666663]">unités/jour</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-[#666663] mb-1">Moyenne Prévue</p>
          <p className="text-2xl font-bold text-purple-600">
            {forecast30Days?.length > 0
              ? (forecast30Days.reduce((a, b) => a + b, 0) / forecast30Days.length).toFixed(1)
              : '-'
            }
          </p>
          <p className="text-xs text-[#666663]">unités/jour</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-[#666663] mb-1">Total Prévu 30j</p>
          <p className="text-2xl font-bold text-[#191919]">
            {forecast30Days?.length > 0
              ? forecast30Days.reduce((a, b) => a + b, 0)
              : '-'
            }
          </p>
          <p className="text-xs text-[#666663]">unités totales</p>
        </div>
      </div>
    </div>
  );
}

