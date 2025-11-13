import React from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { ProductsToOrder } from './ProductsToOrder';
import { ProductsToWatch } from './ProductsToWatch';
import { InTransit } from './InTransit';
import { ReceivedOrders } from './ReceivedOrders';
import { StockHealthDashboard } from '../features/StockHealthDashboard';

export const DashboardTab = ({ productsByStatus, orders, suppliers, setActiveTab, setTrackTabSection, enrichedProducts }) => {
  // Calculer les statistiques de santé
  const urgentCount = enrichedProducts ? enrichedProducts.filter(p => p.healthStatus === 'urgent').length : 0;
  const warningCount = enrichedProducts ? enrichedProducts.filter(p => p.healthStatus === 'warning').length : 0;
  const healthyCount = enrichedProducts ? enrichedProducts.filter(p => p.healthStatus === 'healthy').length : 0;
  const totalProducts = enrichedProducts ? enrichedProducts.length : 0;

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Section Santé de l'Inventaire */}
      {enrichedProducts && enrichedProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-200 shrink-0">
                <Package className="w-6 h-6 text-purple-600 shrink-0" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#191919]">Santé de l'Inventaire</h2>
                <p className="text-sm text-[#666663]">Vue d'ensemble de l'état de vos stocks</p>
              </div>
            </div>
          </div>
          <StockHealthDashboard 
            totalUrgent={urgentCount}
            totalWarning={warningCount}
            totalHealthy={healthyCount}
            totalProducts={totalProducts}
          />
        </div>
      )}

      {/* Sections Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductsToOrder products={productsByStatus.to_order} />
        <ProductsToWatch products={productsByStatus.watch} />
        <InTransit 
          orders={orders} 
          suppliers={suppliers}
          setActiveTab={setActiveTab} 
          setTrackTabSection={setTrackTabSection} 
        />
        <ReceivedOrders orders={orders} setActiveTab={setActiveTab} setTrackTabSection={setTrackTabSection} />
      </div>
    </motion.div>
  );
};
