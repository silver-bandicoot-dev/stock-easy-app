import React, { useMemo } from 'react';
import { SimpleChart } from './SimpleChart';

/**
 * Composant DashboardCharts - Regroupe les graphiques du dashboard
 */
export function DashboardCharts({ enrichedProducts = [], orders = [] }) {
  // Données pour le graphique de distribution de santé
  const healthDistribution = useMemo(() => {
    const urgent = enrichedProducts.filter(p => p.healthStatus === 'urgent').length;
    const warning = enrichedProducts.filter(p => p.healthStatus === 'warning').length;
    const healthy = enrichedProducts.filter(p => p.healthStatus === 'healthy').length;

    return [
      { name: 'Urgent', value: urgent, color: '#EF1C43' },
      { name: 'À Surveiller', value: warning, color: '#F59E0B' },
      { name: 'En Bonne Santé', value: healthy, color: '#10B981' }
    ].filter(item => item.value > 0);
  }, [enrichedProducts]);

  // Données pour le graphique des commandes par statut
  const ordersByStatus = useMemo(() => {
    const statusCounts = {
      'En Attente': orders.filter(o => o.status === 'pending_confirmation').length,
      'En Préparation': orders.filter(o => o.status === 'preparing').length,
      'En Transit': orders.filter(o => o.status === 'in_transit').length,
      'Reçues': orders.filter(o => o.status === 'received').length,
      'Réconciliation': orders.filter(o => o.status === 'reconciliation').length
    };

    // Couleurs selon les standards de l'application
    const statusColors = {
      'En Attente': '#F59E0B',
      'En Préparation': '#8B5CF6',
      'En Transit': '#8B5CF6',
      'Reçues': '#10B981',
      'Réconciliation': '#EF1C43'
    };

    return Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value, color: statusColors[name] || '#8B5CF6' }))
      .filter(item => item.value > 0);
  }, [orders]);

  // Ne pas afficher si pas de données
  if (enrichedProducts.length === 0 && orders.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Graphique de distribution de santé */}
      {healthDistribution.length > 0 && (
        <SimpleChart
          type="pie"
          data={healthDistribution}
          title="Distribution de Santé des Produits"
          height={300}
        />
      )}

      {/* Graphique des commandes par statut */}
      {ordersByStatus.length > 0 && (
        <SimpleChart
          type="bar"
          data={ordersByStatus}
          title="Commandes par Statut"
          height={300}
        />
      )}
    </div>
  );
}

export default DashboardCharts;

