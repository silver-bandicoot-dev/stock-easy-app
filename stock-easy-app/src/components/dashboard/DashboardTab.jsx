import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { ProductsToOrder } from './ProductsToOrder';
import { ProductsToWatch } from './ProductsToWatch';
import { DashboardKPIs } from './DashboardKPIs';
import { DashboardCharts } from './DashboardCharts';
import { useAnalytics } from '../../hooks/useAnalytics';

// Variants pour les animations orchestrées (subtiles)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export const DashboardTab = ({ productsByStatus, orders, enrichedProducts, onViewDetails, seuilSurstockProfond = 90, syncing = false }) => {
  const { currentUser } = useAuth();
  const [isReturningToday, setIsReturningToday] = useState(false);
  
  // Utiliser useAnalytics pour récupérer les données de comparaison (7 derniers jours)
  const analyticsData = useAnalytics(enrichedProducts, orders, '7d', null, 'previous', seuilSurstockProfond);

  useEffect(() => {
    const STORAGE_KEY = 'stockeasy_dashboard_last_visit';
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    try {
      const lastVisit = window.localStorage.getItem(STORAGE_KEY);
      if (lastVisit) {
        const lastVisitDate = new Date(lastVisit);
        const lastKey = lastVisitDate.toISOString().slice(0, 10);
        if (lastKey === todayKey) {
          setIsReturningToday(true);
        }
      }
      window.localStorage.setItem(STORAGE_KEY, now.toISOString());
    } catch (e) {
      console.warn('Impossible de lire/écrire dans localStorage pour le dashboard:', e);
    }
  }, []);

  const firstName =
    currentUser?.firstName ||
    currentUser?.user_metadata?.first_name ||
    currentUser?.displayName ||
    '';

  const greetingText = isReturningToday
    ? `Ravi de vous revoir${firstName ? ` ${firstName}` : ''}`
    : `Bonjour${firstName ? ` ${firstName}` : ''}`;

  // Stats rapides
  const urgentCount = productsByStatus?.to_order?.length || 0;
  const watchCount = productsByStatus?.watch?.length || 0;
  const totalAttention = urgentCount + watchCount;

  return (
    <motion.div
      key="dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header - Style Shopify sobre */}
      <motion.div 
        variants={itemVariants}
        className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#191919]">
            {greetingText} 👋
          </h1>
          <p className="text-sm text-[#6B7177] mt-0.5">
            Vue d'ensemble de votre inventaire
          </p>
        </div>
        
        {/* Indicateur de synchronisation - Connecté à l'état réel */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[#6B7177]">
          {syncing ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E1E3E5] rounded-full shadow-sm">
              <RefreshCw className="w-3 h-3 animate-spin text-[#6B7177]" />
              <span>Synchronisation...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E1E3E5] rounded-full shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Données synchronisées</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Badges de statut - Discrets mais informatifs */}
      {totalAttention > 0 && (
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#191919] bg-[#FFF4F4] border border-[#FED3D1] rounded">
              <span className="w-1.5 h-1.5 bg-[#D72C0D] rounded-full" />
              {urgentCount} à commander
            </span>
          )}
          {watchCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#191919] bg-[#FFF8E6] border border-[#FFEA8A] rounded">
              {watchCount} à surveiller
            </span>
          )}
        </motion.div>
      )}

      {/* KPIs Principaux */}
      <motion.section variants={itemVariants}>
        <SectionHeader title="Indicateurs clés" />
        <DashboardKPIs 
          enrichedProducts={enrichedProducts || []}
          orders={orders || []}
          productsByStatus={productsByStatus || {}}
          seuilSurstockProfond={seuilSurstockProfond}
          analyticsData={analyticsData}
        />
      </motion.section>

      {/* Graphiques */}
      <motion.section variants={itemVariants}>
        <SectionHeader title="Analyses" />
        <DashboardCharts 
          enrichedProducts={enrichedProducts || []}
          orders={orders || []}
        />
      </motion.section>

      {/* Sections Actions */}
      <motion.section variants={itemVariants}>
        <SectionHeader 
          title="Actions prioritaires" 
          badge={totalAttention > 0 ? `${totalAttention}` : null}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProductsToOrder 
            products={productsByStatus?.to_order || []} 
            onViewDetails={onViewDetails}
          />
          <ProductsToWatch 
            products={productsByStatus?.watch || []} 
            onViewDetails={onViewDetails}
          />
        </div>
      </motion.section>
    </motion.div>
  );
};

// Header de section - Style Shopify minimal
const SectionHeader = ({ title, badge }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-sm font-semibold text-[#191919]">
      {title}
    </h2>
    {badge && (
      <span className="text-xs font-medium text-[#6B7177] bg-[#F6F6F7] px-2 py-0.5 rounded">
        {badge}
      </span>
    )}
  </div>
);
