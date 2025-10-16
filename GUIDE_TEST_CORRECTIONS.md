# 🧪 Guide de Test des Corrections

## Vue d'ensemble

Ce guide vous aide à tester méthodiquement les 5 corrections implémentées dans Stock Easy.

---

## 🔑 Prérequis

Avant de commencer les tests:

- ✅ Backend Google Apps Script déployé avec toutes les fonctions (voir `INSTRUCTIONS_BACKEND_GOOGLE_APPS_SCRIPT.md`)
- ✅ Feuilles Google Sheets configurées avec les nouvelles colonnes
- ✅ Frontend React build et déployé
- ✅ Navigateur avec console développeur accessible (F12)

---

## 📋 CORRECTION 1: Sauvegarde des Paramètres

### Objectif
Vérifier que les paramètres se sauvent correctement dans Google Sheets et persistent après rechargement.

### Étapes de test

#### Test 1.1: Modification et sauvegarde

1. **Ouvrir l'application**
   - Aller dans **Paramètres** (onglet ⚙️)

2. **Modifier le multiplicateur par défaut**
   - Changer la valeur de `1.2` à `1.5`
   - ⚠️ Observer l'indicateur jaune "● Modifié"
   - ⚠️ Vérifier le bandeau jaune "1 modification(s) non sauvegardée(s)"

3. **Modifier la devise**
   - Changer de `EUR` à `USD`
   - ⚠️ Vérifier que 2 modifications sont maintenant affichées

4. **Cliquer sur "Sauvegarder"**
   - ✅ Message de succès: "2 paramètre(s) sauvegardé(s)"
   - ✅ Les indicateurs jaunes disparaissent

#### Test 1.2: Vérification Google Sheets

1. **Ouvrir Google Sheets**
   - Aller dans la feuille "Config"
   - ✅ Vérifier la présence des lignes:
     ```
     MultiplicateurDefaut | 1.5 | 2025-10-16T...
     DeviseDefaut | USD | 2025-10-16T...
     ```

#### Test 1.3: Persistance après rechargement

1. **Recharger la page** (F5 ou Ctrl+R)
2. **Retourner dans Paramètres**
   - ✅ Vérifier que Multiplicateur = `1.5`
   - ✅ Vérifier que Devise = `USD`

#### Test 1.4: Annulation des modifications

1. **Modifier un paramètre** mais NE PAS sauvegarder
2. **Cliquer sur "Annuler les modifications"**
   - ✅ Les valeurs reviennent à l'état sauvegardé
   - ✅ Message info: "Modifications annulées"

### ✅ Résultats attendus

| Test | Attendu | Statut |
|------|---------|--------|
| 1.1 | Indicateurs visuels corrects | ☐ |
| 1.2 | Données dans Google Sheets | ☐ |
| 1.3 | Valeurs persistent après F5 | ☐ |
| 1.4 | Annulation fonctionne | ☐ |

### 🐛 Problèmes connus

| Symptôme | Cause probable | Solution |
|----------|---------------|----------|
| Erreur "Action inconnue" | Fonction updateParameter manquante | Ajouter dans Code.gs |
| Modifications non persistées | Feuille Config inexistante | Créer feuille Config |
| Valeurs par défaut après F5 | getParameter ne lit pas Config | Vérifier fonction getParameter |

---

## 📋 CORRECTION 2: Modal Réconciliation

### Objectif
Vérifier que la réconciliation des commandes avec écarts fonctionne correctement.

### Étapes de test

#### Test 2.1: Créer une commande avec écart

1. **Créer une commande test**
   - Onglet **Actions** → Sélectionner un fournisseur
   - Créer une commande avec 2 produits

2. **Marquer comme reçue avec écart**
   - Track & Manage → En Transit
   - Cliquer "Confirmer réception"
   - Produit 1: Commandé 10, Reçu **8** (écart -2)
   - Produit 2: Commandé 5, Reçu 5 (conforme)
   - Sauvegarder

3. **Vérifier l'onglet Réconciliation**
   - Track & Manage → Réconciliation
   - ✅ La commande apparaît
   - ✅ Badge "📦 ÉCART DE QUANTITÉ"
   - ✅ Détails montrent l'écart de -2 unités

#### Test 2.2: Envoyer réclamation

1. **Cliquer sur "Envoyer réclamation"**
   - ✅ Modal s'ouvre avec email pré-rempli
   - ✅ Liste des écarts affichée
   - ✅ Possibilité de modifier le message

2. **Envoyer**
   - ✅ Email envoyé
   - ✅ Commande reste en réconciliation

#### Test 2.3: Valider sans réclamation

1. **Cliquer sur "Valider sans réclamation"**
   - ✅ Confirmation demandée
   - ✅ Après validation: statut → "completed"
   - ✅ Stock ajusté avec quantités REÇUES (8 et 5)

### ✅ Résultats attendus

| Test | Attendu | Statut |
|------|---------|--------|
| 2.1 | Commande avec écart apparaît | ☐ |
| 2.2 | Email réclamation fonctionne | ☐ |
| 2.3 | Validation ajuste le stock | ☐ |

---

## 📋 CORRECTION 3: Étape "Commandes Reçues"

### Objectif
Vérifier le nouveau workflow: En Transit → Commandes Reçues → Validation/Réconciliation

### Étapes de test

#### Test 3.1: Workflow complet conforme

1. **Créer commande test**
   - Actions → Commander 2 produits

2. **Confirmer email fournisseur**
   - Track & Manage → En Cours
   - Cliquer "Confirmer réception email"
   - ✅ Statut → "processing"

3. **Marquer comme expédiée**
   - Track & Manage → En Cours (voir section processing)
   - Cliquer "Marquer comme expédiée"
   - Ajouter tracking: `TEST-123`
   - ✅ Statut → "in_transit"

4. **Confirmer réception**
   - Track & Manage → **En Transit**
   - Cliquer "Confirmer réception"
   - Saisir quantités identiques (conforme)
   - Sauvegarder
   - ✅ Statut → **"received"** ← NOUVEAU

5. **Vérifier onglet Commandes Reçues**
   - Track & Manage → **Commandes Reçues**
   - ✅ Commande apparaît
   - ✅ Badge vert "Conforme"
   - ✅ Résumé: Qté Commandée = Qté Reçue
   - ✅ Bouton "Valider" actif
   - ✅ Bouton "Réconcilier" désactivé (grisé)

6. **Valider la commande**
   - Cliquer "Valider la commande"
   - ✅ Statut → "validated"
   - ✅ Disparaît de "Commandes Reçues"
   - ✅ Apparaît dans "Validées"

#### Test 3.2: Workflow avec écart

1. **Créer nouvelle commande**
2. **Marquer en transit**
3. **Confirmer réception AVEC écart**
   - Produit 1: Commandé 10, Reçu **7** (écart -3)
   - Produit 2: Commandé 5, Reçu **6** (écart +1)
   - Sauvegarder

4. **Vérifier Commandes Reçues**
   - ✅ Badge jaune "Écart détecté"
   - ✅ Détails montrent écarts en rouge (-3) et bleu (+1)
   - ✅ Bouton "Valider" désactivé (grisé)
   - ✅ Bouton "Réconcilier" actif

5. **Cliquer "Réconcilier les écarts"**
   - ✅ Statut → "reconciliation"
   - ✅ Disparaît de "Commandes Reçues"
   - ✅ Apparaît dans "Réconciliation"

#### Test 3.3: Navigation sous-onglets

1. **Vérifier tous les sous-onglets:**
   - En Cours de Commande (X)
   - En Transit (X)
   - **Commandes Reçues (X)** ← NOUVEAU
   - Réconciliation (X)
   - Validées (X)

2. **Vérifier compteurs:**
   - ✅ Nombre correct à côté de chaque onglet

### ✅ Résultats attendus

| Test | Attendu | Statut |
|------|---------|--------|
| 3.1 | Workflow conforme fonctionne | ☐ |
| 3.2 | Workflow avec écart fonctionne | ☐ |
| 3.3 | Navigation sous-onglets OK | ☐ |
| 3.4 | Statuts corrects à chaque étape | ☐ |

### 🎯 Workflow visuel

```
┌─────────────┐
│   CRÉER     │
│  COMMANDE   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  EN COURS   │ ← Confirmer email
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ EN TRANSIT  │ ← Marquer expédiée
└──────┬──────┘
       │
       ↓
┌─────────────────┐
│ COMMANDES REÇUES│ ← Confirmer réception avec quantités
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌────────┐ ┌──────────────┐
│VALIDÉES│ │RÉCONCILIATION│
└────────┘ └──────────────┘
(conforme)  (avec écarts)
```

---

## 📋 CORRECTION 4: Calcul et Affichage ETA

### Objectif
Vérifier que l'ETA se calcule automatiquement et s'affiche avec les bonnes couleurs.

### Étapes de test

#### Test 4.1: Configuration fournisseur

1. **Aller dans Paramètres → Fournisseurs**
2. **Modifier un fournisseur existant**
   - Définir "Délai de livraison": **7 jours**
   - Sauvegarder
   - ✅ Changement confirmé

#### Test 4.2: Créer commande avec ETA

1. **Actions → Commander**
   - Choisir le fournisseur configuré
   - Créer la commande

2. **Vérifier le calcul**
   - ✅ ETA = Date du jour + 7 jours
   - Exemple: Commande le 16/10 → ETA = 23/10

#### Test 4.3: Affichage ETA selon urgence

Pour tester les différentes couleurs, créer des commandes avec différents délais:

| Délai fournisseur | Badge attendu | Couleur |
|------------------|---------------|---------|
| ETA dépassé | "En retard de X jour(s)" | 🔴 Rouge |
| 0 jours (aujourd'hui) | "Aujourd'hui" | 🟡 Jaune |
| 1 jour | "Demain" | 🟡 Jaune |
| 2-3 jours | "Dans 2 jours" | 🟡 Jaune |
| 4-7 jours | "Dans 5 jours" | 🔵 Bleu |
| >7 jours | "Dans 10 jours" | 🟢 Vert |

#### Test 4.4: Affichage dans différents onglets

Vérifier que l'ETA s'affiche:
- ✅ Track & Manage → En Transit
- ✅ Track & Manage → Commandes Reçues
- ✅ Historique (modal de détails)

### ✅ Résultats attendus

| Test | Attendu | Statut |
|------|---------|--------|
| 4.1 | Configuration délai fonctionne | ☐ |
| 4.2 | ETA calculé correctement | ☐ |
| 4.3 | Codes couleur corrects | ☐ |
| 4.4 | Visible partout | ☐ |

### 📊 Test des badges ETA

Créer ces scénarios manuellement dans Google Sheets pour tester:

```javascript
// Modifier eta dans Google Sheets pour tester

// Badge ROUGE (en retard)
eta: "2025-10-14" // (hier)

// Badge JAUNE (urgent)
eta: "2025-10-16" // (aujourd'hui)
eta: "2025-10-17" // (demain)

// Badge BLEU (à surveiller)
eta: "2025-10-20" // (dans 4 jours)

// Badge VERT (OK)
eta: "2025-10-30" // (dans 14 jours)
```

---

## 📋 CORRECTION 5: PO Cliquables dans Historique

### Objectif
Vérifier que les numéros PO dans l'historique ouvrent un modal avec détails complets.

### Étapes de test

#### Test 5.1: Modal de détails - Commande simple

1. **Aller dans Historique**
2. **Cliquer sur un numéro PO** (ex: PO-2025-001)
   - ✅ Modal s'ouvre
   
3. **Vérifier Header:**
   - ✅ N° PO affiché en grand
   - ✅ Nom fournisseur
   - ✅ Bouton ❌ pour fermer

4. **Vérifier Informations générales:**
   - ✅ Date de commande
   - ✅ ETA avec badge coloré
   - ✅ Statut actuel avec badge
   - ✅ Montant total

5. **Vérifier Tableau articles:**
   - ✅ Colonnes: SKU, Qté, Prix, Total
   - ✅ Ligne de total en bas
   - ✅ Montant correct

#### Test 5.2: Modal - Commande avec réception

1. **Cliquer sur PO avec statut "received"**
   - ✅ Colonnes supplémentaires:
     - Qté Commandée
     - Qté Reçue
   
#### Test 5.3: Modal - Commande réconciliée

1. **Cliquer sur PO avec statut "reconciliation"**
   - ✅ Colonnes:
     - Qté Commandée
     - Qté Reçue
     - **Écart** (avec couleur)
   
2. **Vérifier affichage écarts:**
   - ✅ Écart négatif en rouge (ex: -3)
   - ✅ Écart positif en bleu (ex: +2)
   - ✅ Pas d'écart = ✓ vert

3. **Vérifier notes de réconciliation:**
   - ✅ Section jaune en bas si notes présentes

#### Test 5.4: Navigation

1. **Ouvrir modal**
2. **Cliquer en dehors** du modal
   - ✅ Modal se ferme
3. **Cliquer sur bouton ❌**
   - ✅ Modal se ferme
4. **Cliquer sur "Fermer"** en bas
   - ✅ Modal se ferme

#### Test 5.5: Styles PO dans historique

1. **Vérifier apparence des PO:**
   - ✅ Texte bleu
   - ✅ Underline au survol
   - ✅ Curseur pointer
   - ✅ Effet hover bleu foncé

### ✅ Résultats attendus

| Test | Attendu | Statut |
|------|---------|--------|
| 5.1 | Modal s'ouvre et affiche infos | ☐ |
| 5.2 | Colonnes selon statut | ☐ |
| 5.3 | Écarts bien colorés | ☐ |
| 5.4 | Fermeture fonctionne | ☐ |
| 5.5 | Styles corrects | ☐ |

### 📸 Captures à vérifier

**Header du modal:**
```
┌─────────────────────────────────────────┐
│  PO-2025-001          Fournisseur: ABC  │
│                                      ❌  │
└─────────────────────────────────────────┘
```

**Grille d'infos:**
```
┌────────────┬─────────┬──────────┬──────────┐
│ Date       │   ETA   │  Statut  │ Montant  │
│ 16/10/2025 │ Dans 7j │ En cours │ 1,250 € │
└────────────┴─────────┴──────────┴──────────┘
```

---

## 🔄 Tests d'intégration

### Scénario complet A: Commande parfaite

1. ✅ Créer commande (ETA calculé)
2. ✅ Confirmer email → En Cours
3. ✅ Marquer expédiée → En Transit (ETA visible)
4. ✅ Confirmer réception conforme → Commandes Reçues
5. ✅ Valider → Validées
6. ✅ Historique: Cliquer PO → Modal détails complet
7. ✅ Modifier paramètres → Vérifier sauvegarde

### Scénario complet B: Commande avec écarts

1. ✅ Créer commande
2. ✅ Workflow jusqu'à réception
3. ✅ Réception avec écarts → Commandes Reçues (badge jaune)
4. ✅ Réconcilier → Réconciliation
5. ✅ Envoyer réclamation
6. ✅ Valider sans réclamation
7. ✅ Historique: Voir écarts dans modal

### Scénario complet C: Fournisseur lent

1. ✅ Configurer fournisseur: 30 jours
2. ✅ Créer commande
3. ✅ Vérifier ETA = +30 jours (badge vert)
4. ✅ Workflow complet

---

## 🐛 Troubleshooting

### Problèmes courants

#### 1. ETA ne s'affiche pas

**Symptômes:**
- Colonne ETA vide
- "Date inconnue" affiché

**Vérifications:**
1. Console browser (F12):
   ```javascript
   // Vérifier structure order
   console.log(orders[0].eta);
   // Doit retourner: "2025-10-23T00:00:00.000Z"
   ```

2. Google Sheets:
   - Colonne `eta` existe?
   - Format DATE correct?

3. Backend:
   - Fonction `createOrder` calcule bien l'ETA?
   - `getAllData` retourne bien `eta`?

**Solutions:**
- Ajouter colonne `eta` dans Orders
- Redéployer script avec calcul ETA
- Vérifier format ISO: `new Date().toISOString()`

---

#### 2. Onglet "Commandes Reçues" vide

**Symptômes:**
- Commandes reçues n'apparaissent pas
- Onglet affiche "Aucune commande"

**Vérifications:**
1. Console:
   ```javascript
   // Vérifier statut
   orders.filter(o => o.status === 'received')
   ```

2. Google Sheets:
   - Statut exactement `"received"` (pas `"Received"` ou autre)?

3. Backend:
   - Fonction `confirmReceipt` met bien statut à `"received"`?

**Solutions:**
- Corriger casse du statut
- Vérifier fonction `confirmReceipt`
- Recharger données (bouton sync)

---

#### 3. Modal détails ne s'ouvre pas

**Symptômes:**
- Clic sur PO ne fait rien
- Erreur console

**Vérifications:**
1. Console (F12):
   ```
   Error: Cannot read property 'items' of undefined
   ```

2. React DevTools:
   - État `selectedOrderForDetails` se remplit?

**Solutions:**
- Vérifier que `order.items` existe
- Ajouter vérification null dans `OrderDetailsModal`
- Recharger page

---

#### 4. Paramètres ne se sauvent pas

**Symptômes:**
- Après sauvegarde, valeurs reviennent
- Erreur "Action inconnue"

**Vérifications:**
1. Network (F12):
   - Requête POST envoyée?
   - Réponse `{ error: ... }`?

2. Google Apps Script Logs:
   - Erreur dans `updateParameter`?

3. Google Sheets:
   - Feuille "Config" existe?

**Solutions:**
- Créer feuille Config
- Ajouter fonction `updateParameter` dans Code.gs
- Ajouter route dans `doPost()`

---

## ✅ Checklist finale

### Frontend
- [ ] Toutes les corrections visuellement correctes
- [ ] Aucune erreur console (F12)
- [ ] Navigation fluide entre onglets
- [ ] Modals s'ouvrent/ferment correctement
- [ ] Badges de couleur corrects

### Backend
- [ ] Feuille Config créée et fonctionnelle
- [ ] Colonnes ajoutées (receivedAt, eta, leadTimeDays)
- [ ] Toutes fonctions implémentées et testées
- [ ] Logs Google Apps Script propres

### Workflow
- [ ] Création commande → Validation fonctionne
- [ ] Nouveau workflow réception opérationnel
- [ ] Réconciliation avec écarts OK
- [ ] Historique complet et cliquable

### Données
- [ ] Paramètres persistent après F5
- [ ] ETA calculé automatiquement
- [ ] Quantités reçues sauvegardées
- [ ] Statuts corrects à chaque étape

---

## 📊 Rapport de test

### Template

```markdown
# Rapport de Test - Corrections Stock Easy
Date: __________
Testeur: __________

## CORRECTION 1: Paramètres
- [ ] Test 1.1: Modification et sauvegarde
- [ ] Test 1.2: Vérification Google Sheets
- [ ] Test 1.3: Persistance après F5
- [ ] Test 1.4: Annulation
**Commentaires:** ___________________

## CORRECTION 2: Réconciliation
- [ ] Test 2.1: Commande avec écart
- [ ] Test 2.2: Envoi réclamation
- [ ] Test 2.3: Validation sans réclamation
**Commentaires:** ___________________

## CORRECTION 3: Commandes Reçues
- [ ] Test 3.1: Workflow conforme
- [ ] Test 3.2: Workflow avec écart
- [ ] Test 3.3: Navigation sous-onglets
**Commentaires:** ___________________

## CORRECTION 4: ETA
- [ ] Test 4.1: Configuration fournisseur
- [ ] Test 4.2: Calcul automatique
- [ ] Test 4.3: Badges de couleur
- [ ] Test 4.4: Affichage partout
**Commentaires:** ___________________

## CORRECTION 5: PO Cliquables
- [ ] Test 5.1: Modal simple
- [ ] Test 5.2: Modal avec réception
- [ ] Test 5.3: Modal avec écarts
- [ ] Test 5.4: Navigation
- [ ] Test 5.5: Styles
**Commentaires:** ___________________

## Tests d'intégration
- [ ] Scénario A: Commande parfaite
- [ ] Scénario B: Commande avec écarts
- [ ] Scénario C: Fournisseur lent

## Bugs trouvés
1. ___________________
2. ___________________

## Recommandations
___________________
```

---

## 🎉 Validation finale

Si tous les tests passent:

✅ **Les 5 corrections sont opérationnelles!**

L'application est maintenant dotée de:
- Sauvegarde persistante des paramètres
- Workflow de réception professionnel
- Gestion intelligente de l'ETA
- Historique complet et interactif
- Réconciliation efficace des écarts

**Prêt pour la production! 🚀**
