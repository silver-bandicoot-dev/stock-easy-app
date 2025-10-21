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
  // Préparer les données pour le graphique
  const chartData = [];
  const today = new Date();

  // Données historiques (30 derniers jours)
  if (historicalData && historicalData.length > 0) {
    historicalData.slice(-30).forEach((data, index) => {
      chartData.push({
        date: format(new Date(data.date), 'dd/MM', { locale: fr }),
        fullDate: data.date,
        historique: data.quantity,
        type: 'historique'
      });
    });
  }

  // Données de prévisions (30 prochains jours)
  if (forecast30Days && forecast30Days.length > 0) {
    forecast30Days.forEach((quantity, index) => {
      const futureDate = addDays(today, index);
      chartData.push({
        date: format(futureDate, 'dd/MM', { locale: fr }),
        fullDate: futureDate.toISOString().split('T')[0],
        prevision: quantity,
        type: 'prevision'
      });
    });
  }

  // Calculer la tendance
  const firstWeek = forecast30Days?.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
  const lastWeek = forecast30Days?.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const trend = lastWeek > firstWeek ? 'up' : 'down';
  const trendPercent = ((lastWeek - firstWeek) / firstWeek * 100).toFixed(1);

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

      {/* Graphique */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorHistorique" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorPrevision" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
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
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          {/* Zone historique */}
          <Area
            type="monotone"
            dataKey="historique"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorHistorique)"
            name="Historique"
            dot={false}
          />
          
          {/* Zone prévisions */}
          <Area
            type="monotone"
            dataKey="prevision"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#colorPrevision)"
            name="Prévisions ML"
            dot={false}
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

