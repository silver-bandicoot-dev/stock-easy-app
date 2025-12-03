# 🔧 Guide de débogage : Synchronisation Stockeasy → Shopify

Ce guide aide à identifier et résoudre les problèmes de synchronisation de stock entre Stockeasy et Shopify.

## 📋 Architecture du flux

```
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   Frontend React    │         │   Gadget Backend    │         │     Shopify API     │
│   (Vercel/Local)    │ ──────► │ (stockeasy-app)     │ ──────► │                     │
│                     │         │                     │         │                     │
│ - InventoryTab.jsx  │         │ - POST-update-      │         │ - inventorySet      │
│ - gadgetService.js  │         │   shopify-inventory │         │   OnHandQuantities  │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│     Supabase        │         │   productMapping    │         │  InventoryItem      │
│     (stocks)        │         │   (SKU ↔ Shopify)   │         │  + Location         │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
```

## 🔍 Checklist de diagnostic

### 1. Variables d'environnement Frontend

Vérifiez dans `.env.local` :

```bash
# Pour tests locaux avec Development
VITE_GADGET_API_URL=https://stockeasy-app--development.gadget.app
VITE_GADGET_INTERNAL_API_KEY=<votre_cle_sans_chevrons>

# Pour production
VITE_GADGET_API_URL=https://stockeasy-app.gadget.app
VITE_GADGET_INTERNAL_API_KEY=<votre_cle_sans_chevrons>
```

### 2. Variables d'environnement Gadget

Dans **Gadget Dashboard > Settings > Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `STOCKEASY_INTERNAL_API_KEY` | Doit correspondre à `VITE_GADGET_INTERNAL_API_KEY` |

### 3. Configuration shopifyShop

Dans **Gadget Dashboard > Data > shopifyShop** :

| Champ | Valeur attendue |
|-------|-----------------|
| `stockEasyCompanyId` | UUID de la company de l'utilisateur |
| `defaultLocationId` | ID numérique de l'emplacement Shopify (ex: `12345678`) |
| `domain` | Domaine du shop (ex: `mon-shop.myshopify.com`) |

⚠️ **IMPORTANT** : `defaultLocationId` doit être l'ID **numérique** (sans préfixe GID).

Pour trouver le Location ID dans Shopify :
1. Allez dans **Shopify Admin > Settings > Locations**
2. Cliquez sur un emplacement
3. L'URL contient l'ID : `.../locations/12345678`

### 4. Configuration productMapping

Dans **Gadget Dashboard > Data > productMapping** :

| Champ | Valeur attendue |
|-------|-----------------|
| `shopId` | Référence au shop Gadget |
| `stockEasySku` | SKU exact dans Stockeasy (sensible à la casse) |
| `shopifyInventoryItemId` | ID numérique de l'InventoryItem Shopify |
| `shopifyVariantId` | ID numérique du Variant Shopify |
| `shopifyProductId` | ID numérique du Product Shopify |

⚠️ **IMPORTANT** : Les IDs doivent être **numériques** (sans préfixe GID).

### 5. Scopes de l'app Shopify

Vérifiez dans **shopify.app.toml** :

```toml
[access_scopes]
scopes = "write_inventory,read_inventory,..."
```

Les scopes requis sont :
- `read_inventory` - Lecture des niveaux de stock
- `write_inventory` - Modification des niveaux de stock

### 6. ⚠️ Inventory Item activé à la location

**CRITIQUE** : L'inventory item doit être **activé** à la location avant de pouvoir modifier ses quantités !

Vérifiez dans Shopify Admin :
1. Allez dans **Products > [Produit] > Variants**
2. Cliquez sur la variante
3. Section **Inventory** → Vérifiez que la location est bien listée
4. Si la location n'apparaît pas → L'item n'est pas stocké là

**Pour activer via GraphQL** :
```graphql
mutation inventoryActivate($inventoryItemId: ID!, $locationId: ID!) {
  inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId) {
    inventoryLevel {
      id
    }
    userErrors {
      field
      message
    }
  }
}
```

### 6. Produit tracké dans Shopify

Un produit doit avoir le suivi d'inventaire activé :

1. Allez dans **Shopify Admin > Products > [Produit]**
2. Cliquez sur la variante
3. Section "Inventory" → Cochez **"Track quantity"**
4. Sélectionnez **"Shopify"** comme gestionnaire d'inventaire

## 🧪 Tests manuels

### Test avec script automatique

```bash
cd stock-easy-app/scripts
chmod +x test-shopify-sync.sh
./test-shopify-sync.sh development sku-managed-1 100
```

### Test avec curl (OPTIONS)

```bash
curl -s -X OPTIONS "https://stockeasy-app--development.gadget.app/update-shopify-inventory" \
  -H "Origin: http://localhost:5174" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -D /dev/stdout
```

**Réponse attendue** : HTTP 204 avec headers CORS

### Test avec curl (POST)

```bash
curl -s -X POST "https://stockeasy-app--development.gadget.app/update-shopify-inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_API_KEY" \
  -H "Origin: http://localhost:5174" \
  -d '{
    "company_id": "8307b1da-639d-4ec5-a845-a47a8ca387ba",
    "updates": [
      {
        "sku": "sku-managed-1",
        "stock_actuel": 100
      }
    ]
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "processed": 1,
  "errors": 0,
  "skipped": 0
}
```

## 📊 Analyse des logs Gadget

### Accès aux logs

1. **Gadget Dashboard** > **Logs**
2. Sélectionnez l'environnement (Development/Production)
3. Filtrez par `update-shopify-inventory`

### Messages de log à rechercher

| Emoji | Signification |
|-------|---------------|
| 🔍 | Recherche en cours |
| 📦 | Résultat de requête |
| 🏪 | Shop trouvé |
| 📍 | Location utilisée |
| 🔗 | Connexion Shopify |
| 📤 | Envoi mutation GraphQL |
| 📥 | Réponse mutation |
| ✅ | Succès |
| ⚠️ | Avertissement |
| ❌ | Erreur |

### Exemples de problèmes courants

#### Shop non trouvé
```
🔍 Searching for shop with company_id
📦 Shop query result: null
```
**Solution** : Vérifiez `stockEasyCompanyId` dans shopifyShop

#### Mapping non trouvé
```
🔍 Searching for product mapping
📦 Product mapping result: null
```
**Solution** : Créez un productMapping pour ce SKU

#### Location ID manquant
```
❌ No default location configured for shop
```
**Solution** : Configurez `defaultLocationId` dans shopifyShop

#### Erreur GraphQL Shopify
```
❌ Shopify mutation returned userErrors
[{ field: "inventoryItemId", message: "Inventory item not found" }]
```
**Solution** : Vérifiez que `shopifyInventoryItemId` est correct

## 🔄 Mécanisme anti-boucle

Le système utilise `lastSyncDirection` et `lastSyncedAt` sur `productMapping` pour éviter les boucles infinies :

1. **Avant** d'envoyer à Shopify :
   ```javascript
   await updateSyncMetadata(api, mapping.id, SyncDirection.SUPABASE_TO_SHOPIFY);
   ```

2. **Quand** le webhook Shopify arrive :
   ```javascript
   if (lastSyncDirection === 'supabase_to_shopify' && timeSince < 30s) {
     // SKIP - C'est notre propre mise à jour qui revient
   }
   ```

## 🐛 Problèmes fréquents et solutions

### 1. "success: true" mais stock non mis à jour dans Shopify

**Causes possibles** :
- `inventoryAdjustmentGroup` est null = le stock était déjà à cette valeur
- Le produit n'a pas le suivi d'inventaire activé
- L'emplacement (location) n'est pas assigné au produit

**Vérification** :
1. Consultez les logs Gadget détaillés
2. Vérifiez le `syncLog` créé pour cette opération
3. Testez avec une valeur de stock différente

### 2. Erreur 401 Unauthorized

**Causes possibles** :
- Clé API incorrecte ou manquante
- Variable `STOCKEASY_INTERNAL_API_KEY` non configurée dans Gadget

**Solution** :
1. Vérifiez que `.env.local` et Gadget ont la même clé
2. Redéployez Gadget après modification des variables

### 3. Erreur 404 Shop not found

**Causes possibles** :
- `stockEasyCompanyId` non configuré dans shopifyShop
- UUID company_id incorrect

**Solution** :
1. Vérifiez le `company_id` dans user_profiles (Supabase)
2. Configurez `stockEasyCompanyId` dans Gadget

### 4. SKU skipped (ignoré)

**Causes possibles** :
- Pas de `productMapping` pour ce SKU
- SKU avec différence de casse
- `shopifyInventoryItemId` manquant

**Solution** :
1. Vérifiez le mapping exact du SKU
2. Attention à la casse (majuscules/minuscules)

### 5. Double préfixe GID

**Symptôme** :
```
inventoryItemId: "gid://shopify/InventoryItem/gid://shopify/InventoryItem/123"
```

**Cause** : Le code ajoutait le préfixe même si déjà présent

**Solution** : Le code a été corrigé pour normaliser les IDs automatiquement.

## 📚 Ressources

- [Documentation Gadget - Connections](https://docs.gadget.dev/guides/connections)
- [Shopify Admin API - inventorySetOnHandQuantities](https://shopify.dev/docs/api/admin-graphql/2024-01/mutations/inventorySetOnHandQuantities)
- [Shopify - Inventory Management](https://help.shopify.com/en/manual/products/inventory)

## 🆘 Support

Si le problème persiste après ces vérifications :

1. Exportez les logs Gadget (dernières 24h)
2. Notez le company_id et le SKU testés
3. Capturez la réponse API complète
4. Contactez le support avec ces informations

