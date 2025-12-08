# 🎯 Guide Développeur : Installer StockEasy chez un Marchand

**Date**: 7 Décembre 2025  
**Public**: Toi (développeur)  
**Temps estimé**: 5 minutes

---

## 🚀 Méthode Rapide (3 étapes)

### 1️⃣ Choisis l'environnement

**Production** (données réelles, recommandé pour vrais tests) :
```bash
cd /Users/orioncorp/stock-easy-app/stockeasy-app-gadget
yarn shopify:config:use:production
```

**Développement** (tests avec rollback facile) :
```bash
cd /Users/orioncorp/stock-easy-app/stockeasy-app-gadget
yarn shopify:config:use:development
```

### 2️⃣ Obtiens le lien d'installation

**Option A : Via Shopify Partners Dashboard** (Recommandé) ✅

1. Va sur [partners.shopify.com](https://partners.shopify.com)
2. Connecte-toi
3. **Apps** → **stockeasy-app** (ou stockeasy-app-development)
4. Clique sur **"Test your app"** ou **"Overview"**
5. Tu verras un bouton **"Select store"** ou **"Test on development store"**
6. **Sélectionne la boutique de ta marchande** OU entre son URL
7. **Copie le lien d'installation** qui s'affiche

**Option B : Construis le lien manuellement**

**Production** :
```
https://admin.shopify.com/store/[STORE_NAME]/oauth/install?client_id=17cb240cc35aedce49ed32a877805a83
```

**Développement** :
```
https://admin.shopify.com/store/[STORE_NAME]/oauth/install?client_id=3e35969018e75cd4e60e339d1318a6b9
```

**Remplace `[STORE_NAME]`** par le nom de la boutique (sans `.myshopify.com`)

**Exemple** : Si la boutique est `ma-boutique.myshopify.com`, le lien est :
```
https://admin.shopify.com/store/ma-boutique/oauth/install?client_id=17cb240cc35aedce49ed32a877805a83
```

### 3️⃣ Envoie le message à ta marchande

**Template de Message** :

```
Salut [Prénom] ! 🚀

Merci de tester StockEasy ! Voici comment installer l'app :

🔗 Lien d'installation :
[COLLE LE LIEN ICI]

📋 Instructions :
1. Clique sur le lien
2. Connecte-toi à ton admin Shopify
3. Autorise les permissions demandées
4. Attends 3-5 minutes que la synchro se fasse

✅ Tests à faire :
- Vérifie que tu vois tes produits dans l'onglet "Produits"
- Essaie de modifier le stock d'un produit
- Vérifie que ça se synchronise dans Shopify
- Va dans Paramètres et change la devise

🐛 Si problème :
Envoie-moi une capture d'écran + le message d'erreur !

📚 Guide complet :
[Attache le fichier INSTALLATION_MARCHANDE_TEST.md]

Merci pour ton aide ! 🙏
```

---

## 🔍 Vérification Post-Installation

### Étape 1 : Vérifie dans Gadget

```bash
cd /Users/orioncorp/stock-easy-app/stockeasy-app-gadget

# Ouvre les logs Gadget
yarn gadget:logs
```

Tu devrais voir :
```
✅ Shop installation completed: [shop-domain].myshopify.com
✅ Company created: [company_id]
✅ Syncing products...
✅ Products synced: X products
```

### Étape 2 : Vérifie dans Supabase

Va sur [supabase.com](https://supabase.com) et vérifie :

**Table `companies`** :
```sql
SELECT * FROM companies 
WHERE shopify_shop_id = '[shop-domain].myshopify.com' 
ORDER BY created_at DESC 
LIMIT 1;
```

Tu devrais voir :
- ✅ `id` (UUID)
- ✅ `shop_name`
- ✅ `shopify_shop_id`
- ✅ `created_at`

**Table `produits`** :
```sql
SELECT COUNT(*), company_id 
FROM produits 
WHERE company_id = '[company_id_from_above]'
GROUP BY company_id;
```

Tu devrais voir le nombre de produits synchronisés.

### Étape 3 : Teste le Multi-Tenant (CRUCIAL) 🔒

**C'est LE test le plus important avant le lancement !**

1. **Installe l'app chez 2 marchandes différentes**
2. **Connecte-toi en tant que Marchande A**
   - Note un produit visible (ex: "T-Shirt Bleu")
3. **Connecte-toi en tant que Marchande B**
   - ❌ Tu NE DOIS PAS voir le "T-Shirt Bleu" de Marchande A
   - ✅ Tu dois voir UNIQUEMENT les produits de Marchande B
4. **Fais une recherche du produit de Marchande A**
   - ❌ Aucun résultat ne doit apparaître
5. **Vérifie les paramètres**
   - Marchande A change sa devise en USD
   - Marchande B change sa devise en EUR
   - ❌ Les 2 devises NE doivent PAS s'affecter mutuellement

**Si UN SEUL de ces tests échoue** → 🚨 **NE LANCE PAS EN PRODUCTION** 🚨

---

## 🐛 Dépannage

### Problème 1 : "L'app ne s'installe pas"

**Erreur** : `Invalid OAuth request`

**Causes** :
- ❌ `client_id` incorrect
- ❌ Permissions OAuth mal configurées

**Solution** :
```bash
cd /Users/orioncorp/stock-easy-app/stockeasy-app-gadget

# Vérifie le client_id
cat shopify.app.toml | grep client_id

# Re-déploie l'app
yarn shopify:deploy:production
```

### Problème 2 : "Aucun produit ne se synchronise"

**Vérification** :

```bash
# Regarde les logs Gadget
yarn gadget:logs

# Cherche les erreurs de sync
```

**Causes possibles** :
- ❌ `stockEasyCompanyId` pas créé
- ❌ Erreur lors de la synchro initiale
- ❌ Permissions Shopify API insuffisantes

**Solution** :

1. Va dans Gadget Dashboard → **Data** → **shopifyShop**
2. Trouve la boutique de ta marchande
3. Vérifie que `stockEasyCompanyId` est rempli (UUID)
4. Si vide, déclenche manuellement :

```javascript
// Dans Gadget Console
const shop = await api.shopifyShop.findFirst({
  filter: { domain: { equals: "[shop-domain].myshopify.com" } }
});

// Exécute connectShopToCompany
await api.enqueue(api.connectShopToCompany, {
  shopId: shop.id
});
```

### Problème 3 : "Multi-tenant ne fonctionne pas"

**🚨 CRITIQUE - Ne lance PAS en production** 🚨

**Vérification** :

```sql
-- Dans Supabase SQL Editor
-- Vérifie que chaque produit a bien son company_id
SELECT 
  company_id,
  COUNT(*) as nb_produits
FROM produits
GROUP BY company_id;

-- Si tu vois NULL, c'est un problème critique !
SELECT * FROM produits WHERE company_id IS NULL LIMIT 10;
```

**Si company_id est NULL** :

1. Va voir les logs Gadget pour l'action `syncShopifyProducts`
2. Vérifie que `shop.stockEasyCompanyId` est rempli
3. Re-déclenche la synchronisation manuellement

---

## ✅ Checklist avant de Laisser Tester

- [ ] L'app est déployée (prod ou dev)
- [ ] Le lien d'installation fonctionne (teste-le toi-même)
- [ ] La synchro initiale fonctionne (teste avec une boutique dev)
- [ ] Le multi-tenant est vérifié (2 boutiques test)
- [ ] Les logs Gadget ne montrent pas d'erreurs critiques
- [ ] Supabase a bien créé la company et les produits
- [ ] Le guide INSTALLATION_MARCHANDE_TEST.md est prêt
- [ ] Tu es disponible pour dépanner si problème

---

## 📊 Monitoring Post-Installation

### Gadget Logs

```bash
# Suivi en temps réel
yarn gadget:logs --follow

# Filtrer les erreurs
yarn gadget:logs | grep ERROR
```

### Supabase Logs

Va sur [supabase.com](https://supabase.com) → **Logs** :
- ✅ Vérifie qu'il n'y a pas d'erreurs RLS
- ✅ Vérifie les temps de réponse des RPC functions
- ✅ Regarde si des erreurs 403 (accès refusé) apparaissent

### Sentry (Si configuré)

Si tu as Sentry :
- Vérifie qu'aucune erreur JS n'apparaît
- Regarde les erreurs de fetch/API
- Surveille les erreurs de réconciliation

---

## 🎉 Installation Réussie !

Tu sauras que tout fonctionne si :

✅ La marchande voit ses produits dans l'app  
✅ Le stock se synchronise avec Shopify  
✅ Elle peut créer des commandes  
✅ Les paramètres se sauvegardent  
✅ Le multi-tenant fonctionne (pas de fuites de données)

---

## 🚀 Prochaines Étapes

Après l'installation réussie :

1. **Demande à ta marchande de faire les tests** (voir INSTALLATION_MARCHANDE_TEST.md)
2. **Surveille les logs** pendant 24h
3. **Corrige les bugs** critiques immédiatement
4. **Collecte les feedbacks** pour améliorations
5. **Prépare le lancement public** si tout est OK

---

## 📞 Support

Si problème bloquant :
1. Regarde les logs Gadget
2. Regarde les logs Supabase
3. Vérifie la console du navigateur (F12)
4. Contacte ta marchande pour plus d'infos

**Bon courage ! 🚀**

