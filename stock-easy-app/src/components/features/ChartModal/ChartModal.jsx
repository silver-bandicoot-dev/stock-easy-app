import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { exportKPIToCSV, formatDateForDisplay } from '../../../utils/exportUtils';

/**
 * ChartModal - Modal affichant un graphique détaillé pour un KPI
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {function} onClose - Callback de fermeture
 * @param {object} kpiData - Données du KPI avec historique
 * @param {string} title - Titre du KPI
 */
export function ChartModal({ 
  isOpen, 
  onClose, 
  kpiData, 
  title 
}) {
  if (!kpiData) return null;

  // Préparer les données pour le graphique
  const chartData = kpiData.chartData || [];
  
  // Déterminer l'icône de tendance
  const TrendIcon = kpiData.trend === 'up' 
    ? TrendingUp 
    : kpiData.trend === 'down' 
      ? TrendingDown 
      : Minus;
  
  // Couleur de la tendance
  const trendColor = kpiData.trend === 'up' 
    ? 'text-green-600' 
    : kpiData.trend === 'down' 
      ? 'text-red-600' 
      : 'text-[#666663]';
  
  const trendBgColor = kpiData.trend === 'up' 
    ? 'bg-green-50 border-green-200' 
    : kpiData.trend === 'down' 
      ? 'bg-red-50 border-red-200' 
      : 'bg-[#FAFAF7] border-[#E5E4DF]';

  // Custom Tooltip pour le graphique
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-[#E5E4DF]">
          <p className="text-sm font-medium text-[#191919]">
            {formatDateForDisplay(payload[0].payload.date)}
          </p>
          <p className="text-sm text-[#666663]">
            Valeur: <strong className="text-[#191919]">{payload[0].value}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  // Fonction d'export
  const handleExport = () => {
    const filename = title.replace(/\s+/g, '_').toLowerCase();
    exportKPIToCSV(kpiData, filename);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="large"
      footer={
        <div className="flex justify-between items-center">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#191919] text-white rounded-lg hover:bg-[#333333] transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#666663] hover:text-[#191919] transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Valeur actuelle et tendance */}
        <div className="bg-[#FAFAF7] rounded-lg p-6 border border-[#E5E4DF]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#666663] mb-1">Valeur actuelle</p>
              <p className="text-4xl font-bold text-[#191919]">{kpiData.value}</p>
              {kpiData.description && (
                <p className="text-sm text-[#666663] mt-2">{kpiData.description}</p>
              )}
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${trendBgColor}`}>
              <TrendIcon className={`w-5 h-5 ${trendColor}`} />
              <span className={`font-bold ${trendColor}`}>
                {kpiData.changePercent > 0 ? '+' : ''}{kpiData.changePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Graphique détaillé */}
        <div className="bg-white rounded-lg p-6 border border-[#E5E4DF]">
          <h3 className="text-lg font-bold text-[#191919] mb-4">Évolution sur la période</h3>
          
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E4DF" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666663"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis 
                  stroke="#666663"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '14px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Valeur"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-[#FAFAF7] rounded-lg">
              <p className="text-[#666663]">Pas de données historiques disponibles</p>
            </div>
          )}
        </div>

        {/* Comparaison de périodes */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#191919]">Comparaison de périodes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Période actuelle */}
            <div className="bg-[#FAFAF7] rounded-lg p-4 border-2 border-[#191919]">
              <h4 className="text-sm font-semibold text-[#191919] mb-3">Période actuelle</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-[#666663]">Valeur</p>
                  <p className="text-2xl font-bold text-[#191919]">{kpiData.value}</p>
                </div>
                {chartData.length > 0 && (
                  <p className="text-xs text-[#666663]">
                    Du {formatDateForDisplay(chartData[0]?.date)} au {formatDateForDisplay(chartData[chartData.length - 1]?.date)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Période précédente */}
            <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[#E5E4DF]">
              <h4 className="text-sm font-semibold text-[#666663] mb-3">Période précédente</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-[#666663]">Valeur estimée</p>
                  <p className="text-2xl font-bold text-[#666663]">
                    {kpiData.rawValue 
                      ? (kpiData.rawValue - kpiData.change).toFixed(1)
                      : 'N/A'
                    }
                  </p>
                </div>
                <p className="text-xs text-[#666663]">Même durée</p>
              </div>
            </div>
          </div>

          {/* Résumé de la variation */}
          <div className={`p-4 rounded-lg border ${trendBgColor}`}>
            <div className="flex items-start gap-3">
              <TrendIcon className={`w-5 h-5 mt-0.5 ${trendColor}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#191919]">Variation détectée</p>
                <p className="text-sm text-[#666663] mt-1">
                  {kpiData.change > 0 ? 'Augmentation' : kpiData.change < 0 ? 'Diminution' : 'Stable'} de{' '}
                  <strong className={trendColor}>
                    {Math.abs(kpiData.change).toFixed(1)} 
                  </strong>
                  {' '}soit{' '}
                  <strong className={trendColor}>
                    {kpiData.changePercent > 0 ? '+' : ''}{kpiData.changePercent}%
                  </strong>
                  {' '}par rapport à la période précédente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques supplémentaires */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-[#E5E4DF]">
            <h3 className="text-lg font-bold text-[#191919] mb-4">Statistiques</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[#666663] mb-1">Points de données</p>
                <p className="text-xl font-bold text-[#191919]">{chartData.length}</p>
              </div>
              <div>
                <p className="text-xs text-[#666663] mb-1">Valeur max</p>
                <p className="text-xl font-bold text-[#191919]">
                  {Math.max(...chartData.map(d => d.value || 0)).toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#666663] mb-1">Valeur min</p>
                <p className="text-xl font-bold text-[#191919]">
                  {Math.min(...chartData.map(d => d.value || 0)).toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#666663] mb-1">Moyenne</p>
                <p className="text-xl font-bold text-[#191919]">
                  {(chartData.reduce((sum, d) => sum + (d.value || 0), 0) / chartData.length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

