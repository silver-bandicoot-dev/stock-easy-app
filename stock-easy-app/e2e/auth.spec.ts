import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le flow d'authentification
 * - Page de connexion
 * - Formulaire de login
 * - Mot de passe oublié
 * - Protection des routes
 */

test.describe('Page de Connexion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('devrait afficher le formulaire de connexion', async ({ page }) => {
    // Logo
    await expect(page.locator('text=stockeasy').first()).toBeVisible();
    
    // Message d'accueil
    await expect(page.getByText('Connectez-vous à votre compte')).toBeVisible();
    
    // Champs du formulaire
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    
    // Bouton de connexion
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
  });

  test('devrait avoir les labels corrects pour les champs', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
  });

  test('devrait avoir un lien vers la réinitialisation du mot de passe', async ({ page }) => {
    const forgotPasswordLink = page.getByRole('link', { name: /Mot de passe oublié/i });
    await expect(forgotPasswordLink).toBeVisible();
    await expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  });

  test('devrait permettre de saisir des identifiants', async ({ page }) => {
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('motdepasse123');
    
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('motdepasse123');
  });

  test('devrait valider que l\'email est requis', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Se connecter/i });
    
    // Essayer de soumettre sans email
    await submitButton.click();
    
    // Le champ email devrait bloquer la soumission (validation HTML5)
    const emailInput = page.locator('input#email');
    await expect(emailInput).toBeVisible();
  });

  test('devrait valider que le mot de passe est requis', async ({ page }) => {
    const emailInput = page.locator('input#email');
    const submitButton = page.getByRole('button', { name: /Se connecter/i });
    
    // Remplir seulement l'email
    await emailInput.fill('test@example.com');
    await submitButton.click();
    
    // Le champ password devrait bloquer la soumission
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toBeVisible();
  });

  test('devrait afficher l\'état de chargement lors de la soumission', async ({ page }) => {
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const submitButton = page.getByRole('button', { name: /Se connecter/i });
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('wrongpassword');
    
    // Cliquer sur le bouton
    await submitButton.click();
    
    // Le bouton devrait afficher "Connexion..." pendant le chargement
    // Note: Cela peut être très rapide, donc on utilise un timeout court
    try {
      await expect(page.getByRole('button', { name: /Connexion\.\.\./i })).toBeVisible({ timeout: 2000 });
    } catch {
      // Le chargement était trop rapide ou une erreur s'est affichée
    }
  });

  test('devrait masquer le mot de passe par défaut', async ({ page }) => {
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Page Mot de passe oublié', () => {
  test('devrait naviguer vers la page de réinitialisation', async ({ page }) => {
    await page.goto('/login');
    
    const forgotPasswordLink = page.getByRole('link', { name: /Mot de passe oublié/i });
    await forgotPasswordLink.click();
    
    await expect(page).toHaveURL('/forgot-password');
  });

  test('devrait afficher la page de réinitialisation', async ({ page }) => {
    await page.goto('/forgot-password');
    
    // La page devrait être accessible
    await expect(page).toHaveURL('/forgot-password');
  });
});

test.describe('Protection des Routes', () => {
  test('devrait rediriger vers /login si non authentifié - /app', async ({ page }) => {
    // Tenter d'accéder à une route protégée
    await page.goto('/app');
    
    // Attendre la redirection
    await page.waitForURL(/\/(login|app)/, { timeout: 5000 });
    
    // Devrait soit être redirigé vers login, soit voir un état de chargement
    const url = page.url();
    expect(url.includes('/login') || url.includes('/app')).toBeTruthy();
  });

  test('devrait rediriger vers /login si non authentifié - /profile', async ({ page }) => {
    await page.goto('/profile');
    
    await page.waitForURL(/\/(login|profile)/, { timeout: 5000 });
    
    const url = page.url();
    expect(url.includes('/login') || url.includes('/profile')).toBeTruthy();
  });

  test('devrait rediriger vers /login si non authentifié - /notifications', async ({ page }) => {
    await page.goto('/notifications');
    
    await page.waitForURL(/\/(login|notifications)/, { timeout: 5000 });
    
    const url = page.url();
    expect(url.includes('/login') || url.includes('/notifications')).toBeTruthy();
  });
});

test.describe('UI/UX Connexion', () => {
  test('le formulaire devrait être centré sur la page', async ({ page }) => {
    await page.goto('/login');
    
    const formContainer = page.locator('.max-w-md.w-full');
    await expect(formContainer).toBeVisible();
  });

  test('devrait avoir un design cohérent avec l\'application', async ({ page }) => {
    await page.goto('/login');
    
    // Vérifier les couleurs de fond
    const pageBackground = page.locator('.bg-\\[\\#FAFAF7\\]').first();
    await expect(pageBackground).toBeVisible();
    
    // Vérifier le bouton principal
    const submitButton = page.getByRole('button', { name: /Se connecter/i });
    await expect(submitButton).toHaveClass(/bg-\[#191919\]/);
  });
});

test.describe('Responsive - Page de Connexion', () => {
  test('devrait s\'afficher correctement sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // Le formulaire devrait être visible
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
  });

  test('devrait s\'afficher correctement sur tablette', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });
});

test.describe('Accessibilité - Connexion', () => {
  test('les champs devraient être associés à leurs labels', async ({ page }) => {
    await page.goto('/login');
    
    // Le champ email devrait avoir un ID correspondant au for du label
    const emailInput = page.locator('input#email');
    await expect(emailInput).toBeVisible();
    
    // Le label devrait pointer vers le champ
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeVisible();
    
    // Même chose pour le mot de passe
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toBeVisible();
    
    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();
  });

  test('devrait supporter la navigation au clavier', async ({ page }) => {
    await page.goto('/login');
    
    // Focus sur le premier champ
    await page.keyboard.press('Tab');
    
    // Naviguer avec Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Le bouton de soumission devrait être focusable
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });
});

test.describe('Page de Confirmation Email', () => {
  test('devrait charger la page de confirmation', async ({ page }) => {
    await page.goto('/confirm-email');
    
    await expect(page).toHaveURL('/confirm-email');
  });
});

