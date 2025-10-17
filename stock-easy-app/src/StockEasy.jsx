import React, { useState, useMemo, useEffect } from 'react';
import { Package, Bell, Mail, X, Check, Truck, Clock, AlertCircle, CheckCircle, Eye, Settings, Info, Edit2, Activity, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Upload, FileText, Calendar, RefreshCw, Plus, Moon, Sun } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash.debounce';
import api from './services/apiService';
import { InfoTooltip, tooltips } from './components/ui/InfoTooltip';
import { HealthBar } from './components/ui/HealthBar';
import { Modal } from './components/ui/Modal';

// ============================================
// FONCTIONS API - Importées depuis apiService
// ============================================
// L'objet 'api' est maintenant importé depuis './services/apiService'
// Toutes les fonctions API sont centralisées dans ce service pour une meilleure maintenabilité

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
 * @param {string} isoDate - Date ISO (ex: "2025-10-14T22:00:00.000Z") ou date simple (ex: "2025-10-14")
 * @returns {string} - Ex: "14 octobre 2025" ou "-" si pas de date
 */
const formatConfirmedDate = (isoDate) => {
  if (!isoDate) {
    console.warn('formatConfirmedDate: date vide ou null');
    return null;
  }
  
  try {
    const date = new Date(isoDate);
    
    // Vérifier que la date est valide
    if (isNaN(date.getTime())) {
      console.error('formatConfirmedDate: date invalide:', isoDate);
      return 'Date invalide';
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erreur formatage date:', error, 'Date reçue:', isoDate);
    return 'Erreur de date';
  }
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
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Calcul des métriques de santé d'un produit
 * 
 * Le pourcentage de santé (0-100%) est calculé selon l'autonomie (jours de stock) :
 * 
 * 🔴 ZONE URGENT (0-25%) : Autonomie < Stock de sécurité
 *    - Formule: (autonomie / stock_sécu) × 25
 *    - Minimum: 5%, Maximum: 25%
 *    - Exemple: autonomie 10j, stock sécu 20j → 12.5%
 * 
 * 🟡 ZONE WARNING (25-50%) : Stock sécu < Autonomie < Stock sécu × 1.2
 *    - Formule: 25 + ((autonomie - stock_sécu) / (stock_sécu × 0.2)) × 25
 *    - Progression linéaire de 25% à 50%
 *    - Exemple: autonomie 22j, stock sécu 20j → 37.5%
 * 
 * 🟢 ZONE HEALTHY (50-100%) : Autonomie > Stock sécu × 1.2
 *    - Formule: 50 + ((autonomie - stock_sécu × 1.2) / (stock_sécu × 2)) × 50
 *    - Progression linéaire de 50% à 100%
 *    - Maximum: 100% atteint quand autonomie = stock_sécu × 3.2
 *    - Exemple: autonomie 50j, stock sécu 20j → 87.5%
 * 
 * @param {Object} product - Produit avec stock, salesPerDay, delay
 * @param {number} seuil - Seuil de surstock profond (défaut: 90 jours)
 * @returns {Object} Produit enrichi avec métriques calculées
 */
const calculateMetrics = (product, seuil = 90) => {
  // Calcul de l'autonomie en jours
  const daysOfStock = product.salesPerDay > 0 ? Math.floor(product.stock / product.salesPerDay) : 999;
  
  // Stock de sécurité: valeur custom ou 20% du délai fournisseur
  const securityStock = product.customSecurityStock !== undefined && product.customSecurityStock !== null 
    ? product.customSecurityStock 
    : Math.round(product.leadTimeDays * 0.2);
  
  let healthStatus = 'healthy';
  let healthPercentage = 100;
  
  // LOGIQUE DE CALCUL DU % SANTÉ
  if (daysOfStock < securityStock) {
    // 🔴 URGENT: autonomie inférieure au stock de sécurité
    healthStatus = 'urgent';
    healthPercentage = Math.max(5, Math.min(25, (daysOfStock / securityStock) * 25));
  } else if (daysOfStock < securityStock * 1.2) {
    // 🟡 WARNING: autonomie entre stock sécu et stock sécu × 1.2
    healthStatus = 'warning';
    const ratio = (daysOfStock - securityStock) / (securityStock * 0.2);
    healthPercentage = 25 + (ratio * 25);
  } else {
    // 🟢 HEALTHY: autonomie > stock sécu × 1.2
    healthStatus = 'healthy';
    healthPercentage = Math.min(100, 50 + ((daysOfStock - securityStock * 1.2) / (securityStock * 2)) * 50);
  }
  
  // Détection surstock profond (seuil × 2)
  const isDeepOverstock = daysOfStock > (seuil * 2);
  
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
// COMPOSANT SUB-TABS NAVIGATION
// ============================================
const SubTabsNavigation = ({ activeSubTab, onSubTabChange }) => {
  const subTabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
    { id: 'mapping', label: 'Mapping', icon: Activity }
  ];
  
  return (
    <div className="flex gap-2 border-b border-[#E5E4DF] mb-6 overflow-x-auto">
      {subTabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeSubTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onSubTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap
              ${isActive 
                ? 'text-[#8B5CF6] border-b-2 border-[#8B5CF6]' 
                : 'text-[#666663] hover:text-[#191919] hover:bg-[#FAFAF7]'
              }
            `}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// SECTION PARAMÈTRES GÉNÉRAUX
// ============================================
const ParametresGeneraux = ({ 
  seuilSurstock, 
  onUpdateSeuil, 
  devise, 
  onUpdateDevise,
  multiplicateur,
  onUpdateMultiplicateur
}) => {
  const [tempSeuil, setTempSeuil] = useState(seuilSurstock);
  const [tempDevise, setTempDevise] = useState(devise);
  const [tempMultiplicateur, setTempMultiplicateur] = useState(multiplicateur);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setTempSeuil(seuilSurstock);
    setTempDevise(devise);
    setTempMultiplicateur(multiplicateur);
  }, [seuilSurstock, devise, multiplicateur]);

  useEffect(() => {
    const changed = tempSeuil !== seuilSurstock || 
                    tempDevise !== devise || 
                    tempMultiplicateur !== multiplicateur;
    setHasChanges(changed);
    if (changed) setSaveSuccess(false);
  }, [tempSeuil, tempDevise, tempMultiplicateur, seuilSurstock, devise, multiplicateur]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises = [];
      if (tempSeuil !== seuilSurstock) promises.push(onUpdateSeuil(tempSeuil));
      if (tempDevise !== devise) promises.push(onUpdateDevise(tempDevise));
      if (tempMultiplicateur !== multiplicateur) promises.push(onUpdateMultiplicateur(tempMultiplicateur));
      
      await Promise.all(promises);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempSeuil(seuilSurstock);
    setTempDevise(devise);
    setTempMultiplicateur(multiplicateur);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Message de succès */}
      {saveSuccess && (
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-green-800 font-medium">✅ Paramètres sauvegardés avec succès !</span>
        </div>
      )}

      {/* Boutons de sauvegarde */}
      {hasChanges && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            <span className="text-yellow-800 font-medium">Vous avez des modifications non sauvegardées</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              icon={isSaving ? RefreshCw : Check}
              onClick={handleSave}
              disabled={isSaving}
              className={isSaving ? 'opacity-75' : ''}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </Button>
          </div>
        </div>
      )}

      {/* Devise */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-lg font-semibold text-[#191919] mb-4">💰 Devise par défaut</h3>
        <p className="text-sm text-[#666663] mb-4">
          Devise utilisée pour afficher les prix dans l'application
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['EUR', 'USD', 'GBP', 'CAD'].map(curr => (
            <button
              key={curr}
              onClick={() => setTempDevise(curr)}
              className={`
                px-4 py-3 rounded-lg border-2 font-medium transition-all
                ${tempDevise === curr
                  ? 'border-[#8B5CF6] bg-purple-50 text-[#8B5CF6]'
                  : 'border-[#E5E4DF] hover:border-[#BFBFBA] text-[#666663]'
                }
              `}
            >
              {curr}
            </button>
          ))}
        </div>
        
        <div className="mt-3 p-3 bg-[#FAFAF7] rounded-lg">
          <span className="text-sm text-[#666663]">Devise sélectionnée : </span>
          <span className="text-sm font-bold text-[#191919]">{tempDevise}</span>
        </div>
      </div>
      
      {/* Seuil Surstock */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-lg font-semibold text-[#191919] mb-4">📊 Seuil Surstock Profond</h3>
        <p className="text-sm text-[#666663] mb-4">
          Nombre de jours d'autonomie à partir duquel un produit est considéré en surstock profond
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setTempSeuil(60)}
            className={`
              px-4 py-3 rounded-lg border-2 transition-all
              ${tempSeuil === 60
                ? 'border-[#8B5CF6] bg-purple-50'
                : 'border-[#E5E4DF] hover:border-[#BFBFBA]'
              }
            `}
          >
            <div className="font-semibold text-[#191919]">60 jours</div>
            <div className="text-xs text-[#666663]">Fashion</div>
          </button>
          
          <button
            onClick={() => setTempSeuil(90)}
            className={`
              px-4 py-3 rounded-lg border-2 transition-all
              ${tempSeuil === 90
                ? 'border-[#8B5CF6] bg-purple-50'
                : 'border-[#E5E4DF] hover:border-[#BFBFBA]'
              }
            `}
          >
            <div className="font-semibold text-[#191919]">90 jours ⭐</div>
            <div className="text-xs text-[#666663]">Standard</div>
          </button>
          
          <button
            onClick={() => setTempSeuil(120)}
            className={`
              px-4 py-3 rounded-lg border-2 transition-all
              ${tempSeuil === 120
                ? 'border-[#8B5CF6] bg-purple-50'
                : 'border-[#E5E4DF] hover:border-[#BFBFBA]'
              }
            `}
          >
            <div className="font-semibold text-[#191919]">120 jours</div>
            <div className="text-xs text-[#666663]">Durable</div>
          </button>
          
          <button
            onClick={() => setTempSeuil(180)}
            className={`
              px-4 py-3 rounded-lg border-2 transition-all
              ${tempSeuil === 180
                ? 'border-[#8B5CF6] bg-purple-50'
                : 'border-[#E5E4DF] hover:border-[#BFBFBA]'
              }
            `}
          >
            <div className="font-semibold text-[#191919]">180 jours</div>
            <div className="text-xs text-[#666663]">B2B</div>
          </button>
        </div>
        
        <div className="mt-3 p-3 bg-[#FAFAF7] rounded-lg">
          <span className="text-sm text-[#666663]">Valeur sélectionnée : </span>
          <span className="text-sm font-bold text-[#191919]">{tempSeuil} jours</span>
        </div>
      </div>
      
      {/* Multiplicateur */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-lg font-semibold text-[#191919] mb-4">📈 Multiplicateur par défaut</h3>
        <p className="text-sm text-[#666663] mb-4">
          Coefficient appliqué aux nouveaux produits pour ajuster les prévisions
        </p>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTempMultiplicateur(Math.max(0.1, tempMultiplicateur - 0.1))}
            className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-[#E5E4DF] hover:border-[#8B5CF6] hover:bg-purple-50 transition-all"
          >
            <span className="text-xl font-bold text-[#666663]">-</span>
          </button>
          
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold text-[#191919]">{tempMultiplicateur.toFixed(1)}</div>
          </div>
          
          <button
            onClick={() => setTempMultiplicateur(Math.min(5, tempMultiplicateur + 0.1))}
            className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-[#E5E4DF] hover:border-[#8B5CF6] hover:bg-purple-50 transition-all"
          >
            <span className="text-xl font-bold text-[#666663]">+</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION GESTION FOURNISSEURS
// ============================================
const GestionFournisseurs = ({ 
  suppliers, 
  products,
  onOpenModal, 
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const suppliersList = useMemo(() => Object.values(suppliers), [suppliers]);
  
  const filteredSuppliers = useMemo(() => 
    suppliersList.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [suppliersList, searchTerm]
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#191919]">🏭 Gestion des Fournisseurs</h3>
          <p className="text-sm text-[#666663] mt-1">
            {suppliersList.length} fournisseur(s) actif(s)
          </p>
        </div>
        
        <Button 
          onClick={() => onOpenModal(null)}
          icon={Plus}
          variant="primary"
        >
          Nouveau fournisseur
        </Button>
      </div>
      
      {/* Recherche */}
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Rechercher un fournisseur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-10 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6] transition-all"
        />
      </div>
      
      {/* Liste des fournisseurs */}
      <div className="space-y-4">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-12 bg-[#FAFAF7] rounded-xl">
            <p className="text-[#666663]">
              {searchTerm ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur créé'}
            </p>
          </div>
        ) : (
          filteredSuppliers.map(supplier => {
            const productsCount = products.filter(p => p.supplier === supplier.name).length;
            
            return (
              <div 
                key={supplier.name}
                className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-[#191919] mb-2">
                      {supplier.name}
                    </h4>
                    
                    <div className="space-y-1 text-sm text-[#666663]">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span>{supplier.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>Délai: {supplier.leadTimeDays}j</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 shrink-0" />
                          <span>MOQ: {supplier.moq || 'N/A'} unités</span>
                        </div>
                      </div>
                      
                      {supplier.notes && (
                        <div className="flex items-start gap-2 mt-2">
                          <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="italic">{supplier.notes}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span className="font-medium">
                          {productsCount} produit(s) assigné(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onOpenModal(supplier)}
                      className="p-2 text-[#8B5CF6] hover:bg-purple-50 rounded-lg transition-all"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => onDelete(supplier)}
                      className="p-2 text-[#EF1C43] hover:bg-red-50 rounded-lg transition-all"
                      title="Supprimer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Modal Créer/Modifier Fournisseur
const SupplierModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  onChange, 
  onSave, 
  isEditing 
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '✏️ Modifier le fournisseur' : '➕ Nouveau fournisseur'}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={onSave}>
            💾 Enregistrer
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#666663] mb-2">
            Nom du fournisseur *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            disabled={isEditing}
            placeholder="Ex: Fournisseur France"
            className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6] disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          {isEditing && (
            <p className="text-xs text-[#666663] mt-1">
              ℹ️ Le nom ne peut pas être modifié
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#666663] mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="contact@example.com"
            className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#666663] mb-2">
              Délai (jours) *
            </label>
            <input
              type="number"
              value={formData.leadTimeDays}
              onChange={(e) => onChange('leadTimeDays', parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#666663] mb-2">
              MOQ Standard *
            </label>
            <input
              type="number"
              value={formData.moq}
              onChange={(e) => onChange('moq', parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#666663] mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            rows={3}
            placeholder="Notes diverses..."
            className="w-full px-4 py-2 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6] resize-none"
          />
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// SECTION MAPPING SKU/FOURNISSEUR
// ============================================
const MappingSKUFournisseur = ({ 
  products, 
  suppliers, 
  onOpenAssignModal,
  onRemoveSupplier
}) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const suppliersList = useMemo(() => Object.values(suppliers), [suppliers]);
  
  const filteredProducts = useMemo(() => 
    products.filter(p => {
      const matchesSearch = 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (filter === 'without_supplier') return !p.supplier;
      if (filter === 'with_supplier') return !!p.supplier;
      return true;
    }),
    [products, searchTerm, filter]
  );
  
  const stats = {
    total: products.length,
    withSupplier: products.filter(p => p.supplier).length,
    withoutSupplier: products.filter(p => !p.supplier).length
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[#191919]">🔗 Mapping Produits ↔ Fournisseurs</h3>
        <p className="text-sm text-[#666663] mt-1">
          Associez chaque produit à son fournisseur principal
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-[#E5E4DF] p-4">
          <div className="text-sm text-[#666663]">Total produits</div>
          <div className="text-2xl font-bold text-[#191919]">{stats.total}</div>
        </div>
        
        <div className="bg-white rounded-lg border border-[#E5E4DF] p-4">
          <div className="text-sm text-[#666663]">Avec fournisseur</div>
          <div className="text-2xl font-bold text-green-600">{stats.withSupplier}</div>
        </div>
        
        <div className="bg-white rounded-lg border border-[#E5E4DF] p-4">
          <div className="text-sm text-[#666663]">Sans fournisseur</div>
          <div className="text-2xl font-bold text-[#EF1C43]">{stats.withoutSupplier}</div>
        </div>
      </div>
      
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-3 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6] bg-white"
        >
          <option value="all">Tous les produits ({stats.total})</option>
          <option value="with_supplier">Avec fournisseur ({stats.withSupplier})</option>
          <option value="without_supplier">Sans fournisseur ({stats.withoutSupplier})</option>
        </select>
      </div>
      
      {/* Liste des produits */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-[#FAFAF7] rounded-xl">
            <p className="text-[#666663]">Aucun produit trouvé</p>
          </div>
        ) : (
          filteredProducts.map(product => {
            const supplier = suppliers[product.supplier];
            const hasSupplier = !!product.supplier;
            
            return (
              <div 
                key={product.sku}
                className={`
                  bg-white rounded-xl shadow-sm border-2 p-6 transition-all
                  ${hasSupplier ? 'border-[#E5E4DF]' : 'border-orange-200 bg-orange-50'}
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-semibold text-[#191919]">
                        {product.sku}
                      </h4>
                      <span className="text-sm text-[#666663]">•</span>
                      <span className="text-sm text-[#666663]">{product.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-[#666663]">
                      <span>📦 Stock: {product.stock}</span>
                    </div>
                  </div>
                </div>
                
                {hasSupplier ? (
                  <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[#E5E4DF]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-4 h-4 text-[#8B5CF6]" />
                          <span className="font-semibold text-[#191919]">
                            {supplier?.name || product.supplier}
                          </span>
                        </div>
                        
                        {supplier && (
                          <div className="space-y-1 text-sm text-[#666663]">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <span>{supplier.email}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Délai: {supplier.leadTimeDays}j</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Package className="w-3 h-3" />
                                <span>MOQ: {supplier.moq}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => onOpenAssignModal(product)}
                          className="p-2 text-[#8B5CF6] hover:bg-purple-50 rounded-lg transition-all"
                          title="Changer de fournisseur"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => onRemoveSupplier(product.sku)}
                          className="p-2 text-[#EF1C43] hover:bg-red-50 rounded-lg transition-all"
                          title="Retirer le fournisseur"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-orange-100 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Aucun fournisseur assigné</span>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => onOpenAssignModal(product)}
                      icon={Plus}
                    >
                      Assigner
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Modal d'assignation
const AssignSupplierModal = ({ 
  isOpen, 
  onClose, 
  product, 
  suppliers,
  selectedSupplier,
  onSelectSupplier,
  onAssign
}) => {
  const suppliersList = Object.values(suppliers);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔗 Assigner un fournisseur"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={onAssign}
            disabled={!selectedSupplier}
          >
            💾 Assigner
          </Button>
        </div>
      }
    >
      {product && (
        <div className="space-y-4">
          <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[#E5E4DF]">
            <div className="text-sm text-[#666663] mb-1">Produit</div>
            <div className="font-semibold text-[#191919]">
              {product.sku} - {product.name}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#666663] mb-2">
              Sélectionner un fournisseur *
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => onSelectSupplier(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#E5E4DF] rounded-lg focus:outline-none focus:border-[#8B5CF6] bg-white"
            >
              <option value="">-- Choisir un fournisseur --</option>
              {suppliersList.map(s => (
                <option key={s.name} value={s.name}>
                  {s.name} (Délai: {s.leadTimeDays}j, MOQ: {s.moq})
                </option>
              ))}
            </select>
            
            {suppliersList.length === 0 && (
              <p className="text-sm text-[#EF1C43] mt-2">
                ⚠️ Aucun fournisseur disponible. Créez d'abord un fournisseur dans l'onglet "Fournisseurs".
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
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
  const [trackTabSection, setTrackTabSection] = useState('en_cours_commande');
  const [darkMode, setDarkMode] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  
  // Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
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
  const [historyDateStart, setHistoryDateStart] = useState('');
  const [historyDateEnd, setHistoryDateEnd] = useState('');
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [discrepancyItems, setDiscrepancyItems] = useState({});
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [damageItems, setDamageItems] = useState({});
  const [damageNotes, setDamageNotes] = useState('');
  // NOUVEAU: Modal unifié pour réconciliation complète
  const [unifiedReconciliationModalOpen, setUnifiedReconciliationModalOpen] = useState(false);
  const [unifiedReconciliationItems, setUnifiedReconciliationItems] = useState({});
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [reclamationEmailModalOpen, setReclamationEmailModalOpen] = useState(false);
  const [reclamationEmailContent, setReclamationEmailContent] = useState('');
  const [currentReclamationOrder, setCurrentReclamationOrder] = useState(null);

  // NOUVEAUX ÉTATS pour les sous-onglets de Paramètres
  const [parametersSubTab, setParametersSubTab] = useState('general'); // 'general', 'products', 'suppliers', 'mapping'
  
  // NOUVEAUX ÉTATS pour CORRECTION 5 et 6
  const [discrepancyTypes, setDiscrepancyTypes] = useState({});
  const [unsavedParameterChanges, setUnsavedParameterChanges] = useState({});
  const [isSavingParameters, setIsSavingParameters] = useState(false);

  // CORRECTION 1: Gestion des quantités éditables dans la modal de commande
  const [orderQuantities, setOrderQuantities] = useState({});

  // CORRECTION 3: Gestion de l'expansion des détails de commandes
  const [expandedOrders, setExpandedOrders] = useState({});

  // NOUVEAUX ÉTATS pour Paramètres Généraux
  const [seuilSurstockProfond, setSeuilSurstockProfond] = useState(90);
  const [deviseDefaut, setDeviseDefaut] = useState('EUR');
  const [multiplicateurDefaut, setMultiplicateurDefaut] = useState(1.2);

  // NOUVEAUX ÉTATS pour Gestion Fournisseurs
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    email: '',
    leadTimeDays: 30,
    moq: 50,
    notes: ''
  });

  // NOUVEAUX ÉTATS pour Mapping
  const [assignSupplierModalOpen, setAssignSupplierModalOpen] = useState(false);
  const [productToMap, setProductToMap] = useState(null);
  const [selectedSupplierForMapping, setSelectedSupplierForMapping] = useState('');

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
      
      // Debugging temporaire: afficher les dates des commandes
      console.log('Orders chargés:', data.orders.map(o => ({
        id: o.id,
        confirmedAt: o.confirmedAt,
        createdAt: o.createdAt
      })));
      
      // Charger les paramètres si disponibles
      if (data.parameters) {
        setParameters(data.parameters);
        setSeuilSurstockProfond(data.parameters.seuilSurstockProfond || 90);
        setDeviseDefaut(data.parameters.deviseDefaut || 'EUR');
        setMultiplicateurDefaut(data.parameters.multiplicateurDefaut || 1.2);
      } else {
        // Charger les paramètres individuellement si pas fournis par getAllData
        try {
          const seuilSurstock = await api.getParameter('SeuilSurstockProfond');
          setParameters(prev => ({ ...prev, SeuilSurstockProfond: seuilSurstock }));
          setSeuilSurstockProfond(seuilSurstock || 90);
        } catch (err) {
          console.warn('Paramètres non disponibles, utilisation des valeurs par défaut');
        }
      }
      
      console.log('✅ Données chargées depuis Google Sheets');
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Problème de connexion. Vérifiez votre connexion Internet.', {
          action: {
            label: 'Réessayer',
            onClick: () => loadData()
          },
          duration: Infinity
        });
      } else {
        toast.error('Erreur lors du chargement des données. Vérifiez la console.');
      }
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

  // ============================================
  // HANDLERS PARAMÈTRES GÉNÉRAUX
  // ============================================

  const handleUpdateSeuilSurstock = async (newValue) => {
    try {
      await api.updateParameter('SeuilSurstockProfond', newValue);
      setSeuilSurstockProfond(newValue);
      console.log(`✅ Seuil surstock mis à jour : ${newValue}j`);
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour seuil:', error);
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Problème de connexion. Vérifiez votre connexion Internet.', {
          action: {
            label: 'Réessayer',
            onClick: () => handleUpdateSeuilSurstock(newValue)
          }
        });
      } else if (error.message?.includes('Action non reconnue') || error.message?.includes('Action inconnue')) {
        toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas configurée dans Google Apps Script', {
          description: 'Consultez le fichier GOOGLE_APPS_SCRIPT_BACKEND_V1.md pour ajouter cette fonction',
          duration: 10000
        });
      } else {
        toast.error(`Erreur lors de la sauvegarde: ${error.message}`);
      }
      throw error;
    }
  };

  const handleUpdateDevise = async (newDevise) => {
    try {
      await api.updateParameter('DeviseDefaut', newDevise);
      setDeviseDefaut(newDevise);
      console.log(`✅ Devise mise à jour : ${newDevise}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour devise:', error);
      if (error.message?.includes('Action non reconnue') || error.message?.includes('Action inconnue')) {
        toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas configurée dans Google Apps Script', {
          description: 'Consultez le fichier GOOGLE_APPS_SCRIPT_BACKEND_V1.md pour ajouter cette fonction',
          duration: 10000
        });
      } else {
        toast.error(`Erreur lors de la sauvegarde de la devise: ${error.message}`);
      }
      throw error;
    }
  };

  const handleUpdateMultiplicateur = async (newValue) => {
    try {
      await api.updateParameter('MultiplicateurDefaut', newValue);
      setMultiplicateurDefaut(newValue);
      console.log(`✅ Multiplicateur mis à jour : ${newValue}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour multiplicateur:', error);
      if (error.message?.includes('Action non reconnue') || error.message?.includes('Action inconnue')) {
        toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas configurée dans Google Apps Script', {
          description: 'Consultez le fichier GOOGLE_APPS_SCRIPT_BACKEND_V1.md pour ajouter cette fonction',
          duration: 10000
        });
      } else {
        toast.error(`Erreur lors de la sauvegarde du multiplicateur: ${error.message}`);
      }
      throw error;
    }
  };

  // ============================================
  // HANDLERS GESTION FOURNISSEURS
  // ============================================

  const handleOpenSupplierModal = (supplier = null) => {
    if (supplier) {
      // Mode édition
      setEditingSupplier(supplier);
      setSupplierFormData({
        name: supplier.name,
        email: supplier.email,
        leadTimeDays: supplier.leadTimeDays,
        moq: supplier.moq || 50,
        notes: supplier.notes || ''
      });
    } else {
      // Mode création
      setEditingSupplier(null);
      setSupplierFormData({
        name: '',
        email: '',
        leadTimeDays: 30,
        moq: 50,
        notes: ''
      });
    }
    setSupplierModalOpen(true);
  };

  const handleCloseSupplierModal = () => {
    setSupplierModalOpen(false);
    setEditingSupplier(null);
    setSupplierFormData({
      name: '',
      email: '',
      leadTimeDays: 30,
      moq: 50,
      notes: ''
    });
  };

  const handleSupplierFormChange = (field, value) => {
    setSupplierFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateSupplierForm = () => {
    const errors = [];
    
    if (!supplierFormData.name.trim()) {
      errors.push('Le nom du fournisseur est obligatoire');
    }
    
    if (!supplierFormData.email.trim()) {
      errors.push('L\'email est obligatoire');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplierFormData.email)) {
      errors.push('L\'email n\'est pas valide');
    }
    
    if (supplierFormData.leadTimeDays <= 0) {
      errors.push('Le délai doit être supérieur à 0');
    }
    
    if (supplierFormData.moq <= 0) {
      errors.push('Le MOQ doit être supérieur à 0');
    }
    
    // Vérifier que le nom n'existe pas déjà (sauf en mode édition)
    if (!editingSupplier) {
      const existingSupplier = Object.values(suppliers).find(
        s => s.name.toLowerCase() === supplierFormData.name.toLowerCase()
      );
      if (existingSupplier) {
        errors.push('Un fournisseur avec ce nom existe déjà');
      }
    }
    
    return errors;
  };

  const handleSaveSupplier = async () => {
    const errors = validateSupplierForm();
    
    if (errors.length > 0) {
      toast.error('Erreurs : ' + errors.join(', '));
      return;
    }
    
    try {
      if (editingSupplier) {
        // Mode édition
        await api.updateSupplier(editingSupplier.name, supplierFormData);
        console.log('✅ Fournisseur mis à jour');
      } else {
        // Mode création
        await api.createSupplier(supplierFormData);
        console.log('✅ Fournisseur créé');
      }
      
      await loadData();
      handleCloseSupplierModal();
    } catch (error) {
      console.error('❌ Erreur sauvegarde fournisseur:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteSupplier = async (supplier) => {
    // Vérifier si des produits utilisent ce fournisseur
    const productsUsingSupplier = products.filter(p => p.supplier === supplier.name);
    
    if (productsUsingSupplier.length > 0) {
      const confirmDelete = window.confirm(
        `⚠️ ATTENTION : ${productsUsingSupplier.length} produit(s) utilisent ce fournisseur.\n\n` +
        `Si vous supprimez ce fournisseur, ces produits n'auront plus de fournisseur assigné.\n\n` +
        `Voulez-vous vraiment continuer ?`
      );
      
      if (!confirmDelete) return;
    }
    
    try {
      await api.deleteSupplier(supplier.name);
      console.log('✅ Fournisseur supprimé');
      await loadData();
    } catch (error) {
      console.error('❌ Erreur suppression fournisseur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // ============================================
  // HANDLERS MAPPING
  // ============================================

  const handleOpenAssignSupplierModal = (product) => {
    setProductToMap(product);
    setSelectedSupplierForMapping(product.supplier || '');
    setAssignSupplierModalOpen(true);
  };

  const handleCloseAssignSupplierModal = () => {
    setAssignSupplierModalOpen(false);
    setProductToMap(null);
    setSelectedSupplierForMapping('');
  };

  const handleAssignSupplier = async () => {
    if (!selectedSupplierForMapping) {
      toast.warning('Veuillez sélectionner un fournisseur');
      return;
    }
    
    try {
      await api.assignSupplierToProduct(productToMap.sku, selectedSupplierForMapping);
      console.log(`✅ Fournisseur assigné à ${productToMap.sku}`);
      await loadData();
      handleCloseAssignSupplierModal();
    } catch (error) {
      console.error('❌ Erreur assignation fournisseur:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  };

  const handleRemoveSupplierFromProduct = async (sku) => {
    const confirm = window.confirm(
      `⚠️ Retirer le fournisseur de ce produit ?\n\n` +
      `Le produit n'aura plus de fournisseur assigné.`
    );
    
    if (!confirm) return;
    
    try {
      await api.removeSupplierFromProduct(sku);
      console.log(`✅ Fournisseur retiré de ${sku}`);
      await loadData();
    } catch (error) {
      console.error('❌ Erreur suppression assignation:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const enrichedProducts = useMemo(() => products.map(p => calculateMetrics(p, seuilSurstockProfond)), [products, seuilSurstockProfond]);

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
        const daysRemaining = p.leadTimeDays - daysSinceShip;
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
      if (error.message?.includes('404')) {
        toast.error('Produit introuvable. Actualisez la page.', {
          action: {
            label: 'Actualiser',
            onClick: () => loadData()
          }
        });
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Problème de connexion. Vérifiez votre connexion Internet.');
      } else {
        toast.error(`Erreur lors de la mise à jour : ${error.message || 'Erreur inconnue'}`);
      }
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
  
  const handleParameterChange = (paramName, value) => {
    console.log('Modification paramètre:', paramName, '=', value);
    setUnsavedParameterChanges(prev => ({
      ...prev,
      [paramName]: value
    }));
  };
  
  const saveAllParameters = async () => {
    if (Object.keys(unsavedParameterChanges).length === 0) {
      toast.info('Aucune modification à sauvegarder');
      return;
    }
    
    setIsSavingParameters(true);
    
    try {
      console.log('💾 Sauvegarde des paramètres:', unsavedParameterChanges);
      
      // Sauvegarder chaque paramètre modifié
      const savePromises = Object.entries(unsavedParameterChanges).map(([paramName, value]) => {
        console.log(`  - ${paramName}: ${value}`);
        return api.updateParameter(paramName, value);
      });
      
      const results = await Promise.all(savePromises);
      console.log('Résultats de sauvegarde:', results);
      
      // Vérifier les erreurs
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Erreurs: ${errors.map(e => e.error).join(', ')}`);
      }
      
      // Recharger les données pour obtenir les paramètres mis à jour
      await loadData();
      
      // Nettoyer les modifications non sauvegardées
      setUnsavedParameterChanges({});
      
      toast.success(`${Object.keys(unsavedParameterChanges).length} paramètre(s) sauvegardé(s) avec succès!`, {
        duration: 4000
      });
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres:', error);
      toast.error('Erreur lors de la sauvegarde: ' + error.message, {
        duration: 6000
      });
    } finally {
      setIsSavingParameters(false);
    }
  };

  const openEmailModal = (supplier) => {
    // Initialiser les quantités éditables avec les recommandations
    const products = toOrderBySupplier[supplier];
    const quantities = {};
    products.forEach(p => {
      quantities[p.sku] = p.qtyToOrder; // Quantité recommandée par défaut
    });
    setOrderQuantities(quantities);
    setSelectedSupplier(supplier);
    setEmailModalOpen(true);
  };

  const updateOrderQuantity = (sku, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    setOrderQuantities(prev => ({
      ...prev,
      [sku]: isNaN(qty) || qty < 0 ? 0 : qty
    }));
  };

  const generateEmailDraft = (supplier, products) => {
    const supplierInfo = suppliers[supplier];
    const productList = products.map(p => {
      const qty = orderQuantities[p.sku] || p.qtyToOrder;
      return `- ${p.name} (SKU: ${p.sku}) - Quantité: ${qty} unités - Prix unitaire: ${p.buyPrice}€`;
    }).join('\n');
    
    const total = products.reduce((sum, p) => {
      const qty = orderQuantities[p.sku] || p.qtyToOrder;
      return sum + (qty * p.buyPrice);
    }, 0);
    
    return {
      to: supplierInfo.email || 'email@fournisseur.com',
      subject: `Commande Stock Easy - ${new Date().toLocaleDateString('fr-FR')}`,
      body: `Bonjour,

Nous souhaitons passer la commande suivante :

${productList}

TOTAL: ${total.toFixed(2)}€

Merci de nous confirmer la disponibilité et la date de livraison estimée.

Conditions habituelles: ${supplierInfo.leadTimeDays} jours - MOQ respecté

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
      const total = productsToOrder.reduce((sum, p) => {
        const qty = orderQuantities[p.sku] || p.qtyToOrder;
        return sum + (qty * p.buyPrice);
      }, 0);
      
      const orderData = {
        id: generatePONumber(),
        supplier: selectedSupplier,
        status: 'pending_confirmation',
        total: total,
        createdAt: new Date().toISOString().split('T')[0],
        items: productsToOrder.map(p => ({
          sku: p.sku,
          quantity: orderQuantities[p.sku] || p.qtyToOrder,
          pricePerUnit: p.buyPrice
        })),
        notes: ''
      };
      
      await api.createOrder(orderData);
      await loadData();
      
      setEmailModalOpen(false);
      setSelectedSupplier(null);
      
      toast.success('Commande créée et sauvegardée dans Google Sheets !', {
        action: {
          label: 'Voir',
          onClick: () => setActiveTab('track')
        },
        duration: 6000
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création de la commande:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  };

  const createOrderWithoutEmail = async () => {
    try {
      const productsToOrder = toOrderBySupplier[selectedSupplier];
      const total = productsToOrder.reduce((sum, p) => {
        const qty = orderQuantities[p.sku] || p.qtyToOrder;
        return sum + (qty * p.buyPrice);
      }, 0);
      
      const orderData = {
        id: generatePONumber(),
        supplier: selectedSupplier,
        status: 'pending_confirmation',
        total: total,
        createdAt: new Date().toISOString().split('T')[0],
        items: productsToOrder.map(p => ({
          sku: p.sku,
          quantity: orderQuantities[p.sku] || p.qtyToOrder,
          pricePerUnit: p.buyPrice
        })),
        notes: ''
      };
      
      await api.createOrder(orderData);
      await loadData();
      
      setEmailModalOpen(false);
      setSelectedSupplier(null);
      
      toast.success('Commande créée sans envoi d\'email !', {
        action: {
          label: 'Voir',
          onClick: () => setActiveTab('track')
        },
        duration: 6000
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création de la commande:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  };

  const confirmOrder = async (orderId) => {
    try {
      const confirmedAt = new Date().toISOString();
      console.log('Confirmation commande:', orderId, 'Date:', confirmedAt);
      
      await api.updateOrderStatus(orderId, {
        status: 'preparing',
        confirmedAt: confirmedAt
      });
      
      await loadData();
      toast.success('Commande confirmée et en cours de préparation!');
    } catch (error) {
      console.error('❌ Erreur confirmation:', error);
      toast.error('Erreur lors de la confirmation');
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
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
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const receiveOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    openReconciliationModal(order);
  };
  
  const openReconciliationModal = (order) => {
    setReconciliationOrder(order);
    
    // Initialiser les quantités reçues avec les quantités commandées par défaut
    const initialItems = {};
    const initialTypes = {};
    
    order.items.forEach(item => {
      initialItems[item.sku] = {
        received: item.receivedQuantity !== undefined ? item.receivedQuantity : item.quantity,
        notes: item.discrepancyNotes || ''
      };
      initialTypes[item.sku] = item.discrepancyType || 'none';
    });
    
    setDiscrepancyItems(initialItems);
    setDiscrepancyTypes(initialTypes);
    setReconciliationModalOpen(true);
  };
  
  const updateDiscrepancyItem = (sku, field, value) => {
    setDiscrepancyItems(prev => ({
      ...prev,
      [sku]: {
        ...prev[sku],
        [field]: value
      }
    }));
  };
  
  const confirmReconciliationWithQuantities = async () => {
    try {
      if (!reconciliationOrder) return;
      
      console.log('🔍 Début de la réconciliation:', reconciliationOrder.id);
      console.log('Quantités reçues:', discrepancyItems);
      console.log('Types de problèmes:', discrepancyTypes);
      
      // Préparer les items avec quantités et types de problèmes
      const updatedItems = reconciliationOrder.items.map(item => {
        const receivedQty = parseInt(discrepancyItems[item.sku]?.received, 10);
        const itemType = discrepancyTypes[item.sku] || 'none';
        const notes = discrepancyItems[item.sku]?.notes || '';
        
        // Validation
        if (isNaN(receivedQty) || receivedQty < 0) {
          throw new Error(`Quantité invalide pour ${item.sku}`);
        }
        
        return {
          sku: item.sku,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          receivedQuantity: receivedQty,
          discrepancyType: itemType,
          discrepancyNotes: notes
        };
      });
      
      console.log('Items mis à jour:', updatedItems);
      
      // Vérifier s'il y a des problèmes
      const hasProblems = updatedItems.some(item => 
        item.receivedQuantity < item.quantity || 
        item.discrepancyType !== 'none'
      );
      
      console.log('A des problèmes:', hasProblems);
      
      // Sauvegarder dans la base de données
      const updatePayload = {
        status: hasProblems ? 'reconciliation' : 'completed',
        receivedAt: new Date().toISOString().split('T')[0],
        hasDiscrepancy: hasProblems,
        items: updatedItems
      };
      
      console.log('Payload de mise à jour:', updatePayload);
      
      await api.updateOrderStatus(reconciliationOrder.id, updatePayload);
      
      // Mettre à jour le stock uniquement pour les quantités reçues conformes
      // NE PAS ajouter les produits endommagés au stock
      const stockUpdates = updatedItems
        .filter(item => item.discrepancyType !== 'damaged') // Exclure les endommagés
        .map(item => ({
          sku: item.sku,
          quantityToAdd: item.receivedQuantity // Quantité réellement reçue et conforme
        }))
        .filter(update => update.quantityToAdd > 0); // Ne traiter que les quantités > 0
      
      console.log('Mises à jour du stock:', stockUpdates);
      
      if (stockUpdates.length > 0) {
        await api.updateStock(stockUpdates);
        console.log('✅ Stock mis à jour avec succès');
      }
      
      // Générer email de réclamation si nécessaire
      if (hasProblems) {
        generateClaimEmail(updatedItems);
      }
      
      // Recharger les données
      await loadData();
      
      // Fermer la modal et nettoyer les états
      setReconciliationModalOpen(false);
      setReconciliationOrder(null);
      setDiscrepancyItems({});
      setDiscrepancyTypes({});
      
      toast.success(
        hasProblems ? 
          'Réception enregistrée. Email de réclamation généré.' : 
          'Réception validée et stock mis à jour avec succès!',
        { duration: 5000 }
      );
      
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation de la réception: ' + error.message);
    }
  };
  
  const generateClaimEmail = (items) => {
    if (!reconciliationOrder) return;
    
    const missingItems = items.filter(i => 
      i.discrepancyType === 'missing' || 
      (i.receivedQuantity < i.quantity && i.discrepancyType === 'none')
    );
    const damagedItems = items.filter(i => i.discrepancyType === 'damaged');
    
    let email = `Objet: Réclamation - Commande ${reconciliationOrder.id}\n\n`;
    email += `Bonjour,\n\n`;
    email += `Nous avons réceptionné la commande ${reconciliationOrder.id} mais constatons les problèmes suivants :\n\n`;
    
    if (missingItems.length > 0) {
      email += `🔴 QUANTITÉS MANQUANTES:\n`;
      email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      missingItems.forEach(item => {
        const product = products.find(p => p.sku === item.sku);
        const missing = item.quantity - item.receivedQuantity;
        email += `\n▸ ${product?.name || item.sku}\n`;
        email += `  SKU: ${item.sku}\n`;
        email += `  Commandé: ${item.quantity} unités\n`;
        email += `  Reçu: ${item.receivedQuantity} unités\n`;
        email += `  Manquant: ${missing} unités\n`;
        if (item.discrepancyNotes) {
          email += `  Notes: ${item.discrepancyNotes}\n`;
        }
      });
      email += `\n`;
    }
    
    if (damagedItems.length > 0) {
      email += `⚠️ PRODUITS ENDOMMAGÉS:\n`;
      email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      damagedItems.forEach(item => {
        const product = products.find(p => p.sku === item.sku);
        email += `\n▸ ${product?.name || item.sku}\n`;
        email += `  SKU: ${item.sku}\n`;
        email += `  Quantité endommagée: ${item.receivedQuantity} unités\n`;
        if (item.discrepancyNotes) {
          email += `  Description des dommages: ${item.discrepancyNotes}\n`;
        }
      });
      email += `\n`;
    }
    
    email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    email += `Merci de procéder rapidement au remplacement ou à l'envoi des articles manquants.\n\n`;
    email += `Cordialement,\n`;
    email += `L'équipe Stock Easy`;
    
    // Afficher l'email dans une alerte ou ouvrir dans un client email
    console.log('📧 Email de réclamation généré:\n', email);
    alert(email);
    
    // Optionnel: copier dans le presse-papiers
    try {
      navigator.clipboard.writeText(email);
      toast.info('Email de réclamation copié dans le presse-papiers');
    } catch (err) {
      console.warn('Impossible de copier dans le presse-papiers:', err);
    }
  };

  const confirmReconciliation = async (hasDiscrepancy) => {
    try {
      if (hasDiscrepancy) {
        // NOUVEAU: Ouvrir le modal unifié de réconciliation
        setReconciliationModalOpen(false);
        const initialUnifiedData = {};
        reconciliationOrder.items.forEach(item => {
          initialUnifiedData[item.sku] = {
            ordered: item.quantity,
            received: item.quantity, // par défaut, à ajuster par l'utilisateur
            damaged: 0 // par défaut, pas d'endommagé
          };
        });
        setUnifiedReconciliationItems(initialUnifiedData);
        setReconciliationNotes('');
        setUnifiedReconciliationModalOpen(true);
      } else {
        // CORRECTION 1: Réception conforme - mise à jour automatique du stock
        console.log('=== DEBUG CORRECTION 1 - Réception conforme ===');
        
        // Convertir les quantités en nombres pour éviter #NUM!
        const stockUpdates = reconciliationOrder.items.map(item => {
          const quantity = parseInt(item.quantity, 10) || 0;
          console.log(`Stock ${item.sku}: +${quantity} unités (type: ${typeof quantity})`);
          return {
            sku: item.sku,
            quantityToAdd: quantity
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
        
        toast.success('Réception validée ! Stock mis à jour automatiquement.');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la validation');
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
      toast.success('Email de réclamation généré !', {
        description: 'Le contenu a été préparé',
        duration: 4000
      });
      
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
          quantityToAdd: quantityReceived
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
      toast.error('Erreur lors de la soumission');
    }
  };

  const openDamageModal = () => {
    // ANCIEN: Rediriger vers le modal unifié
    confirmReconciliation(true);
  };

  // NOUVEAU: Fonction de soumission du modal unifié de réconciliation
  const submitUnifiedReconciliation = async () => {
    try {
      // Calculer les écarts et préparer les données
      const hasQuantityDiscrepancy = Object.entries(unifiedReconciliationItems).some(
        ([sku, data]) => data.ordered !== data.received
      );
      const hasDamage = Object.entries(unifiedReconciliationItems).some(
        ([sku, data]) => data.damaged > 0
      );
      
      // Mettre à jour les items avec les quantités reçues, endommagées et validées
      const updatedItems = reconciliationOrder.items.map(item => {
        const data = unifiedReconciliationItems[item.sku];
        const receivedQty = parseInt(data.received, 10) || 0;
        const damagedQty = parseInt(data.damaged, 10) || 0;
        const validatedQty = receivedQty - damagedQty;
        
        return {
          sku: item.sku,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          receivedQuantity: receivedQty,
          damagedQuantity: damagedQty,
          validatedQuantity: validatedQty,
          quantityDiscrepancy: item.quantity - receivedQty
        };
      });

      console.log('=== DEBUG RÉCONCILIATION UNIFIÉE ===');
      console.log('Items mis à jour:', updatedItems);
      
      // Générer les emails de réclamation si nécessaire
      if (hasQuantityDiscrepancy || hasDamage) {
        let claimEmail = `Objet: Réclamation - Commande ${reconciliationOrder.id}\n\nBonjour,\n\nNous avons reçu la commande ${reconciliationOrder.id} mais constatons les problèmes suivants :\n\n`;
        
        if (hasQuantityDiscrepancy) {
          const discrepancyList = Object.entries(unifiedReconciliationItems)
            .filter(([sku, data]) => data.ordered !== data.received)
            .map(([sku, data]) => {
              const product = products.find(p => p.sku === sku);
              return `- ${product?.name || sku} (SKU: ${sku})\n  📦 Commandé: ${data.ordered} | Reçu: ${data.received} | Écart: ${data.received - data.ordered}`;
            })
            .join('\n\n');
          
          claimEmail += `**ÉCARTS DE QUANTITÉ:**\n\n${discrepancyList}\n\n`;
        }
        
        if (hasDamage) {
          const damagedList = Object.entries(unifiedReconciliationItems)
            .filter(([sku, data]) => data.damaged > 0)
            .map(([sku, data]) => {
              const product = products.find(p => p.sku === sku);
              return `- ${product?.name || sku} (SKU: ${sku})\n  ⚠️ Endommagé: ${data.damaged} / ${data.received} reçus`;
            })
            .join('\n\n');
          
          claimEmail += `**MARCHANDISES ENDOMMAGÉES:**\n\n${damagedList}\n\n`;
        }
        
        if (reconciliationNotes) {
          claimEmail += `**Notes supplémentaires:**\n${reconciliationNotes}\n\n`;
        }
        
        claimEmail += `Merci de procéder aux actions correctives nécessaires.\n\nCordialement`;
        
        console.log('EMAIL DE RÉCLAMATION GÉNÉRÉ:', claimEmail);
        toast.success('Email de réclamation généré !', {
          description: 'Le contenu a été préparé',
          duration: 4000
        });
      }
      
      // Mettre à jour le statut de la commande
      await api.updateOrderStatus(reconciliationOrder.id, {
        status: 'reconciliation',
        receivedAt: new Date().toISOString().split('T')[0],
        hasDiscrepancy: hasQuantityDiscrepancy,
        hasDamage: hasDamage,
        items: updatedItems
      });
      
      // Mettre à jour le stock avec les quantités validées (reçues - endommagées)
      const stockUpdates = Object.entries(unifiedReconciliationItems).map(([sku, data]) => {
        const validatedQty = parseInt(data.received, 10) - parseInt(data.damaged, 10);
        console.log(`Stock update pour ${sku}: +${validatedQty} unités (reçu: ${data.received}, endommagé: ${data.damaged})`);
        return {
          sku,
          quantityToAdd: validatedQty
        };
      });
      
      console.log('Stock updates:', stockUpdates);
      await api.updateStock(stockUpdates);
      
      await loadData();
      setUnifiedReconciliationModalOpen(false);
      setUnifiedReconciliationItems({});
      setReconciliationNotes('');
      setReconciliationOrder(null);
      
      toast.success('Réconciliation enregistrée avec succès !');
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la soumission de la réconciliation');
    }
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
      toast.success('Email de réclamation pour dommages généré !', {
        description: 'Le contenu a été préparé',
        duration: 4000
      });
      
      // CORRECTION 1: Mettre à jour le stock avec uniquement les produits non endommagés (conversion en nombre)
      const stockUpdates = Object.entries(damageItems).map(([sku, data]) => {
        const quantityGood = parseInt(data.total, 10) - parseInt(data.damaged, 10);
        console.log(`Stock update pour ${sku}: +${quantityGood} unités (total: ${data.total}, endommagé: ${data.damaged})`);
        return {
          sku,
          quantityToAdd: quantityGood
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
      toast.error('Erreur lors de la soumission');
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
    toast.success('Email copié dans le presse-papier !');
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
          quantityToAdd: quantityReceived
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
      
      toast.success(`Commande ${order.id} validée avec les quantités reçues.`);
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  // Fonction pour exporter l'historique en CSV
  const exportHistoryToCSV = () => {
    // Filtrer les commandes selon les critères actuels
    const filteredOrders = orders.filter(o => {
      // Filtrage par statut
      if (historyFilter !== 'all' && o.status !== historyFilter) return false;
      
      // Filtrage par dates
      if (historyDateStart || historyDateEnd) {
        const orderDate = new Date(o.createdAt);
        if (historyDateStart && orderDate < new Date(historyDateStart)) return false;
        if (historyDateEnd && orderDate > new Date(historyDateEnd)) return false;
      }
      
      return true;
    });

    // Générer le CSV
    const headers = ['N° Commande', 'Fournisseur', 'Date Création', 'Date Confirmation', 'Date Expédition', 'Date Réception', 'Statut', 'Montant (€)', 'Nb Produits', 'Suivi'];
    const rows = filteredOrders.map(order => {
      const statusLabels = {
        pending_confirmation: 'En attente',
        processing: 'En traitement',
        in_transit: 'En transit',
        completed: 'Complétée',
        reconciliation: 'À réconcilier'
      };
      
      return [
        order.id,
        order.supplier,
        formatConfirmedDate(order.createdAt) || order.createdAt,
        formatConfirmedDate(order.confirmedAt) || order.confirmedAt || '-',
        formatConfirmedDate(order.shippedAt) || order.shippedAt || '-',
        formatConfirmedDate(order.receivedAt) || order.receivedAt || '-',
        statusLabels[order.status] || order.status,
        order.total,
        order.items.length,
        order.trackingNumber || '-'
      ];
    });

    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Créer le fichier et le télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `historique-commandes-${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Export CSV réussi : ${filteredOrders.length} commande(s) exportée(s)`);
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#F0F0EB] flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-12 h-12 text-black mx-auto mb-4" />
          </motion.div>
          <p className="text-lg font-medium text-[#191919]">Chargement depuis Google Sheets...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right" 
        expand={true}
        richColors 
        closeButton
        duration={4000}
      />
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
                className="relative p-2.5 rounded-lg bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 shrink-0"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-neutral-900 dark:text-neutral-100 shrink-0" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 shrink-0"
                aria-label={darkMode ? 'Mode clair' : 'Mode sombre'}
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {darkMode ? <Sun className="w-5 h-5 text-neutral-100 shrink-0" /> : <Moon className="w-5 h-5 text-neutral-900 shrink-0" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {notificationsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998]" 
              onClick={() => setNotificationsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed right-4 top-20 w-96 bg-white rounded-xl shadow-2xl border border-[#E5E4DF] z-[9999]">
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* DASHBOARD TAB */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
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
                  productsByStatus.to_order.map((p, index) => (
                    <motion.div
                      key={p.sku}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      className="flex justify-between items-center p-3 bg-[#FAFAF7] rounded-lg hover:bg-[#F0F0EB] transition-colors border border-[#E5E4DF]">
                      <div className="min-w-0">
                        <p className="font-medium text-[#191919] text-sm truncate">{p.name}</p>
                        <p className="text-xs text-[#666663] truncate">{p.supplier}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-bold text-[#EF1C43] text-sm">{p.qtyToOrder} unités</p>
                        <p className="text-xs text-[#666663]">Stock: {p.stock}</p>
                      </div>
                    </motion.div>
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
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('track'); setTrackTabSection('en_transit'); }}>
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
                    const supplierDelay = suppliers[order.supplier]?.leadTimeDays || 30;
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
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('track'); setTrackTabSection('commandes_recues'); }}>
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

            </motion.div>
          )}

          {/* ONGLET ACTIONS */}
          {activeTab === 'actions' && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6">
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
              <div>
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
            </motion.div>
          )}

          {/* TRACK & MANAGE TAB */}
          {activeTab === 'track' && (
            <motion.div
              key="track"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6">
            
            {/* Header avec titre et sous-titre */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="w-8 h-8 text-[#191919]" />
                <h1 className="text-2xl font-bold text-[#191919]">Track & Manage</h1>
              </div>
              <p className="text-[#666663] ml-11">Suivez vos commandes et gérez les réceptions</p>
              
              {/* Onglets de navigation */}
              <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
                <button
                  onClick={() => setTrackTabSection('en_cours_commande')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    trackTabSection === 'en_cours_commande'
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                  }`}
                >
                  En Cours de Commande ({orders.filter(o => o.status === 'pending_confirmation').length})
                </button>
                <button
                  onClick={() => setTrackTabSection('preparation')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    trackTabSection === 'preparation'
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                  }`}
                >
                  En cours de préparation ({orders.filter(o => o.status === 'preparing').length})
                </button>
                <button
                  onClick={() => setTrackTabSection('en_transit')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    trackTabSection === 'en_transit'
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                  }`}
                >
                  En Transit ({orders.filter(o => o.status === 'in_transit').length})
                </button>
                <button
                  onClick={() => setTrackTabSection('commandes_recues')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    trackTabSection === 'commandes_recues'
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                  }`}
                >
                  Commandes Reçues ({orders.filter(o => o.status === 'received').length})
                </button>
                <button
                  onClick={() => setTrackTabSection('reconciliation')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    trackTabSection === 'reconciliation'
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                  }`}
                >
                  Réconciliation ({orders.filter(o => o.status === 'reconciliation').length})
                </button>
              </div>
            </div>

            {/* Contenu de chaque section */}
            {trackTabSection === 'en_cours_commande' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
                <h2 className="text-lg font-bold text-[#191919]">En Cours de Commande</h2>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'pending_confirmation').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande en attente</p>
                ) : (
                  orders.filter(o => o.status === 'pending_confirmation').map(order => (
                    <div key={order.id} className="bg-[#FAFAF7] rounded-lg border border-[#E5E4DF] overflow-hidden">
                      {/* Header de la commande - Cliquable */}
                      <div 
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-[#191919]">{order.id}</span>
                            <span className="text-[#666663]">→</span>
                            <span className="text-[#666663] truncate">{order.supplier}</span>
                            {/* Icône chevron */}
                            <motion.div
                              animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                            </motion.div>
                          </div>
                          <div className="text-sm text-[#666663]">
                            Créée le {formatConfirmedDate(order.createdAt)} • Total: {order.total}€
                          </div>
                        </div>
                        <Button
                          variant="success"
                          size="sm"
                          icon={Check}
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher le toggle
                            confirmOrder(order.id);
                          }}
                          className="shrink-0"
                        >
                          Confirmer réception email
                        </Button>
                      </div>
                      
                      {/* Détails des produits - Expansible */}
                      <AnimatePresence>
                        {expandedOrders[order.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#E5E4DF] bg-white"
                          >
                            <div className="p-4">
                              <h4 className="font-semibold text-sm text-[#666663] mb-3">Produits commandés:</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                  const product = products.find(p => p.sku === item.sku);
                                  return (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-[#FAFAF7] rounded border border-[#E5E4DF]">
                                      <div className="flex-1">
                                        <div className="font-medium text-[#191919] text-sm">
                                          {product?.name || item.sku}
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          SKU: {item.sku}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-[#191919]">
                                          {item.quantity} unités
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          {item.pricePerUnit}€/unité
                                        </div>
                                      </div>
                                      <div className="ml-4 text-right font-bold text-[#191919] min-w-[80px]">
                                        {(item.quantity * item.pricePerUnit).toFixed(2)}€
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 pt-3 border-t border-[#E5E4DF] flex justify-between">
                                <span className="font-semibold text-[#666663]">Total:</span>
                                <span className="font-bold text-[#191919] text-lg">{order.total.toFixed(2)}€</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            {/* En cours de préparation */}
            {trackTabSection === 'preparation' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#64A4F2] shrink-0" />
                <h2 className="text-lg font-bold text-[#191919]">En cours de préparation</h2>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'preparing').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande en préparation</p>
                ) : (
                  orders.filter(o => o.status === 'preparing').map(order => (
                    <div key={order.id} className="bg-[#FAFAF7] rounded-lg border border-[#E5E4DF] overflow-hidden">
                      {/* Header de la commande - Cliquable */}
                      <div 
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-[#191919]">{order.id}</span>
                            <span className="text-[#666663]">→</span>
                            <span className="text-[#666663] truncate">{order.supplier}</span>
                            {/* Icône chevron */}
                            <motion.div
                              animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                            </motion.div>
                          </div>
                          <div className="text-sm text-[#666663]">
                            Créée le {formatConfirmedDate(order.createdAt)} • Total: {order.total}€
                          </div>
                          {order.confirmedAt && (
                            <div className="text-sm text-green-600 mt-1">
                              ✓ Confirmée le {formatConfirmedDate(order.confirmedAt)}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Truck}
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher le toggle
                            shipOrder(order.id);
                          }}
                          className="shrink-0"
                        >
                          Marquer comme expédier
                        </Button>
                      </div>
                      
                      {/* Détails des produits - Expansible */}
                      <AnimatePresence>
                        {expandedOrders[order.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#E5E4DF] bg-white"
                          >
                            <div className="p-4">
                              <h4 className="font-semibold text-sm text-[#666663] mb-3">Produits commandés:</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                  const product = products.find(p => p.sku === item.sku);
                                  return (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-[#FAFAF7] rounded border border-[#E5E4DF]">
                                      <div className="flex-1">
                                        <div className="font-medium text-[#191919] text-sm">
                                          {product?.name || item.sku}
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          SKU: {item.sku}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-[#191919]">
                                          {item.quantity} unités
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          {item.pricePerUnit}€/unité
                                        </div>
                                      </div>
                                      <div className="ml-4 text-right font-bold text-[#191919] min-w-[80px]">
                                        {(item.quantity * item.pricePerUnit).toFixed(2)}€
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 pt-3 border-t border-[#E5E4DF] flex justify-between">
                                <span className="font-semibold text-[#666663]">Total:</span>
                                <span className="font-bold text-[#191919] text-lg">{order.total.toFixed(2)}€</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            {/* En Transit */}
            {trackTabSection === 'en_transit' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-purple-600 shrink-0" />
                <h2 className="text-lg font-bold text-[#191919]">En Transit</h2>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'in_transit').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande en transit</p>
                ) : (
                  orders.filter(o => o.status === 'in_transit').map(order => (
                    <div key={order.id} className="bg-[#FAFAF7] rounded-lg border border-[#E5E4DF] overflow-hidden">
                      {/* Header de la commande - Cliquable */}
                      <div 
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-[#191919]">{order.id}</span>
                            <span className="text-[#666663]">→</span>
                            <span className="text-[#666663] truncate">{order.supplier}</span>
                            {/* Icône chevron */}
                            <motion.div
                              animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                            </motion.div>
                          </div>
                          <div className="text-sm text-[#666663]">
                            Créée le {formatConfirmedDate(order.createdAt)} • Total: {order.total}€
                          </div>
                          {order.confirmedAt && (
                            <div className="text-sm text-green-600 mt-1">
                              ✓ Confirmée le {formatConfirmedDate(order.confirmedAt)}
                            </div>
                          )}
                          {order.shippedAt && (
                            <div className="text-sm text-purple-600 mt-1">
                              🚚 Expédiée le {formatConfirmedDate(order.shippedAt)}
                            </div>
                          )}
                          {order.trackingNumber && (
                            <div className="text-sm mt-1">
                              <span className="text-[#666663]">Suivi: </span>
                              <span className="text-purple-600 font-mono text-xs">{order.trackingNumber}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="success"
                          size="sm"
                          icon={CheckCircle}
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher le toggle
                            receiveOrder(order.id);
                          }}
                          className="shrink-0"
                        >
                          Confirmer réception
                        </Button>
                      </div>
                      
                      {/* Détails des produits - Expansible */}
                      <AnimatePresence>
                        {expandedOrders[order.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#E5E4DF] bg-white"
                          >
                            <div className="p-4">
                              <h4 className="font-semibold text-sm text-[#666663] mb-3">Produits commandés:</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                  const product = products.find(p => p.sku === item.sku);
                                  return (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-[#FAFAF7] rounded border border-[#E5E4DF]">
                                      <div className="flex-1">
                                        <div className="font-medium text-[#191919] text-sm">
                                          {product?.name || item.sku}
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          SKU: {item.sku}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-[#191919]">
                                          {item.quantity} unités
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          {item.pricePerUnit}€/unité
                                        </div>
                                      </div>
                                      <div className="ml-4 text-right font-bold text-[#191919] min-w-[80px]">
                                        {(item.quantity * item.pricePerUnit).toFixed(2)}€
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 pt-3 border-t border-[#E5E4DF] flex justify-between">
                                <span className="font-semibold text-[#666663]">Total:</span>
                                <span className="font-bold text-[#191919] text-lg">{order.total.toFixed(2)}€</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            {/* Commandes Reçues */}
            {trackTabSection === 'commandes_recues' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <h2 className="text-lg font-bold text-[#191919]">Commandes Reçues</h2>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'received').length === 0 ? (
                  <p className="text-[#666663] text-center py-8 text-sm">Aucune commande reçue</p>
                ) : (
                  orders.filter(o => o.status === 'received').map(order => (
                    <div key={order.id} className="bg-[#FAFAF7] rounded-lg border border-[#E5E4DF] overflow-hidden">
                      {/* Header de la commande */}
                      <div 
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-[#191919]">{order.id}</span>
                            <span className="text-[#666663]">→</span>
                            <span className="text-[#666663] truncate">{order.supplier}</span>
                            <motion.div
                              animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                            </motion.div>
                          </div>
                          <div className="text-sm text-[#666663]">
                            Créée le {formatConfirmedDate(order.createdAt)} • Total: {order.total}€
                          </div>
                          {order.receivedAt && (
                            <div className="text-sm text-green-600 mt-1">
                              ✓ Reçue le {formatConfirmedDate(order.receivedAt)}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="success"
                          size="sm"
                          icon={Check}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Fonction pour valider la commande reçue
                            console.log('Valider commande reçue:', order.id);
                          }}
                          className="shrink-0"
                        >
                          Valider
                        </Button>
                      </div>
                      
                      {/* Détails des produits */}
                      <AnimatePresence>
                        {expandedOrders[order.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#E5E4DF] bg-white"
                          >
                            <div className="p-4">
                              <h4 className="font-semibold text-sm text-[#666663] mb-3">Produits commandés:</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                  const product = products.find(p => p.sku === item.sku);
                                  return (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-[#FAFAF7] rounded border border-[#E5E4DF]">
                                      <div className="flex-1">
                                        <div className="font-medium text-[#191919] text-sm">
                                          {product?.name || item.sku}
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          SKU: {item.sku}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-[#191919]">
                                          {item.quantity} unités
                                        </div>
                                        <div className="text-xs text-[#666663]">
                                          {item.pricePerUnit}€/unité
                                        </div>
                                      </div>
                                      <div className="ml-4 text-right font-bold text-[#191919] min-w-[80px]">
                                        {(item.quantity * item.pricePerUnit).toFixed(2)}€
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 pt-3 border-t border-[#E5E4DF] flex justify-between">
                                <span className="font-semibold text-[#666663]">Total:</span>
                                <span className="font-bold text-[#191919] text-lg">{order.total.toFixed(2)}€</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            {/* Réconciliation */}
            {trackTabSection === 'reconciliation' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-[#EF1C43] shrink-0" />
                <h2 className="text-lg font-bold text-[#191919]">Réconciliation</h2>
              </div>
              <div className="space-y-3">
                {/* DEBUG INFO */}
                {(() => {
                  const reconciliationOrders = orders.filter(o => o.status === 'reconciliation');
                  const receivedOrders = orders.filter(o => o.status === 'received');
                  const ordersWithDiscrepancy = orders.filter(o => o.hasDiscrepancy === true);
                  
                  console.log('=== DEBUG RÉCONCILIATION ===');
                  console.log('Total commandes:', orders.length);
                  console.log('Commandes status=reconciliation:', reconciliationOrders.length);
                  console.log('Commandes status=received:', receivedOrders.length);
                  console.log('Commandes avec hasDiscrepancy:', ordersWithDiscrepancy.length);
                  console.log('Détails commandes avec écarts:', ordersWithDiscrepancy);
                  
                  return null;
                })()}
                
                {orders.filter(o => o.status === 'reconciliation').length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#666663] text-sm mb-2">Aucune commande à réconcilier</p>
                    <p className="text-xs text-[#999] mt-4">
                      Debug: {orders.length} commandes totales • 
                      {orders.filter(o => o.hasDiscrepancy).length} avec écarts détectés • 
                      {orders.filter(o => o.status === 'received').length} avec status 'received'
                    </p>
                    {orders.filter(o => o.hasDiscrepancy).length > 0 && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-left">
                        <p className="text-sm text-yellow-800 font-medium mb-2">
                          ⚠️ Attention: {orders.filter(o => o.hasDiscrepancy).length} commande(s) avec écarts détectés mais pas en statut 'reconciliation'
                        </p>
                        <div className="text-xs text-yellow-700 space-y-1">
                          {orders.filter(o => o.hasDiscrepancy).map(o => (
                            <div key={o.id}>
                              • {o.id} - Status actuel: {o.status}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  orders.filter(o => o.status === 'reconciliation').map(order => {
                    const isDamage = order.damageReport === true;
                    const bgColor = isDamage ? 'bg-orange-50' : 'bg-red-50';
                    const borderColor = isDamage ? 'border-orange-500' : 'border-[#EF1C43]';
                    const badgeBgColor = isDamage ? 'bg-orange-500/20' : 'bg-[#EF1C43]/20';
                    const badgeTextColor = isDamage ? 'text-orange-600' : 'text-[#EF1C43]';
                    const badgeText = isDamage ? '⚠️ RÉCEPTION ENDOMMAGÉE' : '📦 ÉCART DE QUANTITÉ';
                    
                    return (
                    <div key={order.id} className={`${bgColor} rounded-lg border-l-4 ${borderColor} overflow-hidden`}>
                      {/* Header de la commande - Cliquable */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="font-bold text-[#191919]">{order.id}</span>
                              <span className="text-[#666663]">→</span>
                              <span className="text-[#666663] truncate">{order.supplier}</span>
                              <span className={`px-2 py-1 ${badgeBgColor} ${badgeTextColor} rounded text-xs font-medium shrink-0`}>
                                {badgeText}
                              </span>
                              {/* Icône chevron */}
                              <motion.div
                                animate={{ rotate: expandedOrders[order.id] ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ArrowDownRight className="w-4 h-4 text-[#666663]" />
                              </motion.div>
                            </div>
                            <div className="text-sm text-[#666663]">
                              Créée le {formatConfirmedDate(order.createdAt)} • Total: {order.total}€
                            </div>
                            {order.receivedAt && (
                              <div className="text-sm text-[#666663] mt-1">
                                📦 Reçue le {formatConfirmedDate(order.receivedAt)}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Mail}
                              onClick={(e) => {
                                e.stopPropagation();
                                openReclamationModal(order);
                              }}
                            >
                              Envoyer réclamation
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              icon={Check}
                              onClick={(e) => {
                                e.stopPropagation();
                                validateWithoutReclamation(order);
                              }}
                            >
                              Valider sans réclamation
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Détails des produits - Expansible */}
                      <AnimatePresence>
                        {expandedOrders[order.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#E5E4DF] bg-white"
                          >
                            <div className="p-4">
                              <h4 className="font-semibold text-sm text-[#666663] mb-3">Détails de réconciliation:</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                  const product = products.find(p => p.sku === item.sku);
                                  const received = item.receivedQuantity !== undefined ? item.receivedQuantity : 0;
                                  const damaged = item.damagedQuantity !== undefined ? item.damagedQuantity : 0;
                                  const validated = item.validatedQuantity !== undefined ? item.validatedQuantity : received - damaged;
                                  const discrepancy = item.quantityDiscrepancy !== undefined ? item.quantityDiscrepancy : item.quantity - received;
                                  
                                  return (
                                    <div key={idx} className="p-3 bg-white rounded border border-[#E5E4DF]">
                                      <div className="font-medium text-[#191919] mb-2">
                                        {product?.name || item.sku} <span className="text-xs text-[#666663]">(SKU: {item.sku})</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-[#666663]">Commandé: </span>
                                          <span className="font-bold text-[#191919]">{item.quantity}</span>
                                        </div>
                                        <div>
                                          <span className="text-[#666663]">Reçu: </span>
                                          <span className={`font-bold ${received < item.quantity ? 'text-[#EF1C43]' : 'text-green-600'}`}>
                                            {received}
                                          </span>
                                        </div>
                                        {damaged > 0 && (
                                          <div>
                                            <span className="text-[#666663]">Endommagé: </span>
                                            <span className="font-bold text-orange-600">{damaged}</span>
                                          </div>
                                        )}
                                        <div>
                                          <span className="text-[#666663]">Validé: </span>
                                          <span className="font-bold text-green-600">{validated}</span>
                                        </div>
                                        {discrepancy !== 0 && (
                                          <div className="col-span-2">
                                            <span className="text-[#666663]">Écart: </span>
                                            <span className={`font-bold ${discrepancy > 0 ? 'text-[#EF1C43]' : 'text-blue-600'}`}>
                                              {discrepancy > 0 ? `-${discrepancy}` : `+${Math.abs(discrepancy)}`}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
            )}

            </motion.div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6">
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
            </motion.div>
          )}

          {/* STOCK LEVEL TAB */}
          {activeTab === 'stock-level' && (
            <motion.div
              key="stock-level"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6">
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
                            {products.length} produit(s) • Délai: {products[0].leadTimeDays} jours
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
            </motion.div>
          )}

          {/* HISTORIQUE TAB */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold text-[#191919] mb-2">Historique des Commandes</h2>
                  <p className="text-sm text-[#666663]">Consultez toutes vos commandes passées et leur statut</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-[#666663] font-medium">Du:</label>
                    <input
                      type="date"
                      value={historyDateStart}
                      onChange={(e) => setHistoryDateStart(e.target.value)}
                      className="px-3 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg text-[#191919] font-medium focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-[#666663] font-medium">Au:</label>
                    <input
                      type="date"
                      value={historyDateEnd}
                      onChange={(e) => setHistoryDateEnd(e.target.value)}
                      className="px-3 py-2 bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg text-[#191919] font-medium focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
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
                    {orders.filter(o => o.status === 'in_transit' || o.status === 'preparing' || o.status === 'pending_confirmation').length}
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
                      .filter(o => {
                        // Filtrage par statut
                        if (historyFilter !== 'all' && o.status !== historyFilter) return false;
                        
                        // Filtrage par dates
                        if (historyDateStart || historyDateEnd) {
                          const orderDate = new Date(o.createdAt);
                          if (historyDateStart && orderDate < new Date(historyDateStart)) return false;
                          if (historyDateEnd && orderDate > new Date(historyDateEnd)) return false;
                        }
                        
                        return true;
                      })
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
                              <span className="text-[#666663] text-sm">{formatConfirmedDate(order.createdAt)}</span>
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
              <Button variant="primary" icon={Upload} onClick={exportHistoryToCSV}>
                Exporter en CSV
              </Button>
            </div>
            </motion.div>
          )}

          {/* ONGLET PARAMETRES */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-[#191919] mb-2">⚙️ Paramètres</h2>
              <p className="text-[#666663]">Gérez la configuration de votre application</p>
            </div>
            
            {/* Navigation des sous-onglets */}
            <SubTabsNavigation 
              activeSubTab={parametersSubTab}
              onSubTabChange={setParametersSubTab}
            />
            
            {/* Contenu dynamique selon le sous-onglet */}
            {parametersSubTab === 'general' && (
              <div className="space-y-6">
                {/* Indicateur de modifications non sauvegardées */}
                {Object.keys(unsavedParameterChanges).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-yellow-800">
                            {Object.keys(unsavedParameterChanges).length} modification(s) non sauvegardée(s)
                          </span>
                          <div className="text-xs text-yellow-700 mt-1">
                            Cliquez sur "Sauvegarder" pour appliquer vos modifications
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        onClick={saveAllParameters}
                        disabled={isSavingParameters}
                        icon={isSavingParameters ? RefreshCw : Check}
                        className={isSavingParameters ? 'animate-pulse' : ''}
                      >
                        {isSavingParameters ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {/* Formulaire des paramètres */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-[#191919]">
                        Multiplicateur par défaut
                      </label>
                      {unsavedParameterChanges.MultiplicateurDefaut !== undefined && (
                        <span className="text-xs text-yellow-600 font-medium">● Modifié</span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="3"
                      value={
                        unsavedParameterChanges.MultiplicateurDefaut !== undefined 
                          ? unsavedParameterChanges.MultiplicateurDefaut 
                          : (parameters.MultiplicateurDefaut || 1.2)
                      }
                      onChange={(e) => handleParameterChange('MultiplicateurDefaut', parseFloat(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-[#E5E4DF] rounded-lg text-[#191919] font-semibold focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-colors"
                    />
                    <p className="text-xs text-[#666663] mt-2">
                      📊 Coefficient appliqué aux ventes moyennes pour calculer les quantités à commander (recommandé: 1.2 à 1.5)
                    </p>
                  </div>
                  
                  <div className="border-t border-[#E5E4DF] pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-[#191919]">
                        Devise par défaut
                      </label>
                      {unsavedParameterChanges.DeviseDefaut !== undefined && (
                        <span className="text-xs text-yellow-600 font-medium">● Modifié</span>
                      )}
                    </div>
                    <select
                      value={
                        unsavedParameterChanges.DeviseDefaut !== undefined 
                          ? unsavedParameterChanges.DeviseDefaut 
                          : (parameters.DeviseDefaut || 'EUR')
                      }
                      onChange={(e) => handleParameterChange('DeviseDefaut', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#E5E4DF] rounded-lg text-[#191919] font-semibold focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-colors"
                    >
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="USD">USD ($) - Dollar américain</option>
                      <option value="GBP">GBP (£) - Livre sterling</option>
                      <option value="CHF">CHF (Fr.) - Franc suisse</option>
                    </select>
                    <p className="text-xs text-[#666663] mt-2">
                      💰 Devise utilisée pour l'affichage des prix dans l'application
                    </p>
                  </div>
                  
                  <div className="border-t border-[#E5E4DF] pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-[#191919]">
                        Seuil surstock profond (jours)
                      </label>
                      {unsavedParameterChanges.SeuilSurstockProfond !== undefined && (
                        <span className="text-xs text-yellow-600 font-medium">● Modifié</span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="30"
                      max="365"
                      value={
                        unsavedParameterChanges.SeuilSurstockProfond !== undefined 
                          ? unsavedParameterChanges.SeuilSurstockProfond 
                          : (parameters.SeuilSurstockProfond || 90)
                      }
                      onChange={(e) => handleParameterChange('SeuilSurstockProfond', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-[#E5E4DF] rounded-lg text-[#191919] font-semibold focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-colors"
                    />
                    <p className="text-xs text-[#666663] mt-2">
                      ⚠️ Au-delà de ce seuil × 2, le produit est considéré en surstock profond et apparaît dans les alertes
                    </p>
                    <div className="mt-2 text-xs text-[#191919] bg-[#FAFAF7] border border-[#E5E4DF] rounded px-3 py-2">
                      Seuil actuel: <strong>{(unsavedParameterChanges.SeuilSurstockProfond || parameters.SeuilSurstockProfond || 90) * 2} jours</strong>
                    </div>
                  </div>
                </div>
                
                {/* Bouton de sauvegarde répété en bas */}
                {Object.keys(unsavedParameterChanges).length > 0 && (
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUnsavedParameterChanges({});
                        toast.info('Modifications annulées');
                      }}
                      disabled={isSavingParameters}
                    >
                      Annuler les modifications
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={saveAllParameters}
                      disabled={isSavingParameters}
                      icon={isSavingParameters ? RefreshCw : Check}
                      className={isSavingParameters ? 'animate-pulse' : ''}
                    >
                      {isSavingParameters ? 'Sauvegarde en cours...' : 'Sauvegarder tous les paramètres'}
                    </Button>
                  </div>
                )}
                
                {/* Section d'aide */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <strong>Comment ça marche ?</strong>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-blue-800">
                        <li>Modifiez les valeurs selon vos besoins</li>
                        <li>Un indicateur jaune apparaît pour les modifications non sauvegardées</li>
                        <li>Cliquez sur "Sauvegarder" pour appliquer définitivement les changements</li>
                        <li>Les paramètres sont stockés dans Google Sheets et persistants</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {parametersSubTab === 'products' && (
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
            )}
            
            {parametersSubTab === 'suppliers' && (
              <>
                <GestionFournisseurs
                  suppliers={suppliers}
                  products={products}
                  onOpenModal={handleOpenSupplierModal}
                  onDelete={handleDeleteSupplier}
                />
                
                <SupplierModal
                  isOpen={supplierModalOpen}
                  onClose={handleCloseSupplierModal}
                  formData={supplierFormData}
                  onChange={handleSupplierFormChange}
                  onSave={handleSaveSupplier}
                  isEditing={!!editingSupplier}
                />
              </>
            )}
            
            {parametersSubTab === 'mapping' && (
              <>
                <MappingSKUFournisseur
                  products={products}
                  suppliers={suppliers}
                  onOpenAssignModal={handleOpenAssignSupplierModal}
                  onRemoveSupplier={handleRemoveSupplierFromProduct}
                />
                
                <AssignSupplierModal
                  isOpen={assignSupplierModalOpen}
                  onClose={handleCloseAssignSupplierModal}
                  product={productToMap}
                  suppliers={suppliers}
                  selectedSupplier={selectedSupplierForMapping}
                  onSelectSupplier={setSelectedSupplierForMapping}
                  onAssign={handleAssignSupplier}
                />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Email */}
      <Modal
        isOpen={emailModalOpen && selectedSupplier}
        onClose={() => {
          setEmailModalOpen(false);
          setOrderQuantities({});
        }}
        title={`Commande - ${selectedSupplier}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setEmailModalOpen(false);
              setOrderQuantities({});
            }}>
              Annuler
            </Button>
            <Button variant="secondary" onClick={createOrderWithoutEmail}>
              Créer commande sans email
            </Button>
            <Button variant="primary" icon={Mail} onClick={sendOrder}>
              Envoyer email et créer commande
            </Button>
          </div>
        }
      >
        {selectedSupplier && (() => {
          const productsToOrder = toOrderBySupplier[selectedSupplier];
          const email = generateEmailDraft(selectedSupplier, productsToOrder);
          const totalAmount = productsToOrder.reduce((sum, p) => {
            const qty = orderQuantities[p.sku] || p.qtyToOrder;
            return sum + (qty * p.buyPrice);
          }, 0);
          
          return (
            <>
              {/* Section d'édition des quantités */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-[#191919] mb-3">Ajuster les quantités</h4>
                <div className="space-y-3">
                  {productsToOrder.map(p => (
                    <div key={p.sku} className="bg-white rounded-lg p-3 border border-[#E5E4DF]">
                      <div className="grid grid-cols-3 gap-3 items-center">
                        <div className="col-span-2">
                          <div className="font-medium text-[#191919] text-sm">{p.name}</div>
                          <div className="text-xs text-[#666663]">
                            SKU: {p.sku} • Recommandé: {p.qtyToOrder} unités
                          </div>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            value={orderQuantities[p.sku] !== undefined ? orderQuantities[p.sku] : p.qtyToOrder}
                            onChange={(e) => updateOrderQuantity(p.sku, e.target.value)}
                            className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg text-center font-bold"
                          />
                          <div className="text-xs text-right text-[#666663] mt-1">
                            {((orderQuantities[p.sku] || p.qtyToOrder) * p.buyPrice).toFixed(2)}€
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                  <span className="text-sm text-[#666663]">Total de la commande:</span>
                  <span className="text-xl font-bold text-[#191919]">{totalAmount.toFixed(2)}€</span>
                </div>
              </div>
              
              {/* Prévisualisation email */}
              <div className="space-y-3">
                <h4 className="font-semibold text-[#191919]">Prévisualisation email</h4>
                <div>
                  <label className="block text-sm font-medium text-[#666663] mb-1">À:</label>
                  <input value={email.to} readOnly className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#666663] mb-1">Objet:</label>
                  <input value={email.subject} readOnly className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#666663] mb-1">Message:</label>
                  <textarea value={email.body} readOnly rows={10} className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#191919] font-mono text-xs" />
                </div>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Modal Reconciliation */}
      <Modal
        isOpen={reconciliationModalOpen && reconciliationOrder}
        onClose={() => {
          setReconciliationModalOpen(false);
          setReconciliationOrder(null);
          setDiscrepancyItems({});
          setDiscrepancyTypes({});
        }}
        title="Vérification de la réception"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setReconciliationModalOpen(false);
                setReconciliationOrder(null);
                setDiscrepancyItems({});
                setDiscrepancyTypes({});
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="success" 
              icon={Check}
              onClick={confirmReconciliationWithQuantities}
            >
              Valider la réception
            </Button>
          </div>
        }
      >
        {reconciliationOrder && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Commande: {reconciliationOrder.id}</h4>
                  <p className="text-sm text-blue-700">
                    Fournisseur: {reconciliationOrder.supplier}<br />
                    Saisissez les quantités réellement reçues et leur état pour chaque produit.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {reconciliationOrder.items.map((item, idx) => {
                const product = products.find(p => p.sku === item.sku);
                const currentType = discrepancyTypes[item.sku] || 'none';
                const currentReceived = discrepancyItems[item.sku]?.received !== undefined 
                  ? discrepancyItems[item.sku].received 
                  : item.quantity;
                
                return (
                  <div key={idx} className="border border-[#E5E4DF] rounded-lg p-4 bg-[#FAFAF7]">
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="font-medium text-[#191919]">{product?.name || item.sku}</span>
                          <span className="text-xs text-[#666663] ml-2">({item.sku})</span>
                        </div>
                        <span className="text-sm text-[#666663] font-semibold">
                          Commandé: {item.quantity}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs font-medium text-[#666663] mb-1 block">
                          Quantité reçue
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={currentReceived}
                          onChange={(e) => updateDiscrepancyItem(item.sku, 'received', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg text-[#191919] font-semibold focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-[#666663] mb-1 block">
                          État de la réception
                        </label>
                        <select
                          value={currentType}
                          onChange={(e) => setDiscrepancyTypes(prev => ({
                            ...prev,
                            [item.sku]: e.target.value
                          }))}
                          className={`w-full px-3 py-2 border-2 rounded-lg font-medium focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] outline-none
                            ${currentType === 'none' ? 'border-green-300 bg-green-50 text-green-700' : 
                              currentType === 'missing' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                              'border-red-300 bg-red-50 text-red-700'}
                          `}
                        >
                          <option value="none">✓ Conforme</option>
                          <option value="missing">⚠️ Quantité manquante</option>
                          <option value="damaged">🔴 Produit endommagé</option>
                        </select>
                      </div>
                    </div>
                    
                    {currentType !== 'none' && (
                      <div className="border-t border-[#E5E4DF] pt-3">
                        <label className="text-xs font-medium text-[#666663] mb-1 block">
                          {currentType === 'damaged' ? 'Description des dommages' : 'Notes sur l\'écart'}
                        </label>
                        <input
                          type="text"
                          placeholder="Détails du problème..."
                          value={discrepancyItems[item.sku]?.notes || ''}
                          onChange={(e) => updateDiscrepancyItem(item.sku, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-[#E5E4DF] rounded-lg text-sm text-[#191919] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] outline-none"
                        />
                      </div>
                    )}
                    
                    {/* Indicateur visuel */}
                    {currentType !== 'none' && (
                      <div className={`mt-3 p-2 rounded text-xs ${
                        currentType === 'missing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {currentType === 'missing' && `⚠️ Écart: ${item.quantity - parseInt(currentReceived || 0)} unités manquantes`}
                        {currentType === 'damaged' && `🔴 ${currentReceived} unités endommagées ne seront pas ajoutées au stock`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#666663] shrink-0 mt-0.5" />
                <div className="text-sm text-[#666663]">
                  <strong className="text-[#191919]">Important:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Les produits "Conformes" seront ajoutés au stock</li>
                    <li>Les produits "Endommagés" ne seront PAS ajoutés au stock</li>
                    <li>Un email de réclamation sera généré automatiquement si nécessaire</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
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

      {/* NOUVEAU: Modal Unifié de Réconciliation (Écarts + Endommagés) */}
      <Modal
        isOpen={unifiedReconciliationModalOpen && reconciliationOrder}
        onClose={() => setUnifiedReconciliationModalOpen(false)}
        title={`Réconciliation complète - ${reconciliationOrder?.id}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setUnifiedReconciliationModalOpen(false);
                setReconciliationModalOpen(true);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              icon={Check}
              onClick={submitUnifiedReconciliation}
            >
              Valider la réconciliation
            </Button>
          </div>
        }
      >
        {reconciliationOrder && (
          <>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">
                📋 Saisissez pour chaque produit :
              </p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4">
                <li>• <strong>Quantité reçue</strong> : nombre total d'unités livrées</li>
                <li>• <strong>Quantité endommagée</strong> : nombre d'unités abîmées parmi celles reçues</li>
                <li>• La <strong>quantité validée</strong> sera calculée automatiquement (Reçue - Endommagée)</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              {reconciliationOrder.items.map((item, idx) => {
                const product = products.find(p => p.sku === item.sku);
                const data = unifiedReconciliationItems[item.sku] || { 
                  ordered: item.quantity, 
                  received: item.quantity, 
                  damaged: 0 
                };
                const validated = parseInt(data.received, 10) - parseInt(data.damaged, 10);
                const discrepancy = parseInt(data.ordered, 10) - parseInt(data.received, 10);
                
                return (
                  <div key={idx} className="border border-[#E5E4DF] rounded-lg p-4 bg-[#FAFAF7]">
                    <div className="mb-3">
                      <span className="font-medium text-[#191919]">{product?.name || item.sku}</span>
                      <span className="text-xs text-[#666663] ml-2">({item.sku})</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Quantité commandée */}
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">📦 Commandé</label>
                        <input 
                          type="number" 
                          value={data.ordered}
                          disabled
                          className="w-full px-3 py-2 border border-[#E5E4DF] rounded-lg bg-white text-[#666663] text-center font-medium"
                        />
                      </div>
                      
                      {/* Quantité reçue */}
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">📥 Reçu</label>
                        <input 
                          type="number" 
                          min="0"
                          value={data.received}
                          onChange={(e) => setUnifiedReconciliationItems({
                            ...unifiedReconciliationItems,
                            [item.sku]: {
                              ...data,
                              received: Math.max(0, parseInt(e.target.value) || 0)
                            }
                          })}
                          className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-[#191919] text-center font-medium focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      
                      {/* Quantité endommagée */}
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">⚠️ Endommagé</label>
                        <input 
                          type="number" 
                          min="0"
                          max={data.received}
                          value={data.damaged}
                          onChange={(e) => setUnifiedReconciliationItems({
                            ...unifiedReconciliationItems,
                            [item.sku]: {
                              ...data,
                              damaged: Math.min(Math.max(0, parseInt(e.target.value) || 0), parseInt(data.received, 10))
                            }
                          })}
                          className="w-full px-3 py-2 border-2 border-[#EF1C43] rounded-lg bg-white text-[#191919] text-center font-medium focus:outline-none focus:ring-2 focus:ring-[#EF1C43]"
                        />
                      </div>
                      
                      {/* Quantité validée (calculée) */}
                      <div>
                        <label className="text-xs text-[#666663] block mb-1">✅ Validé</label>
                        <div className={`w-full px-3 py-2 rounded-lg text-center font-bold ${
                          validated >= data.ordered 
                            ? 'bg-green-50 text-green-600 border border-green-200' 
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {validated}
                        </div>
                      </div>
                    </div>
                    
                    {/* Résumé des écarts */}
                    <div className="mt-3 pt-3 border-t border-[#E5E4DF] grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded ${
                        discrepancy === 0 ? 'bg-green-50' : discrepancy > 0 ? 'bg-red-50' : 'bg-blue-50'
                      }`}>
                        <span className="text-[#666663]">Écart de quantité: </span>
                        <span className={`font-bold ${
                          discrepancy === 0 ? 'text-green-600' : discrepancy > 0 ? 'text-[#EF1C43]' : 'text-blue-600'
                        }`}>
                          {discrepancy > 0 ? `-${discrepancy}` : discrepancy < 0 ? `+${Math.abs(discrepancy)}` : '0'} unités
                        </span>
                      </div>
                      <div className="p-2 rounded bg-orange-50">
                        <span className="text-[#666663]">Perte (endommagé): </span>
                        <span className="font-bold text-orange-600">
                          {data.damaged} unités
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4">
              <label className="text-sm font-medium text-[#191919] block mb-2">📝 Notes / Commentaires (optionnel)</label>
              <textarea
                value={reconciliationNotes}
                onChange={(e) => setReconciliationNotes(e.target.value)}
                rows={3}
                placeholder="Ajoutez des notes sur les écarts ou les dommages constatés..."
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
    </>
  );
};

export default StockEasy;
