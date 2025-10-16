import React, { useMemo } from 'react';
import { Package, AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react';
import { Container } from '../components/layout';
import { Card, CardContent } from '../components/ui/Card';
import LoadingState from '../components/shared/LoadingState';
import { formatCurrency, formatNumber } from '../utils/formatting';

const DashboardView = ({ products = [], orders = [], loading = false }) => {
  // Calcul des KPIs
  const kpis = useMemo(() => {
    const totalProducts = products.length;
    const urgentProducts = products.filter(p => p.healthStatus === 'urgent').length;
    const warningProducts = products.filter(p => p.healthStatus === 'warning').length;
    const healthyProducts = products.filter(p => p.healthStatus === 'healthy').length;
    
    const totalStockValue = products.reduce((acc, p) => acc + (p.stock * (p.price || 0)), 0);
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    
    return {
      totalProducts,
      urgentProducts,
      warningProducts,
      healthyProducts,
      totalStockValue,
      activeOrders,
    };
  }, [products, orders]);

  if (loading) {
    return <LoadingState message="Chargement du tableau de bord..." />;
  }

  return (
    <div className="py-8">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Tableau de Bord
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Vue d'ensemble de votre stock
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products */}
          <Card hoverable>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Produits Total
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    {kpis.totalProducts}
                  </p>
                </div>
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                  <Package className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Products */}
          <Card hoverable>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Produits Urgents
                  </p>
                  <p className="text-3xl font-bold text-danger-600">
                    {kpis.urgentProducts}
                  </p>
                </div>
                <div className="p-3 bg-danger-100 dark:bg-danger-900/30 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-danger-600 dark:text-danger-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Value */}
          <Card hoverable>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Valeur du Stock
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(kpis.totalStockValue, 'EUR')}
                  </p>
                </div>
                <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-success-600 dark:text-success-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card hoverable>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Commandes Actives
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    {kpis.activeOrders}
                  </p>
                </div>
                <div className="p-3 bg-warning-100 dark:bg-warning-900/30 rounded-xl">
                  <ShoppingCart className="w-8 h-8 text-warning-600 dark:text-warning-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Status Distribution */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                État de Santé du Stock
              </h3>
              
              <div className="space-y-4">
                {/* Healthy */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Bon niveau
                    </span>
                    <span className="text-sm font-semibold text-success-600">
                      {kpis.healthyProducts} produits
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div
                      className="bg-success-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(kpis.healthyProducts / kpis.totalProducts) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Warning */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Attention requise
                    </span>
                    <span className="text-sm font-semibold text-warning-600">
                      {kpis.warningProducts} produits
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div
                      className="bg-warning-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(kpis.warningProducts / kpis.totalProducts) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Urgent */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Urgent
                    </span>
                    <span className="text-sm font-semibold text-danger-600">
                      {kpis.urgentProducts} produits
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div
                      className="bg-danger-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(kpis.urgentProducts / kpis.totalProducts) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Actions Rapides
              </h3>
              
              <div className="space-y-3">
                {kpis.urgentProducts > 0 && (
                  <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-danger-900 dark:text-danger-100">
                          {kpis.urgentProducts} produit{kpis.urgentProducts > 1 ? 's' : ''} à commander d'urgence
                        </p>
                        <p className="text-sm text-danger-700 dark:text-danger-300">
                          Ces produits risquent une rupture de stock imminente
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {kpis.warningProducts > 0 && (
                  <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-warning-900 dark:text-warning-100">
                          {kpis.warningProducts} produit{kpis.warningProducts > 1 ? 's' : ''} à surveiller
                        </p>
                        <p className="text-sm text-warning-700 dark:text-warning-300">
                          Anticipez vos prochaines commandes
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {kpis.urgentProducts === 0 && kpis.warningProducts === 0 && (
                  <div className="p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-success-900 dark:text-success-100">
                          Tous vos stocks sont au bon niveau
                        </p>
                        <p className="text-sm text-success-700 dark:text-success-300">
                          Aucune action urgente requise
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default DashboardView;
