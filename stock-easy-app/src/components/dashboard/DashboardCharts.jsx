import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SimpleChart } from './SimpleChart';

/**
 * Composant DashboardCharts - Regroupe les graphiques du dashboard
 */
export function DashboardCharts({ enrichedProducts = [], orders = [] }) {
  const { t } = useTranslation();
  
  // Données pour le graphique de distribution de santé
  const healthDistribution = useMemo(() => {
    const urgent = enrichedProducts.filter(p => p.healthStatus === 'urgent').length;
    const warning = enrichedProducts.filter(p => p.healthStatus === 'warning').length;
    const healthy = enrichedProducts.filter(p => p.healthStatus === 'healthy').length;

    return [
      { name: t('dashboard.healthDistribution.urgent'), value: urgent, color: '#EF1C43' },
      { name: t('dashboard.healthDistribution.toWatch'), value: warning, color: '#F59E0B' },
      { name: t('dashboard.healthDistribution.healthy'), value: healthy, color: '#10B981' }
    ].filter(item => item.value > 0);
  }, [enrichedProducts, t]);

  // Données pour le graphique des commandes par statut
  const ordersByStatus = useMemo(() => {
    const statusLabels = {
      pending: t('dashboard.ordersByStatus.pending'),
      preparing: t('dashboard.ordersByStatus.preparing'),
      inTransit: t('dashboard.ordersByStatus.inTransit'),
      received: t('dashboard.ordersByStatus.received'),
      reconciliation: t('dashboard.ordersByStatus.reconciliation')
    };
    
    const statusCounts = [
      { key: 'pending', count: orders.filter(o => o.status === 'pending_confirmation').length },
      { key: 'preparing', count: orders.filter(o => o.status === 'preparing').length },
      { key: 'inTransit', count: orders.filter(o => o.status === 'in_transit').length },
      { key: 'received', count: orders.filter(o => o.status === 'received').length },
      { key: 'reconciliation', count: orders.filter(o => o.status === 'reconciliation').length }
    ];

    // Couleurs selon les standards de l'application
    const statusColors = {
      pending: '#F59E0B',
      preparing: '#8B5CF6',
      inTransit: '#8B5CF6',
      received: '#10B981',
      reconciliation: '#EF1C43'
    };

    return statusCounts
      .map(({ key, count }) => ({ name: statusLabels[key], value: count, color: statusColors[key] || '#8B5CF6' }))
      .filter(item => item.value > 0);
  }, [orders, t]);

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
          title={t('dashboard.healthDistribution.title')}
          height={300}
        />
      )}

      {/* Graphique des commandes par statut */}
      {ordersByStatus.length > 0 && (
        <SimpleChart
          type="bar"
          data={ordersByStatus}
          title={t('dashboard.ordersByStatus.title')}
          height={300}
        />
      )}
    </div>
  );
}

export default DashboardCharts;

