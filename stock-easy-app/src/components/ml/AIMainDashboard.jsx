/**
 * Dashboard principal IA & Prévisions
 * Organise toutes les fonctionnalités ML avec navigation par onglets
 * @module components/ml/AIMainDashboard
 */

import React from 'react';
import { Brain, BarChart3, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { SubTabsNavigation } from '../features/SubTabsNavigation';
import { MLAdvancedDashboard } from './MLAdvancedDashboard';
import { ReorderOptimizationDashboard } from './ReorderOptimizationDashboard';
import { AnomalyDashboard } from './AnomalyDashboard';
import { AIOverviewDashboard } from './AIOverviewDashboard';

export function AIMainDashboard({ products, orders, aiSubTab, setAiSubTab }) {
  return (
    <div className="space-y-6">
      {/* Navigation par onglets */}
      <SubTabsNavigation
        tabs={[
          { id: 'overview', label: 'Vue d\'Ensemble', icon: BarChart3 },
          { id: 'forecasts', label: 'Prévisions Détaillées', icon: TrendingUp },
          { id: 'optimization', label: 'Optimisation Stocks', icon: Activity },
          { id: 'anomalies', label: 'Détection Anomalies', icon: AlertTriangle }
        ]}
        activeTab={aiSubTab}
        onChange={setAiSubTab}
      />

      {/* Vue d'Ensemble */}
      {aiSubTab === 'overview' && (
        <AIOverviewDashboard products={products} orders={orders} />
      )}

      {/* Prévisions Détaillées */}
      {aiSubTab === 'forecasts' && (
        <MLAdvancedDashboard products={products} />
      )}

      {/* Optimisation des Points de Commande */}
      {aiSubTab === 'optimization' && (
        <ReorderOptimizationDashboard products={products} />
      )}

      {/* Détection d'Anomalies */}
      {aiSubTab === 'anomalies' && (
        <AnomalyDashboard products={products} orders={orders} />
      )}
    </div>
  );
}