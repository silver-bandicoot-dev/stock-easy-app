/**
 * Génère des insights actionnables basés sur les KPIs analytics
 * @param {object} analyticsData - Données analytics du hook useAnalytics
 * @param {Array} products - Liste des produits enrichis
 * @param {Array} orders - Liste des commandes
 * @param {function} setActiveTab - Fonction pour changer d'onglet
 * @returns {Array} Tableau d'insights avec messages et actions
 */
export function generateInsights(analyticsData, products, orders, setActiveTab, options = {}) {
  const formatCurrencyValue = options.formatCurrency || ((value) => `${value}€`);
  const insights = [];
  
  console.log('💡 Génération des insights avec:', {
    skuAvailability: analyticsData.skuAvailability?.rawValue,
    salesLost: analyticsData.salesLost?.rawValue,
    overstockCost: analyticsData.overstockCost?.rawValue,
    inventoryValuation: analyticsData.inventoryValuation?.rawValue
  });

  // ========================================
  // INSIGHT 1: Disponibilité faible
  // Seuil: < 90%
  // ========================================
  if (analyticsData.skuAvailability?.rawValue < 90) {
    const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
    const availability = Math.round(analyticsData.skuAvailability.rawValue);
    
    insights.push({
      id: 'low-availability',
      type: 'warning',
      kpi: 'skuAvailability',
      message: `${outOfStockProducts.length} produit(s) sont en rupture de stock, réduisant votre disponibilité à ${availability}%.`,
      actionLabel: 'Voir les produits',
      action: () => {
        console.log('📍 Navigation vers produits en rupture');
        setActiveTab('products');
        // TODO: Ajouter un filtre pour afficher uniquement les produits en rupture
      }
    });
  }

  // ========================================
  // INSIGHT 2: Ventes perdues importantes
  // Seuil: > 1000€
  // ========================================
  if (analyticsData.salesLost?.rawValue > 1000) {
    const toOrderProducts = products.filter(p => p.qtyToOrder > 0);
    const salesLostAmount = Math.round(analyticsData.salesLost.rawValue);
    
    insights.push({
      id: 'high-sales-lost',
      type: 'danger',
      kpi: 'salesLost',
      message: `Vous perdez ${formatCurrencyValue(salesLostAmount)} de CA à cause des ruptures. ${toOrderProducts.length} produit(s) doivent être commandés maintenant.`,
      actionLabel: 'Commander maintenant',
      action: () => {
        console.log('📍 Navigation vers page de commandes');
        setActiveTab('order');
        // Navigation vers l'onglet de commandes
      }
    });
  }

  // ========================================
  // INSIGHT 3: Ventes perdues modérées
  // Seuil: 500€ - 1000€
  // ========================================
  if (analyticsData.salesLost?.rawValue >= 500 && analyticsData.salesLost?.rawValue <= 1000) {
    const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;
    const salesLostAmount = Math.round(analyticsData.salesLost.rawValue);
    
    insights.push({
      id: 'moderate-sales-lost',
      type: 'warning',
      kpi: 'salesLost',
      message: `${formatCurrencyValue(salesLostAmount)} de ventes perdues détectées. ${outOfStockCount} SKU(s) nécessitent une attention immédiate.`,
      actionLabel: 'Analyser',
      action: () => {
        console.log('📍 Navigation vers stock level');
        setActiveTab('stock-level');
      }
    });
  }

  // ========================================
  // INSIGHT 4: Surstock coûteux
  // Seuil: > 5000€
  // ========================================
  if (analyticsData.overstockCost?.rawValue > 5000) {
    const overstockedProducts = products.filter(p => p.isDeepOverstock === true);
    const overstockAmount = Math.round(analyticsData.overstockCost.rawValue);
    
    insights.push({
      id: 'high-overstock',
      type: 'warning',
      kpi: 'overstockCost',
      message: `${formatCurrencyValue(overstockAmount)} sont immobilisés dans ${overstockedProducts.length} produit(s) en surstock profond.`,
      actionLabel: 'Optimiser',
      action: () => {
        console.log('📍 Navigation vers stock level pour surstocks');
        setActiveTab('stock-level');
      }
    });
  }

  // ========================================
  // INSIGHT 5: Surstock modéré
  // Seuil: 2000€ - 5000€
  // ========================================
  if (analyticsData.overstockCost?.rawValue >= 2000 && analyticsData.overstockCost?.rawValue <= 5000) {
    const overstockAmount = Math.round(analyticsData.overstockCost.rawValue);
    
    insights.push({
      id: 'moderate-overstock',
      type: 'info',
      kpi: 'overstockCost',
      message: `${formatCurrencyValue(overstockAmount)} de surstock détectés. Envisagez des promotions pour libérer de la trésorerie.`,
      actionLabel: 'Voir détails',
      action: () => {
        console.log('📍 Navigation vers stock level');
        setActiveTab('stock-level');
      }
    });
  }

  // ========================================
  // INSIGHT 6: Tendance positive disponibilité
  // Seuil: Progression > 5%
  // ========================================
  if (analyticsData.skuAvailability?.trend === 'up' && analyticsData.skuAvailability?.changePercent > 5) {
    const progression = Math.round(analyticsData.skuAvailability.changePercent * 10) / 10;
    
    insights.push({
      id: 'positive-availability-trend',
      type: 'success',
      kpi: 'skuAvailability',
      message: `Excellente progression ! Votre disponibilité a augmenté de ${progression}% sur la période.`,
      actionLabel: null,
      action: null
    });
  }

  // ========================================
  // INSIGHT 7: Tendance négative disponibilité
  // Seuil: Baisse > 5%
  // ========================================
  if (analyticsData.skuAvailability?.trend === 'down' && Math.abs(analyticsData.skuAvailability?.changePercent) > 5) {
    const decline = Math.round(Math.abs(analyticsData.skuAvailability.changePercent) * 10) / 10;
    
    insights.push({
      id: 'negative-availability-trend',
      type: 'danger',
      kpi: 'skuAvailability',
      message: `⚠️ Alerte : Votre disponibilité a chuté de ${decline}% ! Action rapide requise.`,
      actionLabel: 'Agir maintenant',
      action: () => {
        console.log('📍 Navigation vers commandes');
        setActiveTab('order');
      }
    });
  }

  // ========================================
  // INSIGHT 8: Amélioration ventes perdues
  // Seuil: Réduction > 20%
  // ========================================
  if (analyticsData.salesLost?.trend === 'down' && Math.abs(analyticsData.salesLost?.changePercent) > 20) {
    const reduction = Math.round(Math.abs(analyticsData.salesLost.changePercent) * 10) / 10;
    
    insights.push({
      id: 'improving-sales-lost',
      type: 'success',
      kpi: 'salesLost',
      message: `Bravo ! Les ventes perdues ont diminué de ${reduction}%. Continuez sur cette lancée.`,
      actionLabel: null,
      action: null
    });
  }

  // ========================================
  // INSIGHT 9: Disponibilité optimale
  // Seuil: >= 95%
  // ========================================
  if (analyticsData.skuAvailability?.rawValue >= 95) {
    const availability = Math.round(analyticsData.skuAvailability.rawValue);
    
    insights.push({
      id: 'optimal-availability',
      type: 'success',
      kpi: 'skuAvailability',
      message: `🎉 Excellent ! Votre taux de disponibilité de ${availability}% est optimal.`,
      actionLabel: null,
      action: null
    });
  }

  // ========================================
  // INSIGHT 10: Inventory Valuation en hausse
  // Seuil: Augmentation > 10%
  // ========================================
  if (analyticsData.inventoryValuation?.trend === 'up' && analyticsData.inventoryValuation?.changePercent > 10) {
    const increase = Math.round(analyticsData.inventoryValuation.changePercent * 10) / 10;
    
    insights.push({
      id: 'inventory-growth',
      type: 'info',
      kpi: 'inventoryValuation',
      message: `Votre inventaire a augmenté de ${increase}% (${analyticsData.inventoryValuation.value}). Assurez-vous que cette croissance est intentionnelle et non due à des surstocks.`,
      actionLabel: 'Analyser les surstocks',
      action: () => {
        console.log('📍 Navigation vers stock level');
        setActiveTab('stock-level');
      }
    });
  }

  // ========================================
  // INSIGHT 11: Inventory Valuation en baisse avec ruptures
  // Seuil: Diminution > 10% + ruptures
  // ========================================
  if (analyticsData.inventoryValuation?.trend === 'down' && Math.abs(analyticsData.inventoryValuation?.changePercent) > 10) {
    const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;
    const decrease = Math.round(Math.abs(analyticsData.inventoryValuation.changePercent) * 10) / 10;
    
    if (outOfStockCount > 5) {
      insights.push({
        id: 'inventory-decline-rupture',
        type: 'warning',
        kpi: 'inventoryValuation',
        message: `Votre inventaire a baissé de ${decrease}%, en partie à cause de ${outOfStockCount} produits en rupture de stock.`,
        actionLabel: 'Réapprovisionner',
        action: () => {
          console.log('📍 Navigation vers actions');
          setActiveTab('actions');
        }
      });
    } else {
      insights.push({
        id: 'inventory-decline-healthy',
        type: 'success',
        kpi: 'inventoryValuation',
        message: `Excellente gestion ! Votre inventaire a diminué de ${decrease}% grâce à une rotation saine du stock.`,
        actionLabel: null,
        action: null
      });
    }
  }

  // ========================================
  // INSIGHT 12: Situation critique globale
  // Plusieurs KPIs dégradés simultanément
  // ========================================
  if (analyticsData.skuAvailability?.rawValue < 85 && 
      analyticsData.salesLost?.rawValue > 5000 &&
      analyticsData.inventoryValuation?.trend === 'down') {
    
    insights.push({
      id: 'critical-situation',
      type: 'danger',
      kpi: 'global',
      message: `🚨 Situation critique détectée: Faible disponibilité (${Math.round(analyticsData.skuAvailability.rawValue)}%), pertes de ${formatCurrencyValue(Math.round(analyticsData.salesLost.rawValue))}, et inventaire en baisse. Action immédiate requise!`,
      actionLabel: 'Voir les urgences',
      action: () => {
        console.log('📍 Navigation vers actions');
        setActiveTab('actions');
      }
    });
  }

  console.log('💡 Insights générés:', insights.length);
  insights.forEach(insight => {
    console.log(`  - [${insight.type}] ${insight.kpi}: ${insight.message.substring(0, 50)}...`);
  });

  return insights;
}

