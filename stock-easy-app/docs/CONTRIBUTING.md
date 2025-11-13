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
