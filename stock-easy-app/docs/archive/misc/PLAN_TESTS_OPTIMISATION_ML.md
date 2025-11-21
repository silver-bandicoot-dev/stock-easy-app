# 🧪 PLAN DE TESTS - Optimisation ML Stock Easy

**Date** : 2025-01-XX  
**Version** : Post-suppression IA & Previsions  
**Objectif** : Valider les optimisations de performance des services ML

---

## 📋 RÉSUMÉ DES OPTIMISATIONS À TESTER

| Optimisation | Fichier | Impact Attendu | Priorité |
|--------------|---------|----------------|----------|
| Batch Prediction | `demandForecastModel.js` | 10-20x plus rapide | 🔴 Critique |
| Early Stopping | `demandForecastModel.js` | 30-50% moins d'epochs | 🟡 Important |
| Cache ML | `mlCache.js` (nouveau) | 100x plus rapide (cache hit) | 🟡 Important |
| Optimisation predictFutureDemand | `revenueForecastService.js` | 10-15x plus rapide | 🔴 Critique |

---

## TEST 1 : Compilation et Démarrage ⚙️

### Commande
```bash
npm run dev
```

### Résultat attendu
- ✅ Pas d'erreur de compilation
- ✅ Application démarre normalement
- ✅ Pas d'erreurs dans la console
- ✅ Tous les imports sont valides

### Si erreur
- Vérifier les imports manquants
- Vérifier que `@tensorflow/tfjs` est installé
- Vérifier les dépendances dans `package.json`

### Checklist
- [ ] Application compile sans erreur
- [ ] Console navigateur propre
- [ ] Pas d'erreur TypeScript/ESLint
- [ ] Tous les modules se chargent correctement

---

## TEST 2 : Batch Prediction - Test Unitaire 🔬

### Fichier à créer
`src/services/ml/__tests__/batchPrediction.test.js`

### Commande
```bash
npm test -- batchPrediction.test.js
```

### Résultat attendu
- ✅ Tous les tests passent
- ✅ `predictBatch` retourne le bon nombre de prédictions
- ✅ Speedup > 10x affiché dans les logs
- ✅ Toutes les prédictions sont valides (nombres >= 0)

### Métriques à vérifier
- Temps batch (30 prédictions) : < 100ms
- Temps séquentiel estimé (30 prédictions) : > 1000ms
- Speedup : > 10x

### Checklist
- [ ] Test `predictBatch retourne le bon nombre` passe
- [ ] Test `predictBatch plus rapide que séquentiel` passe
- [ ] Speedup > 10x dans les logs
- [ ] Pas d'erreur TensorFlow.js

---

## TEST 3 : Early Stopping 🛑

### Méthode
Observer la console du navigateur pendant l'entraînement du modèle

### Où tester
- Analytics (calcul du revenu potentiel ML)
- Settings (si entraînement manuel disponible)

### Résultat attendu
- ✅ Message "Early stopping at epoch X" apparaît
- ✅ Entraînement s'arrête avant 50 epochs si val_loss stagne
- ✅ Temps d'entraînement réduit de 30-50%
- ✅ Pas de dégradation de la précision

### Métriques à capturer
- Nombre d'epochs effectués (avant/après)
- Temps total d'entraînement (avant/après)
- Val_loss final (comparer avec version sans early stopping)

### Checklist
- [ ] Early stopping s'active (message dans console)
- [ ] Epochs < 50 dans la plupart des cas
- [ ] Temps d'entraînement réduit
- [ ] Précision maintenue (val_loss similaire)

---

## TEST 4 : Cache - Test Fonctionnel 💾

### Méthode
Utiliser la console du navigateur pour tester le cache

### Script de test
```javascript
// 1. Importer le cache
import { mlCache } from './services/ml/mlCache';

// 2. Vérifier qu'il est vide au départ
mlCache.getStats();
// Devrait retourner : { size: 0, entries: [] }

// 3. Aller dans Analytics et attendre le calcul ML

// 4. Vérifier le cache après calcul
mlCache.getStats();
// Devrait retourner : { size: 2+, entries: [...] }

// 5. Rafraîchir la page Analytics (sans recharger l'app)

// 6. Vérifier dans la console : "✅ Cache hit for ML revenue calculation"

// 7. Vider le cache et re-tester
mlCache.clear();
// Devrait afficher : "🔄 Cache miss, calculating ML revenue..."
```

### Résultat attendu
- ✅ Premier appel : "Cache miss" + temps de calcul affiché
- ✅ Second appel : "Cache hit" + temps ~0ms
- ✅ Stats du cache montrent les entrées
- ✅ TTL fonctionne (cache expire après X minutes)

### Métriques à vérifier
- Temps premier appel : X ms
- Temps second appel (cache hit) : < 10ms
- Gain : > 99%

### Checklist
- [ ] Cache vide au départ
- [ ] Cache se remplit après calcul
- [ ] Cache hit sur second appel
- [ ] TTL fonctionne (expiration)
- [ ] Stats du cache correctes

---

## TEST 5 : Performance Analytics 📊

### Méthode
Ajouter temporairement un test de performance dans `AnalyticsTab.jsx`

### Code de test
```javascript
useEffect(() => {
  const testMLPerformance = async () => {
    console.log('🧪 TEST ML PERFORMANCE');
    console.log('────────────────────────');
    
    const startTotal = performance.now();
    
    // Ton calcul ML existant
    const result = await calculateTotalPotentialRevenueML(products, mlModel, {
      forecastDays: 90,
      useSeasonality: true,
      useRotationRate: true,
      useMLPredictions: mlModel !== null
    });
    
    const totalTime = performance.now() - startTotal;
    
    console.log(`⚡ Temps total: ${totalTime.toFixed(0)}ms`);
    console.log(`📦 Produits traités: ${products.length}`);
    console.log(`⏱️  Temps par produit: ${(totalTime / products.length).toFixed(0)}ms`);
    
    if (totalTime < 3000) {
      console.log('✅ Performance EXCELLENTE');
    } else if (totalTime < 5000) {
      console.log('🟡 Performance ACCEPTABLE');
    } else {
      console.log('🔴 Performance LENTE - Optimisation nécessaire');
    }
    
    console.log('────────────────────────');
  };
  
  testMLPerformance();
}, [products, mlModel]);
```

### Scénarios de test

| Nombre Produits | Temps Avant (estimé) | Temps Après Attendu | Amélioration |
|-----------------|----------------------|---------------------|--------------|
| 10 | ~15-20s | <2s | ~10x |
| 50 | ~60-90s | <5s | ~15x |
| 100 | ~120-180s | <10s | ~15-20x |

### Résultat attendu
- ✅ Temps < 3s pour 50 produits
- ✅ Temps < 10s pour 100 produits
- ✅ Amélioration > 10x vs version précédente

### Checklist
- [ ] Test avec 10 produits : < 2s
- [ ] Test avec 50 produits : < 5s
- [ ] Test avec 100 produits : < 10s
- [ ] Amélioration > 10x confirmée

---

## TEST 6 : Régression Fonctionnelle ✅

### Checklist manuelle

#### Analytics
- [ ] Le KPI "Revenu Potentiel ML" s'affiche toujours
- [ ] Le nombre affiché semble cohérent avec avant
- [ ] Pas d'erreur dans la console
- [ ] Le chargement est plus rapide qu'avant
- [ ] Les graphiques s'affichent correctement
- [ ] Les insights ML fonctionnent

#### Settings (GestionMultiplicateurs)
- [ ] Les suggestions de multiplicateur fonctionnent
- [ ] Les calculs sont rapides
- [ ] Pas d'erreur dans la console
- [ ] Les ajustements sont cohérents

#### Navigation
- [ ] Pas de freeze/lag lors du calcul ML
- [ ] L'application reste responsive
- [ ] Pas de crash
- [ ] Les transitions sont fluides

#### Console
- [ ] Pas d'erreur TensorFlow.js
- [ ] Messages de cache apparaissent
- [ ] Temps de calcul affichés
- [ ] Pas de warnings critiques

### Résultat attendu
- ✅ Toutes les fonctionnalités existantes marchent
- ✅ Pas de régression visuelle
- [ ] Performance améliorée

---

## TEST 7 : Test de Charge 🔥

### Script de test
```javascript
// Console navigateur
const stressTest = async () => {
  console.log('🔥 STRESS TEST ML');
  
  const iterations = 10;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    mlCache.clear(); // Forcer recalcul
    
    const start = performance.now();
    // Déclencher ton calcul ML
    await calculateMLRevenue();
    const duration = performance.now() - start;
    
    times.push(duration);
    console.log(`Iteration ${i + 1}: ${duration.toFixed(0)}ms`);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  
  console.log('────────────────────');
  console.log(`Moyenne: ${avgTime.toFixed(0)}ms`);
  console.log(`Min: ${minTime.toFixed(0)}ms`);
  console.log(`Max: ${maxTime.toFixed(0)}ms`);
  console.log(`Stabilité: ${((1 - (maxTime - minTime) / avgTime) * 100).toFixed(0)}%`);
};

stressTest();
```

### Résultat attendu
- ✅ Temps stable sur 10 itérations
- ✅ Pas de memory leak (vérifier dans Chrome DevTools → Memory)
- ✅ Pas de crash
- ✅ Stabilité > 80%

### Métriques à vérifier
- Temps moyen : X ms
- Écart min/max : < 30% de la moyenne
- Memory usage : Stable (pas d'augmentation continue)

### Checklist
- [ ] 10 itérations réussies
- [ ] Pas de memory leak
- [ ] Pas de crash
- [ ] Stabilité > 80%

---

## TEST 8 : Validation Finale 🎯

### Checklist complète

#### Performance
- [ ] Calcul ML < 3s pour 50 produits
- [ ] Cache fonctionne (2e appel instantané)
- [ ] Early stopping s'active
- [ ] Batch prediction implémentée
- [ ] Speedup > 10x confirmé

#### Fonctionnel
- [ ] Toutes les features ML marchent
- [ ] Pas de régression vs version précédente
- [ ] Fallback statistique fonctionne si ML fail
- [ ] Gestion d'erreurs robuste

#### Code
- [ ] Pas d'erreur ESLint
- [ ] Pas d'erreur TypeScript (si applicable)
- [ ] Tests unitaires passent
- [ ] Console propre (pas d'erreurs)
- [ ] Code coverage > 70% pour ML

#### UX
- [ ] Interface fluide
- [ ] Pas de freeze
- [ ] Indicateurs de chargement appropriés
- [ ] Messages d'erreur clairs

### Résultat attendu
- ✅ Tous les critères validés
- ✅ Prêt pour production

---

## 📊 RAPPORT DE TEST

### Template de rapport

```markdown
# Rapport de Tests - Optimisation ML Stock Easy

**Date** : [DATE]
**Version** : [VERSION]
**Testeur** : [NOM]

## Résultats

### Performance (TEST 5)

| Produits | Temps Avant | Temps Après | Amélioration |
|----------|-------------|-------------|--------------|
| 10 | Xms | Xms | Xx |
| 50 | Xms | Xms | Xx |
| 100 | Xms | Xms | Xx |

### Cache (TEST 4)

- Premier appel : Xms
- Appels suivants : Xms (cache hit)
- Gain : X%
- TTL : X minutes

### Early Stopping (TEST 3)

- Epochs moyens : X/50
- Temps gagné : X%
- Val_loss final : X

### Batch Prediction (TEST 2)

- Speedup : Xx
- Temps batch (30) : Xms
- Temps séquentiel (30) : Xms

### Régression (TEST 6)

- ✅/❌ Tous les tests passent
- Fonctionnalités affectées : [LISTE]

### Charge (TEST 7)

- Stabilité : X%
- Temps moyen : Xms
- Memory leak : ✅/❌

## Conclusion

[SUCCÈS / ÉCHEC / AMÉLIORATION NÉCESSAIRE]

### Points forts
- ...

### Points à améliorer
- ...

## Actions Suivantes

- [ ] ...
- [ ] ...
```

---

## 🚨 PROCÉDURE EN CAS D'ÉCHEC

### Si TEST 1 échoue (Compilation)
1. Vérifier les imports
2. Vérifier les dépendances npm
3. Vérifier la configuration TypeScript/ESLint

### Si TEST 2 échoue (Batch Prediction)
1. Vérifier que `predictBatch` est implémentée
2. Vérifier la normalisation des features
3. Vérifier les tenseurs TensorFlow

### Si TEST 3 échoue (Early Stopping)
1. Vérifier que les callbacks sont configurés
2. Vérifier le monitoring de val_loss
3. Vérifier les seuils de patience

### Si TEST 4 échoue (Cache)
1. Vérifier que `mlCache.js` existe
2. Vérifier les clés de cache
3. Vérifier le TTL

### Si TEST 5 échoue (Performance)
1. Vérifier que batch prediction est utilisée
2. Vérifier que le cache est utilisé
3. Profiler avec Chrome DevTools

### Si TEST 6 échoue (Régression)
1. Comparer avec version précédente
2. Vérifier les calculs manuellement
3. Vérifier les logs d'erreur

### Si TEST 7 échoue (Charge)
1. Vérifier les memory leaks
2. Vérifier le nettoyage des tenseurs
3. Vérifier le cache (ne pas exploser)

---

## 📝 NOTES

- Tous les tests doivent être exécutés dans l'ordre
- Capturer les screenshots/logs en cas d'échec
- Documenter les métriques pour comparaison future
- Tester sur différents navigateurs (Chrome, Firefox, Safari)

---

**Dernière mise à jour** : [DATE]

