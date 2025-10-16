import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import InfoTooltip from '../../shared/InfoTooltip';

const KPICard = ({ 
  title, 
  value, 
  change, 
  changePercent, 
  trend, 
  description, 
  chartData = [],
  icon: Icon 
}) => {
  const isPositive = trend === 'up';
  const isGood = (title.includes('Disponibilité') && isPositive) || 
                 (title.includes('Perdues') && !isPositive) ||
                 (title.includes('Surstocks') && !isPositive);
  
  return (
    <Card hoverable className="h-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {Icon && (
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {title}
                  </h3>
                  {description && <InfoTooltip content={description} />}
                </div>
              </div>
            </div>
            
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {value}
            </div>
            
            {changePercent !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <span className={`inline-flex items-center gap-1 font-medium ${
                  isGood ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                }`}>
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(changePercent)}%
                </span>
                <span className="text-neutral-500 dark:text-neutral-400">
                  vs période précédente
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Mini Chart */}
        {chartData.length > 0 && (
          <div className="h-16 mt-4">
            <svg className="w-full h-full" viewBox="0 0 300 64" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Area */}
              <path
                d={`M 0,64 ${chartData.map((val, i) => 
                  `L ${(i / (chartData.length - 1)) * 300},${64 - (val / 100) * 64}`
                ).join(' ')} L 300,64 Z`}
                fill={`url(#gradient-${title})`}
              />
              
              {/* Line */}
              <polyline
                fill="none"
                stroke="rgb(99 102 241)"
                strokeWidth="2"
                points={chartData.map((val, i) => 
                  `${(i / (chartData.length - 1)) * 300},${64 - (val / 100) * 64}`
                ).join(' ')}
              />
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;
