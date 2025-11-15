# 📦 Calcul du Surstock Profond

## 📋 Vue d'ensemble

Le **surstock profond** (deep overstock) est un indicateur qui identifie les produits ayant une autonomie excessive par rapport aux besoins de l'entreprise.

## 🔄 Évolution de la Règle de Calcul

### ❌ Ancienne Règle (avant correction)

L'ancienne règle utilisait une multiplication du seuil par 2 :

```javascript
// ANCIENNE RÈGLE (INCORRECTE)
const isDeepOverstock = daysOfStock > (seuil * 2);
```

**Problème** : Si l'utilisateur configurait un seuil de 60 jours, seuls les produits avec plus de 120 jours d'autonomie étaient considérés en surstock profond. Cela excluait de nombreux produits qui devaient être identifiés comme surstock.

**Exemple** :
- Seuil configuré : 60 jours
- Produit A : 80 jours d'autonomie → ❌ Non détecté (devrait être détecté)
- Produit B : 130 jours d'autonomie → ✅ Détecté

### ✅ Nouvelle Règle (actuelle)

La nouvelle règle utilise directement le seuil configuré par l'utilisateur :

```javascript
// NOUVELLE RÈGLE (CORRECTE)
const isDeepOverstock = daysOfStock >= roundToOneDecimal(seuil);
```

**Avantage** : Le système s'adapte exactement aux paramètres de l'utilisateur. Si un seuil de 60 jours est configuré, tous les produits avec ≥ 60 jours d'autonomie sont identifiés comme surstock profond.

**Exemple** :
- Seuil configuré : 60 jours
- Produit A : 60 jours d'autonomie → ✅ Détecté
- Produit B : 80 jours d'autonomie → ✅ Détecté
- Produit C : 130 jours d'autonomie → ✅ Détecté

## 📐 Formules Actuelles

### Détection du surstock profond

```javascript
isDeepOverstock = (daysOfStock >= seuil)
```

Où :
- `daysOfStock` = `stock / salesPerDay` (autonomie en jours)
- `seuil` = Valeur configurée par l'utilisateur dans les paramètres généraux (`SeuilSurstockProfond`)

### Calcul de la valeur du surstock profond

**Approche adoptée** : Valeur de l'excédent uniquement (Approche 2)

```javascript
// Pour chaque produit en surstock profond :
excessDays = daysOfStock - seuil
excessUnits = excessDays × salesPerDay
excessValue = excessUnits × buyPrice

// Valeur totale des surstocks profonds :
overstockCost = Σ(excessValue) pour tous les produits où isDeepOverstock === true
```

**Exemple** :
- Produit A : stock = 1000 unités, salesPerDay = 10, buyPrice = 5€
- daysOfStock = 1000 / 10 = 100 jours
- Seuil = 60 jours
- isDeepOverstock = true (100 >= 60)
- excessDays = 100 - 60 = 40 jours
- excessUnits = 40 × 10 = 400 unités
- **excessValue = 400 × 5€ = 2000€** (et non 5000€ de la valeur totale du stock)

## ⚙️ Configuration

Le seuil est configurable dans les **Paramètres Généraux** de l'application :

1. Accéder aux paramètres
2. Modifier le champ "Seuil Surstock Profond"
3. La valeur est sauvegardée dans la base de données
4. Le calcul se met à jour automatiquement pour tous les produits

**Valeur par défaut** : 90 jours

## 🔍 Où est Utilisé ce Calcul ?

### 1. Calcul des Métriques Produit

Fichier : `src/utils/calculations.js`

```javascript
export const calculateMetrics = (product, seuil = 90) => {
  // ... calculs autres métriques ...
  
  const isDeepOverstock = daysOfStock >= roundToOneDecimal(seuil);
  
  return {
    ...product,
    isDeepOverstock,
    // ...
  };
};
```

### 2. Analytics Dashboard

Fichier : `src/hooks/useAnalytics.js`

Les produits en surstock profond sont utilisés pour calculer :
- Le nombre de SKU en surstock (`overstockSKUs`)
- La valeur de l'excédent des surstocks (`overstockCost`) - **Approche 2 : Valeur de l'excédent uniquement**

```javascript
const overstockProducts = products.filter(p => p.isDeepOverstock === true);
const overstockSKUs = overstockProducts.length;
const overstockCost = overstockProducts.reduce((sum, p) => {
  const excessValue = calculateOverstockExcessValue(p, seuilSurstockProfond);
  return sum + excessValue;
}, 0);
```

**Formule de calcul de l'excédent** :
```javascript
// Pour chaque produit en surstock profond :
excessDays = daysOfStock - seuil
excessUnits = excessDays × salesPerDay
excessValue = excessUnits × buyPrice
overstockCost = Σ(excessValue) pour tous les produits en surstock
```

### 3. Insights et Recommandations

Fichier : `src/utils/insightGenerator.js`

Les produits en surstock profond génèrent des insights pour l'utilisateur :

```javascript
const overstockedProducts = products.filter(p => p.isDeepOverstock === true);
if (overstockedProducts.length > 0) {
  // Générer un insight sur les surstocks
}
```

## 🧪 Tests

Un test unitaire vérifie que le calcul fonctionne correctement :

Fichier : `src/utils/__tests__/calculations.test.js`

```javascript
it('should flag deep overstock when autonomy exceeds the configured threshold', () => {
  const product = {
    stock: 600,
    salesPerDay: 10,
    leadTimeDays: 14,
  };

  const result = calculateMetrics(product, 60);
  expect(result.daysOfStock).toBe(60);
  expect(result.isDeepOverstock).toBe(true);
});
```

## 📝 Notes Importantes

1. **Seuil personnalisable** : Chaque utilisateur peut configurer son propre seuil selon ses besoins métier
2. **Mise à jour automatique** : Le calcul se met à jour automatiquement lorsque le seuil est modifié
3. **Persistance** : Le seuil est sauvegardé dans la base de données et rechargé à chaque connexion
4. **Comparaison inclusive** : Utilisation de `>=` pour inclure les produits exactement au seuil

## 🔗 Fichiers Concernés

- `src/utils/calculations.js` - Calcul principal
- `src/StockEasy.jsx` - Application du seuil depuis les paramètres
- `src/hooks/useAnalytics.js` - Utilisation dans les analytics
- `src/utils/insightGenerator.js` - Génération d'insights
- `src/utils/__tests__/calculations.test.js` - Tests unitaires

---

**Date de mise à jour** : 2024  
**Version** : 2.0 (correction de la règle seuil × 2)

