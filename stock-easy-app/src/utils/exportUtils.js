/**
 * Exporte les données KPI vers un fichier CSV
 * @param {object} kpiData - Données du KPI avec historique
 * @param {string} filename - Nom du fichier (sans extension)
 */
export function exportKPIToCSV(kpiData, filename) {
  console.log('📊 Export CSV pour:', filename);
  console.log('📈 Données:', kpiData);

  try {
    // Header
    const headers = ['Date', 'Valeur', 'Variation (%)', 'Tendance'];
    
    // Rows - utiliser chartData si disponible
    const data = kpiData.chartData || [];
    
    if (data.length === 0) {
      console.warn('⚠️ Pas de données à exporter');
      alert('Aucune donnée historique disponible pour l\'export.');
      return;
    }
    
    const rows = data.map(item => [
      item.date || 'N/A',
      item.value || 0,
      kpiData.changePercent || 0,
      kpiData.trend || 'neutral'
    ]);
    
    // Ajouter une ligne de résumé
    rows.push([]);
    rows.push(['Résumé']);
    rows.push(['Valeur actuelle', kpiData.rawValue || kpiData.value || 'N/A']);
    rows.push(['Variation', kpiData.change || 0]);
    rows.push(['Variation (%)', kpiData.changePercent || 0]);
    rows.push(['Tendance', kpiData.trend || 'neutral']);
    
    // Créer le CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ Export CSV réussi:', `${filename}_${today}.csv`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'export CSV:', error);
    alert('Erreur lors de l\'export. Veuillez réessayer.');
  }
}

/**
 * Formate une date pour l'affichage
 * @param {string|Date} date - Date à formater
 * @returns {string} Date formatée
 */
export function formatDateForDisplay(date) {
  if (!date) return 'N/A';
  
  try {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return 'N/A';
  }
}

