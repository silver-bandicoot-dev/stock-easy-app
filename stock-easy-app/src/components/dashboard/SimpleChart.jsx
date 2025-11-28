import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Composant SimpleChart - Style Shopify sobre
 * Couleurs : gris et couleurs sémantiques discrètes
 */
export function SimpleChart({ type = 'bar', data, title, height = 280 }) {
  // Tooltip style Shopify
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#202223] text-white px-2.5 py-1.5 rounded text-xs shadow-lg">
          <p className="font-medium">{label || payload[0].name}</p>
          <p className="text-white/70 mt-0.5">
            {payload[0].value} produit{payload[0].value > 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} barSize={24} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="#F1F1F1" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="transparent"
                fontSize={11}
                tick={{ fill: '#6B7177' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="transparent"
                fontSize={11}
                tick={{ fill: '#8C9196' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#5C5F62'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const total = data.reduce((sum, item) => sum + item.value, 0);
        
        return (
          <div className="relative">
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#5C5F62'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Centre du donut */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xl font-semibold text-[#191919]">{total}</div>
                <div className="text-[10px] text-[#6B7177]">Total</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#E1E3E5] overflow-hidden">
      {title && (
        <div className="border-b border-[#E1E3E5] px-4 py-3 flex items-center justify-between">
          <h3 className="text-xs font-medium text-[#6B7177]">
            {title}
          </h3>
          {/* Légende compacte */}
          <div className="flex items-center gap-3">
            {data.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-[#8C9196]">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="p-4">
        {renderChart()}
      </div>
    </div>
  );
}

export default SimpleChart;

