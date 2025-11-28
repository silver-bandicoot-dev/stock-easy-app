import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { DashboardKPIs } from './DashboardKPIs';
import { DashboardCharts } from './DashboardCharts';
import { RevenueComparisonChart } from './RevenueComparisonChart';
import { useAnalytics } from '../../hooks/useAnalytics';

/**
 * Génère un message de bienvenue dynamique basé sur l'heure, le jour et le contexte
 */
const getDynamicGreeting = (firstName, isReturningToday, urgentCount = 0) => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = dimanche, 6 = samedi
  const name = firstName ? ` ${firstName}` : '';
  
  // Messages du matin (5h - 12h)
  const morningGreetings = [
    { text: `Bonjour${name}`, emoji: '☀️' },
    { text: `Belle matinée${name}`, emoji: '🌅' },
    { text: `Prêt pour une belle journée${name ? `, ${firstName}` : ''}`, emoji: '💪' },
    { text: `Bon début de journée${name}`, emoji: '✨' },
  ];
  
  // Messages de l'après-midi (12h - 18h)
  const afternoonGreetings = [
    { text: `Bon après-midi${name}`, emoji: '👋' },
    { text: `L'après-midi avance bien${name ? `, ${firstName}` : ''}`, emoji: '📊' },
    { text: `On continue${name ? `, ${firstName}` : ''}`, emoji: '🚀' },
    { text: `Toujours au top${name}`, emoji: '⭐' },
  ];
  
  // Messages du soir (18h - 22h)
  const eveningGreetings = [
    { text: `Bonsoir${name}`, emoji: '🌙' },
    { text: `Belle fin de journée${name}`, emoji: '🌆' },
  ];
  
  // Messages de nuit (22h - 5h)
  const nightGreetings = [
    { text: `Travail tardif${name ? `, ${firstName}` : ''}`, emoji: '🦉' },
    { text: `Session nocturne${name}`, emoji: '🌙' },
  ];
  
  // Messages pour retour dans la journée
  const returningGreetings = [
    { text: `Content de vous revoir${name}`, emoji: '👋' },
    { text: `Encore vous${name ? `, ${firstName}` : ''}`, emoji: '😊' },
    { text: `Re-bonjour${name}`, emoji: '✌️' },
  ];
  
  // Messages spéciaux par jour
  const specialDayGreetings = {
    1: [{ text: `Bon lundi${name}`, emoji: '💪' }, { text: `Nouvelle semaine${name ? `, ${firstName}` : ''}`, emoji: '🚀' }], // Lundi
    5: [{ text: `Bon vendredi${name}`, emoji: '🎉' }, { text: `Presque le weekend${name ? `, ${firstName}` : ''}`, emoji: '🙌' }], // Vendredi
    6: [{ text: `Bon samedi${name}`, emoji: '☀️' }], // Samedi
    0: [{ text: `Bon dimanche${name}`, emoji: '🌿' }], // Dimanche
  };
  
  // Messages si beaucoup de produits urgents
  const urgentGreetings = [
    { text: `Des actions vous attendent${name}`, emoji: '⚡' },
    { text: `Quelques urgences à gérer${name ? `, ${firstName}` : ''}`, emoji: '📋' },
  ];
  
  let greetingPool;
  
  // Si retour dans la journée
  if (isReturningToday) {
    greetingPool = returningGreetings;
  }
  // Si beaucoup de produits urgents (> 5)
  else if (urgentCount > 5) {
    greetingPool = urgentGreetings;
  }
  // Message spécial du jour (20% de chance)
  else if (specialDayGreetings[dayOfWeek] && Math.random() < 0.2) {
    greetingPool = specialDayGreetings[dayOfWeek];
  }
  // Sinon, basé sur l'heure
  else if (hour >= 5 && hour < 12) {
    greetingPool = morningGreetings;
  } else if (hour >= 12 && hour < 18) {
    greetingPool = afternoonGreetings;
  } else if (hour >= 18 && hour < 22) {
    greetingPool = eveningGreetings;
  } else {
    greetingPool = nightGreetings;
  }
  
  // Sélection pseudo-aléatoire mais stable pour la session
  const sessionSeed = Math.floor(Date.now() / (1000 * 60 * 5)); // Change toutes les 5 minutes
  const index = sessionSeed % greetingPool.length;
  
  return greetingPool[index];
};

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

  // Stats rapides
  const urgentCount = productsByStatus?.to_order?.length || 0;
  
  // Message de bienvenue dynamique
  const greeting = useMemo(() => 
    getDynamicGreeting(firstName, isReturningToday, urgentCount),
    [firstName, isReturningToday, urgentCount]
  );

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
            {greeting.text} {greeting.emoji}
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

      {/* Badge de statut - Discret mais informatif */}
      {urgentCount > 0 && (
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#191919] bg-[#FFF4F4] border border-[#FED3D1] rounded">
            <span className="w-1.5 h-1.5 bg-[#D72C0D] rounded-full" />
            {urgentCount} à commander
          </span>
        </motion.div>
      )}

      {/* Graphique CA vs Objectifs - Position principale */}
      <motion.section variants={itemVariants}>
        <RevenueComparisonChart />
      </motion.section>

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
