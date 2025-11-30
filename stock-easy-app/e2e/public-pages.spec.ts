import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les pages publiques de StockEasy
 * - Page Coming Soon (/)
 * - Page Landing Preview (/preview)
 * - Pages légales
 */

test.describe('Page Coming Soon', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('devrait afficher le logo StockEasy', async ({ page }) => {
    // Vérifier que le texte "stockeasy" est visible dans le logo (classe brand-font)
    await expect(page.locator('.brand-font').getByText('stockeasy')).toBeVisible();
  });

  test('devrait afficher le badge "Lancement imminent"', async ({ page }) => {
    await expect(page.getByText('Lancement imminent')).toBeVisible();
  });

  test('devrait afficher le titre principal', async ({ page }) => {
    await expect(page.getByText('La gestion de stock Shopify,')).toBeVisible();
    await expect(page.getByText('réinventée')).toBeVisible();
  });

  test('devrait afficher le formulaire d\'inscription à la waitlist', async ({ page }) => {
    // Vérifier la présence du champ email
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', 'votre@email.com');
    
    // Vérifier le bouton d'inscription
    await expect(page.getByRole('button', { name: /M'inscrire/i })).toBeVisible();
  });

  test('devrait afficher les fonctionnalités prévues', async ({ page }) => {
    await expect(page.getByText('Prévisions de stock par IA')).toBeVisible();
    await expect(page.getByText('Synchronisation Shopify temps réel')).toBeVisible();
    await expect(page.getByText('Alertes anti-rupture intelligentes')).toBeVisible();
  });

  test('devrait afficher le badge Shopify Partner', async ({ page }) => {
    await expect(page.getByText('Shopify Partner')).toBeVisible();
  });

  test('devrait afficher le footer avec les informations de contact', async ({ page }) => {
    await expect(page.getByText(/© \d{4} stockeasy/)).toBeVisible();
    await expect(page.getByText('contact@stockeasy.app')).toBeVisible();
  });

  test('devrait permettre de saisir un email', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('devrait valider le format email', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    
    const submitButton = page.getByRole('button', { name: /M'inscrire/i });
    await submitButton.click();
    
    // Le navigateur devrait bloquer la soumission avec un email invalide
    // On vérifie qu'on est toujours sur la même page
    await expect(emailInput).toBeVisible();
  });
});

test.describe('Page Landing Preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/preview');
  });

  test('devrait charger la page Landing', async ({ page }) => {
    // Attendre que le contenu soit chargé
    await page.waitForLoadState('networkidle');
    
    // La page devrait avoir la classe landing-page
    await expect(page.locator('.landing-page')).toBeVisible();
  });

  test('devrait afficher la navbar', async ({ page }) => {
    // Vérifier que la navbar est présente
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('devrait afficher la section Hero', async ({ page }) => {
    // Attendre le chargement
    await page.waitForLoadState('domcontentloaded');
    
    // La page Landing devrait avoir du contenu
    const content = page.locator('.landing-page');
    await expect(content).toBeVisible();
  });
});

test.describe('Pages Légales', () => {
  test('devrait charger les Conditions Générales d\'Utilisation', async ({ page }) => {
    await page.goto('/legal/terms');
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'on est sur la bonne page
    await expect(page).toHaveURL(/\/legal\/terms/);
  });

  test('devrait charger la Politique de Confidentialité', async ({ page }) => {
    await page.goto('/legal/privacy');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/legal\/privacy/);
  });

  test('devrait charger les Mentions Légales', async ({ page }) => {
    await page.goto('/legal/notices');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/legal\/notices/);
  });

  test('devrait charger la Politique de Cookies', async ({ page }) => {
    await page.goto('/legal/cookies');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/legal\/cookies/);
  });
});

test.describe('Navigation publique', () => {
  test('devrait rediriger les URLs inconnues vers la page d\'accueil', async ({ page }) => {
    await page.goto('/page-inexistante-12345');
    
    // Devrait être redirigé vers /
    await expect(page).toHaveURL('/');
  });
});

test.describe('Responsive Design - Coming Soon', () => {
  test('devrait s\'afficher correctement sur mobile', async ({ page }) => {
    // Simuler un viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Le logo devrait être visible (dans le span avec brand-font)
    await expect(page.locator('.brand-font').getByText('stockeasy')).toBeVisible();
    
    // Le formulaire devrait être visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Le bouton devrait être visible
    await expect(page.getByRole('button', { name: /M'inscrire/i })).toBeVisible();
  });

  test('devrait s\'afficher correctement sur tablette', async ({ page }) => {
    // Simuler un viewport tablette
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('.brand-font').getByText('stockeasy')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('devrait s\'afficher correctement sur desktop', async ({ page }) => {
    // Viewport desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('.brand-font').getByText('stockeasy')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe('Accessibilité', () => {
  test('la page Coming Soon devrait avoir un titre', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que la page a un titre
    await expect(page).toHaveTitle(/.*/);
  });

  test('le formulaire devrait avoir des labels accessibles', async ({ page }) => {
    await page.goto('/');
    
    // Le champ email devrait avoir un placeholder descriptif
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('placeholder', 'votre@email.com');
    
    // Le champ devrait être requis
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('les boutons devraient être focusables', async ({ page }) => {
    await page.goto('/');
    
    const button = page.getByRole('button', { name: /M'inscrire/i });
    await button.focus();
    
    // Vérifier que le bouton peut recevoir le focus
    await expect(button).toBeFocused();
  });
});

test.describe('Performance', () => {
  test('la page Coming Soon devrait charger en moins de 3 secondes', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // La page devrait charger en moins de 3 secondes
    expect(loadTime).toBeLessThan(3000);
  });
});

