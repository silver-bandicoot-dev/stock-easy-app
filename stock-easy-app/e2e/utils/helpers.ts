import { Page, expect } from '@playwright/test';
import { testUrls, timeouts } from '../fixtures/test-data';

/**
 * Utilitaires pour les tests E2E StockEasy
 */

/**
 * Se connecter à l'application
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto(testUrls.public.login);
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
  
  // Attendre soit la redirection vers /app, soit un message d'erreur
  await Promise.race([
    page.waitForURL('/app', { timeout: timeouts.long }),
    page.waitForSelector('.toast-error, [data-sonner-toast][data-type="error"]', { 
      timeout: timeouts.long 
    }),
  ]).catch(() => {
    // Ignorer les erreurs de timeout
  });
}

/**
 * Se déconnecter de l'application
 */
export async function logout(page: Page): Promise<void> {
  // Chercher et cliquer sur le bouton de déconnexion
  const logoutButton = page.locator('button:has-text("Se déconnecter")');
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('/login', { timeout: timeouts.navigation });
  }
}

/**
 * Naviguer vers un onglet spécifique de l'application
 */
export async function navigateToTab(
  page: Page,
  tabName: string
): Promise<void> {
  const tabSelectors: Record<string, string> = {
    dashboard: 'Tableau de bord',
    actions: 'Passer Commande',
    orders: 'Mes Commandes',
    stock: 'Niveaux de Stock',
    inventory: 'Inventaire',
    analytics: 'Analytics',
    settings: 'Paramètres',
    profile: 'Mon profil',
    help: "Centre d'aide",
  };

  const selector = tabSelectors[tabName];
  if (selector) {
    await page.click(`text=${selector}`);
    await page.waitForTimeout(500); // Attendre l'animation
  }
}

/**
 * Attendre que le chargement soit terminé
 */
export async function waitForAppLoaded(page: Page): Promise<void> {
  // Attendre que le skeleton de chargement disparaisse
  await page.waitForSelector('[data-testid="skeleton-dashboard"]', {
    state: 'detached',
    timeout: timeouts.long,
  }).catch(() => {
    // Le skeleton peut ne pas être présent
  });
  
  // Attendre que le contenu soit chargé
  await page.waitForLoadState('networkidle');
}

/**
 * Vérifier qu'il n'y a pas d'erreurs dans la console
 */
export async function checkNoConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      // Ignorer certaines erreurs attendues
      const text = msg.text();
      if (
        !text.includes('401') &&
        !text.includes('403') &&
        !text.includes('Failed to load resource') &&
        !text.includes('net::ERR_')
      ) {
        errors.push(text);
      }
    }
  });
  
  return errors;
}

/**
 * Ouvrir la modal de recherche (Cmd+K)
 */
export async function openSearchModal(page: Page): Promise<void> {
  await page.keyboard.press('Meta+k');
  await page.waitForSelector('[data-testid="search-modal"]', {
    timeout: timeouts.short,
  }).catch(() => {
    // La modal peut être un composant différent
  });
}

/**
 * Fermer la modal de recherche
 */
export async function closeSearchModal(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
}

/**
 * Obtenir le nombre de notifications
 */
export async function getNotificationCount(page: Page): Promise<number> {
  const badge = page.locator('[data-testid="notification-badge"]');
  
  if (await badge.isVisible()) {
    const text = await badge.textContent();
    return parseInt(text || '0', 10);
  }
  
  return 0;
}

/**
 * Attendre une notification toast
 */
export async function waitForToast(
  page: Page,
  type: 'success' | 'error' | 'info' = 'success'
): Promise<void> {
  const selector = type === 'error' 
    ? '[data-sonner-toast][data-type="error"]'
    : type === 'success'
    ? '[data-sonner-toast][data-type="success"]'
    : '[data-sonner-toast]';
    
  await page.waitForSelector(selector, { timeout: timeouts.medium });
}

/**
 * Vérifier si l'utilisateur est sur mobile
 */
export async function isMobileViewport(page: Page): Promise<boolean> {
  const viewport = page.viewportSize();
  return viewport ? viewport.width < 768 : false;
}

/**
 * Ouvrir le menu mobile
 */
export async function openMobileMenu(page: Page): Promise<void> {
  if (await isMobileViewport(page)) {
    const menuButton = page.locator('button:has(svg.lucide-menu)');
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }
  }
}

/**
 * Fermer le menu mobile
 */
export async function closeMobileMenu(page: Page): Promise<void> {
  if (await isMobileViewport(page)) {
    // Cliquer en dehors ou sur le bouton de fermeture
    await page.keyboard.press('Escape');
  }
}

/**
 * Prendre un screenshot pour comparaison
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({
    path: `playwright-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Simuler une connexion lente
 */
export async function simulateSlowNetwork(page: Page): Promise<void> {
  const cdpSession = await page.context().newCDPSession(page);
  await cdpSession.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 500 * 1024 / 8, // 500kb/s
    uploadThroughput: 500 * 1024 / 8,
    latency: 200,
  });
}

/**
 * Vérifier les erreurs d'accessibilité basiques
 */
export async function checkBasicA11y(page: Page): Promise<{
  hasTitle: boolean;
  hasMainLandmark: boolean;
  imagesHaveAlt: boolean;
}> {
  const title = await page.title();
  const main = await page.locator('main').count();
  
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  
  return {
    hasTitle: title.length > 0,
    hasMainLandmark: main > 0,
    imagesHaveAlt: imagesWithoutAlt === 0,
  };
}

/**
 * Attendre que les animations soient terminées
 */
export async function waitForAnimations(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const animations = document.getAnimations();
    return animations.every(animation => 
      animation.playState === 'finished' || animation.playState === 'idle'
    );
  }, { timeout: timeouts.medium }).catch(() => {
    // Timeout, continuer quand même
  });
}

/**
 * Vérifier qu'un élément est visible dans le viewport
 */
export async function isInViewport(
  page: Page,
  selector: string
): Promise<boolean> {
  const element = page.locator(selector);
  
  if (!(await element.isVisible())) {
    return false;
  }
  
  const box = await element.boundingBox();
  const viewport = page.viewportSize();
  
  if (!box || !viewport) {
    return false;
  }
  
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height
  );
}

