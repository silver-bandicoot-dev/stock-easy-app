#!/usr/bin/env node

/**
 * Script de test rapide de l'API
 * Usage: node test-api.mjs
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbzeloLj-PTcTcx5kgxDyCh6iGXXB0cHzug_vsiMCpEDqxlZou7WjjmqqIiPB9PEXzOF/exec';

console.log('🔄 Test de l\'API Stock Easy...\n');
console.log('📍 URL:', API_URL);
console.log('='.repeat(60));

// Test 1: Health Check
console.log('\n1️⃣ Test Health Check...');
try {
  const healthResponse = await fetch(`${API_URL}?action=health`);
  const healthData = await healthResponse.json();
  
  if (healthData.status === 'ok') {
    console.log('✅ Health check réussi');
    console.log('   ', JSON.stringify(healthData, null, 2));
  } else {
    console.log('❌ Health check échoué');
    console.log('   ', healthData);
  }
} catch (error) {
  console.error('❌ Erreur:', error.message);
}

// Test 2: Get All Data
console.log('\n2️⃣ Test getAllData...');
try {
  const dataResponse = await fetch(`${API_URL}?action=getAllData`);
  const data = await dataResponse.json();
  
  if (data.products && data.suppliers && data.orders) {
    console.log('✅ Données récupérées avec succès:');
    console.log(`   📦 Produits: ${data.products.length}`);
    console.log(`   🏢 Fournisseurs: ${data.suppliers.length}`);
    console.log(`   📋 Commandes: ${data.orders.length}`);
    
    // Afficher un exemple de chaque
    if (data.products.length > 0) {
      console.log('\n   Exemple de produit:');
      console.log('   ', JSON.stringify(data.products[0], null, 2).split('\n').join('\n   '));
    }
  } else {
    console.log('❌ Structure de données invalide');
    console.log('   ', data);
  }
} catch (error) {
  console.error('❌ Erreur:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('✨ Tests terminés !');
console.log('\nPour des tests plus complets, lancez l\'application:');
console.log('   npm run dev');
console.log('\nPuis dans la console du navigateur:');
console.log('   import { runFullApiTests } from \'./src/utils/fullApiTest.js\';');
console.log('   await runFullApiTests();');
