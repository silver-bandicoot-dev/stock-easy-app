import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, Package, Zap, TrendingUp, DollarSign, Boxes, Lightbulb, ShoppingCart, AlertTriangle, CheckCircle, Package2, Heart, TrendingDown, Activity, ChevronDown, AlertCircle, TrendingUp as TrendingUpIcon, Info, Brain } from 'lucide-react';
import { KPICard } from '../features/KPICard/KPICard';
import { DateRangePicker } from './DateRangePicker';
import { ComparisonSelector } from './ComparisonSelector';
import { ChartModal } from '../features/ChartModal/ChartModal';
import { InsightAlert } from '../features/InsightAlert';
import { useAnalytics } from '../../hooks/useAnalytics';
import { calculateAnalyticsKPIs } from '../../utils/analyticsKPIs';
import { useCurrency } from '../../contexts/CurrencyContext';
import { calculatePeriodComparison } from '../../services/kpiHistoryService';
import { calculateTotalPotentialRevenueML } from '../../services/ml/revenueForecastService';
import { DemandForecastModel } from '../../services/ml/demandForecastModel';

export const AnalyticsTab = ({
  products,
  orders,
  suppliers,
  warehouses,
  seuilSurstockProfond = 90
}) => {
  // États locaux pour les contrôles d'analytics
  const [dateRange, setDateRange] = useState('30d');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [comparisonType, setComparisonType] = useState('same_last_year');
  
  // États pour le modal de graphique
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  
  // États pour les catégories d'insights (accordéons)
  const [expandedCategories, setExpandedCategories] = useState({
    alertes: false,
    performance: false,
    financier: false
  });
  
  // Flag pour suivre si l'utilisateur a déjà interagi avec les accordéons
  const [userHasInteracted, setUserHasInteracted] = useState({
    alertes: false,
    performance: false,
    financier: false
  });

  // États pour le calcul ML du revenu potentiel
  const [mlRevenueData, setMlRevenueData] = useState(null);
  const [mlRevenueLoading, setMlRevenueLoading] = useState(false);
  const [mlModel, setMlModel] = useState(null);

  // Utiliser le hook useAnalytics pour calculer les KPIs
  const analyticsData = useAnalytics(products, orders, dateRange, customRange, comparisonType, seuilSurstockProfond);
  const { format: formatCurrency } = useCurrency();

  // Initialiser et charger le modèle ML
  useEffect(() => {
    const initMLModel = async () => {
      try {
        const model = new DemandForecastModel();
        const loaded = await model.load();
        if (loaded) {
          console.log('✅ Modèle ML chargé pour calcul du revenu potentiel');
          setMlModel(model);
        } else {
          console.log('ℹ️ Aucun modèle ML sauvegardé, utilisation de calcul statistique');
          setMlModel(null);
        }
      } catch (error) {
        console.warn('⚠️ Erreur chargement modèle ML:', error);
        setMlModel(null);
      }
    };

    initMLModel();
  }, []);

  // Calculer le revenu potentiel avec ML lorsque les produits changent
  useEffect(() => {
    const calculateMLRevenue = async () => {
      if (!products || products.length === 0) {
        return;
      }

      setMlRevenueLoading(true);
      try {
        console.log('🤖 Calcul du Revenu Potentiel avec ML...');
        const result = await calculateTotalPotentialRevenueML(products, mlModel, {
          forecastDays: 90,
          useSeasonality: true,
          useRotationRate: true,
          useMLPredictions: mlModel !== null
        });
        
        setMlRevenueData(result);
        console.log('✅ Revenu Potentiel ML calculé:', result.totalRevenue);
      } catch (error) {
        console.error('❌ Erreur calcul revenu potentiel ML:', error);
        // En cas d'erreur, utiliser les données de base
        setMlRevenueData(null);
      } finally {
        setMlRevenueLoading(false);
      }
    };

    // Délai pour éviter trop de calculs lors du changement rapide de produits
    const timeoutId = setTimeout(calculateMLRevenue, 500);
    return () => clearTimeout(timeoutId);
  }, [products, mlModel]);

  // Calculer les KPIs supplémentaires pour Analytics avec comparaisons
  const additionalKPIs = useMemo(() => {
    // Calculer les KPIs actuels avec données ML pour le revenu potentiel
    const currentKPIs = calculateAnalyticsKPIs(products, orders, formatCurrency, mlRevenueData);
    
    // Simuler des valeurs de comparaison (variation de ±5 à ±15% pour montrer une tendance)
    // En production, ces valeurs devraient venir de l'historique stocké
    const simulateComparison = (currentValue, key) => {
      // Générer une variation réaliste selon le type de KPI
      let variation = 0.08; // 8% par défaut
      if (key.includes('Percentage') || key === 'inTransit' || key === 'healthyPercentage') {
        variation = 0.05; // 5% pour les pourcentages
      } else if (key.includes('Margin') || key.includes('Revenue')) {
        variation = 0.12; // 12% pour les valeurs financières
      }
      
      // Simuler une valeur précédente (légèrement différente)
      const randomFactor = 0.9 + (Math.random() * 0.2); // Entre 0.9 et 1.1
      const previousValue = currentValue.rawValue * randomFactor;
      
      // Calculer la comparaison
      const comparison = calculatePeriodComparison(currentValue.rawValue, previousValue);
      
      // Générer des données de graphique simulées basées sur la période
      // (normaliser pour affichage 0-100)
      const generateChartData = (baseValue) => {
        const data = [];
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 12 : 12;
        for (let i = 0; i < days; i++) {
          const variationAmount = baseValue * variation * (Math.random() * 2 - 1);
          const value = Math.max(0, baseValue + variationAmount);
          // Normaliser pour affichage (0-100)
          const normalizedValue = baseValue > 0 
            ? Math.min(100, (value / (baseValue * 1.2)) * 100)
            : 50;
          data.push(normalizedValue);
        }
        return data;
      };
      
      return {
        ...currentValue,
        change: comparison.change,
        changePercent: comparison.changePercent,
        trend: comparison.trend,
        chartData: generateChartData(currentValue.rawValue),
        comparisonPeriod: analyticsData.skuAvailability?.comparisonPeriod || 'période précédente'
      };
    };
    
    // Appliquer les comparaisons à tous les KPIs
    const kpisWithComparison = {};
    Object.entries(currentKPIs).forEach(([key, kpi]) => {
      kpisWithComparison[key] = simulateComparison(kpi, key);
    });
    
    return kpisWithComparison;
  }, [products, orders, formatCurrency, analyticsData, dateRange, mlRevenueData]);
  
  // Catégoriser les insights
  const categorizedInsights = useMemo(() => {
    const alertes = [];
    const performance = [];
    const financier = [];
    
    // Catégorie 1: Alertes (warning/danger) - Problèmes nécessitant une attention
    if (analyticsData.skuAvailability?.rawValue <= 60) {
      alertes.push({ 
        key: 'disponibility', 
        type: 'warning', 
        title: 'Disponibilité des SKU', 
        value: `${analyticsData.skuAvailability.rawValue}%`, 
        icon: CheckCircle, 
        message: "Attention ! Votre taux de disponibilité est faible. Risque de perte de ventes." 
      });
    }
    if (analyticsData.salesLost?.rawValue >= 1000) {
      alertes.push({ 
        key: 'salesLost', 
        type: analyticsData.salesLost.rawValue < 5000 ? 'warning' : 'danger', 
        title: 'Ventes Perdues', 
        value: analyticsData.salesLost.value, 
        icon: TrendingDown, 
        message: analyticsData.salesLost.rawValue < 5000 
          ? "Pertes de ventes modérées. Surveillez vos points de commande." 
          : "Pertes de ventes importantes ! Revoyez votre stratégie de réapprovisionnement." 
      });
    }
    if (analyticsData.overstockCost?.rawValue >= 2000) {
      alertes.push({ 
        key: 'overstock', 
        type: analyticsData.overstockCost.rawValue < 10000 ? 'warning' : 'danger', 
        title: 'Valeur des Surstocks', 
        value: analyticsData.overstockCost.value, 
        icon: Boxes, 
        message: analyticsData.overstockCost.rawValue < 10000 
          ? "Surstock modéré. Surveillez vos niveaux de sécurité." 
          : "Surstock important ! Optimisez vos points de commande et niveaux de sécurité." 
      });
    }
    if (additionalKPIs?.healthyPercentage && additionalKPIs.healthyPercentage.rawValue < 50) {
      alertes.push({ 
        key: 'health', 
        type: 'warning', 
        title: 'Santé des Produits', 
        value: `${additionalKPIs.healthyPercentage.rawValue}%`, 
        icon: Heart, 
        message: `Attention ! Seulement ${additionalKPIs.healthyPercentage.rawValue}% de vos produits sont en bonne santé. Revoyez vos stratégies de réapprovisionnement.` 
      });
    }
    
    // Catégorie 2: Performance (info/success) - État actuel et métriques de performance
    if (analyticsData.skuAvailability?.rawValue > 60) {
      performance.push({ 
        key: 'disponibility', 
        type: analyticsData.skuAvailability.rawValue > 80 ? 'success' : 'info', 
        title: 'Disponibilité des SKU', 
        value: `${analyticsData.skuAvailability.rawValue}%`, 
        icon: CheckCircle, 
        message: analyticsData.skuAvailability.rawValue > 80 
          ? "Excellent taux de disponibilité ! Vos clients peuvent compter sur vous." 
          : "Bon taux de disponibilité, mais il y a de la marge d'amélioration." 
      });
    }
    if (analyticsData.salesLost?.rawValue < 1000) {
      performance.push({ 
        key: 'salesLost', 
        type: 'success', 
        title: 'Ventes Perdues', 
        value: analyticsData.salesLost.value, 
        icon: TrendingDown, 
        message: "Faibles pertes de ventes. Votre gestion des stocks est efficace." 
      });
    }
    if (analyticsData.overstockCost?.rawValue < 2000) {
      performance.push({ 
        key: 'overstock', 
        type: 'success', 
        title: 'Valeur des Surstocks', 
        value: analyticsData.overstockCost.value, 
        icon: Boxes, 
        message: "Faible niveau de surstock. Votre optimisation est efficace." 
      });
    }
    if (additionalKPIs?.inTransit) {
      performance.push({ 
        key: 'inTransit', 
        type: additionalKPIs.inTransit.rawValue > 50 ? 'warning' : 'info', 
        title: 'Commandes en Transit', 
        value: `${additionalKPIs.inTransit.rawValue}%`, 
        icon: Package2, 
        message: additionalKPIs.inTransit.rawValue > 50 
          ? `${additionalKPIs.inTransit.rawValue}% de vos commandes sont en transit. Surveillez les arrivées et préparez l'espace de stockage.` 
          : additionalKPIs.inTransit.rawValue > 20 
          ? `${additionalKPIs.inTransit.rawValue}% de vos commandes sont en transit. Suivez les dates d'arrivée.` 
          : "Peu de commandes en transit actuellement. Bon flux de livraison." 
      });
    }
    if (additionalKPIs?.healthyPercentage && additionalKPIs.healthyPercentage.rawValue >= 50) {
      performance.push({ 
        key: 'health', 
        type: additionalKPIs.healthyPercentage.rawValue > 70 ? 'success' : 'info', 
        title: 'Santé des Produits', 
        value: `${additionalKPIs.healthyPercentage.rawValue}%`, 
        icon: Heart, 
        message: additionalKPIs.healthyPercentage.rawValue > 70 
          ? `Excellent ! ${additionalKPIs.healthyPercentage.rawValue}% de vos produits sont en bonne santé. Continuez sur cette voie.` 
          : `${additionalKPIs.healthyPercentage.rawValue}% de vos produits sont en bonne santé. Il y a de la marge d'amélioration.` 
      });
    }
    if (additionalKPIs?.fastRotatingProducts) {
      const rotationKPI = additionalKPIs.fastRotatingProducts;
      const rotationRate = rotationKPI.averageRotationRate || 0;
      let message = '';
      
      if (rotationKPI.rawValue > 20) {
        message = `${rotationKPI.rawValue} produits à rotation rapide avec une rotation moyenne de ${rotationRate} rotations/an. Excellente dynamique commerciale !`;
      } else if (rotationKPI.rawValue > 10) {
        message = `${rotationKPI.rawValue} produits à rotation rapide avec une rotation moyenne de ${rotationRate} rotations/an. Bonne dynamique.`;
      } else {
        message = `Seulement ${rotationKPI.rawValue} produits à rotation rapide. Rotation moyenne de ${rotationRate} rotations/an. Envisagez des promotions pour accélérer les rotations.`;
      }
      
      performance.push({ 
        key: 'rotation', 
        type: rotationKPI.rawValue > 20 ? 'success' : rotationKPI.rawValue > 10 ? 'info' : 'warning', 
        title: 'Rotation Rapide', 
        value: `${rotationKPI.rawValue} (${rotationRate} rot/an moy)`, 
        icon: Activity, 
        message: message
      });
    }
    
    // Catégorie 3: Financier (info) - Informations financières
    if (analyticsData.inventoryValuation) {
      financier.push({ 
        key: 'inventory', 
        type: 'info', 
        title: "Valeur de l'Inventaire", 
        value: analyticsData.inventoryValuation.value, 
        icon: DollarSign, 
        message: analyticsData.inventoryValuation.analysis || 
          (analyticsData.inventoryValuation.rawValue > 100000
            ? "Inventaire de grande valeur. Surveillez attentivement les rotations."
            : analyticsData.inventoryValuation.rawValue > 50000
            ? "Inventaire de valeur modérée. Maintenez un bon équilibre."
            : "Inventaire de faible valeur. Opportunité d'augmenter les stocks.") 
      });
    }
    
    // Revenu Potentiel (ML) - Insight basé sur prévisions ML
    if (additionalKPIs?.totalPotentialRevenue) {
      const revenueKPI = additionalKPIs.totalPotentialRevenue;
      const mlData = revenueKPI.mlData;
      const confidence = mlData?.confidence || 0;
      const hasML = mlData?.dataQuality?.mlAvailable || false;
      const productsWithHistory = mlData?.dataQuality?.productsWithHistory || 0;
      const totalHistoryRecords = mlData?.dataQuality?.totalHistoryRecords || 0;
      
      // Déterminer le message principal selon le type de calcul
      let message = '';
      if (hasML) {
        message = `Prévisions basées sur Machine Learning (confiance: ${confidence}%). ${productsWithHistory} produits avec historique, ${totalHistoryRecords} enregistrements analysés.`;
      } else {
        message = `Calcul statistique basé sur l'historique des ventes et la rotation (${confidence}% de confiance). Pour améliorer la précision, entraînez le modèle ML depuis l'onglet AI.`;
      }
      
      financier.push({
        key: 'potentialRevenue',
        type: confidence > 70 ? 'success' : confidence > 50 ? 'info' : 'warning',
        title: 'Revenu Potentiel (ML)',
        value: revenueKPI.value,
        icon: Brain,
        message: message
      });
    }
    
    return { alertes, performance, financier };
  }, [analyticsData, additionalKPIs]);
  
  // Ouvrir la catégorie "Alertes" par défaut si elle contient des insights (une seule fois)
  useEffect(() => {
    if (categorizedInsights.alertes.length > 0 && !userHasInteracted.alertes) {
      setExpandedCategories(prev => {
        // Ne l'ouvrir que si elle n'est pas déjà ouverte
        if (!prev.alertes) {
          return { ...prev, alertes: true };
        }
        return prev;
      });
    }
  }, [categorizedInsights.alertes.length, userHasInteracted.alertes]);
  
  // Fonction pour toggle une catégorie
  const toggleCategory = (category) => {
    // Marquer que l'utilisateur a interagi avec cette catégorie
    setUserHasInteracted(prev => ({
      ...prev,
      [category]: true
    }));
    
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Composant Accordéon pour une catégorie
  const CategoryAccordion = ({ title, icon: Icon, iconColor, insights, isOpen, onToggle, count }) => {
    const handleToggle = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
        <button
          onClick={handleToggle}
          type="button"
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#FAFAF7] transition-colors cursor-pointer"
          aria-expanded={isOpen}
          aria-controls={`accordion-content-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-[#191919]">{title}</h4>
              <p className="text-xs text-[#666663]">{count} insight{count > 1 ? 's' : ''}</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-[#666663]" />
          </motion.div>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id={`accordion-content-${title.toLowerCase().replace(/\s+/g, '-')}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-2 border-t border-[#E5E4DF]">
                {insights.map((insight) => (
                  <InsightAlert
                    key={insight.key}
                    type={insight.type}
                    title={insight.title}
                    value={insight.value}
                    icon={insight.icon}
                    message={insight.message}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Mapping des icônes
  const iconMap = {
    Clock,
    Package,
    Zap,
    TrendingUp,
    DollarSign,
    Boxes
  };

  // Configuration des KPIs avec leurs métadonnées
  const kpiTitles = {
    skuAvailability: 'Taux de Disponibilité des SKU',
    inventoryValuation: 'Valeur de l\'Inventaire',
    salesLost: 'Ventes Perdues - Rupture de Stock',
    overstockCost: 'Valeur Surstocks Profonds',
    ...Object.fromEntries(
      Object.entries(additionalKPIs).map(([key, kpi]) => [key, kpi.title])
    )
  };

  // Fonction pour ouvrir le modal de graphique
  const openChartModal = (kpiKey) => {
    setSelectedKPI(kpiKey);
    setChartModalOpen(true);
  };

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* En-tête avec contrôles - Version compacte */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4 relative z-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#191919]">Indicateurs Clés de l'Inventaire</h2>
            <p className="text-sm text-[#666663] mt-1">
              KPIs ayant un impact direct sur vos résultats financiers
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative z-50">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
          </div>
          
          <div className="flex-1 relative z-50">
            <ComparisonSelector
              value={comparisonType}
              onChange={setComparisonType}
              disabled={dateRange === 'custom'}
            />
          </div>
        </div>
      </div>

      {/* État de chargement */}
      {analyticsData.loading ? (
        <div className="flex items-center justify-center h-40 bg-white rounded-xl shadow-sm border border-[#E5E4DF]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#666663]" />
          <span className="ml-2 text-[#666663]">Chargement des analytics...</span>
        </div>
      ) : analyticsData.error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Erreur: {analyticsData.error}</p>
        </div>
      ) : (
        <>
          {/* Indicateurs Clés de l'Inventaire - KPIs principaux */}
          <div>
            <h3 className="text-lg font-bold text-[#191919] mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-purple-500 rounded-full" />
              KPIs Principaux
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <KPICard
                title="Taux de Disponibilité des SKU"
                value={analyticsData.skuAvailability.value}
                change={analyticsData.skuAvailability.change}
                changePercent={analyticsData.skuAvailability.changePercent}
                trend={analyticsData.skuAvailability.trend}
                description={analyticsData.skuAvailability.description}
                chartData={analyticsData.skuAvailability.chartData}
                comparisonPeriod={analyticsData.skuAvailability.comparisonPeriod}
                onClick={() => openChartModal('skuAvailability')}
              />
              
              <KPICard
                title="Valeur de l'Inventaire"
                value={analyticsData.inventoryValuation.value}
                change={analyticsData.inventoryValuation.change}
                changePercent={analyticsData.inventoryValuation.changePercent}
                trend={analyticsData.inventoryValuation.trend}
                description={analyticsData.inventoryValuation.description}
                chartData={analyticsData.inventoryValuation.chartData}
                comparisonPeriod={analyticsData.inventoryValuation.comparisonPeriod}
                onClick={() => openChartModal('inventoryValuation')}
              />
              
              <KPICard
                title="Ventes Perdues - Rupture de Stock"
                value={analyticsData.salesLost.value}
                change={analyticsData.salesLost.change}
                changePercent={analyticsData.salesLost.changePercent}
                trend={analyticsData.salesLost.trend}
                description={analyticsData.salesLost.description}
                chartData={analyticsData.salesLost.chartData}
                comparisonPeriod={analyticsData.salesLost.comparisonPeriod}
                onClick={() => openChartModal('salesLost')}
              />
              
              <KPICard
                title="Valeur Surstocks Profonds"
                value={analyticsData.overstockCost.value}
                change={analyticsData.overstockCost.change}
                changePercent={analyticsData.overstockCost.changePercent}
                trend={analyticsData.overstockCost.trend}
                description={analyticsData.overstockCost.description}
                chartData={analyticsData.overstockCost.chartData}
                comparisonPeriod={analyticsData.overstockCost.comparisonPeriod}
                onClick={() => openChartModal('overstockCost')}
              />
            </div>
          </div>

          {/* KPIs Supplémentaires - Analyse approfondie */}
          <div>
            <h3 className="text-lg font-bold text-[#191919] mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-indigo-500 rounded-full" />
              Analyse Approfondie
              {mlRevenueLoading && (
                <div className="flex items-center gap-2 ml-2 text-sm text-[#666663]">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calcul ML en cours...</span>
                </div>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {Object.entries(additionalKPIs).map(([key, kpi]) => {
                // Pour "Rotation Rapide", afficher le nombre de produits + le taux moyen (rotations/an)
                let displayValue = kpi.value;
                if (key === 'fastRotatingProducts' && kpi.averageRotationRate !== undefined) {
                  displayValue = `${kpi.value} (${kpi.averageRotationRate} rot/an moy)`;
                }
                
                return (
                  <KPICard
                    key={key}
                    title={kpi.title}
                    value={displayValue}
                    change={kpi.change}
                    changePercent={kpi.changePercent}
                    trend={kpi.trend}
                    description={kpi.description}
                    chartData={kpi.chartData}
                    comparisonPeriod={kpi.comparisonPeriod || 'période précédente'}
                    icon={iconMap[kpi.icon]}
                  />
                );
              })}
            </div>
          </div>

          {/* Section Insights Actionnables */}
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#191919]">
                  Insights Actionnables
                </h3>
              </div>
              <p className="text-sm text-[#666663] ml-[52px]">
                Recommandations basées sur vos indicateurs clés de performance
              </p>
            </div>
            
            {/* Organiser les insights en catégories avec accordéons */}
            <div className="space-y-4">
              {categorizedInsights.alertes.length > 0 && (
                <CategoryAccordion
                  title="Alertes"
                  icon={AlertCircle}
                  iconColor="bg-red-500"
                  insights={categorizedInsights.alertes}
                  isOpen={expandedCategories.alertes}
                  onToggle={() => toggleCategory('alertes')}
                  count={categorizedInsights.alertes.length}
                />
              )}
              
              {categorizedInsights.performance.length > 0 && (
                <CategoryAccordion
                  title="Performance"
                  icon={TrendingUpIcon}
                  iconColor="bg-blue-500"
                  insights={categorizedInsights.performance}
                  isOpen={expandedCategories.performance}
                  onToggle={() => toggleCategory('performance')}
                  count={categorizedInsights.performance.length}
                />
              )}
              
              {categorizedInsights.financier.length > 0 && (
                <CategoryAccordion
                  title="Financier"
                  icon={DollarSign}
                  iconColor="bg-green-500"
                  insights={categorizedInsights.financier}
                  isOpen={expandedCategories.financier}
                  onToggle={() => toggleCategory('financier')}
                  count={categorizedInsights.financier.length}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal de graphique détaillé */}
      {chartModalOpen && selectedKPI && (
        <ChartModal
          isOpen={chartModalOpen}
          onClose={() => setChartModalOpen(false)}
          title={kpiTitles[selectedKPI]}
          kpiData={analyticsData[selectedKPI]}
        />
      )}

    </motion.div>
  );
};