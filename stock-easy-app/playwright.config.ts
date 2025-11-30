import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour StockEasy
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Dossier contenant les tests E2E
  testDir: './e2e',
  
  // Exécuter les tests en parallèle dans les fichiers
  fullyParallel: true,
  
  // Échouer le build si test.only est laissé dans le code
  forbidOnly: !!process.env.CI,
  
  // Nombre de retries (plus en CI)
  retries: process.env.CI ? 2 : 0,
  
  // Workers parallèles
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter de sortie
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  
  // Configuration partagée pour tous les tests
  use: {
    // URL de base de l'application
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    // Collecter les traces en cas d'échec (utile pour le debug)
    trace: 'on-first-retry',
    
    // Capture d'écran en cas d'échec
    screenshot: 'only-on-failure',
    
    // Vidéo en cas d'échec
    video: 'on-first-retry',
    
    // Timeout pour les actions
    actionTimeout: 10000,
    
    // Timeout de navigation
    navigationTimeout: 30000,
  },
  
  // Timeout global par test
  timeout: 60000,
  
  // Configuration des projets (navigateurs)
  projects: [
    // Tests Desktop
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Tests Mobile
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Serveur de développement local
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  // Dossier de sortie pour les artefacts
  outputDir: 'playwright-results',
  
  // Configuration expect
  expect: {
    // Timeout pour les assertions
    timeout: 10000,
  },
});

