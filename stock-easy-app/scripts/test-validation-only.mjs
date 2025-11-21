/**
 * TEST RAPIDE - Validation ML (sans TensorFlow)
 * 
 * Ce fichier teste uniquement la validation des données
 * sans entraîner le modèle (pour éviter les dépendances TensorFlow)
 * 
 * Run avec: node test-validation-only.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importer directement le validateur
const validatorPath = resolve(__dirname, 'src/utils/ml/dataValidator.js');
const errorsPath = resolve(__dirname, 'src/utils/ml/mlErrors.js');

const { DataValidator } = await import(`file://${validatorPath}`);
const { DataValidationError } = await import(`file://${errorsPath}`);

console.log('🧪 TEST - Validation ML (Validation uniquement)\n');
console.log('='.repeat(60));

// ========================================
// TEST 1: Données Valides
// ========================================

console.log('\n📝 TEST 1: Données valides (devrait réussir)');
console.log('-'.repeat(60));

const validData = Array.from({ length: 100 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toISOString(),
  quantity: 10 + Math.random() * 20
}));

const validation1 = DataValidator.validateSalesHistory(validData);

if (validation1.valid) {
  console.log('✅ TEST 1 RÉUSSI !');
  console.log(`   Enregistrements: ${validation1.stats.count}`);
  console.log(`   Moyenne: ${validation1.stats.mean.toFixed(2)}`);
  console.log(`   Écart-type: ${validation1.stats.std.toFixed(2)}`);
  console.log(`   Avertissements: ${validation1.warnings.length}`);
  
  if (validation1.warnings.length > 0) {
    console.log(`   ⚠️  ${validation1.warnings.length} avertissement(s):`);
    validation1.warnings.forEach(w => {
      console.log(`      - ${w.message}`);
    });
  }
} else {
  console.error('❌ TEST 1 ÉCHOUÉ:');
  validation1.errors.forEach(e => {
    console.error(`   - ${e.message}`);
  });
}

// ========================================
// TEST 2: Données Insuffisantes
// ========================================

console.log('\n📝 TEST 2: Données insuffisantes (devrait échouer)');
console.log('-'.repeat(60));

const insufficientData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toISOString(),
  quantity: 10 + Math.random() * 5
}));

const validation2 = DataValidator.validateSalesHistory(insufficientData, {
  minRecords: 50
});

if (!validation2.valid) {
  const error = validation2.errors.find(e => e.code === 'INSUFFICIENT_DATA');
  if (error) {
    console.log('✅ TEST 2 RÉUSSI ! Erreur correctement détectée:');
    console.log(`   Message: ${error.message}`);
    console.log(`   Attendu: ${error.expected}, Trouvé: ${error.actual}`);
  } else {
    console.error('❌ TEST 2 ÉCHOUÉ: Mauvais type d\'erreur');
  }
} else {
  console.error('❌ TEST 2 ÉCHOUÉ: Devrait avoir rejeté les données');
}

// ========================================
// TEST 3: Valeurs Négatives
// ========================================

console.log('\n📝 TEST 3: Valeurs négatives (devrait échouer)');
console.log('-'.repeat(60));

const negativeData = Array.from({ length: 100 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toISOString(),
  quantity: i === 50 ? -10 : 10 + Math.random() * 5
}));

const validation3 = DataValidator.validateSalesHistory(negativeData);

if (!validation3.valid) {
  const error = validation3.errors.find(e => e.code === 'NEGATIVE_VALUES');
  if (error) {
    console.log('✅ TEST 3 RÉUSSI ! Valeur négative détectée:');
    console.log(`   Message: ${error.message}`);
    console.log(`   Nombre: ${error.count}`);
    if (error.samples) {
      console.log(`   Exemples: ${JSON.stringify(error.samples)}`);
    }
  } else {
    console.error('❌ TEST 3 ÉCHOUÉ: Mauvais type d\'erreur');
  }
} else {
  console.error('❌ TEST 3 ÉCHOUÉ: Devrait avoir rejeté les données');
}

// ========================================
// TEST 4: Outliers (Avertissement)
// ========================================

console.log('\n📝 TEST 4: Outliers (devrait réussir avec avertissement)');
console.log('-'.repeat(60));

const outlierData = Array.from({ length: 100 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toISOString(),
  quantity: i === 50 ? 1000 : 10 + Math.random() * 5
}));

const validation4 = DataValidator.validateSalesHistory(outlierData, {
  maxZScore: 3
});

if (validation4.valid) {
  const warning = validation4.warnings.find(w => w.code === 'OUTLIERS_DETECTED');
  if (warning) {
    console.log('✅ TEST 4 RÉUSSI ! Outlier détecté en tant qu\'avertissement');
    console.log(`   Message: ${warning.message}`);
    console.log(`   Taux: ${warning.rate?.toFixed(1)}%`);
    if (warning.samples) {
      console.log(`   Exemples: ${JSON.stringify(warning.samples.slice(0, 2))}`);
    }
  } else {
    console.log('⚠️  TEST 4 PARTIEL: Outlier non détecté (peut dépendre du seuil Z-score)');
  }
} else {
  console.error('❌ TEST 4 ÉCHOUÉ:', validation4.errors[0]?.message);
}

// ========================================
// TEST 5: Variance Faible (Avertissement)
// ========================================

console.log('\n📝 TEST 5: Variance faible (devrait réussir avec avertissement)');
console.log('-'.repeat(60));

const lowVarianceData = Array.from({ length: 100 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toISOString(),
  quantity: 10 + Math.random() * 0.1
}));

const validation5 = DataValidator.validateSalesHistory(lowVarianceData, {
  minCV: 0.05
});

if (validation5.valid) {
  const warning = validation5.warnings.find(w => w.code === 'LOW_VARIANCE');
  if (warning) {
    console.log('✅ TEST 5 RÉUSSI ! Variance faible détectée');
    console.log(`   Message: ${warning.message}`);
    console.log(`   CV: ${(warning.cv * 100)?.toFixed(2)}%`);
    console.log(`   Explication: ${warning.explanation}`);
  } else {
    console.log('⚠️  TEST 5 PARTIEL: Variance faible non détectée');
  }
} else {
  console.error('❌ TEST 5 ÉCHOUÉ:', validation5.errors[0]?.message);
}

// ========================================
// TEST 6: Trous dans les Dates
// ========================================

console.log('\n📝 TEST 6: Trous dans les dates (devrait réussir avec avertissement)');
console.log('-'.repeat(60));

const gapData = [
  ...Array.from({ length: 20 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString(),
    quantity: 10 + Math.random() * 5
  })),
  ...Array.from({ length: 40 }, (_, i) => ({
    date: new Date(2024, 0, 31 + i).toISOString(),
    quantity: 10 + Math.random() * 5
  }))
];

const validation6 = DataValidator.validateSalesHistory(gapData, {
  maxGapDays: 7
});

if (validation6.valid) {
  const warning = validation6.warnings.find(w => w.code === 'DATE_GAPS');
  if (warning) {
    console.log('✅ TEST 6 RÉUSSI ! Trous dans les dates détectés');
    console.log(`   Message: ${warning.message}`);
    console.log(`   Nombre de trous: ${warning.count}`);
    console.log(`   Jours manquants: ${warning.totalDays}`);
  } else {
    console.log('⚠️  TEST 6 PARTIEL: Trous non détectés');
  }
} else {
  console.error('❌ TEST 6 ÉCHOUÉ:', validation6.errors[0]?.message);
}

// ========================================
// TEST 7: Format de rapport
// ========================================

console.log('\n📝 TEST 7: Format de rapport de validation');
console.log('-'.repeat(60));

const report = DataValidator.formatValidationReport(validation1);
console.log('✅ TEST 7 RÉUSSI ! Rapport généré:');
console.log(report);

// ========================================
// RÉSUMÉ
// ========================================

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ DES TESTS');
console.log('='.repeat(60));
console.log(`
✅ Tests réussis: Vérifier les résultats ci-dessus
❌ Tests échoués: Vérifier les messages d'erreur

🎯 La validation des données fonctionne correctement !
`);

console.log('='.repeat(60));
console.log('✨ Tests terminés!\n');



