import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Search, Filter, RefreshCw, CheckSquare, Square, Settings2 } from 'lucide-react';
import { ProductMultiplierEditor } from '../product/ProductMultiplierEditor';
import { InfoTooltip } from '../ui/InfoTooltip/InfoTooltip';
import { toast } from 'sonner';
import api from '../../services/apiAdapter';
import { multiplierOptimizer } from '../../services/ml/multiplierOptimizer';
import { collectSalesHistory } from '../../services/ml/dataCollector';
import { ImagePreview } from '../ui/ImagePreview';
import { invalidateCache } from '../../services/cacheService';

/**
 * Composant pour gérer les multiplicateurs de prévision de tous les produits
 * Permet de modifier manuellement ou via ML
 */
export function GestionMultiplicateurs({ products, loadData, multiplicateurDefaut = 1.2 }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'custom', 'default'
  const [editingProduct, setEditingProduct] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'multiplier', 'sales'
  const [selectedSkus, setSelectedSkus] = useState(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkMultiplier, setBulkMultiplier] = useState(1.2);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isAnalyzingML, setIsAnalyzingML] = useState(false);
  const [mlSuggestions, setMlSuggestions] = useState(null);
  const [showMLModal, setShowMLModal] = useState(false);

  // Filtrer et trier les produits
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name || p.nom_produit || '').toLowerCase().includes(term) ||
        (p.sku || '').toLowerCase().includes(term)
      );
    }

    // Filtre par type de multiplicateur
    const defaultMultiplier = Number(multiplicateurDefaut) || 1.2;
    
    if (filterBy === 'custom') {
      // Produits avec multiplicateur personnalisé (différent du défaut)
      filtered = filtered.filter(p => {
        const multiplier = p.multiplicateurPrevision || p.multiplier || defaultMultiplier;
        return Math.abs(multiplier - defaultMultiplier) > 0.01; // Tolérance pour les arrondis
      });
    } else if (filterBy === 'default') {
      // Produits avec multiplicateur par défaut
      filtered = filtered.filter(p => {
        const multiplier = p.multiplicateurPrevision || p.multiplier || defaultMultiplier;
        return Math.abs(multiplier - defaultMultiplier) <= 0.01;
      });
    }

    // Trier
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'multiplier':
          const multA = a.multiplicateurPrevision || a.multiplier || 1.2;
          const multB = b.multiplicateurPrevision || b.multiplier || 1.2;
          return multB - multA;
        case 'sales':
          const salesA = a.salesPerDay || a.adjustedSales || 0;
          const salesB = b.salesPerDay || b.adjustedSales || 0;
          return salesB - salesA;
        case 'name':
        default:
          const nameA = (a.name || a.nom_produit || '').toLowerCase();
          const nameB = (b.name || b.nom_produit || '').toLowerCase();
          return nameA.localeCompare(nameB);
      }
    });

    return filtered;
  }, [products, searchTerm, filterBy, sortBy, multiplicateurDefaut]);

  // Gestion de la sélection
  const toggleSelection = (sku) => {
    setSelectedSkus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sku)) {
        newSet.delete(sku);
      } else {
        newSet.add(sku);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedSkus(new Set(filteredProducts.map(p => p.sku)));
  };

  const deselectAll = () => {
    setSelectedSkus(new Set());
  };

  const selectByFilter = () => {
    setSelectedSkus(new Set(filteredProducts.map(p => p.sku)));
  };

  // Actions en masse
  const handleBulkUpdate = async () => {
    if (selectedSkus.size === 0) {
      toast.error(t('settings.multipliers.messages.selectProduct'));
      return;
    }

    if (bulkMultiplier < 0.1 || bulkMultiplier > 10) {
      toast.error(t('settings.multipliers.messages.multiplierRange'));
      return;
    }

    setIsBulkUpdating(true);
    try {
      const updates = Array.from(selectedSkus).map(sku => ({
        sku,
        multiplier: bulkMultiplier
      }));

      const { supabase } = await import('../../lib/supabaseClient');
      const { data, error } = await supabase.rpc('bulk_update_product_multipliers', {
        p_updates: updates
      });

      if (error) throw error;

      if (data.success) {
        // ✅ Invalider le cache pour refléter les changements immédiatement
        invalidateCache(['products', 'allData']);
        console.log('🔄 Cache invalidé après mise à jour multiplicateurs en masse');
        
        toast.success(t('settings.multipliers.messages.updateSuccess', { count: data.updated_count }));
        setSelectedSkus(new Set());
        setShowBulkActions(false);
        await loadData();
      } else {
        toast.error(data.message || t('settings.multipliers.messages.updateError'));
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour en masse:', error);
      toast.error(t('settings.multipliers.messages.updateError'));
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkReset = async () => {
    if (selectedSkus.size === 0) {
      toast.error(t('settings.multipliers.messages.selectProduct'));
      return;
    }

    setIsBulkUpdating(true);
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { data, error } = await supabase.rpc('bulk_reset_product_multipliers', {
        p_skus: Array.from(selectedSkus)
      });

      if (error) throw error;

      if (data.success) {
        // ✅ Invalider le cache pour refléter les changements immédiatement
        invalidateCache(['products', 'allData']);
        console.log('🔄 Cache invalidé après réinitialisation multiplicateurs en masse');
        
        toast.success(t('settings.multipliers.messages.resetSuccess', { count: data.updated_count }));
        setSelectedSkus(new Set());
        setShowBulkActions(false);
        await loadData();
      } else {
        toast.error(data.message || t('settings.multipliers.messages.resetError'));
      }
    } catch (error) {
      console.error('❌ Erreur réinitialisation en masse:', error);
      toast.error(t('settings.multipliers.messages.resetError'));
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Analyse ML en masse
  const handleBulkMLAnalyze = async () => {
    if (selectedSkus.size === 0) {
      toast.error(t('settings.multipliers.messages.selectProduct'));
      return;
    }

    setIsAnalyzingML(true);
    const startTime = performance.now();
    
    try {
      const selectedProducts = filteredProducts.filter(p => selectedSkus.has(p.sku));
      
      console.log(`🤖 Analyse ML en cours pour ${selectedProducts.length} produit(s)...`);
      toast.info(t('settings.multipliers.messages.mlAnalyzing', { count: selectedProducts.length }), {
        duration: 3000
      });

      // OPTIMISATION: Pré-charger l'historique pour tous les produits en une fois
      let salesHistoryBySku = {};
      try {
        console.log('📊 Collecte de l\'historique des ventes en batch...');
        const allSalesHistory = await collectSalesHistory(selectedProducts, { days: 180 });
        
        // Grouper par SKU pour un accès rapide
        allSalesHistory.forEach(sale => {
          const sku = sale.sku;
          if (!salesHistoryBySku[sku]) {
            salesHistoryBySku[sku] = [];
          }
          salesHistoryBySku[sku].push(sale);
        });
        console.log(`✅ ${allSalesHistory.length} enregistrements d'historique collectés pour ${Object.keys(salesHistoryBySku).length} produits`);
      } catch (error) {
        console.warn('⚠️ Erreur collecte historique batch, utilisation individuelle:', error);
        // Fallback: chaque produit récupérera son historique individuellement
      }

      // OPTIMISATION: Traitement en parallèle avec Promise.all au lieu de boucle séquentielle
      const analysisPromises = selectedProducts.map(async (product) => {
        try {
          // Utiliser l'historique pré-chargé si disponible
          const productHistory = salesHistoryBySku[product.sku] || null;
          const suggestion = await multiplierOptimizer.suggestOptimalMultiplier(product, productHistory);
          return {
            success: true,
            data: {
              sku: product.sku,
              name: product.name || product.nom_produit || 'Sans nom',
              currentMultiplier: product.multiplicateurPrevision || product.multiplier || multiplicateurDefaut,
              suggestedMultiplier: suggestion.suggestedMultiplier,
              confidence: suggestion.confidence,
              reasoning: suggestion.reasoning,
              factors: suggestion.factors,
              performance: suggestion.performance
            }
          };
        } catch (error) {
          console.error(`❌ Erreur analyse ML pour ${product.sku}:`, error);
          return {
            success: false,
            sku: product.sku,
            error: error.message || 'Erreur inconnue'
          };
        }
      });

      // Attendre toutes les analyses en parallèle
      const results = await Promise.all(analysisPromises);
      
      // Séparer les succès et erreurs
      const suggestions = results
        .filter(r => r.success)
        .map(r => r.data);
      const errors = results.filter(r => !r.success);
      const successCount = suggestions.length;
      const errorCount = errors.length;

      // Performance logging
      const duration = performance.now() - startTime;
      const avgTimePerProduct = successCount > 0 ? duration / successCount : 0;
      
      console.log(`✅ Analyse ML terminée: ${successCount} succès, ${errorCount} erreurs`);
      console.log(`⚡ Temps total: ${duration.toFixed(0)}ms (${avgTimePerProduct.toFixed(0)}ms/produit)`);
      
      // Afficher un message de performance
      if (duration < 2000) {
        console.log('✅ Performance EXCELLENTE');
      } else if (duration < 5000) {
        console.log('🟡 Performance ACCEPTABLE');
      } else {
        console.log('🔴 Performance LENTE - Vérifier les optimisations');
      }

      if (suggestions.length > 0) {
        setMlSuggestions(suggestions);
        setShowMLModal(true);
        toast.success(t('settings.multipliers.messages.mlComplete', { success: successCount, errors: errorCount }) + ` (${duration.toFixed(0)}ms)`);
      } else {
        toast.error(t('settings.multipliers.messages.mlNoSuggestions'));
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ Erreur analyse ML en masse (${duration.toFixed(0)}ms):`, error);
      toast.error(t('settings.multipliers.messages.mlError'));
    } finally {
      setIsAnalyzingML(false);
    }
  };

  // Appliquer toutes les suggestions ML
  const handleApplyAllMLSuggestions = async () => {
    if (!mlSuggestions || mlSuggestions.length === 0) return;

    setIsBulkUpdating(true);
    try {
      const updates = mlSuggestions.map(s => ({
        sku: s.sku,
        multiplier: s.suggestedMultiplier
      }));

      const { supabase } = await import('../../lib/supabaseClient');
      
      // Essayer d'utiliser la fonction bulk (migration 028)
      try {
        const { data, error } = await supabase.rpc('bulk_update_product_multipliers', {
          p_updates: updates
        });

        if (error) {
          // Si la fonction n'existe pas, utiliser le fallback
          if (error.message?.includes('does not exist') || error.message?.includes('Could not find the function')) {
            console.warn('⚠️ Fonction bulk_update_product_multipliers non trouvée, utilisation de la méthode individuelle');
            throw new Error('FUNCTION_NOT_FOUND');
          }
          throw error;
        }

        if (data && data.success) {
          // ✅ Invalider le cache pour refléter les changements immédiatement
          invalidateCache(['products', 'allData']);
          console.log('🔄 Cache invalidé après application suggestions ML');
          
          toast.success(t('settings.multipliers.messages.mlApplied', { count: data.updated_count }));
          setMlSuggestions(null);
          setShowMLModal(false);
          setSelectedSkus(new Set());
          setShowBulkActions(false);
          await loadData();
          return;
        } else {
          const errorMsg = data?.message || data?.error || t('settings.multipliers.messages.updateError');
          throw new Error(errorMsg);
        }
      } catch (bulkError) {
        // Fallback: utiliser la méthode individuelle si la fonction bulk n'existe pas
        if (bulkError.message === 'FUNCTION_NOT_FOUND' || bulkError.message?.includes('does not exist')) {
          console.warn('⚠️ Utilisation de la méthode individuelle (migration 028 non appliquée)');
          
          toast.info('Application en cours (méthode individuelle)...', { duration: 2000 });
          
          // Appliquer les suggestions une par une
          let successCount = 0;
          let errorCount = 0;
          const errors = [];
          
          for (const suggestion of mlSuggestions) {
            try {
              const result = await api.updateProductMultiplier(suggestion.sku, suggestion.suggestedMultiplier);
              if (result.success) {
                successCount++;
              } else {
                errorCount++;
                errors.push(`${suggestion.sku}: ${result.error || 'Erreur inconnue'}`);
                console.error(`❌ Erreur pour ${suggestion.sku}:`, result.error);
              }
            } catch (error) {
              errorCount++;
              errors.push(`${suggestion.sku}: ${error.message || 'Erreur inconnue'}`);
              console.error(`❌ Erreur pour ${suggestion.sku}:`, error);
            }
          }

          if (successCount > 0) {
            // ✅ Invalider le cache pour refléter les changements immédiatement
            invalidateCache(['products', 'allData']);
            console.log('🔄 Cache invalidé après application ML individuelle');
            
            toast.success(`${successCount} multiplicateur(s) ML appliqué(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`, {
              duration: 5000
            });
            if (errorCount > 0) {
              console.error('❌ Erreurs détaillées:', errors);
            }
            setMlSuggestions(null);
            setShowMLModal(false);
            setSelectedSkus(new Set());
            setShowBulkActions(false);
            await loadData();
          } else {
            toast.error(`Aucun multiplicateur n'a pu être appliqué. ${errorCount > 0 ? `${errorCount} erreur(s)` : ''}`, {
              duration: 6000
            });
            console.error('❌ Toutes les applications ont échoué:', errors);
          }
          return;
        }
        
        // Si c'est une autre erreur, la propager
        throw bulkError;
      }
    } catch (error) {
      console.error('❌ Erreur application ML en masse:', error);
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
      toast.error(`Erreur lors de l'application des suggestions ML: ${errorMessage}`, {
        duration: 6000
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Afficher les actions en masse si des produits sont sélectionnés
  useEffect(() => {
    setShowBulkActions(selectedSkus.size > 0);
  }, [selectedSkus.size]);

  // Statistiques
  const stats = useMemo(() => {
    const defaultMultiplier = Number(multiplicateurDefaut) || 1.2;
    const total = products.length;
    const withCustom = products.filter(p => {
      const multiplier = p.multiplicateurPrevision || p.multiplier || defaultMultiplier;
      return Math.abs(multiplier - defaultMultiplier) > 0.01;
    }).length;
    const avgMultiplier = products.reduce((sum, p) => {
      return sum + (p.multiplicateurPrevision || p.multiplier || defaultMultiplier);
    }, 0) / total;

    return {
      total,
      withCustom,
      withDefault: total - withCustom,
      avgMultiplier: avgMultiplier.toFixed(2),
      defaultMultiplier: defaultMultiplier.toFixed(1)
    };
  }, [products, multiplicateurDefaut]);

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-[#8B5CF6]" />
            <h2 className="text-xl font-bold text-[#191919]">
              {t('settings.multipliers.title')}
            </h2>
          </div>
        </div>

        <p className="text-sm text-[#666663] mb-4">
          {t('settings.multipliers.subtitle')}
        </p>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-[#FAFAF7] rounded-lg p-3">
            <p className="text-xs text-[#666663]">{t('settings.multipliers.stats.totalProducts')}</p>
            <p className="text-2xl font-bold text-[#191919]">{stats.total}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-[#666663]">{t('settings.multipliers.stats.customMultipliers')}</p>
            <p className="text-2xl font-bold text-purple-600">{stats.withCustom}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-[#666663]">{t('settings.multipliers.stats.default')} ({stats.defaultMultiplier})</p>
            <p className="text-2xl font-bold text-blue-600">{stats.withDefault}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-[#666663]">{t('settings.multipliers.stats.average')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.avgMultiplier}</p>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666663]" />
            <input
              type="text"
              placeholder={t('settings.multipliers.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E4DF] rounded-lg focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>

          {/* Filtre */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#666663]" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-4 py-2 border border-[#E5E4DF] rounded-lg focus:border-[#8B5CF6] focus:outline-none"
            >
              <option value="all">{t('settings.multipliers.filter.all')}</option>
              <option value="custom">{t('settings.multipliers.filter.custom')}</option>
              <option value="default">{t('settings.multipliers.filter.default')}</option>
            </select>
          </div>

          {/* Tri */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-[#E5E4DF] rounded-lg focus:border-[#8B5CF6] focus:outline-none"
            >
              <option value="name">{t('settings.multipliers.sort.name')}</option>
              <option value="multiplier">{t('settings.multipliers.sort.multiplier')}</option>
              <option value="sales">{t('settings.multipliers.sort.sales')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Barre d'actions en masse */}
      {showBulkActions && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Settings2 className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-900">
                {t('settings.multipliers.bulk.selected', { count: selectedSkus.size })}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm text-purple-900 font-medium">{t('settings.multipliers.bulk.multiplierLabel')}</label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={bulkMultiplier}
                  onChange={(e) => setBulkMultiplier(parseFloat(e.target.value) || 1.2)}
                  className="w-20 px-2 py-1 border border-purple-300 rounded text-center font-semibold"
                  disabled={isBulkUpdating}
                />
              </div>
              <button
                onClick={handleBulkUpdate}
                disabled={isBulkUpdating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkUpdating ? t('settings.multipliers.bulk.updating') : t('settings.multipliers.bulk.apply')}
              </button>
              <button
                onClick={handleBulkMLAnalyze}
                disabled={isBulkUpdating || isAnalyzingML}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAnalyzingML ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t('settings.multipliers.bulk.analyzingML')}
                  </>
                ) : (
                  <>
                    {t('settings.multipliers.bulk.analyzeML')}
                  </>
                )}
              </button>
              <button
                onClick={handleBulkReset}
                disabled={isBulkUpdating || isAnalyzingML}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkUpdating ? t('settings.multipliers.bulk.resetting') : t('settings.multipliers.bulk.resetToDefault')}
              </button>
              <button
                onClick={deselectAll}
                disabled={isBulkUpdating || isAnalyzingML}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {t('settings.multipliers.bulk.deselectAll')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des produits */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
        {/* En-tête avec sélection rapide */}
        <div className="px-4 py-3 bg-[#FAFAF7] border-b border-[#E5E4DF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#666663] hover:text-[#191919] hover:bg-white rounded-lg transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              {t('settings.multipliers.table.selectAll')}
            </button>
            <button
              onClick={selectByFilter}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#666663] hover:text-[#191919] hover:bg-white rounded-lg transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              {t('settings.multipliers.table.selectFiltered', { count: filteredProducts.length })}
            </button>
            {selectedSkus.size > 0 && (
              <span className="text-sm text-purple-600 font-semibold">
                {selectedSkus.size} {t('settings.multipliers.table.selected')}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FAFAF7] border-b border-[#E5E4DF]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase w-12">
                  <button
                    onClick={() => {
                      const allSelected = filteredProducts.every(p => selectedSkus.has(p.sku));
                      if (allSelected) {
                        deselectAll();
                      } else {
                        selectAll();
                      }
                    }}
                    className="flex items-center"
                  >
                    {filteredProducts.length > 0 && filteredProducts.every(p => selectedSkus.has(p.sku)) ? (
                      <CheckSquare className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Square className="w-5 h-5 text-[#666663]" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase">
                  {t('settings.multipliers.table.product')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase">
                  {t('settings.multipliers.table.sku')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase">
                  {t('settings.multipliers.table.multiplier')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase">
                  {t('settings.multipliers.table.salesPerDay')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666663] uppercase">
                  {t('settings.multipliers.table.status')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#666663] uppercase">
                  {t('settings.multipliers.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E4DF]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-[#666663]">
                    {t('settings.multipliers.table.noResults')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const defaultMultiplier = Number(multiplicateurDefaut) || 1.2;
                  const multiplier = product.multiplicateurPrevision || product.multiplier || defaultMultiplier;
                  const isCustom = Math.abs(multiplier - defaultMultiplier) > 0.01;
                  const salesPerDay = product.salesPerDay || product.adjustedSales || 0;

                  return (
                    <tr key={product.sku} className={`hover:bg-[#FAFAF7] transition-colors ${selectedSkus.has(product.sku) ? 'bg-purple-50' : ''}`}>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelection(product.sku)}
                          className="flex items-center"
                        >
                          {selectedSkus.has(product.sku) ? (
                            <CheckSquare className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Square className="w-5 h-5 text-[#666663]" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <ImagePreview
                              src={product.imageUrl}
                              alt={product.name || product.nom_produit || t('settings.multipliers.table.noProduct')}
                              thumbClassName="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-[#E5E4DF]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-[#E5E4DF] flex items-center justify-center text-xs text-[#666663] flex-shrink-0">
                              {(product.name || product.nom_produit || '?').charAt(0)}
                            </div>
                          )}
                          <div className="font-medium text-[#191919]">
                            {product.name || product.nom_produit || t('settings.multipliers.table.noProduct')}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-[#666663] bg-[#FAFAF7] px-2 py-1 rounded">
                          {product.sku}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            multiplier > 1.5 ? 'text-purple-600' :
                            multiplier < 0.8 ? 'text-blue-600' :
                            'text-[#191919]'
                          }`}>
                            {multiplier.toFixed(1)}
                          </span>
                          {isCustom && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {t('settings.multipliers.table.custom')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#666663]">
                          {salesPerDay.toFixed(1)} {t('settings.multipliers.table.unitsPerDay')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          isCustom 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isCustom ? t('settings.multipliers.table.custom') : t('settings.multipliers.table.default')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="px-3 py-1.5 bg-[#8B5CF6] text-white rounded-lg text-sm font-semibold hover:bg-[#7C3AED] transition-colors"
                        >
                          {t('settings.multipliers.table.modify')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        {filteredProducts.length > 0 && (
          <div className="px-4 py-3 bg-[#FAFAF7] border-t border-[#E5E4DF] text-sm text-[#666663]">
            {t('settings.multipliers.table.showing', { count: filteredProducts.length })}
          </div>
        )}
      </div>

      {/* Modale des suggestions ML en masse */}
      {showMLModal && mlSuggestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#191919] flex items-center gap-2">
                  {t('settings.multipliers.ml.suggestionsTitle', { count: mlSuggestions.length })}
                </h3>
                <button
                  onClick={() => {
                    setShowMLModal(false);
                    setMlSuggestions(null);
                  }}
                  className="text-[#666663] hover:text-[#191919] transition-colors"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-[#666663] mb-4">
                {t('settings.multipliers.ml.suggestionsSubtitle')}
              </p>

              {/* Liste des suggestions */}
              <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto">
                {mlSuggestions.map((suggestion, idx) => (
                  <div key={suggestion.sku} className="border border-[#E5E4DF] rounded-lg p-4 bg-[#FAFAF7]">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-[#191919]">{suggestion.name}</div>
                        <code className="text-xs text-[#666663]">{suggestion.sku}</code>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#666663]">{t('settings.multipliers.ml.current')}: <span className="font-semibold">{suggestion.currentMultiplier.toFixed(1)}</span></div>
                        <div className="text-lg font-bold text-purple-600">→ {suggestion.suggestedMultiplier.toFixed(1)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          suggestion.confidence >= 70 ? 'bg-green-100 text-green-700' :
                          suggestion.confidence >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {suggestion.confidence}% {t('settings.multipliers.ml.confidence')}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#666663] mt-2">{suggestion.reasoning}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E4DF]">
                <button
                  onClick={() => {
                    setShowMLModal(false);
                    setMlSuggestions(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  {t('settings.multipliers.ml.cancel')}
                </button>
                <button
                  onClick={handleApplyAllMLSuggestions}
                  disabled={isBulkUpdating}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBulkUpdating ? t('settings.multipliers.ml.applying') : t('settings.multipliers.ml.applyAll', { count: mlSuggestions.length })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'édition */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
            <ProductMultiplierEditor
              product={editingProduct}
              onUpdate={() => {
                loadData();
                setEditingProduct(null);
              }}
              onClose={() => setEditingProduct(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

