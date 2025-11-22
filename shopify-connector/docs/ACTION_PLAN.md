# 📋 Plan d'Action - Corrections Code Review

**Date de création:** 22 Novembre 2025  
**Basé sur:** CODE_REVIEW_REPORT.md  

---

## 🔴 PHASE 1: CRITIQUES (Semaine 1) - BLOQUANTS APP STORE

### ✅ Task 1.1: Webhooks GDPR
**Priorité:** 🔴 CRITIQUE - BLOQUANT  
**Temps estimé:** 4 heures  
**Fichiers à créer:**
- `src/routes/compliance.ts` ✅ À créer
- `src/services/gdpr.service.ts` ✅ À créer

**Actions:**
- [x] Créer route `/webhooks/compliance/customers/data_request`
- [x] Créer route `/webhooks/compliance/customers/redact`
- [x] Créer route `/webhooks/compliance/shop/redact`
- [ ] Tester avec Shopify Partner Dashboard
- [ ] Documenter dans README

**Statut:** 🟡 En attente d'implémentation

---

### ✅ Task 1.2: Privacy Policy & Terms of Service
**Priorité:** 🔴 CRITIQUE - BLOQUANT  
**Temps estimé:** 2 heures  
**Fichiers à créer:**
- `src/routes/legal.ts` ✅ À créer

**Actions:**
- [x] Créer page `/privacy`
- [x] Créer page `/terms`
- [ ] Vérifier conformité RGPD/CCPA
- [ ] Configurer URL dans Shopify Partner Dashboard

**Statut:** 🟡 En attente d'implémentation

---

### ✅ Task 1.3: Chiffrement des Access Tokens
**Priorité:** 🔴 CRITIQUE  
**Temps estimé:** 3 heures  
**Fichiers à créer/modifier:**
- `src/utils/crypto.ts` ✅ À créer
- `src/services/shop.service.ts` ✅ À créer
- `.env.example` ✅ À mettre à jour

**Actions:**
- [ ] Implémenter encrypt/decrypt avec AES-256-GCM
- [ ] Générer ENCRYPTION_KEY sécurisée
- [ ] Migrer les tokens existants
- [ ] Mettre à jour les requêtes Shop

**Statut:** 🔴 Non commencé

---

### ✅ Task 1.4: Validation HMAC renforcée
**Priorité:** 🔴 CRITIQUE  
**Temps estimé:** 2 heures  
**Fichiers à modifier:**
- `src/routes/webhooks.ts` ✅ À modifier

**Actions:**
- [ ] Ajouter vérification shop actif avant validation HMAC
- [ ] Implémenter logging des tentatives invalides
- [ ] Ajouter alertes sécurité

**Statut:** 🔴 Non commencé

---

### ✅ Task 1.5: Limiter les permissions Service Role Key
**Priorité:** 🔴 CRITIQUE  
**Temps estimé:** 4 heures  
**Fichiers à modifier:**
- `src/services/stockeasy.service.ts` ✅ À modifier
- Configuration Supabase ✅ Côté StockEasy

**Actions:**
- [ ] Créer un compte de service dédié dans Supabase
- [ ] Définir les RLS policies appropriées
- [ ] Remplacer Service Role Key par API Key limitée
- [ ] Tester toutes les opérations

**Statut:** 🔴 Non commencé

---

### ✅ Task 1.6: Tests Critiques
**Priorité:** 🔴 CRITIQUE  
**Temps estimé:** 8 heures  
**Fichiers à créer:**
- `src/routes/__tests__/webhooks.spec.ts` ✅ À créer
- `src/services/__tests__/shopify.service.spec.ts` ✅ À créer
- `src/services/__tests__/stockeasy.service.spec.ts` ✅ À créer
- `src/__tests__/worker.spec.ts` ✅ À créer

**Actions:**
- [ ] Tests validation HMAC
- [ ] Tests synchronisation produits
- [ ] Tests gestion d'erreurs
- [ ] Tests GDPR webhooks
- [ ] Atteindre 80% de couverture

**Statut:** 🔴 Non commencé

---

## 🟠 PHASE 2: IMPORTANTES (Semaines 2-3)

### ✅ Task 2.1: Validation et Sanitization des Inputs
**Priorité:** 🟠 HAUTE  
**Temps estimé:** 3 heures  
**Fichiers à créer:**
- `src/utils/validators.ts` ✅ À créer
- `src/middleware/validation.ts` ✅ À créer

**Actions:**
- [ ] Créer validateSku()
- [ ] Créer validateUuid()
- [ ] Créer validateQuantity()
- [ ] Appliquer dans tous les services

**Statut:** 🔴 Non commencé

---

### ✅ Task 2.2: Sanitization des Logs
**Priorité:** 🟠 HAUTE  
**Temps estimé:** 2 heures  
**Fichiers à modifier:**
- `src/utils/logger.ts` ✅ À modifier

**Actions:**
- [ ] Implémenter sanitizeMeta()
- [ ] Filtrer les champs sensibles
- [ ] Tester avec des données réelles

**Statut:** 🔴 Non commencé

---

### ✅ Task 2.3: Rate Limiting
**Priorité:** 🟠 HAUTE  
**Temps estimé:** 2 heures  
**Fichiers à modifier:**
- `src/index.ts` ✅ À modifier
- `package.json` ✅ Ajouter express-rate-limit

**Actions:**
- [ ] Installer express-rate-limit
- [ ] Configurer limiter pour webhooks
- [ ] Configurer limiter par shop
- [ ] Tester sous charge

**Statut:** 🔴 Non commencé

---

### ✅ Task 2.4: Optimisation Requêtes N+1
**Priorité:** 🟠 HAUTE  
**Temps estimé:** 4 heures  
**Fichiers à modifier:**
- `src/worker.ts` ✅ À modifier

**Actions:**
- [ ] Refactoriser handleProductSync() avec batching
- [ ] Utiliser Prisma transactions
- [ ] Utiliser Supabase batch upsert
- [ ] Mesurer amélioration performance

**Statut:** 🔴 Non commencé

---

### ✅ Task 2.5: Cache Redis pour Shops
**Priorité:** 🟠 HAUTE  
**Temps estimé:** 3 heures  
**Fichiers à créer:**
- `src/services/cache.service.ts` ✅ À créer
- `package.json` ✅ Ajouter ioredis

**Actions:**
- [ ] Installer ioredis
- [ ] Implémenter getShopWithCache()
- [ ] Configurer TTL (5 min)
- [ ] Invalider cache sur mise à jour

**Statut:** 🔴 Non commencé

---

### ✅ Task 2.6: Gestion des Edge Cases
**Priorité:** 🟠 HAUTE  
**Temps estimé:** 6 heures  
**Fichiers à modifier:**
- `src/worker.ts` ✅ À modifier
- `src/routes/webhooks.ts` ✅ À modifier

**Actions:**
- [ ] Gérer SKU manquants avec notifications
- [ ] Implémenter handler products/delete
- [ ] Déduplication des webhooks
- [ ] Cleanup périodique WebhookEvent

**Statut:** 🔴 Non commencé

---

### ✅ Task 2.7: Circuit Breaker
**Priorité:** 🟠 HAUTE  
**Temps estimé:** 4 heures  
**Fichiers à créer:**
- `src/utils/circuit-breaker.ts` ✅ À créer

**Actions:**
- [ ] Implémenter classe CircuitBreaker
- [ ] Appliquer sur ShopifyService
- [ ] Appliquer sur StockEasyService
- [ ] Configurer alertes

**Statut:** 🔴 Non commencé

---

## 🟡 PHASE 3: MOYENNES (Semaine 4)

### ✅ Task 3.1: Timeouts HTTP
**Priorité:** 🟡 MOYENNE  
**Temps estimé:** 2 heures  

**Actions:**
- [ ] Configurer timeout Shopify API (10s)
- [ ] Configurer timeout Supabase (10s)
- [ ] Gérer AbortSignal

**Statut:** 🔴 Non commencé

---

### ✅ Task 3.2: Pagination GraphQL
**Priorité:** 🟡 MOYENNE  
**Temps estimé:** 3 heures  

**Actions:**
- [ ] Refactoriser getProduct() avec pagination
- [ ] Gérer pageInfo et cursors
- [ ] Tester avec produits > 50 variantes

**Statut:** 🔴 Non commencé

---

### ✅ Task 3.3: Index Database
**Priorité:** 🟡 MOYENNE  
**Temps estimé:** 1 heure  

**Actions:**
- [ ] Ajouter index sur Shop.isActive
- [ ] Ajouter index sur SyncLog
- [ ] Générer migration Prisma
- [ ] Appliquer en production

**Statut:** 🔴 Non commencé

---

### ✅ Task 3.4: Amélioration Gestion d'Erreurs
**Priorité:** 🟡 MOYENNE  
**Temps estimé:** 4 heures  

**Actions:**
- [ ] Ajouter try-catch dans worker handlers
- [ ] Créer SyncLog sur erreurs
- [ ] Améliorer messages d'erreur
- [ ] Standardiser error responses

**Statut:** 🔴 Non commencé

---

### ✅ Task 3.5: Monitoring Queue
**Priorité:** 🟡 MOYENNE  
**Temps estimé:** 4 heures  

**Actions:**
- [ ] Créer QueueMonitor service
- [ ] Implémenter getMetrics()
- [ ] Ajouter alertes overload
- [ ] Améliorer /health endpoint

**Statut:** 🔴 Non commencé

---

### ✅ Task 3.6: Dead Letter Queue
**Priorité:** 🟡 MOYENNE  
**Temps estimé:** 3 heures  

**Actions:**
- [ ] Créer queue shopify-sync-dlq
- [ ] Implémenter moveToDeadLetterQueue()
- [ ] Configurer retry strategy
- [ ] Créer dashboard monitoring

**Statut:** 🔴 Non commencé

---

### ✅ Task 3.7: Version API fixée
**Priorité:** 🟡 MOYENNE  
**Temps estimé:** 1 heure  

**Actions:**
- [ ] Remplacer LATEST_API_VERSION par October24
- [ ] Ajouter logger pour dépréciations
- [ ] Documenter version utilisée

**Statut:** 🔴 Non commencé

---

## 🟢 PHASE 4: MINEURES (Semaine 5)

### ✅ Task 4.1: CSP Headers
**Priorité:** 🟢 BASSE  
**Temps estimé:** 1 heure  

**Statut:** 🔴 Non commencé

---

### ✅ Task 4.2: Bulk Operations
**Priorité:** 🟢 BASSE  
**Temps estimé:** 6 heures  

**Statut:** 🔴 Non commencé

---

### ✅ Task 4.3: Connection Pooling
**Priorité:** 🟢 BASSE  
**Temps estimé:** 2 heures  

**Statut:** 🔴 Non commencé

---

### ✅ Task 4.4: Refactoring Architecture
**Priorité:** 🟢 BASSE  
**Temps estimé:** 8 heures  

**Statut:** 🔴 Non commencé

---

## 📊 MÉTRIQUES DE PROGRESSION

**Phase 1 (Critique):** 0/6 tasks (0%)  
**Phase 2 (Importante):** 0/7 tasks (0%)  
**Phase 3 (Moyenne):** 0/7 tasks (0%)  
**Phase 4 (Mineure):** 0/4 tasks (0%)  

**TOTAL:** 0/24 tasks (0%)

---

## 🎯 JALONS (MILESTONES)

- [ ] **Milestone 1:** Conformité App Store (Tasks 1.1, 1.2, 1.4) - **Deadline: J+3**
- [ ] **Milestone 2:** Sécurité renforcée (Tasks 1.3, 1.5, 2.1, 2.2) - **Deadline: J+7**
- [ ] **Milestone 3:** Tests complets (Task 1.6) - **Deadline: J+10**
- [ ] **Milestone 4:** Performance optimisée (Tasks 2.4, 2.5) - **Deadline: J+14**
- [ ] **Milestone 5:** Production-ready (Toutes les tâches HAUTE) - **Deadline: J+21**

---

## 📝 NOTES

- Les tasks CRITIQUES bloquent la soumission à l'App Store
- Les tasks HAUTES sont nécessaires pour une mise en production sécurisée
- Prévoir 1 jour de buffer pour tests d'intégration finaux
- Documenter chaque modification dans le CHANGELOG

---

**Prochaine étape:** Commencer par Task 1.1 (Webhooks GDPR)


