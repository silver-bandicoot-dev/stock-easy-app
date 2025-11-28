/**
 * Export du rapport d'inventaire pour comptabilité
 * Format simple et clair avec valorisation du stock
 */

/**
 * Formate une valeur monétaire
 */
const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  return Number(value).toFixed(2);
};

/**
 * Exporte le rapport d'inventaire complet avec valeurs
 * Format optimisé pour les comptables
 */
export const exportInventoryReport = (products, options = {}) => {
  const { 
    filename = `rapport_inventaire_${new Date().toISOString().split('T')[0]}.csv`,
    currencySymbol = '€'
  } = options;

  if (!products || products.length === 0) {
    return { success: false, message: 'Aucun produit à exporter' };
  }

  try {
    // Calculer les totaux
    let totalUnits = 0;
    let totalStockValue = 0;
    let totalSaleValue = 0;

    // Préparer les données
    const rows = products.map(product => {
      const qty = product.stock || 0;
      const buyPrice = product.buyPrice || 0;
      const sellPrice = product.sellPrice || 0;
      const stockValue = qty * buyPrice;
      const saleValue = qty * sellPrice;
      
      totalUnits += qty;
      totalStockValue += stockValue;
      totalSaleValue += saleValue;

      return {
        'SKU': product.sku || '',
        'Nom du produit': product.name || '',
        'Fournisseur': product.supplier || '',
        'Quantité': qty,
        'Prix achat HT': formatCurrency(buyPrice),
        'Prix vente HT': formatCurrency(sellPrice),
        'Valeur stock (coût)': formatCurrency(stockValue),
        'Valeur stock (vente)': formatCurrency(saleValue)
      };
    });

    // Créer le contenu CSV
    const BOM = '\uFEFF'; // Support UTF-8 Excel
    const headers = Object.keys(rows[0]);
    
    // Lignes de données
    const dataLines = rows.map(row => 
      headers.map(h => {
        const val = row[h];
        // Échapper les virgules et guillemets
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    );

    // Ligne de totaux
    const totalsLine = [
      '',
      'TOTAL',
      '',
      totalUnits,
      '',
      '',
      formatCurrency(totalStockValue),
      formatCurrency(totalSaleValue)
    ].join(',');

    // Assembler le CSV
    const csvContent = BOM + [
      headers.join(','),
      ...dataLines,
      '', // Ligne vide avant les totaux
      totalsLine
    ].join('\n');

    // Télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);

    return { 
      success: true, 
      totalProducts: products.length,
      totalUnits,
      totalStockValue,
      totalSaleValue
    };
  } catch (error) {
    console.error('Erreur export:', error);
    return { success: false, message: error.message };
  }
};

export default exportInventoryReport;
