# Tests E2E StockEasy

Ce dossier contient les tests end-to-end (E2E) pour l'application StockEasy, utilisant **Playwright**.

## 📁 Structure

```
e2e/
├── fixtures/           # Données de test
│   └── test-data.ts   # Constantes et mocks
├── utils/             # Utilitaires partagés
│   └── helpers.ts     # Fonctions helper
├── public-pages.spec.ts     # Tests pages publiques
├── auth.spec.ts             # Tests authentification
├── app-navigation.spec.ts   # Tests navigation app
├── global-setup.ts          # Configuration globale
└── README.md               # Ce fichier
```

## 🚀 Démarrage rapide

### Installation

```bash
# Installer les dépendances
npm install

# Installer les navigateurs Playwright
npx playwright install
```

### Exécution des tests

```bash
# Exécuter tous les tests E2E
npm run test:e2e

# Mode interactif (UI)
npm run test:e2e:ui

# Mode headed (voir les navigateurs)
npm run test:e2e:headed

# Mode debug
npm run test:e2e:debug

# Tests sur un navigateur spécifique
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Tests mobiles
npm run test:e2e:mobile

# Voir le rapport
npm run test:e2e:report
```

## 📝 Scripts disponibles

| Script | Description |
|--------|-------------|
| `test:e2e` | Exécute tous les tests E2E |
| `test:e2e:ui` | Lance l'interface UI de Playwright |
| `test:e2e:headed` | Exécute avec les navigateurs visibles |
| `test:e2e:debug` | Mode debug pas à pas |
| `test:e2e:chromium` | Tests uniquement sur Chrome |
| `test:e2e:firefox` | Tests uniquement sur Firefox |
| `test:e2e:webkit` | Tests uniquement sur Safari |
| `test:e2e:mobile` | Tests sur émulateurs mobiles |
| `test:e2e:report` | Affiche le dernier rapport |
| `test:e2e:update-snapshots` | Met à jour les snapshots |

## 🧪 Tests couverts

### Pages publiques (`public-pages.spec.ts`)
- ✅ Page Coming Soon (/)
- ✅ Page Landing Preview (/preview)
- ✅ Pages légales (/legal/*)
- ✅ Tests responsive (mobile, tablette, desktop)
- ✅ Tests d'accessibilité
- ✅ Tests de performance

### Authentification (`auth.spec.ts`)
- ✅ Formulaire de connexion
- ✅ Validation des champs
- ✅ Lien mot de passe oublié
- ✅ Protection des routes
- ✅ Tests responsive

### Navigation App (`app-navigation.spec.ts`)
- ✅ Routing public/protégé
- ✅ Deep linking
- ✅ Régression visuelle
- ⏸️ Navigation authentifiée (requiert credentials)

## 🔧 Configuration

### Variables d'environnement

Pour les tests avec authentification réelle :

```bash
# .env.test
TEST_USER_EMAIL=test@stockeasy.app
TEST_USER_PASSWORD=votre_mot_de_passe
PLAYWRIGHT_BASE_URL=http://localhost:5173
```

### Configuration Playwright

Le fichier `playwright.config.ts` à la racine contient :

- **Navigateurs** : Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Timeouts** : 60s par test, 10s par action
- **Artifacts** : Screenshots, vidéos et traces en cas d'échec
- **Serveur** : Lance automatiquement `npm run dev`

## 📸 Régression visuelle

Les tests de régression visuelle capturent des screenshots pour comparaison :

```bash
# Mettre à jour les snapshots de référence
npm run test:e2e:update-snapshots

# Les snapshots sont stockés dans e2e/**/*-snapshots/
```

## 🔄 CI/CD

Le workflow GitHub Actions (`.github/workflows/e2e-tests.yml`) :

- **Déclencheurs** : Push sur main/develop, PR, quotidien à 6h
- **Matrix** : Tests parallèles sur Chromium, Firefox, WebKit
- **Artifacts** : Rapports conservés 30 jours
- **Mobile** : Tests sur émulateurs Pixel 5 et iPhone 12

## 📖 Bonnes pratiques

### Écrire un nouveau test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ma fonctionnalité', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ma-page');
  });

  test('devrait faire quelque chose', async ({ page }) => {
    // Arrange
    await page.fill('input#mon-champ', 'valeur');
    
    // Act
    await page.click('button[type="submit"]');
    
    // Assert
    await expect(page.locator('.resultat')).toBeVisible();
  });
});
```

### Utiliser les helpers

```typescript
import { login, waitForAppLoaded, navigateToTab } from './utils/helpers';

test('test authentifié', async ({ page }) => {
  await login(page, 'email@test.com', 'password');
  await waitForAppLoaded(page);
  await navigateToTab(page, 'dashboard');
});
```

### Utiliser les fixtures

```typescript
import { testUrls, breakpoints } from './fixtures/test-data';

test('test responsive', async ({ page }) => {
  await page.setViewportSize(breakpoints.mobile);
  await page.goto(testUrls.public.home);
});
```

## 🐛 Debugging

### Mode debug
```bash
npm run test:e2e:debug
```

### Voir les traces
```bash
npx playwright show-trace playwright-results/trace.zip
```

### Screenshots manuels
```typescript
await page.screenshot({ path: 'debug.png' });
```

## 📊 Rapports

Après chaque exécution, un rapport HTML est généré :

```bash
npm run test:e2e:report
```

Le rapport inclut :
- Résultats par test
- Screenshots en cas d'échec
- Vidéos des échecs
- Traces de débogage

## 🤝 Contribuer

1. Ajouter les tests dans le fichier `.spec.ts` approprié
2. Utiliser les helpers existants
3. Ajouter les données de test dans `fixtures/`
4. Mettre à jour ce README si nécessaire
5. S'assurer que tous les tests passent avant de commit

