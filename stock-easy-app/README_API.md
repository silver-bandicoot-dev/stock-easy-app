# 🚀 API Backend - Stock Easy

## ✅ Configuration Réussie !

L'API Google Apps Script est configurée et testée avec succès.

---

## 📊 Résultat des Tests

```
✅ Health check réussi
✅ 10 produits chargés
✅ 4 fournisseurs chargés
✅ 8 commandes chargées
✅ Structure validée
```

---

## 🔗 API URL

```
https://script.google.com/macros/s/AKfycbzeloLj-PTcTcx5kgxDyCh6iGXXB0cHzug_vsiMCpEDqxlZou7WjjmqqIiPB9PEXzOF/exec
```

---

## 🚀 Démarrage Rapide

### 1. Tester l'API (depuis le terminal)
```bash
node test-api.mjs
```

### 2. Lancer l'application
```bash
npm run dev
```

### 3. Ouvrir la console (F12)
Les tests automatiques s'afficheront

---

## 📁 Fichiers Créés

### Configuration
- ✅ `.env` - Variables d'environnement
- ✅ `src/config/api.js` - Config API

### Services
- ✅ `src/services/apiService.js` - 12 fonctions API

### Tests
- ✅ `src/utils/testApi.js` - Tests de connexion
- ✅ `src/utils/fullApiTest.js` - Suite complète
- ✅ `test-api.mjs` - Test CLI

### Documentation
- ✅ `GUIDE_CONFIGURATION_API.md` - Guide complet
- ✅ `TEST_API_SUMMARY.md` - Résumé des tests
- ✅ `README_API.md` - Ce fichier

---

## 🧪 Tester l'API

### Test Rapide (Terminal)
```bash
node test-api.mjs
```

### Tests dans le Navigateur
1. Lancer : `npm run dev`
2. Ouvrir la console (F12)
3. Exécuter :
```javascript
// Tests rapides
import { runQuickTests } from './src/utils/fullApiTest.js';
await runQuickTests();

// Tests complets
import { runFullApiTests } from './src/utils/fullApiTest.js';
await runFullApiTests();
```

---

## 📝 Fonctions API

```javascript
import api from './src/services/apiService.js';

// Données
const data = await api.getAllData();

// Commandes
await api.createOrder({ id, supplier, status, total, items, ... });
await api.updateOrderStatus(orderId, { status, confirmedAt, ... });

// Stock
await api.updateStock([{ sku, quantityToAdd }, ...]);

// Produits
await api.updateProduct(sku, { multiplier, stock, ... });

// Fournisseurs
await api.createSupplier({ name, email, leadTimeDays, moq, ... });
await api.updateSupplier(name, { leadTimeDays, moq, ... });
await api.deleteSupplier(name);

// Mapping
await api.assignSupplierToProduct(sku, supplierName);
await api.removeSupplierFromProduct(sku);

// Paramètres
const value = await api.getParameter(name);
await api.updateParameter(name, value);
```

---

## 📋 Checklist

- [x] API configurée
- [x] 12 fonctions disponibles
- [x] Tests automatiques
- [x] Tests manuels
- [x] Documentation complète
- [x] Application compile
- [x] Connexion vérifiée
- [x] Données chargées

---

## 📚 Documentation

- **Guide complet** : `GUIDE_CONFIGURATION_API.md`
- **Tests** : `TEST_API_SUMMARY.md`
- **Config** : `/workspace/CONFIGURATION_API_COMPLETE.md`

---

## 🎯 Prochaines Étapes

1. Tester les fonctionnalités dans l'UI
2. Créer/Confirmer/Recevoir des commandes
3. Gérer les fournisseurs
4. Vérifier la persistance Google Sheets

---

**✨ Tout est prêt ! Lancez l'application avec `npm run dev`**
