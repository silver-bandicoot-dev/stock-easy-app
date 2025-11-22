# 🏗️ Spécifications Techniques Finales - StockEasy Shopify Connector

Ce document est la **source de vérité** pour le développement de l'intégration Shopify. Il consolide toutes les décisions architecturales de la Phase 1.

---

## 📋 Table des Matières

1. [Architecture Globale](#1-architecture-globale)
2. [Stratégie de Synchronisation](#2-stratégie-de-synchronisation)
3. [Intégration des Webhooks](#3-intégration-des-webhooks)
4. [Prévisions & Data Science](#4-prévisions--data-science)
5. [Déploiement & Sécurité](#5-déploiement--sécurité)

---

## 1. Architecture Globale

### 1.1 Concept
L'application est un **Middleware Backend** "Headless" (sans UI Shopify). Elle agit comme un pont intelligent entre les stores Shopify des marchands et le cœur de StockEasy (Supabase).

### 1.2 Stack Technique
*   **Runtime:** Node.js (LTS)
*   **Framework:** Express.js (léger, robuste pour les webhooks)
*   **Langage:** TypeScript (Strict mode)
*   **Base de Données:** PostgreSQL (via Prisma ORM)
    *   *Note:* Peut être hébergé sur le même projet Supabase dans un schéma dédié ou une instance séparée.
*   **Queue System:** BullMQ + Redis (pour gérer le rate limiting et les pics de charge)
*   **Shopify API:** `@shopify/shopify-api` (Admin GraphQL API)

### 1.3 Diagramme de Flux de Données

```ascii
┌────────────────┐        ┌──────────────────────────┐        ┌─────────────────┐
│  Shopify Store │        │  StockEasy Connector     │        │    StockEasy    │
│                │        │  (Node.js / Express)     │        │    (Supabase)   │
│  [Webhooks] ───┼───────►│  [Webhook Handlers]      │        │                 │
│  • Product     │        │           ▼              │        │                 │
│  • Order       │        │       [BullMQ]           │        │                 │
│  • Inventory   │        │           ▼              │        │                 │
│                │        │     [Sync Service] ──────┼───────►│ [API / RPC]     │
│  [GraphQL API] │◄───────┼─ [Shopify Service]       │        │                 │
│                │        │           ▲              │        │                 │
│                │        │           │              │        │                 │
└────────────────┘        │      [API REST]  ◄───────┼────────│ [Action]        │
                          └──────────────────────────┘        └─────────────────┘
```

### 1.4 Schéma de Base de Données (Prisma)

```prisma
// prisma/schema.prisma

model Shop {
  id          String   @id @default(uuid())
  domain      String   @unique // ex: "boutique.myshopify.com"
  accessToken String   // Stocké chiffré
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  products    ProductMapping[]
  logs        SyncLog[]
}

model ProductMapping {
  id               String   @id @default(uuid())
  shopId           String
  shopifyProductId String   // "gid://shopify/Product/123456"
  shopifyVariantId String   // "gid://shopify/ProductVariant/789012"
  stockEasySku     String   // SKU unique dans StockEasy
  lastSyncedAt     DateTime @default(now())
  
  shop             Shop     @relation(fields: [shopId], references: [id])

  @@unique([shopId, shopifyVariantId])
  @@index([stockEasySku])
}

model SyncLog {
  id        String   @id @default(uuid())
  shopId    String
  entity    String   // "PRODUCT", "ORDER", "INVENTORY"
  status    String   // "SUCCESS", "ERROR", "PENDING"
  message   String?
  payload   Json?    // Données contextuelles (optionnel, attention RGPD)
  createdAt DateTime @default(now())

  shop      Shop     @relation(fields: [shopId], references: [id])
}
```

---

## 2. Stratégie de Synchronisation

### 2.1 Mapping des Données (Produit)

Le SKU est la clé de voûte de la réconciliation.

| Champ Shopify (Variant) | Champ StockEasy (Product) | Règle de Transformation |
|-------------------------|---------------------------|-------------------------|
| `sku`                   | `sku`                     | **Clé primaire de mapping** |
| `inventoryQuantity`     | `stock`                   | Bidirectionnel (Source prioritaire selon contexte) |
| `price`                 | `sellPrice`               | Shopify -> StockEasy (Master: Shopify) |
| `inventoryItem.cost`    | `buyPrice`                | Shopify -> StockEasy (si dispo) |
| `product.title`         | `name`                    | Concaténation Titre Produit + Titre Variante |

### 2.2 Gestion des Conflits
*   **Règle d'Or:** "Last Write Wins" avec timestamps.
*   **Priorité Inventaire:** Si une commande Shopify arrive (`orders/create`), elle décrémente le stock. Cette info est prioritaire et écrasera le stock StockEasy temporairement jusqu'à réconciliation.
*   **Boucles Infinies:** Pour éviter qu'une mise à jour StockEasy -> Shopify ne redéclenche un webhook Shopify -> StockEasy, le connector vérifiera le timestamp `lastSyncedAt` et ignorera les webhooks qui surviennent < 2 secondes après une écriture par le connector lui-même.

---

## 3. Intégration des Webhooks

### 3.1 Webhooks Souscrits

Configuration dans `shopify.app.toml` :

1.  `products/create` & `products/update`
    *   Action: Créer/MAJ le produit dans StockEasy.
    *   Priorité: Basse.
2.  `inventory_levels/update`
    *   Action: MAJ du niveau de stock dans StockEasy.
    *   Priorité: Moyenne.
3.  `orders/create`
    *   Action: Décrémenter stock + Enregistrer vente pour les stats.
    *   Priorité: **Haute**.
4.  `app/uninstalled`
    *   Action: Désactiver le shop en DB, cleanup tokens.

### 3.2 Gestion de la Queue (BullMQ)

Chaque webhook reçu est immédiatement validé (HMAC) et poussé dans Redis. Un worker traite ensuite la tâche.

*   **Job Name:** `sync-inventory`, `sync-product`, `process-order`.
*   **Retry Strategy:** Backoff exponentiel (1s, 2s, 4s, 8s...) jusqu'à 5 tentatives.
*   **Rate Limiting:** Le worker respecte strictement le quota GraphQL (Cost bucket algorithm).

---

## 4. Prévisions & Data Science

### 4.1 Flux de Données pour l'IA
L'app Connector n'exécute pas de modèles ML. Elle se contente d'extraire et nettoyer les données de ventes historiques pour alimenter le `SmartForecastEngine` existant.

1.  **Initial Load:** À l'installation, fetch des commandes des 90 derniers jours.
2.  **Daily Sync:** Agrégation des ventes de la journée (J-1) envoyée à l'API StockEasy `/api/ingest-sales-data`.

### 4.2 Format des Données Transmises
```json
{
  "sku": "TSHIRT-BLUE-L",
  "date": "2025-01-27",
  "quantity_sold": 5,
  "revenue": 125.00,
  "source": "shopify"
}
```

---

## 5. Déploiement & Sécurité

### 5.1 Sécurité
*   **HMAC Validation:** Middleware obligatoire sur toutes les routes `/webhooks/*`.
*   **Token Encryption:** Les `accessToken` Shopify sont chiffrés en base (AES-256) via une clé privée `SHOPIFY_API_SECRET`.
*   **Internal API Auth:** Les appels de StockEasy vers le Connector sont sécurisés par une clé API interne (`STOCKEASY_INTERNAL_API_KEY`).

### 5.2 Environnements
*   **Production:** Hébergement Node.js (ex: Render, Railway, ou Vercel avec Serverless Functions si compatible avec les timeouts webhooks). Redis hébergé requis.
*   **Variables d'Env (.env):**
    ```bash
    SHOPIFY_API_KEY=...
    SHOPIFY_API_SECRET=...
    DATABASE_URL=...
    REDIS_URL=...
    STOCKEASY_API_URL=...
    STOCKEASY_INTERNAL_KEY=...
    ```

---

*Document généré par l'Assistant IA - Phase 1 terminée.*


