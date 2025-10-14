# 🔧 STOCK EASY - MODIFICATIONS BACKEND GOOGLE APPS SCRIPT (VERSION 1)

## 📋 RÉSUMÉ

Ce document contient toutes les modifications nécessaires pour le Google Apps Script afin de supporter la **Version 1 des Paramètres Avancés**.

## ✅ PRÉREQUIS

Assurez-vous que votre Google Sheets contient :
- Une feuille **"Parametres"** avec les colonnes : `Parametre` | `Valeur`
- Une feuille **"Fournisseur"** avec les colonnes : `Nom` | `Email` | `Delai` | `MOQ` | `Notes`
- Une colonne **"Fournisseur"** dans la feuille **"Produits"**

---

## 🆕 NOUVELLES FONCTIONS À AJOUTER

### 1. Fonction `updateParameter`

Ajouter cette fonction pour mettre à jour un paramètre :

```javascript
function updateParameter(paramName, value) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Parametres');
  if (!sheet) return { success: false, error: 'Sheet Parametres introuvable' };
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === paramName) {
      sheet.getRange(i + 1, 2).setValue(value);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Paramètre introuvable' };
}
```

---

### 2. Fonction `createSupplier`

Ajouter cette fonction pour créer un nouveau fournisseur :

```javascript
function createSupplier(supplierData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Fournisseur');
  if (!sheet) return { success: false, error: 'Sheet Fournisseur introuvable' };
  
  // Vérifier que le nom n'existe pas déjà
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === supplierData.name) {
      return { success: false, error: 'Un fournisseur avec ce nom existe déjà' };
    }
  }
  
  // Ajouter le nouveau fournisseur
  const row = [
    supplierData.name,
    supplierData.email,
    supplierData.delay,
    supplierData.moq,
    supplierData.notes || ''
  ];
  
  sheet.appendRow(row);
  return { success: true };
}
```

---

### 3. Fonction `updateSupplier`

Ajouter cette fonction pour modifier un fournisseur existant :

```javascript
function updateSupplier(supplierName, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Fournisseur');
  if (!sheet) return { success: false, error: 'Sheet Fournisseur introuvable' };
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === supplierName) {
      if (updates.email) sheet.getRange(i + 1, 2).setValue(updates.email);
      if (updates.delay) sheet.getRange(i + 1, 3).setValue(updates.delay);
      if (updates.moq !== undefined) sheet.getRange(i + 1, 4).setValue(updates.moq);
      if (updates.notes !== undefined) sheet.getRange(i + 1, 5).setValue(updates.notes);
      
      return { success: true };
    }
  }
  
  return { success: false, error: 'Fournisseur introuvable' };
}
```

---

### 4. Fonction `deleteSupplier`

Ajouter cette fonction pour supprimer un fournisseur :

```javascript
function deleteSupplier(supplierName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Fournisseur');
  if (!sheet) return { success: false, error: 'Sheet Fournisseur introuvable' };
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === supplierName) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Fournisseur introuvable' };
}
```

---

### 5. Fonction `assignSupplierToProduct`

Ajouter cette fonction pour assigner un fournisseur à un produit :

```javascript
function assignSupplierToProduct(sku, supplierName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Produits');
  if (!sheet) return { success: false, error: 'Sheet Produits introuvable' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Trouver l'index de la colonne "Fournisseur"
  const supplierColIndex = headers.indexOf('Fournisseur');
  if (supplierColIndex === -1) {
    return { success: false, error: 'Colonne Fournisseur introuvable' };
  }
  
  // Trouver le produit et mettre à jour le fournisseur
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sku) {
      sheet.getRange(i + 1, supplierColIndex + 1).setValue(supplierName);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Produit introuvable' };
}
```

---

### 6. Fonction `removeSupplierFromProduct`

Ajouter cette fonction pour retirer un fournisseur d'un produit :

```javascript
function removeSupplierFromProduct(sku) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Produits');
  if (!sheet) return { success: false, error: 'Sheet Produits introuvable' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const supplierColIndex = headers.indexOf('Fournisseur');
  if (supplierColIndex === -1) {
    return { success: false, error: 'Colonne Fournisseur introuvable' };
  }
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sku) {
      sheet.getRange(i + 1, supplierColIndex + 1).setValue('');
      return { success: true };
    }
  }
  
  return { success: false, error: 'Produit introuvable' };
}
```

---

### 7. Fonction `getParameter`

Ajouter cette fonction pour récupérer un paramètre :

```javascript
function getParameter(paramName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Parametres');
  if (!sheet) return null;
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === paramName) {
      return data[i][1];
    }
  }
  
  return null;
}
```

---

## 🔄 MODIFIER LA FONCTION `getAllData`

Modifier la fonction `getAllData` pour inclure les paramètres :

```javascript
function getAllData() {
  return {
    products: getProducts(),
    suppliers: getSuppliers(),
    orders: getOrders(),
    parameters: {  // NOUVEAU
      seuilSurstockProfond: getParameter('SeuilSurstockProfond') || 90,
      deviseDefaut: getParameter('DeviseDefaut') || 'EUR',
      multiplicateurDefaut: getParameter('MultiplicateurDefaut') || 1.2
    }
  };
}
```

---

## 🔄 MODIFIER LA FONCTION `doPost`

Modifier la fonction `doPost` pour gérer les nouvelles actions :

```javascript
function doPost(e) {
  const action = e.parameter.action;
  const data = JSON.parse(e.postData.contents);
  
  try {
    let result;
    
    switch (action) {
      // ... actions existantes ...
      
      case 'updateParameter':
        result = updateParameter(data.paramName, data.value);
        break;
      
      case 'createSupplier':
        result = createSupplier(data);
        break;
      
      case 'updateSupplier':
        result = updateSupplier(data.supplierName, data);
        break;
      
      case 'deleteSupplier':
        result = deleteSupplier(data.supplierName);
        break;
      
      case 'assignSupplierToProduct':
        result = assignSupplierToProduct(data.sku, data.supplierName);
        break;
      
      case 'removeSupplierFromProduct':
        result = removeSupplierFromProduct(data.sku);
        break;
      
      default:
        result = { error: 'Action inconnue' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 📊 STRUCTURE DES SHEETS GOOGLE

### Sheet "Parametres"

| Parametre | Valeur |
|-----------|--------|
| SeuilSurstockProfond | 90 |
| DeviseDefaut | EUR |
| MultiplicateurDefaut | 1.2 |

### Sheet "Fournisseur"

| Nom | Email | Delai | MOQ | Notes |
|-----|-------|-------|-----|-------|
| Fournisseur France | contact@france.com | 30 | 50 | Notes diverses |

### Sheet "Produits"

La colonne **"Fournisseur"** doit exister et contenir le nom du fournisseur assigné au produit.

---

## ✅ CHECKLIST D'IMPLÉMENTATION

- [ ] Créer la sheet "Parametres" avec les 3 paramètres
- [ ] Vérifier que la sheet "Fournisseur" existe avec les bonnes colonnes
- [ ] Vérifier que la colonne "Fournisseur" existe dans "Produits"
- [ ] Ajouter toutes les nouvelles fonctions au script
- [ ] Modifier la fonction `getAllData`
- [ ] Modifier la fonction `doPost`
- [ ] Tester chaque fonction via l'interface

---

## 🧪 TESTS

Pour tester les nouvelles fonctionnalités :

1. **Paramètres Généraux** : Modifier la devise, le seuil surstock, le multiplicateur
2. **Gestion Fournisseurs** : Créer, modifier, supprimer un fournisseur
3. **Mapping** : Assigner un fournisseur à un produit, le retirer

---

## 🎯 RÉSULTAT ATTENDU

Une fois toutes les modifications appliquées :
- Les 4 sous-onglets apparaissent dans Paramètres
- Les paramètres globaux peuvent être modifiés
- Les fournisseurs peuvent être gérés (CRUD complet)
- Les produits peuvent être assignés à un fournisseur
- Toutes les modifications sont sauvegardées dans Google Sheets

---

## 📞 SUPPORT

En cas de problème :
1. Vérifier la console du navigateur (F12)
2. Vérifier les logs du Google Apps Script
3. Vérifier que toutes les colonnes existent dans les sheets

Bon déploiement ! 🚀
