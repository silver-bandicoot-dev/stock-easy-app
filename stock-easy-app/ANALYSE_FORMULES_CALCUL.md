# 📊 Analyse des Formules de Calcul - Quantité à Commander

## ⚠️ PROBLÈME IDENTIFIÉ

**Constat** : Le SKU 003 a `quantite_a_commander = 50` dans la base de données, mais **aucune formule de calcul automatique** n'existe actuellement dans le backend.

**Impact** : Les valeurs doivent être calculées manuellement ou par un script externe, ce qui peut entraîner :
- ❌ Données obsolètes
- ❌ Incohérences
- ❌ Risque d'erreur humaine

---

## 🔍 État Actuel des Calculs

### Frontend (`calculations.js`)

Le frontend **NE CALCULE PAS** `qtyToOrder`. Il utilise simplement la valeur venant de la base :

```javascript
// ligne 27 de calculations.js
if (product.qtyToOrder > 0) {
  healthStatus = 'urgent';
  // ...
}
```

✅ **Bon point** : Le frontend respecte la valeur de la BDD  
❌ **Problème** : Si la BDD n'est pas à jour, l'info est fausse

### Backend (Supabase)

Actuellement, la fonction `calculate_product_metrics()` est un **stub vide** :

```sql
CREATE OR REPLACE FUNCTION public.calculate_product_metrics()
RETURNS TRIGGER AS $$
BEGIN
  SET search_path = public;
  NEW.stock_actuel = COALESCE(NEW.stock_actuel, 0);
  NEW.point_commande = COALESCE(NEW.point_commande, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

❌ **Problème majeur** : Aucun calcul réel n'est effectué

---

## 📐 Formules Théoriques Correctes

### 1. Point de Commande (Reorder Point)

```
Point de Commande = (Ventes/jour × Délai livraison) + Stock de sécurité
```

**Où** :
- `Ventes/jour` = `ventes_jour_ajustees`
- `Délai livraison` = `lead_time_days`
- `Stock de sécurité` = `stock_securite` ou `stock_securite_personnalise`

**Exemple SKU 003** :
```
Ventes/jour = 5 unités
Délai = 14 jours
Stock sécu = 10 unités

Point de commande = (5 × 14) + 10 = 80 unités
```

### 2. Stock de Sécurité (si non personnalisé)

```
Stock de Sécurité = Délai livraison × 20%
```

Ou formule plus avancée :
```
Stock de Sécurité = √(Délai livraison × Variance des ventes)
```

### 3. Quantité à Commander

```
SI stock_actuel ≤ point_commande ALORS
  Quantité à commander = MAX(
    stock_max - stock_actuel,
    MOQ
  )
SINON
  Quantité à commander = 0
FIN SI
```

**Avec arrondi au MOQ** :
```
Quantité brute = stock_max - stock_actuel
Quantité finale = CEIL(Quantité brute / MOQ) × MOQ
```

**Exemple SKU 003** :
```
Stock actuel = 30
Point de commande = 80
Stock max = 200
MOQ = 50

Stock actuel (30) ≤ Point de commande (80) ? OUI
Quantité brute = 200 - 30 = 170
Quantité finale = CEIL(170 / 50) × 50 = 4 × 50 = 200
```

Mais si on veut être plus conservateur :
```
Quantité minimale = Point de commande - Stock actuel = 80 - 30 = 50
Quantité finale = CEIL(50 / 50) × 50 = 50
```

---

## ✅ Solution Recommandée

### Approche Hybride : Calcul Backend + Vérification Frontend

#### 1. Trigger SQL Automatique

Créer un trigger qui recalcule automatiquement à chaque modification :

```sql
CREATE OR REPLACE FUNCTION public.calculate_product_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_reorder_point INTEGER;
  v_security_stock INTEGER;
  v_qty_to_order INTEGER;
  v_days_of_stock NUMERIC;
BEGIN
  SET search_path = public;
  
  -- 1. Calculer le stock de sécurité
  IF NEW.stock_securite_personnalise IS NOT NULL THEN
    v_security_stock := NEW.stock_securite_personnalise;
  ELSE
    v_security_stock := CEIL(NEW.lead_time_days * 0.2);
  END IF;
  
  -- 2. Calculer le point de commande
  v_reorder_point := CEIL(
    (NEW.ventes_jour_ajustees * NEW.lead_time_days) + 
    (NEW.ventes_jour_ajustees * v_security_stock)
  );
  
  -- 3. Calculer l'autonomie en jours
  IF NEW.ventes_jour_ajustees > 0 THEN
    v_days_of_stock := NEW.stock_actuel / NEW.ventes_jour_ajustees;
  ELSE
    v_days_of_stock := 999;
  END IF;
  
  -- 4. Calculer la quantité à commander
  IF NEW.stock_actuel <= v_reorder_point THEN
    -- Besoin de commander
    v_qty_to_order := v_reorder_point - NEW.stock_actuel + v_security_stock;
    
    -- Arrondir au MOQ
    IF NEW.moq > 0 THEN
      v_qty_to_order := CEIL(v_qty_to_order::NUMERIC / NEW.moq) * NEW.moq;
    END IF;
    
    -- Vérifier le minimum MOQ
    IF v_qty_to_order < NEW.moq THEN
      v_qty_to_order := NEW.moq;
    END IF;
  ELSE
    -- Pas besoin de commander
    v_qty_to_order := 0;
  END IF;
  
  -- 5. Mettre à jour les champs calculés
  NEW.stock_securite := v_security_stock;
  NEW.point_commande := v_reorder_point;
  NEW.quantite_a_commander := v_qty_to_order;
  NEW.stock_actuel := COALESCE(NEW.stock_actuel, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS trigger_calculate_metrics ON public.produits;
CREATE TRIGGER trigger_calculate_metrics
  BEFORE INSERT OR UPDATE ON public.produits
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_product_metrics();
```

#### 2. Fonction de Recalcul Global

Pour recalculer tous les produits en une fois :

```sql
CREATE OR REPLACE FUNCTION public.recalculate_all_products()
RETURNS JSON AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_product RECORD;
BEGIN
  SET search_path = public;
  
  FOR v_product IN SELECT * FROM public.produits LOOP
    UPDATE public.produits
    SET updated_at = NOW() -- Force le trigger
    WHERE sku = v_product.sku;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', TRUE,
    'updated_count', v_updated_count,
    'message', format('%s produits recalculés', v_updated_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Vérification Frontend (sécurité)

Dans `calculations.js`, ajouter une fonction de vérification :

```javascript
/**
 * Vérifie et recalcule qtyToOrder si nécessaire
 * (au cas où la valeur de la BDD serait obsolète)
 */
export const verifyAndCalculateQtyToOrder = (product) => {
  const reorderPoint = calculateReorderPoint(product);
  
  if (product.stock <= reorderPoint) {
    // Besoin de commander
    let qtyToOrder = reorderPoint - product.stock + product.securityStock;
    
    // Arrondir au MOQ
    if (product.moq > 0) {
      qtyToOrder = Math.ceil(qtyToOrder / product.moq) * product.moq;
    }
    
    // Minimum = MOQ
    qtyToOrder = Math.max(qtyToOrder, product.moq || 0);
    
    // Vérifier la cohérence avec la BDD
    if (Math.abs(product.qtyToOrder - qtyToOrder) > product.moq) {
      console.warn(`⚠️ Incohérence détectée pour ${product.sku}:`, {
        database: product.qtyToOrder,
        calculated: qtyToOrder,
        diff: Math.abs(product.qtyToOrder - qtyToOrder)
      });
    }
    
    return qtyToOrder;
  }
  
  return 0;
};
```

---

## 🧪 Vérification pour SKU 003

### Données actuelles (hypothétiques)
```
sku: 003
stock_actuel: 30
ventes_jour_ajustees: 5
lead_time_days: 14
moq: 50
stock_securite: 10
```

### Calculs attendus

**1. Point de commande**
```
= (5 × 14) + (5 × 10)
= 70 + 50
= 120 unités
```

**2. Quantité à commander**
```
Stock actuel (30) ≤ Point de commande (120) ? OUI

Quantité brute = 120 - 30 + 10 = 100
Quantité arrondie = CEIL(100 / 50) × 50 = 100
```

**Résultat** : `quantite_a_commander = 100 unités`

❓ **Question** : Pourquoi la BDD indique 50 ?
- Soit le calcul est différent
- Soit les données ont changé depuis le dernier calcul
- Soit le calcul n'a jamais été fait automatiquement

---

## 📋 Plan d'Action Recommandé

### Priorité 1 : Implémenter le Trigger SQL ✅
1. Créer la migration `013_implement_qty_to_order_calculation.sql`
2. Implémenter la fonction `calculate_product_metrics()` complète
3. Créer le trigger `BEFORE INSERT OR UPDATE`
4. Tester avec quelques produits

### Priorité 2 : Recalculer Tous les Produits
1. Exécuter `SELECT recalculate_all_products();`
2. Vérifier les valeurs recalculées
3. Comparer avec les valeurs actuelles

### Priorité 3 : Vérification Frontend
1. Ajouter `verifyAndCalculateQtyToOrder()` dans `calculations.js`
2. Logger les incohérences
3. Utiliser la valeur calculée en frontend si BDD obsolète

### Priorité 4 : Tests et Validation
1. Créer des tests unitaires pour les formules
2. Tester avec différents scénarios
3. Valider les résultats avec l'utilisateur

---

## 🎯 Recommandation Finale

**Je recommande de créer IMMÉDIATEMENT la migration avec les calculs automatiques.**

Voulez-vous que je crée :
1. ✅ Migration SQL avec trigger automatique
2. ✅ Fonction de recalcul global
3. ✅ Vérification frontend
4. ✅ Tests unitaires
5. ✅ Documentation des formules

**Temps estimé** : 30 minutes  
**Impact** : 🔴 CRITIQUE pour la fiabilité de l'application

---

## ⚠️ Risques Sans Cette Correction

1. **Commandes manquées** : Produits à commander non détectés
2. **Surstock** : Commandes excessives
3. **Perte de confiance** : Utilisateurs reçoivent des infos incorrectes
4. **Coûts** : Mauvaise gestion des stocks = pertes financières

---

**Voulez-vous que je procède à l'implémentation des calculs automatiques ?**

