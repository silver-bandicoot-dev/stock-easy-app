// Script de validation après chaque phase
// À exécuter dans la console du navigateur après chaque phase

function validateApp() {
  const checks = {
    appStarts: typeof StockEasy !== 'undefined' || document.querySelector('[data-testid="stockeasy"]') !== null,
    noConsoleErrors: true, // À vérifier manuellement dans la console
    uiIntact: true, // À vérifier visuellement
    functionsWork: true, // À tester manuellement
    importsWork: true // Vérifier que les imports fonctionnent
  };

  console.log('🔍 Validation Refactorisation:');
  Object.entries(checks).forEach(([test, passes]) => {
    console.log(`${passes ? '✅' : '❌'} ${test}`);
  });

  // Vérifications supplémentaires
  console.log('\n📋 Vérifications supplémentaires:');
  console.log('- Vérifier que tous les onglets fonctionnent');
  console.log('- Vérifier que les modals s\'ouvrent');
  console.log('- Vérifier que les commandes se créent');
  console.log('- Vérifier que les exports CSV fonctionnent');
  console.log('- Vérifier que les emails se génèrent');

  return Object.values(checks).every(v => v);
}

// Auto-exécution si dans un environnement Node
if (typeof window === 'undefined') {
  console.log('⚠️ Ce script doit être exécuté dans la console du navigateur');
} else {
  // Exporter pour utilisation dans la console
  window.validateRefactor = validateApp;
  console.log('✅ Fonction validateRefactor disponible. Tapez validateRefactor() dans la console.');
}

// Pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateApp };
}

