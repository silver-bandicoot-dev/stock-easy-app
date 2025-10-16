# 📘 GUIDE D'UTILISATION - PHASE 4

Guide rapide pour utiliser les nouvelles fonctionnalités de la Phase 4.

---

## 🎯 MODALS AVANCÉS

### OrderModal - Créer/Modifier une commande

```javascript
import { OrderModal } from './components/modals';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (orderData) => {
    await api.createOrder(orderData);
  };

  return (
    <OrderModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      order={null} // ou order existant pour éditer
      suppliers={suppliersData}
      products={productsData}
      onSubmit={handleSubmit}
    />
  );
}
```

### ReconciliationModal - Rapprocher une commande

```javascript
import { ReconciliationModal } from './components/modals';

function MyComponent() {
  const handleReconcile = async (reconciliationData) => {
    await api.reconcileOrder(reconciliationData);
  };

  return (
    <ReconciliationModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      order={orderToReconcile}
      onReconcile={handleReconcile}
    />
  );
}
```

---

## 🎨 DRAG & DROP KANBAN

### OrdersKanban

```javascript
import { OrdersKanban } from './components/orders/OrdersKanban';

function OrdersView() {
  const [orders, setOrders] = useState([]);

  const handleStatusChange = async (orderId, newStatus) => {
    await api.updateOrderStatus(orderId, newStatus);
  };

  return (
    <OrdersKanban
      orders={orders}
      onStatusChange={handleStatusChange}
    />
  );
}
```

---

## 📦 ACTIONS EN MASSE

### BulkActionsBar

```javascript
import { BulkActionsBar } from './components/products/BulkActionsBar';
import { exportProducts } from './utils/exportUtils';

function ProductsView() {
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  const handleBulkExport = () => {
    const data = products.filter(p => selectedProducts.has(p.sku));
    exportProducts(data, 'excel'); // ou 'csv', 'pdf'
  };

  return (
    <>
      {/* Votre liste de produits */}
      
      <BulkActionsBar
        selectedCount={selectedProducts.size}
        onClearSelection={() => setSelectedProducts(new Set())}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={handleBulkEdit}
        onBulkExport={handleBulkExport}
        onBulkTag={handleBulkTag}
      />
    </>
  );
}
```

---

## 📊 EXPORTS

### Utiliser les fonctions d'export

```javascript
import { 
  exportToCSV, 
  exportToExcel, 
  exportToPDF,
  exportProducts,
  exportOrders 
} from './utils/exportUtils';

// Export simple
const data = [
  { name: 'Produit A', price: 10 },
  { name: 'Produit B', price: 20 }
];

exportToCSV(data, 'mes-produits.csv');
exportToExcel(data, 'mes-produits.xlsx', 'Feuille1');
exportToPDF(data, 'mes-produits.pdf', 'Titre du PDF');

// Export formaté pour produits/commandes
exportProducts(products, 'excel'); // Format automatique
exportOrders(orders, 'pdf'); // Format automatique
```

---

## ✨ ANIMATIONS

### PageTransition

```javascript
import { PageTransition } from './components/animations';

function MyView() {
  return (
    <PageTransition>
      <div>Contenu de la page</div>
    </PageTransition>
  );
}
```

### StaggerChildren

```javascript
import { StaggerChildren } from './components/animations';

function MyList() {
  return (
    <StaggerChildren>
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </StaggerChildren>
  );
}
```

### AnimatedButton & FloatingActionButton

```javascript
import { AnimatedButton } from './components/ui/AnimatedButton';
import { FloatingActionButton } from './components/ui/FloatingActionButton';
import { Plus } from 'lucide-react';

function MyComponent() {
  return (
    <>
      <AnimatedButton onClick={handleClick}>
        Cliquez-moi
      </AnimatedButton>

      <FloatingActionButton 
        onClick={handleAdd}
        icon={Plus}
      />
    </>
  );
}
```

---

## 🎓 ONBOARDING

### AppTour

```javascript
import { AppTour } from './components/onboarding/AppTour';

function App() {
  return (
    <>
      <YourApp />
      <AppTour /> {/* S'affiche automatiquement à la première visite */}
    </>
  );
}
```

Pour réinitialiser le tour :
```javascript
localStorage.removeItem('stock-easy-tour-completed');
```

---

## ⌨️ RACCOURCIS CLAVIER

### useKeyboardShortcuts hook

```javascript
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  useKeyboardShortcuts({
    'ctrl+k': () => {
      document.getElementById('search-bar')?.focus();
    },
    'ctrl+n': () => {
      setShowProductModal(true);
    },
    'ctrl+shift+o': () => {
      navigate('/orders');
    },
    'ctrl+s': (e) => {
      e.preventDefault();
      handleSave();
    },
    'esc': () => {
      closeAllModals();
    },
    '?': () => {
      setShowShortcutsHelp(true);
    }
  });

  return <YourApp />;
}
```

### KeyboardShortcutsHelp

```javascript
import { KeyboardShortcutsHelp } from './components/ui/KeyboardShortcutsHelp';

function App() {
  return (
    <>
      <YourApp />
      <KeyboardShortcutsHelp /> {/* Bouton en bas à gauche */}
    </>
  );
}
```

---

## 📊 ANALYTICS

### AnalyticsView

```javascript
import { AnalyticsView } from './views/AnalyticsView';

function App() {
  return (
    <Routes>
      <Route path="/analytics" element={<AnalyticsView />} />
    </Routes>
  );
}
```

---

## 🐛 ERROR TRACKING

### Configuration Sentry

Dans `main.jsx` :
```javascript
import { initSentry } from './services/sentry';

initSentry(); // Initialiser avant React

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
```

### Utiliser logError

```javascript
import { logError } from './services/sentry';

try {
  await api.createProduct(data);
} catch (error) {
  logError(error, {
    component: 'ProductForm',
    action: 'create',
    data
  });
  toast.error('Erreur lors de la création');
}
```

---

## ⚡ PERFORMANCE MONITORING

```javascript
import { PerformanceMonitor } from './services/performance';

// Mesurer une opération synchrone
PerformanceMonitor.measure('render-list', () => {
  renderComplexList();
});

// Mesurer une opération asynchrone
await PerformanceMonitor.measureAsync('load-products', async () => {
  return await api.getAllProducts();
});

// Mesure manuelle
PerformanceMonitor.start('custom-operation');
// ... code ...
const duration = PerformanceMonitor.end('custom-operation');
```

---

## 💬 FEEDBACK WIDGET

### FeedbackWidget

```javascript
import { FeedbackWidget } from './components/feedback/FeedbackWidget';

function App() {
  return (
    <>
      <YourApp />
      <FeedbackWidget /> {/* Bouton flottant en bas à droite */}
    </>
  );
}
```

---

## 📱 PWA

### Installation

La PWA est automatiquement activée. Les utilisateurs verront une invite d'installation sur :
- Mobile (iOS/Android)
- Desktop (Chrome, Edge, etc.)

### Vérifier le Service Worker

```javascript
// Dans la console navigateur
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### Forcer la mise à jour du cache

```javascript
// Dans service-worker.js, incrémenter la version
const CACHE_NAME = 'stock-easy-v2'; // au lieu de v1
```

---

## 🔧 HOOKS UTILITAIRES

### useLocalStorage

```javascript
import { useLocalStorage } from './hooks/useLocalStorage';

function MyComponent() {
  const [settings, setSettings] = useLocalStorage('app-settings', {
    theme: 'light',
    language: 'fr'
  });

  return (
    <button onClick={() => setSettings({ ...settings, theme: 'dark' })}>
      Changer de thème
    </button>
  );
}
```

---

## 🎨 COMPOSANTS UI

### Input

```javascript
import { Input } from './components/ui/Input';
import { Search } from 'lucide-react';

<Input
  label="Recherche"
  placeholder="Rechercher..."
  icon={Search}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

### Select

```javascript
import { Select } from './components/ui/Select';

<Select
  label="Catégorie"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
>
  <option value="">Sélectionner</option>
  <option value="electronics">Électronique</option>
  <option value="clothing">Vêtements</option>
</Select>
```

---

## 🚀 DÉPLOIEMENT

### Variables d'environnement

Créer `.env` :
```env
VITE_API_URL=https://api.stock-easy.com
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Build et déploiement

```bash
# Installer les dépendances
npm install

# Build de production
npm run build

# Tester le build localement
npm run preview

# Déployer sur Vercel
vercel --prod
```

---

## 🧪 TESTS

### Tester le Drag & Drop

1. Aller sur la vue Kanban
2. Glisser une commande d'une colonne à une autre
3. Vérifier que le statut est mis à jour

### Tester les exports

```javascript
// Dans la console
import { exportProducts } from './utils/exportUtils';
const products = [...]; // vos produits
exportProducts(products, 'csv');
```

### Tester le mode offline (PWA)

1. Ouvrir DevTools > Application > Service Workers
2. Cocher "Offline"
3. Recharger la page
4. L'app devrait fonctionner en mode cache

### Tester l'onboarding

```javascript
// Réinitialiser le tour
localStorage.removeItem('stock-easy-tour-completed');
// Recharger la page
```

---

## 📋 CHECKLIST DE DÉPLOIEMENT

- [ ] Toutes les variables d'environnement sont configurées
- [ ] Le build passe sans erreurs (`npm run build`)
- [ ] Le Service Worker fonctionne
- [ ] Les exports fonctionnent (CSV, Excel, PDF)
- [ ] Le drag & drop fonctionne
- [ ] L'onboarding s'affiche à la première visite
- [ ] Les raccourcis clavier fonctionnent
- [ ] Le widget de feedback envoie les données
- [ ] Sentry reçoit les erreurs
- [ ] Les analytics s'affichent correctement

---

## 🆘 DÉPANNAGE

### Le Service Worker ne se charge pas
```javascript
// Vérifier dans la console
navigator.serviceWorker.controller
// Si null, réenregistrer
navigator.serviceWorker.register('/service-worker.js')
```

### Les raccourcis clavier ne fonctionnent pas
- Vérifier que le hook `useKeyboardShortcuts` est bien appelé
- Vérifier qu'aucun input n'a le focus

### Les exports ne fonctionnent pas
- Vérifier que les dépendances sont installées : `xlsx`, `jspdf`
- Vérifier la console pour les erreurs

### Le drag & drop ne fonctionne pas
- Vérifier que `@dnd-kit/*` est installé
- Vérifier que les IDs sont uniques

---

## 📚 RESSOURCES

- [Documentation Framer Motion](https://www.framer.com/motion/)
- [Documentation DnD Kit](https://dndkit.com/)
- [Documentation Sentry React](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Documentation Recharts](https://recharts.org/)
- [Documentation React Joyride](https://docs.react-joyride.com/)

---

**Bon développement avec Stock Easy Phase 4 ! 🚀**
