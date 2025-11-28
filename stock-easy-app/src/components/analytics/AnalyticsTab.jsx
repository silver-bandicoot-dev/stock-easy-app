import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, Package, Zap, TrendingUp, DollarSign, Boxes, Lightbulb, ShoppingCart, AlertTriangle, CheckCircle, Heart, TrendingDown, Activity, ChevronDown, AlertCircle, TrendingUp as TrendingUpIcon, Info, Brain, Link } from 'lucide-react';
import { KPICard } from '../features/KPICard/KPICard';
import { DateRangePicker } from './DateRangePicker';
import { ComparisonSelector } from './ComparisonSelector';
import { ChartModal } from '../features/ChartModal/ChartModal';
import { InsightAlert } from '../features/InsightAlert';
import { useAnalytics } from '../../hooks/useAnalytics';
import { calculateAnalyticsKPIs } from '../../utils/analyticsKPIs';
import { useCurrency } from '../../contexts/CurrencyContext';
import { roundToTwoDecimals } from '../../utils/decimalUtils';
import { calculateTotalPotentialRevenueML } from '../../services/ml/revenueForecastService';
import { DemandForecastModel } from '../../services/ml/demandForecastModel';
import { ANALYTICS_TABS } from '../../constants/stockEasyConstants';
import AIMainDashboard from '../ml/AIMainDashboard';
import { getSalesHistory } from '../../utils/salesHistoryGenerator';

export const AnalyticsTab = ({
  products,
  orders,
  suppliers,
  warehouses,
  seuilSurstockProfond = 90,
  analyticsSubTab = ANALYTICS_TABS.KPIS,
  setAnalyticsSubTab
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

  // État pour le produit sélectionné pour les prévisions
  const [selectedProductForForecast, setSelectedProductForForecast] = useState(null);
  const [salesHistoryForForecast, setSalesHistoryForForecast] = useState([]);
  const [loadingSalesHistory, setLoadingSalesHistory] = useState(false);
  
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
      const startTime = performance.now();
      
      try {
        console.log('🤖 Calcul du Revenu Potentiel avec ML...');
        console.log(`📦 ${products.length} produits à analyser`);
        
        const result = await calculateTotalPotentialRevenueML(products, mlModel, {
          forecastDays: 90,
          useSeasonality: true,
          useRotationRate: true,
          useMLPredictions: mlModel !== null
        });
        
        const duration = performance.now() - startTime;
        
        setMlRevenueData(result);
        console.log('✅ Revenu Potentiel ML calculé:', result.totalRevenue);
        console.log(`⚡ Temps de calcul: ${duration.toFixed(0)}ms (${(duration / products.length).toFixed(0)}ms/produit)`);
        
        // Afficher un message de performance
        if (duration < 3000) {
          console.log('✅ Performance EXCELLENTE');
        } else if (duration < 5000) {
          console.log('🟡 Performance ACCEPTABLE');
        } else {
          console.log('🔴 Performance LENTE - Vérifier les optimisations');
        }
      } catch (error) {
        const duration = performance.now() - startTime;
        console.error('❌ Erreur calcul revenu potentiel ML:', error);
        console.error(`⏱️  Temps avant erreur: ${duration.toFixed(0)}ms`);
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

  // Utiliser les KPIs supplémentaires réels depuis l'historique (plus de simulation !)
  const additionalKPIs = useMemo(() => {
    // Calculer les KPIs actuels pour obtenir les descriptions et icônes
    const currentKPIs = calculateAnalyticsKPIs(products, orders, formatCurrency, mlRevenueData);
    
    // Utiliser les données réelles depuis analyticsData.additionalKPIs
    const realAdditionalKPIs = analyticsData.additionalKPIs || {};
    
    // Convertir les chartData au format attendu (tableau de nombres normalisés 0-100)
    const normalizeChartData = (chartDataArray, rawValue) => {
      if (!chartDataArray || chartDataArray.length === 0) {
        return [];
      }
      
      // Si chartData est déjà au format [{date, value}], extraire les valeurs
      const values = chartDataArray.map(d => typeof d === 'object' ? d.value : d);
      
      if (values.length === 0) return [];
      
      // Trouver le min et max pour normalisation
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1; // Éviter division par zéro
      
      // Normaliser entre 0 et 100
      return values.map(v => Math.max(0, Math.min(100, ((v - min) / range) * 100)));
    };
    
    // Mapper les KPIs réels avec les métadonnées (titre, description, icône)
    const kpisWithMetadata = {};
    
    // Mapping Produits ↔ Fournisseurs
    if (realAdditionalKPIs.mappingPercentage) {
      kpisWithMetadata.mappingPercentage = {
        ...currentKPIs.mappingPercentage,
        value: realAdditionalKPIs.mappingPercentage.value,
        rawValue: realAdditionalKPIs.mappingPercentage.rawValue,
        change: realAdditionalKPIs.mappingPercentage.change,
        changePercent: realAdditionalKPIs.mappingPercentage.changePercent,
        trend: realAdditionalKPIs.mappingPercentage.trend,
        chartData: normalizeChartData(realAdditionalKPIs.mappingPercentage.chartData, realAdditionalKPIs.mappingPercentage.rawValue),
        comparisonPeriod: realAdditionalKPIs.mappingPercentage.comparisonPeriod
      };
    }
    
    // Total Produits
    if (realAdditionalKPIs.totalProducts) {
      kpisWithMetadata.totalProducts = {
        ...currentKPIs.totalProducts,
        value: realAdditionalKPIs.totalProducts.value,
        rawValue: realAdditionalKPIs.totalProducts.rawValue,
        change: realAdditionalKPIs.totalProducts.change,
        changePercent: realAdditionalKPIs.totalProducts.changePercent,
        trend: realAdditionalKPIs.totalProducts.trend,
        chartData: normalizeChartData(realAdditionalKPIs.totalProducts.chartData, realAdditionalKPIs.totalProducts.rawValue),
        comparisonPeriod: realAdditionalKPIs.totalProducts.comparisonPeriod
      };
    }
    
    // En Bonne Santé
    if (realAdditionalKPIs.healthyPercentage) {
      kpisWithMetadata.healthyPercentage = {
        ...currentKPIs.healthyPercentage,
        value: realAdditionalKPIs.healthyPercentage.value,
        rawValue: realAdditionalKPIs.healthyPercentage.rawValue,
        change: realAdditionalKPIs.healthyPercentage.change,
        changePercent: realAdditionalKPIs.healthyPercentage.changePercent,
        trend: realAdditionalKPIs.healthyPercentage.trend,
        chartData: normalizeChartData(realAdditionalKPIs.healthyPercentage.chartData, realAdditionalKPIs.healthyPercentage.rawValue),
        comparisonPeriod: realAdditionalKPIs.healthyPercentage.comparisonPeriod
      };
    }
    
    // Marge Brute Totale
    if (realAdditionalKPIs.totalGrossMargin) {
      kpisWithMetadata.totalGrossMargin = {
        ...currentKPIs.totalGrossMargin,
        value: realAdditionalKPIs.totalGrossMargin.value,
        rawValue: realAdditionalKPIs.totalGrossMargin.rawValue,
        change: realAdditionalKPIs.totalGrossMargin.change,
        changePercent: realAdditionalKPIs.totalGrossMargin.changePercent,
        trend: realAdditionalKPIs.totalGrossMargin.trend,
        chartData: normalizeChartData(realAdditionalKPIs.totalGrossMargin.chartData, realAdditionalKPIs.totalGrossMargin.rawValue),
        comparisonPeriod: realAdditionalKPIs.totalGrossMargin.comparisonPeriod
      };
    }
    
    // Revenu Potentiel (ML)
    // PRIORITÉ : Utiliser mlRevenueData si disponible (calcul ML réel)
    // Sinon, utiliser realAdditionalKPIs (calcul simple depuis useAnalytics)
    if (mlRevenueData && mlRevenueData.totalRevenue !== undefined) {
      // Utiliser le calcul ML direct (plus précis)
      const mlRevenue = mlRevenueData.totalRevenue;
      kpisWithMetadata.totalPotentialRevenue = {
        ...currentKPIs.totalPotentialRevenue,
        value: formatCurrency ? formatCurrency(roundToTwoDecimals(mlRevenue)) : mlRevenue,
        rawValue: mlRevenue, // Utiliser la valeur ML calculée
        change: realAdditionalKPIs.totalPotentialRevenue?.change || 0,
        changePercent: realAdditionalKPIs.totalPotentialRevenue?.changePercent || 0,
        trend: realAdditionalKPIs.totalPotentialRevenue?.trend || 'up',
        chartData: normalizeChartData(realAdditionalKPIs.totalPotentialRevenue?.chartData || [], mlRevenue),
        comparisonPeriod: realAdditionalKPIs.totalPotentialRevenue?.comparisonPeriod || 'période précédente',
        mlData: {
          confidence: mlRevenueData.avgConfidence || 0,
          dataQuality: mlRevenueData.dataQuality || {},
          methodCounts: mlRevenueData.methodCounts || {}
        }
      };
    } else if (realAdditionalKPIs.totalPotentialRevenue) {
      // Fallback vers calcul simple si ML non disponible
      kpisWithMetadata.totalPotentialRevenue = {
        ...currentKPIs.totalPotentialRevenue,
        value: realAdditionalKPIs.totalPotentialRevenue.value,
        rawValue: realAdditionalKPIs.totalPotentialRevenue.rawValue,
        change: realAdditionalKPIs.totalPotentialRevenue.change,
        changePercent: realAdditionalKPIs.totalPotentialRevenue.changePercent,
        trend: realAdditionalKPIs.totalPotentialRevenue.trend,
        chartData: normalizeChartData(realAdditionalKPIs.totalPotentialRevenue.chartData, realAdditionalKPIs.totalPotentialRevenue.rawValue),
        comparisonPeriod: realAdditionalKPIs.totalPotentialRevenue.comparisonPeriod,
        mlData: currentKPIs.totalPotentialRevenue.mlData // Conserver les données ML si disponibles
      };
    }
    
    // Rotation Rapide
    if (realAdditionalKPIs.fastRotatingProducts) {
      kpisWithMetadata.fastRotatingProducts = {
        ...currentKPIs.fastRotatingProducts,
        value: realAdditionalKPIs.fastRotatingProducts.value,
        rawValue: realAdditionalKPIs.fastRotatingProducts.rawValue,
        change: realAdditionalKPIs.fastRotatingProducts.change,
        changePercent: realAdditionalKPIs.fastRotatingProducts.changePercent,
        trend: realAdditionalKPIs.fastRotatingProducts.trend,
        chartData: normalizeChartData(realAdditionalKPIs.fastRotatingProducts.chartData, realAdditionalKPIs.fastRotatingProducts.rawValue),
        comparisonPeriod: realAdditionalKPIs.fastRotatingProducts.comparisonPeriod,
        averageRotationRate: currentKPIs.fastRotatingProducts.averageRotationRate // Conserver le taux moyen
      };
    }
    
    return kpisWithMetadata;
  }, [products, orders, formatCurrency, analyticsData, mlRevenueData]);
  
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
      <div className="bg-white rounded-lg border border-[#E1E3E5] overflow-hidden">
        <button
          onClick={handleToggle}
          type="button"
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#F6F6F7] transition-colors cursor-pointer"
          aria-expanded={isOpen}
          aria-controls={`accordion-content-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-[#191919]">{title}</h4>
              <p className="text-xs text-[#6B7177]">{count} insight{count > 1 ? 's' : ''}</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-[#6B7177]" />
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
              <div className="p-3 space-y-2 border-t border-[#E1E3E5]">
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
    Boxes,
    Link
  };

  // Configuration des KPIs avec leurs métadonnées
  const kpiTitles = {
    skuAvailability: 'Taux de Disponibilité des SKU',
    inventoryValuation: 'Valeur de l\'Inventaire',
    salesLost: 'Ventes Perdues - Ruptures Réelles',
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
      {/* Header - Style Dashboard épuré */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#191919]">
            {analyticsSubTab === ANALYTICS_TABS.FORECAST ? 'Prévisions IA 🤖' : 'Analytics 📈'}
          </h1>
          <p className="text-sm text-[#6B7177] mt-0.5">
            {analyticsSubTab === ANALYTICS_TABS.FORECAST 
              ? 'Prévisions de demande basées sur le Machine Learning'
              : 'KPIs et indicateurs clés de votre inventaire'
            }
          </p>
        </div>
      </div>

      {/* Onglets - Style pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: ANALYTICS_TABS.KPIS, label: 'KPIs', icon: TrendingUp },
          { id: ANALYTICS_TABS.FORECAST, label: 'Prévisions IA', icon: Brain }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setAnalyticsSubTab ? setAnalyticsSubTab(tab.id) : null}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                analyticsSubTab === tab.id
                  ? 'bg-[#191919] text-white shadow-sm'
                  : 'bg-white text-[#6B7177] border border-[#E1E3E5] hover:border-[#8A8C8E] hover:text-[#191919]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contrôles de période - Uniquement sur l'onglet KPIs */}
      {analyticsSubTab === ANALYTICS_TABS.KPIS && (
        <div className="flex flex-col lg:flex-row gap-4 p-3 bg-[#F6F6F7] rounded-lg relative z-50">
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
      )}

      {/* Contenu des sous-onglets */}
      {analyticsSubTab === ANALYTICS_TABS.FORECAST ? (
        <div className="space-y-6">
          {/* Sélecteur de produit - Style compact */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-[#F6F6F7] rounded-lg">
            <div className="flex-1 relative">
              <select
                value={selectedProductForForecast?.sku || ''}
                onChange={async (e) => {
                  const product = products.find(p => p.sku === e.target.value);
                  setSelectedProductForForecast(product || null);
                  
                  // Charger l'historique depuis Supabase quand un produit est sélectionné
                  if (product) {
                    setLoadingSalesHistory(true);
                    try {
                      const history = await getSalesHistory(product, orders, 90);
                      setSalesHistoryForForecast(history);
                    } catch (error) {
                      console.error('❌ Erreur chargement historique:', error);
                      setSalesHistoryForForecast([]);
                    } finally {
                      setLoadingSalesHistory(false);
                    }
                  } else {
                    setSalesHistoryForForecast([]);
                  }
                }}
                className="w-full px-4 py-2.5 bg-white border border-[#E1E3E5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919] focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="">Sélectionner un produit pour analyser...</option>
                {products
                  .filter(p => p.salesPerDay > 0)
                  .map(product => (
                    <option key={product.sku} value={product.sku}>
                      {product.name} ({product.sku}) - {product.salesPerDay.toFixed(1)} ventes/jour
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7177] pointer-events-none" />
            </div>
            {selectedProductForForecast && (
              <span className="text-sm text-[#6B7177] whitespace-nowrap">
                {products.filter(p => p.salesPerDay > 0).length} produits avec historique
              </span>
            )}
          </div>

          {/* Dashboard de prévisions */}
          {selectedProductForForecast ? (
            loadingSalesHistory ? (
              <div className="bg-white rounded-lg border border-[#E1E3E5] p-12 text-center">
                <RefreshCw className="w-12 h-12 mx-auto text-[#6B7177] mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-[#191919] mb-2">
                  Chargement de l'historique...
                </h3>
                <p className="text-sm text-[#6B7177]">
                  Récupération des données de ventes depuis Supabase
                </p>
              </div>
            ) : (
              <AIMainDashboard
                product={selectedProductForForecast}
                salesHistory={salesHistoryForForecast}
                currentStock={selectedProductForForecast.stock || 0}
                reorderPoint={selectedProductForForecast.reorderPoint || 0}
              />
            )
          ) : (
            <div className="bg-white rounded-lg border border-[#E1E3E5] p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#F6F6F7] rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-[#6B7177]" />
              </div>
              <h3 className="text-lg font-medium text-[#191919] mb-2">
                Sélectionnez un produit
              </h3>
              <p className="text-sm text-[#6B7177] max-w-md mx-auto">
                Choisissez un produit avec historique de ventes pour voir ses prévisions de demande basées sur le Machine Learning
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* État de chargement */}
          {analyticsData.loading ? (
            <div className="flex items-center justify-center h-40 bg-white rounded-lg border border-[#E1E3E5]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#6B7177]" />
              <span className="ml-2 text-[#6B7177]">Chargement des analytics...</span>
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
                title="Ventes Perdues - Ruptures Réelles"
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