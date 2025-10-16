# Instructions Backend - Google Apps Script

## Vue d'ensemble

Ce document détaille les modifications à apporter au backend Google Apps Script pour supporter les 5 corrections implémentées dans le frontend React.

---

## ✅ CORRECTION 1: Sauvegarde des Paramètres

### Modifications nécessaires

Le frontend appelle déjà `api.updateParameter(paramName, value)`. Le backend doit:

1. **Créer/Gérer la feuille "Config"** dans Google Sheets
2. **Structure de la feuille Config:**
   ```
   | paramName | value | updatedAt |
   |-----------|-------|-----------|
   | MultiplicateurDefaut | 1.2 | 2025-10-16T10:00:00Z |
   | DeviseDefaut | EUR | 2025-10-16T10:00:00Z |
   | SeuilSurstockProfond | 90 | 2025-10-16T10:00:00Z |
   ```

3. **Fonction à ajouter/modifier dans Code.gs:**

```javascript
function updateParameter(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let configSheet = ss.getSheetByName('Config');
    
    // Créer la feuille Config si elle n'existe pas
    if (!configSheet) {
      configSheet = ss.insertSheet('Config');
      configSheet.getRange(1, 1, 1, 3).setValues([['paramName', 'value', 'updatedAt']]);
      configSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
      configSheet.setFrozenRows(1);
    }
    
    const paramName = data.paramName;
    const value = data.value;
    const updatedAt = new Date().toISOString();
    
    const configData = configSheet.getDataRange().getValues();
    const headers = configData[0];
    const paramIndex = headers.indexOf('paramName');
    const valueIndex = headers.indexOf('value');
    const updatedIndex = headers.indexOf('updatedAt');
    
    // Chercher si le paramètre existe déjà
    let found = false;
    for (let i = 1; i < configData.length; i++) {
      if (configData[i][paramIndex] === paramName) {
        // Mettre à jour
        configSheet.getRange(i + 1, valueIndex + 1).setValue(value);
        configSheet.getRange(i + 1, updatedIndex + 1).setValue(updatedAt);
        found = true;
        break;
      }
    }
    
    // Si pas trouvé, ajouter une nouvelle ligne
    if (!found) {
      const lastRow = configSheet.getLastRow();
      configSheet.getRange(lastRow + 1, 1, 1, 3).setValues([[paramName, value, updatedAt]]);
    }
    
    Logger.log('✅ Paramètre sauvegardé: ' + paramName + ' = ' + value);
    return createResponse({ success: true, paramName: paramName, value: value });
    
  } catch (error) {
    Logger.log('❌ Erreur updateParameter: ' + error.toString());
    return createResponse({ error: error.toString() });
  }
}
```

4. **Fonction pour lire les paramètres:**

```javascript
function getParameter(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const configSheet = ss.getSheetByName('Config');
    
    if (!configSheet) {
      // Retourner valeur par défaut
      const defaults = {
        "MultiplicateurDefaut": 1.2,
        "DeviseDefaut": "EUR",
        "SeuilSurstockProfond": 90
      };
      return createResponse({ value: defaults[data.name] || null });
    }
    
    const configData = configSheet.getDataRange().getValues();
    const headers = configData[0];
    const paramIndex = headers.indexOf('paramName');
    const valueIndex = headers.indexOf('value');
    
    for (let i = 1; i < configData.length; i++) {
      if (configData[i][paramIndex] === data.name) {
        return createResponse({ value: configData[i][valueIndex] });
      }
    }
    
    // Valeur par défaut si non trouvé
    const defaults = {
      "MultiplicateurDefaut": 1.2,
      "DeviseDefaut": "EUR",
      "SeuilSurstockProfond": 90
    };
    return createResponse({ value: defaults[data.name] || null });
    
  } catch (error) {
    Logger.log('❌ Erreur getParameter: ' + error.toString());
    return createResponse({ error: error.toString() });
  }
}
```

---

## ✅ CORRECTION 2: Amélioration Réconciliation

### État actuel
Le frontend gère déjà l'affichage et la validation des commandes en réconciliation. Aucune modification backend nécessaire si les fonctions suivantes existent:

- `updateOrderStatus(orderId, { status: 'validated' })` - Déjà implémentée
- `updateOrderStatus(orderId, { status: 'reconciliation' })` - Déjà implémentée

### Vérification

Assurez-vous que ces actions fonctionnent dans `doPost()`:

```javascript
case 'updateOrderStatus':
  return updateOrderStatus(requestData);
```

---

## ✅ CORRECTION 3: Étape "Commandes Reçues"

### Nouveau workflow
```
En Cours → En Transit → Commandes Reçues → Réconciliation → Validées
```

### Nouvelles fonctions nécessaires

1. **Fonction confirmReceipt** - Pour marquer une commande comme reçue avec quantités:

```javascript
function confirmReceipt(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const ordersSheet = ss.getSheetByName('Orders');
    
    if (!ordersSheet) {
      throw new Error('Feuille Orders introuvable');
    }
    
    const orderId = data.orderId;
    const receivedQuantities = data.receivedQuantities;
    const receivedAt = data.receivedAt;
    
    const ordersData = ordersSheet.getDataRange().getValues();
    const headers = ordersData[0];
    
    const idIndex = headers.indexOf('id');
    const statusIndex = headers.indexOf('status');
    const receivedAtIndex = headers.indexOf('receivedAt');
    const itemsIndex = headers.indexOf('items');
    
    // Trouver la commande
    for (let i = 1; i < ordersData.length; i++) {
      if (ordersData[i][idIndex] === orderId) {
        // Mettre à jour le statut
        if (statusIndex !== -1) {
          ordersSheet.getRange(i + 1, statusIndex + 1).setValue('received');
        }
        
        // Ajouter la date de réception
        if (receivedAtIndex !== -1) {
          ordersSheet.getRange(i + 1, receivedAtIndex + 1).setValue(new Date(receivedAt));
        }
        
        // Mettre à jour les quantités reçues
        if (itemsIndex !== -1) {
          const itemsJson = ordersData[i][itemsIndex];
          const items = JSON.parse(itemsJson);
          
          items.forEach(item => {
            if (receivedQuantities[item.sku] !== undefined) {
              item.receivedQuantity = receivedQuantities[item.sku];
            }
          });
          
          ordersSheet.getRange(i + 1, itemsIndex + 1).setValue(JSON.stringify(items));
        }
        
        Logger.log('✅ Réception confirmée: ' + orderId);
        return createResponse({ success: true, orderId: orderId });
      }
    }
    
    throw new Error('Commande non trouvée: ' + orderId);
    
  } catch (error) {
    Logger.log('❌ Erreur confirmReceipt: ' + error.toString());
    return createResponse({ error: error.toString() });
  }
}
```

2. **Ajouter la colonne "receivedAt"** dans la feuille Orders si elle n'existe pas

3. **Ajouter dans doPost():**

```javascript
case 'confirmReceipt':
  return confirmReceipt(requestData);
```

---

## ✅ CORRECTION 4: Calcul et Affichage ETA

### Modifications nécessaires

1. **Ajouter colonnes dans Google Sheets:**
   - Feuille **Orders**: `eta` (DATE)
   - Feuille **Suppliers**: `leadTimeDays` (NUMBER)

2. **Modifier la fonction createOrder** pour calculer l'ETA:

```javascript
function createOrder(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const ordersSheet = ss.getSheetByName('Orders');
    const suppliersSheet = ss.getSheetByName('Suppliers');
    
    if (!ordersSheet) {
      throw new Error('Feuille Orders introuvable');
    }
    
    // Récupérer le délai du fournisseur
    const supplierName = data.supplier;
    let leadTimeDays = 7; // Délai par défaut
    
    if (suppliersSheet) {
      const suppliersData = suppliersSheet.getDataRange().getValues();
      const suppliersHeaders = suppliersData[0];
      const nameIndex = suppliersHeaders.indexOf('name');
      const leadTimeIndex = suppliersHeaders.indexOf('leadTimeDays');
      
      for (let i = 1; i < suppliersData.length; i++) {
        if (suppliersData[i][nameIndex] === supplierName) {
          leadTimeDays = suppliersData[i][leadTimeIndex] || 7;
          break;
        }
      }
    }
    
    // Calculer l'ETA
    const now = new Date();
    const eta = new Date(now.getTime() + (leadTimeDays * 24 * 60 * 60 * 1000));
    
    // Ajouter l'ETA aux données de commande
    data.eta = eta.toISOString();
    data.leadTimeDays = leadTimeDays;
    
    // Créer la commande (code existant)
    const lastRow = ordersSheet.getLastRow();
    const headers = ordersSheet.getRange(1, 1, 1, ordersSheet.getLastColumn()).getValues()[0];
    
    const rowData = [];
    headers.forEach(header => {
      if (header === 'items') {
        rowData.push(JSON.stringify(data[header] || []));
      } else if (header === 'eta') {
        rowData.push(eta); // Date directe pour Google Sheets
      } else {
        rowData.push(data[header] || '');
      }
    });
    
    ordersSheet.getRange(lastRow + 1, 1, 1, headers.length).setValues([rowData]);
    
    Logger.log('✅ Commande créée avec ETA: ' + data.id);
    return createResponse({ success: true, orderId: data.id, eta: data.eta });
    
  } catch (error) {
    Logger.log('❌ Erreur createOrder: ' + error.toString());
    return createResponse({ error: error.toString() });
  }
}
```

3. **Modifier getAllData** pour inclure l'ETA:

```javascript
function getAllData() {
  try {
    // ... code existant ...
    
    // Pour les commandes, s'assurer que eta est inclus
    orders.forEach(order => {
      if (order.eta) {
        order.eta = new Date(order.eta).toISOString();
      }
    });
    
    return createResponse({
      products: products,
      suppliers: suppliers,
      orders: orders,
      parameters: parameters
    });
    
  } catch (error) {
    Logger.log('❌ Erreur getAllData: ' + error.toString());
    return createResponse({ error: error.toString() });
  }
}
```

---

## ✅ CORRECTION 5: PO Cliquables dans Historique

### État actuel
Cette correction est entièrement frontend (déjà implémentée). Aucune modification backend nécessaire.

Le modal affiche les données existantes des commandes. Assurez-vous simplement que toutes les données nécessaires sont retournées par `getAllData()`.

---

## 📋 Checklist d'implémentation

### Étape 1: Structure Google Sheets
- [ ] Ajouter feuille "Config" avec colonnes: `paramName`, `value`, `updatedAt`
- [ ] Ajouter colonne `receivedAt` dans feuille "Orders"
- [ ] Ajouter colonne `eta` dans feuille "Orders"
- [ ] Ajouter colonne `leadTimeDays` dans feuille "Suppliers"

### Étape 2: Fonctions Google Apps Script
- [ ] Implémenter `updateParameter(data)`
- [ ] Implémenter `getParameter(data)`
- [ ] Implémenter `confirmReceipt(data)`
- [ ] Modifier `createOrder(data)` pour calculer l'ETA
- [ ] Modifier `getAllData()` pour inclure l'ETA et les paramètres

### Étape 3: Routing dans doPost()
- [ ] Ajouter route `case 'updateParameter':`
- [ ] Ajouter route `case 'getParameter':`
- [ ] Ajouter route `case 'confirmReceipt':`

### Étape 4: Tests
- [ ] Tester sauvegarde des paramètres
- [ ] Tester confirmation de réception avec quantités
- [ ] Tester calcul automatique de l'ETA
- [ ] Tester workflow complet: En Cours → En Transit → Reçues → Réconciliation → Validées

---

## 🔍 Exemple de doPost() complet

```javascript
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    Logger.log('Action reçue: ' + action);
    
    switch (action) {
      case 'getAllData':
        return getAllData();
      
      case 'updateProduct':
        return updateProduct(requestData);
      
      case 'createOrder':
        return createOrder(requestData);
      
      case 'updateOrderStatus':
        return updateOrderStatus(requestData);
      
      case 'updateStock':
        return updateStock(requestData);
      
      case 'updateParameter':
        return updateParameter(requestData);
      
      case 'getParameter':
        return getParameter(requestData);
      
      case 'confirmReceipt':
        return confirmReceipt(requestData);
      
      case 'createSupplier':
        return createSupplier(requestData);
      
      case 'updateSupplier':
        return updateSupplier(requestData);
      
      case 'deleteSupplier':
        return deleteSupplier(requestData);
      
      case 'assignSupplierToProduct':
        return assignSupplierToProduct(requestData);
      
      case 'removeSupplierFromProduct':
        return removeSupplierFromProduct(requestData);
      
      default:
        return createResponse({ error: 'Action inconnue: ' + action });
    }
    
  } catch (error) {
    Logger.log('❌ Erreur doPost: ' + error.toString());
    return createResponse({ error: error.toString() });
  }
}

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 🚀 Déploiement

1. **Copier les nouvelles fonctions** dans votre fichier Code.gs
2. **Sauvegarder** le projet
3. **Déployer une nouvelle version** :
   - Cliquer sur "Déployer" → "Nouvelle version"
   - Ajouter une description : "Corrections 1-5: Paramètres, Réception, ETA, Détails PO"
4. **Tester chaque fonctionnalité** via l'interface React

---

## ⚠️ Points d'attention

- **Permissions** : Assurez-vous que le script a les permissions nécessaires pour créer/modifier des feuilles
- **Format JSON** : Les items de commande sont stockés en JSON dans la colonne `items`
- **Dates** : Utilisez `toISOString()` pour uniformiser les dates entre frontend et backend
- **Logs** : Utilisez `Logger.log()` pour déboguer côté serveur
- **Erreurs** : Toujours retourner un objet avec `{ error: "message" }` en cas d'échec

---

## 📝 Notes supplémentaires

### Gestion des fournisseurs
Pour activer pleinement la correction 4 (ETA), les utilisateurs doivent configurer le délai de livraison pour chaque fournisseur dans l'interface :

1. Aller dans **Paramètres** → **Fournisseurs**
2. Modifier chaque fournisseur
3. Définir le champ **"Délai de livraison (jours)"**
4. Sauvegarder

### Valeurs par défaut
Si un fournisseur n'a pas de délai configuré, le système utilise **7 jours** par défaut pour calculer l'ETA.

---

## ✅ Validation finale

Une fois toutes les modifications implémentées, vérifiez que :

1. ✅ Les paramètres se sauvent et persistent après rechargement
2. ✅ Le workflow de réception fonctionne : Transit → Reçues → Validation
3. ✅ L'ETA s'affiche correctement et se calcule automatiquement
4. ✅ Les PO sont cliquables dans l'historique et affichent les détails
5. ✅ La réconciliation permet de gérer les écarts

---

## 🆘 Support

En cas de problème :

1. **Consulter les logs** : Apps Script → Executions
2. **Vérifier la console browser** : F12 → Console
3. **Tester les appels API** : Network → Filtrer par "script.google.com"
4. **Valider les données** : Vérifier la structure dans Google Sheets

Bonne implémentation ! 🚀
