import React from 'react';
import { motion } from 'framer-motion';
import { ProductsToOrder } from './ProductsToOrder';
import { ProductsToWatch } from './ProductsToWatch';
import { InTransit } from './InTransit';
import { ReceivedOrders } from './ReceivedOrders';

export const DashboardTab = ({ productsByStatus, orders, setActiveTab, setTrackTabSection }) => {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <ProductsToOrder products={productsByStatus.to_order} />
      <ProductsToWatch products={productsByStatus.watch} />
      <InTransit orders={orders} setActiveTab={setActiveTab} setTrackTabSection={setTrackTabSection} />
      <ReceivedOrders orders={orders} setActiveTab={setActiveTab} setTrackTabSection={setTrackTabSection} />
    </motion.div>
  );
};
