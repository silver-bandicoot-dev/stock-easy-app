# 📘 Guide Technique - StockEasy Shopify Connector

Ce document détaille l'architecture technique, les services internes et le fonctionnement du connecteur Shopify pour les développeurs.

---

## 1. Architecture Globale

Le connecteur est une application **Node.js / Express** "Headless" (sans interface utilisateur) conçue pour synchroniser les données entre Shopify et StockEasy (Supabase) de manière asynchrone et robuste.

### Diagramme de Flux

```ascii
[Shopify Store]  ---(Webhook TLS 1.2)--->  [Connector Express API]
                                                  |
                                           (HMAC Validation)
                                                  |
                                                  v
                                           [Redis / BullMQ]
                                                  |
                                           (Async Worker)
                                                  |
                                                  v
                                        [StockEasy Supabase DB]
```

### Technologies Clés

*   **Runtime**: Node.js 18+ (LTS)
*   **Serveur**: Express.js avec middlewares de sécurité (Helmet, CORS)
*   **Queue**: BullMQ sur Redis (Gestion de la concurrence et des retries)
*   **ORM**: Prisma (Gestion des mappings et logs locaux)
*   **DB Locale**: PostgreSQL (Stockage des tokens et mappings)
*   **DB Distante**: Supabase (Client direct via `@supabase/supabase-js`)

---

## 2. Structure du Projet

```bash
shopify-connector/
├── prisma/
│   └── schema.prisma       # Définition des modèles locaux (Shop, ProductMapping)
├── src/
│   ├── config/             # Configuration centralisée (env vars)
│   ├── routes/             # Définition des routes Express
│   │   └── webhooks.ts     # Routeur des webhooks Shopify
│   ├── services/           # Logique métier
│   │   ├── mapping.service.ts   # Gestion des correspondances ID <-> SKU
│   │   ├── shopify.service.ts   # Client GraphQL Shopify
│   │   └── stockeasy.service.ts # Client Supabase
│   ├── utils/              # Utilitaires (Logger, DB Client)
│   ├── index.ts            # Point d'entrée serveur API
│   └── worker.ts           # Worker BullMQ (Traitement asynchrone)
└── tests/                  # Tests unitaires et d'intégration
```

---

## 3. Services & Composants

### 3.1. Webhook Router (`src/routes/webhooks.ts`)
*   Point d'entrée unique pour tous les webhooks Shopify (`POST /webhooks/:topic`).
*   **Middleware Critique**: Validation HMAC. Vérifie que la requête provient bien de Shopify en utilisant le `SHOPIFY_API_SECRET`.
*   **Action**: Ne traite pas la donnée, pousse simplement le job dans la queue Redis pour répondre rapidement (200 OK) à Shopify.

### 3.2. Worker (`src/worker.ts`)
*   Consomme les jobs de la queue `shopify-sync`.
*   **Concurrence**: 5 jobs simultanés.
*   **Rate Limit**: Configuré pour respecter approximativement les limites de l'API Shopify.
*   **Logique**:
    1.  Récupère le `shop` domain du job.
    2.  Cherche le `companyId` StockEasy associé en base locale.
    3.  Dispatche vers le handler spécifique (Product, Order, Inventory).

### 3.3. StockEasy Service (`src/services/stockeasy.service.ts`)
*   Utilise le client Supabase officiel.
*   **Auth**: Utilise la `SERVICE_ROLE_KEY` pour contourner les RLS et écrire directement dans les tables `produits` et `sales_history`.
*   **Méthodes**:
    *   `syncProductFromShopify`: Upsert dans la table `produits`.
    *   `processOrder`: Insert dans `sales_history`.

### 3.4. Mapping Service (`src/services/mapping.service.ts`)
*   Gère la table de correspondance `ProductMapping` via Prisma.
*   Essentiel pour faire le lien entre `gid://shopify/ProductVariant/123` et le SKU StockEasy.

---

## 4. Base de Données (Schéma Prisma)

Le connecteur possède sa propre base de données (ou un schéma dédié) pour gérer son état interne.

*   **Shop**: Stocke les domaines Shopify, les tokens d'accès (chiffrés), et le lien vers le `company_id` StockEasy.
*   **ProductMapping**: Table de liaison `ShopifyVariantID` <-> `StockEasySKU`.
*   **SyncLog**: Historique des opérations de synchronisation pour le débogage.

---

## 5. Déploiement

### Variables d'Environnement Requises

```bash
# Serveur
PORT=3000
NODE_ENV=production

# Shopify App
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_SCOPES=read_products,read_orders,read_inventory

# Base de données & Redis
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Connexion StockEasy
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Procédure de Mise en Production

1.  **Build**: `npm run build` (Compile TypeScript vers `dist/`).
2.  **Migrations**: `npx prisma migrate deploy` (Applique le schéma DB).
3.  **Start**: `npm start`.

**Note**: Il est recommandé d'utiliser un gestionnaire de processus comme PM2 ou un conteneur Docker pour gérer le processus Node.js.


