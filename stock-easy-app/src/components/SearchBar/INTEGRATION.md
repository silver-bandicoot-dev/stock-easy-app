# 🚀 Guide d'intégration rapide - SearchBar

## Installation ✅

Le composant est déjà créé et intégré dans `DashboardLayout.jsx`. Aucune installation supplémentaire nécessaire.

## Structure créée

```
src/components/SearchBar/
├── SearchBar.jsx              ✅ Composant principal
├── SearchDropdown.jsx         ✅ Dropdown des résultats
├── SearchItem.jsx             ✅ Item de suggestion
├── useSearch.js               ✅ Hook personnalisé
├── SearchBarDemo.jsx          ✅ Page de démo
├── index.js                   ✅ Exports
├── README.md                  ✅ Documentation complète
├── INTEGRATION.md            ✅ Ce fichier
└── __tests__/
    └── SearchBar.test.jsx    ✅ Tests unitaires
```

## 🎯 Fonctionnalités implémentées

| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| **Débounce 300ms** | ✅ | Optimisation des requêtes |
| **Raccourci Cmd+K** | ✅ | Focus rapide sur l'input |
| **Navigation clavier** | ✅ | ↑↓ pour naviguer, Enter pour sélectionner |
| **Clear button** | ✅ | Bouton X pour vider la recherche |
| **Dropdown animé** | ✅ | Animation slide-down fluide |
| **Highlight texte** | ✅ | Surbrillance du terme recherché |
| **Groupement catégories** | ✅ | Produits / Fournisseurs / Commandes |
| **Historique local** | ✅ | localStorage avec 10 dernières recherches |
| **Requêtes Supabase** | ✅ | Recherche dans 3 tables simultanément |
| **Responsive** | ✅ | Mobile-friendly |
| **Loading state** | ✅ | Indicateur pendant la recherche |

## 📍 Où est intégré le composant ?

### 1. Layout principal (✅ Déjà fait)

```jsx
// src/components/layout/DashboardLayout.jsx
import { SearchBar } from '../SearchBar';

// Dans le render
<div className="sticky top-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-sm">
  <SearchBar />
</div>
```

Le composant est **visible sur toutes les pages** qui utilisent `DashboardLayout`.

### 2. Pages concernées (automatique)

- ✅ Dashboard (`/`)
- ✅ Stock (`/stock`)
- ✅ Commandes (`/track`)
- ✅ Historique (`/history`)
- ✅ Paramètres (`/settings`)
- ✅ Analytics (`/analytics`)
- ✅ AI/ML (`/ai`)

## 🧪 Tester le composant

### Test en production (dans l'app)

1. Lancer l'application :
   ```bash
   cd stock-easy-app
   npm run dev
   ```

2. Se connecter et accéder à n'importe quelle page

3. Tester les fonctionnalités :
   - Taper `Cmd+K` (ou `Ctrl+K` sur Windows)
   - Rechercher "cab" → devrait afficher des câbles
   - Naviguer avec ↑↓
   - Sélectionner avec Enter

### Test avec la page de démo

Pour tester en isolation, créer une route :

```jsx
// src/App.jsx ou votre router
import { SearchBarDemo } from './components/SearchBar';

<Route path="/demo/search" element={<SearchBarDemo />} />
```

Puis visiter : `http://localhost:5173/demo/search`

### Tests unitaires

```bash
npm test SearchBar
```

## 🔧 Configuration des requêtes Supabase

### Tables utilisées

Le hook `useSearch` effectue 3 requêtes parallèles :

1. **`produits`** (limite : 5 résultats)
   - Recherche sur : `sku`, `nom_produit`
   - Colonnes : `sku`, `nom_produit`, `stock_actuel`, `fournisseur`, `prix_vente`, `image_url`

2. **`fournisseurs`** (limite : 3 résultats)
   - Recherche sur : `nom_fournisseur`
   - Colonnes : `id`, `nom_fournisseur`, `email`, `lead_time_days`

3. **`commandes`** (limite : 3 résultats)
   - Recherche sur : `id`, `supplier`
   - Colonnes : `id`, `supplier`, `status`, `total`, `created_at`

### Optimisation Supabase (recommandé)

Pour améliorer les performances, créer des index :

```sql
-- Index pour recherche rapide sur produits
CREATE INDEX idx_produits_nom_trgm ON produits USING gin (nom_produit gin_trgm_ops);
CREATE INDEX idx_produits_sku_trgm ON produits USING gin (sku gin_trgm_ops);

-- Index pour fournisseurs
CREATE INDEX idx_fournisseurs_nom_trgm ON fournisseurs USING gin (nom_fournisseur gin_trgm_ops);

-- Index pour commandes
CREATE INDEX idx_commandes_supplier_trgm ON commandes USING gin (supplier gin_trgm_ops);
```

Nécessite l'extension PostgreSQL `pg_trgm` :

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## 🎨 Personnalisation

### Modifier le placeholder

```jsx
<SearchBar placeholder="Votre texte personnalisé..." />
```

### Ajouter un callback personnalisé

```jsx
const handleSelect = (item) => {
  console.log('Item sélectionné:', item);
  // Votre logique personnalisée
  if (item.type === 'product') {
    // Faire quelque chose avec le produit
  }
};

<SearchBar onSelect={handleSelect} />
```

### Changer le délai de débounce

Dans `useSearch.js` :

```javascript
const debouncedQuery = useDebounce(query, 500); // Changer 300 → 500ms
```

### Ajouter une nouvelle catégorie

Dans `useSearch.js`, ajouter une requête :

```javascript
const [produitsRes, fournisseursRes, commandesRes, NOUVELLE_RES] = await Promise.all([
  // ... requêtes existantes
  
  // Nouvelle requête
  supabase
    .from('ma_table')
    .select('colonnes')
    .ilike('champ', searchPattern)
    .limit(3),
]);

// Mapper les résultats
if (NOUVELLE_RES.data && NOUVELLE_RES.data.length > 0) {
  groupedResults.push({
    category: 'Ma Catégorie',
    items: NOUVELLE_RES.data.map((item) => ({
      id: item.id,
      type: 'mon_type',
      title: item.nom,
      subtitle: item.description,
      meta: item.info,
      data: item,
    })),
  });
}
```

Puis ajouter l'icône dans `SearchItem.jsx` :

```javascript
case 'mon_type':
  return <MonIcone className="w-5 h-5 text-custom-500" />;
```

## 🐛 Dépannage

### Problème : Aucun résultat n'apparaît

**Solutions :**

1. Vérifier que Supabase est connecté :
   ```javascript
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
   ```

2. Vérifier les permissions RLS :
   - Aller dans Supabase Dashboard
   - Tables → Vérifier les policies
   - S'assurer que `SELECT` est autorisé

3. Tester manuellement les requêtes :
   ```javascript
   const { data, error } = await supabase
     .from('produits')
     .select('*')
     .limit(5);
   console.log(data, error);
   ```

### Problème : Recherche lente

**Solutions :**

1. Ajouter des index sur les colonnes de recherche (voir section Optimisation)
2. Réduire le nombre de résultats avec `.limit()`
3. Ajouter un cache avec React Query

### Problème : Historique ne fonctionne pas

**Solutions :**

1. Vérifier `localStorage` dans la console :
   ```javascript
   console.log(localStorage.getItem('stock_easy_search_history'));
   ```

2. Effacer et réinitialiser :
   ```javascript
   localStorage.removeItem('stock_easy_search_history');
   ```

### Problème : Raccourci Cmd+K ne fonctionne pas

**Solution :**

Vérifier qu'il n'y a pas de conflit avec d'autres raccourcis globaux. Le listener est dans `SearchBar.jsx` :

```javascript
useEffect(() => {
  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      inputRef.current?.focus();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

## 📊 Métriques et monitoring

### Suivre les performances

Ajouter dans `useSearch.js` :

```javascript
const performSearch = async (searchQuery) => {
  const startTime = performance.now();
  
  // ... requêtes Supabase
  
  const endTime = performance.now();
  console.log(`Recherche exécutée en ${(endTime - startTime).toFixed(2)}ms`);
};
```

### Suivre les recherches populaires

Ajouter un tracking :

```javascript
const saveToHistory = (searchTerm, resultType, resultData) => {
  // ... code existant
  
  // Envoyer à analytics
  if (window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      result_type: resultType,
    });
  }
};
```

## ✅ Checklist de déploiement

Avant de pousser en production :

- [x] Composant créé et testé localement
- [x] Tests unitaires écrits et passants
- [x] Intégré dans DashboardLayout
- [x] Documentation complète
- [ ] Index Supabase créés pour performances
- [ ] Tests E2E (optionnel)
- [ ] Monitoring/analytics configuré (optionnel)

## 📞 Support

Pour toute question ou amélioration :

1. Consulter `README.md` pour la documentation complète
2. Tester avec `SearchBarDemo.jsx`
3. Vérifier les tests dans `__tests__/SearchBar.test.jsx`
4. Consulter les logs de la console pour les erreurs

---

**Créé le :** 16 novembre 2025  
**Version :** 1.0.0  
**Statut :** ✅ Production Ready


