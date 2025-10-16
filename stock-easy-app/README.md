# 📦 Stock Easy - Application de Gestion de Stock

> Application web moderne pour la gestion intelligente de stock avec Google Sheets comme backend

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.3-38bdf8.svg)](https://tailwindcss.com)
[![Status](https://img.shields.io/badge/status-Phase%203%20Complete-success.svg)](https://github.com)

## 🌟 Aperçu

Stock Easy est une application de gestion de stock intelligente qui calcule automatiquement les métriques de santé de votre inventaire et vous aide à optimiser vos commandes fournisseurs.

### ✨ Fonctionnalités Principales

- 📊 **Dashboard Intelligent** - KPIs en temps réel et recommandations
- 📦 **Gestion Produits** - Suivi de stock avec métriques de santé automatiques
- 🛒 **Commandes Fournisseurs** - Création et suivi de commandes
- 🚚 **Suivi & Réconciliation** - Gestion des livraisons
- ⚙️ **Paramètres** - Configuration personnalisable
- 🌙 **Dark Mode** - Interface jour/nuit
- 📱 **Responsive** - Fonctionne sur tous les écrans

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 16+ 
- npm ou yarn
- Backend Google Apps Script configuré

### Installation

```bash
# Cloner le projet
cd stock-easy-app

# Installer les dépendances
npm install

# Configurer l'API
# Éditer src/config/api.js avec votre URL Google Apps Script

# Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Build Production

```bash
# Créer le build
npm run build

# Tester le build
npm run preview
```

## 📁 Structure du Projet

```
stock-easy-app/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── ui/             # Design system (Button, Card, Badge)
│   │   ├── layout/         # Layout (Header, Sidebar, Container)
│   │   ├── features/       # Composants métier
│   │   └── shared/         # Utilitaires UI
│   ├── hooks/              # Hooks personnalisés
│   ├── views/              # Vues principales
│   ├── services/           # Services API
│   ├── utils/              # Fonctions utilitaires
│   ├── config/             # Configuration
│   └── App.jsx             # Application principale
├── public/                 # Fichiers statiques
└── dist/                   # Build de production
```

## 🎨 Design System

### Composants UI

| Composant | Description | Variants |
|-----------|-------------|----------|
| `Button` | Bouton avec icônes | 8 styles, 3 tailles |
| `Card` | Carte de contenu | Hoverable, padding |
| `Badge` | Étiquette | 5 couleurs, 3 tailles |
| `LoadingState` | Chargement | Fullscreen option |
| `EmptyState` | État vide | Avec actions |

### Palette de Couleurs

```css
Primary:   Indigo  (#4F46E5)
Success:   Emerald (#10B981)
Warning:   Amber   (#F59E0B)
Danger:    Rose    (#EF4444)
Neutral:   Slate   (#64748B)
```

## 🔌 API & Backend

### Configuration

Éditez `src/config/api.js` :

```javascript
export const API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

### Endpoints Disponibles

- `getAllData` - Récupérer tous les produits, commandes, fournisseurs
- `updateProduct` - Mettre à jour un produit
- `updateStock` - Mettre à jour le stock
- `createOrder` - Créer une commande
- `updateOrderStatus` - Modifier le statut d'une commande
- `createSupplier` - Créer un fournisseur
- `updateParameter` - Modifier un paramètre

## 🪝 Hooks Personnalisés

### useProducts

```javascript
import { useProducts } from './hooks';

const { products, loading, updateProduct, updateStock } = useProducts(seuilSurstock);
```

### useOrders

```javascript
import { useOrders } from './hooks';

const { orders, loading, createOrder, updateOrderStatus } = useOrders();
```

### useSuppliers

```javascript
import { useSuppliers } from './hooks';

const { suppliers, suppliersList, createSupplier } = useSuppliers();
```

## 📊 Vues Principales

### Dashboard
- KPIs : Total produits, Urgents, Valeur stock, Commandes actives
- Distribution de santé du stock
- Actions rapides recommandées

### Products
- Liste de produits avec cartes détaillées
- Recherche en temps réel
- Filtres par statut de santé
- Métriques : stock, autonomie, ventes/jour

### Orders (Phase 4)
- Création de commandes fournisseurs
- Liste et suivi des commandes
- Envoi automatique par email

### Tracking (Phase 4)
- Suivi des commandes en transit
- Réconciliation des livraisons
- Mise à jour automatique du stock

### Settings
- Configuration devise (EUR/USD/GBP)
- Paramétrage des seuils
- Gestion fournisseurs
- Mapping produits-fournisseurs

## 🌙 Dark Mode

Le dark mode est automatiquement persisté dans le localStorage et s'applique à toute l'interface.

```javascript
// Toggle dans le Header
<Button icon={darkMode ? Sun : Moon} onClick={toggleDarkMode} />
```

## 📱 Responsive Design

### Breakpoints

```javascript
sm:   640px   // Mobile
md:   768px   // Tablet
lg:   1024px  // Desktop
xl:   1280px  // Large Desktop
```

### Adaptations
- Sidebar : Overlay (mobile) → Fixe (desktop)
- Grilles : 1 col → 2 cols → 3 cols
- Navigation : Bottom (mobile) → Side (desktop)

## 🧪 Tests

### Build de Production

```bash
npm run build
# ✓ 1278 modules transformés
# ✓ Compilé en ~1.3s
# Bundle: 223 KB JS + 39 KB CSS
```

### Tests Manuels

- [ ] Dashboard affiche les KPIs
- [ ] Products : recherche et filtres fonctionnent
- [ ] Navigation fluide entre vues
- [ ] Dark mode opérationnel
- [ ] Responsive sur mobile/tablet/desktop

## 📚 Documentation

### Guides Disponibles
- 📄 [PHASE_3_COMPLETE.md](./PHASE_3_COMPLETE.md) - Documentation complète Phase 3
- 📖 [GUIDE_PHASE_3.md](./GUIDE_PHASE_3.md) - Guide utilisateur
- 🏗️ [STRUCTURE_PROJET.md](./STRUCTURE_PROJET.md) - Architecture détaillée
- 📝 [CHANGELOG.md](./CHANGELOG.md) - Historique des modifications

## 🔧 Scripts NPM

```bash
# Développement
npm run dev          # Lance le serveur de dev (port 5173)

# Production
npm run build        # Build optimisé pour production
npm run preview      # Preview du build

# Maintenance
npm install          # Installer les dépendances
npm audit            # Vérifier les vulnérabilités
```

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Netlify

```bash
# Build
npm run build

# Déployer le dossier dist/
```

### Configuration Vercel

Créer `vercel.json` :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## 🛣️ Roadmap

### ✅ Phase 1-3 (Complété)
- [x] Architecture modulaire
- [x] Design system
- [x] Dashboard & Products
- [x] Settings basiques
- [x] Dark mode
- [x] Responsive design

### 🚧 Phase 4 (En cours)
- [ ] OrdersView complète
- [ ] TrackingView avec réconciliation
- [ ] Gestion fournisseurs avancée
- [ ] Mapping produits-fournisseurs
- [ ] Envoi emails automatiques

### 🔮 Phase 5 (Futur)
- [ ] Analytics & Graphiques
- [ ] Prévisions ML
- [ ] Rapports personnalisables
- [ ] Export PDF/Excel
- [ ] Notifications push
- [ ] PWA support
- [ ] Multi-utilisateurs

## 🤝 Contribution

### Setup Développement

```bash
# Fork le projet
git clone https://github.com/your-username/stock-easy-app

# Créer une branche
git checkout -b feature/ma-fonctionnalite

# Faire vos modifications

# Commit
git commit -m "feat: ajout de ma fonctionnalité"

# Push
git push origin feature/ma-fonctionnalite
```

### Standards de Code

- ESLint pour le linting
- Prettier pour le formatting
- Conventional Commits pour les messages
- Composants fonctionnels React
- Hooks pour la logique

## 📄 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails

## 👥 Auteurs

- **Phase 1-2** : Développement initial
- **Phase 3** : Refonte architecture (2025-10-16)

## 🙏 Remerciements

- React Team pour React 18
- Tailwind Labs pour Tailwind CSS
- Lucide pour les icônes
- Google pour Apps Script

## 📞 Support

### Issues
Créer une issue sur GitHub avec :
- Description du problème
- Steps to reproduce
- Screenshots si applicable

### Documentation
- [React Docs](https://react.dev)
- [Tailwind Docs](https://tailwindcss.com)
- [Vite Docs](https://vitejs.dev)

---

<div align="center">

**Stock Easy v2.0** - Gestion de stock intelligente

Made with ❤️ using React & Tailwind CSS

[Documentation](./PHASE_3_COMPLETE.md) • [Guide](./GUIDE_PHASE_3.md) • [Architecture](./STRUCTURE_PROJET.md)

</div>
