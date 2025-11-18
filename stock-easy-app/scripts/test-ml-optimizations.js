#!/usr/bin/env node

/**
 * Script de test automatisé pour les optimisations ML
 * Usage: node scripts/test-ml-optimizations.js
 * 
 * @module scripts/test-ml-optimizations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 TEST AUTOMATISÉ - Optimisations ML\n');
console.log('═══════════════════════════════════════\n');

// Test 1: Vérifier que les fichiers existent
console.log('📁 TEST 1: Vérification des fichiers...');

const filesToCheck = [
  'src/services/ml/demandForecastModel.js',
  'src/services/ml/revenueForecastService.js',
  'src/services/ml/mlCache.js',
  'src/services/ml/__tests__/batchPrediction.test.js',
  'src/utils/ml/performanceMonitor.js'
];

let allFilesExist = true;
filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log(allFilesExist ? '\n✅ Tous les fichiers existent\n' : '\n❌ Certains fichiers manquent\n');

// Test 2: Vérifier que predictBatch existe dans demandForecastModel
console.log('🔍 TEST 2: Vérification de predictBatch...');

try {
  const modelContent = fs.readFileSync(
    path.join(__dirname, '..', 'src/services/ml/demandForecastModel.js'),
    'utf8'
  );
  
  const hasPredictBatch = modelContent.includes('predictBatch');
  const hasEarlyStopping = modelContent.includes('earlyStopping');
  const hasPatience = modelContent.includes('patience');
  
  console.log(`  ${hasPredictBatch ? '✅' : '❌'} predictBatch() existe`);
  console.log(`  ${hasEarlyStopping ? '✅' : '❌'} earlyStopping configuré`);
  console.log(`  ${hasPatience ? '✅' : '❌'} patience configuré`);
  
  if (hasPredictBatch && hasEarlyStopping && hasPatience) {
    console.log('\n✅ Toutes les optimisations sont présentes\n');
  } else {
    console.log('\n❌ Certaines optimisations manquent\n');
  }
} catch (error) {
  console.log(`\n❌ Erreur lecture fichier: ${error.message}\n`);
}

// Test 3: Vérifier que le cache est utilisé dans revenueForecastService
console.log('💾 TEST 3: Vérification de l\'intégration du cache...');

try {
  const revenueContent = fs.readFileSync(
    path.join(__dirname, '..', 'src/services/ml/revenueForecastService.js'),
    'utf8'
  );
  
  const hasMlCacheImport = revenueContent.includes("import { mlCache }");
  const hasCachedWrapper = revenueContent.includes('mlCache.cached');
  const hasBatchPrediction = revenueContent.includes('predictBatch');
  
  console.log(`  ${hasMlCacheImport ? '✅' : '❌'} Import mlCache présent`);
  console.log(`  ${hasCachedWrapper ? '✅' : '❌'} Wrapper cache utilisé`);
  console.log(`  ${hasBatchPrediction ? '✅' : '❌'} predictBatch utilisé`);
  
  if (hasMlCacheImport && hasCachedWrapper && hasBatchPrediction) {
    console.log('\n✅ Cache et batch prediction intégrés\n');
  } else {
    console.log('\n❌ Intégration incomplète\n');
  }
} catch (error) {
  console.log(`\n❌ Erreur lecture fichier: ${error.message}\n`);
}

// Test 4: Vérifier les logs de performance dans AnalyticsTab
console.log('📊 TEST 4: Vérification des logs de performance...');

try {
  const analyticsContent = fs.readFileSync(
    path.join(__dirname, '..', 'src/components/analytics/AnalyticsTab.jsx'),
    'utf8'
  );
  
  const hasPerformanceLog = analyticsContent.includes('Temps de calcul');
  const hasPerformanceMessage = analyticsContent.includes('Performance EXCELLENTE');
  
  console.log(`  ${hasPerformanceLog ? '✅' : '❌'} Logs de performance présents`);
  console.log(`  ${hasPerformanceMessage ? '✅' : '❌'} Messages de performance présents`);
  
  if (hasPerformanceLog && hasPerformanceMessage) {
    console.log('\n✅ Monitoring de performance intégré\n');
  } else {
    console.log('\n❌ Monitoring incomplet\n');
  }
} catch (error) {
  console.log(`\n❌ Erreur lecture fichier: ${error.message}\n`);
}

// Résumé
console.log('═══════════════════════════════════════');
console.log('📋 RÉSUMÉ DES TESTS');
console.log('═══════════════════════════════════════\n');

console.log('✅ Tests statiques terminés');
console.log('\n📝 Prochaines étapes:');
console.log('  1. Exécuter: npm run dev');
console.log('  2. Aller dans Analytics');
console.log('  3. Observer les logs de performance dans la console');
console.log('  4. Vérifier le cache avec: mlCache.getStats()');
console.log('\n📖 Voir GUIDE_TEST_RAPIDE.md pour les tests manuels\n');

