/**
 * Script de test rapide pour SmartForecastEngine
 * 
 * Lance avec: node scripts/test-forecast-quick.js
 */

import { SmartForecastEngine } from '../src/services/forecast/SmartForecastEngine.js';

// Fonction pour générer des données de test
function generateSalesData(days, avgQuantity = 10, variance = 0.2) {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Générer une quantité avec variation aléatoire
    const randomVariation = (Math.random() - 0.5) * 2 * variance; // -variance à +variance
    const quantity = Math.max(0, Math.round(avgQuantity * (1 + randomVariation)));
    
    data.push({
      date: date.toISOString().split('T')[0],
      quantity: quantity
    });
  }
  
  return data;
}

// Fonction pour afficher les résultats
function displayResults(title, results) {
  console.log('\n' + '='.repeat(60));
  console.log(`📊 ${title}`);
  console.log('='.repeat(60));
  console.log(JSON.stringify(results, null, 2));
}

// Fonction principale
function runQuickTest() {
  console.log('🚀 Démarrage du test rapide SmartForecastEngine\n');
  
  try {
    // 1. Créer une instance du moteur
    console.log('1️⃣  Création de l\'instance SmartForecastEngine...');
    const engine = new SmartForecastEngine();
    console.log('✅ Instance créée\n');
    
    // 2. Générer 90 jours de données de test
    console.log('2️⃣  Génération de 90 jours de données de test...');
    const salesHistory = generateSalesData(90, 10, 0.2);
    console.log(`✅ ${salesHistory.length} jours générés`);
    console.log(`   Premier jour: ${salesHistory[0].date} - ${salesHistory[0].quantity} unités`);
    console.log(`   Dernier jour: ${salesHistory[salesHistory.length - 1].date} - ${salesHistory[salesHistory.length - 1].quantity} unités\n`);
    
    // 3. Test predict() - Prévision pour aujourd'hui
    console.log('3️⃣  Test predict() - Prévision pour aujourd\'hui...');
    const forecast = engine.predict(salesHistory);
    
    // Vérifications
    const checks = {
      'Prévision définie': forecast !== undefined && forecast !== null,
      'Valeur >= 0': forecast.value >= 0,
      'Confiance entre 0 et 1': forecast.confidence >= 0 && forecast.confidence <= 1,
      'Intervalle défini': forecast.interval !== undefined,
      'Breakdown défini': forecast.breakdown !== undefined
    };
    
    console.log('✅ Prévision générée:');
    console.log(`   Valeur: ${forecast.value} unités`);
    console.log(`   Confiance: ${(forecast.confidence * 100).toFixed(1)}%`);
    console.log(`   Intervalle: [${forecast.interval.min}, ${forecast.interval.max}]`);
    console.log('\n   Vérifications:');
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    
    const allChecksPassed = Object.values(checks).every(v => v === true);
    console.log(`\n   ${allChecksPassed ? '✅' : '❌'} Tous les checks: ${allChecksPassed ? 'PASSÉS' : 'ÉCHOUÉS'}\n`);
    
    // 4. Test predictMultipleDays() - Prévisions sur 30 jours
    console.log('4️⃣  Test predictMultipleDays() - Prévisions sur 30 jours...');
    const multipleForecasts = engine.predictMultipleDays(salesHistory, 30);
    
    const multipleChecks = {
      '30 prévisions générées': multipleForecasts.length === 30,
      'Toutes les dates définies': multipleForecasts.every(f => f.date !== undefined),
      'Toutes les valeurs >= 0': multipleForecasts.every(f => f.value >= 0),
      'Confiance cohérente': multipleForecasts.every(f => f.confidence >= 0 && f.confidence <= 1)
    };
    
    console.log(`✅ ${multipleForecasts.length} prévisions générées`);
    console.log(`   Première prévision: ${multipleForecasts[0].date} - ${multipleForecasts[0].value} unités (confiance: ${(multipleForecasts[0].confidence * 100).toFixed(1)}%)`);
    console.log(`   Dernière prévision: ${multipleForecasts[multipleForecasts.length - 1].date} - ${multipleForecasts[multipleForecasts.length - 1].value} unités (confiance: ${(multipleForecasts[multipleForecasts.length - 1].confidence * 100).toFixed(1)}%)`);
    console.log('\n   Vérifications:');
    Object.entries(multipleChecks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    
    const allMultipleChecksPassed = Object.values(multipleChecks).every(v => v === true);
    console.log(`\n   ${allMultipleChecksPassed ? '✅' : '❌'} Tous les checks: ${allMultipleChecksPassed ? 'PASSÉS' : 'ÉCHOUÉS'}\n`);
    
    // 5. Test de cohérence
    console.log('5️⃣  Test de cohérence des prévisions...');
    const totalForecast = multipleForecasts.reduce((sum, f) => sum + f.value, 0);
    const avgForecast = totalForecast / multipleForecasts.length;
    const dailyAverage = salesHistory.reduce((sum, s) => sum + s.quantity, 0) / salesHistory.length;
    
    console.log(`   Moyenne historique: ${dailyAverage.toFixed(2)} unités/jour`);
    console.log(`   Moyenne prévisions: ${avgForecast.toFixed(2)} unités/jour`);
    console.log(`   Ratio: ${(avgForecast / dailyAverage).toFixed(2)}x`);
    
    const isReasonable = avgForecast / dailyAverage >= 0.5 && avgForecast / dailyAverage <= 2.0;
    console.log(`   ${isReasonable ? '✅' : '⚠️'} Ratio raisonnable (0.5x - 2.0x): ${isReasonable ? 'OUI' : 'NON'}\n`);
    
    // 6. Test MAPE (si assez de données)
    console.log('6️⃣  Test calcul MAPE (backtesting)...');
    const mapeResult = engine.calculateMAPE(salesHistory);
    
    if (mapeResult) {
      console.log(`✅ MAPE calculé:`);
      console.log(`   Précision: ${mapeResult.accuracy.toFixed(1)}%`);
      console.log(`   MAPE: ${mapeResult.mape.toFixed(1)}%`);
      console.log(`   Tests: ${mapeResult.tested}`);
    } else {
      console.log('⚠️  Pas assez de données pour calculer MAPE (minimum 37 jours requis)\n');
    }
    
    // Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('📋 RÉSUMÉ DES TESTS');
    console.log('='.repeat(60));
    console.log(`✅ Test predict(): ${allChecksPassed ? 'PASSÉ' : 'ÉCHOUÉ'}`);
    console.log(`✅ Test predictMultipleDays(): ${allMultipleChecksPassed ? 'PASSÉ' : 'ÉCHOUÉ'}`);
    console.log(`✅ Test cohérence: ${isReasonable ? 'PASSÉ' : 'ATTENTION'}`);
    console.log(`${mapeResult ? '✅' : '⚠️'}  Test MAPE: ${mapeResult ? 'PASSÉ' : 'IGNORÉ (données insuffisantes)'}`);
    console.log('='.repeat(60));
    
    const overallSuccess = allChecksPassed && allMultipleChecksPassed && isReasonable;
    console.log(`\n${overallSuccess ? '✅' : '❌'} RESULTAT GLOBAL: ${overallSuccess ? 'SUCCÈS' : 'ÉCHEC'}\n`);
    
    return overallSuccess;
    
  } catch (error) {
    console.error('\n❌ ERREUR lors du test:', error);
    console.error(error.stack);
    return false;
  }
}

// Exécuter le test
const success = runQuickTest();
process.exit(success ? 0 : 1);

