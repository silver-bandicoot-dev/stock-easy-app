# 🔧 Guide d'Intégration : ProductMultiplierEditor

## Vue d'ensemble

Le composant `ProductMultiplierEditor` offre **deux méthodes** pour modifier le multiplicateur de prévision :
1. **Modification manuelle** : Contrôle total par l'utilisateur
2. **Suggestion ML** : Analyse automatique basée sur l'historique

## 📦 Fichiers créés

### 1. Service ML
- `src/services/ml/multiplierOptimizer.js` - Service d'analyse et suggestion ML

### 2. Composant UI
- `src/components/product/ProductMultiplierEditor.jsx` - Interface d'édition

### 3. Fonctions API
- `api.updateProductMultiplier(sku, multiplier)` - Mise à jour manuelle
- `api.resetProductMultiplier(sku)` - Réinitialisation au défaut

## 🚀 Utilisation de base

### Exemple 1 : Dans une modale

```javascript
import { useState } from 'react';
import { ProductMultiplierEditor } from '../components/product/ProductMultiplierEditor';

function ProductDetailsModal({ product, isOpen, onClose, onUpdate }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <ProductMultiplierEditor
          product={product}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
```

### Exemple 2 : Dans une fiche produit

```javascript
import { useState } from 'react';
import { ProductMultiplierEditor } from '../components/product/ProductMultiplierEditor';

function ProductCard({ product, loadData }) {
  const [showMultiplierEditor, setShowMultiplierEditor] = useState(false);

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>Multiplicateur actuel : {product.multiplicateurPrevision || 1.2}</p>
      
      <button onClick={() => setShowMultiplierEditor(true)}>
        Modifier le multiplicateur
      </button>

      {showMultiplierEditor && (
        <div className="modal">
          <ProductMultiplierEditor
            product={product}
            onUpdate={() => {
              loadData();
              setShowMultiplierEditor(false);
            }}
            onClose={() => setShowMultiplierEditor(false)}
          />
        </div>
      )}
    </div>
  );
}
```

### Exemple 3 : Dans un tableau de produits

```javascript
import { useState } from 'react';
import { ProductMultiplierEditor } from '../components/product/ProductMultiplierEditor';

function ProductsTable({ products, loadData }) {
  const [editingProduct, setEditingProduct] = useState(null);

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th>Multiplicateur</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.sku}>
              <td>{product.name}</td>
              <td>{product.multiplicateurPrevision || 1.2}</td>
              <td>
                <button onClick={() => setEditingProduct(product)}>
                  Modifier
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <ProductMultiplierEditor
              product={editingProduct}
              onUpdate={() => {
                loadData();
                setEditingProduct(null);
              }}
              onClose={() => setEditingProduct(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
```

## 🎨 Personnalisation du style

Le composant utilise les classes Tailwind de votre design system. Vous pouvez le personnaliser en modifiant les classes dans `ProductMultiplierEditor.jsx`.

## 📊 Utilisation du service ML directement

Si vous voulez utiliser le service ML sans l'interface :

```javascript
import { multiplierOptimizer } from '../services/ml/multiplierOptimizer';

// Obtenir une suggestion
const suggestion = await multiplierOptimizer.suggestOptimalMultiplier(product);

console.log('Multiplicateur suggéré:', suggestion.suggestedMultiplier);
console.log('Confiance:', suggestion.confidence);
console.log('Raisonnement:', suggestion.reasoning);

// Appliquer la suggestion
if (suggestion.confidence > 70) {
  const result = await multiplierOptimizer.applySuggestedMultiplier(
    product.sku,
    suggestion.suggestedMultiplier
  );
}
```

## 🔄 Workflow recommandé

1. **Utilisateur ouvre l'éditeur** → Affiche le multiplicateur actuel
2. **Option A : Modification manuelle**
   - Utilisateur ajuste la valeur
   - Clique sur "Sauvegarder"
   - Multiplicateur mis à jour immédiatement

3. **Option B : Suggestion ML**
   - Utilisateur clique sur "Analyser avec ML"
   - Le système analyse l'historique
   - Affiche la suggestion avec confiance et raisonnement
   - Utilisateur peut :
     - Appliquer directement la suggestion
     - Utiliser la valeur pour modification manuelle
     - Ignorer la suggestion

## ✅ Checklist d'intégration

- [ ] Importer le composant `ProductMultiplierEditor`
- [ ] Ajouter un bouton/action pour ouvrir l'éditeur
- [ ] Gérer l'état d'ouverture/fermeture
- [ ] Appeler `loadData()` après mise à jour pour rafraîchir les données
- [ ] Tester la modification manuelle
- [ ] Tester la suggestion ML
- [ ] Vérifier que les calculs se mettent à jour (point de commande, etc.)

## 🐛 Dépannage

### Le multiplicateur ne s'affiche pas
- Vérifier que `multiplicateur_prevision` est bien mappé dans `apiAdapter.js`
- Vérifier que la colonne existe dans la base de données

### L'analyse ML ne fonctionne pas
- Vérifier que `getSalesHistory` fonctionne
- Vérifier qu'il y a assez de données historiques (minimum 7 points)
- Vérifier les logs de la console pour les erreurs

### La mise à jour échoue
- Vérifier que la migration 027 a été appliquée
- Vérifier que les fonctions RPC existent dans Supabase
- Vérifier les permissions RLS

## 📝 Notes importantes

- Le composant gère automatiquement la validation (0.1 - 10.0)
- Le composant affiche des messages d'erreur/succès via toast
- Le composant est responsive et s'adapte à différentes tailles d'écran
- Les suggestions ML nécessitent au moins 7 points de données pour être fiables

