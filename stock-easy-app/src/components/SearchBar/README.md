# 🔍 SearchBar - Barre de recherche intelligente

## Vue d'ensemble

Composant de recherche avancé avec autocomplétion en temps réel, navigation clavier, et historique local. Recherche simultanément dans les **produits**, **fournisseurs**, et **commandes** via Supabase.

## ✨ Fonctionnalités

### 🎯 Recherche intelligente
- **Debounce automatique** (300ms) pour optimiser les performances
- **Recherche multi-tables** : produits, fournisseurs, commandes
- **Matching partiel** avec `.ilike()` Supabase
- **Groupement par catégories** dans les résultats

### ⌨️ Navigation clavier
- `Cmd/Ctrl + K` : Focus sur la barre de recherche
- `↑` / `↓` : Navigation dans les suggestions
- `Enter` : Sélection du résultat actif
- `Échap` : Fermer le dropdown

### 💾 Historique local
- Stockage dans `localStorage` des 10 dernières recherches
- Affichage automatique quand aucun résultat
- Possibilité de re-lancer une recherche depuis l'historique

### 🎨 UX/UI
- **Highlight du texte** correspondant dans les suggestions
- **Animation fluide** d'apparition/disparition (slide-down)
- **Indicateur de chargement** pendant la recherche
- **Responsive** avec affichage mobile-friendly
- **Icônes contextuelles** selon le type (produit, fournisseur, commande)

## 📦 Structure des fichiers

```
SearchBar/
├── SearchBar.jsx          # Composant principal avec input et logique
├── SearchDropdown.jsx     # Dropdown des résultats groupés
├── SearchItem.jsx         # Item individuel avec highlight
├── useSearch.js           # Hook avec logique Supabase + historique
├── index.js               # Exports
└── README.md              # Documentation
```

## 🚀 Utilisation

### Import basique

```jsx
import { SearchBar } from '../components/SearchBar';

function MyComponent() {
  return <SearchBar />;
}
```

### Avec callback personnalisé

```jsx
import { SearchBar } from '../components/SearchBar';

function MyComponent() {
  const handleSelect = (item) => {
    console.log('Item sélectionné:', item);
    // Logique personnalisée
  };

  return (
    <SearchBar
      placeholder="Rechercher..."
      onSelect={handleSelect}
      className="max-w-md"
    />
  );
}
```

### Props disponibles

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `placeholder` | `string` | `"Rechercher un produit..."` | Texte du placeholder |
| `onSelect` | `function` | Navigation auto | Callback lors de la sélection |
| `className` | `string` | `""` | Classes CSS additionnelles |

## 🔌 Intégration

Le composant est déjà intégré dans `DashboardLayout.jsx` :

```jsx
import { SearchBar } from '../SearchBar';

// Dans le layout
<SearchBar />
```

## 🗄️ Structure des données

### Format des résultats

```javascript
[
  {
    category: 'Produits',
    items: [
      {
        id: 'SKU-001',
        type: 'product',
        title: 'Câble HDMI',
        subtitle: 'SKU: SKU-001 • Stock: 25',
        meta: 'Fournisseur Xiaomi',
        image: 'https://...',
        data: { /* données complètes du produit */ }
      }
    ]
  },
  {
    category: 'Fournisseurs',
    items: [/* ... */]
  }
]
```

### Types d'items

- `product` → Navigation vers `/stock?sku={id}`
- `supplier` → Navigation vers `/settings?tab=suppliers&id={id}`
- `order` → Navigation vers `/track?order={id}`
- `history` → Relance la recherche

## 🛠️ Configuration Supabase (via MCP)

Le hook `useSearch` utilise le client Supabase pour interroger les tables suivantes :

### Tables requises

1. **`produits`**
   - Colonnes : `sku`, `nom_produit`, `stock_actuel`, `fournisseur`, `prix_vente`, `image_url`
   - Recherche sur : `sku`, `nom_produit`

2. **`fournisseurs`**
   - Colonnes : `id`, `nom_fournisseur`, `email`, `lead_time_days`
   - Recherche sur : `nom_fournisseur`

3. **`commandes`**
   - Colonnes : `id`, `supplier`, `status`, `total`, `created_at`
   - Recherche sur : `id`, `supplier`

### Requêtes exécutées

```javascript
// Produits
supabase
  .from('produits')
  .select('sku, nom_produit, stock_actuel, fournisseur, prix_vente, image_url')
  .or(`sku.ilike.%${query}%,nom_produit.ilike.%${query}%`)
  .limit(5)

// Fournisseurs
supabase
  .from('fournisseurs')
  .select('id, nom_fournisseur, email, lead_time_days')
  .ilike('nom_fournisseur', `%${query}%`)
  .limit(3)

// Commandes
supabase
  .from('commandes')
  .select('id, supplier, status, total, created_at')
  .or(`id.ilike.%${query}%,supplier.ilike.%${query}%`)
  .order('created_at', { ascending: false })
  .limit(3)
```

## 🎨 Personnalisation

### Modifier le délai de debounce

Dans `useSearch.js` :

```javascript
const debouncedQuery = useDebounce(query, 300); // Changer 300ms
```

### Ajuster le nombre de résultats

Dans `useSearch.js`, modifier les `.limit()` :

```javascript
.limit(5) // Pour les produits
.limit(3) // Pour les fournisseurs
.limit(3) // Pour les commandes
```

### Ajouter une nouvelle catégorie de recherche

1. Ajouter une requête Supabase dans `performSearch()`
2. Mapper les résultats avec la structure attendue
3. Ajouter l'icône correspondante dans `SearchItem.jsx`

## 🧪 Tests

Pour tester le composant :

1. **Recherche basique** : Taper "cab" → doit afficher câbles
2. **Navigation clavier** : Utiliser ↑↓ → surbrillance active
3. **Raccourci** : `Cmd+K` → focus sur l'input
4. **Historique** : Effectuer une recherche, vider l'input → historique visible
5. **Performance** : Taper rapidement → débounce fonctionne

## 🐛 Dépannage

### Aucun résultat affiché
- Vérifier que les tables Supabase existent et contiennent des données
- Vérifier les permissions RLS (Row Level Security)
- Ouvrir la console pour voir les erreurs Supabase

### Lenteur de recherche
- Ajouter des index sur les colonnes `nom_produit`, `nom_fournisseur`
- Réduire le nombre de résultats avec `.limit()`

### Historique ne se sauvegarde pas
- Vérifier que `localStorage` est accessible
- Vérifier la console pour les erreurs de serialization JSON

## 📝 TODO / Améliorations futures

- [ ] Ajouter la recherche full-text avec PostgreSQL (`tsvector`)
- [ ] Implémenter un cache avec React Query ou SWR
- [ ] Ajouter des filtres avancés (par date, statut, etc.)
- [ ] Supporter la recherche vocale (Web Speech API)
- [ ] Ajouter des raccourcis clavier personnalisés
- [ ] Intégrer un système de favoris

## 📄 Licence

Propriété de Stock Easy - Usage interne uniquement


