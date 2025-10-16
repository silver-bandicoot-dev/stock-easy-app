/**
 * Script de test complet pour toutes les fonctionnalités de l'API
 * 
 * Ce script peut être exécuté dans la console du navigateur pour tester
 * toutes les opérations API de l'application Stock Easy.
 */

import api from '../services/apiService';

/**
 * Exécute tous les tests API
 */
export async function runFullApiTests() {
  console.log('🚀 DÉMARRAGE DES TESTS API COMPLETS\n');
  console.log('='.repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Récupérer toutes les données
  await runTest('1. Récupérer toutes les données', async () => {
    const data = await api.getAllData();
    if (!data.products || !data.suppliers || !data.orders) {
      throw new Error('Structure de données invalide');
    }
    console.log(`   ✓ ${data.products.length} produits`);
    console.log(`   ✓ ${data.suppliers.length} fournisseurs`);
    console.log(`   ✓ ${data.orders.length} commandes`);
    return data;
  }, results);

  // Test 2: Créer un fournisseur de test
  await runTest('2. Créer un fournisseur de test', async () => {
    const supplierData = {
      name: `Test Supplier ${Date.now()}`,
      email: 'test@example.com',
      leadTimeDays: 7,
      moq: 10,
      notes: 'Fournisseur de test créé automatiquement'
    };
    const result = await api.createSupplier(supplierData);
    console.log(`   ✓ Fournisseur créé: ${supplierData.name}`);
    return result;
  }, results);

  // Test 3: Mettre à jour un produit (si disponible)
  await runTest('3. Mettre à jour un produit', async () => {
    const allData = await api.getAllData();
    if (allData.products.length === 0) {
      throw new Error('Aucun produit disponible pour le test');
    }
    
    const product = allData.products[0];
    const result = await api.updateProduct(product.sku, {
      multiplier: 1.5
    });
    console.log(`   ✓ Produit ${product.sku} mis à jour`);
    return result;
  }, results);

  // Test 4: Créer une commande de test
  await runTest('4. Créer une commande de test', async () => {
    const allData = await api.getAllData();
    if (allData.products.length === 0 || allData.suppliers.length === 0) {
      throw new Error('Données insuffisantes pour créer une commande');
    }
    
    const product = allData.products[0];
    const supplier = allData.suppliers[0];
    
    const orderData = {
      id: `TEST-${Date.now()}`,
      supplier: supplier.name,
      status: 'pending',
      total: product.buyPrice * 10,
      createdAt: new Date().toISOString(),
      items: [
        {
          sku: product.sku,
          quantity: 10,
          pricePerUnit: product.buyPrice
        }
      ]
    };
    
    const result = await api.createOrder(orderData);
    console.log(`   ✓ Commande créée: ${orderData.id}`);
    return { ...result, orderId: orderData.id };
  }, results);

  // Test 5: Confirmer une commande
  await runTest('5. Confirmer une commande', async (previousResult) => {
    const orderId = previousResult?.orderId;
    if (!orderId) {
      throw new Error('Pas de commande à confirmer');
    }
    
    const result = await api.updateOrderStatus(orderId, {
      status: 'confirmed',
      confirmedAt: new Date().toISOString()
    });
    console.log(`   ✓ Commande confirmée: ${orderId}`);
    return result;
  }, results, results.tests[3]?.result);

  // Test 6: Marquer comme expédiée
  await runTest('6. Marquer commande comme expédiée', async (previousResult) => {
    const orderId = results.tests[3]?.result?.orderId;
    if (!orderId) {
      throw new Error('Pas de commande à expédier');
    }
    
    const result = await api.updateOrderStatus(orderId, {
      status: 'shipped',
      shippedAt: new Date().toISOString(),
      trackingNumber: `TRACK-${Date.now()}`
    });
    console.log(`   ✓ Commande expédiée: ${orderId}`);
    return result;
  }, results);

  // Test 7: Recevoir avec écarts
  await runTest('7. Recevoir commande avec écarts', async () => {
    const orderId = results.tests[3]?.result?.orderId;
    if (!orderId) {
      throw new Error('Pas de commande à recevoir');
    }
    
    const allData = await api.getAllData();
    const order = allData.orders.find(o => o.id === orderId);
    
    const result = await api.updateOrderStatus(orderId, {
      status: 'received',
      receivedAt: new Date().toISOString(),
      hasDiscrepancy: true,
      damageReport: true,
      items: order.items.map(item => ({
        sku: item.sku,
        receivedQuantity: item.quantity - 2, // 2 articles manquants
        discrepancyType: 'damaged',
        discrepancyNotes: '2 articles endommagés lors du transport'
      }))
    });
    console.log(`   ✓ Commande reçue avec écarts: ${orderId}`);
    return result;
  }, results);

  // Test 8: Mettre à jour le stock
  await runTest('8. Mettre à jour le stock', async () => {
    const allData = await api.getAllData();
    if (allData.products.length === 0) {
      throw new Error('Aucun produit pour mettre à jour le stock');
    }
    
    const product = allData.products[0];
    const result = await api.updateStock([
      {
        sku: product.sku,
        quantityToAdd: 5
      }
    ]);
    console.log(`   ✓ Stock mis à jour pour ${product.sku}: +5 unités`);
    return result;
  }, results);

  // Test 9: Lire un paramètre
  await runTest('9. Lire un paramètre de configuration', async () => {
    const value = await api.getParameter('MultiplicateurDefaut');
    console.log(`   ✓ MultiplicateurDefaut = ${value}`);
    return { value };
  }, results);

  // Test 10: Mettre à jour un paramètre
  await runTest('10. Mettre à jour un paramètre', async () => {
    const result = await api.updateParameter('SeuilSurstockProfond', 95);
    console.log(`   ✓ SeuilSurstockProfond mis à jour à 95`);
    return result;
  }, results);

  // Afficher le résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS\n');
  console.log(`✅ Tests réussis: ${results.passed}`);
  console.log(`❌ Tests échoués: ${results.failed}`);
  console.log(`📈 Taux de réussite: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n⚠️ Tests échoués:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  }
  
  console.log('\n' + '='.repeat(60));
  
  return results;
}

/**
 * Exécute un test individuel
 */
async function runTest(name, testFn, results, previousResult) {
  console.log(`\n🧪 ${name}...`);
  
  try {
    const result = await testFn(previousResult);
    console.log('   ✅ Réussi');
    results.passed++;
    results.tests.push({ name, passed: true, result });
    return result;
  } catch (error) {
    console.error(`   ❌ Échoué: ${error.message}`);
    results.failed++;
    results.tests.push({ name, passed: false, error: error.message });
    return null;
  }
}

/**
 * Tests rapides de base (pour vérification rapide)
 */
export async function runQuickTests() {
  console.log('⚡ TESTS RAPIDES\n');
  
  try {
    // Test 1: Connexion
    console.log('1. Test de connexion...');
    const data = await api.getAllData();
    console.log(`   ✅ ${data.products?.length || 0} produits chargés`);
    
    // Test 2: Paramètre
    console.log('\n2. Test paramètre...');
    const param = await api.getParameter('DeviseDefaut');
    console.log(`   ✅ Devise: ${param}`);
    
    console.log('\n✨ Tests rapides terminés avec succès!');
    return true;
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    return false;
  }
}

// Export par défaut
export default {
  runFullApiTests,
  runQuickTests
};
