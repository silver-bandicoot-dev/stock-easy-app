/**
 * Script de test de connexion backend pour l'onglet Paramètres
 * À exécuter dans la console du navigateur (F12)
 */

import api from '../services/apiAdapter';

export const testBackendConnection = async () => {
  console.log('🧪 ====================================');
  console.log('🧪 TEST CONNEXION BACKEND - PARAMÈTRES');
  console.log('🧪 ====================================\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  const addResult = (name, success, details = '') => {
    results.tests.push({ name, success, details });
    if (success) {
      results.passed++;
      console.log(`✅ ${name}`);
    } else {
      results.failed++;
      console.error(`❌ ${name}`);
    }
    if (details) console.log(`   ${details}`);
  };

  // ============================================
  // TEST 1: Charger toutes les données
  // ============================================
  console.log('\n📦 TEST 1: Chargement des données...\n');
  
  try {
    const data = await api.getAllData();
    
    // Vérifier que toutes les collections existent
    const hasProducts = Array.isArray(data.products);
    const hasSuppliers = Array.isArray(data.suppliers);
    const hasWarehouses = Array.isArray(data.warehouses);
    const hasOrders = Array.isArray(data.orders);
    const hasParameters = Array.isArray(data.parameters);
    
    addResult(
      'getAllData() - Produits', 
      hasProducts,
      hasProducts ? `${data.products.length} produits chargés` : 'Aucun produit'
    );
    
    addResult(
      'getAllData() - Fournisseurs', 
      hasSuppliers,
      hasSuppliers ? `${data.suppliers.length} fournisseurs chargés` : 'Aucun fournisseur'
    );
    
    addResult(
      'getAllData() - Entrepôts', 
      hasWarehouses,
      hasWarehouses ? `${data.warehouses.length} entrepôts chargés` : 'Aucun entrepôt'
    );
    
    addResult(
      'getAllData() - Commandes', 
      hasOrders,
      hasOrders ? `${data.orders.length} commandes chargées` : 'Aucune commande'
    );
    
    addResult(
      'getAllData() - Paramètres', 
      hasParameters,
      hasParameters ? `${data.parameters.length} paramètres chargés` : 'Aucun paramètre'
    );
    
  } catch (error) {
    addResult('getAllData()', false, error.message);
  }

  // ============================================
  // TEST 2: Paramètres Généraux
  // ============================================
  console.log('\n⚙️ TEST 2: Paramètres Généraux...\n');

  // Test 2.1: Update devise
  try {
    const testDevise = 'USD';
    const result = await api.updateParameter('DeviseDefaut', testDevise);
    addResult(
      'updateParameter() - Devise', 
      result.success !== false,
      `Devise mise à jour: ${testDevise}`
    );
  } catch (error) {
    addResult('updateParameter() - Devise', false, error.message);
  }

  // Test 2.2: Update seuil surstock
  try {
    const testSeuil = '120';
    const result = await api.updateParameter('SeuilSurstockProfond', testSeuil);
    addResult(
      'updateParameter() - Seuil Surstock', 
      result.success !== false,
      `Seuil mis à jour: ${testSeuil} jours`
    );
  } catch (error) {
    addResult('updateParameter() - Seuil Surstock', false, error.message);
  }

  // Test 2.3: Update multiplicateur
  try {
    const testMult = '1.5';
    const result = await api.updateParameter('MultiplicateurDefaut', testMult);
    addResult(
      'updateParameter() - Multiplicateur', 
      result.success !== false,
      `Multiplicateur mis à jour: ${testMult}`
    );
  } catch (error) {
    addResult('updateParameter() - Multiplicateur', false, error.message);
  }

  // ============================================
  // TEST 3: Gestion des Fournisseurs
  // ============================================
  console.log('\n👥 TEST 3: Gestion des Fournisseurs...\n');

  let testSupplierId = null;

  // Test 3.1: Créer un fournisseur
  try {
    const supplierData = {
      name: 'Test Supplier ' + Date.now(),
      email: 'test@supplier.com',
      phone: '+33123456789',
      leadTimeDays: 14,
      moq: 100
    };
    
    await api.createSupplier(supplierData);
    testSupplierId = supplierData.name;
    
    addResult(
      'createSupplier()', 
      true,
      `Fournisseur créé: ${supplierData.name}`
    );
  } catch (error) {
    addResult('createSupplier()', false, error.message);
  }

  // Test 3.2: Modifier le fournisseur
  if (testSupplierId) {
    try {
      const updates = {
        leadTimeDays: 21
      };
      
      await api.updateSupplier(testSupplierId, updates);
      
      addResult(
        'updateSupplier()', 
        true,
        `Délai modifié: 14 → 21 jours`
      );
    } catch (error) {
      addResult('updateSupplier()', false, error.message);
    }
  }

  // Test 3.3: Supprimer le fournisseur
  if (testSupplierId) {
    try {
      await api.deleteSupplier(testSupplierId);
      
      addResult(
        'deleteSupplier()', 
        true,
        `Fournisseur supprimé: ${testSupplierId}`
      );
    } catch (error) {
      addResult('deleteSupplier()', false, error.message);
    }
  }

  // ============================================
  // TEST 4: Gestion des Entrepôts
  // ============================================
  console.log('\n📍 TEST 4: Gestion des Entrepôts...\n');

  let testWarehouseName = null;

  // Test 4.1: Créer un entrepôt
  try {
    const warehouseData = {
      name: 'Test Warehouse ' + Date.now(),
      address: '123 Test Street',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
      contactPerson: 'John Doe',
      phone: '+33123456789',
      email: 'test@warehouse.com'
    };
    
    await api.createWarehouse(warehouseData);
    testWarehouseName = warehouseData.name;
    
    addResult(
      'createWarehouse()', 
      true,
      `Entrepôt créé: ${warehouseData.name}`
    );
  } catch (error) {
    addResult('createWarehouse()', false, error.message);
  }

  // Test 4.2: Modifier l'entrepôt
  if (testWarehouseName) {
    try {
      const updates = {
        city: 'Lyon'
      };
      
      await api.updateWarehouse(testWarehouseName, updates);
      
      addResult(
        'updateWarehouse()', 
        true,
        `Ville modifiée: Paris → Lyon`
      );
    } catch (error) {
      addResult('updateWarehouse()', false, error.message);
    }
  }

  // Test 4.3: Supprimer l'entrepôt
  if (testWarehouseName) {
    try {
      await api.deleteWarehouse(testWarehouseName);
      
      addResult(
        'deleteWarehouse()', 
        true,
        `Entrepôt supprimé: ${testWarehouseName}`
      );
    } catch (error) {
      addResult('deleteWarehouse()', false, error.message);
    }
  }

  // ============================================
  // RÉSUMÉ
  // ============================================
  console.log('\n🎯 ====================================');
  console.log('🎯 RÉSUMÉ DES TESTS');
  console.log('🎯 ====================================\n');

  console.log(`✅ Tests réussis: ${results.passed}`);
  console.log(`❌ Tests échoués: ${results.failed}`);
  console.log(`📊 Total: ${results.tests.length}`);
  
  const successRate = Math.round((results.passed / results.tests.length) * 100);
  console.log(`\n📈 Taux de réussite: ${successRate}%\n`);

  if (results.failed === 0) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ La connexion backend est fonctionnelle\n');
  } else {
    console.log('⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('❌ Vérifiez les erreurs ci-dessus\n');
    
    console.log('Tests échoués:');
    results.tests
      .filter(t => !t.success)
      .forEach(t => {
        console.log(`  - ${t.name}: ${t.details}`);
      });
  }

  return results;
};

// Export par défaut pour utilisation dans la console
export default testBackendConnection;

// Auto-exécution si appelé directement
if (typeof window !== 'undefined' && window.location) {
  window.testBackendConnection = testBackendConnection;
  console.log('✅ Fonction testBackendConnection() disponible dans la console');
  console.log('💡 Exécutez: testBackendConnection()');
}

