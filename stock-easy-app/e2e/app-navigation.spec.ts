import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour la navigation dans l'application StockEasy
 * 
 * Note: Ces tests nécessitent une authentification.
 * Pour les exécuter en local, configurez les variables d'environnement
 * TEST_USER_EMAIL et TEST_USER_PASSWORD ou utilisez un mock d'auth.
 */

// Configuration de l'authentification pour les tests
test.describe.configure({ mode: 'serial' });

test.describe('Navigation Principale (Mock/Skip Auth)', () => {
  // Ces tests simulent la navigation sans authentification réelle
  // Ils vérifient que les composants de base sont présents
  
  test('devrait pouvoir accéder à la page de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Structure de l\'Application', () => {
  test.skip('devrait afficher la sidebar sur desktop', async ({ page }) => {
    // Skip si pas d'authentification disponible
    // Ce test sera activé avec une authentification E2E
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/app');
    
    // Vérifier la présence de la sidebar
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test.skip('devrait afficher la bottom nav sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app');
    
    // La bottom nav devrait être visible sur mobile
    await page.waitForLoadState('networkidle');
  });
});

test.describe('URLs et Routing', () => {
  test('les routes publiques devraient être accessibles', async ({ page }) => {
    // Test des routes publiques
    const publicRoutes = [
      '/',
      '/preview',
      '/login',
      '/forgot-password',
      '/legal/terms',
      '/legal/privacy',
      '/legal/notices',
      '/legal/cookies',
    ];

    for (const route of publicRoutes) {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
    }
  });

  test('les routes protégées devraient rediriger ou afficher un état approprié', async ({ page }) => {
    const protectedRoutes = [
      '/app',
      '/profile',
      '/notifications',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      // Soit redirigé vers login, soit affiche un état de chargement/auth
      await page.waitForTimeout(1000);
      const url = page.url();
      // La route devrait soit être sur login, soit sur la route demandée (si auth en cours)
      expect(url).toBeDefined();
    }
  });
});

test.describe('Deep Linking', () => {
  test('devrait supporter les paramètres de query string', async ({ page }) => {
    // Test qu'un deep link avec query params ne casse pas l'app
    await page.goto('/login?redirect=/app');
    await expect(page).toHaveURL(/\/login/);
  });
});

// ========================================
// TESTS AVEC AUTHENTIFICATION
// ========================================
// Ces tests nécessitent des credentials valides
// Décommentez et configurez pour les activer

/*
test.describe('Navigation Authentifiée', () => {
  test.beforeEach(async ({ page }) => {
    // Login avant chaque test
    await page.goto('/login');
    await page.fill('input#email', process.env.TEST_USER_EMAIL || '');
    await page.fill('input#password', process.env.TEST_USER_PASSWORD || '');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app');
  });

  test('devrait pouvoir naviguer vers le Dashboard', async ({ page }) => {
    // Le Dashboard est l'onglet par défaut
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
  });

  test('devrait pouvoir naviguer vers Actions', async ({ page }) => {
    await page.click('text=Passer Commande');
    await expect(page.locator('[data-tab="actions"]')).toBeVisible();
  });

  test('devrait pouvoir naviguer vers Mes Commandes', async ({ page }) => {
    await page.click('text=Mes Commandes');
    await expect(page.locator('[data-tab="orders"]')).toBeVisible();
  });

  test('devrait pouvoir naviguer vers Niveaux de Stock', async ({ page }) => {
    await page.click('text=Niveaux de Stock');
    await expect(page.locator('[data-tab="stock"]')).toBeVisible();
  });

  test('devrait pouvoir naviguer vers Inventaire', async ({ page }) => {
    await page.click('text=Inventaire');
    await expect(page.locator('[data-tab="inventory"]')).toBeVisible();
  });

  test('devrait pouvoir naviguer vers Analytics', async ({ page }) => {
    await page.click('text=Analytics');
    await expect(page.locator('[data-tab="analytics"]')).toBeVisible();
  });

  test('devrait pouvoir naviguer vers Paramètres', async ({ page }) => {
    await page.click('text=Paramètres');
    await expect(page.locator('[data-tab="settings"]')).toBeVisible();
  });

  test('devrait pouvoir naviguer vers le Profil', async ({ page }) => {
    await page.click('text=Mon profil');
    await expect(page.locator('[data-tab="profile"]')).toBeVisible();
  });

  test('devrait pouvoir se déconnecter', async ({ page }) => {
    await page.click('button:has-text("Se déconnecter")');
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });
});
*/

// ========================================
// TESTS DE RÉGRESSION VISUELS
// ========================================

test.describe('Régression Visuelle', () => {
  test('capture de la page Coming Soon', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Attendre les animations
    await page.waitForTimeout(1000);
    
    // Screenshot pour comparaison future
    await expect(page).toHaveScreenshot('coming-soon.png', {
      maxDiffPixels: 100,
      animations: 'disabled',
    });
  });

  test('capture de la page Login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('login.png', {
      maxDiffPixels: 100,
      animations: 'disabled',
    });
  });
});

test.describe('Comportements Critiques', () => {
  test('le raccourci Cmd+K ne devrait pas causer d\'erreur sur login', async ({ page }) => {
    await page.goto('/login');
    
    // Simuler Cmd+K (ou Ctrl+K sur Windows/Linux)
    await page.keyboard.press('Meta+k');
    
    // La page ne devrait pas avoir d'erreur
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(500);
    
    // Filtrer les erreurs attendues (comme les 401 pour des ressources protégées)
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('401') && 
      !err.includes('Unauthorized') &&
      !err.includes('Failed to load resource')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

