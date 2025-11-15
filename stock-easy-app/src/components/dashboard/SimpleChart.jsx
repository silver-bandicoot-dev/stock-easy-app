import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Composant SimpleChart - Affiche des graphiques simples
 */
export function SimpleChart({ type = 'bar', data, title, height = 300 }) {
  // Palette de couleurs selon les standards de l'application
  const COLORS = ['#8B5CF6', '#EF1C43', '#F59E0B', '#10B981', '#3B82F6'];

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E4DF" />
              <XAxis 
                dataKey="name" 
                stroke="#666663"
                fontSize={12}
                tick={{ fill: '#666663' }}
              />
              <YAxis 
                stroke="#666663"
                fontSize={12}
                tick={{ fill: '#666663' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E4DF',
                  borderRadius: '8px',
                  padding: '8px'
                }}
                labelStyle={{ color: '#191919', fontWeight: 'bold' }}
              />
              <Legend />
              <Bar dataKey="value" fill={data[0]?.color || '#8B5CF6'} radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E4DF',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
      {title && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-[#E5E4DF] px-6 py-4">
          <h3 className="text-lg font-bold text-[#191919]">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {renderChart()}
      </div>
    </div>
  );
}

export default SimpleChart;

