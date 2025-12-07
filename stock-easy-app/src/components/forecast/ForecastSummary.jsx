/**
 * ForecastSummary - Récapitulatif des prévisions pour tous les produits
 * 
 * Affiche une vue d'ensemble des prévisions ML pour un marchand
 * avec beaucoup de produits, sans avoir à les parcourir un par un.
 * 
 * @module components/forecast/ForecastSummary
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Zap,
  ShoppingCart
} from 'lucide-react';
import { SmartForecastEngine } from '../../services/forecast/SmartForecastEngine';

/**
 * Composant principal de récapitulatif des prévisions
 */
export function ForecastSummary({ products, orders, onSelectProduct }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('risk'); // risk, forecast, stock, name
  const [filterBy, setFilterBy] = useState('all'); // all, alerts, lowStock, highDemand

  // Calculer les prévisions pour tous les produits (memoized)
  const productForecasts = useMemo(() => {
    const engine = new SmartForecastEngine();
    
    return products.map(product => {
      // Générer un historique simplifié depuis salesPerDay
      const salesHistory = generateSimpleSalesHistory(product);
      
      // Calculer prévision 7 jours
      let forecast7d = 0;
      let forecast30d = 0;
      let confidence = 0;
      let trend = 'stable';
      let riskLevel = 'low';
      
      try {
        if (salesHistory.length >= 7) {
          const predictions = engine.predictMultipleDays(salesHistory, 30);
          forecast7d = predictions.slice(0, 7).reduce((sum, p) => sum + p.value, 0);
          forecast30d = predictions.reduce((sum, p) => sum + p.value, 0);
          confidence = predictions[0]?.confidence || 0;
          
          // Calculer tendance
          const avgFirst = predictions.slice(0, 7).reduce((s, p) => s + p.value, 0) / 7;
          const avgLast = predictions.slice(-7).reduce((s, p) => s + p.value, 0) / 7;
          trend = avgLast > avgFirst * 1.1 ? 'up' : avgLast < avgFirst * 0.9 ? 'down' : 'stable';
        } else {
          // Estimation basique
          forecast7d = Math.round((product.salesPerDay || 0) * 7);
          forecast30d = Math.round((product.salesPerDay || 0) * 30);
          confidence = 0.3;
        }
      } catch (e) {
        console.warn('Forecast error for', product.sku, e);
      }
      
      // Calculer le risque de rupture
      const daysOfStock = product.salesPerDay > 0 
        ? Math.floor((product.stock || 0) / product.salesPerDay)
        : 999;
      
      if (daysOfStock <= 7) {
        riskLevel = 'critical';
      } else if (daysOfStock <= 14) {
        riskLevel = 'high';
      } else if (daysOfStock <= 30) {
        riskLevel = 'medium';
      }
      
      // Alertes
      const alerts = [];
      if (daysOfStock <= 7 && product.salesPerDay > 0) {
        alerts.push({ type: 'stockout', message: t('analytics.forecast.summary.stockoutRisk', { days: daysOfStock }) });
      }
      if (trend === 'up' && product.stock < forecast7d) {
        alerts.push({ type: 'demand', message: t('analytics.forecast.summary.demandIncrease') });
      }
      if (product.stock > forecast30d * 2 && product.salesPerDay > 0) {
        alerts.push({ type: 'overstock', message: t('analytics.forecast.summary.overstock') });
      }
      
      return {
        ...product,
        forecast7d,
        forecast30d,
        confidence,
        trend,
        riskLevel,
        daysOfStock,
        alerts
      };
    });
  }, [products, t]);

  // KPIs globaux
  const globalKPIs = useMemo(() => {
    const activeProducts = productForecasts.filter(p => (p.salesPerDay || 0) > 0);
    const criticalProducts = productForecasts.filter(p => p.riskLevel === 'critical');
    const highRiskProducts = productForecasts.filter(p => p.riskLevel === 'high');
    const totalForecast30d = productForecasts.reduce((sum, p) => sum + p.forecast30d, 0);
    const avgConfidence = activeProducts.length > 0
      ? activeProducts.reduce((sum, p) => sum + p.confidence, 0) / activeProducts.length
      : 0;
    const trendingUp = productForecasts.filter(p => p.trend === 'up').length;
    const trendingDown = productForecasts.filter(p => p.trend === 'down').length;
    
    return {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      criticalProducts: criticalProducts.length,
      highRiskProducts: highRiskProducts.length,
      totalForecast30d,
      avgConfidence,
      trendingUp,
      trendingDown
    };
  }, [productForecasts, products.length]);

  // Filtrer et trier
  const filteredProducts = useMemo(() => {
    let filtered = [...productForecasts];
    
    // Recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(term) || 
        p.sku?.toLowerCase().includes(term)
      );
    }
    
    // Filtres
    switch (filterBy) {
      case 'alerts':
        filtered = filtered.filter(p => p.alerts.length > 0);
        break;
      case 'lowStock':
        filtered = filtered.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');
        break;
      case 'highDemand':
        filtered = filtered.filter(p => p.trend === 'up');
        break;
    }
    
    // Tri
    switch (sortBy) {
      case 'risk':
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        filtered.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
        break;
      case 'forecast':
        filtered.sort((a, b) => b.forecast30d - a.forecast30d);
        break;
      case 'stock':
        filtered.sort((a, b) => a.daysOfStock - b.daysOfStock);
        break;
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
    }
    
    return filtered;
  }, [productForecasts, searchTerm, filterBy, sortBy]);

  return (
    <div className="space-y-6">
      {/* En-tête avec badge AI */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('analytics.forecast.summary.title')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('analytics.forecast.summary.subtitle', { count: globalKPIs.activeProducts })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-full">
          <Zap className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">
            {t('analytics.forecast.aiPowered')}
          </span>
        </div>
      </div>

      {/* KPIs Globaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Package}
          label={t('analytics.forecast.summary.totalForecast30d')}
          value={globalKPIs.totalForecast30d.toLocaleString()}
          subtitle={t('analytics.forecast.summary.unitsExpected')}
          color="purple"
        />
        <KPICard
          icon={AlertTriangle}
          label={t('analytics.forecast.summary.productsAtRisk')}
          value={globalKPIs.criticalProducts + globalKPIs.highRiskProducts}
          subtitle={t('analytics.forecast.summary.needsAttention')}
          color={globalKPIs.criticalProducts > 0 ? 'red' : 'yellow'}
          highlight={globalKPIs.criticalProducts > 0}
        />
        <KPICard
          icon={TrendingUp}
          label={t('analytics.forecast.summary.trendingUp')}
          value={globalKPIs.trendingUp}
          subtitle={t('analytics.forecast.summary.demandIncreasing')}
          color="green"
        />
        <KPICard
          icon={Brain}
          label={t('analytics.forecast.summary.avgConfidence')}
          value={`${Math.round(globalKPIs.avgConfidence * 100)}%`}
          subtitle={t('analytics.forecast.summary.modelReliability')}
          color={globalKPIs.avgConfidence > 0.7 ? 'green' : globalKPIs.avgConfidence > 0.5 ? 'yellow' : 'orange'}
        />
      </div>

      {/* Alertes critiques */}
      {globalKPIs.criticalProducts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">
                {t('analytics.forecast.summary.criticalAlert', { count: globalKPIs.criticalProducts })}
              </h3>
              <p className="text-sm text-red-600">
                {t('analytics.forecast.summary.criticalAlertDesc')}
              </p>
            </div>
            <button
              onClick={() => setFilterBy('lowStock')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              {t('analytics.forecast.summary.viewCritical')}
            </button>
          </div>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4 bg-white rounded-xl p-4 border border-[#E5E4DF]">
        {/* Recherche */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('analytics.forecast.summary.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        {/* Filtre */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">{t('analytics.forecast.summary.filterAll')}</option>
            <option value="alerts">{t('analytics.forecast.summary.filterAlerts')}</option>
            <option value="lowStock">{t('analytics.forecast.summary.filterLowStock')}</option>
            <option value="highDemand">{t('analytics.forecast.summary.filterHighDemand')}</option>
          </select>
        </div>
        
        {/* Tri */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="risk">{t('analytics.forecast.summary.sortRisk')}</option>
            <option value="forecast">{t('analytics.forecast.summary.sortForecast')}</option>
            <option value="stock">{t('analytics.forecast.summary.sortStock')}</option>
            <option value="name">{t('analytics.forecast.summary.sortName')}</option>
          </select>
        </div>
      </div>

      {/* Tableau des produits */}
      <div className="bg-white rounded-xl border border-[#E5E4DF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  {t('analytics.forecast.summary.product')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  {t('analytics.forecast.summary.stock')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  {t('analytics.forecast.summary.forecast7d')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  {t('analytics.forecast.summary.forecast30d')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  {t('analytics.forecast.summary.trend')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  {t('analytics.forecast.summary.risk')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  {t('analytics.forecast.summary.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.slice(0, 50).map((product) => (
                <ProductRow
                  key={product.sku}
                  product={product}
                  onSelect={() => onSelectProduct(product)}
                  t={t}
                />
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    {t('analytics.forecast.summary.noProducts')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer avec pagination */}
        {filteredProducts.length > 50 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            {t('analytics.forecast.summary.showing', { shown: 50, total: filteredProducts.length })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Carte KPI
 */
function KPICard({ icon: Icon, label, value, subtitle, color, highlight }) {
  const colorClasses = {
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]} ${highlight ? 'ring-2 ring-red-400' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs opacity-75 mt-1">{subtitle}</div>
    </div>
  );
}

/**
 * Ligne de produit dans le tableau
 */
function ProductRow({ product, onSelect, t }) {
  const riskColors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700'
  };

  const riskLabels = {
    critical: t('analytics.forecast.summary.riskCritical'),
    high: t('analytics.forecast.summary.riskHigh'),
    medium: t('analytics.forecast.summary.riskMedium'),
    low: t('analytics.forecast.summary.riskLow')
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Produit */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
            ) : (
              <Package className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900 line-clamp-1">{product.name}</div>
            <div className="text-xs text-gray-500">{product.sku}</div>
          </div>
          {product.alerts.length > 0 && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
      </td>
      
      {/* Stock actuel */}
      <td className="px-4 py-3 text-center">
        <div className="font-medium text-gray-900">{product.stock || 0}</div>
        <div className="text-xs text-gray-500">
          {product.daysOfStock < 999 
            ? t('analytics.forecast.summary.daysLeft', { days: product.daysOfStock })
            : '-'
          }
        </div>
      </td>
      
      {/* Prévision 7j */}
      <td className="px-4 py-3 text-center">
        <div className="font-medium text-purple-700">{product.forecast7d}</div>
      </td>
      
      {/* Prévision 30j */}
      <td className="px-4 py-3 text-center">
        <div className="font-medium text-purple-700">{product.forecast30d}</div>
      </td>
      
      {/* Tendance */}
      <td className="px-4 py-3 text-center">
        {product.trend === 'up' && (
          <span className="inline-flex items-center gap-1 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">{t('analytics.forecast.summary.trendUp')}</span>
          </span>
        )}
        {product.trend === 'down' && (
          <span className="inline-flex items-center gap-1 text-red-600">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-medium">{t('analytics.forecast.summary.trendDown')}</span>
          </span>
        )}
        {product.trend === 'stable' && (
          <span className="text-xs text-gray-500">{t('analytics.forecast.summary.trendStable')}</span>
        )}
      </td>
      
      {/* Niveau de risque */}
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${riskColors[product.riskLevel]}`}>
          {riskLabels[product.riskLevel]}
        </span>
      </td>
      
      {/* Actions */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={onSelect}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          {t('analytics.forecast.summary.viewDetails')}
        </button>
      </td>
    </tr>
  );
}

/**
 * Génère un historique simplifié à partir de salesPerDay
 */
function generateSimpleSalesHistory(product) {
  if (!product.salesPerDay || product.salesPerDay === 0) {
    return [];
  }

  const history = [];
  const today = new Date();
  const variation = 0.2;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const randomVariation = (Math.random() - 0.5) * 2 * variation;
    const quantity = Math.max(0, Math.round(product.salesPerDay * (1 + randomVariation)));
    
    history.push({
      date: date.toISOString().split('T')[0],
      quantity
    });
  }

  return history;
}

export default ForecastSummary;

