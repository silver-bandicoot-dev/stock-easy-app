# 🚀 Guide de Démarrage - Phase 3

## Démarrage Rapide

### 1. Installation
```bash
cd stock-easy-app
npm install
```

### 2. Configuration API
Vérifiez que votre `src/config/api.js` contient l'URL correcte de votre backend Google Apps Script.

### 3. Lancer l'Application

**Mode Développement**:
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`

**Build Production**:
```bash
npm run build
npm run preview
```

## 🎯 Fonctionnalités Disponibles

### Dashboard (/)
- Vue d'ensemble des KPIs
- Statistiques de santé du stock
- Actions rapides recommandées

### Produits (/products)
- Liste de tous les produits
- Recherche par nom ou SKU
- Filtres par statut de santé
- Cartes détaillées avec métriques

### Commander (/orders)
- Placeholder pour création de commandes
- Sera complété en Phase 4

### Suivi & Gestion (/track)
- Placeholder pour suivi des commandes
- Réconciliation (Phase 4)

### Paramètres (/parameters)
- Configuration générale (devise, seuils)
- Gestion fournisseurs (Phase 4)
- Mapping produits-fournisseurs (Phase 4)

## 🎨 Interface Utilisateur

### Navigation
- **Header**: Logo, notifications, dark mode toggle
- **Sidebar**: Navigation principale (responsive)
- **Mobile**: Sidebar en overlay, navigation bottom

### Dark Mode
- Toggle dans le header (icône lune/soleil)
- Persisté automatiquement dans localStorage
- Appliqué à toute l'interface

### Notifications
- Badge sur l'icône cloche
- Compte des produits urgents

## 🔧 Configuration

### Paramètres Modifiables
- **Devise**: EUR, USD, GBP
- **Seuil Surstock**: Nombre de jours
- **Multiplicateur**: Coefficient de prévision

### Persistence
- Dark mode → localStorage
- Paramètres → Google Sheets (via API)

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Adaptations
- Sidebar: Overlay (mobile) → Fixe (desktop)
- Grids: 1 col → 2 cols → 3 cols
- Typography: Redimensionnement automatique

## 🐛 Débogage

### Console Logs
L'application affiche des logs utiles :
- ✅ Succès (vert)
- ❌ Erreurs (rouge)
- 📊 Statistiques au démarrage

### Erreurs Communes

**API non accessible**:
- Vérifier `src/config/api.js`
- Vérifier la connexion internet
- Vérifier les CORS sur le backend

**Build échoue**:
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Dark mode ne fonctionne pas**:
- Vérifier que Tailwind est configuré pour le dark mode
- Vérifier `tailwind.config.js` → `darkMode: 'class'`

## 🔍 Structure du Code

### Hooks Personnalisés
```javascript
// Exemple d'utilisation
import { useProducts, useOrders } from './hooks';

const { products, loading, updateProduct } = useProducts(seuilSurstock);
```

### Composants UI
```javascript
// Exemple d'utilisation
import { Button, Card, Badge } from './components/ui';

<Button variant="primary" size="lg" icon={Plus}>
  Nouvelle Commande
</Button>
```

### Vues
```javascript
// Chaque vue est autonome
import DashboardView from './views/DashboardView';

<DashboardView products={products} orders={orders} />
```

## 🎯 Checklist de Validation

### Tests Fonctionnels
- [ ] Dashboard affiche les bons KPIs
- [ ] Products: recherche fonctionne
- [ ] Products: filtres fonctionnent
- [ ] Navigation entre vues fluide
- [ ] Dark mode toggle opérationnel
- [ ] Paramètres se sauvegardent

### Tests Responsive
- [ ] Mobile (375px): Sidebar overlay
- [ ] Tablet (768px): Layout adapté
- [ ] Desktop (1920px): Sidebar fixe

### Tests Performance
- [ ] Pas de lag au changement de vue
- [ ] Recherche fluide (debounce actif)
- [ ] Pas d'erreurs console

## 📚 Prochaines Étapes

1. **Valider Phase 3**
   - Tester toutes les fonctionnalités
   - Vérifier responsive
   - Confirmer la stabilité

2. **Préparer Phase 4**
   - Finaliser OrdersView
   - Compléter TrackingView
   - Ajouter réconciliation

3. **Optimisations**
   - Code splitting avancé
   - Lazy loading des vues
   - Cache API intelligent

## 🆘 Support

### Ressources
- Documentation React: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Lucide Icons: https://lucide.dev

### Logs Utiles
```javascript
// Activer les logs détaillés
localStorage.setItem('debug', 'true');
```

---

**Version**: 2.0.0
**Date**: 2025-10-16
**Auteur**: Migration Phase 3
