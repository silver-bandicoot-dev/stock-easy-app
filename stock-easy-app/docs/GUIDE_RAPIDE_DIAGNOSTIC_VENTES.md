# 🚀 Guide Rapide : Diagnostic Ventes Shopify

## ⚡ Test Rapide (2 minutes)

### 1. Ouvrez Supabase SQL Editor

```sql
-- Copier-coller et exécuter :
SELECT 
  'Ventes totales' as metric,
  COUNT(*) as value
FROM sales_history
UNION ALL
SELECT 
  'Ventes Shopify',
  COUNT(*) 
FROM sales_history 
WHERE source = 'shopify'
UNION ALL
SELECT 
  'Mappings produits',
  COUNT(*) 
FROM product_mapping
UNION ALL
SELECT 
  'Produits avec ventes calculées',
  COUNT(*) 
FROM produits 
WHERE ventes_jour_moy_30j > 0;
```

### 2. Interprétez le résultat

| Métrique | Valeur attendue | Si = 0, alors... |
|----------|-----------------|------------------|
| **Ventes totales** | > 0 | Pas de ventes enregistrées → Vérifier Gadget |
| **Ventes Shopify** | > 0 | Webhooks Shopify non actifs |
| **Mappings produits** | > 0 | Sync produits jamais faite → Lancer sync |
| **Produits avec ventes** | > 0 | Triggers Supabase cassés ou SKUs incompatibles |

---

## 🔴 Problème #1 : Ventes totales = 0

### Cause
Les commandes Shopify n'arrivent pas dans Supabase.

### Solution
1. **Vérifier Gadget**
   - Allez sur https://stockeasy-app.gadget.app
   - Cliquez "Data" > "shopifyShop"
   - Vérifiez que `stockEasyCompanyId` est rempli
   
2. **Vérifier Webhooks Shopify**
   - Shopify Admin > Settings > Notifications > Webhooks
   - Cherchez `orders/create`
   - Si absent, réinstallez l'app

3. **Créer une commande test**
   - Créez une commande dans Shopify
   - Attendez 30 secondes
   - Réexécutez la requête SQL

---

## 🟠 Problème #2 : Mappings produits = 0

### Cause
Les produits Shopify ne sont pas liés aux produits StockEasy.

### Solution
**Dans Gadget Console :**

```javascript
// Copier-coller dans Gadget > Console
const shops = await api.shopifyShop.findMany();
for (const shop of shops) {
  await api.enqueue(api.syncShopifyProducts, { 
    shopId: shop.id 
  });
  console.log('Sync lancée pour', shop.domain);
}
```

Attendez 2-5 minutes puis réexécutez la requête SQL.

---

## 🟡 Problème #3 : Produits avec ventes = 0 (mais ventes > 0)

### Cause
Les SKUs dans `sales_history` ne correspondent pas aux SKUs dans `produits`.

### Solution
**Vérifiez les SKUs orphelins :**

```sql
SELECT 
  sh.sku as sku_dans_sales,
  COUNT(*) as nb_ventes,
  CASE 
    WHEN p.sku IS NULL THEN '❌ Produit absent'
    ELSE '✅ OK'
  END as status
FROM sales_history sh
LEFT JOIN produits p ON sh.sku = p.sku AND sh.company_id = p.company_id
GROUP BY sh.sku, p.sku
ORDER BY nb_ventes DESC
LIMIT 20;
```

**Si des produits sont absents :**
- Créez-les manuellement dans StockEasy
- Ou corrigez les SKUs dans `product_mapping`

---

## ✅ Test Final : Tout fonctionne ?

```sql
-- Ce script affiche un verdict final
WITH stats AS (
  SELECT
    (SELECT COUNT(*) FROM sales_history) as ventes,
    (SELECT COUNT(*) FROM product_mapping) as mappings,
    (SELECT COUNT(*) FROM produits WHERE ventes_jour_moy_30j > 0) as avec_ventes
)
SELECT 
  CASE 
    WHEN ventes > 0 AND mappings > 0 AND avec_ventes > 0 
    THEN '✅ 🎉 TOUT FONCTIONNE !'
    ELSE '❌ Il reste des problèmes - voir guide détaillé'
  END as verdict,
  ventes,
  mappings,
  avec_ventes
FROM stats;
```

---

## 📊 Vérifier les données dans le Frontend

Si le test final est ✅, vérifiez dans StockEasy :

1. **Ouvrez StockEasy** (votre app React)
2. **Allez sur la page Produits**
3. **Vérifiez qu'un produit affiche** :
   - `salesPerDay` > 0
   - `sales30d` > 0
   - Des prédictions ML

---

## 🆘 Toujours pas de données ?

Exécutez le **diagnostic complet** :

1. Ouvrez : `docs/DIAGNOSTIC_FLUX_VENTES_SHOPIFY.md`
2. Suivez TOUTES les étapes
3. Exécutez : `scripts/sql/diagnostic_ventes_shopify.sql`

---

## 📞 Checklist Support

Si vous devez contacter le support, préparez :

- [ ] Résultat du "Test Rapide" (copier-coller)
- [ ] Screenshot de Gadget > Data > shopifyShop
- [ ] Screenshot de Shopify > Settings > Webhooks
- [ ] Résultat de la requête "SKUs orphelins"

---

**🕐 Temps estimé : 5-10 minutes**

**📅 Dernière mise à jour : 2025-01-28**



