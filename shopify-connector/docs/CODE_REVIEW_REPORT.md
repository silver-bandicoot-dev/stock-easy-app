# 📋 Rapport de Code Review - Shopify Connector

**Date:** 22 Novembre 2025  
**Modèle:** Claude 3.5 Sonnet  
**Version du code:** v1.0.0  

---

## 🔐 1. REVIEW DE SÉCURITÉ ET VULNÉRABILITÉS

### 🚨 PROBLÈMES CRITIQUES (Critical)

#### 1.1 Stockage en clair de l'Access Token
**Fichier:** `prisma/schema.prisma` (ligne 15)  
**Criticité:** 🔴 CRITICAL  

```prisma
accessToken        String   // Stocké chiffré
```

**Problème:** Le commentaire indique "Stocké chiffré" mais aucun chiffrement n'est implémenté dans le code. L'access token est stocké en clair dans la base de données.

**Impact:** Compromission totale des boutiques Shopify si la base de données est compromise.

**Solution:**
```typescript
// Ajouter dans utils/crypto.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

#### 1.2 Service Role Key exposée dans le code
**Fichier:** `services/stockeasy.service.ts` (ligne 20-24)  
**Criticité:** 🔴 CRITICAL  

**Problème:** Utilisation de la Service Role Key de Supabase qui contourne toutes les politiques RLS. Si ce service est compromis, l'attaquant a un accès complet à toute la base de données StockEasy.

**Recommandation:**
1. Utiliser un compte de service avec des permissions limitées
2. Implémenter des RLS policies qui s'appliquent même au service role
3. Créer une API intermédiaire avec authentification

```typescript
// Solution: Utiliser une API key custom avec scopes limités
export class StockEasyService {
  private supabase: SupabaseClient;

  constructor() {
    // Option 1: API Key avec scopes limités (à implémenter côté StockEasy)
    this.supabase = createClient(
      config.stockEasy.supabaseUrl,
      config.stockEasy.limitedApiKey, // Nouveau: key avec permissions product:write uniquement
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        headers: {
          'x-service-name': 'shopify-connector',
          'x-api-version': '1.0'
        }
      }
    );
  }
}
```

---

#### 1.3 Absence de validation HMAC dans certains cas
**Fichier:** `routes/webhooks.ts` (ligne 23-26)  
**Criticité:** 🟠 HIGH  

**Problème:** Si les headers sont manquants, on renvoie 401, mais on ne vérifie pas si le domaine du shop est autorisé.

**Solution:**
```typescript
const validateWebhook = async (req: Request, res: Response, next: Function) => {
  try {
    const hmac = req.header('x-shopify-hmac-sha256');
    const topic = req.header('x-shopify-topic');
    const shop = req.header('x-shopify-shop-domain');

    if (!hmac || !topic || !shop) {
      logger.warn('Missing webhook headers', { 
        ip: req.ip, 
        headers: req.headers 
      });
      return res.status(401).send('Missing headers');
    }

    // NOUVEAU: Vérifier que le shop existe et est actif
    const shopEntity = await prisma.shop.findUnique({
      where: { domain: shop },
      select: { isActive: true }
    });

    if (!shopEntity || !shopEntity.isActive) {
      logger.warn(`Webhook from unknown or inactive shop: ${shop}`);
      return res.status(403).send('Unauthorized shop');
    }

    // Validation HMAC
    const isValid = await shopify.webhooks.validate({
      rawBody: (req.body as Buffer).toString(),
      rawRequest: req,
    });

    if (!isValid.valid) {
      logger.warn(`Invalid HMAC for shop ${shop}`, {
        topic,
        ip: req.ip
      });
      return res.status(401).send('Invalid HMAC');
    }

    (req as any).webhookContext = { topic, shop };
    next();
  } catch (error) {
    logger.error('Webhook validation error', error);
    res.status(500).send('Internal Server Error');
  }
};
```

---

### ⚠️ PROBLÈMES DE SÉCURITÉ (High)

#### 1.4 Injection SQL via SKU
**Fichier:** `services/stockeasy.service.ts` (ligne 69-72)  
**Criticité:** 🟠 HIGH  

**Problème:** Bien que Supabase utilise des requêtes paramétrées, il n'y a aucune validation du format du SKU.

**Solution:**
```typescript
// utils/validators.ts
export function validateSku(sku: string): boolean {
  // SKU doit être alphanumerique avec - et _
  const skuRegex = /^[A-Za-z0-9_-]{1,50}$/;
  if (!skuRegex.test(sku)) {
    throw new Error(`Invalid SKU format: ${sku}`);
  }
  return true;
}

// Dans stockeasy.service.ts
async updateInventory(companyId: string, sku: string, quantity: number) {
  validateSku(sku); // NOUVEAU
  validateUuid(companyId); // NOUVEAU
  
  if (quantity < 0 || quantity > 1000000) {
    throw new Error(`Invalid quantity: ${quantity}`);
  }
  
  logger.info(`Updating inventory for ${sku} in StockEasy: ${quantity}`);
  
  const { data, error } = await this.supabase
    .from('produits')
    .update({ stock_actuel: quantity })
    .eq('sku', sku)
    .eq('company_id', companyId)
    .select();

  if (error) {
    logger.error('Error updating inventory in Supabase', error);
    throw error;
  }

  return data;
}
```

---

#### 1.5 Exposition de secrets dans les logs
**Fichier:** `utils/logger.ts` (ligne 2-15)  
**Criticité:** 🟠 HIGH  

**Problème:** Les métadonnées sont loggées avec `JSON.stringify(meta)` sans filtrage. Risque d'exposer des tokens, passwords, etc.

**Solution:**
```typescript
// utils/logger.ts
const SENSITIVE_FIELDS = [
  'password', 'token', 'accessToken', 'apiKey', 'secret', 
  'authorization', 'x-shopify-access-token', 'hmac'
];

function sanitizeMeta(meta: any): any {
  if (!meta || typeof meta !== 'object') return meta;
  
  const sanitized = { ...meta };
  
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeMeta(sanitized[key]);
    }
  }
  
  return sanitized;
}

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(
      `[INFO] ${new Date().toISOString()} - ${message}`, 
      meta ? JSON.stringify(sanitizeMeta(meta)) : ''
    );
  },
  error: (message: string, error?: any) => {
    const sanitizedError = error ? {
      message: error.message,
      stack: error.stack,
      ...(error.response ? { 
        status: error.response.status,
        // Ne pas logger response.data qui peut contenir des secrets
      } : {})
    } : undefined;
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`, 
      sanitizedError
    );
  },
  // ... autres méthodes
};
```

---

#### 1.6 Pas de rate limiting applicatif
**Fichier:** `index.ts`  
**Criticité:** 🟠 HIGH  

**Problème:** Aucun rate limiting n'est implémenté côté application. Un attaquant pourrait spammer les endpoints.

**Solution:**
```typescript
// npm install express-rate-limit
import rateLimit from 'express-rate-limit';

// Limiter les webhooks par shop
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Max 100 webhooks par minute par IP
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Limiter par shop domain si disponible
    return req.header('x-shopify-shop-domain') || req.ip;
  }
});

app.use('/webhooks', webhookLimiter, express.raw({ type: 'application/json' }), webhookRouter);
```

---

### 🔶 PROBLÈMES MOYENS (Medium)

#### 1.7 Pas de timeout sur les requêtes HTTP
**Fichiers:** `services/shopify.service.ts`, `services/stockeasy.service.ts`  
**Criticité:** 🟡 MEDIUM  

**Solution:**
```typescript
// Dans shopify.service.ts
const shopify = shopifyApi({
  apiKey: config.shopify.apiKey,
  apiSecretKey: config.shopify.apiSecret,
  scopes: config.shopify.scopes,
  hostName: config.shopify.host.replace(/^https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
  // NOUVEAU
  apiTimeout: 10000, // 10 secondes
});

// Pour Supabase
this.supabase = createClient(
  config.stockEasy.supabaseUrl,
  config.stockEasy.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    // NOUVEAU
    global: {
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // 10 secondes
        });
      }
    }
  }
);
```

---

### 🔷 PROBLÈMES MINEURS (Low)

#### 1.8 Pas de CSP headers
**Fichier:** `index.ts`  
**Criticité:** 🟢 LOW  

**Solution:**
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 📊 2. REVIEW DE PERFORMANCE ET OPTIMISATION

### 🚀 PROBLÈMES CRITIQUES DE PERFORMANCE

#### 2.1 Requête N+1 dans handleProductSync
**Fichier:** `worker.ts` (ligne 81-105)  
**Impact:** 🔴 HIGH  
**Effort:** 🟢 LOW  

**Problème:** Pour chaque variante, on fait 2 requêtes séparées (mapping + supabase). Si un produit a 10 variantes, cela fait 20 requêtes.

**Solution:** Utiliser des transactions et du batching

```typescript
async function handleProductSync(shopDomain: string, companyId: string, payload: any) {
  const mappings = [];
  const productsToSync = [];
  
  // 1. Préparer toutes les données
  for (const variant of payload.variants) {
    const sku = variant.sku;
    if (!sku) {
      logger.warn(`Skipping variant ${variant.id} without SKU`);
      continue;
    }
    
    mappings.push({
      shopDomain,
      shopifyProductId: payload.id.toString(),
      shopifyVariantId: variant.id.toString(),
      stockEasySku: sku
    });
    
    productsToSync.push({
      sku: sku,
      company_id: companyId,
      nom: `${payload.title} - ${variant.title}`,
      prix_vente: parseFloat(variant.price),
      stock_actuel: variant.inventory_quantity
    });
  }
  
  // 2. Batch insert des mappings (Prisma)
  await prisma.$transaction(
    mappings.map(m => 
      prisma.productMapping.upsert({
        where: {
          shopId_shopifyVariantId: {
            shopId: m.shopDomain,
            shopifyVariantId: m.shopifyVariantId,
          },
        },
        update: {
          shopifyProductId: m.shopifyProductId,
          stockEasySku: m.stockEasySku,
          lastSyncedAt: new Date(),
        },
        create: {
          shopId: m.shopDomain,
          shopifyProductId: m.shopifyProductId,
          shopifyVariantId: m.shopifyVariantId,
          stockEasySku: m.stockEasySku,
        },
      })
    )
  );
  
  // 3. Batch insert dans Supabase (1 seule requête)
  const { data, error } = await stockEasyService.supabase
    .from('produits')
    .upsert(productsToSync, { onConflict: 'sku,company_id' })
    .select();
  
  if (error) {
    logger.error('Error batch syncing products to Supabase', error);
    throw error;
  }
  
  logger.info(`Synced ${productsToSync.length} variants in batch`);
}
```

**Gain estimé:** 90% de réduction des requêtes DB (20 → 2)

---

#### 2.2 Absence de cache pour les shops
**Fichier:** `worker.ts` (ligne 19-26)  
**Impact:** 🔴 HIGH  
**Effort:** 🟡 MEDIUM  

**Problème:** À chaque job, on requête la DB pour récupérer le shop. Si on traite 1000 webhooks/min, c'est 1000 requêtes inutiles.

**Solution:** Implémenter un cache Redis

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(config.redis.url);
const SHOP_CACHE_TTL = 300; // 5 minutes

async function getShopWithCache(shopDomain: string) {
  // 1. Essayer le cache
  const cached = await redis.get(`shop:${shopDomain}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 2. Requête DB
  const shopEntity = await prisma.shop.findUnique({
    where: { domain: shopDomain }
  });
  
  if (shopEntity) {
    // 3. Mettre en cache
    await redis.setex(
      `shop:${shopDomain}`, 
      SHOP_CACHE_TTL, 
      JSON.stringify(shopEntity)
    );
  }
  
  return shopEntity;
}

// Dans le worker
const shopEntity = await getShopWithCache(shop);
```

**Gain estimé:** 95% de réduction des requêtes DB pour les shops

---

#### 2.3 Absence de pagination dans getProduct
**Fichier:** `services/shopify.service.ts` (ligne 85)  
**Impact:** 🟡 MEDIUM  
**Effort:** 🟢 LOW  

**Problème:** `variants(first: 10)` est hardcodé. Si un produit a 50 variantes, on en manque 40.

**Solution:**
```typescript
async getProduct(session: Session, productId: string) {
  const client = new shopify.clients.Graphql({ session });
  
  let hasNextPage = true;
  let cursor: string | null = null;
  let allVariants: any[] = [];
  
  while (hasNextPage) {
    const query = `
      query getProduct($id: ID!, $cursor: String) {
        product(id: $id) {
          id
          title
          handle
          variants(first: 50, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                sku
                price
                inventoryQuantity
                inventoryItem {
                  id
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.query({
      data: {
        query,
        variables: { id: productId, cursor },
      },
    });
    
    const variants = response.body.data.product.variants;
    allVariants.push(...variants.edges.map((e: any) => e.node));
    
    hasNextPage = variants.pageInfo.hasNextPage;
    cursor = variants.pageInfo.endCursor;
  }
  
  return {
    ...response.body.data.product,
    variants: allVariants
  };
}
```

---

### 🔧 OPTIMISATIONS RECOMMANDÉES

#### 2.4 Utiliser les Bulk Operations de Shopify
**Impact:** 🟠 HIGH  
**Effort:** 🟠 MEDIUM  

Pour les synchronisations initiales ou les grosses mises à jour, utiliser les Bulk Operations:

```typescript
// services/shopify.service.ts
async bulkFetchProducts(session: Session) {
  const client = new shopify.clients.Graphql({ session });
  
  // 1. Lancer la bulk operation
  const mutation = `
    mutation {
      bulkOperationRunQuery(
        query: """
        {
          products {
            edges {
              node {
                id
                title
                variants {
                  edges {
                    node {
                      id
                      sku
                      inventoryQuantity
                    }
                  }
                }
              }
            }
          }
        }
        """
      ) {
        bulkOperation {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const response = await client.query({ data: { query: mutation } });
  const operationId = response.body.data.bulkOperationRunQuery.bulkOperation.id;
  
  // 2. Poller le statut
  // 3. Télécharger le JSONL
  // 4. Parser et importer
  
  return operationId;
}
```

---

#### 2.5 Index manquants dans Prisma
**Fichier:** `prisma/schema.prisma`  
**Impact:** 🟡 MEDIUM  
**Effort:** 🟢 LOW  

```prisma
model Shop {
  id                 String   @id @default(uuid())
  domain             String   @unique
  accessToken        String
  stockEasyCompanyId String?
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  products           ProductMapping[]
  logs               SyncLog[]
  
  // NOUVEAU: Index pour les queries fréquentes
  @@index([isActive])
  @@index([stockEasyCompanyId])
}

model SyncLog {
  id        String   @id @default(uuid())
  shopId    String
  entity    String
  status    String
  message   String?
  payload   Json?
  createdAt DateTime @default(now())

  shop      Shop     @relation(fields: [shopId], references: [id])
  
  // NOUVEAU: Index pour les queries de monitoring
  @@index([shopId, createdAt])
  @@index([status, createdAt])
  @@index([entity, status])
}
```

---

#### 2.6 Connection pooling pour Supabase
**Fichier:** `services/stockeasy.service.ts`  
**Impact:** 🟡 MEDIUM  
**Effort:** 🟢 LOW  

```typescript
// Utiliser un singleton avec pooling
class StockEasyService {
  private static instance: StockEasyService;
  private supabase: SupabaseClient;

  private constructor() {
    this.supabase = createClient(
      config.stockEasy.supabaseUrl,
      config.stockEasy.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        // Connection pooling géré par Supabase
        // Mais on peut ajouter un retry logic
        global: {
          fetch: createRetryFetch({
            maxRetries: 3,
            backoff: 'exponential'
          })
        }
      }
    );
  }

  static getInstance(): StockEasyService {
    if (!StockEasyService.instance) {
      StockEasyService.instance = new StockEasyService();
    }
    return StockEasyService.instance;
  }
}

// Usage
const stockEasyService = StockEasyService.getInstance();
```

---

## 🏗️ 3. REVIEW DE QUALITÉ DE CODE ET BEST PRACTICES

### 📐 ARCHITECTURE ET STRUCTURE

#### 3.1 Séparation des responsabilités
**Notation:** ✅ BIEN  

Le code suit bien le principe SRP:
- `services/` : Logique métier
- `routes/` : Définition des endpoints
- `worker.ts` : Traitement asynchrone
- `utils/` : Utilitaires transverses

**Amélioration suggérée:**
Créer un dossier `controllers/` pour séparer la logique de routage de la logique métier:

```typescript
// controllers/webhook.controller.ts
export class WebhookController {
  constructor(
    private syncQueue: Queue,
    private shopService: ShopService
  ) {}
  
  async handleWebhook(req: Request, res: Response) {
    const { topic, shop } = (req as any).webhookContext;
    const payload = JSON.parse((req.body as Buffer).toString());

    logger.info(`Received webhook ${topic} for shop ${shop}`);

    try {
      await this.syncQueue.add(topic, {
        shop,
        topic,
        payload,
        receivedAt: new Date().toISOString()
      }, {
        priority: topic === 'orders/create' ? 1 : 10,
        removeOnComplete: true,
        removeOnFail: 100
      });

      res.status(200).send('Webhook received');
    } catch (error) {
      logger.error(`Error adding job to queue for ${topic}`, error);
      res.status(500).send('Error processing webhook');
    }
  }
}

// routes/webhooks.ts (simplifié)
const controller = new WebhookController(syncQueue, shopService);
router.post('/:topic(*)', validateWebhook, controller.handleWebhook.bind(controller));
```

---

#### 3.2 Nommage des variables
**Notation:** ⚠️ À AMÉLIORER  

Plusieurs problèmes:
- `stockeasy.service.ts` (ligne 37): `companyId` devrait être `stockEasyCompanyId` pour clarté
- `worker.ts` (ligne 92): `shopDomain` vs `shop` utilisés de manière inconsistante
- `mapping.service.ts` (ligne 61): `getShopifyIdFromSku` retourne un `shopifyVariantId`, pas un `shopifyProductId`

**Corrections:**
```typescript
// mapping.service.ts
async getShopifyVariantIdFromSku(shopId: string, sku: string): Promise<string | null> {
  const mapping = await prisma.productMapping.findFirst({
    where: {
      shopId,
      stockEasySku: sku,
    },
  });
  return mapping ? mapping.shopifyVariantId : null;
}
```

---

### 🐛 GESTION D'ERREURS

#### 3.3 Try-catch manquants
**Fichier:** `worker.ts` (ligne 81-130)  
**Criticité:** 🟠 HIGH  

**Problème:** Les fonctions `handleProductSync`, `handleInventorySync`, `handleOrderSync` n'ont pas de try-catch. Si une erreur se produit, le job échoue brutalement.

**Solution:**
```typescript
async function handleProductSync(shopDomain: string, companyId: string, payload: any) {
  try {
    logger.info(`Starting product sync for ${payload.id}`);
    
    // Code existant...
    
    logger.info(`Successfully synced product ${payload.id}`);
  } catch (error) {
    logger.error(`Failed to sync product ${payload.id}`, {
      error: error.message,
      stack: error.stack,
      shopDomain,
      companyId,
      productId: payload.id
    });
    
    // Enregistrer l'échec dans SyncLog
    await prisma.syncLog.create({
      data: {
        shopId: shopDomain, // Devrait être l'ID interne, pas le domain
        entity: 'PRODUCT',
        status: 'ERROR',
        message: error.message,
        payload: {
          productId: payload.id,
          error: error.stack
        }
      }
    });
    
    // Re-throw pour que BullMQ réessaye
    throw error;
  }
}
```

---

#### 3.4 Messages d'erreur peu informatifs
**Fichier:** `services/stockeasy.service.ts` (ligne 54, 75, 107)  

**Avant:**
```typescript
if (error) {
  logger.error('Error syncing product to Supabase', error);
  throw error;
}
```

**Après:**
```typescript
if (error) {
  logger.error('Error syncing product to Supabase', {
    error: error.message,
    code: error.code,
    hint: error.hint,
    details: error.details,
    sku: product.sku,
    companyId
  });
  
  throw new Error(
    `Failed to sync product ${product.sku} to StockEasy: ${error.message}`
  );
}
```

---

### 🧪 TESTS

#### 3.5 Tests manquants
**Criticité:** 🔴 CRITICAL  

Il n'y a actuellement aucun test pour les services critiques. Voici les tests prioritaires à implémenter:

```typescript
// services/__tests__/shopify.service.spec.ts
describe('ShopifyService', () => {
  describe('updateInventory', () => {
    it('should update inventory successfully', async () => {
      // Test
    });
    
    it('should throw error when inventory item not found', async () => {
      // Test
    });
    
    it('should handle negative quantities', async () => {
      // Test
    });
  });
  
  describe('validateWebhook', () => {
    it('should validate correct HMAC', async () => {
      // Test
    });
    
    it('should reject invalid HMAC', async () => {
      // Test
    });
  });
});

// worker.spec.ts
describe('Worker', () => {
  describe('handleProductSync', () => {
    it('should sync all variants successfully', async () => {
      // Test
    });
    
    it('should skip variants without SKU', async () => {
      // Test
    });
    
    it('should handle batch errors gracefully', async () => {
      // Test
    });
  });
});

// routes/__tests__/webhooks.spec.ts
describe('Webhook Routes', () => {
  it('should accept valid webhook', async () => {
    // Test
  });
  
  it('should reject webhook from inactive shop', async () => {
    // Test
  });
  
  it('should handle rate limiting', async () => {
    // Test
  });
});
```

**Couverture cible:** 80% minimum

---

### 📏 CONFORMITÉ AUX STANDARDS

#### 3.6 TypeScript Strict Mode
**Fichier:** `tsconfig.json`  

Vérifier que le strict mode est activé:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

#### 3.7 ESLint Configuration
**Nouveau fichier:** `.eslintrc.js`

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['error', 'warn'] }], // Forcer l'utilisation du logger
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

---

## 🔍 4. REVIEW DE LOGIQUE MÉTIER ET EDGE CASES

### 🐛 BUGS POTENTIELS

#### 4.1 Race Condition dans la synchronisation
**Fichier:** `worker.ts`  
**Criticité:** 🔴 CRITICAL  

**Scénario:**
1. Webhook `products/update` arrive à 10:00:00.000
2. Webhook `inventory_levels/update` arrive à 10:00:00.100
3. Les deux jobs sont traités en parallèle
4. Le webhook produit met `stock_actuel = 50`
5. Le webhook inventaire met `stock_actuel = 45`
6. Résultat: état incohérent selon l'ordre d'exécution

**Solution:** Implémenter un système de versioning ou de locks

```typescript
// Ajouter dans schema.prisma
model ProductMapping {
  id               String   @id @default(uuid())
  shopId           String
  shopifyProductId String
  shopifyVariantId String
  stockEasySku     String
  lastSyncedAt     DateTime @default(now())
  version          Int      @default(0) // NOUVEAU: Pour optimistic locking
  
  shop             Shop     @relation(fields: [shopId], references: [id])

  @@unique([shopId, shopifyVariantId])
  @@index([stockEasySku])
}

// Dans worker.ts
async function handleInventorySync(shopDomain: string, companyId: string, payload: any) {
  const sku = await findSkuFromInventoryItemId(payload.inventory_item_id);
  
  if (!sku) {
    logger.warn(`No SKU found for inventory_item_id ${payload.inventory_item_id}`);
    return;
  }
  
  // Utiliser une transaction avec versioning
  const result = await prisma.$transaction(async (tx) => {
    // Lire la version actuelle
    const current = await tx.productMapping.findFirst({
      where: { stockEasySku: sku, shopId: shopDomain },
      select: { version: true, lastSyncedAt: true }
    });
    
    if (!current) {
      throw new Error(`Mapping not found for SKU ${sku}`);
    }
    
    // Vérifier si la mise à jour est plus récente
    const webhookTimestamp = new Date(payload.updated_at);
    if (current.lastSyncedAt > webhookTimestamp) {
      logger.info(`Ignoring outdated inventory update for ${sku}`);
      return null;
    }
    
    // Mettre à jour avec version check
    const updated = await tx.productMapping.updateMany({
      where: {
        stockEasySku: sku,
        shopId: shopDomain,
        version: current.version // Optimistic lock
      },
      data: {
        version: current.version + 1,
        lastSyncedAt: new Date()
      }
    });
    
    if (updated.count === 0) {
      throw new Error('Concurrent modification detected, retrying...');
    }
    
    // Mettre à jour StockEasy
    return await stockEasyService.updateInventory(companyId, sku, payload.available);
  });
  
  return result;
}
```

---

#### 4.2 Division par zéro dans les calculs
**Fichier:** `services/stockeasy.service.ts` (ligne 93)  

**Problème:** Si `item.quantity` ou `item.price` sont 0, le calcul du revenu peut donner des résultats incorrects.

**Solution:**
```typescript
const salesRecords = orderData.lineItems
  .filter((item: any) => {
    if (!item.sku) {
      logger.warn(`Line item without SKU in order ${orderData.shopifyOrderId}`);
      return false;
    }
    if (item.quantity <= 0) {
      logger.warn(`Invalid quantity ${item.quantity} for SKU ${item.sku}`);
      return false;
    }
    return true;
  })
  .map((item: any) => ({
    company_id: companyId,
    sku: item.sku,
    sale_date: new Date().toISOString().split('T')[0],
    quantity: Math.max(0, item.quantity), // Sécurité supplémentaire
    revenue: Math.max(0, parseFloat(item.price) * item.quantity),
    source: 'shopify',
    metadata: {
      shopify_order_id: orderData.shopifyOrderId,
      shopify_variant_id: item.variantId,
      original_price: item.price
    }
  }));
```

---

### 🎯 EDGE CASES NON GÉRÉS

#### 4.3 SKU manquants ou invalides
**Fichier:** `worker.ts` (ligne 84-88)  
**Criticité:** 🟠 HIGH  

**Problème actuel:** On skip silencieusement les variantes sans SKU, mais on ne notifie personne.

**Solution:**
```typescript
async function handleProductSync(shopDomain: string, companyId: string, payload: any) {
  const variantsWithoutSku: any[] = [];
  
  for (const variant of payload.variants) {
    const sku = variant.sku;
    if (!sku) {
      variantsWithoutSku.push({
        variantId: variant.id,
        title: variant.title
      });
      logger.warn(`Skipping variant ${variant.id} without SKU`, {
        productId: payload.id,
        productTitle: payload.title,
        variantTitle: variant.title
      });
      continue;
    }
    
    // Sync normal...
  }
  
  // Créer une notification pour l'utilisateur
  if (variantsWithoutSku.length > 0) {
    await prisma.syncLog.create({
      data: {
        shopId: shopDomain,
        entity: 'PRODUCT',
        status: 'WARNING',
        message: `${variantsWithoutSku.length} variant(s) skipped due to missing SKU`,
        payload: {
          productId: payload.id,
          productTitle: payload.title,
          variantsWithoutSku
        }
      }
    });
    
    // Optionnel: Envoyer un email/notification au marchand
    // await notificationService.sendAlert(...)
  }
}
```

---

#### 4.4 Produits supprimés sur Shopify
**Criticité:** 🟡 MEDIUM  

**Problème:** Il n'y a pas de webhook handler pour `products/delete`. Les produits supprimés sur Shopify restent actifs dans StockEasy.

**Solution:**
```typescript
// Dans worker.ts, ajouter un nouveau case
switch (topic) {
  case 'products/create':
  case 'products/update':
    await handleProductSync(shop, companyId, payload);
    break;
  
  // NOUVEAU
  case 'products/delete':
    await handleProductDelete(shop, companyId, payload);
    break;
  
  case 'inventory_levels/update':
    await handleInventorySync(shop, companyId, payload);
    break;

  case 'orders/create':
    await handleOrderSync(shop, companyId, payload);
    break;

  default:
    logger.warn(`Unknown topic ${topic}, skipping.`);
}

// Nouvelle fonction
async function handleProductDelete(shopDomain: string, companyId: string, payload: any) {
  try {
    logger.info(`Deleting product ${payload.id} from StockEasy`);
    
    // 1. Trouver tous les mappings associés
    const mappings = await prisma.productMapping.findMany({
      where: {
        shopId: shopDomain,
        shopifyProductId: payload.id.toString()
      }
    });
    
    if (mappings.length === 0) {
      logger.warn(`No mappings found for deleted product ${payload.id}`);
      return;
    }
    
    // 2. Options de gestion:
    // Option A: Soft delete (marquer comme inactif)
    for (const mapping of mappings) {
      await stockEasyService.deactivateProduct(companyId, mapping.stockEasySku);
    }
    
    // Option B: Hard delete (supprimer complètement)
    // await stockEasyService.deleteProduct(companyId, mapping.stockEasySku);
    
    // 3. Supprimer les mappings
    await prisma.productMapping.deleteMany({
      where: {
        shopId: shopDomain,
        shopifyProductId: payload.id.toString()
      }
    });
    
    logger.info(`Successfully handled deletion of product ${payload.id}`);
  } catch (error) {
    logger.error(`Failed to handle product deletion`, error);
    throw error;
  }
}

// Dans stockeasy.service.ts
async deactivateProduct(companyId: string, sku: string) {
  const { data, error } = await this.supabase
    .from('produits')
    .update({ 
      actif: false, // Supposant qu'il existe une colonne 'actif'
      deleted_at: new Date().toISOString()
    })
    .eq('sku', sku)
    .eq('company_id', companyId)
    .select();

  if (error) {
    logger.error('Error deactivating product in Supabase', error);
    throw error;
  }

  return data;
}
```

---

#### 4.5 Conflits de synchronisation bidirectionnelle
**Criticité:** 🔴 CRITICAL  

**Problème:** Si StockEasy modifie le stock ET Shopify modifie le stock en même temps, qui gagne ?

**Solution:** Implémenter une stratégie de résolution de conflits

```typescript
// config/sync-strategy.ts
export enum ConflictResolutionStrategy {
  SHOPIFY_WINS = 'shopify_wins',      // Shopify a toujours raison
  STOCKEASY_WINS = 'stockeasy_wins',  // StockEasy a toujours raison
  LATEST_WINS = 'latest_wins',        // Le plus récent gagne
  MANUAL = 'manual'                   // Créer un ticket de conflit
}

export const config = {
  conflictStrategy: ConflictResolutionStrategy.LATEST_WINS
};

// services/conflict-resolver.service.ts
export class ConflictResolverService {
  async resolveInventoryConflict(
    sku: string,
    shopifyQuantity: number,
    shopifyTimestamp: Date,
    stockEasyQuantity: number,
    stockEasyTimestamp: Date
  ): Promise<{ quantity: number; source: 'shopify' | 'stockeasy' }> {
    
    switch (config.conflictStrategy) {
      case ConflictResolutionStrategy.SHOPIFY_WINS:
        return { quantity: shopifyQuantity, source: 'shopify' };
      
      case ConflictResolutionStrategy.STOCKEASY_WINS:
        return { quantity: stockEasyQuantity, source: 'stockeasy' };
      
      case ConflictResolutionStrategy.LATEST_WINS:
        if (shopifyTimestamp > stockEasyTimestamp) {
          return { quantity: shopifyQuantity, source: 'shopify' };
        } else {
          return { quantity: stockEasyQuantity, source: 'stockeasy' };
        }
      
      case ConflictResolutionStrategy.MANUAL:
        // Créer un ticket de conflit
        await this.createConflictTicket({
          sku,
          shopifyQuantity,
          shopifyTimestamp,
          stockEasyQuantity,
          stockEasyTimestamp
        });
        // En attendant, garder la valeur actuelle
        return { quantity: stockEasyQuantity, source: 'stockeasy' };
      
      default:
        throw new Error('Unknown conflict resolution strategy');
    }
  }
  
  private async createConflictTicket(data: any) {
    await prisma.syncLog.create({
      data: {
        shopId: data.shopId,
        entity: 'INVENTORY_CONFLICT',
        status: 'PENDING',
        message: `Conflict detected for SKU ${data.sku}`,
        payload: data
      }
    });
    
    // Notifier l'admin
    logger.warn(`Inventory conflict detected for SKU ${data.sku}`, data);
  }
}
```

---

#### 4.6 Webhooks dupliqués
**Fichier:** `routes/webhooks.ts`  
**Criticité:** 🟡 MEDIUM  

**Problème:** Shopify peut envoyer le même webhook plusieurs fois. Sans déduplication, on pourrait traiter deux fois la même commande.

**Solution:**
```typescript
// Ajouter dans schema.prisma
model WebhookEvent {
  id            String   @id @default(uuid())
  webhookId     String   @unique // x-shopify-webhook-id header
  shop          String
  topic         String
  processedAt   DateTime @default(now())
  
  @@index([shop, topic])
  @@index([processedAt]) // Pour cleanup des vieux événements
}

// Dans routes/webhooks.ts
const validateWebhook = async (req: Request, res: Response, next: Function) => {
  try {
    const hmac = req.header('x-shopify-hmac-sha256');
    const topic = req.header('x-shopify-topic');
    const shop = req.header('x-shopify-shop-domain');
    const webhookId = req.header('x-shopify-webhook-id'); // NOUVEAU

    if (!hmac || !topic || !shop || !webhookId) {
      logger.warn('Missing webhook headers');
      return res.status(401).send('Missing headers');
    }

    // NOUVEAU: Vérifier si le webhook a déjà été traité
    const existing = await prisma.webhookEvent.findUnique({
      where: { webhookId }
    });

    if (existing) {
      logger.info(`Duplicate webhook detected: ${webhookId}, skipping`);
      return res.status(200).send('Webhook already processed');
    }

    // Validation HMAC...
    const isValid = await shopify.webhooks.validate({
      rawBody: (req.body as Buffer).toString(),
      rawRequest: req,
    });

    if (!isValid.valid) {
      logger.warn(`Invalid HMAC for shop ${shop}`);
      return res.status(401).send('Invalid HMAC');
    }

    // NOUVEAU: Enregistrer le webhook
    await prisma.webhookEvent.create({
      data: {
        webhookId,
        shop,
        topic
      }
    });

    (req as any).webhookContext = { topic, shop, webhookId };
    next();
  } catch (error) {
    logger.error('Webhook validation error', error);
    res.status(500).send('Internal Server Error');
  }
};

// Ajouter un job de nettoyage périodique
async function cleanupOldWebhookEvents() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await prisma.webhookEvent.deleteMany({
    where: {
      processedAt: {
        lt: thirtyDaysAgo
      }
    }
  });
  
  logger.info('Cleaned up old webhook events');
}

// Exécuter toutes les 24h
setInterval(cleanupOldWebhookEvents, 24 * 60 * 60 * 1000);
```

---

### 🔥 SCÉNARIOS D'ÉCHEC

#### 4.7 Shopify API down
**Criticité:** 🔴 CRITICAL  

**Solution:** Implémenter un circuit breaker

```typescript
// utils/circuit-breaker.ts
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN, request rejected');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info('Circuit breaker is now CLOSED');
    }
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      logger.error(`Circuit breaker is now OPEN after ${this.failureCount} failures`);
    }
  }
}

// Dans shopify.service.ts
export class ShopifyService {
  private circuitBreaker = new CircuitBreaker(5, 60000);
  
  async updateInventory(
    session: Session,
    inventoryItemId: string,
    locationId: string,
    quantity: number
  ) {
    return this.circuitBreaker.execute(async () => {
      const client = new shopify.clients.Graphql({ session });
      // ... rest of the code
    });
  }
}
```

---

#### 4.8 StockEasy API down
**Solution:** Utiliser une Dead Letter Queue

```typescript
// worker.ts
export const startWorker = () => {
  const worker = new Worker('shopify-sync', async (job: Job) => {
    // ... existing code
  }, {
    connection: {
      url: config.redis.url
    },
    concurrency: 5,
    limiter: {
      max: 40,
      duration: 1000
    },
    // NOUVEAU: Configuration des retries
    settings: {
      backoffStrategy: 'exponential',
      backoffDelay: 5000, // 5 secondes
      attempts: 5 // 5 tentatives
    }
  });

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', async (job, err) => {
    logger.error(`Job ${job?.id} failed with error ${err.message}`);
    
    // NOUVEAU: Si échec après toutes les tentatives, envoyer en DLQ
    if (job && job.attemptsMade >= 5) {
      await moveToDeadLetterQueue(job);
    }
  });
  
  logger.info('🚀 Worker started and listening for jobs');
};

// Dead Letter Queue
const deadLetterQueue = new Queue('shopify-sync-dlq', {
  connection: {
    url: config.redis.url
  }
});

async function moveToDeadLetterQueue(job: Job) {
  logger.error(`Moving job ${job.id} to Dead Letter Queue`);
  
  await deadLetterQueue.add('failed-job', {
    originalJobId: job.id,
    originalData: job.data,
    failureReason: job.failedReason,
    attempts: job.attemptsMade,
    timestamp: new Date().toISOString()
  }, {
    removeOnComplete: false, // Garder pour investigation
    removeOnFail: false
  });
  
  // Créer un log pour monitoring
  await prisma.syncLog.create({
    data: {
      shopId: job.data.shop,
      entity: 'DLQ',
      status: 'ERROR',
      message: `Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`,
      payload: {
        topic: job.data.topic,
        failureReason: job.failedReason
      }
    }
  });
  
  // Alerter l'équipe technique
  // await alertService.sendAlert(...)
}
```

---

#### 4.9 Queue Redis pleine
**Solution:** Monitoring et alertes

```typescript
// utils/queue-monitor.ts
import { Queue } from 'bullmq';

export class QueueMonitor {
  constructor(private queue: Queue) {}
  
  async getMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount()
    ]);
    
    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed
    };
  }
  
  async checkHealth() {
    const metrics = await this.getMetrics();
    
    // Alerte si plus de 10 000 jobs en attente
    if (metrics.waiting > 10000) {
      logger.error('Queue is overloaded', metrics);
      // await alertService.sendAlert('Queue Overload', metrics);
    }
    
    // Alerte si taux d'échec > 10%
    const failureRate = metrics.failed / (metrics.completed + metrics.failed);
    if (failureRate > 0.1) {
      logger.error('High failure rate detected', { failureRate, metrics });
      // await alertService.sendAlert('High Failure Rate', { failureRate });
    }
    
    return metrics;
  }
}

// Dans index.ts
const queueMonitor = new QueueMonitor(syncQueue);

// Vérifier toutes les 5 minutes
setInterval(async () => {
  try {
    await queueMonitor.checkHealth();
  } catch (error) {
    logger.error('Error monitoring queue', error);
  }
}, 5 * 60 * 1000);

// Endpoint de health check amélioré
app.get('/health', async (req, res) => {
  try {
    const queueMetrics = await queueMonitor.getMetrics();
    
    // Vérifier la connexion DB
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      queue: queueMetrics,
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message
    });
  }
});
```

---

## ✅ 5. REVIEW DE CONFORMITÉ SHOPIFY ET INTÉGRATION

### 📋 CONFORMITÉ APP STORE

#### 5.1 Webhooks de compliance manquants
**Criticité:** 🔴 CRITICAL - BLOQUANT POUR APP STORE  

**Problème:** Les webhooks GDPR sont obligatoires pour publier sur l'App Store Shopify.

**Solution:** Implémenter les 3 webhooks de compliance

```typescript
// routes/compliance.ts
import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { StockEasyService } from '../services/stockeasy.service';

const router = Router();
const stockEasyService = new StockEasyService();

/**
 * Webhook: customers/data_request
 * Le marchand demande les données d'un client
 */
router.post('/customers/data_request', async (req: Request, res: Response) => {
  const payload = JSON.parse((req.body as Buffer).toString());
  const { shop_domain, customer, orders_requested } = payload;
  
  logger.info(`Data request received for customer ${customer.id} from ${shop_domain}`);
  
  try {
    // 1. Récupérer le shop
    const shop = await prisma.shop.findUnique({
      where: { domain: shop_domain }
    });
    
    if (!shop || !shop.stockEasyCompanyId) {
      return res.status(200).send('Shop not found');
    }
    
    // 2. Récupérer toutes les données du client dans StockEasy
    // (commandes, historique de ventes, etc.)
    const customerData = await collectCustomerData(
      shop.stockEasyCompanyId,
      customer.email,
      orders_requested
    );
    
    // 3. Logger la requête (obligatoire pour audit)
    await prisma.syncLog.create({
      data: {
        shopId: shop.id,
        entity: 'GDPR_DATA_REQUEST',
        status: 'SUCCESS',
        message: `Data request for customer ${customer.email}`,
        payload: {
          customerId: customer.id,
          requestedOrders: orders_requested,
          dataCollected: customerData
        }
      }
    });
    
    // 4. En production, envoyer les données par email ou API
    logger.info('Customer data collected', {
      shop: shop_domain,
      customer: customer.email,
      orders: orders_requested.length
    });
    
    res.status(200).send('Data request processed');
  } catch (error) {
    logger.error('Error processing data request', error);
    res.status(500).send('Error processing request');
  }
});

/**
 * Webhook: customers/redact
 * Le client demande la suppression de ses données (48h après désinstallation de l'app)
 */
router.post('/customers/redact', async (req: Request, res: Response) => {
  const payload = JSON.parse((req.body as Buffer).toString());
  const { shop_domain, customer, orders_to_redact } = payload;
  
  logger.info(`Customer redaction request for ${customer.id} from ${shop_domain}`);
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { domain: shop_domain }
    });
    
    if (!shop || !shop.stockEasyCompanyId) {
      return res.status(200).send('Shop not found');
    }
    
    // Supprimer ou anonymiser les données du client
    await redactCustomerData(
      shop.stockEasyCompanyId,
      customer.email,
      orders_to_redact
    );
    
    // Logger la suppression (obligatoire)
    await prisma.syncLog.create({
      data: {
        shopId: shop.id,
        entity: 'GDPR_CUSTOMER_REDACT',
        status: 'SUCCESS',
        message: `Customer data redacted for ${customer.email}`,
        payload: {
          customerId: customer.id,
          ordersRedacted: orders_to_redact.length
        }
      }
    });
    
    logger.info('Customer data redacted successfully');
    res.status(200).send('Customer data redacted');
  } catch (error) {
    logger.error('Error redacting customer data', error);
    res.status(500).send('Error processing request');
  }
});

/**
 * Webhook: shop/redact
 * La boutique est supprimée ou l'app est désinstallée depuis 48h
 */
router.post('/shop/redact', async (req: Request, res: Response) => {
  const payload = JSON.parse((req.body as Buffer).toString());
  const { shop_domain } = payload;
  
  logger.info(`Shop redaction request for ${shop_domain}`);
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { domain: shop_domain }
    });
    
    if (!shop) {
      return res.status(200).send('Shop not found');
    }
    
    // Supprimer toutes les données du shop
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer les logs
      await tx.syncLog.deleteMany({
        where: { shopId: shop.id }
      });
      
      // 2. Supprimer les mappings
      await tx.productMapping.deleteMany({
        where: { shopId: shop.id }
      });
      
      // 3. Supprimer le shop
      await tx.shop.delete({
        where: { id: shop.id }
      });
    });
    
    // Note: Les données dans StockEasy (Supabase) appartiennent au marchand
    // et doivent être supprimées manuellement ou via leur compte StockEasy
    
    logger.info(`Shop ${shop_domain} data deleted successfully`);
    res.status(200).send('Shop data redacted');
  } catch (error) {
    logger.error('Error redacting shop data', error);
    res.status(500).send('Error processing request');
  }
});

// Helper functions
async function collectCustomerData(companyId: string, email: string, orders: any[]) {
  // Implémenter la collecte de données
  const orderIds = orders.map(o => o.id);
  
  // Exemple: récupérer les données de sales_history
  const salesData = await stockEasyService.supabase
    .from('sales_history')
    .select('*')
    .eq('company_id', companyId)
    .in('metadata->shopify_order_id', orderIds);
  
  return {
    email,
    orders: orders.length,
    salesHistory: salesData.data || []
  };
}

async function redactCustomerData(companyId: string, email: string, orders: any[]) {
  const orderIds = orders.map(o => o.id);
  
  // Option 1: Anonymiser (recommandé pour garder les stats)
  await stockEasyService.supabase
    .from('sales_history')
    .update({
      metadata: {
        customer_redacted: true,
        redacted_at: new Date().toISOString()
      }
    })
    .eq('company_id', companyId)
    .in('metadata->shopify_order_id', orderIds);
  
  // Option 2: Supprimer complètement (si légalement requis)
  // await stockEasyService.supabase
  //   .from('sales_history')
  //   .delete()
  //   .eq('company_id', companyId)
  //   .in('metadata->shopify_order_id', orderIds);
}

export { router as complianceRouter };
```

**Dans `index.ts`, ajouter:**
```typescript
import { complianceRouter } from './routes/compliance';

// Routes de compliance (GDPR)
app.use('/webhooks/compliance', express.raw({ type: 'application/json' }), complianceRouter);
```

---

#### 5.2 Scopes OAuth à vérifier
**Fichier:** `config/index.ts` (ligne 11)  
**Criticité:** 🟠 HIGH  

**Recommandation:** Définir explicitement les scopes nécessaires:

```typescript
export const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
    // AMÉLIORATION: Définir les scopes explicitement
    scopes: process.env.SHOPIFY_SCOPES?.split(',') || [
      'read_products',         // Lire les produits
      'write_products',        // Modifier les produits (si nécessaire)
      'read_inventory',        // Lire l'inventaire
      'write_inventory',       // Modifier l'inventaire
      'read_orders',           // Lire les commandes
      // OPTIONNELS selon les besoins:
      // 'read_customers',     // Si on traite les données clients
      // 'read_analytics',     // Si on récupère des stats
    ],
    host: process.env.HOST || '',
  },
  // ...
};
```

**Important:** Demander uniquement les scopes nécessaires. Shopify rejette les apps qui demandent trop de permissions.

---

#### 5.3 URL de Privacy Policy manquante
**Criticité:** 🔴 CRITICAL - OBLIGATOIRE POUR APP STORE  

**Solution:** Créer une privacy policy accessible publiquement

```typescript
// routes/legal.ts
import { Router } from 'express';

const router = Router();

router.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Privacy Policy - Shopify Connector for StockEasy</title>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          line-height: 1.6;
        }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy</h1>
      <p><strong>Last Updated:</strong> November 22, 2025</p>
      
      <h2>1. Introduction</h2>
      <p>
        This privacy policy describes how Shopify Connector for StockEasy 
        ("we", "us", or "our") collects, uses, and shares information about you 
        when you use our Shopify application.
      </p>
      
      <h2>2. Information We Collect</h2>
      <p>We collect the following information from your Shopify store:</p>
      <ul>
        <li>Product information (names, SKUs, prices)</li>
        <li>Inventory levels</li>
        <li>Order information (order IDs, line items, quantities)</li>
        <li>Store domain</li>
      </ul>
      
      <h2>3. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Synchronize inventory between Shopify and StockEasy</li>
        <li>Track sales and order fulfillment</li>
        <li>Generate reports and analytics</li>
      </ul>
      
      <h2>4. Data Storage and Security</h2>
      <p>
        Your data is stored securely using industry-standard encryption. 
        We implement appropriate technical and organizational measures to protect 
        your personal information.
      </p>
      
      <h2>5. Data Retention</h2>
      <p>
        We retain your data for as long as your store uses our application. 
        Upon uninstallation, your data will be deleted within 48 hours as per 
        Shopify's GDPR requirements.
      </p>
      
      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Request a copy of your data</li>
        <li>Request deletion of your data</li>
        <li>Opt-out of data collection by uninstalling the app</li>
      </ul>
      
      <h2>7. Contact Us</h2>
      <p>
        For questions about this privacy policy, please contact us at:<br>
        <strong>Email:</strong> privacy@stockeasy.com<br>
        <strong>Address:</strong> [Your Company Address]
      </p>
    </body>
    </html>
  `);
});

router.get('/terms', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Terms of Service - Shopify Connector for StockEasy</title>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          line-height: 1.6;
        }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
      </style>
    </head>
    <body>
      <h1>Terms of Service</h1>
      <p><strong>Last Updated:</strong> November 22, 2025</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>
        By installing and using Shopify Connector for StockEasy, you agree to 
        these Terms of Service.
      </p>
      
      <h2>2. Description of Service</h2>
      <p>
        Our application provides synchronization between your Shopify store and 
        StockEasy inventory management system.
      </p>
      
      <h2>3. User Responsibilities</h2>
      <p>You are responsible for:</p>
      <ul>
        <li>Maintaining the security of your Shopify account</li>
        <li>Ensuring data accuracy</li>
        <li>Complying with Shopify's Terms of Service</li>
      </ul>
      
      <h2>4. Limitation of Liability</h2>
      <p>
        We are not liable for any damages arising from the use of our application, 
        including but not limited to data loss or business interruption.
      </p>
      
      <h2>5. Contact Information</h2>
      <p>
        For support, contact us at:<br>
        <strong>Email:</strong> support@stockeasy.com
      </p>
    </body>
    </html>
  `);
});

export { router as legalRouter };
```

**Dans `index.ts`:**
```typescript
import { legalRouter } from './routes/legal';

app.use(express.json());
app.use(legalRouter);
```

---

### 🔌 UTILISATION DES APIs

#### 5.4 Gestion des versions d'API
**Fichier:** `services/shopify.service.ts` (ligne 12)  
**Criticité:** 🟡 MEDIUM  

**Problème:** `LATEST_API_VERSION` peut changer et casser l'app.

**Solution:**
```typescript
import { ApiVersion } from '@shopify/shopify-api';

const shopify = shopifyApi({
  apiKey: config.shopify.apiKey,
  apiSecretKey: config.shopify.apiSecret,
  scopes: config.shopify.scopes,
  hostName: config.shopify.host.replace(/^https?:\/\//, ''),
  // AMÉLIORATION: Fixer la version d'API
  apiVersion: config.shopify.apiVersion || ApiVersion.October24,
  isEmbeddedApp: false,
  
  // NOUVEAU: Gérer la dépréciation
  logger: {
    level: 'info',
    log: (severity, message) => {
      if (message.includes('deprecated')) {
        logger.warn(`Shopify API deprecation warning: ${message}`);
        // Alerter l'équipe pour mettre à jour
      }
      logger.info(message);
    }
  }
});
```

---

#### 5.5 Pagination GraphQL incomplète
**Fichier:** `services/shopify.service.ts`  
**Criticité:** 🟡 MEDIUM  

Déjà traité dans la section Performance (2.3)

---

### 🎨 UI/UX (Si applicable)

**Note:** Le code actuel est un backend API, donc pas d'UI. Si vous développez une interface admin:

1. Utiliser Shopify Polaris React components
2. Implémenter l'App Bridge pour l'intégration dans Shopify Admin
3. Suivre les design guidelines de Shopify

---

## 📊 RÉSUMÉ ET PRIORISATION

### 🔴 CRITIQUES (À corriger immédiatement)

1. ✅ **Chiffrement des Access Tokens** (Section 1.1)
2. ✅ **Webhooks GDPR manquants** (Section 5.1) - BLOQUANT APP STORE
3. ✅ **Service Role Key trop permissive** (Section 1.2)
4. ✅ **Privacy Policy manquante** (Section 5.3) - BLOQUANT APP STORE
5. ✅ **Race conditions dans la sync** (Section 4.1)
6. ✅ **Absence de tests** (Section 3.5)

### 🟠 IMPORTANTES (À corriger avant production)

1. ✅ **Validation des inputs** (Section 1.4)
2. ✅ **Sanitization des logs** (Section 1.5)
3. ✅ **Rate limiting** (Section 1.6)
4. ✅ **Requêtes N+1** (Section 2.1)
5. ✅ **Cache pour les shops** (Section 2.2)
6. ✅ **Gestion des edge cases** (Section 4.3-4.6)
7. ✅ **Circuit breaker** (Section 4.7)

### 🟡 MOYENNES (Améliorations recommandées)

1. ✅ **Timeouts HTTP** (Section 1.7)
2. ✅ **Pagination** (Section 2.3)
3. ✅ **Index DB** (Section 2.5)
4. ✅ **Gestion d'erreurs améliorée** (Section 3.3-3.4)
5. ✅ **Monitoring de la queue** (Section 4.9)
6. ✅ **Version d'API fixée** (Section 5.4)

### 🟢 MINEURES (Nice to have)

1. ✅ **CSP Headers** (Section 1.8)
2. ✅ **Bulk Operations** (Section 2.4)
3. ✅ **Connection pooling** (Section 2.6)
4. ✅ **Refactoring architecture** (Section 3.1)

---

## 🎯 CHECKLIST DE PRÉ-SOUMISSION APP STORE

Avant de soumettre l'app à Shopify:

- [ ] Webhooks GDPR implémentés (customers/data_request, customers/redact, shop/redact)
- [ ] Privacy Policy accessible publiquement
- [ ] Terms of Service accessibles
- [ ] Scopes OAuth correctement définis et justifiés
- [ ] Validation HMAC des webhooks
- [ ] Gestion des webhooks dupliqués
- [ ] Rate limiting respecté (40 req/s)
- [ ] Chiffrement des tokens
- [ ] Tests avec couverture > 80%
- [ ] Documentation API complète
- [ ] Support email configuré
- [ ] Handling gracieux des erreurs
- [ ] Logs d'audit pour compliance
- [ ] Performance testée (temps de réponse < 3s)

---

## 📝 RECOMMANDATIONS FINALES

### Priorité 1 (Cette semaine)
1. Implémenter les webhooks GDPR
2. Créer la privacy policy
3. Chiffrer les access tokens
4. Ajouter la validation HMAC complète

### Priorité 2 (Prochaines 2 semaines)
1. Écrire les tests critiques
2. Implémenter le cache Redis
3. Corriger les requêtes N+1
4. Ajouter le circuit breaker

### Priorité 3 (Avant production)
1. Monitoring et alertes
2. Dead Letter Queue
3. Gestion des conflits
4. Documentation complète

---

**Fin du rapport de code review**

*Généré le: 22 Novembre 2025*  
*Basé sur: Workflow 3-Code-Review-Claude-3.5-Sonnet.md*


