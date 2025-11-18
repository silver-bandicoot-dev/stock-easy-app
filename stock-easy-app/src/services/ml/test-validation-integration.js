/**
 * TEST RAPIDE - Validation ML Integration
 * 
 * Ce fichier teste que l'intégration de la validation fonctionne correctement
 * avec différents scénarios de données.
 * 
 * Run avec: node src/services/ml/test-validation-integration.js
 */

import { DemandForecastModel } from './demandForecastModel.js';
import { DataValidationError } from '../../utils/ml/mlErrors.js';

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
    epochs: 10, // Peu d'epochs pour test rapide
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
// TEST 4: Outliers (Avertissement)
// ========================================

console.log('\n📝 TEST 4: Outliers (devrait réussir avec avertissement)');
console.log('-'.repeat(60));

const outlierData = Array.from({ length: 100 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toISOString(),
  quantity: i === 50 ? 1000 : 10 + Math.random() * 5, // Un outlier énorme
  price: 50,
  sku: `SKU-${i % 10}`,
  dayOfWeek: (i % 7),
  month: (i % 12) + 1,
  isWeekend: (i % 7 === 0 || i % 7 === 6),
  isHoliday: false
}));

try {
  const model = new DemandForecastModel();
  console.log('📊 Tentative avec un outlier évident...');
  
  const result = await model.train(outlierData, {
    epochs: 10,
    verbose: 0
  });

  if (result && result.history) {
    const hasOutlierWarning = result.validation.warnings.some(
      w => w.code === 'OUTLIERS_DETECTED'
    );
    
    if (hasOutlierWarning) {
      console.log('✅ TEST 4 RÉUSSI ! Outlier détecté en tant qu\'avertissement');
      const warning = result.validation.warnings.find(w => w.code === 'OUTLIERS_DETECTED');
      console.log(`   Message: ${warning.message}`);
      console.log(`   Taux: ${warning.rate?.toFixed(1)}%`);
    } else {
      console.log('⚠️  TEST 4 PARTIEL: Outlier non détecté (peut dépendre du seuil Z-score)');
    }
  }
} catch (error) {
  console.error('❌ TEST 4 ÉCHOUÉ:', error.message);
  if (error instanceof DataValidationError) {
    console.error('   Détails:', error.getUserFriendlyMessage());
  }
}

// ========================================
// TEST 5: Variance Faible (Avertissement)
// ========================================

console.log('\n📝 TEST 5: Variance faible (devrait réussir avec avertissement)');
console.log('-'.repeat(60));

const lowVarianceData = Array.from({ length: 100 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toISOString(),
  quantity: 10 + Math.random() * 0.1, // Très peu de variation
  price: 50,
  sku: `SKU-${i % 10}`,
  dayOfWeek: (i % 7),
  month: (i % 12) + 1,
  isWeekend: (i % 7 === 0 || i % 7 === 6),
  isHoliday: false
}));

try {
  const model = new DemandForecastModel();
  console.log('📊 Tentative avec variance très faible...');
  
  const result = await model.train(lowVarianceData, {
    epochs: 10,
    verbose: 0
  });

  if (result && result.history) {
    const hasLowVarianceWarning = result.validation.warnings.some(
      w => w.code === 'LOW_VARIANCE'
    );
    
    if (hasLowVarianceWarning) {
      console.log('✅ TEST 5 RÉUSSI ! Variance faible détectée');
      const warning = result.validation.warnings.find(w => w.code === 'LOW_VARIANCE');
      console.log(`   Message: ${warning.message}`);
      console.log(`   CV: ${(warning.cv * 100)?.toFixed(2)}%`);
    } else {
      console.log('⚠️  TEST 5 PARTIEL: Variance faible non détectée (peut dépendre du seuil)');
    }
  }
} catch (error) {
  console.error('❌ TEST 5 ÉCHOUÉ:', error.message);
  if (error instanceof DataValidationError) {
    console.error('   Détails:', error.getUserFriendlyMessage());
  }
}

// ========================================
// TEST 6: Trous dans les Dates
// ========================================

console.log('\n📝 TEST 6: Trous dans les dates (devrait réussir avec avertissement)');
console.log('-'.repeat(60));

const gapData = [
  // Premiers jours normaux
  ...Array.from({ length: 20 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString(),
    quantity: 10 + Math.random() * 5,
    price: 50,
    sku: `SKU-${i % 5}`,
    dayOfWeek: (i % 7),
    month: (i % 12) + 1,
    isWeekend: (i % 7 === 0 || i % 7 === 6),
    isHoliday: false
  })),
  // TROU de 10 jours puis continuation
  ...Array.from({ length: 40 }, (_, i) => ({
    date: new Date(2024, 0, 31 + i).toISOString(), // Après le 30 janvier
    quantity: 10 + Math.random() * 5,
    price: 50,
    sku: `SKU-${i % 5}`,
    dayOfWeek: ((31 + i) % 7),
    month: 1,
    isWeekend: ((31 + i) % 7 === 0 || (31 + i) % 7 === 6),
    isHoliday: false
  }))
];

try {
  const model = new DemandForecastModel();
  console.log('📊 Tentative avec un trou dans les dates...');
  
  const result = await model.train(gapData, {
    epochs: 10,
    verbose: 0
  });

  if (result && result.history) {
    const hasGapWarning = result.validation.warnings.some(
      w => w.code === 'DATE_GAPS'
    );
    
    if (hasGapWarning) {
      console.log('✅ TEST 6 RÉUSSI ! Trous dans les dates détectés');
      const warning = result.validation.warnings.find(w => w.code === 'DATE_GAPS');
      console.log(`   Message: ${warning.message}`);
      console.log(`   Nombre de trous: ${warning.count}`);
    } else {
      console.log('⚠️  TEST 6 PARTIEL: Trous non détectés (seuil à 7 jours par défaut)');
    }
  }
} catch (error) {
  console.error('❌ TEST 6 ÉCHOUÉ:', error.message);
  if (error instanceof DataValidationError) {
    console.error('   Détails:', error.getUserFriendlyMessage());
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

Prochaines étapes:
1. Teste avec tes vraies données de production
2. Intègre le composant UI ValidationReport dans ton dashboard
`);

console.log('='.repeat(60));
console.log('✨ Tests terminés!\n');

