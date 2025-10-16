/**
 * Utilitaire de test pour la connexion API
 * 
 * Ce module permet de tester la connexion à l'API Google Apps Script
 * et de vérifier que toutes les données sont correctement chargées.
 */

import { API_URL } from '../config/api';
import { getAllData } from '../services/apiService';

/**
 * Teste la connexion à l'API
 * Effectue un health check et récupère toutes les données
 * 
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export async function testApiConnection() {
  console.log('🔄 Test de connexion à l\'API...');
  console.log('📍 URL:', API_URL);

  try {
    // Test 1: Health check
    console.log('\n1️⃣ Test Health Check...');
    const healthResponse = await fetch(`${API_URL}?action=health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'ok') {
      console.log('✅ Health check réussi:', healthData);
    } else {
      throw new Error('Health check échoué');
    }

    // Test 2: Récupération de toutes les données
    console.log('\n2️⃣ Test getAllData...');
    const data = await getAllData();
    
    console.log('✅ Données reçues avec succès:');
    console.log(`   📦 Produits: ${data.products?.length || 0}`);
    console.log(`   📋 Commandes: ${data.orders?.length || 0}`);
    console.log(`   🏢 Fournisseurs: ${data.suppliers?.length || 0}`);

    // Afficher un exemple de chaque type de données
    if (data.products?.length > 0) {
      console.log('\n   Exemple de produit:', data.products[0]);
    }
    if (data.suppliers?.length > 0) {
      console.log('\n   Exemple de fournisseur:', data.suppliers[0]);
    }
    if (data.orders?.length > 0) {
      console.log('\n   Exemple de commande:', data.orders[0]);
    }

    console.log('\n🎉 Tous les tests sont passés avec succès!');
    
    return { 
      success: true, 
      data,
      summary: {
        products: data.products?.length || 0,
        orders: data.orders?.length || 0,
        suppliers: data.suppliers?.length || 0
      }
    };

  } catch (error) {
    console.error('\n❌ Échec de la connexion à l\'API:', error);
    console.error('   Message:', error.message);
    
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Teste une action spécifique de l'API
 * 
 * @param {string} action - L'action à tester
 * @param {Object} params - Paramètres optionnels
 */
export async function testApiAction(action, params = {}) {
  console.log(`\n🧪 Test de l'action: ${action}`);
  
  try {
    let response;
    
    if (params && Object.keys(params).length > 0) {
      // POST request
      response = await fetch(`${API_URL}?action=${action}`, {
        method: 'POST',
        body: JSON.stringify(params)
      });
    } else {
      // GET request
      response = await fetch(`${API_URL}?action=${action}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    console.log('✅ Action réussie:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Action échouée:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Vérifie la structure des données
 * 
 * @param {Object} data - Les données à vérifier
 */
export function validateDataStructure(data) {
  const errors = [];
  
  // Vérifier les produits
  if (!Array.isArray(data.products)) {
    errors.push('Les produits doivent être un tableau');
  } else if (data.products.length > 0) {
    const product = data.products[0];
    const requiredFields = ['sku', 'name', 'stock', 'supplier', 'leadTimeDays'];
    
    requiredFields.forEach(field => {
      if (!(field in product)) {
        errors.push(`Le champ "${field}" est manquant dans les produits`);
      }
    });
  }
  
  // Vérifier les fournisseurs
  if (!Array.isArray(data.suppliers)) {
    errors.push('Les fournisseurs doivent être un tableau');
  } else if (data.suppliers.length > 0) {
    const supplier = data.suppliers[0];
    const requiredFields = ['name', 'email', 'leadTimeDays', 'moq'];
    
    requiredFields.forEach(field => {
      if (!(field in supplier)) {
        errors.push(`Le champ "${field}" est manquant dans les fournisseurs`);
      }
    });
  }
  
  // Vérifier les commandes
  if (!Array.isArray(data.orders)) {
    errors.push('Les commandes doivent être un tableau');
  } else if (data.orders.length > 0) {
    const order = data.orders[0];
    const requiredFields = ['id', 'supplier', 'status', 'total', 'items'];
    
    requiredFields.forEach(field => {
      if (!(field in order)) {
        errors.push(`Le champ "${field}" est manquant dans les commandes`);
      }
    });
  }
  
  if (errors.length > 0) {
    console.error('⚠️ Erreurs de structure détectées:');
    errors.forEach(err => console.error(`   - ${err}`));
    return { valid: false, errors };
  }
  
  console.log('✅ Structure des données validée');
  return { valid: true, errors: [] };
}

export default testApiConnection;
