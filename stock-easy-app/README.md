# Stock Easy App

Application de gestion intelligente des stocks construite avec React et Vite.

## 🚀 Démarrage Rapide

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```

### Build de production
```bash
npm run build
```

### Preview du build
```bash
npm run preview
```

## 📦 Technologies

- **React 18.2** - Framework UI
- **Vite 5.0** - Build tool et dev server
- **Supabase** - Backend (Auth, Database, RPC)
- **Tailwind CSS 3.3** - Styling
- **Framer Motion 11.0** - Animations
- **Lucide React** - Icônes
- **Sonner** - Notifications toast

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

### Configuration Supabase

L'application utilise Supabase pour :
- ✅ Authentification utilisateur
- ✅ Base de données PostgreSQL
- ✅ Fonctions RPC (Remote Procedure Calls)
- ✅ Real-time synchronisation
- ✅ Row Level Security (RLS)

Pour plus de détails, consultez `VERIFICATION_SUPABASE_COMPLETE.md`.

## 📚 Documentation

### Documentation principale
- `docs/ARCHITECTURE.md` - Architecture de l'application
- `docs/SECURITY.md` - Sécurité et bonnes pratiques
- `docs/SURSTOCK_PROFOND_CALCULATION.md` - Calcul du surstock profond
- `docs/MIGRATION_COMPLETE_FIREBASE_TO_SUPABASE.md` - Migration vers Supabase

### Guides
- `docs/DEPLOYMENT_GUIDE.md` - Guide de déploiement
- `docs/CONTRIBUTING.md` - Guide de contribution

## 🎯 Fonctionnalités Principales

- 📊 **Gestion des stocks** - Suivi en temps réel
- 📈 **Analytics** - KPIs et indicateurs de performance
- 🤖 **Intelligence Artificielle** - Prévisions et optimisations
- 📦 **Gestion des commandes** - Workflow complet
- 👥 **Multi-tenant** - Isolation des données par entreprise
- 🔔 **Notifications** - Alertes et rappels

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests avec couverture
npm run test:coverage
```

## 📝 Structure du Projet

```
stock-easy-app/
├── src/
│   ├── components/     # Composants React
│   ├── services/      # Services API Supabase
│   ├── hooks/         # Hooks personnalisés
│   ├── utils/         # Utilitaires et calculs
│   └── contexts/      # Contextes React
├── supabase/
│   └── migrations/    # Migrations SQL
└── docs/              # Documentation
```

## 🔗 Liens Utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation React](https://react.dev)
- [Documentation Vite](https://vitejs.dev)
