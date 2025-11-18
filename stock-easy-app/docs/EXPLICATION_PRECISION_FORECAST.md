# 📊 Explication : Précision Historique (-2.7%)

## ❓ Qu'est-ce que cela signifie ?

La **"Précision Historique -2.7%"** indique que le modèle de prévision a des performances très faibles sur les données de test.

### 📐 Formule de Calcul

```
Précision = 100% - MAPE
MAPE = (Erreur moyenne / Valeur réelle) × 100%
```

### 🔍 Dans votre cas

- **Précision affichée** : -2.7%
- **MAPE calculé** : ~102.7% (100 - (-2.7))
- **Signification** : L'erreur moyenne est de **102.7%**

---

## 💡 Interprétation

### Que signifie un MAPE de 102.7% ?

Cela signifie que :
- Les prédictions sont en moyenne **2 fois plus grandes** que la réalité
- Ou les prédictions sont **très différentes** des valeurs réelles
- Le modèle a du mal à prévoir correctement avec les données disponibles

### Exemple Concret

Si vous avez :
- **Valeur réelle** : 10 unités
- **Prédiction** : 20 unités (ou 0 unités)
- **Erreur** : |20 - 10| / 10 = **100%**

Si cela se produit souvent, le MAPE moyen sera élevé (>100%).

---

## ⚠️ Pourquoi une précision négative ?

La précision peut être **négative** quand :
1. **MAPE > 100%** → Erreur moyenne supérieure à 100%
2. **Précision = 100% - MAPE** → Devient négative

### Exemple
- MAPE = 102.7%
- Précision = 100% - 102.7% = **-2.7%**

**Note** : Le système a été corrigé pour limiter l'affichage à **0% minimum** pour éviter la confusion.

---

## 🔍 Causes Possibles

### 1. Données Très Variables
- Ventes très irrégulières (0, 100, 0, 50, etc.)
- Pics/creux imprévisibles
- Pas de pattern clair

### 2. Historique Insuffisant
- Moins de 30-60 jours de données
- Pas assez de patterns pour apprendre
- Données trop récentes pour détecter les tendances

### 3. Données de Test Particulières
- Les 25 jours testés peuvent être exceptionnels
- Période de test différente du reste de l'historique
- Changement soudain de comportement

### 4. Valeurs Proches de Zéro
- Beaucoup de jours à 0 ventes
- Quand il y a une vente, difficile à prévoir
- Division par de petites valeurs amplifie l'erreur

---

## ✅ Solutions

### Améliorer la Précision

1. **Plus de Données**
   - Collecter au moins **60-90 jours** d'historique
   - Plus il y a de données, plus le modèle peut apprendre

2. **Vérifier la Qualité des Données**
   - S'assurer que `sales_history` contient des données cohérentes
   - Vérifier qu'il n'y a pas d'outliers erronés
   - Normaliser les données si nécessaire

3. **Ajuster le Modèle**
   ```javascript
   const engine = new SmartForecastEngine({
     wmaWindow: 30,        // Fenêtre moyenne mobile
     trendWeight: 0.2,     // Réduire l'influence de la tendance si données volatiles
     minHistoryDays: 60    // Exiger plus de jours
   });
   ```

4. **Utiliser les Vraies Données Supabase**
   - S'assurer que la table `sales_history` contient des données
   - Préférer les vraies ventes aux données générées

---

## 📊 Échelle de Qualité

| MAPE | Précision | Qualité | Signification |
|------|-----------|---------|---------------|
| 0-10% | 90-100% | ⭐⭐⭐⭐⭐ Excellente | Prévisions très fiables |
| 10-20% | 80-90% | ⭐⭐⭐⭐ Bonne | Prévisions fiables |
| 20-30% | 70-80% | ⭐⭐⭐ Acceptable | Prévisions utilisables |
| 30-50% | 50-70% | ⭐⭐ Faible | Prévisions peu fiables |
| 50-100% | 0-50% | ⭐ Très faible | Prévisions non fiables |
| 100%+ | <0% | ❌ Très faible | Erreur moyenne > 100% |

### Votre Cas

- **MAPE** : ~102.7%
- **Qualité** : ❌ Très faible
- **Recommandation** : 
  - Collecter plus de données (90+ jours)
  - Vérifier la cohérence des données
  - Utiliser un stock de sécurité plus élevé

---

## 🔧 Correction Appliquée

Le système a été corrigé pour :
1. ✅ **Limiter l'accuracy à 0% minimum** (évite les valeurs négatives)
2. ✅ **Afficher le MAPE** pour comprendre l'erreur
3. ✅ **Ajouter un indicateur de qualité** (excellent, bonne, acceptable, faible)
4. ✅ **Expliquer la signification** dans l'interface

---

## 💡 Conseils Pratiques

### Si Précision < 50%

1. **Augmenter le stock de sécurité** de 50-100%
2. **Utiliser les prévisions avec prudence**
3. **Surveiller manuellement** les produits critiques
4. **Collecter plus de données** avant de faire confiance au modèle

### Si Précision > 80%

1. ✅ **Faire confiance aux prévisions**
2. ✅ **Automatiser les commandes** si nécessaire
3. ✅ **Utiliser les recommandations** du système

---

## 📝 En Résumé

**"Précision Historique -2.7%"** signifie :
- ❌ Les prédictions sont **en moyenne 102.7% éloignées** de la réalité
- ⚠️ Le modèle a **du mal à prévoir** avec les données actuelles
- 🔧 Il faut **améliorer les données** ou **ajuster le modèle**
- 💡 En attendant, utiliser des **stocks de sécurité plus élevés**

**Action recommandée** :
1. Vérifier les données dans Supabase (`sales_history`)
2. Collecter au moins 90 jours d'historique
3. Vérifier la cohérence des données (pas d'outliers)
4. Réessayer les prévisions après amélioration

---

*Document généré pour expliquer la précision négative*

