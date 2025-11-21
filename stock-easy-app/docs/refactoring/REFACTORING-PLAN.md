# 📋 PLAN DE REFACTORISATION SÉCURISÉ - StockEasy.jsx

## RÈGLES ABSOLUES
1. ✅ JAMAIS plus de 100 lignes par phase
2. ✅ JAMAIS toucher aux classes CSS
3. ✅ JAMAIS supprimer l'ancien code (commenter avec `//OLD-PHASE-X:`)
4. ✅ TOUJOURS utiliser les feature flags
5. ✅ TOUJOURS permettre le rollback

## ÉTAT ACTUEL
- **Fichier** : `stock-easy-app/src/StockEasy.jsx`
- **Lignes** : ~2800 lignes
- **Objectif** : Réduire à <300 lignes (orchestrateur uniquement)
- **Déjà externalisé** : Beaucoup de logique est déjà dans des hooks (useStockData, useOrderManagement, etc.)

## ANALYSE DÉTAILLÉE

### ✅ DÉJÀ EXTERNALISÉ (ne pas toucher)
- `useStockData` - Gestion des données (products, suppliers, warehouses, orders, parameters)
- `useOrderManagement` - Gestion des commandes (confirmOrder, shipOrder, receiveOrder, generatePONumber)
- `useSupplierManagement` - Gestion des fournisseurs
- `useModals` - Gestion des modals
- `useReconciliation` - Logique de réconciliation
- `useEmailGeneration` - Génération d'emails (déjà externalisé !)
- `useInlineModals` - Modals inline
- `useShipOrderModal` - Modal d'expédition
- Utils : `calculateMetrics`, `formatCurrency`, `roundToTwoDecimals`, etc.

### 📦 À EXTRAIRE (par priorité)

---

## 🟢 PHASE 1 : CONSTANTES ET CONFIGURATIONS (SANS RISQUE)
**Risque** : FAIBLE  
**Lignes** : ~20 lignes  
**Fichier à créer** : `src/config/constants.js` (ou ajouter à `src/constants/stockEasyConstants.js`)

### Constantes à extraire :
1. **`kpiTitles`** (lignes 623-628)
   - Mapping des clés KPI vers leurs titres
   - Constante statique
   - ~6 lignes

2. **`statusLabels`** (dans `exportHistoryToCSV`, lignes 1966-1973)
   - Labels de statut pour l'export CSV
   - Constante locale qui devrait être globale
   - ~8 lignes

**Note** : La plupart des constantes sont déjà dans `stockEasyConstants.js`. On extrait seulement celles qui restent dans StockEasy.jsx.

**Total Phase 1** : ~14 lignes

---

## 🟢 PHASE 2 : FONCTIONS UTILITAIRES PURES (SANS RISQUE)
**Risque** : FAIBLE  
**Lignes** : ~200 lignes  
**Fichier à créer** : `src/utils/emailUtils.js`

### Fonctions à extraire :
1. **`getUserSignature()`** (lignes 130-137)
   - Fonction pure qui génère la signature utilisateur
   - Dépend de `currentUser` (passé en paramètre)
   - ~8 lignes

2. **`generateEmailDraft()`** (lignes 1013-1049)
   - Génère le brouillon d'email pour une commande
   - Dépend de : `supplier`, `products`, `orderQuantities`, `warehouses`, `selectedWarehouse`, `deviseDefaut`, `getUserSignature`
   - ~37 lignes

3. **`generateReclamationEmail()`** (lignes 1809-1884)
   - Génère l'email de réclamation
   - Dépend de : `order`, `suppliers`, `products`, `getUserSignature`
   - ~76 lignes

4. **`exportHistoryToCSV()`** (lignes 1943-2022)
   - Exporte l'historique en CSV
   - Dépend de : `orders`, `products`, `historyFilter`, `historyDateStart`, `historyDateEnd`, `currencySymbol`, `formatWithCurrency`, `formatConfirmedDate`, `roundToTwoDecimals`, `toast`
   - ~80 lignes

**Total Phase 2** : ~201 lignes (mais on peut diviser en sous-phases si nécessaire)

---

## 🟢 PHASE 3 : HANDLERS PARAMÈTRES (RISQUE FAIBLE)
**Risque** : FAIBLE  
**Lignes** : ~80 lignes  
**Fichier à créer** : `src/handlers/parameterHandlers.js`

### Fonctions à extraire :
1. **`handleUpdateSeuilSurstock()`** (lignes 369-395)
   - Met à jour le seuil de surstock
   - Dépend de : `api`, `setSeuilSurstockProfond`, `updateParameterState`, `toast`
   - ~27 lignes

2. **`handleUpdateDevise()`** (lignes 396-415)
   - Met à jour la devise
   - Dépend de : `api`, `setDeviseDefaut`, `updateParameterState`, `toast`
   - ~20 lignes

3. **`handleUpdateMultiplicateur()`** (lignes 416-439)
   - Met à jour le multiplicateur
   - Dépend de : `api`, `setMultiplicateurDefaut`, `updateParameterState`, `toast`
   - ~24 lignes

**Total Phase 3** : ~71 lignes

---

## 🟢 PHASE 4 : HANDLERS WAREHOUSES (RISQUE FAIBLE)
**Risque** : FAIBLE  
**Lignes** : ~50 lignes  
**Fichier à créer** : `src/handlers/warehouseHandlers.js`

### Fonctions à extraire :
1. **`handleCreateWarehouse()`** (lignes 591-602)
   - Crée un entrepôt
   - Dépend de : `api`, `loadData`, `toast`
   - ~12 lignes

2. **`handleUpdateWarehouse()`** (lignes 604-615)
   - Met à jour un entrepôt
   - Dépend de : `api`, `loadData`, `toast`
   - ~12 lignes

3. **`handleDeleteWarehouse()`** (lignes 617-630)
   - Supprime un entrepôt
   - Dépend de : `api`, `loadData`, `toast`
   - ~14 lignes

**Total Phase 4** : ~38 lignes

---

## 🟡 PHASE 5 : HANDLERS MAPPING (RISQUE MOYEN)
**Risque** : MOYEN  
**Lignes** : ~80 lignes  
**Fichier à créer** : `src/handlers/mappingHandlers.js`

### Fonctions à extraire :
1. **`handleAssignSupplier()`** (lignes 496-512)
   - Assigne un fournisseur à un produit
   - Dépend de : `api`, `loadData`, `toast`, `inlineModals`, `productToMap`
   - ~17 lignes

2. **`handleRemoveSupplierFromProduct()`** (lignes 513-530)
   - Retire un fournisseur d'un produit
   - Dépend de : `api`, `loadData`, `toast`, `products`
   - ~18 lignes

3. **`handleSaveSupplierMapping()`** (lignes 668-712)
   - Sauvegarde le mapping fournisseur-produit
   - Dépend de : `api`, `loadData`, `toast`, `products`, `setIsSavingSupplierMapping`
   - ~45 lignes

**Total Phase 5** : ~80 lignes

---

## 🟡 PHASE 6 : HANDLERS PRODUITS (RISQUE MOYEN)
**Risque** : MOYEN  
**Lignes** : ~60 lignes  
**Fichier à créer** : `src/handlers/productHandlers.js`

### Fonctions à extraire :
1. **`updateProductParam()`** (lignes 646-667)
   - Met à jour un paramètre produit
   - Dépend de : `api`, `loadData`, `toast`
   - ~22 lignes

2. **`startEditParam()`** (lignes 668-672)
   - Démarre l'édition d'un paramètre
   - Dépend de : `setEditingParam`, `setTempParamValue`
   - ~5 lignes

3. **`saveParam()`** (lignes 673-681)
   - Sauvegarde un paramètre
   - Dépend de : `updateProductParam`, `editingParam`, `tempParamValue`, `setEditingParam`, `setTempParamValue`
   - ~9 lignes

4. **`cancelEditParam()`** (lignes 682-686)
   - Annule l'édition d'un paramètre
   - Dépend de : `setEditingParam`, `setTempParamValue`
   - ~5 lignes

**Total Phase 6** : ~41 lignes

---

## 🟡 PHASE 7 : CALCULS USEMEMO / BUSINESS LOGIC (RISQUE MOYEN)
**Risque** : MOYEN  
**Lignes** : ~120 lignes  
**Fichier à créer** : `src/hooks/useProductStatus.js` (nouveau hook)

### Calculs à extraire :
1. **`productsByStatus`** (lignes 533-565)
   - Calcule les produits par statut (to_order, watch, in_transit, received)
   - Dépend de : `enrichedProducts`, `orders`
   - ~33 lignes

2. **`toOrderBySupplier`** (lignes 566-576)
   - Groupe les produits à commander par fournisseur
   - Dépend de : `productsByStatus`
   - ~11 lignes

3. **`notifications`** (lignes 577-615)
   - Calcule les notifications
   - Dépend de : `productsByStatus`, `orders`
   - ~39 lignes

**Total Phase 7** : ~83 lignes (mais peut être divisé en sous-phases)

---

## 🔴 PHASE 8 : HANDLERS COMMANDES COMPLEXES (RISQUE ÉLEVÉ)
**Risque** : ÉLEVÉ  
**Lignes** : ~200 lignes  
**Fichier à créer** : `src/handlers/orderHandlers.js`

### Fonctions à extraire :
1. **`handleCreateOrderFromTable()`** (lignes 910-988)
   - Crée une commande depuis la table de sélection
   - Dépend de : `enrichedProducts`, `toOrderBySupplier`, `warehouses`, `api`, `loadData`, `toast`, `generatePONumber`, `roundToTwoDecimals`, `setEmailModalOpen`, `setSelectedSupplier`, `setSelectedWarehouse`, `setOrderQuantities`
   - ~79 lignes

2. **`handleCreateOrder()`** (lignes 989-1019)
   - Crée une commande simple
   - Dépend de : `selectedWarehouse`, `api`, `loadData`, `toast`, `generatePONumber`, `orderQuantities`, `products`
   - ~31 lignes

**Total Phase 8** : ~110 lignes

---

## 🔴 PHASE 9 : HANDLERS RÉCONCILIATION (RISQUE ÉLEVÉ)
**Risque** : ÉLEVÉ  
**Lignes** : ~300 lignes  
**Fichier à créer** : `src/handlers/reconciliationHandlers.js`

### Fonctions à extraire :
1. **`confirmReconciliationWithQuantities()`** (lignes 1061-1180)
   - Confirme la réconciliation avec quantités
   - Dépend de : `reconciliationOrder`, `inlineModals`, `discrepancyTypes`, `api`, `loadData`, `toast`, `setReconciliationModalOpen`, `setReconciliationOrder`, `setDiscrepancyTypes`, `setTrackTabSection`
   - ~120 lignes

2. **`handleReconciliationConfirm()`** (lignes 1673-1750)
   - Handler principal de réconciliation
   - Dépend de : `reconciliationModal`, `reconciliationData`, `api`, `loadData`, `toast`, `emailGeneration`, `reconciliationModalHandlers`, `reclamationEmailModalHandlers`
   - ~78 lignes

**Total Phase 9** : ~198 lignes

---

## 📊 RÉSUMÉ DES PHASES

| Phase | Type | Risque | Lignes | Fichier | Alignement cursorrules.txt |
|-------|------|--------|--------|---------|----------------------------|
| 1 | Constantes | 🟢 FAIBLE | ~14 | `src/constants/stockEasyConstants.js` | ✅ PHASE 1 : Constantes et Configurations |
| 2 | Fonctions pures | 🟢 FAIBLE | ~201 | `src/utils/emailUtils.js` | ✅ PHASE 2 : Fonctions Utilitaires Pures |
| 3 | Handlers paramètres | 🟢 FAIBLE | ~71 | `src/handlers/parameterHandlers.js` | ✅ PHASE 5 : Event Handlers Simples |
| 4 | Handlers warehouses | 🟢 FAIBLE | ~38 | `src/handlers/warehouseHandlers.js` | ✅ PHASE 5 : Event Handlers Simples |
| 5 | Handlers mapping | 🟡 MOYEN | ~80 | `src/handlers/mappingHandlers.js` | ✅ PHASE 5 : Event Handlers Simples |
| 6 | Handlers produits | 🟡 MOYEN | ~41 | `src/handlers/productHandlers.js` | ✅ PHASE 5 : Event Handlers Simples |
| 7 | Calculs useMemo | 🟡 MOYEN | ~83 | `src/hooks/useProductStatus.js` | ✅ PHASE 6 : Business Logic Isolée |
| 8 | Handlers commandes | 🔴 ÉLEVÉ | ~110 | `src/handlers/orderHandlers.js` | ✅ PHASE 5 : Event Handlers Simples |
| 9 | Handlers réconciliation | 🔴 ÉLEVÉ | ~198 | `src/handlers/reconciliationHandlers.js` | ✅ PHASE 5 : Event Handlers Simples |

**TOTAL À EXTRAIRE** : ~836 lignes  
**ESTIMATION FINALE** : ~2800 - 836 = ~1964 lignes restantes

⚠️ **NOTE** : 
- Les phases 1-2 correspondent exactement à cursorrules.txt
- Les phases 3-6 regroupent les "Event Handlers Simples" de cursorrules.txt
- La phase 7 correspond à "Business Logic Isolée"
- Les phases 8-9 sont optionnelles et ne seront faites que si les phases 1-7 sont 100% réussies

---

## 🎯 STRATÉGIE D'EXÉCUTION

### Ordre recommandé (aligné avec cursorrules.txt) :
1. ✅ Phase 1 (constantes) - Le plus sûr, correspond à cursorrules.txt PHASE_1
2. ✅ Phase 2 (fonctions pures) - Le plus sûr, correspond à cursorrules.txt PHASE_2
3. ✅ Phase 3 (paramètres) - Simple
4. ✅ Phase 4 (warehouses) - Simple
5. ⚠️ Phase 5 (mapping) - À valider soigneusement
6. ⚠️ Phase 6 (produits) - À valider soigneusement
7. ⚠️ Phase 7 (calculs) - Création d'un hook, plus complexe, correspond à cursorrules.txt PHASE_6
8. ❌ Phase 8 (commandes) - Seulement si 1-7 OK
9. ❌ Phase 9 (réconciliation) - Seulement si 1-8 OK

### Validation après chaque phase :
1. Mettre le flag à `true`
2. Relancer l'app
3. Vérifier la console (pas d'erreurs)
4. Tester les fonctionnalités concernées
5. Si OK → Continuer
6. Si KO → Mettre flag à `false` et rollback

---

## 🚨 POINTS D'ATTENTION

### Phase 1 (Constantes) :
- `kpiTitles` - Constante simple, peut être ajoutée à stockEasyConstants.js
- `statusLabels` - Déjà défini dans stockEasyConstants.js (ORDER_STATUS_LABELS), peut être réutilisé

### Phase 2 (Fonctions pures) :
- `getUserSignature` utilise `currentUser` - doit être passé en paramètre
- `generateEmailDraft` utilise plusieurs dépendances - bien les passer en paramètres
- `exportHistoryToCSV` utilise `toast` - peut être passé en paramètre ou importé

### Phase 7 :
- Création d'un nouveau hook `useProductStatus`
- Doit retourner `productsByStatus`, `toOrderBySupplier`, `notifications`
- Attention aux dépendances React (useMemo)

### Phases 8-9 :
- Beaucoup de dépendances
- Logique complexe
- À faire en dernier seulement

---

## 📝 NOTES IMPORTANTES

1. **Ne pas toucher** aux composants UI (DashboardTab, ActionsTab, etc.)
2. **Ne pas toucher** aux imports existants
3. **Ne pas toucher** aux classes CSS
4. **Toujours** garder l'ancien code commenté
5. **Toujours** utiliser les feature flags
6. **Toujours** valider après chaque phase

---

## ✅ PROCHAINES ÉTAPES

1. ✅ Backup Git créé (tag: `BACKUP-SAFE-COMPLET`)
2. ✅ Fichiers de sécurité créés
3. ✅ Plan détaillé créé
4. ⏳ **ATTENDRE CONFIRMATION** avant de commencer Phase 1

