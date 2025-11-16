/**
 * Script de test pour le nouveau système de notifications
 * À exécuter dans la console du navigateur pour tester manuellement
 */

import { notifyWeeklyMLAnalysis, checkAndNotifyMLInsights } from '../services/mlNotificationsService';
import { notifyMentionedUsers, extractMentions, getCompanyUsersForMention } from '../services/mentionNotificationsService';
import { addComment } from '../services/commentsService';

/**
 * Test 1: Notification hebdomadaire ML
 */
export async function testWeeklyMLNotification() {
  console.log('🧪 Test: Notification hebdomadaire ML...');
  
  try {
    const result = await notifyWeeklyMLAnalysis();
    
    if (result.success) {
      console.log('✅ Notification hebdomadaire créée avec succès');
      console.log(`📊 Nombre de notifications: ${result.count}`);
    } else {
      console.error('❌ Échec de la création:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erreur test notification hebdomadaire:', error);
    return { success: false, error };
  }
}

/**
 * Test 2: Alertes ML critiques
 * Nécessite des produits et des prévisions
 */
export async function testMLCriticalAlerts(products, forecasts) {
  console.log('🧪 Test: Alertes ML critiques...');
  
  if (!products || products.length === 0) {
    console.warn('⚠️ Aucun produit fourni pour le test');
    return { success: false, error: 'No products' };
  }
  
  if (!forecasts || Object.keys(forecasts).length === 0) {
    console.warn('⚠️ Aucune prévision fournie pour le test');
    return { success: false, error: 'No forecasts' };
  }
  
  try {
    const result = await checkAndNotifyMLInsights(products, forecasts);
    
    if (result.success) {
      console.log('✅ Vérification ML terminée');
      console.log(`📊 Alertes créées: ${result.alertsCount}`);
      console.log(`🤖 Recommandations créées: ${result.recommendationsCount}`);
      console.log(`📈 Total: ${result.totalCount}`);
    } else {
      console.error('❌ Échec:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erreur test alertes ML:', error);
    return { success: false, error };
  }
}

/**
 * Test 3: Extraction de mentions
 */
export async function testExtractMentions(companyId) {
  console.log('🧪 Test: Extraction de mentions...');
  
  const testTexts = [
    'Salut @jean.dupont, peux-tu vérifier cette commande ?',
    'CC @marie@company.com et @thomas',
    'Pas de mention ici',
    '@utilisateur1 et @utilisateur2, regardez ça'
  ];
  
  try {
    for (const text of testTexts) {
      console.log(`\n📝 Texte: "${text}"`);
      const mentions = await extractMentions(text, companyId);
      console.log(`👥 Mentions trouvées: ${mentions.length}`, mentions);
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur test extraction mentions:', error);
    return { success: false, error };
  }
}

/**
 * Test 4: Liste des utilisateurs pour mention
 */
export async function testGetCompanyUsers(companyId) {
  console.log('🧪 Test: Liste utilisateurs pour mention...');
  
  try {
    const users = await getCompanyUsersForMention(companyId);
    
    console.log(`✅ ${users.length} utilisateur(s) trouvé(s)`);
    users.forEach(user => {
      console.log(`  - ${user.displayName} (${user.email})`);
    });
    
    return { success: true, users };
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    return { success: false, error };
  }
}

/**
 * Test 5: Création d'un commentaire avec mention
 */
export async function testCommentWithMention(orderId, content) {
  console.log('🧪 Test: Création commentaire avec mention...');
  console.log(`📦 Commande: ${orderId}`);
  console.log(`📝 Contenu: "${content}"`);
  
  try {
    const result = await addComment(orderId, content, []); // Les mentions seront extraites automatiquement
    
    if (result.error) {
      console.error('❌ Erreur création commentaire:', result.error);
      return { success: false, error: result.error };
    }
    
    console.log('✅ Commentaire créé avec succès');
    console.log('📊 Data:', result.data);
    
    return { success: true, data: result.data };
  } catch (error) {
    console.error('❌ Erreur test commentaire:', error);
    return { success: false, error };
  }
}

/**
 * Test complet
 * Exécute tous les tests
 */
export async function runAllTests(options = {}) {
  const {
    products = [],
    forecasts = {},
    companyId = null,
    testOrderId = 'PO-TEST-001'
  } = options;
  
  console.log('🚀 Démarrage des tests du système de notifications...\n');
  
  const results = {
    weeklyML: null,
    criticalML: null,
    extractMentions: null,
    companyUsers: null,
    comment: null
  };
  
  // Test 1: Notification hebdomadaire ML
  results.weeklyML = await testWeeklyMLNotification();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Pause 1s
  
  // Test 2: Alertes ML critiques (si données disponibles)
  if (products.length > 0 && Object.keys(forecasts).length > 0) {
    results.criticalML = await testMLCriticalAlerts(products, forecasts);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test 3: Extraction de mentions (si companyId fourni)
  if (companyId) {
    results.extractMentions = await testExtractMentions(companyId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Liste utilisateurs
    results.companyUsers = await testGetCompanyUsers(companyId);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test 5: Commentaire avec mention (exemple)
  // ATTENTION: Ce test crée vraiment un commentaire dans la base
  // Décommentez uniquement si vous voulez tester en conditions réelles
  /*
  if (companyId && testOrderId) {
    results.comment = await testCommentWithMention(
      testOrderId,
      'Test de notification: @jean.dupont peux-tu vérifier ?'
    );
  }
  */
  
  console.log('\n📊 RÉSUMÉ DES TESTS:');
  console.log('═══════════════════════════════════════');
  console.log(`Notification hebdomadaire ML: ${results.weeklyML?.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Alertes ML critiques: ${results.criticalML?.success ? '✅ PASS' : '⏭️  SKIP'}`);
  console.log(`Extraction mentions: ${results.extractMentions?.success ? '✅ PASS' : '⏭️  SKIP'}`);
  console.log(`Liste utilisateurs: ${results.companyUsers?.success ? '✅ PASS' : '⏭️  SKIP'}`);
  console.log(`Commentaire avec mention: ${results.comment?.success ? '✅ PASS' : '⏭️  SKIP'}`);
  console.log('═══════════════════════════════════════\n');
  
  return results;
}

// Export pour usage dans la console
export default {
  testWeeklyMLNotification,
  testMLCriticalAlerts,
  testExtractMentions,
  testGetCompanyUsers,
  testCommentWithMention,
  runAllTests
};

