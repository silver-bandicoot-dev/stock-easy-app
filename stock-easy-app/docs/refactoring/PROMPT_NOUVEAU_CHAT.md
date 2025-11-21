# 🚀 PROMPT POUR NOUVEAU CHAT - Refactoring StockEasy.jsx

## 📋 INTRODUCTION

Bonjour ! Je continue le refactoring de mon fichier `StockEasy.jsx`. Le travail a déjà été largement effectué, et je souhaite continuer de manière sécurisée et méthodique.

---

## 📄 CONTEXTE COMPLET À LIRE EN PREMIER

**LIRE OBLIGATOIREMENT ces fichiers dans l'ordre :**

1. **`docs/refactoring/CONTEXTE_POUR_SUITE.md`** ⭐ **LE PLUS IMPORTANT**
   - État actuel complet du projet
   - Tout le travail déjà effectué
   - Fichiers importants à référencer
   - Prochaines priorités détaillées
   - Règles et contraintes

2. **`cursorrules.txt`**
   - Règles absolues du refactoring
   - Processus à suivre
   - Règles de sécurité

3. **`docs/refactoring/logs/PROCHAINES_ETAPES.md`**
   - Plan d'amélioration détaillé
   - Priorités restantes

---

## 📊 ÉTAT ACTUEL

- **Fichier principal** : `src/StockEasy.jsx` (1336 lignes)
- **Lignes initiales** : ~2800 lignes
- **Réduction actuelle** : 1464 lignes (52.2%)
- **Statut** : ✅ Fonctionnel, prêt pour optimisations
- **Build** : ✅ Réussi
- **Linter** : ✅ Aucune erreur
- **Tests** : ✅ Application fonctionnelle

---

## 🎯 PROCHAINE PRIORITÉ

### **PRIORITÉ 5 : Extraire les hooks personnalisés**

**Objectif** : Créer des hooks personnalisés pour regrouper la logique d'état

**Hooks à créer** :

1. **`useTabManagement`**
   - Fichier : `src/hooks/useTabManagement.js`
   - Extraire : `activeTab`, `trackTabSection`, `analyticsSubTab`, `parametersSubTab` + fonction `onNavigateToTab`
   - Gain estimé : ~30-50 lignes

2. **`useParameterState`**
   - Fichier : `src/hooks/useParameterState.js`
   - Extraire : `seuilSurstockProfond`, `deviseDefaut`, `multiplicateurDefaut` + `useEffect` de synchronisation
   - Gain estimé : ~50-80 lignes

**Gain total estimé** : ~80-130 lignes  
**Risque** : ⚠️ MOYEN (nécessite tests complets)

---

## 📁 FICHIERS IMPORTANTS À CONSULTER

### Fichier principal
- **`src/StockEasy.jsx`** (1336 lignes) - Le fichier à refactoriser

### Handlers existants (pour référence)
- `src/handlers/parameterHandlers.js`
- `src/handlers/warehouseHandlers.js`
- `src/handlers/mappingHandlers.js`
- `src/handlers/orderHandlers.js`
- `src/handlers/uiHandlers.js`
- `src/handlers/authHandlers.js`
- `src/handlers/reconciliationHandlers.js`
- `src/handlers/reclamationHandlers.js`

### Hooks existants (pour référence)
- `src/hooks/useProductStatus.js`
- `src/hooks/useStockData.js`
- `src/hooks/useOrderManagement.js`
- `src/hooks/useSupplierManagement.js`
- `src/hooks/useModals.js`
- `src/hooks/useReconciliation.js`
- `src/hooks/useEmailGeneration.js`
- `src/hooks/useInlineModals.js`
- `src/hooks/useShipOrderModal.js`

### Utilitaires
- `src/utils/emailUtils.js`
- `src/constants/stockEasyConstants.js`

---

## ⚠️ RÈGLES ABSOLUES

1. **NE JAMAIS modifier les classes CSS** - C'est une règle absolue
2. **TOUJOURS tester** dans le navigateur ET avec Supabase MCP après chaque modification
3. **PRÉSERVER toutes les fonctionnalités** - Aucune régression
4. **UTILISER le même pattern** que les hooks existants
5. **DOCUMENTER** les changements

---

## 🔍 ANALYSE DU CODE À EXTRAIRE

### Pour `useTabManagement`

**États à extraire** (lignes ~287-317 dans StockEasy.jsx) :
```javascript
const [activeTab, setActiveTab] = useState(MAIN_TABS.DASHBOARD);
const [trackTabSection, setTrackTabSection] = useState(TRACK_TABS.EN_COURS_COMMANDE);
const [parametersSubTab, setParametersSubTab] = useState(SETTINGS_TABS.GENERAL);
const [analyticsSubTab, setAnalyticsSubTab] = useState(ANALYTICS_TABS.KPIS);
```

**Fonction à extraire** (lignes ~361-379) :
```javascript
const onNavigateToTab = (tabName, subTabName = null) => {
  const tabMap = {
    'settings': MAIN_TABS.SETTINGS,
    'track': MAIN_TABS.TRACK,
    'actions': MAIN_TABS.ACTIONS,
    'stock': MAIN_TABS.STOCK,
    'analytics': MAIN_TABS.ANALYTICS
  };
  
  const mappedTab = tabMap[tabName] || tabName;
  setActiveTab(mappedTab);
  
  if (subTabName === 'mapping') {
    setParametersSubTab(SETTINGS_TABS.MAPPING);
  }
};
```

### Pour `useParameterState`

**États à extraire** (lignes ~173-175) :
```javascript
const [seuilSurstockProfond, setSeuilSurstockProfond] = useState(90);
const [deviseDefaut, setDeviseDefaut] = useState('EUR');
const [multiplicateurDefaut, setMultiplicateurDefaut] = useState(1.2);
```

**useEffect à extraire** (lignes 415-439) :
```javascript
useEffect(() => {
  if (!parameters || Array.isArray(parameters)) {
    return;
  }

  const { seuilSurstockProfond: seuil, deviseDefaut: devise, multiplicateurDefaut: multiplicateur } = parameters;

  if (seuil !== undefined && seuil !== null) {
    const parsedSeuil = Number(seuil);
    if (!Number.isNaN(parsedSeuil) && parsedSeuil !== seuilSurstockProfond) {
      setSeuilSurstockProfond(parsedSeuil);
    }
  }

  if (devise && devise !== deviseDefaut) {
    setDeviseDefaut(devise);
  }

  if (multiplicateur !== undefined && multiplicateur !== null) {
    const parsedMultiplicateur = Number(multiplicateur);
    if (!Number.isNaN(parsedMultiplicateur) && Math.abs(parsedMultiplicateur - multiplicateurDefaut) > 0.0001) {
      setMultiplicateurDefaut(parsedMultiplicateur);
    }
  }
}, [parameters, deviseDefaut, multiplicateurDefaut, seuilSurstockProfond]);
```

**⚠️ Point d'attention** : `seuilSurstockProfond` est utilisé dans `useAutoNotifications` (ligne 193) - doit rester accessible depuis le hook.

---

## 🚀 PLAN D'EXÉCUTION

### Étape 1 : Créer `useTabManagement`
1. Lire `src/hooks/useProductStatus.js` pour voir le pattern
2. Créer `src/hooks/useTabManagement.js`
3. Extraire les états et la fonction `onNavigateToTab`
4. Retourner les états, setters et la fonction
5. Remplacer dans `StockEasy.jsx`
6. Tester dans le navigateur (navigation entre onglets)

### Étape 2 : Créer `useParameterState`
1. Lire `src/hooks/useStockData.js` pour voir le pattern
2. Créer `src/hooks/useParameterState.js`
3. Extraire les états et le `useEffect` de synchronisation
4. Retourner les états et setters
5. Remplacer dans `StockEasy.jsx`
6. Tester dans le navigateur ET Supabase MCP (modification/sauvegarde paramètres)

### Étape 3 : Validation finale
1. Vérifier le build : `npm run build`
2. Vérifier le linter : `npm run lint`
3. Tester toutes les fonctionnalités dans le navigateur
4. Vérifier dans Supabase MCP si nécessaire

---

## 📝 TESTS REQUIS

### Tests `useTabManagement`
- ✅ Navigation entre tous les onglets (Dashboard, Order, Track, Stock, Analytics, History, Settings, Profile)
- ✅ Sous-onglets Analytics fonctionnent
- ✅ Sous-onglets Settings fonctionnent
- ✅ Fonction `onNavigateToTab` fonctionne

### Tests `useParameterState`
- ✅ Modification du seuil de surstock → sauvegarde → vérification Supabase
- ✅ Modification de la devise → sauvegarde → vérification Supabase
- ✅ Modification du multiplicateur → sauvegarde → vérification Supabase
- ✅ Synchronisation au chargement depuis Supabase
- ✅ `seuilSurstockProfond` accessible pour `useAutoNotifications`

---

## 🎯 RÉSULTAT ATTENDU

### Métriques
- **Lignes finales** : ~1200-1250 lignes (réduction de ~55-57%)
- **Code propre** : Hooks bien organisés
- **Fonctionnalité** : Toutes les fonctionnalités préservées

### Structure
- **Hooks** : Toute la logique d'état dans `src/hooks/`
- **StockEasy.jsx** : Composant principal avec uniquement la logique de rendu

---

## 💡 CONSEILS

1. **Suivre le pattern** des hooks existants (`useProductStatus.js` est un bon exemple)
2. **Tester progressivement** - Ne pas tout faire d'un coup
3. **Vérifier les dépendances** - S'assurer que toutes les dépendances sont passées
4. **Documenter** - Ajouter des commentaires JSDoc aux hooks
5. **Utiliser Supabase MCP** - Pour vérifier les modifications de données

---

## ✅ VALIDATION FINALE

Avant de considérer la tâche terminée :
- ✅ Build réussi
- ✅ Linter sans erreurs
- ✅ Tous les tests navigateur passés
- ✅ Vérification Supabase MCP si nécessaire
- ✅ Aucune régression fonctionnelle
- ✅ Code propre et bien organisé

---

**Merci de suivre ce plan méthodiquement et de tester à chaque étape ! 🚀**



