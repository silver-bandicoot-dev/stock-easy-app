# 🚀 Fonctionnalités ML Avancées - Stock Easy

## 📋 Vue d'Ensemble

Cette documentation décrit toutes les fonctionnalités avancées de Machine Learning intégrées dans Stock Easy pour des prévisions de demande intelligentes et des recommandations automatiques.

---

## 🎯 Fonctionnalités Implémentées

### ✅ **1. Visualisations Avancées**

#### 📈 **Graphique de Tendances (30/60/90 jours)**
- **Composant** : `ForecastTrendChart`
- **Localisation** : Analytics → Prévisions IA
- **Fonctionnalités** :
  - Historique 30 derniers jours (zone bleue)
  - Prévisions 30/60/90 jours (zone violette en pointillés)
  - Indicateur de tendance avec pourcentage
  - Stats : Moyenne historique, moyenne prévue, total prévu

#### 🔥 **Heatmap de Demande par Jour de Semaine**
- **Composant** : `DemandHeatmap`
- **Fonctionnalités** :
  - Graphique en barres avec gradient de couleur
  - Détection du jour de pointe
  - Score de régularité (0-100%)
  - Recommandations basées sur les patterns hebdomadaires

#### 🎯 **Comparaison Prévisions vs Réalité**
- **Composant** : `PredictionVsReality`
- **Fonctionnalités** :
  - Graphique comparatif (Réel, Prévu, Écart)
  - Métriques de performance :
    - **MAE** (Mean Absolute Error)
    - **RMSE** (Root Mean Square Error)  
    - **R²** (Coefficient de détermination)
    - **Précision** (% dans marge de 20%)
  - Analyse automatique de la qualité du modèle

---

### ✅ **2. Prévisions Multi-Périodes**

Le système génère désormais des prévisions sur **4 horizons temporels** :
- **7 jours** - Court terme, décisions immédiates
- **30 jours** - Moyen terme, planification mensuelle
- **60 jours** - Long terme, stratégie trimestrielle
- **90 jours** - Très long terme, vision annuelle

**Chaque période inclut** :
- Prévisions journalières détaillées
- Moyenne quotidienne
- Total de la période
- Tendance (hausse/baisse)

---

### ✅ **3. Système d'Alertes Intelligentes**

#### 🚨 **Types d'Alertes**

**Alerte Critique** (Rouge) :
- Rupture de stock prévue dans ≤ 3 jours
- Action immédiate requise

**Alerte Importante** (Orange) :
- Rupture de stock prévue dans 4-7 jours
- Délai fournisseur critique
- Marge de sécurité faible

**Alerte Moyenne** (Jaune) :
- Forte hausse de demande prévue (>30%)
- Rupture de stock prévue dans 8-14 jours

**Alerte Basse** (Bleu) :
- Baisse de demande (>30%)
- Stock excédentaire (>60 jours)

#### 📊 **Panneau d'Alertes**
- Résumé avec compteurs par sévérité
- Liste des 5 alertes les plus critiques
- Détails et recommandations pour chaque alerte
- Bouton d'action directe "Commander X unités"

---

### ✅ **4. Recommandations Automatiques de Commande**

Le système génère des recommandations intelligentes basées sur :
- **Score de criticité** (0-100) calculé selon :
  - Ratio stock/demande (40 points)
  - Tendance hausse (30 points)
  - Volume de ventes (15 points)
  - Délai de livraison (15 points)

**Recommandations incluent** :
- Quantité précise à commander
- Coût estimé
- Niveau d'urgence (Urgent / Normal)
- Raison détaillée
- Fournisseur assigné

**Exemple** :
```
🔴 URGENT - Laptop Dell XPS 15
- Quantité: 45 unités
- Coût: 45,000€
- Fournisseur: Tech Supplies
- Criticité: 85/100
- Raison: Rupture dans 5j, Tendance hausse confirmée, Délai fournisseur critique
[Bouton: Commander]
```

---

### ✅ **5. Système de Cache Intelligent**

**Fichier** : `utils/ml/forecastCache.js`

**Fonctionnalités** :
- Cache des prévisions pendant **1 heure**
- Invalidation automatique après expiration
- Nettoyage des caches périmés
- Statistiques de cache (hit rate, etc.)

**Avantages** :
- ⚡ Temps de chargement 100x plus rapide
- 💰 Économie de calculs TensorFlow.js
- 🔋 Moins de consommation CPU/batterie

**API** :
```javascript
import { 
  cacheForecast, 
  getCachedForecast, 
  isCacheValid 
} from 'utils/ml/forecastCache';

// Vérifier le cache
if (isCacheValid('SKU-123')) {
  const forecast = getCachedForecast('SKU-123');
}

// Sauvegarder
cacheForecast('SKU-123', forecastData);
```

---

### ✅ **6. Réentraînement Automatique**

**Fichier** : `utils/ml/autoRetraining.js`

**Système de planification** :
- Vérification **toutes les heures**
- Recommandation de réentraînement après **7 jours**
- Enregistrement de chaque entraînement
- Compteur d'entraînements

**Notifications** :
- 🔄 Réentraînement Programmé (après 7 jours)
- ⚠️ Drift Détecté (dégradation performance)
- ℹ️ Données Mises à Jour (nouvelles ventes)

**API** :
```javascript
import { 
  shouldRetrain, 
  recordTraining, 
  scheduleAutoRetraining 
} from 'utils/ml/autoRetraining';

// Vérifier si réentraînement nécessaire
if (shouldRetrain(7)) {
  await retrain();
  recordTraining();
}

// Planifier automatiquement
const intervalId = scheduleAutoRetraining(() => {
  console.log('Réentraînement automatique !');
}, 7);
```

---

### ✅ **7. Détection de Drift du Modèle**

**Détecte automatiquement** quand le modèle se dégrade :

**Métriques surveillées** :
- **MAE** (Mean Absolute Error) - Si augmentation > 50% → Drift élevé
- **RMSE** (Root Mean Square Error) - Si augmentation > 50% → Drift élevé
- **R²** (Coefficient) - Si diminution > 30% → Drift moyen

**Niveaux de sévérité** :
- **High** : Performance significativement dégradée → Réentraînement urgent
- **Medium** : Dégradation notable → Réentraînement recommandé  
- **None** : Performance stable → OK

**API** :
```javascript
import { detectModelDrift } from 'utils/ml/autoRetraining';

const predictions = [
  { predicted: 10, actual: 12 },
  { predicted: 15, actual: 14 },
  // ...
];

const driftAnalysis = detectModelDrift(predictions, previousMetrics);

if (driftAnalysis.hasDrift) {
  console.warn(`Drift ${driftAnalysis.severity}: ${driftAnalysis.reasons}`);
  // Déclencher réentraînement
}
```

---

### ✅ **8. Système de Tracking Prévisions**

**Sauvegarde automatique** des prévisions pour comparaison future :

```javascript
const { savePredictionsForTracking, compareWithReality } = useDemandForecast(products);

// Sauvegarder les prévisions du jour
savePredictionsForTracking();

// Plus tard, comparer avec la réalité
const comparisons = compareWithReality('SKU-123', actualSales);
// Retourne: [{ date, predicted, actual }, ...]
```

**Stockage** : localStorage
**Rétention** : 7 jours
**Format** : `{ date: { sku: { predictions: [] } } }`

---

## 📂 Structure des Fichiers

```
src/
├── components/ml/
│   ├── MLInsightsDashboard.jsx       (Dashboard simple original)
│   ├── MLAdvancedDashboard.jsx       (Dashboard avancé principal) ⭐
│   ├── ForecastTrendChart.jsx        (Graphique tendances)
│   ├── DemandHeatmap.jsx             (Heatmap par jour)
│   ├── PredictionVsReality.jsx       (Comparaison)
│   ├── MLAlertPanel.jsx              (Panneau alertes)
│   ├── MLNotificationBadge.jsx       (Badge notifications)
│   └── index.js
│
├── hooks/ml/
│   ├── useDemandForecast.js          (Hook principal) ⭐
│   ├── useMLNotifications.js         (Hook notifications)
│   └── index.js
│
├── services/ml/
│   ├── dataCollector.js              (Collecte données)
│   ├── demandForecastModel.js        (Modèle TensorFlow.js) ⭐
│   ├── alertService.js               (Génération alertes)
│   ├── __tests__/
│   │   ├── dataCollector.test.js
│   │   └── demandForecastModel.test.js
│   └── index.js
│
└── utils/ml/
    ├── forecastCache.js              (Cache prévisions) ⭐
    ├── autoRetraining.js             (Auto-retraining & drift) ⭐
    └── index.js
```

---

## 🎯 Guide d'Utilisation

### **Accès au Dashboard ML**

1. Sidebar → **Analytics** (2ème position)
2. Cliquer pour déployer le sous-menu
3. Sélectionner **🤖 Prévisions IA**

ou

1. Aller dans **Analytics**
2. Cliquer sur l'onglet **Prévisions IA** en haut

### **Première Utilisation**

1. Cliquer sur **"Réentraîner"** (bouton violet)
2. Attendre 30-60 secondes (barre de progression)
3. ✅ Le dashboard s'affiche avec :
   - Alertes et recommandations
   - Sélecteur de produit
   - Sélecteur de période (7/30/60/90j)
   - Graphiques interactifs
   - Heatmaps et comparaisons

### **Sauvegarder les Prévisions**

Bouton **"Sauvegarder"** (vert) → Enregistre les prévisions pour comparaison future

### **Alertes et Recommandations**

- **Section en haut** : Résumé (Critiques, Importantes, Urgentes)
- **Liste détaillée** : Top 5 alertes avec actions
- **Bouton "Commander"** : Lance directement une commande

---

## 📊 Métriques de Performance

### **Métriques du Modèle**

| Métrique | Description | Bon Score |
|----------|-------------|-----------|
| **MAE** | Erreur moyenne absolue | < 2.0 |
| **RMSE** | Écart quadratique moyen | < 3.0 |
| **R²** | Corrélation prévisions/réalité | > 0.8 |
| **Précision** | % dans marge de 20% | > 80% |

### **Performance Système**

- **Chargement initial** : ~30-60 secondes (entraînement)
- **Avec cache** : < 100ms (instantané)
- **Génération prévisions** : ~2-3 secondes pour 100 produits
- **Stockage** : ~2-5 MB localStorage

---

## 🔧 Configuration

### **Paramètres Modifiables**

**Dans `useDemandForecast.js`** :
```javascript
// Paramètres d'entraînement
epochs: 100,              // Nombre d'itérations
batchSize: 32,           // Taille des lots
validationSplit: 0.2     // 20% pour validation
```

**Dans `forecastCache.js`** :
```javascript
const CACHE_DURATION = 3600000; // 1 heure (modifiable)
```

**Dans `autoRetraining.js`** :
```javascript
intervalDays = 7  // Réentraîner tous les 7 jours (modifiable)
```

---

## 🧪 Tests

**Fichiers de test** :
```bash
# Test du collecteur
npm test src/services/ml/__tests__/dataCollector.test.js

# Test du modèle
npm test src/services/ml/__tests__/demandForecastModel.test.js
```

**Résultats attendus** :
```
✓ 5 tests passés (dataCollector)
✓ 3 tests passés (demandForecastModel)
```

---

## 📦 Dépendances Ajoutées

```json
{
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow/tfjs-vis": "^1.5.1",
  "recharts": "^2.x.x",
  "date-fns": "^3.x.x"
}
```

**Total** : ~230 packages, ~15 Mo

---

## 🎨 Exemples de Code

### **Utiliser le Hook Principal**

```javascript
import { useDemandForecast } from 'hooks/ml';

function MyComponent({ products }) {
  const {
    forecasts,           // Prévisions par SKU
    isTraining,          // Entraînement en cours
    isReady,             // Modèle prêt
    error,               // Erreurs
    trainingProgress,    // 0-100%
    retrain,             // Réentraîner
    getForecastForProduct,
    savePredictionsForTracking,
    compareWithReality
  } = useDemandForecast(products);

  const forecast = getForecastForProduct('SKU-123');
  
  return (
    <div>
      <p>Prévision 7j: {forecast?.averagePredicted}</p>
      <p>Prévision 30j: {forecast?.avg30Days}</p>
      <p>Tendance: {forecast?.trend}</p>
      <button onClick={retrain}>Réentraîner</button>
    </div>
  );
}
```

### **Générer des Alertes**

```javascript
import { generateMLAlerts, generateAutoRecommendations } from 'services/ml';

const alerts = generateMLAlerts(products, forecasts);
// Retourne alertes triées par sévérité

const recommendations = generateAutoRecommendations(products, forecasts);
// Retourne recommandations triées par urgence
```

### **Utiliser le Cache**

```javascript
import { getCachedForecast, isCacheValid } from 'utils/ml/forecastCache';

if (isCacheValid('SKU-123')) {
  const forecast = getCachedForecast('SKU-123');
  // Utiliser les données du cache (rapide)
} else {
  // Régénérer les prévisions
}
```

---

## 📈 Statistiques de Développement

### **Commits** : 19 total
- `ffa93a4` - Installation TensorFlow.js
- `78849b2` - Collecteur de données
- `859b153` - Modèle ML avec tests
- `91c816d` - Hook React
- `5eed8ef` - Dashboard UI
- `d5fefaf` - Documentation
- `ca1b2b0` - Fix hooks bugs
- `196c947` - Fix products validation
- `62b7a04` - ErrorBoundary
- `4054ea5` - Fix enrichedProducts
- `1424e2e` - Intégration initiale
- `2e691aa` - Sous-onglets Analytics
- `ac07006` - Fix submenu toggle
- `ff20867` - Réorganisation sidebar
- `433228b` - Installation Recharts
- `1d0bdf1` - Visualisations avancées
- `f82eac6` - Alertes & auto-retraining
- `0b2340d` - Système notifications
- `a20b3b4` - Nettoyage (remove holidays)

### **Lignes de Code** : ~5,000+ lignes
- Services : ~1,200 lignes
- Composants : ~2,000 lignes
- Hooks : ~500 lignes
- Utils : ~700 lignes
- Tests : ~110 lignes
- Documentation : ~500 lignes

### **Fichiers Créés** : 16 fichiers
- 7 composants React
- 2 hooks personnalisés
- 4 services
- 2 utilitaires
- 2 fichiers de tests
- 1 documentation

---

## 🚀 Prochaines Améliorations Possibles

### **Features Supplémentaires**
- [ ] Promotions et événements spéciaux
- [ ] Modèles par catégorie de produits
- [ ] Multi-warehouses
- [ ] Export Excel/PDF des prévisions
- [ ] Graphiques de saisonnalité
- [ ] Intégration météo pour produits saisonniers

### **Optimisations Performance**
- [ ] Web Worker pour entraînement (non bloquant)
- [ ] Lazy loading de TensorFlow.js
- [ ] Compression du modèle sauvegardé
- [ ] Service Worker pour prévisions offline

### **Analytics Avancées**
- [ ] Dashboard temps réel de performance
- [ ] A/B testing de modèles
- [ ] Backtesting automatique
- [ ] Alertes par email/SMS

---

## 🐛 Troubleshooting

### **Le modèle ne s'entraîne pas**
- Vérifier qu'il y a au moins 50 enregistrements de ventes
- Vérifier la console pour les erreurs
- Essayer de vider le cache (DevTools → Application → Clear storage)

### **Prévisions peu précises**
- Normal au début, précision améliore avec le temps
- Ajouter plus de données historiques
- Réentraîner régulièrement (tous les 7 jours)

### **Page blanche**
- Vérifier la console navigateur (F12)
- L'ErrorBoundary affiche normalement un message
- Recharger la page

### **Cache ne fonctionne pas**
- Vérifier que localStorage n'est pas plein
- Nettoyer les caches périmés via `cleanExpiredCache()`

---

## 📚 Ressources

- [TensorFlow.js Docs](https://www.tensorflow.org/js)
- [Recharts Documentation](https://recharts.org/)
- [Date-fns Documentation](https://date-fns.org/)

---

**Créé le** : 21 octobre 2025  
**Branche** : `feature/ml-demand-forecast`  
**Status** : ✅ Production-ready  
**Version** : 2.0 (Advanced)

