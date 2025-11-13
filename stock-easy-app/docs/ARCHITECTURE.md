# Architecture - Stock Easy App

## Vue d'Ensemble

Stock Easy est une application React de gestion de stock adossée à Supabase (Postgres, Auth, Storage, Edge Functions).

## Stack Technique

- **Frontend**: React 18 + Vite 5
- **Styling**: Tailwind CSS 3
- **Backend**: Supabase (Postgres + RPC + Row Level Security)
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

- `VITE_SUPABASE_URL`: URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY`: clé anonyme pour le client web

## Déploiement

- Production: Vercel auto-deploy sur push vers main
- Root Directory: `stock-easy-app`

Pour plus de détails, voir les autres docs dans le dossier docs/
