# 4/Tests - Gemini 3 Pro + Claude

## 🧪 Workflow: Génération et Review de Tests

**Modèles:** Gemini 3 Pro (génération) + Claude 3.5 Sonnet (review)  
**Objectif:** Créer une suite de tests complète et robuste pour l'app Shopify

---

## 🎯 Prompt 1 (Gemini 3 Pro): Tests Unitaires des Services

```
Tu es un expert en tests unitaires et TDD (Test-Driven Development).

CONTEXTE:
Nous avons développé une app Shopify avec ces services principaux:
- shopify.service.ts: Client GraphQL Shopify
- stockeasy.service.ts: Client API StockEasy
- sync.service.ts: Service de synchronisation produits
- mapping.service.ts: Service de mapping de données

TÂCHE:
Génère une suite complète de tests unitaires qui inclut:

1. Tests pour shopify.service.ts
   - Test: récupération d'un produit par ID
   - Test: création d'un produit
   - Test: mise à jour d'un produit
   - Test: gestion des erreurs (rate limit, network error)
   - Test: retry logic
   - Mocks: GraphQL client, responses

2. Tests pour stockeasy.service.ts
   - Test: récupération d'un produit par SKU
   - Test: création d'un produit
   - Test: mise à jour d'un produit
   - Test: gestion des erreurs
   - Mocks: Supabase client, responses

3. Tests pour mapping.service.ts
   - Test: mapShopifyToStockEasy (produit simple)
   - Test: mapShopifyToStockEasy (produit avec variantes)
   - Test: mapStockEasyToShopify
   - Test: gestion des champs manquants
   - Test: validation des données

4. Tests pour sync.service.ts
   - Test: syncProductFromShopify (succès)
   - Test: syncProductFromShopify (erreur)
   - Test: syncProductToShopify (succès)
   - Test: syncProductToShopify (erreur)
   - Test: gestion des conflits
   - Test: idempotence

5. Configuration de test
   - Setup Vitest ou Jest
   - Mocks globaux
   - Fixtures de données
   - Helpers de test

Fournis le code complet des tests avec:
- Arrange-Act-Assert pattern
- Descriptions claires
- Coverage > 80%
- Tests isolés et indépendants
```

---

## 🎯 Prompt 2 (Gemini 3 Pro): Tests d'Intégration Webhooks

```
Tu es un expert en tests d'intégration et webhooks.

CONTEXTE:
Nous avons des handlers de webhooks Shopify:
- /webhooks/products/create
- /webhooks/products/update
- /webhooks/inventory/update
- /webhooks/orders/create

TÂCHE:
Génère une suite complète de tests d'intégration qui inclut:

1. Tests pour products/create webhook
   - Test: traitement webhook valide
   - Test: validation HMAC correcte
   - Test: rejet webhook HMAC invalide
   - Test: ajout à la queue
   - Test: réponse 200 à Shopify
   - Test: gestion d'erreur (queue full)

2. Tests pour products/update webhook
   - Test: traitement update valide
   - Test: détection des changements
   - Test: debouncing des updates fréquents
   - Test: sync déclenchée correctement

3. Tests pour inventory/update webhook
   - Test: traitement update inventaire
   - Test: sync immédiate vers StockEasy
   - Test: batching de multiples updates

4. Tests pour orders/create webhook
   - Test: traitement nouvelle commande
   - Test: extraction des line items
   - Test: mise à jour ventes StockEasy
   - Test: déclenchement recalcul prévisions

5. Tests de la queue
   - Test: ajout de job à la queue
   - Test: traitement d'un job
   - Test: retry en cas d'échec
   - Test: dead letter queue
   - Test: priorité des jobs

6. Setup d'intégration
   - Mock Shopify webhook server
   - Mock StockEasy API
   - Test database
   - Queue en mode test

Fournis le code complet avec:
- Tests end-to-end
- Mocks appropriés
- Données de test réalistes
- Assertions complètes
```

---

## 🎯 Prompt 3 (Gemini 3 Pro): Tests E2E de Synchronisation

```
Tu es un expert en tests end-to-end et scénarios utilisateur.

CONTEXTE:
Notre app Shopify synchronise les produits bidirectionnellement entre Shopify et StockEasy.

TÂCHE:
Génère une suite complète de tests E2E qui inclut:

1. Scénario: Synchronisation initiale Shopify → StockEasy
   - Setup: Produit créé sur Shopify
   - Action: Webhook products/create reçu
   - Vérification: Produit créé dans StockEasy
   - Vérification: Mapping stocké en DB
   - Vérification: Statut sync = "completed"

2. Scénario: Mise à jour produit Shopify → StockEasy
   - Setup: Produit déjà synchronisé
   - Action: Modification prix sur Shopify
   - Action: Webhook products/update reçu
   - Vérification: Prix mis à jour dans StockEasy
   - Vérification: Timestamp updated_at mis à jour

3. Scénario: Mise à jour stock StockEasy → Shopify
   - Setup: Produit synchronisé
   - Action: Stock modifié dans StockEasy
   - Action: Sync manuelle déclenchée
   - Vérification: Inventory mis à jour sur Shopify
   - Vérification: Pas de doublon créé

4. Scénario: Gestion de conflit
   - Setup: Produit modifié simultanément sur Shopify et StockEasy
   - Action: Sync bidirectionnelle déclenchée
   - Vérification: Conflit détecté
   - Vérification: Stratégie de résolution appliquée
   - Vérification: Log de conflit créé

5. Scénario: Erreur et récupération
   - Setup: StockEasy API down
   - Action: Webhook reçu
   - Vérification: Job ajouté à queue
   - Action: StockEasy API back online
   - Vérification: Retry réussi
   - Vérification: Sync complétée

6. Scénario: Rate limiting
   - Setup: Beaucoup de webhooks reçus rapidement
   - Action: Traitement des webhooks
   - Vérification: Rate limit respecté
   - Vérification: Jobs mis en queue
   - Vérification: Traitement progressif

7. Setup E2E
   - Configuration Playwright ou Cypress
   - Environnement de test isolé
   - Données de test
   - Cleanup après tests

Fournis le code complet avec:
- Scénarios réalistes
- Assertions complètes
- Gestion des timeouts
- Logs de debug
```

---

## 🎯 Prompt 4 (Claude 3.5 Sonnet): Review des Tests Générés

```
Tu es un expert en qualité de tests et assurance qualité.

CONTEXTE:
Voici la suite de tests générée pour notre app Shopify.

[COLLER LES TESTS À REVIEWER ICI]

TÂCHE:
Effectue une review complète des tests et identifie:

1. Couverture de tests
   - Fonctions non testées
   - Edge cases manquants
   - Scénarios d'erreur non couverts
   - Cas limites oubliés

2. Qualité des tests
   - Tests trop complexes ou fragiles
   - Dépendances entre tests
   - Mocks inappropriés
   - Assertions insuffisantes
   - Données de test non réalistes

3. Maintenabilité
   - Duplication de code
   - Helpers manquants
   - Setup/teardown corrects
   - Fixtures réutilisables
   - Organisation des tests

4. Performance des tests
   - Tests trop lents
   - Opérations asynchrones mal gérées
   - Timeouts appropriés
   - Parallélisation possible

5. Best practices
   - Naming conventions
   - Structure AAA (Arrange-Act-Assert)
   - Isolation des tests
   - Tests indépendants
   - Documentation des tests

6. Améliorations
   - Tests à ajouter
   - Tests à refactorer
   - Patterns à adopter
   - Outils à utiliser

Fournis un rapport détaillé avec:
- Liste des tests manquants
- Exemples de refactoring
- Recommandations prioritaires
- Score de qualité estimé
```

---

## 🎯 Prompt 5 (Gemini 3 Pro): Tests de Performance et Charge

```
Tu es un expert en tests de performance et charge.

CONTEXTE:
Notre app Shopify doit gérer des milliers de produits et des webhooks fréquents.

TÂCHE:
Génère une suite de tests de performance qui inclut:

1. Tests de charge webhooks
   - Test: 100 webhooks simultanés
   - Test: 1000 webhooks en 1 minute
   - Test: Traitement sans perte de données
   - Test: Temps de réponse acceptable
   - Métriques: Throughput, latency, error rate

2. Tests de synchronisation batch
   - Test: Sync de 1000 produits
   - Test: Sync de 10000 produits
   - Test: Temps d'exécution
   - Test: Utilisation mémoire
   - Test: Rate limiting respecté

3. Tests de base de données
   - Test: Requêtes lentes
   - Test: Index manquants
   - Test: Connexions DB
   - Test: Queries N+1
   - Métriques: Query time, connections

4. Tests de queue
   - Test: Queue avec 10000 jobs
   - Test: Traitement parallèle
   - Test: Memory usage
   - Test: Throughput
   - Métriques: Jobs/second, latency

5. Tests de montée en charge
   - Test: Charge progressive (ramp-up)
   - Test: Charge constante
   - Test: Pic de charge
   - Test: Récupération après charge
   - Identification des goulots d'étranglement

6. Configuration
   - Setup k6 ou Artillery
   - Scénarios de charge
   - Métriques à collecter
   - Seuils de performance

7. Recommandations
   - Optimisations identifiées
   - Seuils à définir
   - Monitoring à mettre en place

Fournis le code complet avec:
- Scripts de test de charge
- Configuration des métriques
- Seuils de performance
- Rapports de résultats
```

---

## 📝 Notes d'Utilisation

### Workflow Recommandé:

1. **Génère les tests** avec Gemini 3 Pro (Prompts 1, 2, 3, 5)
2. **Review les tests** avec Claude 3.5 Sonnet (Prompt 4)
3. **Corrige et améliore** selon les recommandations
4. **Exécute les tests** et vérifie la couverture
5. **Itère** jusqu'à coverage > 80%

### Ordre d'Exécution:

1. Prompt 1: Tests unitaires (Gemini)
2. Prompt 2: Tests intégration (Gemini)
3. Prompt 3: Tests E2E (Gemini)
4. Prompt 4: Review (Claude) ← Important!
5. Prompt 5: Tests performance (Gemini)

---

## ✅ Checklist de Validation

Après génération des tests, vérifie:
- [ ] Coverage > 80%
- [ ] Tous les services testés
- [ ] Edge cases couverts
- [ ] Tests passent en isolation
- [ ] Mocks appropriés
- [ ] Assertions claires
- [ ] Performance acceptable

---

*Workflow créé le: 2025-01-27*











