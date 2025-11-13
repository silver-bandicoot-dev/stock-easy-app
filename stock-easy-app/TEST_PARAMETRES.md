# 🧪 Test Complet - Onglet Paramètres

## 📋 Vue d'ensemble

Ce document contient le plan de test complet pour l'onglet **Paramètres** et tous ses sous-onglets.

**Date du test** : $(date)  
**Testeur** : À compléter  
**Version** : 1.0

---

## ✅ Checklist Générale

### Prérequis
- [ ] Application lancée (`npm run dev`)
- [ ] Backend Supabase opérationnel
- [ ] Migrations appliquées (011, 012)
- [ ] Utilisateur connecté
- [ ] Console développeur ouverte (F12) pour voir les logs

---

## 1️⃣ Paramètres Généraux

### 🎯 Objectif
Vérifier que les paramètres généraux (devise, seuil surstock, multiplicateur) se sauvegardent correctement dans Supabase.

### 📝 Scénario de Test

#### Test 1.1: Changement de Devise

**Étapes** :
1. Aller dans **Paramètres** → **Paramètres Généraux**
2. Noter la devise actuelle
3. Cliquer sur une autre devise (ex: USD au lieu d'EUR)
4. Observer l'affichage du badge jaune "Vous avez des modifications non sauvegardées"
5. Cliquer sur "Enregistrer les paramètres"
6. Observer le message de succès vert ✅

**Vérifications** :
- [ ] Badge jaune apparaît après changement
- [ ] Boutons "Annuler" et "Enregistrer" visibles
- [ ] Message de succès affiché après sauvegarde
- [ ] Message de succès disparaît après 3 secondes
- [ ] Badge jaune disparaît après sauvegarde

**Vérification Backend** :
```sql
-- Dans Supabase SQL Editor
SELECT name, value FROM parametres WHERE name = 'DeviseDefaut';
```
**Résultat attendu** : La colonne `value` doit contenir "USD"

**Console logs attendus** :
```
🔧 updateParameter appelé: DeviseDefaut = USD
✅ Paramètre mis à jour dans Supabase: ...
```

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 1.2: Changement du Seuil Surstock

**Étapes** :
1. Dans **Paramètres Généraux**
2. Noter le seuil actuel (ex: 90 jours)
3. Cliquer sur un autre seuil (ex: 120 jours - "Durable")
4. Observer le badge de modification
5. Cliquer sur "Enregistrer"
6. Observer le succès

**Vérifications** :
- [ ] Tous les boutons de seuil sont cliquables
- [ ] Le bouton sélectionné a un style différent (bordure violet, fond purple-50)
- [ ] "Valeur sélectionnée" affiche la bonne valeur
- [ ] Sauvegarde réussie

**Vérification Backend** :
```sql
SELECT name, value FROM parametres WHERE name = 'SeuilSurstockProfond';
```
**Résultat attendu** : `value = '120'`

**Console logs** :
```
🔧 updateParameter appelé: SeuilSurstockProfond = 120
✅ Paramètre mis à jour dans Supabase
```

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 1.3: Changement du Multiplicateur

**Étapes** :
1. Dans **Paramètres Généraux**
2. Noter la valeur actuelle (ex: 1.2)
3. Cliquer sur le bouton "+" plusieurs fois
4. Observer la valeur augmenter de 0.1 à chaque clic
5. Cliquer sur "-" pour diminuer
6. Observer que la valeur ne descend pas en dessous de 0.1
7. Sauvegarder

**Vérifications** :
- [ ] Bouton "-" fonctionne
- [ ] Bouton "+" fonctionne
- [ ] Valeur ne peut pas être < 0.1
- [ ] Valeur ne peut pas être > 5.0
- [ ] Affichage avec 1 décimale (ex: 1.5, pas 1.500)
- [ ] Sauvegarde réussie

**Vérification Backend** :
```sql
SELECT name, value FROM parametres WHERE name = 'MultiplicateurDefaut';
```

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 1.4: Bouton Annuler

**Étapes** :
1. Changer la devise de EUR à USD
2. Changer le seuil de 90 à 120
3. Ne PAS sauvegarder
4. Cliquer sur "Annuler"
5. Observer que les valeurs reviennent à EUR et 90

**Vérifications** :
- [ ] Bouton "Annuler" fonctionne
- [ ] Toutes les valeurs reviennent à leur état initial
- [ ] Badge jaune disparaît
- [ ] Aucune sauvegarde n'est effectuée

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 1.5: Rechargement de Page

**Étapes** :
1. Sauvegarder des changements (ex: devise = GBP, seuil = 180)
2. Rafraîchir la page (F5)
3. Retourner dans Paramètres → Paramètres Généraux
4. Observer que les valeurs sont bien GBP et 180

**Vérifications** :
- [ ] Les valeurs sauvegardées persistent après rechargement
- [ ] Aucun bug d'affichage

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

## 2️⃣ Gestion des Fournisseurs

### 🎯 Objectif
Vérifier que la gestion des fournisseurs (CRUD) fonctionne correctement.

### 📝 Scénario de Test

#### Test 2.1: Affichage de la Liste

**Étapes** :
1. Aller dans **Paramètres** → **Gestion Fournisseurs**
2. Observer la liste des fournisseurs existants

**Vérifications** :
- [ ] La liste s'affiche correctement
- [ ] Chaque fournisseur affiche : nom, email, délai livraison, MOQ
- [ ] Le nombre de produits liés est affiché
- [ ] Les actions (Modifier, Supprimer) sont visibles
- [ ] Pas d'erreur dans la console

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 2.2: Créer un Fournisseur

**Étapes** :
1. Cliquer sur "+ Nouveau fournisseur"
2. Modal s'ouvre
3. Remplir les champs :
   - Nom : "Test Supplier"
   - Email : "test@supplier.com"
   - Téléphone : "+33123456789"
   - Délai livraison : 14
   - MOQ : 100
4. Cliquer sur "Créer le fournisseur"
5. Observer le message de succès
6. Vérifier que le fournisseur apparaît dans la liste

**Vérifications** :
- [ ] Modal s'ouvre correctement
- [ ] Tous les champs sont éditables
- [ ] Validation fonctionne (champs requis)
- [ ] Message de succès affiché
- [ ] Modal se ferme après création
- [ ] Nouveau fournisseur dans la liste
- [ ] Toast notification affichée

**Vérification Backend** :
```sql
SELECT * FROM fournisseurs WHERE nom_fournisseur = 'Test Supplier';
```

**Console logs** :
```
📦 Création fournisseur: {nom_fournisseur: "Test Supplier", ...}
✅ Fournisseur créé avec succès
```

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 2.3: Modifier un Fournisseur

**Étapes** :
1. Trouver "Test Supplier" dans la liste
2. Cliquer sur l'icône "Modifier" (Edit2)
3. Modal s'ouvre avec les données pré-remplies
4. Modifier le délai de livraison : 14 → 21
5. Cliquer sur "Sauvegarder"
6. Observer le succès

**Vérifications** :
- [ ] Modal s'ouvre avec données correctes
- [ ] Modification sauvegardée
- [ ] Liste mise à jour
- [ ] Toast de succès

**Vérification Backend** :
```sql
SELECT lead_time_days FROM fournisseurs WHERE nom_fournisseur = 'Test Supplier';
```
**Résultat attendu** : `lead_time_days = 21`

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 2.4: Supprimer un Fournisseur

**Étapes** :
1. Cliquer sur l'icône "Supprimer" (Trash2) pour "Test Supplier"
2. Modal de confirmation s'affiche
3. Cliquer sur "Supprimer"
4. Observer que le fournisseur disparaît

**Vérifications** :
- [ ] Modal de confirmation s'affiche
- [ ] Possibilité d'annuler
- [ ] Suppression effective
- [ ] Liste mise à jour
- [ ] Toast de succès

**Vérification Backend** :
```sql
SELECT * FROM fournisseurs WHERE nom_fournisseur = 'Test Supplier';
```
**Résultat attendu** : Aucune ligne

**⚠️ Note** : Si le fournisseur est lié à des produits, la suppression peut échouer (contrainte FK).

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

## 3️⃣ Mapping SKU-Fournisseur

### 🎯 Objectif
Vérifier que le mapping entre produits et fournisseurs fonctionne.

### 📝 Scénario de Test

#### Test 3.1: Affichage de la Liste

**Étapes** :
1. Aller dans **Paramètres** → **Mapping SKU-Fournisseur**
2. Observer la liste des produits

**Vérifications** :
- [ ] Tous les produits sont affichés
- [ ] Chaque produit affiche : SKU, nom, fournisseur actuel
- [ ] Boutons "Assigner" et "Retirer" visibles
- [ ] Recherche fonctionne
- [ ] Pas d'erreur console

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 3.2: Assigner un Fournisseur

**Étapes** :
1. Trouver un produit sans fournisseur (ou avec un fournisseur)
2. Cliquer sur "Assigner fournisseur"
3. Modal s'ouvre
4. Sélectionner un fournisseur dans la liste
5. Cliquer sur "Assigner"
6. Observer le succès

**Vérifications** :
- [ ] Modal s'ouvre
- [ ] Liste des fournisseurs chargée
- [ ] Sélection fonctionne
- [ ] Assignment effectué
- [ ] Liste mise à jour avec le nouveau fournisseur
- [ ] Toast de succès

**Vérification Backend** :
```sql
SELECT sku, fournisseur FROM produits WHERE sku = 'SKU_DU_PRODUIT';
```

**Console logs** :
```
🔗 Assignation fournisseur: SKU -> Fournisseur
✅ Fournisseur assigné
```

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 3.3: Retirer un Fournisseur

**Étapes** :
1. Trouver un produit avec un fournisseur assigné
2. Cliquer sur "Retirer"
3. Confirmer la suppression
4. Observer que le fournisseur est retiré

**Vérifications** :
- [ ] Confirmation demandée
- [ ] Suppression effective
- [ ] Liste mise à jour
- [ ] Toast de succès

**Vérification Backend** :
```sql
SELECT sku, fournisseur FROM produits WHERE sku = 'SKU_DU_PRODUIT';
```
**Résultat attendu** : `fournisseur = NULL` ou vide

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

## 4️⃣ Gestion des Entrepôts

### 🎯 Objectif
Vérifier que la gestion des entrepôts (CRUD) fonctionne correctement.

### 📝 Scénario de Test

#### Test 4.1: Affichage de la Liste

**Étapes** :
1. Aller dans **Paramètres** → **Gestion Entrepôts**
2. Observer la liste des entrepôts

**Vérifications** :
- [ ] Liste affichée correctement
- [ ] Chaque entrepôt affiche : nom, adresse, ville, pays
- [ ] Actions visibles (Modifier, Supprimer)
- [ ] Pas d'erreur console

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 4.2: Créer un Entrepôt

**Étapes** :
1. Cliquer sur "+ Nouvel entrepôt"
2. Modal s'ouvre
3. Remplir :
   - Nom : "Entrepôt Test"
   - Adresse : "123 Rue Test"
   - Ville : "Paris"
   - Code postal : "75001"
   - Pays : "France"
   - Contact : "John Doe"
   - Téléphone : "+33123456789"
   - Email : "test@warehouse.com"
4. Cliquer sur "Créer"
5. Observer le succès

**Vérifications** :
- [ ] Modal s'ouvre
- [ ] Tous les champs fonctionnent
- [ ] Validation (champs requis)
- [ ] Création réussie
- [ ] Toast de succès
- [ ] Nouvel entrepôt dans la liste

**Vérification Backend** :
```sql
SELECT * FROM warehouses WHERE name = 'Entrepôt Test';
```

**Console logs** :
```
📦 Création warehouse: {name: "Entrepôt Test", ...}
✅ Entrepôt créé avec succès
```

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 4.3: Modifier un Entrepôt

**Étapes** :
1. Trouver "Entrepôt Test"
2. Cliquer sur "Modifier"
3. Modal s'ouvre avec données pré-remplies
4. Modifier la ville : Paris → Lyon
5. Sauvegarder
6. Observer le succès

**Vérifications** :
- [ ] Modal s'ouvre avec bonnes données
- [ ] Modification sauvegardée
- [ ] Liste mise à jour
- [ ] Toast de succès

**Vérification Backend** :
```sql
SELECT city FROM warehouses WHERE name = 'Entrepôt Test';
```
**Résultat attendu** : `city = 'Lyon'`

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

#### Test 4.4: Supprimer un Entrepôt

**Étapes** :
1. Cliquer sur "Supprimer" pour "Entrepôt Test"
2. Confirmer
3. Observer la suppression

**Vérifications** :
- [ ] Confirmation demandée
- [ ] Suppression effective
- [ ] Toast de succès

**Vérification Backend** :
```sql
SELECT * FROM warehouses WHERE name = 'Entrepôt Test';
```
**Résultat attendu** : Aucune ligne

**Résultat** : ✅ PASS / ❌ FAIL  
**Notes** : ___________

---

## 🔍 Tests de Connexion Backend

### Test Global: Vérification des Appels RPC

**Ouvrir la console (F12) et observer les appels pendant chaque opération :**

#### Paramètres Généraux
```
Appel attendu: POST /rest/v1/rpc/update_parameter
Payload: {p_param_name: "DeviseDefaut", p_value: "USD"}
```

#### Gestion Fournisseurs - Création
```
Appel attendu: POST /rest/v1/rpc/create_supplier
Payload: {p_supplier_data: {...}}
```

#### Gestion Fournisseurs - Modification
```
Appel attendu: POST /rest/v1/rpc/update_supplier
Payload: {p_supplier_id: "...", p_updates: {...}}
```

#### Gestion Fournisseurs - Suppression
```
Appel attendu: POST /rest/v1/rpc/delete_supplier
Payload: {p_supplier_id: "..."}
```

#### Mapping SKU - Assignment
```
Appel attendu: POST /rest/v1/rpc/assign_supplier_to_product
Payload: {p_sku: "...", p_supplier_name: "..."}
```

#### Gestion Entrepôts - Création
```
Appel attendu: POST /rest/v1/rpc/create_warehouse
Payload: {p_warehouse_data: {...}}
```

**Vérifications générales** :
- [ ] Aucun appel ne retourne 404 (fonction non trouvée)
- [ ] Aucun appel ne retourne 403 (permission refusée)
- [ ] Aucun appel ne retourne 500 (erreur serveur)
- [ ] Tous les appels retournent 200 avec `{success: true}`

---

## 📊 Récapitulatif des Tests

| Sous-onglet | Test | Statut | Notes |
|-------------|------|--------|-------|
| **Paramètres Généraux** | Changement devise | ⬜ | |
| | Changement seuil | ⬜ | |
| | Changement multiplicateur | ⬜ | |
| | Bouton Annuler | ⬜ | |
| | Rechargement page | ⬜ | |
| **Gestion Fournisseurs** | Affichage liste | ⬜ | |
| | Créer fournisseur | ⬜ | |
| | Modifier fournisseur | ⬜ | |
| | Supprimer fournisseur | ⬜ | |
| **Mapping SKU** | Affichage liste | ⬜ | |
| | Assigner fournisseur | ⬜ | |
| | Retirer fournisseur | ⬜ | |
| **Gestion Entrepôts** | Affichage liste | ⬜ | |
| | Créer entrepôt | ⬜ | |
| | Modifier entrepôt | ⬜ | |
| | Supprimer entrepôt | ⬜ | |

**Légende** : ⬜ Non testé | ✅ PASS | ❌ FAIL | ⚠️ Avec réserves

---

## 🐛 Bugs Identifiés

| # | Description | Sévérité | Status |
|---|-------------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**Sévérité** : 🔴 Bloquant | 🟡 Majeur | 🟢 Mineur

---

## ✅ Conclusion

**Tests réussis** : __ / 17  
**Tests échoués** : __  
**Taux de réussite** : __%

**Statut global** : ⬜ À tester | ✅ PASS | ❌ FAIL | ⚠️ Avec réserves

**Commentaires** :
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________

**Testeur** : ________________  
**Date** : ________________

