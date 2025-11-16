import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Composant SimpleChart - Affiche des graphiques simples
 */
export function SimpleChart({ type = 'bar', data, title, height = 300 }) {
  // Palette de couleurs selon les standards de l'application
  const COLORS = ['#4F46E5', '#EF4444', '#F97316', '#10B981', '#3B82F6'];

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} barSize={28} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBEAE4" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#666663"
                fontSize={11}
                tick={{ fill: '#666663' }}
              />
              <YAxis 
                stroke="#666663"
                fontSize={11}
                tick={{ fill: '#666663' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E4DF',
                  borderRadius: '8px',
                  padding: '8px',
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)'
                }}
                labelStyle={{ color: '#191919', fontWeight: 'bold' }}
              />
              <Bar dataKey="value" fill={data[0]?.color || '#4F46E5'} radius={[6, 6, 0, 0]}>
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
                cy="52%"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}% • ${name}`}
                outerRadius={86}
                innerRadius={56}
                fill="#4F46E5"
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
                  padding: '8px',
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)'
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
        <div className="border-b border-[#E5E4DF] px-6 py-4 bg-[#F9F8F5]">
          <h3 className="text-sm font-semibold text-[#191919] tracking-wide uppercase">
            {title}
          </h3>
        </div>
      )}
      <div className="p-6">
        {renderChart()}
      </div>
    </div>
  );
}

export default SimpleChart;

