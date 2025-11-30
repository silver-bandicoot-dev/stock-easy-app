import { chromium, FullConfig } from '@playwright/test';

/**
 * Configuration globale exécutée une fois avant tous les tests
 * Utilisé pour la configuration initiale comme l'authentification
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Démarrage de la configuration globale des tests E2E...');
  
  const { baseURL } = config.projects[0].use;
  
  // Vérifier que le serveur est accessible
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    const response = await page.goto(baseURL || 'http://localhost:5173', {
      timeout: 30000,
    });
    
    if (!response || response.status() >= 500) {
      throw new Error(`Le serveur n'est pas accessible à ${baseURL}`);
    }
    
    console.log('✅ Serveur de développement accessible');
    
    // Ici, vous pourriez ajouter une authentification globale
    // et sauvegarder l'état d'authentification pour les tests
    
    /*
    // Exemple d'authentification globale:
    await page.goto(`${baseURL}/login`);
    await page.fill('input#email', process.env.TEST_USER_EMAIL || '');
    await page.fill('input#password', process.env.TEST_USER_PASSWORD || '');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${baseURL}/app`);
    
    // Sauvegarder l'état d'authentification
    await page.context().storageState({
      path: 'playwright/.auth/user.json',
    });
    
    console.log('✅ État d\'authentification sauvegardé');
    */
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration globale:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Configuration globale terminée');
}

export default globalSetup;

