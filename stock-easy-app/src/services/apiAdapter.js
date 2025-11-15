import * as supabaseApi from './supabaseApiService';

// Fonction de conversion snake_case -> camelCase
const snakeToCamel = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (typeof obj !== 'object') return obj;

  const newObj = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    newObj[camelKey] = snakeToCamel(obj[key]);
  }
  return newObj;
};

// Adapter pour getAllData avec mapping des champs
const getAllData = async () => {
  const data = await supabaseApi.getAllData();
  
  // Conversion et mapping des champs
  const converted = snakeToCamel(data);


  // Mapper les champs spécifiques pour la compatibilité frontend
  if (converted.suppliers) {
    converted.suppliers = converted.suppliers.map(s => {
      const moqRaw =
        s.moq ??
        s.moqStandard ??
        s.defaultMoq ??
        s.minimumOrderQuantity ??
        s.minOrderQuantity ??
        null;

      const leadTimeRaw =
        s.leadTimeDays ??
        s.leadTime ??
        s.delai ??
        s.standardLeadTime ??
        null;

      const moq =
        moqRaw !== null && moqRaw !== undefined
          ? Number(moqRaw)
          : null;

      const leadTimeDays =
        leadTimeRaw !== null && leadTimeRaw !== undefined
          ? Number(leadTimeRaw)
          : null;

      return {
        ...s,
        name: s.nomFournisseur || s.name,
        email: s.email || s.contactEmail || s.contact_email || s.emailPrincipal || s.primaryEmail || null,
        moq,
        moqStandard: s.moqStandard ?? moq,
        leadTimeDays,
      };
    });
  }
  
  // Mapper les commandes avec les données de réconciliation
  if (converted.orders) {
    converted.orders = converted.orders.map(o => ({
      ...o,
      missingQuantitiesBySku: o.missingQuantitiesBySku || {},
      damagedQuantitiesBySku: o.damagedQuantitiesBySku || {}
    }));
  }
  
  if (converted.products) {
    converted.products = converted.products.map(p => ({
      ...p,
      // Mapping des noms de champs snake_case -> camelCase
      name: p.nomProduit || p.name,
      stock: p.stockActuel !== undefined ? p.stockActuel : p.stock,
      supplier: p.fournisseur || p.supplier,
      leadTime: p.leadTimeDays !== undefined ? p.leadTimeDays : p.leadTime,
      
      // Ventes et métriques
      sales30d: p.ventes30j !== undefined ? p.ventes30j : (p.sales30d !== undefined ? p.sales30d : 0),
      salesPerDay: p.ventesJourAjustees !== undefined ? p.ventesJourAjustees : 
                   (p.salesPerDay !== undefined ? p.salesPerDay : 
                   (p.dailySales !== undefined ? p.dailySales : 0)),
      dailySales: p.ventesJourAjustees !== undefined ? p.ventesJourAjustees : 
                  (p.dailySales !== undefined ? p.dailySales : 0),
      adjustedSales: p.ventesJourAjustees !== undefined ? p.ventesJourAjustees : 
                     (p.adjustedSales !== undefined ? p.adjustedSales : 0),
      
      // Points de commande et stocks
      reorderPoint: p.pointCommande !== undefined ? p.pointCommande : 
                    (p.reorderPoint !== undefined ? p.reorderPoint : 0),
      minStock: p.pointCommande !== undefined ? p.pointCommande : 
                (p.minStock !== undefined ? p.minStock : 0),
      maxStock: p.stockMax !== undefined ? p.stockMax : 
                (p.maxStock !== undefined ? p.maxStock : null),
      securityStock: p.stockSecurite !== undefined ? p.stockSecurite : 
                     (p.securityStock !== undefined ? p.securityStock : 0),
      
      // Prix et marges
      buyPrice: p.prixAchat !== undefined ? p.prixAchat : 
                (p.buyPrice !== undefined ? p.buyPrice : 0),
      sellPrice: p.prixVente !== undefined ? p.prixVente : 
                 (p.sellPrice !== undefined ? p.sellPrice : 0),
      margin: p.marge !== undefined ? p.marge : 
              (p.margin !== undefined ? p.margin : 0),
      
      // Autres champs
      moq: p.moq !== undefined ? p.moq : 1,
      multiplier: p.multiplicateurPrevision !== undefined ? p.multiplicateurPrevision :
                  (p.multiplicateur !== undefined ? p.multiplicateur : 
                  (p.multiplier !== undefined ? p.multiplier : 1)),
      multiplicateurPrevision: p.multiplicateurPrevision !== undefined ? p.multiplicateurPrevision :
                                (p.multiplicateur_prevision !== undefined ? p.multiplicateur_prevision :
                                (p.multiplicateur !== undefined ? p.multiplicateur : null)),
      customSecurityStock: p.stockSecuritePersonnalise !== undefined ? p.stockSecuritePersonnalise : 
                          (p.customSecurityStock !== undefined ? p.customSecurityStock : null),
      
      // Quantité à commander (CRITIQUE pour le système de commandes)
      // ⚠️ NOM CORRECT: qte_a_commander (et NON quantite_a_commander)
      qtyToOrder: p.qteACommander !== undefined ? p.qteACommander :
                  (p.quantiteACommander !== undefined ? p.quantiteACommander :
                  (p.qtyToOrder !== undefined ? p.qtyToOrder : 0)),
      
      // Autonomie et dates
      daysOfStock: p.autonomieJours !== undefined ? p.autonomieJours :
                   (p.daysOfStock !== undefined ? p.daysOfStock : 0),
      stockoutDate: p.dateRuptureEstimee !== undefined ? p.dateRuptureEstimee :
                    (p.stockoutDate !== undefined ? p.stockoutDate : null),
      lastSaleDate: p.derniereVente !== undefined ? p.derniereVente :
                    (p.lastSaleDate !== undefined ? p.lastSaleDate : null),
      lastOrderDate: p.derniereCommande !== undefined ? p.derniereCommande :
                     (p.lastOrderDate !== undefined ? p.lastOrderDate : null),
      
      // Health status et health percentage (calculés par le backend)
      healthStatus: p.healthStatus !== undefined && p.healthStatus !== null ? p.healthStatus : 'healthy',
      healthPercentage: p.healthPercentage !== undefined && p.healthPercentage !== null ? p.healthPercentage : 100,
      
      // Risques et alertes
      stockoutRisk: p.risqueRupture !== undefined ? p.risqueRupture :
                    (p.stockoutRisk !== undefined ? p.stockoutRisk : 0),
      overstockRisk: p.risqueSurstock !== undefined ? p.risqueSurstock :
                     (p.overstockRisk !== undefined ? p.overstockRisk : 0),
      orderPriority: p.prioriteCommande !== undefined ? p.prioriteCommande :
                     (p.orderPriority !== undefined ? p.orderPriority : 5),
      alerts: p.notesAlertes !== undefined ? p.notesAlertes :
              (p.alerts !== undefined ? p.alerts : null),
      
      // Performance et catégorisation
      performanceScore: p.scorePerformance !== undefined ? p.scorePerformance :
                        (p.performanceScore !== undefined ? p.performanceScore : 50),
      abcCategory: p.categorieAbc !== undefined ? p.categorieAbc :
                   (p.abcCategory !== undefined ? p.abcCategory : 'B'),
      rotationRate: p.tauxRotation !== undefined ? p.tauxRotation :
                    (p.rotationRate !== undefined ? p.rotationRate : 0),
      
      // Tendances et variations
      salesTrend: p.tendanceVentes !== undefined ? p.tendanceVentes :
                  (p.salesTrend !== undefined ? p.salesTrend : 'stable'),
      salesVariation: p.variationVentesPct !== undefined ? p.variationVentesPct :
                      (p.salesVariation !== undefined ? p.salesVariation : 0),
      seasonalityCoefficient: p.coefficientSaisonnalite !== undefined ? p.coefficientSaisonnalite :
                              (p.seasonalityCoefficient !== undefined ? p.seasonalityCoefficient : 1.0),
      
      // Logistique et transit
      qtyInTransit: p.qteEnTransit !== undefined ? p.qteEnTransit :
                    (p.qtyInTransit !== undefined ? p.qtyInTransit : 0),
      ordersInProgress: p.commandesEnCours !== undefined ? p.commandesEnCours :
                        (p.ordersInProgress !== undefined ? p.ordersInProgress : 0),
      projectedStock: p.stockProjecte !== undefined ? p.stockProjecte :
                      (p.projectedStock !== undefined ? p.projectedStock : 0),
      
      // Coûts
      storageCostPerUnit: p.coutStockageUnitaire !== undefined ? p.coutStockageUnitaire :
                          (p.storageCostPerUnit !== undefined ? p.storageCostPerUnit : 0.01),
      totalStorageCost: p.coutStockageTotal !== undefined ? p.coutStockageTotal :
                        (p.totalStorageCost !== undefined ? p.totalStorageCost : 0),
      
      // Autres métriques calculées
      status: p.statut !== undefined ? p.statut : (p.status !== undefined ? p.status : 'unknown'),
      investment: p.investissement !== undefined ? p.investissement : 
                  (p.investment !== undefined ? p.investment : 0),
      potentialRevenue: p.revenuPotentiel !== undefined ? p.revenuPotentiel :
                       (p.revenupotentiel !== undefined ? p.revenupotentiel :
                       (p.potentialRevenue !== undefined ? p.potentialRevenue : 0)),
      grossMargin: p.margeBrute !== undefined ? p.margeBrute :
                   (p.grossMargin !== undefined ? p.grossMargin : 0),
      supplierReliability: p.fiabiliteFournisseur !== undefined ? p.fiabiliteFournisseur :
                           (p.supplierReliability !== undefined ? p.supplierReliability : 80)
    }));
  }
  
  return converted;
};

const getSalesHistoryAdapter = async ({ sku, startDate, endDate } = {}) => {
  const data = await supabaseApi.getSalesHistory({ sku, startDate, endDate });
  return snakeToCamel(data || []);
};

// API adapter unifié
const api = {
  getAllData,
  getSalesHistory: getSalesHistoryAdapter,
  createOrder: supabaseApi.createOrder,
  updateOrderStatus: supabaseApi.updateOrderStatus,
  processOrderReconciliation: supabaseApi.processOrderReconciliation,
  updateStock: supabaseApi.updateStock,
  updateProduct: supabaseApi.updateProduct,
  createSupplier: supabaseApi.createSupplier,
  updateSupplier: supabaseApi.updateSupplier,
  deleteSupplier: supabaseApi.deleteSupplier,
  createWarehouse: supabaseApi.createWarehouse,
  updateWarehouse: supabaseApi.updateWarehouse,
  deleteWarehouse: supabaseApi.deleteWarehouse,
  saveKPISnapshot: supabaseApi.saveKPISnapshot,
  updateParameter: supabaseApi.updateParameter,
  confirmOrderReconciliation: supabaseApi.confirmOrderReconciliation,
  assignSupplierToProduct: supabaseApi.assignSupplierToProduct,
  removeSupplierFromProduct: supabaseApi.removeSupplierFromProduct,
  recalculateAllInvestments: supabaseApi.recalculateAllInvestments,
  updateProductMultiplier: async (sku, multiplier) => {
    const { supabase } = await import('../lib/supabaseClient');
    try {
      const { data, error } = await supabase.rpc('update_product_multiplier', {
        p_sku: sku,
        p_multiplicateur_prevision: multiplier
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erreur mise à jour multiplicateur:', error);
      return { success: false, error: error.message };
    }
  },
  resetProductMultiplier: async (sku) => {
    const { supabase } = await import('../lib/supabaseClient');
    try {
      const { data, error } = await supabase.rpc('reset_product_multiplier_to_default', {
        p_sku: sku
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erreur réinitialisation multiplicateur:', error);
      return { success: false, error: error.message };
    }
  },
};

// Exports nommés pour compatibilité
export const {
  getSalesHistory,
  createOrder,
  updateOrderStatus,
  processOrderReconciliation,
  updateStock,
  updateProduct,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  saveKPISnapshot,
  updateParameter,
  confirmOrderReconciliation,
  assignSupplierToProduct,
  removeSupplierFromProduct,
  recalculateAllInvestments,
  updateProductMultiplier,
  resetProductMultiplier,
} = api;

export { getAllData };
export default api;

