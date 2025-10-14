# 🧪 GUIDE DE TEST RAPIDE - STOCK EASY

## 🎯 OBJECTIF

Tester rapidement les 6 corrections implémentées pour valider qu'elles fonctionnent correctement.

---

## ⚡ TESTS RAPIDES (15 minutes)

### Test 1️⃣ : Numérotation & Date de confirmation (2 min)

**Actions** :
1. Ouvrir l'application
2. Créer une nouvelle commande
3. Vérifier que le numéro est **PO-001** (ou PO-002 si déjà des commandes)
4. Confirmer la commande (bouton "Confirmer réception email")
5. Aller dans "Track & Manage"
6. Section "Commandes en Traitement" : vérifier que la date s'affiche en vert

**Résultat attendu** :
- ✅ Numéro au format PO-XXX (pas de timestamp)
- ✅ Date affichée : "Confirmée le [date du jour]" en vert

---

### Test 2️⃣ : Réception conforme + Ajustement stock (3 min)

**Prérequis** : Avoir une commande en transit

**Actions** :
1. Noter le stock actuel d'un produit dans Google Sheets (ex: SKU-001 = 50)
2. Dans "Track & Manage" → "En Cours de Transit"
3. Cliquer "Confirmer réception"
4. Cliquer "Oui, tout est correct"
5. Ouvrir Google Sheets → Feuille "Produits"
6. Vérifier la colonne Stock pour SKU-001

**Résultat attendu** :
- ✅ Stock = 50 + quantité commandée (ex: 50 + 100 = 150)
- ✅ PAS de #NUM! dans la cellule
- ✅ La cellule contient un nombre (pas une formule)

**Si #NUM! apparaît** : Problème côté API Google Sheets (voir section Dépannage)

---

### Test 3️⃣ : Gestion des écarts + Affichage quantités (5 min)

**Prérequis** : Avoir une commande en transit pour 100 unités

**Actions** :
1. Dans "Track & Manage" → "En Cours de Transit"
2. Cliquer "Confirmer réception"
3. Cliquer "Non, il y a un écart"
4. Modal "Gestion des écarts" s'ouvre
5. Modifier "Reçu" de 100 à **80**
6. Cliquer "Générer réclamation"
7. Aller dans "Track & Manage" → "Commandes à Réconcilier"

**Résultat attendu** :
- ✅ La commande apparaît dans "Commandes à Réconcilier"
- ✅ Affichage : "Commandé 100 / Reçu **80**" (pas 0 !)
- ✅ Deux boutons visibles : "Envoyer réclamation" + "Valider sans réclamation"

**Si "Reçu 0"** : Problème dans l'API Google Sheets (receivedQuantity non sauvegardé)

---

### Test 4️⃣ : Modal de réclamation (2 min)

**Prérequis** : Avoir une commande dans "Commandes à Réconcilier"

**Actions** :
1. Dans la section "Commandes à Réconcilier"
2. Cliquer "Envoyer réclamation"
3. Un modal doit s'ouvrir

**Résultat attendu** :
- ✅ Modal ouvert avec titre "Réclamation - PO-XXX"
- ✅ Textarea avec l'email pré-rédigé
- ✅ Email contient : numéro commande, date réception, tableau des écarts
- ✅ Bouton "Copier dans le presse-papier" fonctionne
- ✅ Texte éditable avant copie

**Contenu email attendu** :
```
Objet : Réclamation commande PO-XXX - Quantités manquantes

Bonjour,

Nous avons réceptionné la commande PO-XXX en date du [date], mais nous constatons les écarts suivants :

Produit                        | Commandé   | Reçu     | Manquant
-------------------------------|------------|----------|----------
[Nom du produit]               | 100        | 80       | 20

Nous vous remercions de bien vouloir :
- Soit nous réexpédier les quantités manquantes dans les plus brefs délais
- Soit établir un avoir correspondant
```

---

### Test 5️⃣ : Validation sans réclamation (3 min)

**Prérequis** : Avoir une commande dans "Commandes à Réconcilier" avec écart

**Actions** :
1. Noter le stock actuel (ex: 50)
2. Dans "Commandes à Réconcilier"
3. Cliquer "Valider sans réclamation"
4. Confirmer la popup
5. Vérifier Google Sheets → Stock

**Résultat attendu** :
- ✅ Popup de confirmation s'affiche
- ✅ Stock ajusté avec la quantité **réellement reçue** (ex: 50 + 80 = 130, pas 50 + 100 = 150)
- ✅ Commande disparaît de "Commandes à Réconcilier"
- ✅ Commande n'apparaît plus nulle part (statut = completed)

---

## 🐛 DÉPANNAGE

### Problème : "Reçu 0" s'affiche au lieu des vraies quantités

**Cause** : L'API Google Sheets ne sauvegarde pas correctement `receivedQuantity`

**Solution** :
1. Ouvrir Google Apps Script
2. Dans la fonction `updateOrderStatus()`, vérifier :
```javascript
if (updates.items) {
  sheet.getRange(i + 1, COLONNE_ITEMS).setValue(JSON.stringify(updates.items));
}
```
3. S'assurer que la colonne "Items" contient bien du JSON avec `receivedQuantity`

**Vérification manuelle** :
- Ouvrir Google Sheets → Feuille "Commandes"
- Colonne "Items" doit contenir :
```json
[
  {
    "sku": "SKU-001",
    "quantity": 100,
    "pricePerUnit": 10,
    "receivedQuantity": 80
  }
]
```

---

### Problème : #NUM! dans la colonne Stock

**Cause** : L'API essaie d'additionner du texte ou écrit une formule au lieu d'un nombre

**Solution** :
1. Ouvrir Google Apps Script
2. Dans la fonction `updateStock()`, modifier :
```javascript
function updateStock(items) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Produits');
  const data = sheet.getDataRange().getValues();
  
  items.forEach(item => {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === item.sku) {
        // IMPORTANT : Convertir en nombre
        const currentStock = parseInt(data[i][COLONNE_STOCK - 1], 10) || 0;
        const quantity = parseInt(item.quantity, 10) || 0;
        const newStock = currentStock + quantity;
        
        // IMPORTANT : Écrire UNIQUEMENT le nombre (pas de formule)
        sheet.getRange(i + 1, COLONNE_STOCK).setValue(newStock);
        
        Logger.log(`Stock mis à jour pour ${item.sku}: ${currentStock} + ${quantity} = ${newStock}`);
        break;
      }
    }
  });
}
```

3. Vérifier que la colonne Stock est formatée en **NUMBER** (pas TEXT)

---

### Problème : Le modal de réclamation ne s'ouvre pas

**Cause** : Erreur JavaScript dans la console

**Solution** :
1. Ouvrir la console du navigateur (F12)
2. Chercher les erreurs en rouge
3. Vérifier que `order.receivedAt` existe
4. Si erreur "Cannot read property 'receivedAt' of undefined" :
   - L'API ne retourne pas `receivedAt` dans les données
   - Vérifier Google Apps Script `getAllData()`

---

### Problème : La numérotation PO reste en timestamp

**Cause** : Ancienne version du code encore en cache

**Solution** :
1. Vider le cache du navigateur (Ctrl+Shift+R)
2. Si le problème persiste, vérifier dans Google Apps Script que `createOrder()` sauvegarde bien l'ID au format PO-XXX

---

## 📊 CHECKLIST COMPLÈTE

Cochez au fur et à mesure :

**Création de commande** :
- [ ] Numéro au format PO-001, PO-002, etc.
- [ ] Date de confirmation s'affiche après confirmation
- [ ] Date formatée en français

**Réception conforme** :
- [ ] Stock ajusté automatiquement
- [ ] Pas de #NUM! dans Google Sheets
- [ ] Stock = valeur numérique (pas formule)

**Réception avec écart** :
- [ ] Modal "Gestion des écarts" s'ouvre
- [ ] Saisie des quantités reçues fonctionne
- [ ] Quantités sauvegardées dans Google Sheets
- [ ] Affichage correct dans "Commandes à Réconcilier" (pas 0)

**Réclamation** :
- [ ] Modal s'ouvre au clic sur "Envoyer réclamation"
- [ ] Email contient les bonnes informations
- [ ] Tableau des écarts correct
- [ ] Copie dans le presse-papier fonctionne
- [ ] Texte éditable

**Validation sans réclamation** :
- [ ] Popup de confirmation s'affiche
- [ ] Stock ajusté avec quantités reçues (pas commandées)
- [ ] Commande disparaît de "À Réconcilier"
- [ ] Statut = "completed" dans Google Sheets

---

## 🎯 RÉSULTAT ATTENDU FINAL

Après tous les tests, vous devriez avoir :

1. ✅ Des numéros PO-001, PO-002, PO-003...
2. ✅ Des dates de confirmation affichées en vert
3. ✅ Un stock qui s'ajuste correctement (jamais #NUM!)
4. ✅ Des quantités reçues qui s'affichent (jamais 0)
5. ✅ Un modal de réclamation fonctionnel
6. ✅ Une option "Valider sans réclamation" opérationnelle

**Si tous les tests passent** : 🎉 Toutes les corrections fonctionnent !

**Si certains tests échouent** : Consulter la section Dépannage ci-dessus.

---

**Durée totale des tests** : ~15 minutes  
**Prérequis** : Application déployée + Google Sheets configuré  
**Console utile** : F12 pour voir les logs de debug
