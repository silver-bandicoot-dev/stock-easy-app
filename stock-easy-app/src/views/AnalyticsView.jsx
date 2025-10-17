import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart } from 'lucide-react';
import KPICard from '../components/features/Dashboard/KPICard';

export const AnalyticsView = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    // Charger les analytics depuis l'API
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    // TODO: Appeler votre API analytics
    // Pour l'exemple, données fictives
    setAnalytics({
      revenue: {
        current: 45230,
        previous: 38900,
        trend: 16.3
      },
      orders: {
        current: 234,
        previous: 198,
        trend: 18.2
      },
      products: {
        current: 1250,
        previous: 1180,
        trend: 5.9
      },
      revenueOverTime: [
        { date: '01/10', revenue: 4200 },
        { date: '08/10', revenue: 5100 },
        { date: '15/10', revenue: 4800 },
        { date: '22/10', revenue: 6300 },
        { date: '29/10', revenue: 7200 },
      ],
      topProducts: [
        { name: 'Produit A', sales: 145 },
        { name: 'Produit B', sales: 98 },
        { name: 'Produit C', sales: 76 },
        { name: 'Produit D', sales: 54 },
        { name: 'Produit E', sales: 32 },
      ],
      categoryDistribution: [
        { name: 'Électronique', value: 35 },
        { name: 'Vêtements', value: 25 },
        { name: 'Alimentation', value: 20 },
        { name: 'Maison', value: 15 },
        { name: 'Autres', value: 5 },
      ]
    });
  };

  if (!analytics) {
    return <div className="p-6">Chargement...</div>;
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Analysez vos performances</p>
        </div>

        {/* Sélecteur de période */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="90d">90 derniers jours</option>
          <option value="1y">1 an</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Chiffre d'affaires"
          value={`${analytics.revenue.current.toLocaleString()}€`}
          trend={analytics.revenue.trend}
          icon={DollarSign}
          color="success"
        />
        <KPICard
          title="Commandes"
          value={analytics.orders.current}
          trend={analytics.orders.trend}
          icon={ShoppingCart}
          color="info"
        />
        <KPICard
          title="Produits"
          value={analytics.products.current}
          trend={analytics.products.trend}
          icon={Package}
          color="primary"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution du CA */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Évolution du chiffre d'affaires
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                name="CA (€)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top produits */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 des produits
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#3b82f6" name="Ventes" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution par catégorie */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition par catégorie
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} (${entry.value}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
