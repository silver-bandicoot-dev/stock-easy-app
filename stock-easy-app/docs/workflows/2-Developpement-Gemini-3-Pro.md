# 2/Développement - Gemini 3 Pro

## 🔨 Workflow: Développement de l'App Shopify Connector

**Modèle:** Gemini 3 Pro  
**Objectif:** Générer le code de l'app Shopify backend-only (connecteur), implémenter les webhooks handlers et API endpoints

**IMPORTANT:** Cette app est UNIQUEMENT un connecteur backend. Pas d'UI, pas de dashboard dans Shopify. Tout le traitement et l'affichage se font dans StockEasy.

---

## 🎯 Prompt 1: Scaffolding de l'App Shopify

```
Tu es un développeur expert en apps Shopify avec React Router.

CONTEXTE:
- Nous créons une app Shopify "StockEasy Connector" qui est UNIQUEMENT un connecteur backend
- L'app reçoit les webhooks Shopify et les envoie vers StockEasy
- L'app reçoit les appels depuis StockEasy et écrit dans Shopify
- PAS d'interface utilisateur dans Shopify - tout reste dans StockEasy
- App backend-only (Node.js/Express ou similaire)

TÂCHE:
Génère le code complet pour le scaffolding initial de l'app backend qui inclut:

1. Structure de base
   - Configuration shopify.app.toml avec scopes nécessaires (minimal)
   - Structure de dossiers backend-only (pas de React/UI)
   - Configuration des webhooks dans shopify.app.toml
   - Variables d'environnement (.env.example)
   - URL de l'API StockEasy à configurer

2. Endpoints backend uniquement
   - Endpoints webhooks Shopify (POST /webhooks/products/create, etc.)
   - Endpoints API pour StockEasy (POST /api/sync-to-shopify)
   - Endpoint de santé (GET /health)
   - PAS de pages UI, PAS de dashboard

3. Services de base
   - Service Shopify GraphQL client (shopify.service.ts) - pour écrire dans Shopify
   - Service StockEasy API client (stockeasy.service.ts) - pour envoyer données vers StockEasy
   - Service de configuration (config.service.ts)
   - Service de logging (logger.service.ts)
   - Service de mapping (mapping.service.ts) - Shopify ID ↔ StockEasy SKU

4. Base de données
   - Schema Prisma pour stocker:
     - Mappings Shopify Product ID ↔ StockEasy SKU
     - Sync status et timestamps
     - Webhook events log
   - Migrations initiales

5. Authentification
   - Setup OAuth Shopify
   - Stockage sécurisé des tokens
   - Refresh token logic

Fournis le code complet, prêt à être utilisé, avec commentaires explicatifs.
```

---

## 🎯 Prompt 2: Service de Synchronisation Produits

```
Tu es un développeur expert en synchronisation de données entre APIs.

CONTEXTE:
- Nous avons une app Shopify qui doit synchroniser les produits bidirectionnellement
- Shopify API: GraphQL Admin API
- StockEasy API: Supabase REST API
- Nous devons gérer les rate limits, retries, et conflits

TÂCHE:
Génère le code complet pour un service de synchronisation produits qui inclut:

1. Service de mapping
   - Fonction pour mapper Product Shopify → Product StockEasy
   - Fonction pour mapper Product StockEasy → Product Shopify
   - Gestion des variantes (Shopify variants → produits simples StockEasy)
   - Gestion des champs optionnels et valeurs par défaut

2. Service de synchronisation Shopify → StockEasy
   - Fonction syncProductFromShopify(productId)
   - Récupération produit depuis Shopify GraphQL
   - Transformation et mapping
   - Envoi vers StockEasy API
   - Stockage du mapping dans DB
   - Gestion des erreurs et retry

3. Service de synchronisation StockEasy → Shopify
   - Fonction syncProductToShopify(sku)
   - Récupération produit depuis StockEasy
   - Transformation et mapping
   - Création/mise à jour via Shopify GraphQL
   - Stockage du mapping dans DB
   - Gestion des erreurs et retry

4. Gestion des conflits
   - Détection de modifications simultanées
   - Stratégie de résolution (last-write-wins ou merge)
   - Logging des conflits
   - Notification utilisateur

5. Tests unitaires
   - Tests pour chaque fonction de mapping
   - Tests pour les services de sync
   - Tests de gestion d'erreurs
   - Mocks pour les APIs

Fournis le code TypeScript/JavaScript complet avec gestion d'erreurs robuste et tests.
```

---

## 🎯 Prompt 3: Handlers de Webhooks Shopify

```
Tu es un développeur expert en webhooks et traitement asynchrone.

CONTEXTE:
- Shopify envoie des webhooks pour products/create, products/update, inventory_levels/update, orders/create
- Nous devons traiter ces webhooks et déclencher la synchronisation
- Nous utilisons une queue (Bull/BullMQ) pour traitement asynchrone
- Validation HMAC requise pour sécurité

TÂCHE:
Génère le code complet pour les handlers de webhooks qui inclut:

1. Validation HMAC
   - Fonction verifyWebhookHMAC(payload, hmacHeader, secret)
   - Middleware pour valider tous les webhooks
   - Gestion des erreurs de validation

2. Handler products/create
   - Route /webhooks/products/create
   - Validation HMAC
   - Extraction des données produit
   - Ajout à la queue de synchronisation
   - Réponse 200 à Shopify

3. Handler products/update
   - Route /webhooks/products/update
   - Validation HMAC
   - Détection des changements (inventaire, prix, etc.)
   - Mise à jour dans queue
   - Gestion des updates fréquents (debouncing)

4. Handler inventory_levels/update
   - Route /webhooks/inventory/update
   - Validation HMAC
   - Extraction des changements de stock
   - Sync immédiate vers StockEasy
   - Optimisation (batching si plusieurs updates)

5. Handler orders/create
   - Route /webhooks/orders/create
   - Validation HMAC
   - Extraction des line items
   - Mise à jour des ventes dans StockEasy
   - Déclenchement recalcul des prévisions

6. Workers de queue
   - Worker pour traiter les jobs de sync produits
   - Worker pour traiter les jobs de sync inventaire
   - Retry logic avec exponential backoff
   - Dead letter queue pour échecs permanents
   - Monitoring et logging

Fournis le code complet avec gestion d'erreurs, logging, et tests.
```

---

## 🎯 Prompt 4: API Endpoints pour StockEasy

```
Tu es un développeur expert en APIs REST et intégrations backend.

CONTEXTE:
- Notre app Shopify est un connecteur backend-only
- StockEasy doit pouvoir appeler l'app pour mettre à jour les stocks Shopify
- L'app doit exposer des endpoints API sécurisés

TÂCHE:
Génère le code complet pour les endpoints API qui inclut:

1. Endpoint de mise à jour de stock
   - POST /api/update-inventory
   - Reçoit: { shopDomain, productId, variantId, quantity }
   - Valide l'authentification (token StockEasy)
   - Met à jour le stock dans Shopify via GraphQL
   - Retourne le statut de la mise à jour

2. Endpoint de synchronisation manuelle
   - POST /api/sync-product
   - Reçoit: { shopDomain, productId }
   - Force une synchronisation produit Shopify → StockEasy
   - Retourne les données synchronisées

3. Endpoint de statut
   - GET /api/status
   - Retourne l'état de l'app (health check)
   - Liste des stores connectés
   - Statistiques de synchronisation

4. Authentification
   - Validation des tokens StockEasy
   - Rate limiting par store
   - Logging des appels API

5. Gestion d'erreurs
   - Codes d'erreur standardisés
   - Messages d'erreur clairs
   - Retry logic pour échecs temporaires
   - Notifications en cas d'erreur critique

Fournis le code complet avec Express/Fastify, validation, et gestion d'erreurs robuste.
```

---

## 🎯 Prompt 5: Service de Mapping et Logging

```
Tu es un développeur expert en services backend et gestion de données.

CONTEXTE:
- L'app Shopify doit stocker les mappings Shopify Product ID ↔ StockEasy SKU
- L'app doit logger toutes les synchronisations pour debugging
- L'app doit gérer les access tokens Shopify par store

TÂCHE:
Génère le code complet pour les services de mapping et logging qui inclut:

1. Service de mapping
   - Fonction createMapping(shopifyProductId, stockEasySku, shopDomain)
   - Fonction getMapping(shopifyProductId) → StockEasy SKU
   - Fonction getMappingBySku(stockEasySku) → Shopify Product ID
   - Fonction deleteMapping(productId)
   - Cache pour performances

2. Service de tokens
   - Stockage sécurisé des access tokens Shopify par store
   - Refresh token logic
   - Validation des tokens
   - Rotation des tokens si nécessaire

3. Service de logging
   - Log toutes les synchronisations (succès/échec)
   - Log tous les webhooks reçus
   - Log tous les appels API depuis StockEasy
   - Structure: timestamp, type, shopDomain, data, status, error
   - Rotation des logs (garder 30 jours)

4. Service de monitoring
   - Métriques de synchronisation (succès/échec)
   - Temps de traitement moyen
   - Nombre de webhooks par jour
   - Alertes si taux d'erreur > 5%

5. Base de données
   - Schema pour mappings (id, shopify_product_id, stockeasy_sku, shop_domain, created_at)
   - Schema pour tokens (id, shop_domain, access_token, refresh_token, expires_at)
   - Schema pour logs (id, type, shop_domain, data, status, error, created_at)
   - Index pour performances

Fournis le code complet avec Prisma/TypeORM, migrations, et optimisations.
```

---

## 📝 Notes d'Utilisation

1. **Copie chaque prompt** dans Gemini 3 Pro dans l'ordre
2. **Teste le code généré** avant de passer au suivant
3. **Adapte selon tes besoins** spécifiques
4. **Itère** si le code nécessite des ajustements
5. **Commit régulièrement** après chaque prompt réussi

---

## ✅ Checklist de Validation

Après chaque prompt, vérifie que le code:
- [ ] Compile sans erreurs
- [ ] Suit les best practices Shopify
- [ ] Gère les erreurs correctement
- [ ] Inclut des commentaires explicatifs
- [ ] Est testable et modulaire

---

*Workflow créé le: 2025-01-27*

