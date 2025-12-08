# 🔧 Guide de Vérification Gadget

## 📋 Checklist Complète Gadget

### 1. Vérifier le stockEasyCompanyId

#### Via l'interface Gadget
1. Allez sur https://stockeasy-app.gadget.app
2. Cliquez sur "Data" dans la sidebar
3. Sélectionnez "shopifyShop"
4. Cliquez sur votre shop (devrait être 1 entrée)

**Vérifiez ces champs :**
```
✅ id: [un ID Gadget]
✅ myshopifyDomain: votre-shop.myshopify.com
✅ stockEasyCompanyId: [UUID] ← CRITIQUE : doit être rempli
✅ defaultLocationId: [ID ou GID Shopify]
```

**Si `stockEasyCompanyId` est vide :**

Option A - Via Supabase (Trouver le company_id)
```sql
SELECT id, nom_entreprise, shopify_shop_domain
FROM companies
WHERE shopify_shop_domain LIKE '%votre-shop%';
```

Option B - Via Gadget Console (Mettre à jour)
```javascript
const shop = await api.shopifyShop.findFirst({
  filter: { myshopifyDomain: { equals: "votre-shop.myshopify.com" } }
});

await api.shopifyShop.update(shop.id, {
  stockEasyCompanyId: "UUID-DEPUIS-SUPABASE"
});
```

---

### 2. Vérifier les Logs des Webhooks Orders

#### Accéder aux logs
1. Gadget Dashboard > "Logs" (icône dans la sidebar)
2. Filtrer :
   - **Model** : `shopifyOrder`
   - **Action** : `create`

#### Ce que vous devriez voir

**Logs normaux (✅ succès) :**
```
📦 New order created - enqueued sync to Supabase
  orderId: gid://shopify/Order/12345
  orderName: #1001
```

**Logs en cas de problème (❌) :**
```
❌ Failed to enqueue order sync
  error: Company not found
  orderId: gid://shopify/Order/12345
```

#### Si vous ne voyez AUCUN log

**Cela signifie :**
- Aucune commande n'a été créée dans Shopify depuis l'installation
- Les webhooks Shopify ne sont pas configurés
- Le webhook n'arrive pas jusqu'à Gadget

**Solution :**
1. Créer une commande test dans Shopify
2. Vérifier les webhooks Shopify (voir section 3)
3. Vérifier les logs Shopify (voir section 4)

---

### 3. Vérifier la Configuration des Webhooks

#### Via le fichier shopify.app.toml

**Fichier** : `stockeasy-app-gadget/shopify.app.toml`

```toml
[webhooks]
api_version = "2024-10"

[[webhooks.subscriptions]]
topics = ["orders/create"]
uri = "/webhooks/orders/create"

[[webhooks.subscriptions]]
topics = ["orders/updated"]
uri = "/webhooks/orders/update"

[[webhooks.subscriptions]]
topics = ["products/create"]
uri = "/webhooks/products/create"

[[webhooks.subscriptions]]
topics = ["products/update"]
uri = "/webhooks/products/update"

[[webhooks.subscriptions]]
topics = ["inventory_levels/update"]
uri = "/webhooks/inventory/update"
```

**Vérifier que :**
- ✅ `orders/create` est présent
- ✅ `orders/updated` est présent
- ✅ L'app est déployée (les webhooks ne s'activent qu'après deploy)

---

### 4. Vérifier les Webhooks dans Shopify Admin

#### Accès
1. Shopify Admin : https://admin.shopify.com/store/votre-shop
2. Settings (en bas à gauche)
3. Notifications
4. Scroll jusqu'à "Webhooks" (tout en bas)

#### Webhooks attendus

Vous devriez voir ces webhooks **créés par l'app StockEasy** :

| Topic | URL de destination | Status |
|-------|-------------------|--------|
| `orders/create` | https://stockeasy-app.gadget.app/... | ✅ |
| `orders/updated` | https://stockeasy-app.gadget.app/... | ✅ |
| `products/create` | https://stockeasy-app.gadget.app/... | ✅ |
| `products/update` | https://stockeasy-app.gadget.app/... | ✅ |
| `inventory_levels/update` | https://stockeasy-app.gadget.app/... | ✅ |

#### Si les webhooks sont absents

**Cause 1 : App pas installée correctement**
```
Solution : Réinstaller l'app Shopify
1. Shopify Admin > Apps
2. Désinstaller StockEasy
3. Réinstaller depuis Gadget (env: development)
```

**Cause 2 : Webhooks non créés au deploy**
```
Solution : Redéployer l'app dans Gadget
1. Gadget > Deploy
2. Vérifier que "Create webhooks" est coché
3. Déployer
```

---

### 5. Vérifier les Product Mappings

#### Via Gadget Data Browser
1. Gadget > Data > productMapping
2. Vérifier qu'il y a des entrées

**Colonnes importantes :**
```
shopifyVariantId : ID numérique Shopify
shopifySku       : SKU côté Shopify
stockEasySku     : SKU côté StockEasy (doit correspondre!)
syncSource       : "shopify" | "stockeasy" | "manual"
lastSyncedAt     : Date de dernière sync
```

#### Si la table est vide

**Cause : Sync initiale jamais faite**

**Solution : Lancer la sync**

Option A - Via Gadget Console
```javascript
// Sync tous les shops
const shops = await api.shopifyShop.findMany();

for (const shop of shops) {
  console.log('Syncing shop:', shop.myshopifyDomain);
  
  await api.enqueue(api.syncShopifyProducts, { 
    shopId: shop.id 
  });
}

console.log('✅ Sync enqueued for', shops.length, 'shop(s)');
```

Option B - Via Background Action (recommandé pour production)

Créer : `api/actions/forceSyncAllProducts.js`
```javascript
export const run = async ({ logger, api }) => {
  const shops = await api.shopifyShop.findMany();
  
  logger.info({ count: shops.length }, 'Starting product sync for all shops');
  
  for (const shop of shops) {
    try {
      await api.enqueue(api.syncShopifyProducts, { 
        shopId: shop.id 
      });
      logger.info({ shopId: shop.id, domain: shop.myshopifyDomain }, 'Sync enqueued');
    } catch (error) {
      logger.error({ error: error.message, shopId: shop.id }, 'Failed to enqueue sync');
    }
  }
  
  logger.info('✅ All syncs enqueued');
};

export const options = {
  triggers: { api: true }
};
```

---

### 6. Vérifier les Unmapped Products

#### Via Gadget Console
```javascript
// Compter les produits unmapped
const unmapped = await api.internal.unmappedProducts.findMany({
  first: 100
});

console.log('Unmapped products:', unmapped.length);
unmapped.forEach(p => {
  console.log(`- ${p.productTitle} (Variant: ${p.shopifyVariantId})`);
});
```

#### Via Supabase
```sql
SELECT 
  shopify_variant_id,
  shopify_sku,
  product_title,
  occurrence_count,
  last_seen_at
FROM unmapped_products
ORDER BY occurrence_count DESC
LIMIT 20;
```

**Si vous avez des produits unmapped :**

1. **Vérifier les SKUs**
   - Les SKUs Shopify doivent correspondre exactement aux SKUs StockEasy
   - Les SKUs sont case-sensitive

2. **Résoudre manuellement**
   ```javascript
   // Via Gadget Console
   await api.resolveUnmappedProduct.run({
     shopifyVariantId: "gid://shopify/ProductVariant/123",
     stockEasySku: "SKU-CORRECT"
   });
   ```

---

### 7. Tester le Flux Complet

#### Créer une commande test

1. **Dans Shopify Admin :**
   - Orders > Create order
   - Ajouter un produit qui existe dans productMapping
   - Marquer comme "Paid"
   - Créer la commande

2. **Vérifier dans Gadget Logs (30 secondes après) :**
   ```
   Rechercher : "New order created"
   ✅ Devrait voir : "enqueued sync to Supabase"
   ```

3. **Vérifier dans Supabase (1-2 minutes après) :**
   ```sql
   SELECT * 
   FROM sales_history 
   WHERE shopify_order_id LIKE '%dernière-commande%'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

4. **Vérifier que ventes_jour_moy_30j a été calculé :**
   ```sql
   SELECT 
     sku,
     ventes_jour_moy_30j,
     ventes_jour_ajustees,
     updated_at
   FROM produits
   WHERE sku = 'SKU-DE-LA-COMMANDE-TEST';
   ```

---

## 🚨 Problèmes Courants et Solutions

### Problème 1 : "Company not found in Supabase"

**Log Gadget :**
```
❌ Company not found in Supabase
   shopId: ...
   domain: votre-shop.myshopify.com
```

**Solution :**
1. Vérifier que la company existe dans Supabase
2. Mettre à jour `stockEasyCompanyId` dans shopifyShop
3. Voir section 1 de ce guide

---

### Problème 2 : "Product mapping not found"

**Log Gadget :**
```
⚠️ Product mapping not found for variant
   variantId: 123456
   lineItemTitle: Mon Produit
```

**Solution :**
1. Lancer `syncShopifyProducts`
2. Ou créer le mapping manuellement
3. Voir section 5 de ce guide

---

### Problème 3 : "Sales record already exists (duplicate)"

**Log Gadget :**
```
ℹ️ Sales record already exists (duplicate), skipping
   sku: ABC-123
   orderId: ...
```

**C'est NORMAL !** 
- Les duplicates sont ignorés automatiquement
- La contrainte unique `sales_history_shopify_unique` empêche les doublons

---

## ✅ Checklist Finale Gadget

- [ ] `shopifyShop.stockEasyCompanyId` est rempli
- [ ] Logs montrent des webhooks `orders/create` reçus
- [ ] `productMapping` contient des entrées (> 0)
- [ ] Aucun produit dans `unmappedProducts` (ou résolu)
- [ ] Test commande : vente apparaît dans Supabase
- [ ] Webhooks Shopify sont actifs et pointent vers Gadget

---

## 📞 Commandes Utiles

### Gadget Console - Commandes Rapides

```javascript
// 1. Compter les shops
await api.shopifyShop.findMany();

// 2. Compter les mappings
const mappings = await api.productMapping.findMany({ first: 10 });
console.log('Mappings:', mappings.length);

// 3. Voir les derniers orders
const orders = await api.shopifyOrder.findMany({ 
  first: 5,
  sort: { createdAt: "Descending" }
});
orders.forEach(o => console.log(o.name, o.createdAt));

// 4. Forcer sync produits
await api.enqueue(api.syncShopifyProducts, { 
  shopId: "VOTRE_SHOP_ID" 
});

// 5. Voir les logs de sync
const logs = await api.syncLog.findMany({ 
  first: 20,
  sort: { createdAt: "Descending" }
});
logs.forEach(l => console.log(l.status, l.message));
```

---

**📅 Dernière mise à jour : 2025-01-28**
**🔗 Guide complet : `docs/DIAGNOSTIC_FLUX_VENTES_SHOPIFY.md`**



