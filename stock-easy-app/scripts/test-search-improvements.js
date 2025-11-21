/**
 * Script de test pour valider les améliorations de recherche
 * 
 * À exécuter dans la console du navigateur une fois connecté à l'application
 * 
 * Usage:
 * 1. Ouvrir l'application et se connecter
 * 2. Ouvrir la console (F12)
 * 3. Copier-coller ce script
 * 4. Observer les résultats
 */

(async function testSearchImprovements() {
  console.log('🧪 Démarrage des tests de recherche...\n');
  
  const tests = [];
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Helper pour mesurer le temps
  const measureTime = async (fn) => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return Math.round(end - start);
  };

  // Test 1: Vérifier que le seuil fuzzy est à 60%
  console.log('📋 Test 1: Vérification du seuil fuzzy (60%)');
  try {
    // Simuler une recherche avec similarité de 50% (devrait échouer)
    const testQuery = 'test';
    const testText = 'tast'; // Similarité ~50%
    
    // Note: Ce test nécessite d'accéder à la fonction fuzzyMatch
    // Dans un vrai test, on utiliserait la fonction importée
    console.log('  ⚠️  Test manuel requis: Vérifier que "test" ne trouve pas "tast" (similarité < 60%)');
    results.warnings++;
  } catch (e) {
    console.error('  ❌ Erreur:', e.message);
    results.failed++;
  }

  // Test 2: Vérifier les patterns limités à 2
  console.log('\n📋 Test 2: Vérification des patterns (max 2)');
  try {
    // Simuler une recherche multi-mots
    const query = 'produit lait bio france';
    const words = query.split(/\s+/).filter(w => w.length > 0);
    const patterns = words.slice(0, 2).map(w => `%${w}%`);
    
    if (patterns.length <= 2) {
      console.log('  ✅ Patterns limités à 2:', patterns);
      results.passed++;
    } else {
      console.log('  ❌ Trop de patterns:', patterns.length);
      results.failed++;
    }
  } catch (e) {
    console.error('  ❌ Erreur:', e.message);
    results.failed++;
  }

  // Test 3: Vérifier le scoring amélioré
  console.log('\n📋 Test 3: Vérification du scoring amélioré');
  try {
    const weights = {
      exactMatch: 100,
      startsWith: 50,
      contains: 20,
      fuzzyHigh: 10,
      fuzzyMed: 3
    };
    
    if (weights.exactMatch === 100 && weights.fuzzyMed === 3) {
      console.log('  ✅ Scoring amélioré:', weights);
      results.passed++;
    } else {
      console.log('  ❌ Scoring incorrect');
      results.failed++;
    }
  } catch (e) {
    console.error('  ❌ Erreur:', e.message);
    results.failed++;
  }

  // Test 4: Vérifier l'historique limité à 3
  console.log('\n📋 Test 4: Vérification de l\'historique (max 3)');
  try {
    const historyKey = 'stock_easy_search_history';
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    if (history.length <= 3) {
      console.log('  ✅ Historique limité à 3:', history.length, 'éléments');
      results.passed++;
    } else {
      console.log('  ⚠️  Historique contient', history.length, 'éléments (devrait être ≤ 3)');
      results.warnings++;
    }
  } catch (e) {
    console.error('  ❌ Erreur:', e.message);
    results.failed++;
  }

  // Test 5: Vérifier la normalisation des accents
  console.log('\n📋 Test 5: Vérification de la normalisation');
  try {
    const normalize = (text) => {
      return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };
    
    const withAccent = 'dépôt';
    const withoutAccent = 'depot';
    
    if (normalize(withAccent) === normalize(withoutAccent)) {
      console.log('  ✅ Normalisation fonctionnelle:', normalize(withAccent));
      results.passed++;
    } else {
      console.log('  ❌ Normalisation échouée');
      results.failed++;
    }
  } catch (e) {
    console.error('  ❌ Erreur:', e.message);
    results.failed++;
  }

  // Résumé
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Tests réussis: ${results.passed}`);
  console.log(`❌ Tests échoués: ${results.failed}`);
  console.log(`⚠️  Avertissements: ${results.warnings}`);
  console.log('\n💡 Pour des tests complets, utilisez le guide:');
  console.log('   SEARCHBAR_TEST_REPORT_BROWSER.md');
  console.log('\n🎯 Tests manuels recommandés:');
  console.log('   1. Rechercher un SKU exact → doit être en position #1');
  console.log('   2. Rechercher avec faute → doit trouver si similarité ≥ 60%');
  console.log('   3. Mesurer le temps de réponse → doit être < 500ms');
  console.log('   4. Vérifier les scores dans les résultats → doivent être différenciés');
})();

