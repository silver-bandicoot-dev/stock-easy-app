# 3/Code Review - Claude 3.5 Sonnet

## 🔍 Workflow: Code Review et Analyse de Qualité

**Modèle:** Claude 3.5 Sonnet  
**Objectif:** Analyser le code généré, détecter les bugs, problèmes de sécurité, et améliorer la qualité

---

## 🎯 Prompt 1: Review de Sécurité et Vulnérabilités

```
Tu es un expert en sécurité applicative et code review.

CONTEXTE:
Voici le code de notre app Shopify qui synchronise les données avec StockEasy.

[COLLER LE CODE À REVIEWER ICI]

TÂCHE:
Effectue une review de sécurité complète et identifie:

1. Vulnérabilités de sécurité
   - Injection SQL ou NoSQL
   - XSS (Cross-Site Scripting)
   - CSRF (Cross-Site Request Forgery)
   - Exposition de secrets ou tokens
   - Validation d'input insuffisante
   - Authentification/autorisation défaillante

2. Gestion des secrets
   - Stockage des API keys et tokens
   - Rotation des credentials
   - Exposition dans le code ou logs
   - Variables d'environnement correctement utilisées

3. Validation des données
   - Validation des inputs utilisateur
   - Validation des webhooks (HMAC)
   - Sanitization des données
   - Gestion des types et formats

4. Conformité Shopify
   - Respect des guidelines de sécurité Shopify
   - Gestion correcte des scopes OAuth
   - Protection des données clients (RGPD/CCPA)
   - Webhooks de compliance implémentés

5. Recommandations
   - Corrections prioritaires (critiques)
   - Améliorations de sécurité
   - Best practices à suivre
   - Outils de sécurité à intégrer

Fournis un rapport détaillé avec niveau de criticité (Critical, High, Medium, Low) pour chaque problème identifié.
```

---

## 🎯 Prompt 2: Review de Performance et Optimisation

```
Tu es un expert en performance et optimisation de code.

CONTEXTE:
Voici le code de notre app Shopify qui traite des webhooks et synchronise des données.

[COLLER LE CODE À REVIEWER ICI]

TÂCHE:
Effectue une analyse de performance complète et identifie:

1. Problèmes de performance
   - Requêtes N+1 dans les boucles
   - Opérations synchrones bloquantes
   - Pas de pagination pour grandes listes
   - Absence de cache
   - Opérations coûteuses répétées

2. Optimisation des APIs
   - Utilisation de bulk operations quand possible
   - Rate limiting respecté (40 req/s Shopify)
   - Batching des requêtes
   - Réduction du nombre d'appels API

3. Gestion de la mémoire
   - Fuites mémoire potentielles
   - Gestion des grandes datasets
   - Nettoyage des ressources
   - Optimisation des structures de données

4. Base de données
   - Index manquants
   - Requêtes non optimisées
   - Transactions inutiles
   - Connexions non fermées

5. Scalabilité
   - Goulots d'étranglement
   - Points de défaillance
   - Capacité de montée en charge
   - Gestion de la charge

6. Recommandations
   - Optimisations prioritaires
   - Refactoring suggéré
   - Outils de monitoring à ajouter
   - Métriques à tracker

Fournis un rapport avec impact estimé (High, Medium, Low) et effort requis pour chaque optimisation.
```

---

## 🎯 Prompt 3: Review de Qualité de Code et Best Practices

```
Tu es un expert en qualité de code et architecture logicielle.

CONTEXTE:
Voici le code de notre app Shopify développée avec React Router et TypeScript.

[COLLER LE CODE À REVIEWER ICI]

TÂCHE:
Effectue une review de qualité de code complète et identifie:

1. Architecture et structure
   - Séparation des responsabilités (SRP)
   - Couplage et cohésion
   - Organisation des fichiers et dossiers
   - Patterns utilisés correctement

2. Qualité du code
   - Noms de variables/fonctions clairs
   - Complexité cyclomatique
   - Duplication de code (DRY)
   - Longueur des fonctions/classes
   - Commentaires et documentation

3. Gestion d'erreurs
   - Try-catch appropriés
   - Messages d'erreur utiles
   - Logging des erreurs
   - Gestion des cas limites
   - Retry logic correct

4. Tests
   - Couverture de tests
   - Qualité des tests
   - Tests manquants
   - Mocks et fixtures
   - Tests d'intégration

5. Conformité aux standards
   - ESLint/Prettier
   - TypeScript strict mode
   - Shopify coding standards
   - React best practices
   - GraphQL best practices

6. Maintenabilité
   - Code facile à comprendre
   - Facile à modifier
   - Documentation suffisante
   - Dépendances à jour

7. Recommandations
   - Refactoring prioritaire
   - Améliorations de structure
   - Code smells à corriger
   - Patterns à adopter

Fournis un rapport détaillé avec exemples de code avant/après pour les améliorations suggérées.
```

---

## 🎯 Prompt 4: Review de Logique Métier et Edge Cases

```
Tu es un expert en logique métier et gestion de cas limites.

CONTEXTE:
Voici le code de synchronisation entre Shopify et StockEasy.

[COLLER LE CODE À REVIEWER ICI]

TÂCHE:
Effectue une analyse de la logique métier et identifie:

1. Bugs potentiels
   - Conditions race
   - Gestion des valeurs null/undefined
   - Division par zéro
   - Overflow/underflow
   - Logique conditionnelle incorrecte

2. Edge cases non gérés
   - Produits supprimés
   - SKU manquants ou invalides
   - Conflits de synchronisation
   - Données corrompues
   - Timeouts et erreurs réseau
   - Rate limits atteints

3. Logique de synchronisation
   - Gestion des conflits (qui gagne?)
   - Idempotence des opérations
   - Ordre des opérations
   - Transactions atomiques
   - Rollback en cas d'erreur

4. Validation des données
   - Formats de données incorrects
   - Champs obligatoires manquants
   - Valeurs hors limites
   - Types de données incorrects
   - Données incohérentes

5. Scénarios d'échec
   - Que se passe-t-il si Shopify API est down?
   - Que se passe-t-il si StockEasy API est down?
   - Que se passe-t-il si la DB est inaccessible?
   - Que se passe-t-il si un webhook arrive en double?
   - Que se passe-t-il si la queue est pleine?

6. Tests de cas limites
   - Tests à ajouter
   - Scénarios à tester
   - Données de test à créer

7. Recommandations
   - Corrections de bugs prioritaires
   - Gestion d'edge cases à ajouter
   - Améliorations de robustesse
   - Tests supplémentaires nécessaires

Fournis un rapport avec exemples concrets de bugs et solutions proposées.
```

---

## 🎯 Prompt 5: Review de Conformité Shopify et Intégration

```
Tu es un expert en développement d'apps Shopify et intégrations.

CONTEXTE:
Voici le code de notre app Shopify qui doit être publiée sur l'App Store.

[COLLER LE CODE À REVIEWER ICI]

TÂCHE:
Effectue une review de conformité Shopify complète et identifie:

1. Conformité aux requirements App Store
   - Scopes correctement demandés
   - Webhooks de compliance (customers/data_request, customers/redact, shop/redact)
   - Privacy policy accessible
   - Terms of Service
   - Support contact configuré

2. Utilisation correcte des APIs
   - GraphQL Admin API utilisée correctement
   - Rate limits respectés
   - Gestion des versions d'API
   - Pagination correcte
   - Bulk operations utilisées quand approprié

3. Webhooks
   - Validation HMAC correcte
   - Gestion des webhooks dupliqués
   - Réponses correctes (200, 429, etc.)
   - Retry logic pour échecs
   - Logging approprié

4. OAuth et authentification
   - Flow OAuth correct
   - Stockage sécurisé des tokens
   - Refresh tokens gérés
   - Gestion de l'expiration
   - Déconnexion propre

5. UI/UX dans Shopify Admin
   - Utilisation de Polaris components
   - Design cohérent avec Shopify
   - Accessibilité (a11y)
   - Responsive design
   - Loading states et erreurs

6. Performance
   - Temps de chargement acceptable
   - Pas de requêtes inutiles
   - Cache utilisé correctement
   - Optimisation des assets

7. Recommandations
   - Corrections pour conformité
   - Améliorations pour review App Store
   - Checklist avant soumission
   - Points d'attention pour reviewers

Fournis un rapport avec checklist de conformité et corrections nécessaires avant soumission App Store.
```

---

## 📝 Notes d'Utilisation

1. **Copie le code à reviewer** dans le prompt (remplace [COLLER LE CODE ICI])
2. **Utilise Claude 3.5 Sonnet** pour cette étape (meilleure détection de bugs)
3. **Priorise les issues critiques** identifiées
4. **Corrige les problèmes** avant de passer aux tests
5. **Documente les décisions** si tu ignores certaines recommandations

---

## ✅ Checklist de Validation

Après chaque review, vérifie que:
- [ ] Tous les problèmes critiques sont corrigés
- [ ] Les problèmes de sécurité sont résolus
- [ ] La performance est acceptable
- [ ] Le code suit les best practices
- [ ] La conformité Shopify est respectée

---

## 🎯 Workflow Recommandé

1. **Génère le code** avec Gemini 3 Pro (workflow 2)
2. **Review avec Claude** (ce workflow)
3. **Corrige les problèmes** identifiés
4. **Re-review** si changements majeurs
5. **Passe aux tests** (workflow 4)

---

*Workflow créé le: 2025-01-27*


















