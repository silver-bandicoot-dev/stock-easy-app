# 📁 Structure du Projet - Stock Easy v2.0

## 🌳 Arborescence Complète

```
stock-easy-app/
├── 📄 Configuration
│   ├── package.json                  # Dépendances et scripts
│   ├── vite.config.js               # Configuration Vite
│   ├── tailwind.config.js           # Configuration Tailwind
│   ├── postcss.config.js            # Configuration PostCSS
│   └── index.html                   # Point d'entrée HTML
│
├── 📂 src/
│   ├── 🎨 components/
│   │   ├── ui/                      # Design System
│   │   │   ├── Badge/
│   │   │   │   ├── Badge.jsx        # Composant Badge
│   │   │   │   └── index.js
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx       # Composant Button (8 variants)
│   │   │   │   └── index.js
│   │   │   ├── Card.jsx             # Card + sous-composants
│   │   │   └── index.js
│   │   │
│   │   ├── layout/                  # Composants de layout
│   │   │   ├── Container.jsx        # Conteneur responsive
│   │   │   ├── Header.jsx           # En-tête avec navigation
│   │   │   ├── Sidebar.jsx          # Sidebar responsive
│   │   │   └── index.js
│   │   │
│   │   ├── features/                # Composants métier
│   │   │   └── Products/
│   │   │       └── ProductCard.jsx  # Carte produit avec métriques
│   │   │
│   │   └── shared/                  # Composants partagés
│   │       ├── LoadingState.jsx     # État de chargement
│   │       └── EmptyState.jsx       # État vide
│   │
│   ├── 🪝 hooks/                    # Hooks personnalisés
│   │   ├── useDebounce.js           # Debounce pour inputs
│   │   ├── useProducts.js           # Gestion produits + métriques
│   │   ├── useOrders.js             # Gestion commandes
│   │   ├── useSuppliers.js          # Gestion fournisseurs
│   │   └── index.js
│   │
│   ├── 📊 views/                    # Vues principales
│   │   ├── DashboardView.jsx        # Dashboard avec KPIs
│   │   ├── ProductsView.jsx         # Liste produits + filtres
│   │   ├── OrdersView.jsx           # Commandes (placeholder)
│   │   ├── TrackingView.jsx         # Suivi (placeholder)
│   │   └── SettingsView.jsx         # Paramètres
│   │
│   ├── 🔌 services/                 # Services API
│   │   └── apiService.js            # Toutes les fonctions API
│   │
│   ├── 🛠️ utils/                    # Utilitaires
│   │   ├── calculations.js          # Calculs métriques
│   │   ├── constants.js             # Constantes
│   │   ├── formatting.js            # Formatage (dates, nombres)
│   │   ├── testApi.js               # Tests API
│   │   ├── fullApiTest.js
│   │   └── index.js
│   │
│   ├── ⚙️ config/                   # Configuration
│   │   └── api.js                   # URL API
│   │
│   ├── 📝 types/                    # Types/Interfaces
│   │   └── interfaces.js
│   │
│   ├── App.jsx                      # ✨ Application principale (NOUVELLE)
│   ├── StockEasy.jsx                # ⚠️ Ancienne version (à conserver)
│   ├── main.jsx                     # Point d'entrée React
│   └── index.css                    # Styles globaux
│
├── 📚 Documentation
│   ├── PHASE_3_COMPLETE.md          # Résumé Phase 3
│   ├── GUIDE_PHASE_3.md             # Guide utilisateur
│   ├── STRUCTURE_PROJET.md          # Ce fichier
│   └── README.md                    # README principal
│
└── 📦 Build
    └── dist/                        # Fichiers de production
        ├── index.html
        └── assets/
            ├── index-[hash].css
            └── index-[hash].js
```

## 📊 Statistiques

### Fichiers Créés (Phase 3)
- **Total fichiers**: 35 fichiers source
- **Hooks**: 4 hooks métier
- **Composants UI**: 7 composants
- **Vues**: 5 vues principales
- **Services**: 1 service API centralisé

### Taille du Build
- **JavaScript**: 223.62 kB (66.11 kB gzippé)
- **CSS**: 39.19 kB (6.74 kB gzippé)
- **Temps de build**: ~1.35s

## 🎯 Composants par Catégorie

### UI Components (Design System)
| Composant | Fichier | Description |
|-----------|---------|-------------|
| Badge | `ui/Badge/Badge.jsx` | 5 variants, 3 tailles |
| Button | `ui/Button/Button.jsx` | 8 variants, loading state |
| Card | `ui/Card.jsx` | + Header, Content, Footer |

### Layout Components
| Composant | Fichier | Description |
|-----------|---------|-------------|
| Container | `layout/Container.jsx` | Conteneur responsive |
| Header | `layout/Header.jsx` | Nav + dark mode + notifs |
| Sidebar | `layout/Sidebar.jsx` | Menu responsive |

### Feature Components
| Composant | Fichier | Description |
|-----------|---------|-------------|
| ProductCard | `features/Products/ProductCard.jsx` | Carte produit complète |

### Shared Components
| Composant | Fichier | Description |
|-----------|---------|-------------|
| LoadingState | `shared/LoadingState.jsx` | État de chargement |
| EmptyState | `shared/EmptyState.jsx` | État vide avec actions |

### Views
| Vue | Fichier | Description |
|-----|---------|-------------|
| Dashboard | `views/DashboardView.jsx` | KPIs + stats |
| Products | `views/ProductsView.jsx` | Liste + filtres |
| Orders | `views/OrdersView.jsx` | Placeholder Phase 4 |
| Tracking | `views/TrackingView.jsx` | Placeholder Phase 4 |
| Settings | `views/SettingsView.jsx` | Paramètres |

### Hooks
| Hook | Fichier | Description |
|------|---------|-------------|
| useDebounce | `hooks/useDebounce.js` | Debounce valeurs |
| useProducts | `hooks/useProducts.js` | CRUD produits + métriques |
| useOrders | `hooks/useOrders.js` | CRUD commandes |
| useSuppliers | `hooks/useSuppliers.js` | CRUD fournisseurs |

## 🔄 Flux de Données

```
┌─────────────┐
│   main.jsx  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   App.jsx   │◄──── Hooks métier (useProducts, useOrders, etc.)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│            Views Layer              │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Dashb.│ │Prods.│ │Setti.│  ...   │
│  └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│        Components Layer             │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Cards │ │Button│ │Badge │  ...   │
│  └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Services Layer              │
│        ┌──────────────┐             │
│        │  apiService  │             │
│        └──────┬───────┘             │
└───────────────┼─────────────────────┘
                │
                ▼
        Google Apps Script API
```

## 🎨 Design Tokens

### Couleurs
```javascript
primary:   Indigo  (600/500)
success:   Emerald (500-700)
warning:   Amber   (500-700)
danger:    Rose    (500-700)
neutral:   Slate   (50-900)
```

### Espacements
```javascript
sm:   0.5rem  (8px)
md:   1rem    (16px)
lg:   1.5rem  (24px)
xl:   2rem    (32px)
```

### Breakpoints
```javascript
sm:   640px
md:   768px
lg:   1024px
xl:   1280px
2xl:  1536px
```

## 🚀 Scripts NPM

```bash
# Développement
npm run dev          # Démarre le serveur de dev (port 5173)

# Production
npm run build        # Build pour production (dist/)
npm run preview      # Preview du build de production

# Utilitaires
npm install          # Installe les dépendances
npm audit            # Vérifier les vulnérabilités
```

## 📦 Dépendances Principales

### Production
- `react` ^18.2.0
- `react-dom` ^18.2.0
- `lucide-react` ^0.263.1 (icônes)
- `sonner` ^1.4.0 (toasts)
- `framer-motion` ^11.0.0 (animations)
- `lodash.debounce` ^4.0.8

### Développement
- `vite` ^5.0.8
- `tailwindcss` ^3.3.6
- `autoprefixer` ^10.4.16
- `postcss` ^8.4.32

## 🔐 Fichiers Sensibles

### À ne PAS committer
- `node_modules/`
- `dist/`
- `.env` (si créé)
- `*.log`

### À configurer
- `src/config/api.js` → URL de votre API Google Apps Script

## 📝 Notes de Migration

### Fichiers Conservés
- ✅ `StockEasy.jsx` - Ancienne version (référence)
- ✅ Tous les utils existants
- ✅ Configuration API existante

### Fichiers Nouveaux
- ✨ `App.jsx` - Nouvelle app modulaire
- ✨ Tous les composants dans `components/`
- ✨ Toutes les vues dans `views/`
- ✨ Tous les hooks dans `hooks/`

### Changements Majeurs
1. **Architecture**: Monolithe → Modulaire
2. **State**: Local → Hooks personnalisés
3. **Navigation**: Props drilling → State global
4. **Styling**: Inline → Tailwind classes
5. **Loading**: Manual → LoadingState component

## ✅ Checklist de Déploiement

- [ ] Tester en local (`npm run dev`)
- [ ] Vérifier le build (`npm run build`)
- [ ] Tester le build (`npm run preview`)
- [ ] Vérifier responsive (mobile/tablet/desktop)
- [ ] Tester dark mode
- [ ] Valider toutes les vues
- [ ] Vérifier connexion API
- [ ] Tester sur différents navigateurs

## 🎉 Prochaines Améliorations

### Phase 4 (À venir)
1. Compléter OrdersView (création commandes)
2. Compléter TrackingView (suivi + réconciliation)
3. Gestion fournisseurs dans Settings
4. Mapping produits-fournisseurs

### Optimisations Futures
1. Code splitting par route
2. Lazy loading des vues
3. Cache API avec React Query
4. PWA support
5. Tests unitaires (Vitest)
6. E2E tests (Playwright)

---

**Version**: 2.0.0
**Date**: 2025-10-16
**Statut**: ✅ Phase 3 Complète
