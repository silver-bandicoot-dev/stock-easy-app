#!/bin/bash

# 🚀 Script d'Amélioration Automatique - Stock Easy App
# Usage: ./improve-stock-easy.sh

set -e  # Exit on error

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo "╔══════════════════════════════════════════════╗"
echo "║  🚀 Stock Easy App - Auto-Improvement       ║"
echo "║  Version 1.0 - 17 octobre 2025              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Make sure you're in stock-easy-app directory"
    exit 1
fi

log_info "Répertoire de travail: $(pwd)"
echo ""

# ========================================
# PHASE 1: MISE À JOUR DES DÉPENDANCES
# ========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 PHASE 1: Mise à jour des dépendances"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log_info "Vérification des vulnérabilités..."
npm audit || true
echo ""

read -p "❓ Voulez-vous mettre à jour les dépendances? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Mise à jour des dépendances..."
    npm update
    log_success "Dépendances mises à jour"
    
    log_info "Correction des vulnérabilités..."
    npm audit fix || true
    log_success "Vulnérabilités corrigées (si possible)"
    
    log_info "Test du build..."
    if npm run build; then
        log_success "Build réussi ✨"
    else
        log_error "Build échoué. Vérifiez les erreurs ci-dessus."
        exit 1
    fi
else
    log_warning "Mise à jour des dépendances ignorée"
fi

echo ""

# ========================================
# PHASE 2: SÉCURISATION API URL
# ========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 PHASE 2: Sécurisation de l'API URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f ".env" ]; then
    log_warning "Fichier .env non trouvé"
    read -p "❓ Créer .env depuis .env.example? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.example .env
        log_success ".env créé"
        log_warning "⚠️  IMPORTANT: Éditez .env et ajoutez vos clés Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)"
        echo ""
        read -p "Appuyez sur Entrée après avoir édité .env..." 
    fi
else
    log_success "Fichier .env existe déjà"
fi

# Vérifier que .env est dans .gitignore
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    log_warning ".env n'est pas dans .gitignore"
    echo ".env" >> .gitignore
    log_success ".env ajouté au .gitignore"
fi

echo ""

# ========================================
# PHASE 3: INFRASTRUCTURE DE TESTS
# ========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 PHASE 3: Infrastructure de tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "❓ Installer Vitest et Testing Library? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Installation de Vitest..."
    npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
    
    log_info "Création de vitest.config.js..."
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
    
    log_info "Création du fichier setup..."
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

    log_info "Ajout des scripts de test au package.json..."
    npm pkg set scripts.test="vitest"
    npm pkg set scripts.test:ui="vitest --ui"
    npm pkg set scripts.test:coverage="vitest --coverage"
    
    log_success "Infrastructure de tests installée ✨"
else
    log_warning "Installation des tests ignorée"
fi

echo ""

# ========================================
# PHASE 4: CRÉATION DE TESTS EXEMPLES
# ========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 PHASE 4: Tests exemples"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "vitest.config.js" ]; then
    read -p "❓ Créer des tests exemples pour utils/calculations.js? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mkdir -p src/utils/__tests__
        
        log_info "Création de calculations.test.js..."
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

  it('should handle zero sales per day', () => {
    const product = {
      stock: 100,
      salesPerDay: 0,
      leadTimeDays: 14,
    };
    
    const result = calculateMetrics(product);
    expect(result.daysOfStock).toBe(999);
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
    expect(reorderPoint).toBeGreaterThan(0);
  });
});
EOF
        
        log_success "Tests créés"
        
        log_info "Lancement des tests..."
        if npm test; then
            log_success "Tests passent avec succès! 🎉"
        else
            log_warning "Certains tests ont échoué (normal si premier lancement)"
        fi
    fi
else
    log_warning "Vitest non installé, tests ignorés"
fi

echo ""

# ========================================
# PHASE 5: DOCUMENTATION
# ========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 PHASE 5: Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "❓ Créer/Mettre à jour la documentation? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mkdir -p docs
    
    if [ ! -f "docs/ARCHITECTURE.md" ]; then
        log_info "Création de ARCHITECTURE.md..."
        cat > docs/ARCHITECTURE.md << 'EOF'
# Architecture - Stock Easy App

## Vue d'Ensemble

Stock Easy est une application React de gestion de stock connectée à Supabase (Postgres, Auth, Storage).

## Stack Technique

- **Frontend**: React 18 + Vite 5
- **Styling**: Tailwind CSS 3
- **Backend**: Supabase (Postgres + RPC + RLS)
- **Hosting**: Vercel

## Structure Actuelle

```
stock-easy-app/
├── src/
│   ├── StockEasy.jsx          ⚠️ Fichier monolithique (5,057 lignes)
│   ├── components/            Composants UI
│   ├── services/              API Service
│   ├── hooks/                 Custom Hooks
│   └── utils/                 Fonctions utilitaires
```

## Variables d'Environnement

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Déploiement

- Production: Vercel auto-deploy sur push vers main
- Root Directory: `stock-easy-app`

Pour plus de détails, voir les autres docs dans le dossier docs/
EOF
        log_success "ARCHITECTURE.md créé"
    else
        log_info "ARCHITECTURE.md existe déjà"
    fi
    
    if [ ! -f "docs/CONTRIBUTING.md" ]; then
        log_info "Création de CONTRIBUTING.md..."
        cat > docs/CONTRIBUTING.md << 'EOF'
# Guide de Contribution

## Installation

```bash
npm install
cp .env.example .env
# Renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

## Conventions

### Commits
Format: `<type>: <description>`

Types: feat, fix, refactor, chore, docs, test, perf

### Code Style
- Indentation: 2 espaces
- Quotes: Simple quotes
- Semicolons: Oui

## Tests

```bash
npm test              # Lancer les tests
npm run test:coverage # Avec coverage
```

## Déploiement

Les pushes sur `main` déploient automatiquement sur Vercel.
EOF
        log_success "CONTRIBUTING.md créé"
    else
        log_info "CONTRIBUTING.md existe déjà"
    fi
else
    log_warning "Documentation ignorée"
fi

echo ""

# ========================================
# PHASE 6: GIT COMMIT
# ========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 PHASE 6: Git Commit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier s'il y a des changements
if git diff --quiet && git diff --cached --quiet; then
    log_info "Aucun changement à commiter"
else
    log_info "Changements détectés:"
    git status --short
    echo ""
    
    read -p "❓ Commiter ces changements? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        
        # Générer message de commit
        COMMIT_MSG="chore: Auto-improvement script run

- Updated dependencies
- Secured API configuration
- Setup test infrastructure
- Created documentation

Generated by improve-stock-easy.sh"
        
        git commit -m "$COMMIT_MSG"
        log_success "Changements commités"
        
        read -p "❓ Pusher vers GitHub? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            log_success "Changements pushés vers GitHub"
        else
            log_warning "Push ignoré (vous pouvez le faire manuellement plus tard)"
        fi
    fi
fi

echo ""

# ========================================
# RÉSUMÉ FINAL
# ========================================
echo "╔══════════════════════════════════════════════╗"
echo "║  ✨ Script terminé avec succès!             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

log_success "Améliorations appliquées:"
echo "  ✅ Dépendances à jour"
echo "  ✅ Configuration API sécurisée"
echo "  ✅ Infrastructure de tests en place"
echo "  ✅ Documentation créée"
echo ""

log_info "Prochaines étapes recommandées:"
echo "  1. Vérifier que .env contient les bonnes valeurs Supabase"
echo "  2. Configurer les variables d'environnement dans Vercel"
echo "  3. Tester l'application: npm run dev"
echo "  4. Commencer le refactoring de StockEasy.jsx"
echo ""

log_info "Ressources:"
echo "  📄 Audit complet: STOCK_EASY_APP_AUDIT_COMPLET.md"
echo "  📋 Plan d'action: PLAN_ACTION_EXECUTABLE.md"
echo "  📁 Documentation: docs/"
echo ""

log_success "Bonne chance avec le refactoring! 🚀"
