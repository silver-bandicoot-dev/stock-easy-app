# 🎯 PLAN D'ACTION EXÉCUTABLE - STOCK EASY APP

**Date**: 17 octobre 2025  
**Basé sur**: Audit complet du repository

---

## 🚀 ACTIONS IMMÉDIATES (Aujourd'hui - 4 heures)

### ✅ Étape 1: Mise à Jour des Dépendances (30 min)

```bash
# Naviguer vers le projet
cd stock-easy-app

# Vérifier les vulnérabilités
npm audit

# Mettre à jour toutes les dépendances
npm update

# Corriger les vulnérabilités automatiquement
npm audit fix

# Si des vulnérabilités persistent
npm audit fix --force  # ATTENTION: peut casser la compatibilité

# Vérifier que tout fonctionne encore
npm run build

# Tester localement
npm run dev

# Commit
git add package.json package-lock.json
git commit -m "chore: Update dependencies and fix security vulnerabilities"
git push origin main
```

**Vérifications:**
- [ ] Build réussit sans erreur
- [ ] Application démarre en dev mode
- [ ] Aucune régression visuelle
- [ ] Deploy Vercel réussit

---

### ✅ Étape 2: Sécuriser l'API URL (1 heure)

#### 2.1 Modifier `src/config/api.js`

**Avant:**
```javascript
export const API_URL = import.meta.env.VITE_API_URL || 
  'https://script.google.com/macros/s/AKfycbz.../exec';
```

**Après:**
```javascript
export const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('❌ VITE_API_URL n\'est pas définie dans les variables d\'environnement');
  throw new Error('Missing VITE_API_URL environment variable. Please check your .env file.');
}

export const API_CONFIG = {
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

export default API_URL;
```

#### 2.2 Créer `.env` local

```bash
# Créer le fichier .env à la racine de stock-easy-app/
cat > .env << 'EOF'
# API URL pour Google Apps Script
VITE_API_URL=https://script.google.com/macros/s/VOTRE_URL_ICI/exec
EOF

# S'assurer que .env est dans .gitignore
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
```

#### 2.3 Configurer Vercel Environment Variables

**Via Dashboard Vercel:**
1. Aller sur https://vercel.com/silver-bandicoot-devs-projects/stock-easy-app/settings/environment-variables
2. Ajouter `VITE_API_URL` pour tous les environnements:
   - Production
   - Preview
   - Development

**Via CLI Vercel:**
```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Login
vercel login

# Ajouter la variable d'environnement
vercel env add VITE_API_URL
# Sélectionner: Production, Preview, Development
# Coller l'URL de votre API Google Apps Script

# Redéployer pour prendre en compte les nouvelles variables
vercel --prod
```

#### 2.4 Commit et Test

```bash
git add src/config/api.js .env.example .gitignore
git commit -m "security: Remove hardcoded API URL and use environment variables"
git push origin main
```

**Vérifications:**
- [ ] `.env` n'est PAS dans Git
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Build Vercel réussit
- [ ] Application fonctionne en production

---

### ✅ Étape 3: Créer Documentation Architecture (1 heure)

```bash
# Créer le dossier docs s'il n'existe pas
mkdir -p docs

# Créer ARCHITECTURE.md
cat > docs/ARCHITECTURE.md << 'EOF'
# Architecture - Stock Easy App

## Vue d'Ensemble

Stock Easy est une application React de gestion de stock connectée à Google Apps Script.

## Stack Technique

- **Frontend**: React 18 + Vite 5
- **Styling**: Tailwind CSS 3
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Backend**: Google Apps Script (API REST)
- **Hosting**: Vercel

## Structure Actuelle

```
stock-easy-app/
├── src/
│   ├── StockEasy.jsx          ⚠️ Fichier monolithique (5,057 lignes)
│   ├── main.jsx               Point d'entrée
│   ├── components/            Composants UI
│   ├── services/              API Service
│   ├── hooks/                 Custom Hooks
│   ├── utils/                 Fonctions utilitaires
│   └── config/                Configuration
└── package.json
```

## Problèmes Identifiés

1. **Fichier Monolithique**: StockEasy.jsx contient tous les composants
2. **Absence de Tests**: Aucun test unitaire ou d'intégration
3. **Pas de TypeScript**: Typage faible

## Structure Cible (À Implémenter)

```
src/
├── App.jsx                    Composant principal
├── main.jsx                   Point d'entrée
│
├── views/                     Vues principales
│   ├── DashboardView.jsx
│   ├── ProductsView/
│   ├── OrdersView/
│   └── SuppliersView/
│
├── components/
│   ├── ui/                    Composants réutilisables
│   ├── features/              Feature components
│   └── layout/                Layout components
│
├── hooks/                     Custom React Hooks
├── services/                  API Services
├── utils/                     Utilitaires
├── context/                   State Management
└── types/                     Type Definitions
```

## Flux de Données

```
UI Components
    ↓
Custom Hooks (useProducts, useOrders)
    ↓
API Service (apiService.js)
    ↓
Google Apps Script API
    ↓
Google Sheets
```

## Variables d'Environnement

- `VITE_API_URL`: URL de l'API Google Apps Script

## Déploiement

- **Production**: https://stock-easy-app.vercel.app
- **CI/CD**: GitHub → Vercel (auto-deploy sur push)
- **Root Directory**: `stock-easy-app`

## Roadmap

- [ ] Phase 1: Refactoring StockEasy.jsx
- [ ] Phase 2: Tests unitaires
- [ ] Phase 3: Migration TypeScript
- [ ] Phase 4: Optimisations performance
EOF

git add docs/ARCHITECTURE.md
git commit -m "docs: Add architecture documentation"
```

---

### ✅ Étape 4: Créer Guide de Contribution (30 min)

```bash
cat > docs/CONTRIBUTING.md << 'EOF'
# Guide de Contribution - Stock Easy App

## Prérequis

- Node.js 18+
- npm 9+
- Git
- Compte Vercel (pour déploiement)

## Installation Locale

```bash
# Cloner le repository
git clone https://github.com/silver-bandicoot-dev/stock-easy-app.git
cd stock-easy-app/stock-easy-app

# Installer les dépendances
npm install

# Créer .env
cp .env.example .env
# Éditer .env avec votre VITE_API_URL

# Lancer en mode dev
npm run dev
```

## Conventions de Code

### Commits

Format: `<type>: <description>`

Types:
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `refactor`: Refactoring sans changement de comportement
- `chore`: Maintenance (dépendances, config)
- `docs`: Documentation
- `test`: Tests
- `perf`: Optimisation performance

Exemples:
```
feat: Add supplier management
fix: Correct stock calculation in product card
refactor: Extract Button component from StockEasy.jsx
chore: Update dependencies
```

### Code Style

- **Indentation**: 2 espaces
- **Quotes**: Simple quotes pour strings
- **Semicolons**: Oui
- **Trailing commas**: Oui
- **Max line length**: 100 caractères

### Composants React

```javascript
// Nom de fichier: PascalCase
// ProductCard.jsx

import React from 'react';

/**
 * Affiche une carte produit
 * @param {Object} props
 * @param {Product} props.product - Données du produit
 */
export function ProductCard({ product }) {
  return (
    <div className="...">
      {/* ... */}
    </div>
  );
}
```

### Hooks Custom

```javascript
// Nom de fichier: camelCase avec préfixe use
// useProducts.js

import { useState, useEffect } from 'react';

/**
 * Hook pour gérer les produits
 * @returns {Object} { products, loading, error, refetch }
 */
export function useProducts() {
  // ...
}
```

## Workflow de Développement

1. Créer une branche depuis `main`
   ```bash
   git checkout -b feature/nom-de-la-feature
   ```

2. Développer et commit régulièrement
   ```bash
   git add .
   git commit -m "feat: Add product filter"
   ```

3. Tester localement
   ```bash
   npm run build  # Vérifier que le build passe
   ```

4. Push et créer Pull Request
   ```bash
   git push origin feature/nom-de-la-feature
   ```

5. Attendre review et merge

## Tests (À Venir)

```bash
# Lancer les tests (quand disponibles)
npm test

# Tests avec coverage
npm run test:coverage

# Tests E2E
npm run test:e2e
```

## Déploiement

- Les pushes sur `main` déclenchent un déploiement automatique sur Vercel
- Les PRs créent des preview deployments
- Vérifier que le build Vercel réussit avant de merger

## Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel Documentation](https://vercel.com/docs)
EOF

git add docs/CONTRIBUTING.md
git commit -m "docs: Add contributing guide"
```

---

### ✅ Étape 5: Setup Infrastructure de Tests (1 heure)

```bash
# Installer Vitest et Testing Library
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Créer vitest.config.js
cat > vitest.config.js << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
EOF

# Créer le fichier setup pour tests
mkdir -p src/test
cat > src/test/setup.js << 'EOF'
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
EOF

# Ajouter scripts au package.json
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:ui="vitest --ui"
npm pkg set scripts.test:coverage="vitest --coverage"

# Créer premier test pour utils/calculations.js
mkdir -p src/utils/__tests__
cat > src/utils/__tests__/calculations.test.js << 'EOF'
import { describe, it, expect } from 'vitest';
import { calculateMetrics, calculateReorderPoint } from '../calculations';

describe('calculateMetrics', () => {
  it('should calculate days of stock correctly', () => {
    const product = {
      stock: 100,
      salesPerDay: 10,
      leadTimeDays: 14,
    };
    
    const result = calculateMetrics(product);
    expect(result.daysOfStock).toBe(10);
  });

  it('should mark as urgent when stock is critically low', () => {
    const product = {
      stock: 5,
      salesPerDay: 10,
      leadTimeDays: 14,
    };
    
    const result = calculateMetrics(product);
    expect(result.healthStatus).toBe('urgent');
    expect(result.healthPercentage).toBeLessThan(30);
  });

  it('should mark as healthy when stock is sufficient', () => {
    const product = {
      stock: 200,
      salesPerDay: 10,
      leadTimeDays: 14,
    };
    
    const result = calculateMetrics(product);
    expect(result.healthStatus).toBe('healthy');
    expect(result.healthPercentage).toBeGreaterThan(50);
  });

  it('should handle zero sales per day', () => {
    const product = {
      stock: 100,
      salesPerDay: 0,
      leadTimeDays: 14,
    };
    
    const result = calculateMetrics(product);
    expect(result.daysOfStock).toBe(999); // Valeur par défaut
  });
});

describe('calculateReorderPoint', () => {
  it('should calculate reorder point correctly', () => {
    const product = {
      salesPerDay: 10,
      leadTimeDays: 14,
      customSecurityStock: 5,
    };
    
    const reorderPoint = calculateReorderPoint(product);
    expect(reorderPoint).toBe(Math.ceil((10 * 14) + (10 * 5))); // 190
  });

  it('should use default security stock if not provided', () => {
    const product = {
      salesPerDay: 10,
      leadTimeDays: 14,
    };
    
    const reorderPoint = calculateReorderPoint(product);
    const expectedSecurityStock = Math.round(14 * 0.2); // 3
    expect(reorderPoint).toBe(Math.ceil((10 * 14) + (10 * expectedSecurityStock)));
  });
});
EOF

# Lancer les tests
npm test

# Commit
git add vitest.config.js src/test/ src/utils/__tests__/ package.json
git commit -m "test: Setup Vitest and add initial tests for calculations utils"
git push origin main
```

**Vérifications:**
- [ ] Tests passent avec succès
- [ ] Coverage disponible avec `npm run test:coverage`

---

## 📅 ACTIONS COURT TERME (Cette Semaine)

### 🔹 Jour 2: Extraire les Composants UI de Base (4 heures)

```bash
# Créer la structure des composants UI
mkdir -p src/components/ui/{Button,Card,Modal,Input,Badge}

# Extraire le composant Button
cat > src/components/ui/Button/Button.jsx << 'EOF'
import React from 'react';
import { RefreshCw } from 'lucide-react';

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  icon: Icon,
  loading = false,
  ...props 
}) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-black text-white hover:bg-[#333333] focus:ring-black shadow-lg',
    secondary: 'bg-[#40403E] text-[#FAFAF7] hover:bg-[#666663] focus:ring-[#40403E]',
    ghost: 'bg-transparent text-black hover:bg-black/10 focus:ring-black',
    danger: 'bg-[#EF1C43] text-white hover:bg-red-700 focus:ring-[#EF1C43] shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600 shadow-sm',
    outline: 'bg-transparent border-2 border-[#E5E4DF] text-[#191919] hover:bg-[#FAFAF7] focus:ring-black',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0" />
      )}
      {children}
    </button>
  );
}
EOF

cat > src/components/ui/Button/index.js << 'EOF'
export { Button } from './Button';
EOF

# Créer tests pour Button
mkdir -p src/components/ui/Button/__tests__
cat > src/components/ui/Button/__tests__/Button.test.jsx << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';
import { Package } from 'lucide-react';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should render with icon', () => {
    render(<Button icon={Package}>With Icon</Button>);
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply variant styles', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button.className).toContain('bg-[#EF1C43]');
  });
});
EOF

# Commit
git add src/components/ui/Button/
git commit -m "refactor: Extract Button component from StockEasy.jsx"
```

---

### 🔹 Jour 3-4: Créer les Hooks Custom (6 heures)

```bash
# Créer useProducts hook
cat > src/hooks/useProducts.js << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import api from '../services/apiService';

/**
 * Hook pour gérer les produits
 * @returns {Object} { products, loading, error, refetch }
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllData();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}
EOF

# Créer useFetch hook générique
cat > src/hooks/useFetch.js << 'EOF'
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook générique pour fetch avec loading et error states
 * @param {Function} fetchFn - Fonction async qui retourne une Promise
 * @param {Array} dependencies - Dépendances pour re-fetch
 * @returns {Object} { data, loading, error, refetch }
 */
export function useFetch(fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetch();
  }, [fetch, ...dependencies]);

  return { data, loading, error, refetch: fetch };
}
EOF

# Créer useLocalStorage hook
cat > src/hooks/useLocalStorage.js << 'EOF'
import { useState, useEffect } from 'react';

/**
 * Hook pour gérer localStorage avec React state
 * @param {string} key - Clé localStorage
 * @param {any} initialValue - Valeur initiale
 * @returns {[any, Function]} [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
  // Lire depuis localStorage au premier render
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Sauvegarder dans localStorage quand la valeur change
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
EOF

# Mettre à jour hooks/index.js
cat > src/hooks/index.js << 'EOF'
export { useDebounce } from './useDebounce';
export { useProducts } from './useProducts';
export { useFetch } from './useFetch';
export { useLocalStorage } from './useLocalStorage';
EOF

# Tests pour useProducts
mkdir -p src/hooks/__tests__
cat > src/hooks/__tests__/useProducts.test.js << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from '../useProducts';
import api from '../../services/apiService';

vi.mock('../../services/apiService');

describe('useProducts', () => {
  it('should fetch products on mount', async () => {
    const mockProducts = [
      { sku: 'TEST-001', name: 'Test Product', stock: 100 },
    ];
    
    api.getAllData.mockResolvedValue({ products: mockProducts });

    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.error).toBe(null);
  });

  it('should handle errors', async () => {
    api.getAllData.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('API Error');
    expect(result.current.products).toEqual([]);
  });
});
EOF

# Commit
git add src/hooks/
git commit -m "feat: Add custom hooks (useProducts, useFetch, useLocalStorage)"
```

---

### 🔹 Jour 5: Documentation et Tests (4 heures)

```bash
# Créer documentation des hooks
cat > docs/HOOKS.md << 'EOF'
# Custom Hooks - Stock Easy App

## useDebounce

Retarde la mise à jour d'une valeur.

```javascript
const searchTerm = useDebounce(inputValue, 500);
```

## useProducts

Récupère et gère les produits depuis l'API.

```javascript
const { products, loading, error, refetch } = useProducts();
```

## useFetch

Hook générique pour fetch avec loading/error states.

```javascript
const { data, loading, error, refetch } = useFetch(
  () => api.getSomeData(),
  [dependency]
);
```

## useLocalStorage

Synchronise un state avec localStorage.

```javascript
const [theme, setTheme] = useLocalStorage('theme', 'light');
```
EOF

# Lancer tous les tests
npm test

# Commit
git add docs/HOOKS.md
git commit -m "docs: Add hooks documentation"
git push origin main
```

---

## 🎯 CHECKLIST DE VALIDATION

### ✅ Phase 1 Complète Quand:

- [ ] Dépendances à jour (`npm update` réussi)
- [ ] Aucune vulnérabilité critique (`npm audit` clean)
- [ ] API URL sécurisée (pas de hardcoded value)
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Infrastructure de tests en place (Vitest installé)
- [ ] Au moins 5 tests passent avec succès
- [ ] Documentation architecture créée
- [ ] Guide de contribution disponible
- [ ] Composant Button extrait et testé
- [ ] Hooks custom créés (useProducts, useFetch, useLocalStorage)
- [ ] Build Vercel réussit
- [ ] Application fonctionne en production

---

## 🚀 PROCHAINES ÉTAPES (Semaines 2-4)

### Semaine 2: Extraction des Vues

```bash
# À créer:
- src/views/ProductsView/
- src/views/OrdersView/
- src/views/DashboardView/
- src/views/SuppliersView/
```

### Semaine 3: Refactoring Complet

- Supprimer StockEasy.jsx
- Créer App.jsx modulaire
- Router avec React Router

### Semaine 4: Migration TypeScript

```bash
npm install -D typescript @types/react @types/react-dom
npx tsc --init
```

---

## 📊 MÉTRIQUES DE SUCCÈS

Suivre ces métriques chaque semaine:

| Métrique | Avant | Cible Semaine 1 | Cible Semaine 4 |
|----------|-------|-----------------|-----------------|
| Lignes dans StockEasy.jsx | 5,057 | 5,057 | 0 (supprimé) |
| Nombre de composants extraits | 0 | 5 | 30+ |
| Test coverage | 0% | 20% | 60%+ |
| Build time | 3.8s | 3.8s | < 3s |
| Bundle size (JS) | 420 KB | 420 KB | < 350 KB |

---

## 🆘 SUPPORT & TROUBLESHOOTING

### Problème: Tests ne passent pas

```bash
# Vérifier la configuration
npm run test -- --reporter=verbose

# Nettoyer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Problème: Build Vercel échoue

```bash
# Tester le build localement
npm run build

# Vérifier les logs Vercel
vercel logs <deployment-url>
```

### Problème: Variables d'environnement non chargées

```bash
# Vérifier que .env existe
cat .env

# Vérifier que Vite préfixe les variables avec VITE_
# Seules les variables VITE_* sont exposées au client
```

---

**Fin du plan d'action - Prêt à exécuter !**
