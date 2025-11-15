import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Package } from 'lucide-react';
import { ProductsToOrder } from './ProductsToOrder';
import { ProductsToWatch } from './ProductsToWatch';
import { DashboardKPIs } from './DashboardKPIs';
import { DashboardCharts } from './DashboardCharts';

export const DashboardTab = ({ productsByStatus, orders, enrichedProducts, onViewDetails }) => {

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Header de section principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Package className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#191919] mb-1">Dashboard</h1>
            <p className="text-sm text-[#666663]">Vue d'ensemble de votre inventaire et commandes</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-[#666663]">
          <BarChart3 className="w-4 h-4" />
          <span>Mis à jour il y a quelques instants</span>
        </div>
      </div>

      {/* KPIs Principaux */}
      <div>
        <h2 className="text-lg font-bold text-[#191919] mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-purple-500 rounded-full" />
          Indicateurs clés
        </h2>
        <DashboardKPIs 
          enrichedProducts={enrichedProducts || []}
          orders={orders || []}
          productsByStatus={productsByStatus || {}}
        />
      </div>

      {/* Graphiques */}
      <div>
        <h2 className="text-lg font-bold text-[#191919] mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-indigo-500 rounded-full" />
          Analyses visuelles
        </h2>
        <DashboardCharts 
          enrichedProducts={enrichedProducts || []}
          orders={orders || []}
        />
      </div>

      {/* Sections Actions */}
      <div>
        <h2 className="text-lg font-bold text-[#191919] mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-500 rounded-full" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductsToOrder 
            products={productsByStatus?.to_order || []} 
            onViewDetails={onViewDetails}
          />
          <ProductsToWatch 
            products={productsByStatus?.watch || []} 
            onViewDetails={onViewDetails}
          />
        </div>
      </div>
    </motion.div>
  );
};
