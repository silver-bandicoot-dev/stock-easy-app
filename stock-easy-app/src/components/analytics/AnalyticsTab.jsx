import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';

export const AnalyticsTab = ({
  analyticsData,
  dateRange,
  setDateRange,
  customRange,
  setCustomRange,
  comparisonType,
  setComparisonType
}) => {
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
        customRange={customRange}
        setCustomRange={setCustomRange}
        comparisonType={comparisonType}
        setComparisonType={setComparisonType}
      />
    </motion.div>
  );
};
