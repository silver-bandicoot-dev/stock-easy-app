# 🤖 Prévisions de Demande avec Machine Learning

## 📋 Vue d'ensemble

Cette fonctionnalité ajoute des capacités de prévision de demande intelligentes à Stock Easy en utilisant TensorFlow.js pour entraîner un modèle de réseau de neurones directement dans le navigateur.

## ✨ Fonctionnalités

### 1. Prévisions Intelligentes
- **Prédictions sur 7 jours** pour chaque produit
- **Tendances** (hausse/baisse) détectées automatiquement
- **Score de confiance** (0-100%) pour chaque prévision
- **Recommandations de commande** basées sur les prévisions

### 2. Modèle ML Personnalisé
- Architecture de réseau de neurones avec 897 paramètres
- Entraînement sur l'historique des ventes (90 jours)
- Sauvegarde automatique dans le navigateur (localStorage)
- Mise à jour manuelle possible à tout moment

### 3. Features Temporelles
Le modèle utilise 6 features pour chaque prédiction :
- `dayOfWeek` (0-6) - Jour de la semaine
- `month` (1-12) - Mois de l'année
- `isWeekend` (0/1) - Weekend ou jour ouvré
- `isHoliday` (0/1) - Jour férié français
- `price` - Prix de vente du produit
- `avgSales` - Moyenne historique des ventes

## 🏗️ Architecture Technique

### Services ML (`src/services/ml/`)

#### `dataCollector.js`
Collecte et prépare les données pour l'entraînement :
```javascript
import { collectSalesHistory } from 'services/ml';

// Collecte l'historique sur 90 jours
const salesHistory = await collectSalesHistory();

// Format de sortie :
// [
//   { sku, date, quantity, dayOfWeek, month, isWeekend, isHoliday, price },
//   ...
// ]
```

#### `demandForecastModel.js`
Modèle TensorFlow.js pour les prévisions :
```javascript
import { DemandForecastModel } from 'services/ml';

const model = new DemandForecastModel();

// Entraîner le modèle
await model.train(salesHistory, {
  epochs: 100,
  batchSize: 32,
  validationSplit: 0.2
});

// Faire une prédiction
const prediction = await model.predict({
  dayOfWeek: 2,
  month: 10,
  isWeekend: false,
  isHoliday: false,
  price: 29.99,
  avgSales: 5
});

// Sauvegarder/Charger
await model.save('demand-forecast-model');
await model.load('demand-forecast-model');
```

**Architecture du réseau :**
```
Input Layer (6 features)
    ↓
Dense Layer 1: 32 neurons, ReLU, Dropout 0.2
    ↓
Dense Layer 2: 16 neurons, ReLU, Dropout 0.1
    ↓
Dense Layer 3: 8 neurons, ReLU
    ↓
Output Layer: 1 neuron, Linear
```

### Hook React (`src/hooks/ml/`)

#### `useDemandForecast.js`
Hook pour intégrer le ML dans les composants React :
```javascript
import { useDemandForecast } from 'hooks/ml';

function MyComponent({ products }) {
  const {
    forecasts,        // Object: prévisions par SKU
    isTraining,       // boolean: entraînement en cours
    isReady,          // boolean: modèle prêt
    error,            // string | null: erreur
    trainingProgress, // number: 0-100%
    retrain,          // function: réentraîner
    getForecastForProduct // function(sku): récupère une prévision
  } = useDemandForecast(products);

  // Utiliser les prévisions...
}
```

### Composant UI (`src/components/ml/`)

#### `MLInsightsDashboard.jsx`
Dashboard complet pour afficher les prévisions :
```javascript
import { MLInsightsDashboard } from 'components/ml';

<MLInsightsDashboard products={products} />
```

**Features du dashboard :**
- ✅ Statut du modèle (entraînement, prêt, erreur)
- ✅ Barre de progression pendant l'entraînement
- ✅ Top 3 produits avec prévisions
- ✅ Tendances avec icônes (↗ hausse, ↘ baisse)
- ✅ Score de confiance avec barre de progression
- ✅ Recommandations de commande
- ✅ Bouton de réentraînement manuel

## 📊 Métriques et Calculs

### Score de Confiance
Basé sur la variance des prédictions :
```javascript
confidence = 100 - (standardDeviation / moyenne × 100)
```
- **> 80%** : Haute confiance (vert)
- **60-80%** : Confiance moyenne (jaune)
- **< 60%** : Faible confiance (rouge)

### Recommandation de Commande
Formule de calcul :
```javascript
demandDuringLeadTime = predictedDailySales × leadTimeDays
securityStock = demandDuringLeadTime × 0.2  // 20% de sécurité
reorderPoint = demandDuringLeadTime + securityStock
recommendedOrder = max(0, reorderPoint - currentStock)
```

## 🎯 Intégration

Le composant est intégré dans l'onglet **Analytics** de l'application principale (`StockEasy.jsx`).

Pour accéder aux prévisions :
1. Ouvrir l'application Stock Easy
2. Naviguer vers l'onglet **Analytics**
3. Scroller vers le bas pour voir le dashboard **🤖 Prévisions IA**
4. Cliquer sur **Réentraîner** si c'est la première utilisation

## 🧪 Tests

Tests unitaires disponibles :
```bash
# Tester le collecteur de données
npm test src/services/ml/__tests__/dataCollector.test.js

# Tester le modèle ML
npm test src/services/ml/__tests__/demandForecastModel.test.js
```

## 📦 Dépendances

```json
{
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow/tfjs-vis": "^1.5.1"
}
```

## 🚀 Commits de la Feature

1. `ffa93a4` - deps: Install TensorFlow.js for ML demand forecasting
2. `78849b2` - feat: Add ML data collector for sales history
3. `859b153` - feat: Add TensorFlow.js demand forecast model with tests
4. `91c816d` - feat: Add useDemandForecast React hook for ML predictions
5. `5eed8ef` - feat: Add MLInsightsDashboard component for ML predictions UI
6. `1424e2e` - feat: Integrate MLInsightsDashboard into Analytics tab

## 📈 Prochaines Améliorations

- [ ] Ajouter plus de features (promotions, saisonnalité)
- [ ] Intégration d'une API de jours fériés
- [ ] Prévisions sur 30 jours au lieu de 7
- [ ] Export des prévisions en CSV/PDF
- [ ] Comparaison prévisions vs réalité
- [ ] Réentraînement automatique périodique
- [ ] Support multi-warehouses

## 📚 Ressources

- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [TensorFlow.js Guides](https://www.tensorflow.org/js/guide)
- [Neural Networks Basics](https://www.tensorflow.org/js/guide/models_and_layers)

## 🤝 Support

Pour toute question ou problème, consultez les tests unitaires ou la documentation inline dans les fichiers sources.

---

**Créé le :** 21 octobre 2025  
**Branche :** `feature/ml-demand-forecast`  
**Status :** ✅ Complet et testé

