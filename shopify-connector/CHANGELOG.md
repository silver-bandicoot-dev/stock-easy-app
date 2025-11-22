# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Non publié]

### À Venir
- Intégration du chiffrement des access tokens
- Application de la validation sur tous les services
- Tests unitaires et d'intégration
- Rate limiting
- Cache Redis
- Circuit breaker
- Monitoring et alertes

---

## [0.2.0] - 2025-11-22

### 🎉 Ajouté - Conformité GDPR & Sécurité

#### Webhooks GDPR (OBLIGATOIRES App Store)
- **`src/routes/compliance.ts`** - Webhooks de conformité GDPR
  - `POST /webhooks/compliance/customers/data_request` - Requête de données client (RGPD Article 15)
  - `POST /webhooks/compliance/customers/redact` - Suppression données client (RGPD Article 17)
  - `POST /webhooks/compliance/shop/redact` - Suppression données boutique
  - Collecte des données depuis StockEasy
  - Anonymisation des données (option recommandée)
  - Logging complet pour audit GDPR
  - Gestion d'erreurs robuste

#### Pages Légales (REQUISES App Store)
- **`src/routes/legal.ts`** - Pages légales publiques
  - `GET /privacy` - Politique de confidentialité complète (RGPD/CCPA)
  - `GET /terms` - Conditions d'utilisation complètes
  - Design professionnel et responsive
  - Droits des utilisateurs (accès, rectification, effacement, etc.)
  - Coordonnées DPO et support

#### Utilitaires de Chiffrement
- **`src/utils/crypto.ts`** - Chiffrement AES-256-GCM pour tokens sensibles
  - `encrypt(text)` - Chiffrement avec IV unique et authentication tag
  - `decrypt(encryptedText)` - Déchiffrement sécurisé
  - `hash(text)` - Hash SHA-256
  - `generateEncryptionKey()` - Génération de clé sécurisée (32 bytes)
  - `secureCompare(a, b)` - Comparaison timing-safe
  - `generateToken(length)` - Génération de tokens aléatoires
  - `hashPassword(password)` - Hash PBKDF2 avec salt
  - `verifyPassword(password, hash)` - Vérification de mots de passe
  - Protection contre timing attacks
  - CLI pour générer ENCRYPTION_KEY

#### Validation et Sanitization
- **`src/utils/validators.ts`** - Validation robuste des inputs
  - `ValidationError` - Classe d'erreur personnalisée
  - `validateSku(sku)` - Validation SKU (alphanumerique, 1-50 chars)
  - `validateUuid(uuid)` - Validation UUID v4
  - `validateQuantity(qty, options)` - Validation quantités avec options
  - `validatePrice(price)` - Validation prix (max 2 décimales)
  - `validateEmail(email)` - Validation email RFC-compliant
  - `validateShopifyDomain(domain)` - Validation domaines Shopify
  - `validateShopifyGid(gid, expectedResource)` - Validation IDs GraphQL
  - `validateISODate(date)` - Validation dates ISO 8601
  - `validateUrl(url, options)` - Validation URLs avec protocoles
  - `sanitizeString(input)` - Nettoyage de chaînes
  - `validateMetadata(metadata, maxDepth)` - Validation métadonnées imbriquées
  - `validateAll(validations)` - Validation multiple avec accumulation

#### Améliorations Sécurité
- **`src/index.ts`** - Mise à jour du serveur principal
  - Headers CSP (Content Security Policy)
  - HSTS (HTTP Strict Transport Security)
  - Health check amélioré avec vérification DB
  - Intégration routes compliance
  - Intégration routes légales

#### Configuration
- **`.env.example`** - Template de configuration
  - Documentation complète des variables
  - Instructions de génération ENCRYPTION_KEY
  - Notes de sécurité importantes
  - Exemples pour dev/staging/prod

#### Documentation
- **`docs/CODE_REVIEW_REPORT.md`** - Rapport de code review exhaustif (300+ lignes)
  - 5 sections d'analyse (Sécurité, Performance, Qualité, Logique, Conformité)
  - 24 problèmes identifiés avec solutions
  - Code "avant/après" pour chaque correction
  - Priorisation par criticité (Critical, High, Medium, Low)
  
- **`docs/ACTION_PLAN.md`** - Plan d'action détaillé
  - 24 tâches organisées en 4 phases
  - Temps estimés pour chaque tâche
  - Jalons et deadlines
  - Métriques de progression
  
- **`docs/IMPLEMENTATION_REPORT.md`** - Guide d'implémentation
  - Ce qui a été implémenté
  - Ce qui reste à faire
  - Exemples de code détaillés
  - Services à mettre à jour
  - Checklist pre-production
  
- **`docs/SYNTHESE_CODE_REVIEW.md`** - Vue d'ensemble exécutive
  - Résumé des problèmes
  - État d'avancement
  - Timeline suggérée
  - Quick start guide
  
- **`docs/README.md`** - Index de la documentation
  - Guide de lecture
  - Structure des documents
  - FAQ
  - Checklist App Store

### 🔧 Modifié
- **`src/index.ts`** - Intégration des nouvelles routes et sécurité

### 🔒 Sécurité
- Conformité GDPR complète (webhooks + privacy policy)
- Utilitaires de chiffrement AES-256-GCM
- Validation robuste de tous les types d'inputs
- Headers de sécurité (CSP, HSTS)
- Protection timing attacks

### 📊 Métriques
- **Code produit:** 1200+ lignes (5 nouveaux fichiers)
- **Documentation:** 1400+ lignes (4 documents)
- **Problèmes identifiés:** 24 (5 critiques, 7 importants, 7 moyens, 5 mineurs)
- **Corrections implémentées:** 6 corrections critiques
- **Conformité App Store:** 80% (GDPR ✅, Legal ✅, Crypto ⚠️)

---

## [0.1.0] - 2025-11-21

### 🎉 Ajouté - Version Initiale

#### Architecture
- Configuration Express avec middleware de sécurité (helmet, cors)
- Architecture services/routes/utils
- Logging avec timestamps
- Health check endpoint

#### Services
- **ShopifyService** - Intégration API Shopify
  - Mise à jour d'inventaire
  - Récupération de produits
  - Validation HMAC des webhooks
  
- **StockEasyService** - Intégration Supabase
  - Synchronisation produits
  - Mise à jour inventaire
  - Enregistrement commandes
  
- **MappingService** - Mapping produits Shopify ↔ StockEasy
  - Création/mise à jour mappings
  - Recherche par SKU ou ID Shopify

#### Routes
- **Webhooks** - Réception webhooks Shopify
  - Validation HMAC
  - Ajout à la queue BullMQ
  - Priorisation par type de webhook

#### Worker
- **BullMQ Worker** - Traitement asynchrone
  - Handler `products/create` et `products/update`
  - Handler `inventory_levels/update`
  - Handler `orders/create`
  - Concurrence: 5 jobs parallèles
  - Rate limiting: 40 req/s (respect Shopify)

#### Base de Données
- **Prisma Schema**
  - Table `Shop` - Boutiques connectées
  - Table `ProductMapping` - Mapping produits
  - Table `SyncLog` - Logs de synchronisation

#### Configuration
- Variables d'environnement
- Configuration Shopify (API keys, scopes, host)
- Configuration base de données (PostgreSQL)
- Configuration Redis (queue)
- Configuration StockEasy (Supabase)

### 📝 Documentation
- README principal avec instructions de setup
- Documentation API (API_REFERENCE.md)
- Guide technique (TECHNICAL_GUIDE.md)
- Guide utilisateur (USER_GUIDE.md)

---

## Légende

- `Ajouté` pour les nouvelles fonctionnalités
- `Modifié` pour les changements de fonctionnalités existantes
- `Déprécié` pour les fonctionnalités qui seront retirées
- `Retiré` pour les fonctionnalités retirées
- `Corrigé` pour les corrections de bugs
- `Sécurité` pour les vulnérabilités corrigées

---

## [Liens]

- [0.2.0] - Code review et conformité GDPR
- [0.1.0] - Version initiale

---

**Note:** Les versions sont gérées selon Semantic Versioning:
- **MAJOR** (X.0.0): Changements incompatibles de l'API
- **MINOR** (0.X.0): Nouvelles fonctionnalités rétrocompatibles
- **PATCH** (0.0.X): Corrections de bugs rétrocompatibles


