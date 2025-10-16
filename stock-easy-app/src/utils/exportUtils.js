import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Exporter les données en CSV
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  // Obtenir les colonnes
  const headers = Object.keys(data[0]);
  
  // Créer le contenu CSV
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Échapper les virgules et guillemets
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Télécharger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

/**
 * Exporter les données en Excel
 */
export const exportToExcel = (data, filename = 'export.xlsx', sheetName = 'Data') => {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  // Créer un workbook
  const wb = XLSX.utils.book_new();
  
  // Convertir les données en worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Ajuster la largeur des colonnes
  const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length, 15)
  }));
  ws['!cols'] = colWidths;
  
  // Ajouter le worksheet au workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Télécharger
  XLSX.writeFile(wb, filename);
};

/**
 * Exporter les données en PDF
 */
export const exportToPDF = (data, filename = 'export.pdf', title = 'Export') => {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  // Créer un nouveau document PDF
  const doc = new jsPDF();
  
  // Titre
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
  
  // Obtenir les colonnes
  const headers = Object.keys(data[0]);
  
  // Préparer les données pour le tableau
  const tableData = data.map(row =>
    headers.map(header => row[header])
  );
  
  // Créer le tableau
  doc.autoTable({
    head: [headers],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });
  
  // Télécharger
  doc.save(filename);
};

/**
 * Exporter les produits avec formatage
 */
export const exportProducts = (products, format = 'csv') => {
  // Formatter les données
  const formattedData = products.map(p => ({
    'SKU': p.sku,
    'Nom': p.name,
    'Catégorie': p.category || 'N/A',
    'Quantité': p.quantite,
    'Stock Min': p.stockMin,
    'Stock Max': p.stockMax,
    'Coût': `${p.cost?.toFixed(2) || 0}€`,
    'Prix': `${p.sellingPrice?.toFixed(2) || 0}€`,
    'Statut': p.stockStatus || 'N/A',
  }));

  const filename = `products-${new Date().toISOString().split('T')[0]}`;

  switch (format) {
    case 'csv':
      exportToCSV(formattedData, `${filename}.csv`);
      break;
    case 'excel':
      exportToExcel(formattedData, `${filename}.xlsx`, 'Produits');
      break;
    case 'pdf':
      exportToPDF(formattedData, `${filename}.pdf`, 'Liste des Produits');
      break;
    default:
      throw new Error(`Format non supporté: ${format}`);
  }
};

/**
 * Exporter les commandes
 */
export const exportOrders = (orders, format = 'csv') => {
  const formattedData = orders.map(o => ({
    'N° Commande': o.orderNumber || o.id,
    'Fournisseur': o.supplier,
    'Date': new Date(o.orderDate).toLocaleDateString('fr-FR'),
    'Statut': o.status,
    'Produits': o.items?.length || 0,
    'Total': `${o.total?.toFixed(2) || 0}€`,
  }));

  const filename = `orders-${new Date().toISOString().split('T')[0]}`;

  switch (format) {
    case 'csv':
      exportToCSV(formattedData, `${filename}.csv`);
      break;
    case 'excel':
      exportToExcel(formattedData, `${filename}.xlsx`, 'Commandes');
      break;
    case 'pdf':
      exportToPDF(formattedData, `${filename}.pdf`, 'Liste des Commandes');
      break;
    default:
      throw new Error(`Format non supporté: ${format}`);
  }
};
