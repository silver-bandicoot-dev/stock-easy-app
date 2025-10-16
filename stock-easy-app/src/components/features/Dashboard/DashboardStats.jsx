import React from 'react';
import { Package, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import KPICard from './KPICard';
import { TOOLTIPS } from '../../../utils/constants';

const DashboardStats = ({ products = [] }) => {
  // Calculs (à adapter selon vos besoins)
  const totalSKUs = products.length;
  const inStockSKUs = products.filter(p => p.stock > 0).length;
  const skuAvailability = totalSKUs > 0 ? ((inStockSKUs / totalSKUs) * 100).toFixed(1) : 0;
  
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const potentialLostSales = outOfStockProducts.reduce((sum, p) => 
    sum + ((p.salesPerDay || 0) * (p.price || 0) * 30), 0
  );
  
  const deepOverstockValue = products
    .filter(p => p.isDeepOverstock)
    .reduce((sum, p) => sum + (p.stock * (p.price || 0)), 0);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <KPICard
        icon={Package}
        title="Disponibilité SKU"
        value={`${skuAvailability}%`}
        changePercent={2.5}
        trend="up"
        description={TOOLTIPS.skuAvailability}
        chartData={[65, 70, 68, 72, 75, 73, 78, 82, 80, 85]}
      />
      
      <KPICard
        icon={TrendingDown}
        title="Ventes Perdues"
        value={`${(potentialLostSales / 1000).toFixed(1)}k €`}
        changePercent={-15.2}
        trend="down"
        description={TOOLTIPS.salesLost}
        chartData={[100, 95, 90, 85, 82, 80, 75, 70, 68, 65]}
      />
      
      <KPICard
        icon={DollarSign}
        title="Surstocks Profonds"
        value={`${(deepOverstockValue / 1000).toFixed(1)}k €`}
        changePercent={-5.8}
        trend="down"
        description={TOOLTIPS.deepOverstock}
        chartData={[80, 78, 75, 72, 70, 68, 65, 62, 60, 58]}
      />
    </div>
  );
};

export default DashboardStats;
