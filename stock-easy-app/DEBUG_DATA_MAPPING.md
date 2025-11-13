# 🔍 Diagnostic - Mapping des données Supabase

## Problème identifié

Les données suivantes affichent `0` ou n'apparaissent pas alors qu'elles existent dans la base :
- ❌ **Ventes/jour** (`salesPerDay`) → affiche 0
- ❌ **Point de commande** (`reorderPoint`) → affiche 0
- ❌ **Quantité à commander** (`qtyToOrder`) → n'apparaît pas (ex: SKU 003 avec 50 unités à commander)

## Cause

Le mapping des champs `snake_case` (Supabase) → `camelCase` (Frontend) était incomplet dans `/src/services/apiAdapter.js`.

## Solution appliquée

### Mapping complet ajouté

```javascript
// AVANT (incomplet)
converted.products = converted.products.map(p => ({
  ...p,
  name: p.nomProduit || p.name,
  stock: p.stockActuel !== undefined ? p.stockActuel : p.stock,
  dailySales: p.ventesJourAjustees !== undefined ? p.ventesJourAjustees : p.dailySales,
  minStock: p.pointCommande !== undefined ? p.pointCommande : p.minStock,
}));

// APRÈS (complet) ✅
converted.products = converted.products.map(p => ({
  ...p,
  // Tous les champs mappés correctement
  salesPerDay: p.ventesJourAjustees || p.salesPerDay || 0,
  reorderPoint: p.pointCommande || p.reorderPoint || 0,
  sales30d: p.ventes30j || p.sales30d || 0,
  buyPrice: p.prixAchat || p.buyPrice || 0,
  sellPrice: p.prixVente || p.sellPrice || 0,
  // ... etc
}));
```

## Noms de colonnes dans Supabase

### Table `produits`

| Colonne Supabase (snake_case) | Champ Frontend (camelCase) | Description |
|-------------------------------|----------------------------|-------------|
| `sku` | `sku` | Code produit |
| `nom_produit` | `name` | Nom du produit |
| `stock_actuel` | `stock` | Stock actuel |
| `ventes_30j` | `sales30d` | Ventes sur 30 jours |
| `ventes_jour_ajustees` | `salesPerDay` / `dailySales` / `adjustedSales` | Ventes par jour |
| `point_commande` | `reorderPoint` / `minStock` | Point de commande |
| `stock_max` | `maxStock` | Stock maximum |
| `stock_securite` | `securityStock` | Stock de sécurité |
| `stock_securite_personnalise` | `customSecurityStock` | Stock sécu personnalisé |
| `prix_achat` | `buyPrice` | Prix d'achat |
| `prix_vente` | `sellPrice` | Prix de vente |
| `marge` | `margin` | Marge |
| `moq` | `moq` | Quantité minimum |
| `multiplicateur` | `multiplier` | Multiplicateur |
| `fournisseur` | `supplier` | Fournisseur |
| `lead_time_days` | `leadTime` / `leadTimeDays` | Délai livraison |
| `quantite_a_commander` | `qtyToOrder` | **Quantité à commander** ⚠️ |
| `statut` | `status` | Statut du produit |
| `investissement` | `investment` | Investissement |
| `revenu_potentiel` | `potentialRevenue` | Revenu potentiel |
| `marge_brute` | `grossMargin` | Marge brute |

## ⚠️ CHAMP CRITIQUE : `qtyToOrder`

Ce champ est **ESSENTIEL** pour le système de commandes :
- Détermine si un produit doit être commandé
- Filtre les produits dans l'onglet "Actions" → "À commander"
- Utilisé dans le calcul du statut de santé (`healthStatus`)

**Colonne Supabase** : `quantite_a_commander`  
**Frontend** : `qtyToOrder`

Si ce champ n'est pas mappé, les produits avec des quantités à commander **n'apparaîtront pas** dans les listes de commandes même s'ils existent en base.

## Comment vérifier que ça fonctionne

### 1. Dans la console du navigateur (F12)

Après le chargement des données, tapez :

```javascript
// Voir un produit
const product = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.
  findFiberByHostInstance(document.querySelector('[data-testid="product"]'))?.
  return?.memoizedProps?.product;

console.log('Product data:', product);
console.log('Sales per day:', product?.salesPerDay);
console.log('Reorder point:', product?.reorderPoint);
console.log('Qty to order:', product?.qtyToOrder);
```

### 2. Vérifier directement dans Supabase

```sql
-- Dans SQL Editor de Supabase
SELECT 
  sku,
  nom_produit,
  ventes_jour_ajustees,
  point_commande,
  quantite_a_commander,  -- IMPORTANT pour les commandes
  stock_actuel
FROM produits
WHERE sku = '003'  -- Vérifier le SKU 003 spécifiquement
   OR quantite_a_commander > 0;  -- Tous les produits à commander
```

### 3. Ajouter des logs temporaires

Dans `/src/services/apiAdapter.js`, ligne 33 :

```javascript
if (converted.products) {
  console.log('🔍 RAW product from Supabase:', converted.products[0]);
  
  converted.products = converted.products.map(p => {
    const mapped = {
      ...p,
      salesPerDay: p.ventesJourAjustees || p.salesPerDay || 0,
      reorderPoint: p.pointCommande || p.reorderPoint || 0,
    };
    
    console.log('✅ Mapped product:', {
      sku: mapped.sku,
      salesPerDay: mapped.salesPerDay,
      reorderPoint: mapped.reorderPoint,
      qtyToOrder: mapped.qtyToOrder  // IMPORTANT
    });
    
    return mapped;
  });
}
```

## Fallback en cascade

Le mapping utilise maintenant un système de fallback en cascade :

```javascript
salesPerDay: p.ventesJourAjustees !== undefined ? p.ventesJourAjustees : 
             (p.salesPerDay !== undefined ? p.salesPerDay : 
             (p.dailySales !== undefined ? p.dailySales : 0))
```

Cela signifie :
1. Essaie d'abord `ventesJourAjustees` (nom Supabase après snake_to_camel)
2. Si pas trouvé, essaie `salesPerDay` (déjà mappé)
3. Si pas trouvé, essaie `dailySales` (alias)
4. Sinon, retourne `0`

## Test rapide

Après le rechargement de l'application :

### 1. Stock Level
Vérifiez que :
- ✅ Les colonnes "Ventes/jour" affichent des valeurs > 0
- ✅ Les colonnes "Point de commande" affichent des valeurs > 0

### 2. Actions → À commander
Vérifiez que :
- ✅ Le SKU 003 apparaît dans la liste (si `quantite_a_commander = 50` dans la base)
- ✅ La quantité à commander est affichée (50 unités)
- ✅ Le badge "À commander" montre le bon nombre de produits

### 3. Console de debug
Tapez dans la console (F12) :
```javascript
// Voir tous les produits à commander
const toOrder = products.filter(p => p.qtyToOrder > 0);
console.table(toOrder.map(p => ({
  sku: p.sku,
  name: p.name,
  qtyToOrder: p.qtyToOrder,
  stock: p.stock
})));
```

Si toujours `0` ou absent, c'est que :
1. La colonne n'existe pas dans Supabase, OU
2. La valeur est NULL dans la base, OU
3. Le nom de la colonne est différent (pas `quantite_a_commander`)

## Debug avancé

Si le problème persiste, ajoutez ce code temporaire dans `useStockData.js` ligne 39 :

```javascript
setProducts(data.products);

// DEBUG - À supprimer après
console.group('🔍 DEBUG PRODUCTS');
console.log('Total products:', data.products.length);
console.log('First product:', data.products[0]);
console.log('Sales per day:', data.products.map(p => ({
  sku: p.sku,
  salesPerDay: p.salesPerDay,
  reorderPoint: p.reorderPoint
})));
console.groupEnd();
```

---

**Correction appliquée** : ✅  
**À tester** : Recharger l'application et vérifier Stock Level

