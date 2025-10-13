# 📝 Configuration Google Apps Script - Stock Easy

## Vue d'ensemble

Ce document explique les modifications nécessaires dans votre script Google Apps Script pour supporter toutes les nouvelles fonctionnalités.

## 🔧 Modifications requises

### 1. Fonction `getAllData()` - Existante, à vérifier

```javascript
function getAllData() {
  // Doit retourner:
  return {
    products: [
      {
        sku: 'SKU-001',
        name: 'Nom du produit',
        stock: 100,
        salesPerDay: 5.2,
        buyPrice: 10.50,
        supplier: 'Fournisseur A',
        delay: 45,
        moq: 50,
        multiplier: 1,
        reorderPoint: 200,
        qtyToOrder: 150,
        customSecurityStock: null  // NOUVEAU: null = auto (20% délai), sinon valeur custom
      }
    ],
    suppliers: [
      {
        name: 'Fournisseur A',
        email: 'contact@fournisseur-a.com',
        delay: 45
      }
    ],
    orders: [
      {
        id: 'PO-001',  // NOUVEAU FORMAT: PO-XXX au lieu de timestamp
        supplier: 'Fournisseur A',
        status: 'pending_confirmation',
        total: 1500.00,
        createdAt: '2025-10-13',
        confirmedAt: null,
        shippedAt: null,
        receivedAt: null,
        completedAt: null,
        trackingNumber: '',  // NOUVEAU: peut être vide
        hasDiscrepancy: false,  // NOUVEAU
        damageReport: false,  // NOUVEAU
        items: [
          {
            sku: 'SKU-001',
            quantity: 150,
            pricePerUnit: 10.00,
            receivedQuantity: null  // NOUVEAU: pour gérer les écarts
          }
        ],
        notes: ''
      }
    ]
  };
}
```

### 2. Fonction `updateProduct()` - À modifier

```javascript
function updateProduct(sku, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Produits');
  const data = sheet.getDataRange().getValues();
  
  // Trouver la ligne du produit
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sku) {  // Colonne SKU
      // Mise à jour du multiplicateur (déjà existant)
      if (updates.multiplier !== undefined) {
        sheet.getRange(i + 1, COLONNE_MULTIPLIER).setValue(updates.multiplier);
      }
      
      // NOUVEAU: Mise à jour du stock de sécurité personnalisé
      if (updates.customSecurityStock !== undefined) {
        // Si null ou vide, effacer la cellule (mode auto)
        // Sinon, enregistrer la valeur custom
        const value = updates.customSecurityStock === null ? '' : updates.customSecurityStock;
        sheet.getRange(i + 1, COLONNE_CUSTOM_SECURITY_STOCK).setValue(value);
      }
      
      break;
    }
  }
  
  return { success: true };
}
```

**Nouvelle colonne à ajouter dans Google Sheets** :
- Nom: `Custom Security Stock`
- Position: Après la colonne "Multiplier"
- Valeurs: Vide (auto) ou nombre de jours

### 3. Fonction `createOrder()` - À modifier

```javascript
function createOrder(orderData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Commandes');
  
  // IMPORTANT: Le format de l'ID est maintenant PO-001, PO-002, etc.
  // Au lieu de PO-{timestamp}
  
  const row = [
    orderData.id,  // Format: "PO-001"
    orderData.supplier,
    orderData.status,
    orderData.total,
    orderData.createdAt,
    orderData.confirmedAt || '',
    orderData.shippedAt || '',
    orderData.receivedAt || '',
    orderData.completedAt || '',
    orderData.trackingNumber || '',  // NOUVEAU: peut être vide
    JSON.stringify(orderData.items),
    orderData.notes || '',
    orderData.hasDiscrepancy || false,  // NOUVEAU
    orderData.damageReport || false  // NOUVEAU
  ];
  
  sheet.appendRow(row);
  
  return { success: true, orderId: orderData.id };
}
```

**Nouvelles colonnes à ajouter dans Google Sheets (feuille "Commandes")** :
- Colonne `Has Discrepancy` (boolean) : Indique si la commande a des écarts
- Colonne `Damage Report` (boolean) : Indique si des dommages ont été reportés

### 4. Fonction `updateOrderStatus()` - À modifier

```javascript
function updateOrderStatus(orderId, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Commandes');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      // Mise à jour du statut
      if (updates.status) {
        sheet.getRange(i + 1, COLONNE_STATUS).setValue(updates.status);
      }
      
      // Mise à jour des dates
      if (updates.confirmedAt) {
        sheet.getRange(i + 1, COLONNE_CONFIRMED_AT).setValue(updates.confirmedAt);
      }
      if (updates.shippedAt) {
        sheet.getRange(i + 1, COLONNE_SHIPPED_AT).setValue(updates.shippedAt);
      }
      if (updates.receivedAt) {
        sheet.getRange(i + 1, COLONNE_RECEIVED_AT).setValue(updates.receivedAt);
      }
      if (updates.completedAt) {
        sheet.getRange(i + 1, COLONNE_COMPLETED_AT).setValue(updates.completedAt);
      }
      
      // Mise à jour du tracking number (NOUVEAU: peut être vide)
      if (updates.trackingNumber !== undefined) {
        sheet.getRange(i + 1, COLONNE_TRACKING).setValue(updates.trackingNumber || '');
      }
      
      // NOUVEAU: Mise à jour des flags
      if (updates.hasDiscrepancy !== undefined) {
        sheet.getRange(i + 1, COLONNE_HAS_DISCREPANCY).setValue(updates.hasDiscrepancy);
      }
      if (updates.damageReport !== undefined) {
        sheet.getRange(i + 1, COLONNE_DAMAGE_REPORT).setValue(updates.damageReport);
      }
      
      // NOUVEAU: Mise à jour des items avec quantités reçues
      if (updates.items) {
        sheet.getRange(i + 1, COLONNE_ITEMS).setValue(JSON.stringify(updates.items));
      }
      
      break;
    }
  }
  
  return { success: true };
}
```

### 5. Fonction `updateStock()` - À modifier/vérifier

```javascript
function updateStock(items) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Produits');
  const data = sheet.getDataRange().getValues();
  
  // items = [{sku: 'SKU-001', quantity: 50}, ...]
  
  items.forEach(item => {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === item.sku) {  // Colonne SKU
        const currentStock = data[i][COLONNE_STOCK - 1];  // Stock actuel
        const newStock = currentStock + item.quantity;  // AJOUT au stock actuel
        
        // Mise à jour du stock
        sheet.getRange(i + 1, COLONNE_STOCK).setValue(newStock);
        
        Logger.log(`Stock mis à jour pour ${item.sku}: ${currentStock} + ${item.quantity} = ${newStock}`);
        break;
      }
    }
  });
  
  return { success: true };
}
```

**IMPORTANT**: Cette fonction doit **AJOUTER** la quantité au stock existant, pas remplacer !

---

## 📊 Structure des feuilles Google Sheets

### Feuille "Produits"

| Colonne | Nom | Type | Description |
|---------|-----|------|-------------|
| A | SKU | Texte | Identifiant unique |
| B | Nom | Texte | Nom du produit |
| C | Stock | Nombre | Stock actuel |
| D | Ventes/jour | Nombre | Ventes moyennes par jour |
| E | Prix Achat | Nombre | Prix d'achat unitaire |
| F | Fournisseur | Texte | Nom du fournisseur |
| G | Délai | Nombre | Délai de livraison en jours |
| H | MOQ | Nombre | Quantité minimum de commande |
| I | Multiplicateur | Nombre | Coefficient saisonnalité (défaut: 1) |
| J | Point Commande | Nombre | Point de commande calculé |
| K | Qté à Commander | Nombre | Quantité suggérée à commander |
| **L** | **Custom Security Stock** | **Nombre ou vide** | **NOUVEAU: Stock de sécurité personnalisé (vide = auto)** |

### Feuille "Commandes"

| Colonne | Nom | Type | Description |
|---------|-----|------|-------------|
| A | ID | Texte | Format: PO-001, PO-002, etc. |
| B | Fournisseur | Texte | Nom du fournisseur |
| C | Statut | Texte | pending_confirmation, processing, in_transit, received, reconciliation, completed |
| D | Total | Nombre | Montant total de la commande |
| E | Date Création | Date | Date de création |
| F | Date Confirmation | Date | Date de confirmation par le fournisseur |
| G | Date Expédition | Date | Date d'expédition |
| H | Date Réception | Date | Date de réception |
| I | Date Finalisation | Date | Date de finalisation complète |
| J | Numéro Tracking | Texte | Numéro de suivi (peut être vide) |
| K | Items | JSON | Liste des produits commandés |
| L | Notes | Texte | Notes diverses |
| **M** | **Has Discrepancy** | **Boolean** | **NOUVEAU: Indique si des écarts ont été détectés** |
| **N** | **Damage Report** | **Boolean** | **NOUVEAU: Indique si des dommages ont été reportés** |

### Feuille "Fournisseurs"

| Colonne | Nom | Type | Description |
|---------|-----|------|-------------|
| A | Nom | Texte | Nom du fournisseur |
| B | Email | Texte | Email de contact |
| C | Délai | Nombre | Délai de livraison en jours |

---

## 🔢 Constantes de colonnes (à définir dans votre script)

```javascript
// Feuille Produits
const COLONNE_SKU = 1;
const COLONNE_NOM = 2;
const COLONNE_STOCK = 3;
const COLONNE_VENTES_JOUR = 4;
const COLONNE_PRIX_ACHAT = 5;
const COLONNE_FOURNISSEUR = 6;
const COLONNE_DELAI = 7;
const COLONNE_MOQ = 8;
const COLONNE_MULTIPLIER = 9;
const COLONNE_POINT_COMMANDE = 10;
const COLONNE_QTE_COMMANDER = 11;
const COLONNE_CUSTOM_SECURITY_STOCK = 12;  // NOUVEAU

// Feuille Commandes
const COLONNE_ORDER_ID = 1;
const COLONNE_SUPPLIER = 2;
const COLONNE_STATUS = 3;
const COLONNE_TOTAL = 4;
const COLONNE_CREATED_AT = 5;
const COLONNE_CONFIRMED_AT = 6;
const COLONNE_SHIPPED_AT = 7;
const COLONNE_RECEIVED_AT = 8;
const COLONNE_COMPLETED_AT = 9;
const COLONNE_TRACKING = 10;
const COLONNE_ITEMS = 11;
const COLONNE_NOTES = 12;
const COLONNE_HAS_DISCREPANCY = 13;  // NOUVEAU
const COLONNE_DAMAGE_REPORT = 14;    // NOUVEAU
```

---

## 🚀 Déploiement

1. **Ouvrez votre Google Sheet Stock Easy**
2. **Extensions → Apps Script**
3. **Ajoutez/modifiez les fonctions ci-dessus**
4. **Ajoutez les nouvelles colonnes dans les feuilles**
5. **Testez chaque fonction avec le bouton "Exécuter"**
6. **Déployez en tant que Web App**
7. **Copiez l'URL de déploiement**
8. **Mettez à jour `API_URL` dans `StockEasy.jsx`**

---

## 📧 Configuration Email (Optionnel)

### Option A: Gmail API via Google Apps Script

```javascript
function sendClaimEmail(to, subject, body) {
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: body,
      name: 'Stock Easy'
    });
    return { success: true };
  } catch (error) {
    Logger.log('Erreur envoi email: ' + error);
    return { success: false, error: error.toString() };
  }
}

// Fonction à appeler depuis le frontend
function sendDiscrepancyEmail(orderData, discrepancies) {
  const supplier = // Récupérer email fournisseur
  
  const body = `Bonjour,

Nous avons constaté des écarts entre les quantités commandées et reçues :

${discrepancies.map(d => `- ${d.product}: Commandé ${d.ordered}, Reçu ${d.received}`).join('\n')}

Merci de nous confirmer ces écarts et de procéder à l'envoi des quantités manquantes.

Cordialement,
Stock Easy`;

  return sendClaimEmail(supplier.email, `Réclamation - Commande ${orderData.id}`, body);
}
```

### Modifications dans StockEasy.jsx

```javascript
// Au lieu de:
console.log('EMAIL DE RÉCLAMATION GÉNÉRÉ:', claimEmail);
alert('📧 Email de réclamation généré !\\n\\n' + claimEmail);

// Utiliser:
const response = await api.sendDiscrepancyEmail(reconciliationOrder, discrepancies);
if (response.success) {
  alert('✅ Email envoyé avec succès !');
} else {
  alert('❌ Erreur lors de l\'envoi: ' + response.error);
}
```

---

## ✅ Checklist de vérification

- [ ] Colonne "Custom Security Stock" ajoutée dans feuille Produits
- [ ] Colonnes "Has Discrepancy" et "Damage Report" ajoutées dans feuille Commandes
- [ ] Fonction `updateProduct()` modifiée pour supporter `customSecurityStock`
- [ ] Fonction `createOrder()` modifiée pour le nouveau format PO-XXX
- [ ] Fonction `updateOrderStatus()` modifiée pour les nouveaux champs
- [ ] Fonction `updateStock()` vérifie qu'elle AJOUTE au stock (ne remplace pas)
- [ ] Fonction `getAllData()` retourne les nouveaux champs
- [ ] Test: Créer une commande → Vérifier le numéro PO-001
- [ ] Test: Confirmer une commande sans tracking → Vérifier que ça fonctionne
- [ ] Test: Valider une réception conforme → Vérifier la mise à jour du stock
- [ ] Test: Créer un écart → Vérifier les nouvelles colonnes
- [ ] (Optionnel) Configuration email réelle

---

## 🆘 Dépannage

### Problème: Les numéros PO ne s'incrémentent pas correctement

**Solution**: Vérifiez que la fonction `getAllData()` retourne bien tous les ordres existants, y compris ceux avec l'ancien format `PO-{timestamp}`. La fonction `generatePONumber()` filtre uniquement les PO au format PO-XXX.

### Problème: Le stock ne se met pas à jour

**Solution**: Vérifiez que `updateStock()` AJOUTE la quantité au lieu de remplacer. Vérifiez aussi que le SKU est exactement le même (sensible à la casse).

### Problème: Erreur lors de la sauvegarde du stock de sécurité custom

**Solution**: Assurez-vous que la colonne "Custom Security Stock" existe et que `COLONNE_CUSTOM_SECURITY_STOCK` pointe vers le bon numéro.

### Problème: Les modals ne s'affichent pas

**Solution**: Vérifiez la console du navigateur (F12) pour voir les erreurs JavaScript. Assurez-vous que `reconciliationOrder` est bien défini.

---

## 📞 Support

Pour toute question ou problème:
1. Vérifiez les logs dans Apps Script (View → Logs)
2. Vérifiez la console du navigateur (F12)
3. Consultez la documentation Google Apps Script: https://developers.google.com/apps-script

---

**Dernière mise à jour**: 2025-10-13
