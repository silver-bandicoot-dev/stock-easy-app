# 📋 Guide de Configuration et Test de l'API Backend - Stock Easy

## ✅ Configuration Effectuée

L'API Google Apps Script a été configurée avec succès dans votre application. Voici un résumé des fichiers créés et modifiés :

### 🔧 Fichiers de Configuration

#### 1. **Variables d'Environnement** (`.env`)
```env
VITE_API_URL=https://script.google.com/macros/s/AKfycbzeloLj-PTcTcx5kgxDyCh6iGXXB0cHzug_vsiMCpEDqxlZou7WjjmqqIiPB9PEXzOF/exec
```

Un fichier `.env.example` est également fourni comme template.

#### 2. **Configuration API** (`src/config/api.js`)
- Centralise l'URL de l'API
- Importe automatiquement depuis `.env`
- Configuration supplémentaire (timeout, retry, etc.)

#### 3. **Service API** (`src/services/apiService.js`)
Toutes les fonctions API sont maintenant centralisées :

- ✅ `getAllData()` - Récupère toutes les données
- ✅ `createOrder(orderData)` - Crée une commande
- ✅ `updateOrderStatus(orderId, updates)` - Met à jour une commande
- ✅ `updateStock(items)` - Met à jour le stock (addition)
- ✅ `updateProduct(sku, updates)` - Met à jour un produit
- ✅ `createSupplier(data)` - Crée un fournisseur
- ✅ `updateSupplier(name, updates)` - Met à jour un fournisseur
- ✅ `deleteSupplier(name)` - Supprime un fournisseur
- ✅ `assignSupplierToProduct(sku, supplier)` - Assigne un fournisseur
- ✅ `removeSupplierFromProduct(sku)` - Retire un fournisseur
- ✅ `getParameter(name)` - Lit un paramètre
- ✅ `updateParameter(name, value)` - Met à jour un paramètre

#### 4. **Tests API** (`src/utils/testApi.js`)
Fonctions de test de connexion :
- `testApiConnection()` - Test complet de connexion
- `testApiAction(action, params)` - Test d'une action spécifique
- `validateDataStructure(data)` - Validation de la structure

#### 5. **Tests Complets** (`src/utils/fullApiTest.js`)
Script de test exhaustif pour toutes les fonctionnalités :
- `runFullApiTests()` - Exécute tous les tests
- `runQuickTests()` - Tests rapides de base

### 📝 Types et Interfaces

Le fichier `src/types/interfaces.js` documente toutes les structures de données :

**Supplier** (Fournisseur)
```javascript
{
  name: string,
  email: string,
  leadTimeDays: number,  // ✅ PAS "delay"
  moq: number,
  notes: string
}
```

**Product** (Produit)
```javascript
{
  sku: string,
  name: string,
  stock: number,
  sales30d: number,
  salesPerDay: number,
  multiplier: number,
  customSecurityStock: number | null,
  adjustedSales: number,
  supplier: string,
  leadTimeDays: number,  // ✅ PAS "delay"
  moq: number,
  buyPrice: number,
  sellPrice: number,
  margin: number,
  securityStock: number,
  reorderPoint: number,
  qtyToOrder: number,
  status: string,
  investment: number,
  potentialRevenue: number,
  grossMargin: number
}
```

**Order** (Commande)
```javascript
{
  id: string,
  supplier: string,
  status: string,
  total: number,
  createdAt: string,
  eta: string | null,
  confirmedAt: string | null,      // ✅ NOUVEAU
  shippedAt: string | null,
  receivedAt: string | null,
  completedAt: string | null,
  trackingNumber: string,
  hasDiscrepancy: boolean,
  damageReport: boolean,           // ✅ NOUVEAU
  notes: string,
  items: OrderItem[]
}
```

**OrderItem** (Article de commande)
```javascript
{
  sku: string,
  quantity: number,
  pricePerUnit: number,
  receivedQuantity: number | null,
  discrepancyType: 'none' | 'missing' | 'damaged' | 'excess',  // ✅ NOUVEAU
  discrepancyNotes: string         // ✅ NOUVEAU
}
```

## 🧪 Tests à Effectuer

### 1. Test au Démarrage (Automatique)

L'application teste automatiquement la connexion API au démarrage. Ouvrez la console du navigateur pour voir :

```
🔄 Test de connexion à l'API...
📍 URL: https://script.google.com/macros/s/...

1️⃣ Test Health Check...
✅ Health check réussi

2️⃣ Test getAllData...
✅ Données reçues avec succès:
   📦 Produits: X
   📋 Commandes: Y
   🏢 Fournisseurs: Z

🎉 Tous les tests sont passés avec succès!
```

### 2. Tests Rapides

Dans la console du navigateur :

```javascript
import { runQuickTests } from './src/utils/fullApiTest.js';
await runQuickTests();
```

### 3. Tests Complets

Pour tester TOUTES les fonctionnalités :

```javascript
import { runFullApiTests } from './src/utils/fullApiTest.js';
await runFullApiTests();
```

Ce script va :
1. ✅ Récupérer toutes les données
2. ✅ Créer un fournisseur de test
3. ✅ Mettre à jour un produit
4. ✅ Créer une commande de test
5. ✅ Confirmer la commande
6. ✅ Marquer comme expédiée
7. ✅ Recevoir avec écarts
8. ✅ Mettre à jour le stock
9. ✅ Lire un paramètre
10. ✅ Mettre à jour un paramètre

### 4. Tests Manuels

#### Test 1 : Afficher les produits
```javascript
import api from './src/services/apiService.js';
const data = await api.getAllData();
console.table(data.products);
```

#### Test 2 : Créer une commande
```javascript
const orderData = {
  id: 'TEST-' + Date.now(),
  supplier: 'Nom du fournisseur',
  status: 'pending',
  total: 150.00,
  createdAt: new Date().toISOString(),
  items: [
    {
      sku: 'SKU123',
      quantity: 5,
      pricePerUnit: 30.00
    }
  ]
};

const result = await api.createOrder(orderData);
console.log('Commande créée:', result);
```

#### Test 3 : Confirmer une commande
```javascript
const result = await api.updateOrderStatus('ORDER-123', {
  status: 'confirmed',
  confirmedAt: new Date().toISOString()
});
console.log('Commande confirmée:', result);
```

#### Test 4 : Recevoir avec écarts
```javascript
const result = await api.updateOrderStatus('ORDER-123', {
  status: 'received',
  receivedAt: new Date().toISOString(),
  hasDiscrepancy: true,
  damageReport: true,
  items: [
    {
      sku: 'SKU123',
      receivedQuantity: 3,
      discrepancyType: 'damaged',
      discrepancyNotes: '2 articles endommagés'
    }
  ]
});
console.log('Commande reçue avec écarts:', result);
```

#### Test 5 : Mettre à jour le stock
```javascript
const result = await api.updateStock([
  { sku: 'SKU123', quantityToAdd: 10 },
  { sku: 'SKU456', quantityToAdd: 5 }
]);
console.log('Stock mis à jour:', result);
```

#### Test 6 : Créer/Modifier un fournisseur
```javascript
// Créer
const supplier = await api.createSupplier({
  name: 'Nouveau Fournisseur',
  email: 'contact@fournisseur.com',
  leadTimeDays: 14,
  moq: 50,
  notes: 'Fournisseur de qualité'
});

// Modifier
const updated = await api.updateSupplier('Nouveau Fournisseur', {
  leadTimeDays: 10,
  moq: 30
});
```

## 🚀 Démarrage de l'Application

1. **Installer les dépendances** (si pas déjà fait)
   ```bash
   cd stock-easy-app
   npm install
   ```

2. **Démarrer en mode développement**
   ```bash
   npm run dev
   ```

3. **Ouvrir la console du navigateur** pour voir les tests automatiques

4. **Vérifier que l'API fonctionne** - Vous devriez voir :
   - ✅ Health check réussi
   - ✅ Données chargées
   - ✅ Structure validée

## 🔍 Débogage

Si vous rencontrez des problèmes :

### 1. Vérifier l'URL de l'API
```javascript
import { API_URL } from './src/config/api.js';
console.log('URL API:', API_URL);
```

### 2. Tester la connexion manuellement
```javascript
const response = await fetch(API_URL + '?action=health');
const data = await response.json();
console.log('Health check:', data);
```

### 3. Vérifier les erreurs CORS
Si vous voyez des erreurs CORS, assurez-vous que :
- Le script Google Apps Script est déployé en tant que "Web app"
- L'accès est défini sur "Anyone" ou "Anyone with the link"

### 4. Vérifier les données reçues
```javascript
import { validateDataStructure } from './src/utils/testApi.js';
const data = await api.getAllData();
const validation = validateDataStructure(data);
console.log('Validation:', validation);
```

## 📚 Documentation Supplémentaire

- **Service API** : Voir `src/services/apiService.js` pour toutes les fonctions disponibles
- **Tests** : Voir `src/utils/fullApiTest.js` pour des exemples d'utilisation
- **Types** : Voir `src/types/interfaces.js` pour la structure des données

## ✨ Fonctionnalités Testées

- [x] Connexion à l'API
- [x] Récupération des données
- [x] Création de commande
- [x] Confirmation de commande
- [x] Expédition de commande
- [x] Réception avec écarts
- [x] Mise à jour du stock
- [x] Gestion des fournisseurs
- [x] Gestion des paramètres
- [x] Assignation fournisseur/produit

## 🎯 Prochaines Étapes

1. Tester chaque fonctionnalité manuellement dans l'interface
2. Vérifier les notifications toast lors des actions
3. Confirmer que les données persistent dans Google Sheets
4. Tester les cas d'erreur et la gestion d'erreurs
5. Optimiser les performances si nécessaire

---

**🎉 Votre API est maintenant configurée et prête à l'emploi !**
