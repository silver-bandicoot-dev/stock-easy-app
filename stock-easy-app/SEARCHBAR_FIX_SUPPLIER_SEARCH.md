# 🔧 Correction : Recherche "alibaba" ne retourne pas la fiche fournisseur

**Date**: 18 novembre 2025  
**Problème**: La recherche "alibaba" trouvait 9 produits mais pas la fiche fournisseur "Alibaba Express"

---

## 🐛 Problème Identifié

### Cause Racine

La fonction `detectSearchType` dans `src/utils/searchUtils.js` détectait "alibaba" comme un **SKU** au lieu de `'all'`.

**Pattern SKU original**:
```javascript
if (/^[A-Z0-9-]{4,}$/i.test(normalized)) {
  return { type: 'product', priority: true, confidence: 'medium' };
}
```

**Problème**: "alibaba" correspond à ce pattern (7 lettres, pas de caractères spéciaux), donc il était détecté comme `{ type: 'product' }` au lieu de `{ type: 'all' }`.

**Conséquence**: Seule la requête produits était exécutée, pas la requête fournisseurs.

---

## ✅ Solution Appliquée

### Modification dans `src/utils/searchUtils.js`

**Avant**:
```javascript
// Détection par format (ex: SKU pattern)
if (/^[A-Z0-9-]{4,}$/i.test(normalized)) {
  return { type: 'product', priority: true, confidence: 'medium' };
}
```

**Après**:
```javascript
// Détection par format (ex: SKU pattern) - mais seulement si ça ressemble vraiment à un SKU
// Un SKU typique contient des chiffres ou des tirets, pas seulement des lettres
// Exemples: SKU-001, PRD-123, ABC-456
if (/^[A-Z0-9-]{4,}$/i.test(normalized) && (/\d/.test(normalized) || /-/.test(normalized))) {
  return { type: 'product', priority: true, confidence: 'medium' };
}
```

**Changement**: Un SKU doit maintenant contenir **des chiffres OU des tirets**, pas seulement des lettres.

---

## 📝 Résultat

### Avant la correction
- Recherche "alibaba" → `detectSearchType` retourne `{ type: 'product' }`
- Seule la requête produits est exécutée
- Résultat: 9 produits trouvés, **0 fournisseur**

### Après la correction
- Recherche "alibaba" → `detectSearchType` retourne `{ type: 'all' }`
- Toutes les requêtes sont exécutées (produits, fournisseurs, commandes, entrepôts)
- Résultat attendu: **9 produits + 1 fournisseur "Alibaba Express"**

---

## 🧪 Tests à Effectuer

1. ✅ Recherche "alibaba" → Doit afficher:
   - Catégorie "Fournisseurs" (1) avec "Alibaba Express"
   - Catégorie "Produits" (9)

2. ✅ Recherche "SKU-001" → Doit toujours détecter comme `'product'` (contient un tiret)

3. ✅ Recherche "PRD123" → Doit toujours détecter comme `'product'` (contient des chiffres)

4. ✅ Recherche "alibaba" → Ne doit plus être détecté comme SKU (seulement des lettres)

---

## 📁 Fichiers Modifiés

- `src/utils/searchUtils.js` (ligne 150-155)
  - Ajout de la condition `(/\d/.test(normalized) || /-/.test(normalized))` pour la détection SKU

- `src/components/SearchBar/useSearch.js` (lignes 114-121, 140-167, 207-225)
  - Ajout de logs de debug pour tracer l'exécution
  - Amélioration des logs pour identifier les problèmes futurs

---

## 🔍 Logs de Debug Ajoutés

Les logs suivants ont été ajoutés pour faciliter le débogage futur:

1. `🔍 DEBUG CONDITIONS` - Affiche les conditions pour chaque type de recherche
2. `🔍 DEBUG: Ajout requête fournisseurs` - Confirme que la requête fournisseurs est ajoutée
3. `🔍 DEBUG: Requête fournisseurs SKIPPÉE` - Avertit si la requête n'est pas ajoutée
4. `🔍 DEBUG PROMISES COUNT` - Compte le nombre de promesses par type
5. `🔍 DEBUG FOURNISSEURS` - Affiche les résultats bruts de la requête fournisseurs
6. `🔍 DEBUG SCORING FOURNISSEUR` - Affiche le scoring de pertinence pour chaque fournisseur

---

## ✅ Statut

**Correction appliquée** - En attente de test dans le navigateur pour validation finale.

