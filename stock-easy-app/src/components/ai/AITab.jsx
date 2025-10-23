import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Zap } from 'lucide-react';
import { SubTabsNavigation } from '../features/SubTabsNavigation';
import { AIMainDashboard } from '../ml';
import { AI_TABS } from '../../constants/stockEasyConstants';

export const AITab = ({
  products,
  orders,
  aiSubTab,
  setAiSubTab
}) => {
  return (
    <motion.div
      key="ai"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-200 shrink-0">
            <Brain className="w-6 h-6 text-purple-600 shrink-0" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Intelligence Artificielle</h2>
            <p className="text-sm text-gray-600">Prédictions et optimisations pilotées par l'IA</p>
          </div>
        </div>
      </div>

      {/* Contenu principal avec AIMainDashboard */}
      <AIMainDashboard
        products={products}
        orders={orders}
        aiSubTab={aiSubTab}
        setAiSubTab={setAiSubTab}
      />
    </motion.div>
  );
};
