/**
 * TEST RAPIDE - Validation ML Integration
 * 
 * Ce fichier teste que l'intégration de la validation fonctionne correctement
 * avec différents scénarios de données.
 * 
 * Run avec: node test-validation-integration.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Patch temporaire pour résoudre l'alias @/
const modelPath = resolve(__dirname, 'src/services/ml/demandForecastModel.js');
const modelContent = readFileSync(modelPath, 'utf-8');

// Remplacer temporairement les imports avec alias par des chemins relatifs
const patchedContent = modelContent
  .replace(/from ['"]@\/utils\/ml\/dataValidator['"]/g, "from '../../utils/ml/dataValidator.js'")
  .replace(/from ['"]@\/utils\/ml\/mlErrors['"]/g, "from '../../utils/ml/mlErrors.js'");

// Créer un fichier temporaire
const tempModelPath = resolve(__dirname, 'src/services/ml/demandForecastModel.temp.js');
writeFileSync(tempModelPath, patchedContent);

try {
  // Importer depuis le fichier temporaire
  const { DemandForecastModel } = await import(`file://${tempModelPath}`);
  const { DataValidationError } = await import('../../src/utils/ml/mlErrors.js');

  console.log('🧪 TEST - Validation ML Integration\n');
  console.log('='.repeat(60));

  // ========================================
  // TEST 1: Données Valides
  // ========================================

  console.log('\n📝 TEST 1: Données valides (devrait réussir)');
  console.log('-'.repeat(60));

  const validData = Array.from({ length: 100 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString(),
    quantity: 10 + Math.random() * 20,
    price: 50 + Math.random() * 10,
    sku: `SKU-${i % 10}`,
    dayOfWeek: (i % 7),
    month: (i % 12) + 1,
    isWeekend: (i % 7 === 0 || i % 7 === 6),
    isHoliday: false
  }));

  try {
    const model = new DemandForecastModel();
    console.log('📊 Entraînement du modèle avec 100 enregistrements valides...');
    
    const result = await model.train(validData, {
      epochs: 5, // Très peu d'epochs pour test rapide
      verbose: 0
    });

    if (result && result.history) {
      console.log('✅ TEST 1 RÉUSSI !');
      console.log(`   Validation stats: ${result.validation.stats.count} enregistrements`);
      console.log(`   Moyenne: ${result.validation.stats.mean.toFixed(2)}`);
      console.log(`   Avertissements: ${result.validation.warnings.length}`);
      
      if (result.validation.warnings.length > 0) {
        console.log(`   ⚠️  ${result.validation.warnings.length} avertissement(s)`);
      }
    }
  } catch (error) {
    console.error('❌ TEST 1 ÉCHOUÉ:', error.message);
    if (error instanceof DataValidationError) {
      console.error('   Détails:', error.getUserFriendlyMessage());
    }
  }

  // ========================================
  // TEST 2: Données Insuffisantes
  // ========================================

  console.log('\n📝 TEST 2: Données insuffisantes (devrait échouer)');
  console.log('-'.repeat(60));

  const insufficientData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString(),
    quantity: 10 + Math.random() * 5,
    price: 50,
    sku: `SKU-${i % 5}`,
    dayOfWeek: (i % 7),
    month: (i % 12) + 1,
    isWeekend: (i % 7 === 0 || i % 7 === 6),
    isHoliday: false
  }));

  try {
    const model = new DemandForecastModel();
    console.log('📊 Tentative avec seulement 30 enregistrements...');
    
    await model.train(insufficientData);
    
    console.error('❌ TEST 2 ÉCHOUÉ: Devrait avoir rejeté les données');
  } catch (error) {
    if (error instanceof DataValidationError) {
      console.log('✅ TEST 2 RÉUSSI ! Erreur correctement détectée:');
      console.log(`   Message: ${error.getUserFriendlyMessage()}`);
      if (error.validationResult.errors.length > 0) {
        console.log(`   Code: ${error.validationResult.errors[0]?.code}`);
      }
    } else {
      console.error('❌ TEST 2 ÉCHOUÉ: Mauvais type d\'erreur:', error.message);
    }
  }

  // ========================================
  // TEST 3: Valeurs Négatives
  // ========================================

  console.log('\n📝 TEST 3: Valeurs négatives (devrait échouer)');
  console.log('-'.repeat(60));

  const negativeData = Array.from({ length: 100 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString(),
    quantity: i === 50 ? -10 : 10 + Math.random() * 5, // Une valeur négative
    price: 50,
    sku: `SKU-${i % 10}`,
    dayOfWeek: (i % 7),
    month: (i % 12) + 1,
    isWeekend: (i % 7 === 0 || i % 7 === 6),
    isHoliday: false
  }));

  try {
    const model = new DemandForecastModel();
    console.log('📊 Tentative avec une valeur négative...');
    
    await model.train(negativeData);
    
    console.error('❌ TEST 3 ÉCHOUÉ: Devrait avoir rejeté les données');
  } catch (error) {
    if (error instanceof DataValidationError) {
      console.log('✅ TEST 3 RÉUSSI ! Valeur négative détectée:');
      console.log(`   Message: ${error.getUserFriendlyMessage()}`);
      const negError = error.validationResult.errors.find(e => e.code === 'NEGATIVE_VALUES');
      if (negError) {
        console.log(`   Nombre: ${negError.count}`);
      }
    } else {
      console.error('❌ TEST 3 ÉCHOUÉ: Mauvais type d\'erreur:', error.message);
    }
  }

  // ========================================
  // RÉSUMÉ
  // ========================================

  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));
  console.log(`
✅ Tests réussis: Vérifier les résultats ci-dessus
❌ Tests échoués: Vérifier les messages d'erreur

🎯 Si tous les tests sont verts, la validation fonctionne parfaitement !
`);

  console.log('='.repeat(60));
  console.log('✨ Tests terminés!\n');

} finally {
  // Nettoyer le fichier temporaire
  try {
    const { unlinkSync } = await import('fs');
    unlinkSync(tempModelPath);
  } catch (e) {
    // Ignorer les erreurs de nettoyage
  }
}
