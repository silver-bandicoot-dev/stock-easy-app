# 🔧 CORRECTIONS BACKEND - Google Apps Script

Ce document détaille toutes les corrections nécessaires dans votre backend Google Apps Script pour supporter les nouvelles fonctionnalités implémentées dans le frontend.

## 📋 Table des matières

1. [Structure des feuilles Google Sheets](#structure-des-feuilles)
2. [Correction 1 - Ajustement automatique du stock](#correction-1)
3. [Correction 2 - Numérotation PO-001](#correction-2)
4. [Correction 3 - Date de confirmation ISO](#correction-3)
5. [Correction 4 - Gestion des quantités reçues](#correction-4)
6. [Correction 5 - Système de paramètres](#correction-5)
7. [Checklist de vérification](#checklist)

---

## 📊 Structure des feuilles Google Sheets {#structure-des-feuilles}

### Feuille "Produits"

| Colonne | Nom | Type | Description |
|---------|-----|------|-------------|
| A | SKU | Texte | Identifiant unique du produit |
| B | Nom Produit | Texte | Nom du produit |
| C | Stock Actuel | Nombre | Stock actuel (**IMPORTANT: doit être mis à jour par addition**) |
| D | Ventes/Jour (moy 30j) | Nombre | Ventes moyennes par jour |
| E | Prix Achat | Nombre | Prix d'achat unitaire |
| F | Fournisseur | Texte | Nom du fournisseur |
| G | Délai | Nombre | Délai de livraison en jours |
| H | MOQ | Nombre | Quantité minimum de commande |
| I | Multiplicateur | Nombre | Coefficient de saisonnalité (défaut: 1) |
| J | Point de Commande | Nombre | Point de commande calculé |
| K | Qté à Commander | Nombre | Quantité suggérée |

### Feuille "Commandes"

| Colonne | Nom | Type | Description |
|---------|-----|------|-------------|
| A | id | Texte | **Format: PO-001, PO-002, etc.** |
| B | supplier | Texte | Nom du fournisseur |
| C | status | Texte | pending_confirmation, processing, in_transit, received, reconciliation, completed |
| D | total | Nombre | Montant total |
| E | createdAt | Date | Date de création |
| F | confirmedAt | Date ISO | **Date ISO complète: 2025-10-14T22:00:00.000Z** |
| G | shippedAt | Date | Date d'expédition |
| H | receivedAt | Date | Date de réception |
| I | completedAt | Date | Date de finalisation |
| J | trackingNumber | Texte | Numéro de suivi (peut être vide) |
| K | hasDiscrepancy | Boolean | Indique si des écarts ont été détectés |

### Feuille "ArticlesCommande" (NOUVELLE - À CRÉER)

| Colonne | Nom | Type | Description |
|---------|-----|------|-------------|
| A | orderId | Texte | ID de la commande (ex: PO-001) |
| B | sku | Texte | SKU du produit |
| C | quantity | Nombre | Quantité commandée |
| D | pricePerUnit | Nombre | Prix unitaire |
| E | receivedQuantity | Nombre | **Quantité réellement reçue** |

### Feuille "Parametres" (NOUVELLE - À CRÉER)

| Colonne | Nom | Type | Description |
|---------|-----|------|-------------|
| A | parameterName | Texte | Nom du paramètre |
| B | value | Texte/Nombre | Valeur du paramètre |

**Exemples de paramètres à créer :**
```
| parameterName          | value |
|------------------------|-------|
| SeuilSurstockProfond   | 90    |
| DeviseDefaut           | EUR   |
| MultiplicateurDefaut   | 1.2   |
```

---

## 🔧 CORRECTION 1 - Ajustement automatique du stock {#correction-1}

### Problème
Le stock n'était pas mis à jour automatiquement après réception conforme.

### Solution

La fonction `updateStock()` doit **AJOUTER** la quantité au stock existant, pas remplacer.

```javascript
/**
 * Met à jour le stock en AJOUTANT les quantités reçues
 * @param {Array} items - [{sku: 'SKU-001', quantity: 50}, ...]
 */
function updateStock(e) {
  const data = JSON.parse(e.postData.contents);
  const items = data.items;
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Produits');
  const productData = sheet.getDataRange().getValues();
  
  items.forEach(item => {
    for (let i = 1; i < productData.length; i++) {
      if (productData[i][0] === item.sku) { // Colonne A = SKU
        const currentStock = productData[i][2] || 0; // Colonne C = Stock Actuel
        const newStock = currentStock + item.quantity; // ADDITION, pas remplacement
        
        // Validation : vérifier que c'est bien un nombre
        if (isNaN(newStock)) {
          Logger.log(`❌ Erreur: newStock n'est pas un nombre pour ${item.sku}`);
          continue;
        }
        
        sheet.getRange(i + 1, 3).setValue(newStock); // Colonne C
        
        Logger.log(`✅ Stock mis à jour: ${item.sku} → ${currentStock} + ${item.quantity} = ${newStock}`);
        break;
      }
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true 
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### Points clés
- ✅ **AJOUTER** au stock existant : `currentStock + item.quantity`
- ✅ Validation que le résultat est un nombre
- ✅ Logs pour traçabilité

---

## 🔧 CORRECTION 2 - Numérotation PO-001 {#correction-2}

### Problème
Les numéros de commande n'étaient pas séquentiels (PO-001, PO-002, etc.).

### Solution

Le frontend génère déjà les numéros PO corrects. Le backend doit simplement accepter et stocker l'ID fourni.

```javascript
/**
 * Crée une nouvelle commande avec l'ID fourni par le frontend
 */
function createOrder(e) {
  const orderData = JSON.parse(e.postData.contents);
  
  const commandesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Commandes');
  const articlesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ArticlesCommande');
  
  // Enregistrer la commande principale
  const commandeRow = [
    orderData.id,              // A - Format: "PO-001" (fourni par le frontend)
    orderData.supplier,        // B
    orderData.status,          // C
    orderData.total,           // D
    orderData.createdAt,       // E
    orderData.confirmedAt || '',   // F
    orderData.shippedAt || '',     // G
    orderData.receivedAt || '',    // H
    orderData.completedAt || '',   // I
    orderData.trackingNumber || '', // J
    orderData.hasDiscrepancy || false // K
  ];
  
  commandesSheet.appendRow(commandeRow);
  
  // Enregistrer les articles dans ArticlesCommande
  if (orderData.items && orderData.items.length > 0) {
    orderData.items.forEach(item => {
      const articleRow = [
        orderData.id,           // A - orderId
        item.sku,               // B - sku
        item.quantity,          // C - quantity
        item.pricePerUnit,      // D - pricePerUnit
        item.receivedQuantity || '' // E - receivedQuantity (vide au départ)
      ];
      articlesSheet.appendRow(articleRow);
    });
  }
  
  Logger.log(`✅ Commande ${orderData.id} créée avec ${orderData.items.length} articles`);
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    orderId: orderData.id 
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### Points clés
- ✅ Le frontend génère l'ID au format "PO-XXX"
- ✅ Le backend stocke l'ID tel quel
- ✅ Les articles sont stockés dans une feuille séparée "ArticlesCommande"

---

## 🔧 CORRECTION 3 - Date de confirmation ISO {#correction-3}

### Problème
La date de confirmation n'incluait pas l'heure, rendant difficile le suivi précis.

### Solution

Stocker la date au format ISO complet : `2025-10-14T22:00:00.000Z`

```javascript
/**
 * Met à jour le statut d'une commande
 */
function updateOrderStatus(e) {
  const data = JSON.parse(e.postData.contents);
  const orderId = data.orderId;
  
  const commandesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Commandes');
  const commandeData = commandesSheet.getDataRange().getValues();
  
  for (let i = 1; i < commandeData.length; i++) {
    if (commandeData[i][0] === orderId) { // Colonne A = id
      
      // Mise à jour du statut
      if (data.status) {
        commandesSheet.getRange(i + 1, 3).setValue(data.status); // Colonne C
      }
      
      // IMPORTANT: Stocker les dates ISO telles quelles (avec l'heure)
      if (data.confirmedAt) {
        commandesSheet.getRange(i + 1, 6).setValue(data.confirmedAt); // Colonne F
        Logger.log(`✅ Commande ${orderId} confirmée le ${data.confirmedAt}`);
      }
      
      if (data.shippedAt) {
        commandesSheet.getRange(i + 1, 7).setValue(data.shippedAt); // Colonne G
      }
      
      if (data.receivedAt) {
        commandesSheet.getRange(i + 1, 8).setValue(data.receivedAt); // Colonne H
      }
      
      if (data.completedAt) {
        commandesSheet.getRange(i + 1, 9).setValue(data.completedAt); // Colonne I
      }
      
      if (data.trackingNumber !== undefined) {
        commandesSheet.getRange(i + 1, 10).setValue(data.trackingNumber || ''); // Colonne J
      }
      
      if (data.hasDiscrepancy !== undefined) {
        commandesSheet.getRange(i + 1, 11).setValue(data.hasDiscrepancy); // Colonne K
      }
      
      // Mise à jour des articles avec quantités reçues
      if (data.items) {
        updateArticlesReceived(orderId, data.items);
      }
      
      break;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true 
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### Points clés
- ✅ Stocker la date ISO complète (avec l'heure)
- ✅ Le frontend formate la date pour l'affichage

---

## 🔧 CORRECTION 4 - Gestion des quantités reçues {#correction-4}

### Problème
Les quantités reçues n'étaient pas sauvegardées, rendant impossible la gestion des écarts.

### Solution

Mettre à jour la feuille "ArticlesCommande" avec les quantités reçues.

```javascript
/**
 * Met à jour les quantités reçues pour les articles d'une commande
 * @param {string} orderId - ID de la commande (ex: "PO-001")
 * @param {Array} items - Liste des articles avec receivedQuantity
 */
function updateArticlesReceived(orderId, items) {
  const articlesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ArticlesCommande');
  const articlesData = articlesSheet.getDataRange().getValues();
  
  items.forEach(item => {
    for (let i = 1; i < articlesData.length; i++) {
      const rowOrderId = articlesData[i][0]; // Colonne A
      const rowSku = articlesData[i][1];     // Colonne B
      
      if (rowOrderId === orderId && rowSku === item.sku) {
        const receivedQty = item.receivedQuantity !== undefined ? item.receivedQuantity : item.quantity;
        
        // Mettre à jour receivedQuantity (colonne E)
        articlesSheet.getRange(i + 1, 5).setValue(receivedQty);
        
        Logger.log(`✅ ${orderId} - ${item.sku}: ${receivedQty} unités reçues`);
        break;
      }
    }
  });
}

/**
 * Récupère les articles d'une commande avec les quantités reçues
 */
function getOrderArticles(orderId) {
  const articlesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ArticlesCommande');
  const articlesData = articlesSheet.getDataRange().getValues();
  
  const articles = [];
  
  for (let i = 1; i < articlesData.length; i++) {
    if (articlesData[i][0] === orderId) {
      articles.push({
        sku: articlesData[i][1],
        quantity: articlesData[i][2],
        pricePerUnit: articlesData[i][3],
        receivedQuantity: articlesData[i][4] || null
      });
    }
  }
  
  return articles;
}
```

### Mise à jour de `getAllData()` pour inclure les articles

```javascript
function getAllData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // ... (code existant pour products et suppliers) ...
  
  // Charger les commandes
  const commandesSheet = sheet.getSheetByName('Commandes');
  const commandesData = commandesSheet.getDataRange().getValues();
  const orders = [];
  
  for (let i = 1; i < commandesData.length; i++) {
    const orderId = commandesData[i][0];
    
    // Récupérer les articles de cette commande
    const items = getOrderArticles(orderId);
    
    orders.push({
      id: orderId,
      supplier: commandesData[i][1],
      status: commandesData[i][2],
      total: commandesData[i][3],
      createdAt: commandesData[i][4],
      confirmedAt: commandesData[i][5] || null,
      shippedAt: commandesData[i][6] || null,
      receivedAt: commandesData[i][7] || null,
      completedAt: commandesData[i][8] || null,
      trackingNumber: commandesData[i][9] || '',
      hasDiscrepancy: commandesData[i][10] || false,
      items: items
    });
  }
  
  // ... (reste du code) ...
  
  return {
    products: products,
    suppliers: suppliers,
    orders: orders,
    parameters: getParameters() // NOUVEAU
  };
}
```

### Points clés
- ✅ Feuille "ArticlesCommande" pour stocker les détails
- ✅ Colonne `receivedQuantity` pour tracer les écarts
- ✅ `hasDiscrepancy` calculé automatiquement

---

## 🔧 CORRECTION 5 - Système de paramètres {#correction-5}

### Problème
Les seuils et paramètres étaient codés en dur dans le code.

### Solution

Créer une feuille "Parametres" et une fonction pour lire les valeurs.

```javascript
/**
 * Lit un paramètre depuis la feuille Parametres
 * @param {string} parameterName - Nom du paramètre
 * @returns {string|number} - Valeur du paramètre
 */
function getParameter(parameterName) {
  const parametresSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Parametres');
  
  if (!parametresSheet) {
    Logger.log('⚠️ Feuille Parametres introuvable');
    return getDefaultParameter(parameterName);
  }
  
  const data = parametresSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === parameterName) { // Colonne A = parameterName
      return data[i][1]; // Colonne B = value
    }
  }
  
  Logger.log(`⚠️ Paramètre "${parameterName}" introuvable, utilisation valeur par défaut`);
  return getDefaultParameter(parameterName);
}

/**
 * Valeurs par défaut des paramètres
 */
function getDefaultParameter(parameterName) {
  const defaults = {
    "SeuilSurstockProfond": 90,
    "DeviseDefaut": "EUR",
    "MultiplicateurDefaut": 1.2
  };
  
  return defaults[parameterName] || null;
}

/**
 * Récupère tous les paramètres
 */
function getParameters() {
  const parametresSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Parametres');
  
  if (!parametresSheet) {
    return {
      SeuilSurstockProfond: 90,
      DeviseDefaut: "EUR",
      MultiplicateurDefaut: 1.2
    };
  }
  
  const data = parametresSheet.getDataRange().getValues();
  const params = {};
  
  for (let i = 1; i < data.length; i++) {
    params[data[i][0]] = data[i][1];
  }
  
  return params;
}
```

### Modification du doGet pour supporter getParameter

```javascript
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getAllData') {
    return ContentService.createTextOutput(JSON.stringify(getAllData()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getParameter') {
    const paramName = e.parameter.name;
    const value = getParameter(paramName);
    return ContentService.createTextOutput(JSON.stringify({ value: value }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    error: 'Action inconnue' 
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### Points clés
- ✅ Feuille "Parametres" pour centraliser les configurations
- ✅ Fonction `getParameter()` avec fallback sur valeurs par défaut
- ✅ `getAllData()` retourne les paramètres automatiquement

---

## ✅ Checklist de vérification {#checklist}

### Structure Google Sheets
- [ ] Feuille "Produits" existe avec les bonnes colonnes
- [ ] Feuille "Commandes" existe avec la colonne `hasDiscrepancy` (K)
- [ ] Feuille "ArticlesCommande" créée avec colonnes A-E
- [ ] Feuille "Parametres" créée avec colonnes A-B
- [ ] Paramètres initiaux ajoutés (SeuilSurstockProfond, DeviseDefaut, etc.)

### Fonctions Backend
- [ ] `updateStock()` AJOUTE au stock (ne remplace pas)
- [ ] `createOrder()` crée des lignes dans ArticlesCommande
- [ ] `updateOrderStatus()` appelle `updateArticlesReceived()`
- [ ] `getAllData()` retourne les articles avec `receivedQuantity`
- [ ] `getAllData()` retourne les paramètres
- [ ] `getParameter()` implémentée
- [ ] `doGet()` supporte l'action "getParameter"

### Tests
- [ ] Créer une commande → Vérifier le numéro PO-001
- [ ] Confirmer une commande → Vérifier la date ISO complète en colonne F
- [ ] Réceptionner une commande conforme → Vérifier que le stock augmente
- [ ] Réceptionner avec écart → Vérifier receivedQuantity dans ArticlesCommande
- [ ] Vérifier que `hasDiscrepancy` est bien mis à `true` en cas d'écart
- [ ] Changer un paramètre dans Parametres → Vérifier que le KPI s'adapte

---

## 🆘 Dépannage

### Le stock ne se met pas à jour
**Vérification** : Dans `updateStock()`, assurez-vous d'utiliser `+` et non `=`
```javascript
// ❌ FAUX
const newStock = item.quantity;

// ✅ CORRECT
const newStock = currentStock + item.quantity;
```

### Les numéros PO ne sont pas séquentiels
**Solution** : Le frontend génère les numéros. Assurez-vous que le backend stocke l'ID fourni tel quel.

### La date de confirmation ne s'affiche pas correctement
**Vérification** : La colonne F doit contenir la date ISO complète (ex: `2025-10-14T22:00:00.000Z`)

### Les paramètres ne se chargent pas
**Vérification** :
1. La feuille "Parametres" existe-t-elle ?
2. La première ligne contient-elle les en-têtes (`parameterName`, `value`) ?
3. Les paramètres sont-ils bien orthographiés (sensible à la casse) ?

---

## 📝 Exemple de script Apps Script complet

Voici un exemple de structure complète pour votre script :

```javascript
// ============================================
// POINT D'ENTRÉE HTTP GET
// ============================================
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getAllData') {
    return ContentService.createTextOutput(JSON.stringify(getAllData()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getParameter') {
    const paramName = e.parameter.name;
    const value = getParameter(paramName);
    return ContentService.createTextOutput(JSON.stringify({ value: value }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    error: 'Action inconnue' 
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// POINT D'ENTRÉE HTTP POST
// ============================================
function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const action = e.parameter.action;
  
  if (action === 'createOrder') {
    return createOrder(e);
  }
  
  if (action === 'updateOrderStatus') {
    return updateOrderStatus(e);
  }
  
  if (action === 'updateStock') {
    return updateStock(e);
  }
  
  if (action === 'updateProduct') {
    return updateProduct(e);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    error: 'Action inconnue' 
  })).setMimeType(ContentService.MimeType.JSON);
}

// ... (Toutes les fonctions détaillées ci-dessus) ...
```

---

**Dernière mise à jour** : 2025-10-14

**Note** : Ce document doit être utilisé en complément du fichier `GOOGLE_APPS_SCRIPT_CONFIG.md` existant.
