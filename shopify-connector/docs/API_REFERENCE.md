# 🔌 API Reference - StockEasy Shopify Connector

Cette documentation décrit les interfaces internes et les flux de données du connecteur.

---

## 1. Webhooks Endpoints

Le connecteur expose un endpoint unique pour recevoir les notifications de Shopify.

### `POST /webhooks/:topic`

Reçoit et traite les webhooks Shopify.

*   **URL**: `/webhooks/*` (ex: `/webhooks/products/create`)
*   **Method**: `POST`
*   **Headers Requis**:
    *   `X-Shopify-Hmac-Sha256`: Signature HMAC pour la validation.
    *   `X-Shopify-Topic`: Le sujet du webhook (ex: `products/create`).
    *   `X-Shopify-Shop-Domain`: Le domaine de la boutique (ex: `shop.myshopify.com`).
*   **Body**: JSON payload brut de Shopify.

#### Réponses
*   `200 OK`: Webhook reçu et mis en file d'attente avec succès.
*   `401 Unauthorized`: Signature HMAC invalide ou headers manquants.
*   `500 Internal Server Error`: Erreur interne lors de l'ajout à la queue.

---

## 2. Flux de Données (Data Flow)

### 2.1. Produit (Product Sync)

**Source**: Shopify `products/create` ou `products/update`

```typescript
// Payload Shopify (Simplifié)
{
  "id": 123456,
  "title": "T-Shirt Blue",
  "variants": [
    {
      "id": 987654,
      "sku": "TSHIRT-BLUE-L",
      "price": "25.00",
      "inventory_quantity": 100
    }
  ]
}

// Transformation -> Supabase `produits`
{
  "company_id": "uuid-company-123",
  "sku": "TSHIRT-BLUE-L",
  "nom": "T-Shirt Blue - Large",
  "prix_vente": 25.00,
  "stock_actuel": 100
}
```

### 2.2. Commande (Order Sync)

**Source**: Shopify `orders/create`

```typescript
// Payload Shopify (Simplifié)
{
  "id": 555555,
  "total_price": "50.00",
  "line_items": [
    {
      "sku": "TSHIRT-BLUE-L",
      "quantity": 2,
      "price": "25.00"
    }
  ]
}

// Transformation -> Supabase `sales_history`
[
  {
    "company_id": "uuid-company-123",
    "sku": "TSHIRT-BLUE-L",
    "sale_date": "2025-01-27",
    "quantity": 2,
    "revenue": 50.00,
    "source": "shopify",
    "metadata": { "shopify_order_id": 555555 }
  }
]
```

---

## 3. Modèles de Données Internes (Prisma)

### Shop
| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | ID interne du connecteur |
| `domain` | String | Domaine Shopify (Unique) |
| `accessToken` | String | Token d'accès API (Chiffré) |
| `stockEasyCompanyId` | UUID | Lien vers l'entreprise Supabase |

### ProductMapping
| Champ | Type | Description |
|-------|------|-------------|
| `shopId` | UUID | Référence au Shop |
| `shopifyVariantId` | String | ID Variante Shopify |
| `stockEasySku` | String | SKU StockEasy |

---

## 4. Codes d'Erreur Communs

Le worker BullMQ loggue les erreurs suivantes :

*   `SHOP_NOT_FOUND`: Le domaine Shopify du webhook n'est pas enregistré en base.
*   `COMPANY_NOT_LINKED`: Le shop existe mais n'a pas de `stockEasyCompanyId`.
*   `SKU_MISSING`: Une variante produit Shopify n'a pas de SKU.
*   `SUPABASE_ERROR`: Erreur lors de l'écriture dans Supabase (souvent contrainte d'unicité ou connexion).


