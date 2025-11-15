# 🔍 Audit du Calcul de la Valeur des Surstocks Profonds

## 📋 Définition Actuelle

**Surstock Profond** : Un produit est en surstock profond si son autonomie (`daysOfStock`) dépasse ou égale le seuil configuré.

```javascript
isDeepOverstock = (daysOfStock >= seuil)
```

Où :
- `daysOfStock = stock / salesPerDay` (autonomie en jours)
- `seuil` = Valeur configurée par l'utilisateur (ex: 5, 30, 60, 90 jours)

## 💰 Formule Actuelle de la Valeur

**Formule actuelle** :
```javascript
overstockCost = Σ(stock × buyPrice) pour tous les produits où isDeepOverstock === true
```

**Exemple** :
- Produit A : stock = 1000 unités, salesPerDay = 10, buyPrice = 5€
- daysOfStock = 1000 / 10 = 100 jours
- Seuil = 60 jours
- isDeepOverstock = true (100 >= 60)
- **Valeur calculée = 1000 × 5€ = 5000€**

## 🤔 Question : Quelle est la bonne formule ?

D'après les recherches sur les bonnes pratiques de gestion des stocks, il existe **deux approches possibles** :

### Approche 1 : Valeur Totale du Stock (ACTUELLE)
**Logique** : Si un produit est en surstock profond, toute sa valeur est considérée comme "immobilisée" en surstock.

**Formule** :
```
Valeur = stock × buyPrice
```

**Avantages** :
- Simple et direct
- Reflète le capital total immobilisé
- Utile pour comprendre l'impact financier global

**Inconvénients** :
- Ne distingue pas la partie "normale" du stock de la partie "excédentaire"
- Peut surestimer le problème si le seuil est bas

### Approche 2 : Valeur de l'Excédent Uniquement (RECOMMANDÉE)
**Logique** : Seule la partie qui dépasse le seuil est considérée comme surstock.

**Formule** :
```
Excédent en jours = daysOfStock - seuil
Excédent en unités = (daysOfStock - seuil) × salesPerDay
Valeur = Excédent en unités × buyPrice
```

**Exemple** :
- Produit A : stock = 1000 unités, salesPerDay = 10, buyPrice = 5€
- daysOfStock = 100 jours
- Seuil = 60 jours
- Excédent = (100 - 60) × 10 = 400 unités
- **Valeur = 400 × 5€ = 2000€**

**Avantages** :
- Plus précis : mesure uniquement l'excédent réel
- Aligné avec les bonnes pratiques de gestion des stocks
- Permet de mieux quantifier l'impact du surstock
- Plus utile pour décider des actions correctives

**Inconvénients** :
- Légèrement plus complexe à calculer

## 📊 Comparaison des Deux Approches

| Critère | Approche 1 (Totale) | Approche 2 (Excédent) |
|---------|---------------------|----------------------|
| **Précision** | Moins précise | Plus précise |
| **Utilité métier** | Impact global | Impact réel du surstock |
| **Complexité** | Simple | Légèrement plus complexe |
| **Alignement bonnes pratiques** | ⚠️ Partiel | ✅ Recommandé |

## ✅ Recommandation

**Recommandation : Utiliser l'Approche 2 (Valeur de l'Excédent)**

**Raison** :
1. ✅ Plus alignée avec les bonnes pratiques de gestion des stocks
2. ✅ Mesure précise de l'excédent réel
3. ✅ Plus utile pour les décisions d'optimisation
4. ✅ Permet de mieux quantifier l'impact financier du surstock

## 🔧 Formule Recommandée

```javascript
// Calcul de la valeur du surstock profond (excédent uniquement)
const overstockProducts = products.filter(p => p.isDeepOverstock === true);
const overstockCost = overstockProducts.reduce((sum, p) => {
  const daysOfStock = p.daysOfStock || 0;
  const seuil = seuilSurstockProfond; // Seuil configuré
  const excessDays = Math.max(0, daysOfStock - seuil);
  const excessUnits = excessDays * (p.salesPerDay || 0);
  const price = p.buyPrice || p.price || 0;
  return sum + (excessUnits * price);
}, 0);
```

## 📝 Notes Importantes

1. **Cas limite** : Si `salesPerDay = 0`, on ne peut pas calculer l'excédent en unités. Dans ce cas, on pourrait utiliser une valeur par défaut ou exclure ces produits.

2. **Arrondissement** : Les unités excédentaires doivent être arrondies à l'entier supérieur pour être cohérentes.

3. **Cohérence** : Cette formule doit être appliquée de manière cohérente dans :
   - `useAnalytics.js`
   - `kpiScheduler.js`
   - Tous les autres endroits où la valeur est calculée

## 🔄 Migration

Si on change la formule, il faut :
1. Mettre à jour `useAnalytics.js`
2. Mettre à jour `kpiScheduler.js`
3. Mettre à jour la documentation
4. Informer les utilisateurs du changement de calcul

