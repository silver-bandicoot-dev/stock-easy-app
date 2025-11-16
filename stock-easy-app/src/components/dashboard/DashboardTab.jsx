import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Package } from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { ProductsToOrder } from './ProductsToOrder';
import { ProductsToWatch } from './ProductsToWatch';
import { DashboardKPIs } from './DashboardKPIs';
import { DashboardCharts } from './DashboardCharts';

export const DashboardTab = ({ productsByStatus, orders, enrichedProducts, onViewDetails }) => {
  const { currentUser } = useAuth();
  const [isReturningToday, setIsReturningToday] = useState(false);

  useEffect(() => {
    const STORAGE_KEY = 'stockeasy_dashboard_last_visit';
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10); // AAAA-MM-JJ

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
      // En cas de problème avec localStorage, on ignore et on garde le message par défaut
      console.warn('Impossible de lire/écrire dans localStorage pour le dashboard:', e);
    }
  }, []);

  const firstName =
    currentUser?.firstName ||
    currentUser?.user_metadata?.first_name ||
    currentUser?.displayName ||
    '';

  const greetingText = isReturningToday
    ? `Ravi de vous revoir${firstName ? ` ${firstName}` : ''} 👋`
    : `Bonjour${firstName ? ` ${firstName}` : ''} 👋`;

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
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#191919]">
            {greetingText}
          </h1>
          <p className="text-sm text-[#666663]">
            Vue d'ensemble de votre inventaire et commandes
          </p>
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
