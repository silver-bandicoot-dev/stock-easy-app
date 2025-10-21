/**
 * Heatmap de la demande par jour de la semaine et heure
 * @module components/ml/DemandHeatmap
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export function DemandHeatmap({ salesHistory, product }) {
  // Calculer la demande moyenne par jour de la semaine
  const demandByDay = Array(7).fill(0).map(() => ({ sum: 0, count: 0 }));
  
  if (salesHistory && salesHistory.length > 0) {
    const productSales = salesHistory.filter(s => s.sku === product?.sku);
    
    productSales.forEach(sale => {
      const dayOfWeek = sale.dayOfWeek;
      demandByDay[dayOfWeek].sum += sale.quantity;
      demandByDay[dayOfWeek].count += 1;
    });
  }

  // Préparer les données pour le graphique
  const chartData = DAYS_FR.map((day, index) => {
    const avg = demandByDay[index].count > 0 
      ? demandByDay[index].sum / demandByDay[index].count 
      : 0;
    
    return {
      day,
      moyenne: parseFloat(avg.toFixed(2)),
      dayIndex: index
    };
  });

  // Trouver le max pour le gradient de couleur
  const maxDemand = Math.max(...chartData.map(d => d.moyenne));
  
  // Fonction pour déterminer la couleur selon l'intensité
  const getColor = (value) => {
    const intensity = maxDemand > 0 ? value / maxDemand : 0;
    
    if (intensity > 0.8) return '#8b5cf6'; // Violet foncé
    if (intensity > 0.6) return '#a78bfa'; // Violet moyen
    if (intensity > 0.4) return '#c4b5fd'; // Violet clair
    if (intensity > 0.2) return '#ddd6fe'; // Violet très clair
    return '#e9d5ff'; // Violet ultra-clair
  };

  // Trouver le jour avec le plus de demande
  const peakDay = chartData.reduce((max, current) => 
    current.moyenne > max.moyenne ? current : max, 
    chartData[0]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#191919] mb-1">
          🔥 Heatmap de Demande par Jour
        </h3>
        <p className="text-sm text-[#666663]">
          {product?.name || 'Tous les produits'} - Moyenne par jour de la semaine
        </p>
      </div>

      {/* Graphique */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E4DF" />
          <XAxis 
            dataKey="day" 
            stroke="#666663"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#666663"
            style={{ fontSize: '12px' }}
            label={{ value: 'Moyenne', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #E5E4DF',
              borderRadius: '8px',
              padding: '12px'
            }}
            formatter={(value) => [`${value} unités`, 'Moyenne']}
          />
          <Bar 
            dataKey="moyenne" 
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.moyenne)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#E5E4DF]">
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-900 mb-2 font-medium">🔝 Jour de Pointe</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600">{peakDay.day}</span>
            <span className="text-sm text-purple-600">{peakDay.moyenne.toFixed(1)} unités</span>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-900 mb-2 font-medium">📊 Régularité</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {calculateConsistency(chartData)}%
            </span>
            <span className="text-sm text-blue-600">constante</span>
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div className="mt-4 p-4 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]">
        <p className="text-sm text-[#666663] mb-2">💡 <strong>Recommandation :</strong></p>
        <p className="text-sm text-[#191919]">
          {peakDay.moyenne > 0 
            ? `Augmentez les stocks avant ${peakDay.day} pour anticiper la demande de pointe. Demande ${((peakDay.moyenne / chartData.reduce((sum, d) => sum + d.moyenne, 0) * 7) * 100).toFixed(0)}% supérieure à la moyenne hebdomadaire.`
            : 'Pas assez de données historiques pour générer des recommandations.'
          }
        </p>
      </div>
    </div>
  );
}

/**
 * Calcule un score de régularité de la demande
 * @param {Array} data - Données de demande par jour
 * @returns {number} Score de 0 à 100
 */
function calculateConsistency(data) {
  if (!data || data.length === 0) return 0;
  
  const values = data.map(d => d.moyenne);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  if (mean === 0) return 0;
  
  // Calculer le coefficient de variation (CV)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  
  // Convertir en score de régularité (0-100)
  // CV faible = haute régularité
  const consistencyScore = Math.max(0, Math.min(100, 100 - (cv * 100)));
  
  return Math.round(consistencyScore);
}

