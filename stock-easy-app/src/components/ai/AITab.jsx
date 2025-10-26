import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { AIOverviewDashboard } from '../ml/AIOverviewDashboard';
import { MLAdvancedDashboard } from '../ml/MLAdvancedDashboard';
import { ReorderOptimizationDashboard } from '../ml/ReorderOptimizationDashboard';
import { AnomalyDashboard } from '../ml/AnomalyDashboard';
import { AI_TABS } from '../../constants/stockEasyConstants';

export const AITab = ({
  products,
  orders,
  aiSubTab,
  setAiSubTab
}) => {
  const aiSections = [
    {
      key: AI_TABS.OVERVIEW,
      title: 'Vue d\'ensemble',
      icon: Brain,
      shortTitle: 'Vue d\'ensemble'
    },
    {
      key: AI_TABS.FORECASTS,
      title: 'Prévisions',
      icon: TrendingUp,
      shortTitle: 'Prévisions'
    },
    {
      key: AI_TABS.OPTIMIZATION,
      title: 'Optimisation',
      icon: Zap,
      shortTitle: 'Optimisation'
    },
    {
      key: AI_TABS.ANOMALIES,
      title: 'Anomalies',
      icon: AlertTriangle,
      shortTitle: 'Anomalies'
    }
  ];

  return (
    <motion.div
      key="ai"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header avec titre et sous-titre */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-[#191919]" />
          <h1 className="text-2xl font-bold text-[#191919]">Intelligence Artificielle</h1>
        </div>
        <p className="text-[#666663] ml-11">Prédictions et optimisations pilotées par l'IA</p>
        
        {/* Onglets de navigation - Optimisés mobile */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
          {aiSections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.key}
                onClick={() => setAiSubTab(section.key)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                  aiSubTab === section.key
                    ? 'bg-black text-white'
                    : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{section.title}</span>
                <span className="sm:hidden">{section.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu de chaque section */}
      <AnimatePresence mode="wait">
        {aiSubTab === AI_TABS.OVERVIEW && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <AIOverviewDashboard 
              products={products} 
              orders={orders}
              setAiSubTab={setAiSubTab}
              aiSubTab={aiSubTab}
            />
          </motion.div>
        )}

        {aiSubTab === AI_TABS.FORECASTS && (
          <motion.div
            key="forecasts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <MLAdvancedDashboard products={products} />
          </motion.div>
        )}

        {aiSubTab === AI_TABS.OPTIMIZATION && (
          <motion.div
            key="optimization"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <ReorderOptimizationDashboard products={products} />
          </motion.div>
        )}

        {aiSubTab === AI_TABS.ANOMALIES && (
          <motion.div
            key="anomalies"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <AnomalyDashboard products={products} orders={orders} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
