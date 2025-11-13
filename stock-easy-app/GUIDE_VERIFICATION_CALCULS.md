# 🧮 Guide de Vérification des Calculs - Quantité à Commander

## 📋 Vue d'Ensemble

Après avoir appliqué la migration 013, les calculs de quantité à commander sont maintenant **automatiques** et **cohérents**.

---

## ✅ Étape 1: Appliquer la Migration

### Dans Supabase Dashboard → SQL Editor

```sql
-- Copier/coller le contenu de:
-- /supabase/migrations/013_implement_qty_to_order_calculation.sql
```

**Résultat attendu** :
```
🔄 Recalcul de X produit(s)...
✅ X produit(s) recalculé(s) avec succès

================================================
✅ Migration 013 appliquée avec succès !
================================================

📊 Fonctions créées:
  - calculate_product_metrics() [TRIGGER]
  - recalculate_all_products()
  - recalculate_product(sku)
  - analyze_product_calculation(sku)
```

---

## 🔍 Étape 2: Vérifier les Calculs

### Vérification Backend (Supabase)

#### Analyser un produit spécifique (ex: SKU 003)

```sql
SELECT analyze_product_calculation('003');
```

**Résultat attendu** :
```json
{
  "success": true,
  "analysis": {
    "sku": "003",
    "nom_produit": "Produit 003",
    "donnees_base": {
      "stock_actuel": 30,
      "ventes_jour_ajustees": 5,
      "lead_time_days": 14,
      "moq": 50,
      "stock_max": 200
    },
    "calculs": {
      "stock_securite": 3,
      "point_commande": 85,
      "autonomie_jours": 6.0
    },
    "resultat": {
      "quantite_a_commander": 100,
      "besoin_commander": true,
      "raison": "Stock (30) ≤ Point de commande (85)"
    }
  }
}
```

#### Voir tous les produits à commander

```sql
SELECT 
  sku,
  nom_produit,
  stock_actuel,
  point_commande,
  quantite_a_commander,
  ventes_jour_ajustees,
  lead_time_days,
  moq
FROM produits
WHERE quantite_a_commander > 0
ORDER BY quantite_a_commander DESC;
```

#### Recalculer tous les produits

```sql
SELECT recalculate_all_products();
```

---

### Vérification Frontend (Console Navigateur)

#### 1. Test Automatique

Dans la console (F12) :

```javascript
// Charger les données
const data = await api.getAllData();
const products = data.products;

// Vérifier tous les produits
window.verifyCalculations.verifyAllProducts(products);
```

**Résultat attendu** :
```
📊 Rapport de Vérification des Calculs
Total produits: 50
✅ Cohérents: 50 (100%)
❌ Incohérents: 0
```

#### 2. Analyser un produit spécifique

```javascript
// Trouver le produit
const product = products.find(p => p.sku === '003');

// Analyser
window.verifyCalculations.analyzeProductCalculation(product);
```

**Résultat attendu** :
```
📊 Analyse Détaillée - 003
Données de base: {stockActuel: 30, ventesJour: 5, ...}
Calculs intermédiaires: {stockSecurite: 3, pointCommande: 85, ...}
Résultat: {quantiteCommander: 100, besoinCommander: true, ...}
Comparaison BDD: {valeurBDD: 100, valeurCalculee: 100, coherent: true}
```

---

## 📐 Formules Implémentées

### 1. Stock de Sécurité

```
SI stock_securite_personnalise existe ALORS
  Stock de sécurité = stock_securite_personnalise
SINON
  Stock de sécurité = CEIL(lead_time_days × 0.2)
FIN SI

Minimum = 1
```

**Exemple** :
```
Lead time = 30 jours
Stock sécu = CEIL(30 × 0.2) = 6 unités
```

### 2. Point de Commande

```
Point de commande = (Ventes/jour × Délai) + (Ventes/jour × Stock sécu)

Minimum = MOQ
```

**Exemple** :
```
Ventes/jour = 5
Délai = 14 jours
Stock sécu = 3

Point de commande = (5 × 14) + (5 × 3) = 70 + 15 = 85 unités
```

### 3. Quantité à Commander

```
SI stock_actuel ≤ point_commande ALORS
  Quantité brute = point_commande - stock + (stock_sécu × ventes/jour)
  Quantité arrondie = CEIL(Quantité brute / MOQ) × MOQ
  
  SI quantité > 0 ET quantité < MOQ ALORS
    quantité = MOQ
  FIN SI
  
  SI stock + quantité > stock_max ALORS
    quantité = stock_max - stock
    Ré-arrondir au MOQ inférieur
  FIN SI
  
SINON
  Quantité = 0
FIN SI
```

**Exemple SKU 003** :
```
Stock actuel = 30
Point de commande = 85
Stock sécu = 3
Ventes/jour = 5
MOQ = 50

Stock (30) ≤ Point (85) ? OUI

Quantité brute = 85 - 30 + (3 × 5) = 55 + 15 = 70
Quantité arrondie = CEIL(70 / 50) × 50 = 2 × 50 = 100 unités

✅ quantite_a_commander = 100
```

---

## 🧪 Scénarios de Test

### Test 1: Produit en Stock Faible

**Données** :
```
Stock actuel = 10
Ventes/jour = 5
Délai = 10 jours
MOQ = 20
```

**Calculs** :
```
Stock sécu = CEIL(10 × 0.2) = 2
Point commande = (5 × 10) + (5 × 2) = 60
Quantité = 60 - 10 + 10 = 60
Arrondi = CEIL(60/20) × 20 = 60
```

**Résultat** : `qtyToOrder = 60`

---

### Test 2: Produit avec Stock Suffisant

**Données** :
```
Stock actuel = 100
Ventes/jour = 2
Délai = 15 jours
MOQ = 10
```

**Calculs** :
```
Stock sécu = CEIL(15 × 0.2) = 3
Point commande = (2 × 15) + (2 × 3) = 36
Stock (100) > Point (36) ? OUI
```

**Résultat** : `qtyToOrder = 0`

---

### Test 3: Produit avec MOQ Élevé

**Données** :
```
Stock actuel = 5
Ventes/jour = 1
Délai = 30 jours
MOQ = 100
```

**Calculs** :
```
Stock sécu = CEIL(30 × 0.2) = 6
Point commande = (1 × 30) + (1 × 6) = 36
Quantité brute = 36 - 5 + 6 = 37
Quantité arrondie = CEIL(37/100) × 100 = 100
```

**Résultat** : `qtyToOrder = 100`

---

## ❓ FAQ

### Q1: Pourquoi ma quantité a changé après la migration ?

**R** : La migration a appliqué les formules correctes. Les anciennes valeurs étaient peut-être obsolètes ou calculées manuellement.

**Action** : Vérifiez avec `analyze_product_calculation('SKU')` pour comprendre le nouveau calcul.

---

### Q2: Comment forcer le recalcul d'un seul produit ?

**R** : Utilisez la fonction SQL :

```sql
SELECT recalculate_product('003');
```

Ou mettez à jour n'importe quel champ :

```sql
UPDATE produits 
SET updated_at = NOW() 
WHERE sku = '003';
```

---

### Q3: Les calculs se font-ils en temps réel ?

**R** : **OUI**. Le trigger se déclenche automatiquement sur :
- `INSERT` (création de produit)
- `UPDATE` (modification de n'importe quel champ)

Les champs recalculés :
- `stock_securite`
- `point_commande`
- `quantite_a_commander`

---

### Q4: Puis-je personnaliser le stock de sécurité ?

**R** : **OUI**. Définissez `stock_securite_personnalise` :

```sql
UPDATE produits 
SET stock_securite_personnalise = 10
WHERE sku = '003';
```

Le trigger utilisera cette valeur au lieu de calculer 20% du délai.

---

### Q5: Comment désactiver les calculs automatiques ?

**R** : Supprimez le trigger (non recommandé) :

```sql
DROP TRIGGER IF EXISTS trigger_calculate_metrics ON public.produits;
```

**⚠️ Attention** : Les calculs ne seront plus automatiques !

---

## 🎯 Checklist de Validation

Avant de considérer les calculs comme validés :

- [ ] Migration 013 appliquée sans erreur
- [ ] Logs de recalcul affichés (X produits recalculés)
- [ ] Test `analyze_product_calculation('003')` retourne des résultats cohérents
- [ ] Vérification frontend : 100% de cohérence
- [ ] Au moins 3 produits testés manuellement
- [ ] Les produits à commander apparaissent dans l'onglet Actions
- [ ] Les quantités sont arrondies au MOQ
- [ ] Aucune erreur dans les logs

---

## 📊 Monitoring Continu

### Requête SQL de Monitoring

```sql
-- Vue d'ensemble des calculs
SELECT 
  COUNT(*) as total_produits,
  COUNT(*) FILTER (WHERE quantite_a_commander > 0) as produits_a_commander,
  ROUND(AVG(quantite_a_commander), 0) as moyenne_qte_commande,
  SUM(quantite_a_commander * prix_achat) as investissement_total
FROM produits
WHERE company_id = get_current_user_company_id();
```

### Script Frontend de Monitoring

```javascript
// À exécuter périodiquement dans la console
async function monitorCalculations() {
  const data = await api.getAllData();
  const report = window.verifyCalculations.verifyAllProducts(data.products);
  
  if (report.consistencyRate < 95) {
    console.error('⚠️ Taux de cohérence faible !', report);
    console.log('💡 Exécuter: SELECT recalculate_all_products();');
  } else {
    console.log('✅ Tous les calculs sont cohérents');
  }
  
  return report;
}

// Exécuter
monitorCalculations();
```

---

## ✅ Conclusion

Avec la migration 013 :
- ✅ **Calculs automatiques** à chaque modification
- ✅ **Formules cohérentes** backend ↔ frontend
- ✅ **Vérifications** disponibles dans les deux environnements
- ✅ **Transparence** totale avec `analyze_product_calculation()`

**Les utilisateurs reçoivent maintenant des données fiables et à jour !** 🎉

