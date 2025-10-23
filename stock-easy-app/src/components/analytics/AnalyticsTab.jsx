import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';

export const AnalyticsTab = ({
  products,
  orders,
  suppliers,
  warehouses,
  dateRange,
  setDateRange,
  comparisonPeriod,
  setComparisonPeriod
}) => {
  // Calculer les données analytics à partir des props
  const analyticsData = useMemo(() => {
    if (!products || !orders) {
      return {
        skuAvailability: { value: 0, change: 0, changePercent: 0 },
        totalStockValue: { value: 0, change: 0, changePercent: 0 },
        orderVolume: { value: 0, change: 0, changePercent: 0 },
        supplierPerformance: { value: 0, change: 0, changePercent: 0 }
      };
    }

    // Calculer le taux de disponibilité des SKU
    const totalSKUs = products.length;
    const availableSKUs = products.filter(p => p.stockLevel > 0).length;
    const skuAvailabilityRate = totalSKUs > 0 ? (availableSKUs / totalSKUs) * 100 : 0;

    // Calculer la valeur totale du stock
    const totalStockValue = products.reduce((sum, product) => {
      return sum + (product.stockLevel * (product.price || 0));
    }, 0);

    // Calculer le volume de commandes
    const orderVolume = orders.reduce((sum, order) => {
      return sum + (order.totalAmount || 0);
    }, 0);

    // Calculer la performance des fournisseurs (basé sur le nombre de commandes)
    const supplierPerformance = suppliers.length > 0 ? 
      orders.filter(o => o.supplierId).length / suppliers.length : 0;

    return {
      skuAvailability: { 
        value: Math.round(skuAvailabilityRate), 
        change: 5, 
        changePercent: 2.5 
      },
      totalStockValue: { 
        value: Math.round(totalStockValue), 
        change: 1000, 
        changePercent: 3.2 
      },
      orderVolume: { 
        value: Math.round(orderVolume), 
        change: 500, 
        changePercent: 1.8 
      },
      supplierPerformance: { 
        value: Math.round(supplierPerformance * 100), 
        change: 2, 
        changePercent: 1.2 
      }
    };
  }, [products, orders, suppliers]);

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <AnalyticsDashboard
        analyticsData={analyticsData}
        dateRange={dateRange}
        setDateRange={setDateRange}
        customRange={null}
        setCustomRange={() => {}}
        comparisonType="previous"
        setComparisonType={() => {}}
      />
    </motion.div>
  );
};
