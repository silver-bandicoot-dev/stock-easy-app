import React, { useState, useMemo, useEffect } from 'react';
import { Package, Bell, Mail, X, Check, Truck, Clock, AlertCircle, CheckCircle, Eye, Settings, Info, Edit2, Activity, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Upload, FileText, Calendar, RefreshCw } from 'lucide-react';

// ============================================
// CONFIGURATION API GOOGLE SHEETS
// ============================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzeloLj-PTcTcx5kgxDyCh6iGXXB0cHzug_vsiMCpEDqxlZou7WjjmqqIiPB9PEXzOF/exec';

// ============================================
// FONCTIONS API
// ============================================
const api = {
  async getAllData() {
    try {
      const response = await fetch(`${API_URL}?action=getAllData`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      throw error;
    }
  },

  async updateProduct(sku, updates) {
    try {
      const response = await fetch(`${API_URL}?action=updateProduct`, {
        method: 'POST',
        body: JSON.stringify({ sku, ...updates })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }
  },

  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_URL}?action=createOrder`, {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw error;
    }
  },

  async updateOrderStatus(orderId, updates) {
    try {
      const response = await fetch(`${API_URL}?action=updateOrderStatus`, {
        method: 'POST',
        body: JSON.stringify({ orderId, ...updates })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      throw error;
    }
  },

  async updateStock(items) {
    try {
      const response = await fetch(`${API_URL}?action=updateStock`, {
        method: 'POST',
        body: JSON.stringify({ items })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      throw error;
    }
  },

  async getParameter(parameterName) {
    try {
      const response = await fetch(`${API_URL}?action=getParameter&name=${encodeURIComponent(parameterName)}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.value;
    } catch (error) {
      console.error(`Erreur lors de la lecture du paramètre "${parameterName}":`, error);
      // Valeurs par défaut en cas d'erreur
      const defaults = {
        "SeuilSurstockProfond": 90,
        "DeviseDefaut": "EUR",
        "MultiplicateurDefaut": 1.2
      };
      return defaults[parameterName] || null;
    }
  }
};

// ============================================
// COMPOSANT BUTTON UNIFIÉ
// ============================================
const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  icon: Icon,
  loading = false,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-black text-white hover:bg-[#333333] focus:ring-black shadow-lg',
    secondary: 'bg-[#40403E] text-[#FAFAF7] hover:bg-[#666663] focus:ring-[#40403E]',
    ghost: 'bg-transparent text-black hover:bg-black/10 focus:ring-black',
    danger: 'bg-[#EF1C43] text-white hover:bg-red-700 focus:ring-[#EF1C43] shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600 shadow-sm',
    outline: 'bg-transparent border-2 border-[#E5E4DF] text-[#191919] hover:bg-[#FAFAF7] focus:ring-black',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? <RefreshCw className="w-4 h-4 shrink-0 animate-spin" /> : Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Formate la date de confirmation pour l'affichage
 * @param {string} isoDate - Date ISO (ex: "2025-10-14T22:00:00.000Z")
 * @returns {string} - Ex: "14 octobre 2025"
 */
const formatConfirmedDate = (isoDate) => {
  if (!isoDate) return null;
  
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

// ============================================
// COMPOSANT TOOLTIP INFO
// ============================================
const InfoTooltip = ({ content }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="ml-1 text-[#666663] hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-black rounded"
        aria-label="Plus d'informations"
      >
        <Info className="w-4 h-4 shrink-0" />
      </button>
      {show && (
        <div className="absolute left-0 top-6 w-72 bg-black text-white text-xs rounded-lg p-3 shadow-2xl border-2 border-black z-[100]">
          <div className="absolute -top-2 left-4 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-black"></div>
          {content}
        </div>
      )}
    </div>
  );
};

const tooltips = {
  toOrder: "Produits dont le stock actuel est en-dessous du point de commande. Il faut passer commande maintenant pour éviter une rupture de stock.",
  watch: "Produits dont le stock approche du point de commande (dans les 20% au-dessus). À surveiller de près pour anticiper la prochaine commande.",
  inTransit: "Commandes déjà passées auprès des fournisseurs et en cours d'acheminement. Le délai estimé est calculé selon les délais habituels du fournisseur.",
  received: "Commandes arrivées à l'entrepôt et en attente de validation. Vérifiez les quantités reçues avant de valider pour mettre à jour le stock.",
  multiplier: "Coefficient pour ajuster les prévisions selon la saisonnalité ou les événements (BFCM, soldes). 1 = normal, 0.5 = hors saison, 5 = pic majeur.",
  securityStock: "Nombre de jours de ventes supplémentaires à garder en stock pour absorber les imprévus (retards fournisseur, pics de ventes). Calculé automatiquement à 20% du délai fournisseur.",
  reorderPoint: "Niveau de stock critique qui déclenche une alerte de commande. Calculé pour couvrir les ventes pendant le délai de réapprovisionnement + stock de sécurité.",
  stockHealth: "Indicateur visuel de la santé du stock. Vert = bon niveau, Orange = surveillance nécessaire, Rouge = urgent à commander.",
  skuAvailability: "Pourcentage de produits disponibles en stock par rapport au total des SKU actifs.",
  salesLost: "Montant estimé des ventes manquées en raison d'une indisponibilité produit.",
  deepOverstock: "Valeur financière des produits dont le stock dépasse largement la demande prévue."
};

// ============================================
// COMPOSANT HEALTH BAR
// ============================================
const HealthBar = ({ percentage, status }) => {
  const colors = {
    healthy: 'bg-green-600',
    warning: 'bg-orange-500',
    urgent: 'bg-red-600'
  };
  
  return (
    <div className="w-full bg-[#E5E4DF] rounded-full h-3 overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-300 ${colors[status]}`}
        style={{ width: `${Math.max(5, Math.min(percentage, 100))}%` }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
  );
};

// ============================================
// COMPOSANT KPI CARD
// ============================================
const KPICard = ({ title, value, change, changePercent, trend, description, chartData }) => {
  const isPositive = trend === 'up';
  const isGood = (title.includes('Disponibilité') && isPositive) || 
                 (title.includes('Perdues') && !isPositive) ||
                 (title.includes('Surstocks') && !isPositive);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-[#666663]">{title}</h3>
            <InfoTooltip content={description} />
          </div>
          <div className="text-3xl font-bold text-[#191919] mb-1">{value}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-flex items-center gap-1 ${isGood ? 'text-green-600' : 'text-[#EF1C43]'}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4 shrink-0" /> : <ArrowDownRight className="w-4 h-4 shrink-0" />}
              {Math.abs(changePercent)}%
            </span>
            <span className="text-[#666663]">vs période précédente</span>
          </div>
        </div>
      </div>
      
      <div className="h-20 mt-4">
        <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            points={chartData.map((val, i) => `${(i / (chartData.length - 1)) * 300},${80 - (val / 100) * 80}`).join(' ')}
          />
        </svg>
      </div>
    </div>
  );
};

// ============================================
// COMPOSANT MODAL OVERLAY UNIFIÉ
// ============================================
const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#191919] px-6 py-4 flex items-center justify-between rounded-t-xl shrink-0">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-white hover:text-[#BFBFBA] transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded p-1"
            aria-label="Fermer"
          >
            <X className="w-6 h-6 shrink-0" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 bg-[#FAFAF7] border-t border-[#E5E4DF] rounded-b-xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================
const calculateMetrics = (product) => {
  // Calcul de l'autonomie en jours
  const daysOfStock = product.salesPerDay > 0 ? Math.floor(product.stock / product.salesPerDay) : 999;
  
  // Stock de sécurité: utiliser la valeur custom si définie, sinon 20% du délai fournisseur
  const securityStock = product.customSecurityStock !== undefined && product.customSecurityStock !== null 
    ? product.customSecurityStock 
    : Math.round(product.delay * 0.2);
  
  let healthStatus = 'healthy';
  let healthPercentage = 100;
  
  // NOUVELLE LOGIQUE basée sur l'autonomie vs stock de sécurité
  if (daysOfStock < securityStock) {
    // URGENT: autonomie inférieure au stock de sécurité
    healthStatus = 'urgent';
    healthPercentage = Math.max(5, Math.min(25, (daysOfStock / securityStock) * 25));
  } else if (daysOfStock < securityStock * 1.2) {
    // WARNING: autonomie entre stock sécu et stock sécu x 1.2
    healthStatus = 'warning';
    const ratio = (daysOfStock - securityStock) / (securityStock * 0.2);
    healthPercentage = 25 + (ratio * 25);
  } else {
    // HEALTHY: autonomie > stock sécu x 1.2
    healthStatus = 'healthy';
    healthPercentage = Math.min(100, 50 + ((daysOfStock - securityStock * 1.2) / (securityStock * 2)) * 50);
  }
  
  // Détection surstock profond (> 180 jours)
  const isDeepOverstock = daysOfStock > 180;
  
  return {
    ...product,
    daysOfStock,
    securityStock,
    healthStatus,
    healthPercentage: Math.round(healthPercentage),
    isDeepOverstock
  };
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
const StockEasy = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [orders, setOrders] = useState([]);
  const [parameters, setParameters] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [receivingModalOpen, setReceivingModalOpen] = useState(false);
  const [receivingProducts, setReceivingProducts] = useState([]);
  const [tempReceivedQty, setTempReceivedQty] = useState({});
  const [editingParam, setEditingParam] = useState(null);
  const [tempParamValue, setTempParamValue] = useState('');
  const [reconciliationModalOpen, setReconciliationModalOpen] = useState(false);
  const [reconciliationOrder, setReconciliationOrder] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [discrepancyItems, setDiscrepancyItems] = useState({});
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [damageItems, setDamageItems] = useState({});
  const [damageNotes, setDamageNotes] = useState('');
  const [reclamationEmailModalOpen, setReclamationEmailModalOpen] = useState(false);
  const [reclamationEmailContent, setReclamationEmailContent] = useState('');
  const [currentReclamationOrder, setCurrentReclamationOrder] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      syncData();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAllData();
      
      const suppliersMap = {};
      data.suppliers.forEach(s => {
        suppliersMap[s.name] = s;
      });
      
      setSuppliers(suppliersMap);
      setProducts(data.products);
      setOrders(data.orders);
      
      // Charger les paramètres si disponibles
      if (data.parameters) {
        setParameters(data.parameters);
      } else {
        // Charger les paramètres individuellement si pas fournis par getAllData
        try {
          const seuilSurstock = await api.getParameter('SeuilSurstockProfond');
          setParameters(prev => ({ ...prev, SeuilSurstockProfond: seuilSurstock }));
        } catch (err) {
          console.warn('Paramètres non disponibles, utilisation des valeurs par défaut');
        }
      }
      
      console.log('✅ Données chargées depuis Google Sheets');
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      alert('Erreur lors du chargement des données. Vérifiez la console.');
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    try {
      setSyncing(true);
      await loadData();
      console.log('🔄 Synchronisation effectuée');
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    } finally {
      setSyncing(false);
    }
  };

  const enrichedProducts = useMemo(() => products.map(calculateMetrics), [products]);

  const productsByStatus = useMemo(() => {
    return {
      to_order: enrichedProducts.filter(p => p.qtyToOrder > 0),
      watch: enrichedProducts.filter(p => p.qtyToOrder === 0 && p.stock < p.reorderPoint * 1.2),
      in_transit: enrichedProducts.filter(p => {
        return orders.some(o => 
          o.status === 'in_transit' && 
          o.items.some(item => item.sku === p.sku)
        );
      }),
      received: enrichedProducts.filter(p => {
        return orders.some(o => 
          o.status === 'received' && 
          o.items.some(item => item.sku === p.sku)
        );
      })
    };
  }, [enrichedProducts, orders]);

  const toOrderBySupplier = useMemo(() => {
    const grouped = {};
    productsByStatus.to_order.forEach(p => {
      if (!grouped[p.supplier]) {
        grouped[p.supplier] = [];
      }
      grouped[p.supplier].push(p);
    });
    return grouped;
  }, [productsByStatus]);

  const notifications = useMemo(() => {
    const notifs = [];
    
    if (productsByStatus.to_order.length > 0) {
      notifs.push({
        type: 'warning',
        message: `${productsByStatus.to_order.length} produit(s) à commander`,
        count: productsByStatus.to_order.length
      });
    }
    
    productsByStatus.in_transit.forEach(p => {
      const order = orders.find(o => o.items.some(item => item.sku === p.sku) && o.status === 'in_transit');
      if (order && order.shippedAt) {
        const daysSinceShip = Math.floor((new Date() - new Date(order.shippedAt)) / (1000 * 60 * 60 * 24));
        const daysRemaining = p.delay - daysSinceShip;
        if (daysRemaining <= 3) {
          notifs.push({
            type: 'info',
            message: `${p.name} arrive dans ~${daysRemaining} jour(s)`,
            product: p.name
          });
        }
      }
    });
    
    if (orders.filter(o => o.status === 'received').length > 0) {
      notifs.push({
        type: 'success',
        message: `${orders.filter(o => o.status === 'received').length} commande(s) à valider`,
        count: orders.filter(o => o.status === 'received').length
      });
    }
    
    return notifs;
  }, [productsByStatus, orders]);

  // CALCUL DES VRAIS KPIs ANALYTICS
  const analyticsData = useMemo(() => {
    // KPI 1: Taux de disponibilité des SKU
    const activeSKUs = enrichedProducts.length;
    const availableSKUs = enrichedProducts.filter(p => p.stock > 0).length;
    const availabilityRate = activeSKUs > 0 ? Math.round((availableSKUs / activeSKUs) * 100) : 0;
    
    // KPI 2: Ventes perdues - Rupture de stock
    const salesLost = enrichedProducts
      .filter(p => p.stock === 0)
      .reduce((total, p) => {
        // Estimation: supposons 7 jours de rupture en moyenne
        const daysOutOfStock = 7;
        const lostRevenue = daysOutOfStock * p.salesPerDay * (p.buyPrice * 1.5); // marge estimée 50%
        return total + lostRevenue;
      }, 0);
    
    // KPI 3: Valeur surstocks profonds - UTILISATION DES PARAMÈTRES
    // Lire le seuil depuis les paramètres ou utiliser 90 jours par défaut
    const seuilSurstock = parseInt(parameters.SeuilSurstockProfond) || 90;
    
    // Surstock profond = > 2x le seuil
    const seuilSurstockProfond = seuilSurstock * 2;
    
    const deepOverstockValue = enrichedProducts
      .filter(p => p.daysOfStock > seuilSurstockProfond)
      .reduce((total, p) => {
        return total + (p.stock * p.buyPrice);
      }, 0);
    
    return {
      skuAvailability: { 
        value: `${availabilityRate}%`, 
        actualValue: availabilityRate,
        change: 19, 
        changePercent: 39,
        trend: 'up',
        description: tooltips.skuAvailability,
        chartData: [30, 35, 40, 45, 52, 60, 65, 70, 75, availabilityRate]
      },
      salesLost: { 
        value: `€${Math.round(salesLost).toLocaleString('fr-FR')}`, 
        actualValue: salesLost,
        change: -39, 
        changePercent: 39,
        trend: 'down',
        description: tooltips.salesLost,
        chartData: [80, 75, 85, 90, 70, 60, 75, 65, 55, Math.min(100, salesLost / 100)]
      },
      deepOverstock: { 
        value: `€${Math.round(deepOverstockValue).toLocaleString('fr-FR')}`, 
        actualValue: deepOverstockValue,
        change: 92, 
        changePercent: 92,
        trend: 'up',
        description: tooltips.deepOverstock,
        chartData: [20, 25, 30, 35, 40, 50, 60, 70, 80, Math.min(100, deepOverstockValue / 100)]
      }
    };
  }, [enrichedProducts, parameters]);

  const updateProductParam = async (sku, field, value) => {
    try {
      await api.updateProduct(sku, { [field]: value });
      await loadData();
      console.log('✅ Produit mis à jour');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du produit');
    }
  };

  const startEditParam = (sku, field, currentValue) => {
    setEditingParam({ sku, field });
    setTempParamValue(currentValue !== null ? currentValue.toString() : '');
  };

  const saveParam = async () => {
    if (editingParam) {
      const value = tempParamValue === '' ? null : parseFloat(tempParamValue);
      await updateProductParam(editingParam.sku, editingParam.field, value);
      setEditingParam(null);
      setTempParamValue('');
    }
  };

  const cancelEditParam = () => {
    setEditingParam(null);
    setTempParamValue('');
  };

  const openEmailModal = (supplier) => {
    setSelectedSupplier(supplier);
    setEmailModalOpen(true);
  };

  const generateEmailDraft = (supplier, products) => {
    const supplierInfo = suppliers[supplier];
    const productList = products.map(p => 
      `- ${p.name} (SKU: ${p.sku}) - Quantité: ${p.qtyToOrder} unités - Prix unitaire: ${p.buyPrice}€`
    ).join('\n');
    
    const total = products.reduce((sum, p) => sum + (p.qtyToOrder * p.buyPrice), 0);
    
    return {
      to: supplierInfo.email || 'email@fournisseur.com',
      subject: `Commande Stock Easy - ${new Date().toLocaleDateString('fr-FR')}`,
      body: `Bonjour,

Nous souhaitons passer la commande suivante :

${productList}

TOTAL: ${total.toFixed(2)}€

Merci de nous confirmer la disponibilité et la date de livraison estimée.

Conditions habituelles: ${supplierInfo.delay} jours - MOQ respecté

Cordialement,
L'équipe Stock Easy`
    };
  };

  const generatePONumber = () => {
    // Trouve le numéro PO le plus élevé actuel
    const poNumbers = orders
      .map(o => {
        const match = o.id.match(/^PO-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);
    
    const nextNumber = poNumbers.length > 0 ? Math.max(...poNumbers) + 1 : 1;
    return `PO-${String(nextNumber).padStart(3, '0')}`;
  };

  const sendOrder = async () => {
    try {
      const productsToOrder = toOrderBySupplier[selectedSupplier];
      const total = productsToOrder.reduce((sum, p) => sum + (p.qtyToOrder * p.buyPrice), 0);
      
      const orderData = {
        id: generatePONumber(),
        supplier: selectedSupplier,
        status: 'pending_confirmation',
        total: total,
        createdAt: new Date().toISOString().split('T')[0],
        items: productsToOrder.map(p => ({
          sku: p.sku,
          quantity: p.qtyToOrder,
          pricePerUnit: p.buyPrice
        })),
        notes: ''
      };
      
      await api.createOrder(orderData);
      await loadData();
      
      setEmailModalOpen(false);
      setSelectedSupplier(null);
      
      alert('✅ Commande créée et sauvegardée dans Google Sheets !');
    } catch (error) {
      console.error('❌ Erreur lors de la création de la commande:', error);
      alert('Erreur lors de la création de la commande');
    }
  };

  const confirmOrder = async (orderId) => {
    try {
      // CORRECTION 3: Sauvegarder la date ISO complète avec l'heure
      const confirmedAt = new Date().toISOString();
      
      await api.updateOrderStatus(orderId, {
        status: 'processing',
        confirmedAt: confirmedAt
      });
      await loadData();
      console.log(`✅ Commande ${orderId} confirmée le ${confirmedAt}`);
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la confirmation');
    }
  };

  const shipOrder = async (orderId) => {
    const tracking = prompt('Entrez le numéro de suivi (optionnel - laissez vide pour passer):');
    // Tracking optionnel - on peut continuer même sans numéro
    try {
      await api.updateOrderStatus(orderId, {
        status: 'in_transit',
        shippedAt: new Date().toISOString().split('T')[0],
        trackingNumber: tracking || ''
      });
      await loadData();
      console.log('✅ Commande expédiée');
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const receiveOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    setReconciliationOrder(order);
    setReconciliationModalOpen(true);
  };

  const confirmReconciliation = async (hasDiscrepancy) => {
    try {
      if (hasDiscrepancy) {
        // Ouvrir le modal de gestion des écarts
        setReconciliationModalOpen(false);
        const initialDiscrepancy = {};
        reconciliationOrder.items.forEach(item => {
          initialDiscrepancy[item.sku] = {
            ordered: item.quantity,
            received: item.quantity // par défaut, à ajuster par l'utilisateur
          };
        });
        setDiscrepancyItems(initialDiscrepancy);
        setDiscrepancyModalOpen(true);
      } else {
        // CORRECTION 1: Réception conforme - mise à jour automatique du stock
        console.log('=== DEBUG CORRECTION 1 - Réception conforme ===');
        
        // Convertir les quantités en nombres pour éviter #NUM!
        const stockUpdates = reconciliationOrder.items.map(item => {
          const quantity = parseInt(item.quantity, 10) || 0;
          console.log(`Stock ${item.sku}: +${quantity} unités (type: ${typeof quantity})`);
          return {
            sku: item.sku,
            quantity: quantity
          };
        });
        
        console.log('Stock updates:', stockUpdates);
        
        // Mettre à jour le stock AVANT de marquer comme completed
        await api.updateStock(stockUpdates);
        
        // Puis marquer la commande comme complétée
        await api.updateOrderStatus(reconciliationOrder.id, {
          status: 'completed',
          receivedAt: new Date().toISOString().split('T')[0],
          completedAt: new Date().toISOString().split('T')[0]
        });
        
        await loadData();
        setReconciliationModalOpen(false);
        setReconciliationOrder(null);
        
        alert('✅ Réception validée ! Stock mis à jour automatiquement.');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la validation');
    }
  };

  const submitDiscrepancy = async () => {
    try {
      // Créer l'email de réclamation
      const discrepancyList = Object.entries(discrepancyItems)
        .filter(([sku, data]) => data.ordered !== data.received)
        .map(([sku, data]) => {
          const product = products.find(p => p.sku === sku);
          return `- ${product?.name || sku} (SKU: ${sku})\n  Commandé: ${data.ordered} | Reçu: ${data.received} | Écart: ${data.received - data.ordered}`;
        })
        .join('\n\n');
      
      const claimEmail = `Objet: Réclamation - Commande ${reconciliationOrder.id}\n\nBonjour,\n\nNous avons constaté des écarts entre les quantités commandées et reçues :\n\n${discrepancyList}\n\nMerci de nous confirmer ces écarts et de procéder à l'envoi des quantités manquantes.\n\nCordialement`;
      
      console.log('EMAIL DE RÉCLAMATION GÉNÉRÉ:', claimEmail);
      alert('📧 Email de réclamation généré !\n\n' + claimEmail);
      
      // CORRECTION 4A: Mettre à jour la commande avec les quantités reçues
      const updatedItems = reconciliationOrder.items.map(item => {
        const receivedQty = discrepancyItems[item.sku]?.received;
        return {
          sku: item.sku,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          receivedQuantity: receivedQty !== undefined ? parseInt(receivedQty, 10) : parseInt(item.quantity, 10)
        };
      });
      
      console.log('=== DEBUG CORRECTION 4A ===');
      console.log('Items mis à jour avec receivedQuantity:', updatedItems);
      
      await api.updateOrderStatus(reconciliationOrder.id, {
        status: 'reconciliation',
        receivedAt: new Date().toISOString().split('T')[0],
        hasDiscrepancy: true,
        items: updatedItems
      });
      
      // CORRECTION 1: Mettre à jour le stock avec les quantités réellement reçues (conversion en nombre)
      const stockUpdates = Object.entries(discrepancyItems).map(([sku, data]) => {
        const quantityReceived = parseInt(data.received, 10) || 0;
        console.log(`Stock update pour ${sku}: +${quantityReceived} unités`);
        return {
          sku,
          quantity: quantityReceived
        };
      });
      
      console.log('=== DEBUG CORRECTION 1 ===');
      console.log('Stock updates:', stockUpdates);
      
      await api.updateStock(stockUpdates);
      
      await loadData();
      setDiscrepancyModalOpen(false);
      setDiscrepancyItems({});
      setReconciliationOrder(null);
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la soumission');
    }
  };

  const openDamageModal = () => {
    setReconciliationModalOpen(false);
    const initialDamage = {};
    reconciliationOrder.items.forEach(item => {
      initialDamage[item.sku] = {
        total: item.quantity,
        damaged: 0
      };
    });
    setDamageItems(initialDamage);
    setDamageNotes('');
    setDamageModalOpen(true);
  };

  const submitDamageReport = async () => {
    try {
      const damagedList = Object.entries(damageItems)
        .filter(([sku, data]) => data.damaged > 0)
        .map(([sku, data]) => {
          const product = products.find(p => p.sku === sku);
          return `- ${product?.name || sku} (SKU: ${sku})\n  Quantité endommagée: ${data.damaged} / ${data.total}`;
        })
        .join('\n\n');
      
      const damageEmail = `Objet: Réclamation - Marchandises endommagées - Commande ${reconciliationOrder.id}\n\nBonjour,\n\nNous avons reçu la commande ${reconciliationOrder.id} mais certains produits sont arrivés endommagés :\n\n${damagedList}\n\nNotes: ${damageNotes || 'Aucune note supplémentaire'}\n\nMerci de procéder au remplacement de ces articles.\n\nCordialement`;
      
      console.log('EMAIL RÉCLAMATION DOMMAGES:', damageEmail);
      alert('📧 Email de réclamation pour dommages généré !\n\n' + damageEmail);
      
      // CORRECTION 1: Mettre à jour le stock avec uniquement les produits non endommagés (conversion en nombre)
      const stockUpdates = Object.entries(damageItems).map(([sku, data]) => {
        const quantityGood = parseInt(data.total, 10) - parseInt(data.damaged, 10);
        console.log(`Stock update pour ${sku}: +${quantityGood} unités (total: ${data.total}, endommagé: ${data.damaged})`);
        return {
          sku,
          quantity: quantityGood
        };
      });
      
      await api.updateStock(stockUpdates);
      await api.updateOrderStatus(reconciliationOrder.id, {
        status: 'reconciliation',
        receivedAt: new Date().toISOString().split('T')[0],
        hasDiscrepancy: true,
        damageReport: true
      });
      
      await loadData();
      setDamageModalOpen(false);
      setDamageItems({});
      setDamageNotes('');
      setReconciliationOrder(null);
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la soumission');
    }
  };

  // CORRECTION 4B: Fonction pour générer l'email de réclamation
  const generateReclamationEmail = (order) => {
    const dateReception = new Date(order.receivedAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    
    const itemsWithGap = order.items.filter(item => 
      item.quantity > (item.receivedQuantity || 0)
    );
    
    let tableauProduits = '';
    itemsWithGap.forEach(item => {
      const ecart = item.quantity - (item.receivedQuantity || 0);
      const product = products.find(p => p.sku === item.sku);
      const skuPadded = (product?.name || item.sku).padEnd(30);
      const orderedPadded = String(item.quantity).padEnd(10);
      const receivedPadded = String(item.receivedQuantity || 0).padEnd(8);
      tableauProduits += `${skuPadded} | ${orderedPadded} | ${receivedPadded} | ${ecart}\n`;
    });
    
    return `Objet : Réclamation commande ${order.id} - Quantités manquantes

Bonjour,

Nous avons réceptionné la commande ${order.id} en date du ${dateReception}, mais nous constatons les écarts suivants :

Produit                        | Commandé   | Reçu     | Manquant
-------------------------------|------------|----------|----------
${tableauProduits}
Nous vous remercions de bien vouloir :
- Soit nous réexpédier les quantités manquantes dans les plus brefs délais
- Soit établir un avoir correspondant

Cordialement,
[Votre nom]`;
  };

  // CORRECTION 4B: Fonction pour ouvrir le modal de réclamation
  const openReclamationModal = (order) => {
    const emailContent = generateReclamationEmail(order);
    setReclamationEmailContent(emailContent);
    setCurrentReclamationOrder(order);
    setReclamationEmailModalOpen(true);
  };

  // CORRECTION 4B: Fonction pour copier l'email dans le presse-papier
  const copyReclamationToClipboard = () => {
    navigator.clipboard.writeText(reclamationEmailContent);
    alert('📋 Email copié dans le presse-papier !');
  };

  // CORRECTION 4C: Fonction pour valider sans réclamation
  const validateWithoutReclamation = async (order) => {
    const confirm = window.confirm(
      `Êtes-vous sûr de vouloir valider cette commande sans envoyer de réclamation ?\n\n` +
      `Les quantités reçues seront enregistrées comme définitives et le stock sera ajusté en conséquence.`
    );
    
    if (!confirm) return;
    
    try {
      console.log('=== VALIDATION SANS RÉCLAMATION ===');
      
      // CORRECTION 1 & 4C: Ajuster le stock avec les quantités RÉELLEMENT reçues
      const stockUpdates = order.items.map(item => {
        const quantityReceived = parseInt(item.receivedQuantity, 10) || 0;
        console.log(`Stock ${item.sku}: +${quantityReceived} unités reçues`);
        return {
          sku: item.sku,
          quantity: quantityReceived
        };
      });
      
      console.log('Stock updates:', stockUpdates);
      
      // Mettre à jour le stock
      await api.updateStock(stockUpdates);
      
      // Marquer la commande comme completed
      await api.updateOrderStatus(order.id, {
        status: 'completed',
        completedAt: new Date().toISOString().split('T')[0]
      });
      
      await loadData();
      
      alert(`✅ Commande ${order.id} validée avec les quantités reçues.`);
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la validation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F0EB] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-black animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-[#191919]">Chargement depuis Google Sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0EB]">
      {/* Header - Sticky */}
      <div className="bg-[#191919] shadow-lg sticky top-0 z-[9997] relative isolate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg shrink-0">
                <Package className="w-6 h-6 text-white shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Stock Easy</h1>
                {syncing && (
                  <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2 ml-8">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${
                    activeTab === 'dashboard' 
                      ? 'bg-black text-white shadow-lg' 
                      : 'bg-[#40403E] text-[#FAFAF7] hover:bg-[#666663]'
                  }`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('actions')}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${
                    activeTab === 'actions' 
                      ? 'bg-black text-white shadow-lg' 
                      : 'bg-[#40403E] text-[#FAFAF7] hover:bg-[#666663]'
                  }`}
                >
                  Actions
                </button>
                <button 
                  onClick={() => setActiveTab('track')}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${
                    activeTab === 'track' 
                      ? 'bg-black text-white shadow-lg' 
                      : 'bg-[#40403E] text-[#FAFAF7] hover:bg-[#666663]'
                  }`}
                >
                  <Truck className="w-4 h-4 shrink-0" />
                  Track & Manage
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${
                    activeTab === 'analytics' 
                      ? 'bg-black text-white shadow-lg' 
                      : 'bg-[#40403E] text-[#FAFAF7] hover:bg-[#666663]'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  Analytics
                </button>
                <button 
                  onClick={() => setActiveTab('stock-level')}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${
                    activeTab === 'stock-level' 
                      ? 'bg-black text-white shadow-lg' 
                      : 'bg-[#40403E] text-[#FAFAF7] hover:bg-[#666663]'
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  Stock Level
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${
                    activeTab === 'history' 
                      ? 'bg-black text-white shadow-lg' 
                      : 'bg-[#40403E] text-[#FAFAF7] hover:bg-[#666663]'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  Historique
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${
                    activeTab === 'settings' 
                      ? 'bg-black text-white shadow-lg' 
                      : 'bg-[#40403E] text-[#FAFAF7] hover:bg-[#666663]'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  Paramètres
                </button>
              </div>
              <button 
                onClick={syncData}
                className="p-2.5 rounded-lg bg-white hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black shrink-0"
                aria-label="Synchroniser"
                disabled={syncing}
              >
                <RefreshCw className={`w-5 h-5 text-black shrink-0 ${syncing ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 rounded-lg bg-white hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black shrink-0"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-black shrink-0" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF1C43] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {notificationsOpen && (
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setNotificationsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed right-4 top-20 w-96 bg-white rounded-xl shadow-2xl border border-[#E5E4DF] z-[9999] animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-[#E5E4DF]">
              <h3 className="font-bold text-[#191919]">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#666663]">
                  Aucune notification
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={idx} className={`p-4 border-b border-[#E5E4DF] hover:bg-[#FAFAF7] transition-colors ${
                    notif.type === 'warning' ? 'bg-red-50' : 
                    notif.type === 'info' ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <p className="text-sm text-[#191919]">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Produits à commander */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-200 shrink-0">
                  <AlertCircle className="w-6 h-6 text-[#EF1C43] shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h2 className="text-lg font-bold text-[#191919]">Produits à commander</h2>
                    <InfoTooltip content={tooltips.toOrder} />
                  </div>
                  <p className="text-sm text-[#666663]">{productsByStatus.to_order.length} produit(s)</p>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {productsByStatus.to_order.length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Rien à commander</p>
                ) : (
                  productsByStatus.to_order.map(p => (
                    <div key={p.sku} className="flex justify-between items-center p-3 bg-[#FAFAF7] rounded-lg hover:bg-[#F0F0EB] transition-colors border border-[#E5E4DF]">
                      <div className="min-w-0">
                        <p className="font-medium text-[#191919] text-sm truncate">{p.name}</p>
                        <p className="text-xs text-[#666663] truncate">{p.supplier}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-bold text-[#EF1C43] text-sm">{p.qtyToOrder} unités</p>
                        <p className="text-xs text-[#666663]">Stock: {p.stock}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Produits à surveiller */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-200 shrink-0">
                  <Eye className="w-6 h-6 text-yellow-600 shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h2 className="text-lg font-bold text-[#191919]">Produits à surveiller</h2>
                    <InfoTooltip content={tooltips.watch} />
                  </div>
                  <p className="text-sm text-[#666663]">{productsByStatus.watch.length} produit(s)</p>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {productsByStatus.watch.length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Rien à surveiller</p>
                ) : (
                  productsByStatus.watch.map(p => (
                    <div key={p.sku} className="flex justify-between items-center p-3 bg-[#FAFAF7] rounded-lg hover:bg-[#F0F0EB] transition-colors border border-[#E5E4DF]">
                      <div className="min-w-0">
                        <p className="font-medium text-[#191919] text-sm truncate">{p.name}</p>
                        <p className="text-xs text-[#666663] truncate">{p.supplier}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-bold text-yellow-600 text-sm">Stock: {p.stock}</p>
                        <p className="text-xs text-[#666663]">Point: {p.reorderPoint}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* En cours de livraison */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200 shrink-0">
                  <Truck className="w-6 h-6 text-[#64A4F2] shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h2 className="text-lg font-bold text-[#191919]">En cours de livraison</h2>
                    <InfoTooltip content={tooltips.inTransit} />
                  </div>
                  <p className="text-sm text-[#666663]">{orders.filter(o => o.status === 'in_transit').length} commande(s)</p>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orders.filter(o => o.status === 'in_transit').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande en transit</p>
                ) : (
                  orders.filter(o => o.status === 'in_transit').map(order => {
                    const daysSinceShip = order.shippedAt ? Math.floor((new Date() - new Date(order.shippedAt)) / (1000 * 60 * 60 * 24)) : 0;
                    const supplierDelay = suppliers[order.supplier]?.delay || 30;
                    const daysRemaining = Math.max(0, supplierDelay - daysSinceShip);
                    
                    return (
                      <div key={order.id} className="p-3 bg-[#FAFAF7] rounded-lg hover:bg-[#F0F0EB] transition-colors border border-[#E5E4DF]">
                        <div className="flex justify-between items-start mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-[#191919] text-sm truncate">{order.id}</p>
                            <p className="text-xs text-[#666663] truncate">{order.supplier}</p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="font-bold text-[#64A4F2] text-sm">{order.items.length} produit(s)</p>
                            <p className="text-xs text-[#666663]">~{daysRemaining}j</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Commandes reçues */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center border border-green-200 shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h2 className="text-lg font-bold text-[#191919]">Commandes reçues</h2>
                    <InfoTooltip content={tooltips.received} />
                  </div>
                  <p className="text-sm text-[#666663]">{orders.filter(o => o.status === 'received').length} à valider</p>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orders.filter(o => o.status === 'received').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune réception en attente</p>
                ) : (
                  orders.filter(o => o.status === 'received').map(order => (
                    <div key={order.id} className="flex justify-between items-center p-3 bg-[#FAFAF7] rounded-lg hover:bg-[#F0F0EB] transition-colors border border-[#E5E4DF]">
                      <div className="min-w-0">
                        <p className="font-medium text-[#191919] text-sm truncate">{order.id}</p>
                        <p className="text-xs text-[#666663] truncate">{order.supplier}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-bold text-green-600 text-sm">{order.items.length} produit(s)</p>
                        <p className="text-xs text-green-600">À valider</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ONGLET ACTIONS */}
        {activeTab === 'actions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-200 shrink-0">
                  <AlertCircle className="w-6 h-6 text-[#EF1C43] shrink-0" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#191919]">Produits à commander</h2>
                  <p className="text-sm text-[#666663]">{productsByStatus.to_order.length} produit(s)</p>
                </div>
              </div>
              {Object.keys(toOrderBySupplier).length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 shrink-0" />
                  <p className="text-[#666663] text-lg">Aucune commande nécessaire</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(toOrderBySupplier).map(([supplier, prods]) => (
                    <div key={supplier} className="border border-[#E5E4DF] rounded-lg overflow-hidden">
                      <div className="bg-[#FAFAF7] px-4 py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-bold text-[#191919]">{supplier}</h3>
                          <p className="text-sm text-[#666663]">{prods.length} produit(s)</p>
                        </div>
                        <Button
                          variant="primary"
                          icon={Mail}
                          onClick={() => openEmailModal(supplier)}
                          className="shrink-0"
                        >
                          Commander
                        </Button>
                      </div>
                      <div className="p-4">
                        <table className="w-full text-sm">
                          <thead className="text-xs text-[#666663] border-b border-[#E5E4DF]">
                            <tr>
                              <th className="text-left py-2">Produit</th>
                              <th className="text-right py-2">Qté</th>
                              <th className="text-right py-2">Montant</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prods.map(p => (
                              <tr key={p.sku} className="border-b border-[#E5E4DF] last:border-0">
                                <td className="py-2 text-[#191919]">{p.name}</td>
                                <td className="text-right text-[#191919]">{p.qtyToOrder}</td>
                                <td className="text-right font-bold text-[#191919]">{(p.qtyToOrder * p.buyPrice).toFixed(0)}€</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRACK & MANAGE TAB */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            {/* Commandes en attente de confirmation */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
                <h2 className="text-lg font-bold text-[#191919]">Commandes Créées - En Attente de Confirmation</h2>
                <span className="ml-auto bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-sm font-bold border border-yellow-200 shrink-0">
                  {orders.filter(o => o.status === 'pending_confirmation').length}
                </span>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'pending_confirmation').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande en attente</p>
                ) : (
                  orders.filter(o => o.status === 'pending_confirmation').map(order => (
                    <div key={order.id} className="bg-[#FAFAF7] rounded-lg p-4 flex items-center justify-between border border-[#E5E4DF] gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-[#191919]">{order.id}</span>
                          <span className="text-[#666663]">→</span>
                          <span className="text-[#666663] truncate">{order.supplier}</span>
                        </div>
                        <div className="text-sm text-[#666663]">
                          Créée le {order.createdAt} • Total: {order.total}€
                        </div>
                      </div>
                      <Button
                        variant="success"
                        size="sm"
                        icon={Check}
                        onClick={() => confirmOrder(order.id)}
                        className="shrink-0"
                      >
                        Confirmer réception email
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Commandes en traitement */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#64A4F2] shrink-0" />
                <h2 className="text-lg font-bold text-[#191919]">Commandes en Traitement</h2>
                <span className="ml-auto bg-blue-50 text-[#64A4F2] px-3 py-1 rounded-full text-sm font-bold border border-blue-200 shrink-0">
                  {orders.filter(o => o.status === 'processing').length}
                </span>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'processing').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande en traitement</p>
                ) : (
                  orders.filter(o => o.status === 'processing').map(order => (
                    <div key={order.id} className="bg-[#FAFAF7] rounded-lg p-4 border border-[#E5E4DF]">
                      <div className="flex items-center justify-between mb-3 gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-[#191919]">{order.id}</span>
                            <span className="text-[#666663]">→</span>
                            <span className="text-[#666663] truncate">{order.supplier}</span>
                          </div>
                          <div className="text-sm text-[#666663]">
                            <span className="font-medium text-green-600">
                              Confirmée le {formatConfirmedDate(order.confirmedAt)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Truck}
                          onClick={() => shipOrder(order.id)}
                          className="shrink-0"
                        >
                          Marquer comme expédiée
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Commandes en transit */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-purple-600 shrink-0" />
                <h2 className="text-lg font-bold text-[#191919]">En Cours de Transit</h2>
                <span className="ml-auto bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-sm font-bold border border-purple-200 shrink-0">
                  {orders.filter(o => o.status === 'in_transit').length}
                </span>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'in_transit').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande en transit</p>
                ) : (
                  orders.filter(o => o.status === 'in_transit').map(order => (
                    <div key={order.id} className="bg-[#FAFAF7] rounded-lg p-4 border border-[#E5E4DF]">
                      <div className="flex items-center justify-between mb-3 gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-[#191919]">{order.id}</span>
                            <span className="text-[#666663]">→</span>
                            <span className="text-[#666663] truncate">{order.supplier}</span>
                          </div>
                          <div className="text-sm text-[#666663] mb-2">
                            Expédiée le {order.shippedAt}
                          </div>
                          {order.trackingNumber && (
                            <div className="text-sm">
                              <span className="text-[#666663]">Suivi: </span>
                              <span className="text-purple-600 font-mono text-xs">{order.trackingNumber}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="success"
                          size="sm"
                          icon={CheckCircle}
                          onClick={() => receiveOrder(order.id)}
                          className="shrink-0"
                        >
                          Confirmer réception
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Commandes à réconcilier */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-[#EF1C43] shrink-0" />
                <h2 className="text-lg font-bold text-[#191919]">Commandes à Réconcilier</h2>
                <span className="ml-auto bg-red-50 text-[#EF1C43] px-3 py-1 rounded-full text-sm font-bold border border-red-200 shrink-0">
                  {orders.filter(o => o.status === 'reconciliation').length}
                </span>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'reconciliation').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande à réconcilier</p>
                ) : (
                  orders.filter(o => o.status === 'reconciliation').map(order => (
                    <div key={order.id} className="bg-red-50 rounded-lg p-4 border-l-4 border-[#EF1C43]">
                      <div className="flex items-center justify-between mb-3 gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-bold text-[#191919]">{order.id}</span>
                            <span className="text-[#666663]">→</span>
                            <span className="text-[#666663] truncate">{order.supplier}</span>
                            <span className="px-2 py-1 bg-[#EF1C43]/20 text-[#EF1C43] rounded text-xs font-medium shrink-0">
                              ÉCART DÉTECTÉ
                            </span>
                          </div>
                          <div className="text-sm text-[#666663] mb-2">
                            Reçue le {order.receivedAt}
                          </div>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-sm mt-2">
                              <span className="text-[#666663]">SKU {item.sku}: </span>
                              <span className="text-[#EF1C43]">
                                Commandé {item.quantity} / Reçu {item.receivedQuantity || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Mail}
                            onClick={() => openReclamationModal(order)}
                          >
                            Envoyer réclamation
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            icon={Check}
                            onClick={() => validateWithoutReclamation(order)}
                          >
                            Valider sans réclamation
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <h2 className="text-2xl font-bold text-[#191919] mb-2">Indicateurs Clés de l'Inventaire</h2>
              <p className="text-sm text-[#666663] mb-6">
                Suivez en temps réel les principaux KPIs ayant un impact direct sur vos résultats financiers
              </p>
              
              <div className="flex items-center gap-4 flex-wrap mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]">
                  <Calendar className="w-4 h-4 text-[#666663] shrink-0" />
                  <select 
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="bg-transparent border-none text-[#191919] focus:outline-none font-medium"
                  >
                    <option value="today">Aujourd'hui</option>
                    <option value="7d">7 derniers jours</option>
                    <option value="30d">30 derniers jours</option>
                    <option value="90d">90 derniers jours</option>
                  </select>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KPICard
                title="Taux de Disponibilité des SKU"
                value={analyticsData.skuAvailability.value}
                change={analyticsData.skuAvailability.change}
                changePercent={analyticsData.skuAvailability.changePercent}
                trend={analyticsData.skuAvailability.trend}
                description={analyticsData.skuAvailability.description}
                chartData={analyticsData.skuAvailability.chartData}
              />
              
              <KPICard
                title="Ventes Perdues - Rupture de Stock"
                value={analyticsData.salesLost.value}
                change={analyticsData.salesLost.change}
                changePercent={analyticsData.salesLost.changePercent}
                trend={analyticsData.salesLost.trend}
                description={analyticsData.salesLost.description}
                chartData={analyticsData.salesLost.chartData}
              />
              
              <KPICard
                title="Valeur Surstocks Profonds"
                value={analyticsData.deepOverstock.value}
                change={analyticsData.deepOverstock.change}
                changePercent={analyticsData.deepOverstock.changePercent}
                trend={analyticsData.deepOverstock.trend}
                description={analyticsData.deepOverstock.description}
                chartData={analyticsData.deepOverstock.chartData}
              />
            </div>

            {/* Recommandations */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <h3 className="text-lg font-bold text-[#191919] mb-4">Recommandations Intelligentes</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-green-600">Amélioration du taux de disponibilité</div>
                    <div className="text-sm text-[#666663] mt-1">
                      Commander les 3 produits urgents permettra d'augmenter votre taux de disponibilité de 82% à 91%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-yellow-600">Réduction des ventes perdues</div>
                    <div className="text-sm text-[#666663] mt-1">
                      Prioriser le réapprovisionnement pourrait éviter €8,420 de pertes
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <TrendingUp className="w-5 h-5 text-[#64A4F2] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-[#64A4F2]">Optimisation des surstocks</div>
                    <div className="text-sm text-[#666663] mt-1">
                      Envisager une promotion sur certains produits pour libérer €3,200 de trésorerie
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STOCK LEVEL TAB */}
        {activeTab === 'stock-level' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#191919] mb-2">Santé de l'Inventaire</h2>
                <p className="text-sm text-[#666663]">Visualisez la disponibilité actuelle de chaque SKU regroupée par fournisseur</p>
              </div>
              
              {Object.entries(
                enrichedProducts.reduce((acc, product) => {
                  if (!acc[product.supplier]) {
                    acc[product.supplier] = [];
                  }
                  acc[product.supplier].push(product);
                  return acc;
                }, {})
              ).map(([supplier, products]) => {
                const urgentCount = products.filter(p => p.healthStatus === 'urgent').length;
                const warningCount = products.filter(p => p.healthStatus === 'warning').length;
                const healthyCount = products.filter(p => p.healthStatus === 'healthy').length;
                const totalToOrder = products.reduce((sum, p) => sum + p.qtyToOrder, 0);
                
                return (
                  <div key={supplier} className="mb-8 last:mb-0">
                    <div className="bg-[#FAFAF7] border-2 border-[#E5E4DF] rounded-t-xl px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-[#191919]">{supplier}</h3>
                          <p className="text-sm text-[#666663] mt-1">
                            {products.length} produit(s) • Délai: {products[0].delay} jours
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {urgentCount > 0 && (
                            <div className="text-center px-3">
                              <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
                              <div className="text-xs text-[#666663]">Urgent</div>
                            </div>
                          )}
                          {warningCount > 0 && (
                            <div className="text-center px-3">
                              <div className="text-2xl font-bold text-orange-500">{warningCount}</div>
                              <div className="text-xs text-[#666663]">Attention</div>
                            </div>
                          )}
                          <div className="text-center px-3">
                            <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
                            <div className="text-xs text-[#666663]">Sain</div>
                          </div>
                          {totalToOrder > 0 && (
                            <div className="text-center ml-4 pl-4 border-l-2 border-[#E5E4DF]">
                              <div className="text-2xl font-bold text-[#191919]">{totalToOrder}</div>
                              <div className="text-xs text-[#666663]">À commander</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border-x-2 border-b-2 border-[#E5E4DF] rounded-b-xl">
                      <div className="divide-y divide-[#E5E4DF]">
                        {products.map(product => (
                          <div key={product.sku} className="p-4 hover:bg-[#FAFAF7] transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                  <h3 className="font-bold text-[#191919]">{product.name}</h3>
                                  <span className="text-sm text-[#666663]">{product.sku}</span>
                                  {product.qtyToOrder > 0 && (
                                    <span className="px-2 py-1 bg-black/20 text-black rounded text-xs font-medium inline-flex items-center gap-1 shrink-0">
                                      <Bell className="w-3 h-3 shrink-0" />
                                      Commander {product.qtyToOrder} unités
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-[#666663] flex-wrap">
                                  <span>Stock: <strong className="text-[#191919]">{product.stock}</strong> unités</span>
                                  <span>•</span>
                                  <span>Ventes/jour: <strong className="text-[#191919]">{product.salesPerDay.toFixed(1)}</strong></span>
                                  <span>•</span>
                                  <span>Autonomie: <strong className={
                                    product.daysOfStock < 15 ? 'text-[#EF1C43]' :
                                    product.daysOfStock < 30 ? 'text-yellow-600' :
                                    'text-green-600'
                                  }>{product.daysOfStock} jours</strong></span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <div className="text-2xl font-bold text-[#191919]">{Math.round(product.healthPercentage)}%</div>
                                <div className="text-xs text-[#666663]">Santé</div>
                              </div>
                            </div>
                            
                            <HealthBar percentage={product.healthPercentage} status={product.healthStatus} />
                            
                            <div className="mt-3 flex items-center justify-between text-xs text-[#666663]">
                              <span>Point de commande: <strong className="text-[#191919]">{product.reorderPoint}</strong></span>
                              <span>MOQ: {product.moq} unités</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HISTORIQUE TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold text-[#191919] mb-2">Historique des Commandes</h2>
                  <p className="text-sm text-[#666663]">Consultez toutes vos commandes passées et leur statut</p>
                </div>
                <div className="flex items-center gap-3">
                  <select 
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    className="px-4 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg text-[#191919] font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="completed">Complétées</option>
                    <option value="in_transit">En transit</option>
                    <option value="processing">En traitement</option>
                    <option value="reconciliation">À réconcilier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[#E5E4DF]">
                  <div className="text-2xl font-bold text-[#191919]">{orders.length}</div>
                  <div className="text-sm text-[#666663]">Total commandes</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {orders.filter(o => o.status === 'completed').length}
                  </div>
                  <div className="text-sm text-[#666663]">Complétées</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-[#64A4F2]">
                    {orders.filter(o => o.status === 'in_transit' || o.status === 'processing').length}
                  </div>
                  <div className="text-sm text-[#666663]">En cours</div>
                </div>
                <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[#E5E4DF]">
                  <div className="text-2xl font-bold text-[#191919]">
                    {orders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}€
                  </div>
                  <div className="text-sm text-[#666663]">Montant total</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FAFAF7] border-b border-[#E5E4DF]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666663] uppercase">N° Commande</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666663] uppercase">Fournisseur</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666663] uppercase">Date création</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666663] uppercase">Produits</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[#666663] uppercase">Montant</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666663] uppercase">Statut</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666663] uppercase">Suivi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4DF]">
                    {orders
                      .filter(o => historyFilter === 'all' || o.status === historyFilter)
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map(order => {
                        const statusConfig = {
                          pending_confirmation: { label: 'En attente', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
                          processing: { label: 'En traitement', color: 'bg-blue-50 text-[#64A4F2] border-blue-200' },
                          in_transit: { label: 'En transit', color: 'bg-purple-50 text-purple-600 border-purple-200' },
                          completed: { label: 'Complétée', color: 'bg-green-50 text-green-600 border-green-200' },
                          reconciliation: { label: 'À réconcilier', color: 'bg-red-50 text-[#EF1C43] border-red-200' }
                        };
                        
                        const status = statusConfig[order.status];
                        
                        return (
                          <tr key={order.id} className="hover:bg-[#FAFAF7] transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-[#191919]">{order.id}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[#191919]">{order.supplier}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[#666663] text-sm">{order.createdAt}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <span className="text-[#666663]">{order.items.length} produit(s)</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-bold text-[#191919]">{order.total}€</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {order.trackingNumber ? (
                                <span className="text-xs font-mono text-[#666663]">{order.trackingNumber}</span>
                              ) : (
                                <span className="text-xs text-[#BFBFBA]">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" icon={Upload}>
                Exporter en CSV
              </Button>
            </div>
          </div>
        )}

        {/* ONGLET PARAMETRES */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#191919] mb-2">Paramètres des produits</h2>
                <p className="text-sm text-[#666663]">Ajustez les paramètres de prévision pour chaque produit selon vos besoins.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FAFAF7] border-b border-[#E5E4DF]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase">Produit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase">Fournisseur</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#666663] uppercase">
                        <div className="inline-flex items-center justify-center">
                          Multiplicateur
                          <InfoTooltip content={tooltips.multiplier} />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#666663] uppercase">
                        <div className="inline-flex items-center justify-center">
                          Stock Sécurité (jours)
                          <InfoTooltip content={tooltips.securityStock} />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#666663] uppercase">
                        <div className="inline-flex items-center justify-end">
                          Point de Commande
                          <InfoTooltip content={tooltips.reorderPoint} />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4DF]">
                    {enrichedProducts.map(p => (
                      <tr key={p.sku} className="hover:bg-[#FAFAF7] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-[#191919] text-sm">{p.name}</p>
                            <p className="text-xs text-[#666663]">{p.sku}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#191919]">{p.supplier}</td>
                        <td className="px-4 py-3 text-center">
                          {editingParam?.sku === p.sku && editingParam?.field === 'multiplier' ? (
                            <div className="inline-flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.1"
                                value={tempParamValue}
                                onChange={(e) => setTempParamValue(e.target.value)}
                                className="w-20 px-2 py-1 border-2 border-black rounded text-sm text-center bg-white text-[#191919] font-medium focus:outline-none focus:ring-2 focus:ring-black"
                                autoFocus
                              />
                              <button onClick={saveParam} className="text-green-600 hover:text-green-700 p-1 focus:outline-none focus:ring-2 focus:ring-green-600 rounded">
                                <Check className="w-4 h-4 shrink-0" />
                              </button>
                              <button onClick={cancelEditParam} className="text-[#EF1C43] hover:text-red-700 p-1 focus:outline-none focus:ring-2 focus:ring-[#EF1C43] rounded">
                                <X className="w-4 h-4 shrink-0" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditParam(p.sku, 'multiplier', p.multiplier)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-[#F0F0EB] hover:bg-[#E5E4DF] rounded text-sm font-medium text-[#191919] transition-colors focus:outline-none focus:ring-2 focus:ring-black"
                            >
                              {p.multiplier}×
                              <Edit2 className="w-3 h-3 shrink-0" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {editingParam?.sku === p.sku && editingParam?.field === 'customSecurityStock' ? (
                            <div className="inline-flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="1"
                                value={tempParamValue}
                                onChange={(e) => setTempParamValue(e.target.value)}
                                placeholder="Auto"
                                className="w-20 px-2 py-1 border-2 border-black rounded text-sm text-center bg-white text-[#191919] font-medium focus:outline-none focus:ring-2 focus:ring-black"
                                autoFocus
                              />
                              <button onClick={saveParam} className="text-green-600 hover:text-green-700 p-1 focus:outline-none focus:ring-2 focus:ring-green-600 rounded">
                                <Check className="w-4 h-4 shrink-0" />
                              </button>
                              <button onClick={cancelEditParam} className="text-[#EF1C43] hover:text-red-700 p-1 focus:outline-none focus:ring-2 focus:ring-[#EF1C43] rounded">
                                <X className="w-4 h-4 shrink-0" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditParam(p.sku, 'customSecurityStock', p.customSecurityStock)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-[#F0F0EB] hover:bg-[#E5E4DF] rounded text-sm font-medium text-[#191919] transition-colors focus:outline-none focus:ring-2 focus:ring-black"
                            >
                              {p.securityStock} jours
                              {p.customSecurityStock === undefined || p.customSecurityStock === null ? (
                                <span className="text-xs text-[#666663] ml-1">(auto)</span>
                              ) : (
                                <span className="text-xs text-green-600 ml-1">(custom)</span>
                              )}
                              <Edit2 className="w-3 h-3 shrink-0" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-block px-3 py-1 bg-blue-50 text-[#64A4F2] rounded text-sm font-medium border border-blue-200">
                            {p.reorderPoint} unités
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]">
                <h3 className="font-semibold text-[#191919] mb-2 inline-flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#666663] shrink-0" />
                  Guide d'utilisation
                </h3>
                <ul className="space-y-2 text-sm text-[#191919]">
                  <li><strong>Multiplicateur :</strong> Ajustez selon la saisonnalité (0.3 = hors saison, 1 = normal, 5 = BFCM/pic)</li>
                  <li><strong>Stock Sécurité :</strong> Par défaut calculé à 20% du délai fournisseur. Personnalisez selon vos besoins (laissez vide pour revenir au mode auto)</li>
                  <li><strong>Point de Commande :</strong> Calculé automatiquement, se met à jour en temps réel</li>
                  <li><strong>Modifications :</strong> Toutes les modifications sont sauvegardées automatiquement dans Google Sheets</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal Email */}
      <Modal
        isOpen={emailModalOpen && selectedSupplier}
        onClose={() => setEmailModalOpen(false)}
        title={`Commande - ${selectedSupplier}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEmailModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" icon={Mail} onClick={sendOrder}>
              Envoyer
            </Button>
          </div>
        }
      >
        {selectedSupplier && (() => {
          const email = generateEmailDraft(selectedSupplier, toOrderBySupplier[selectedSupplier]);
          return (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#191919] mb-1">À:</label>
                <input value={email.to} readOnly className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] font-medium" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#191919] mb-1">Objet:</label>
                <input value={email.subject} readOnly className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] font-medium" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#191919] mb-1">Message:</label>
                <textarea value={email.body} readOnly rows={12} className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] font-mono text-sm" />
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Modal Reconciliation */}
      <Modal
        isOpen={reconciliationModalOpen && reconciliationOrder}
        onClose={() => setReconciliationModalOpen(false)}
        title="Confirmer la réception"
        footer={
          <div className="flex justify-between items-center w-full gap-3">
            <Button 
              variant="outline" 
              icon={AlertCircle}
              onClick={openDamageModal}
            >
              Réception endommagée
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="danger" 
                icon={X}
                onClick={() => confirmReconciliation(true)}
              >
                Non, il y a un écart
              </Button>
              <Button 
                variant="success" 
                icon={Check}
                onClick={() => confirmReconciliation(false)}
              >
                Oui, tout est correct
              </Button>
            </div>
          </div>
        }
      >
        {reconciliationOrder && (
          <>
            <div className="mb-4">
              <h4 className="font-bold text-[#191919] mb-2">Commande: {reconciliationOrder.id}</h4>
              <p className="text-sm text-[#666663]">Fournisseur: {reconciliationOrder.supplier}</p>
            </div>
            <div className="space-y-3">
              {reconciliationOrder.items.map((item, idx) => {
                const product = products.find(p => p.sku === item.sku);
                return (
                  <div key={idx} className="border border-[#E5E4DF] rounded-lg p-3 bg-[#FAFAF7]">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-[#191919]">{product?.name || item.sku}</span>
                        <span className="text-xs text-[#666663] ml-2">({item.sku})</span>
                      </div>
                      <span className="text-sm text-[#666663]">Commandé: <strong className="text-[#191919]">{item.quantity}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-[#666663]">
                La quantité reçue correspond-elle à la quantité commandée ?
              </p>
            </div>
          </>
        )}
      </Modal>

      {/* Modal Gestion des Écarts */}
      <Modal
        isOpen={discrepancyModalOpen && reconciliationOrder}
        onClose={() => setDiscrepancyModalOpen(false)}
        title={`Gestion des écarts - ${reconciliationOrder?.id}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setDiscrepancyModalOpen(false);
                setReconciliationModalOpen(true);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              icon={Mail}
              onClick={submitDiscrepancy}
            >
              Générer réclamation
            </Button>
          </div>
        }
      >
        {reconciliationOrder && (
          <>
            <div className="mb-4">
              <p className="text-sm text-[#666663]">
                Saisissez les quantités réellement reçues pour chaque produit :
              </p>
            </div>
            <div className="space-y-3">
              {reconciliationOrder.items.map((item, idx) => {
                const product = products.find(p => p.sku === item.sku);
                return (
                  <div key={idx} className="border border-[#E5E4DF] rounded-lg p-4 bg-[#FAFAF7]">
                    <div className="mb-2">
                      <span className="font-medium text-[#191919]">{product?.name || item.sku}</span>
                      <span className="text-xs text-[#666663] ml-2">({item.sku})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">Commandé</label>
                        <input 
                          type="number" 
                          value={discrepancyItems[item.sku]?.ordered || item.quantity}
                          disabled
                          className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg bg-white text-[#666663] text-center"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">Reçu</label>
                        <input 
                          type="number" 
                          value={discrepancyItems[item.sku]?.received || item.quantity}
                          onChange={(e) => setDiscrepancyItems({
                            ...discrepancyItems,
                            [item.sku]: {
                              ordered: item.quantity,
                              received: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-[#191919] text-center font-medium focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">Écart</label>
                        <div className={`w-full px-3 py-2 rounded-lg text-center font-bold ${
                          (discrepancyItems[item.sku]?.received || item.quantity) - item.quantity < 0 
                            ? 'bg-red-50 text-[#EF1C43]' 
                            : 'bg-green-50 text-green-600'
                        }`}>
                          {(discrepancyItems[item.sku]?.received || item.quantity) - item.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Modal>

      {/* Modal Réception Endommagée */}
      <Modal
        isOpen={damageModalOpen && reconciliationOrder}
        onClose={() => setDamageModalOpen(false)}
        title={`Marchandises endommagées - ${reconciliationOrder?.id}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setDamageModalOpen(false);
                setReconciliationModalOpen(true);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="danger" 
              icon={Mail}
              onClick={submitDamageReport}
            >
              Envoyer réclamation
            </Button>
          </div>
        }
      >
        {reconciliationOrder && (
          <>
            <div className="mb-4">
              <p className="text-sm text-[#666663]">
                Indiquez les quantités endommagées pour chaque produit :
              </p>
            </div>
            <div className="space-y-3">
              {reconciliationOrder.items.map((item, idx) => {
                const product = products.find(p => p.sku === item.sku);
                return (
                  <div key={idx} className="border border-[#E5E4DF] rounded-lg p-4 bg-[#FAFAF7]">
                    <div className="mb-2">
                      <span className="font-medium text-[#191919]">{product?.name || item.sku}</span>
                      <span className="text-xs text-[#666663] ml-2">({item.sku})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">Quantité totale</label>
                        <input 
                          type="number" 
                          value={item.quantity}
                          disabled
                          className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg bg-white text-[#666663] text-center"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">Quantité endommagée</label>
                        <input 
                          type="number" 
                          min="0"
                          max={item.quantity}
                          value={damageItems[item.sku]?.damaged || 0}
                          onChange={(e) => setDamageItems({
                            ...damageItems,
                            [item.sku]: {
                              total: item.quantity,
                              damaged: Math.min(parseInt(e.target.value) || 0, item.quantity)
                            }
                          })}
                          className="w-full px-3 py-2 border-2 border-[#EF1C43] rounded-lg bg-white text-[#191919] text-center font-medium focus:outline-none focus:ring-2 focus:ring-[#EF1C43]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-[#191919] block mb-2">Notes / Commentaires (optionnel)</label>
              <textarea
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                rows={3}
                placeholder="Décrivez l'état des produits endommagés..."
                className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-white text-[#191919] focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
          </>
        )}
      </Modal>

      {/* CORRECTION 4B: Modal Email de Réclamation */}
      <Modal
        isOpen={reclamationEmailModalOpen && currentReclamationOrder}
        onClose={() => setReclamationEmailModalOpen(false)}
        title={`Réclamation - ${currentReclamationOrder?.id || ''}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setReclamationEmailModalOpen(false)}
            >
              Fermer
            </Button>
            <Button 
              variant="primary" 
              icon={Mail}
              onClick={copyReclamationToClipboard}
            >
              📋 Copier dans le presse-papier
            </Button>
          </div>
        }
      >
        {currentReclamationOrder && (
          <>
            <div className="mb-4">
              <p className="text-sm text-[#666663] mb-4">
                Vous pouvez modifier le texte ci-dessous avant de le copier
              </p>
            </div>
            <div className="my-4">
              <textarea
                value={reclamationEmailContent}
                onChange={(e) => setReclamationEmailContent(e.target.value)}
                rows={20}
                className="w-full p-4 border-2 border-[#E5E4DF] rounded-lg font-mono text-sm bg-[#FAFAF7] text-[#191919] focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
          </>
        )}
      </Modal>

    </div>
  );
};

export default StockEasy;
