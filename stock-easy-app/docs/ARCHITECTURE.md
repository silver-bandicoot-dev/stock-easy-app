# Architecture - Stock Easy App

## Vue d'Ensemble

Stock Easy est une application React de gestion de stock connectée à Google Apps Script.

## Stack Technique

- **Frontend**: React 18 + Vite 5
- **Styling**: Tailwind CSS 3
- **Backend**: Google Apps Script (API REST)
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

- `VITE_API_URL`: URL de l'API Google Apps Script

## Déploiement

- Production: Vercel auto-deploy sur push vers main
- Root Directory: `stock-easy-app`

Pour plus de détails, voir les autres docs dans le dossier docs/
