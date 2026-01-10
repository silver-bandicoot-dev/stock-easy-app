# Guide de Soumission à l'Shopify App Store - StockEasy

**Date de création:** 3 janvier 2025  
**Version:** 1.0  
**Statut:** Guide de référence

---

## 📋 Résumé Exécutif

Ce guide détaille toutes les étapes nécessaires pour soumettre l'application StockEasy à l'Shopify App Store. Il s'appuie sur la documentation officielle Shopify et le rapport de conformité du projet.

---

## ✅ 1. Exigences Techniques (Déjà Complétées)

D'après le rapport de conformité, les éléments suivants sont **déjà validés** :

| Élément | Statut | Détails |
|---------|--------|---------|
| **Billing API** | ✅ | Implémenté (29$/mois, 14 jours d'essai gratuit) |
| **Webhooks GDPR** | ✅ | `customers/data_request`, `customers/redact`, `shop/redact` |
| **Application Embedded** | ✅ | Configuré dans `shopify.app.toml` |
| **App Bridge** | ✅ | v4.2.3 intégré |
| **OAuth/Authentication** | ✅ | Session tokens + Multi-tenant protection |
| **Navigation App Home** | ✅ | Configuré avec `ui-nav-menu` |
| **Polaris Components** | ✅ | v13.8.0 utilisé |
| **API Version** | ✅ | 2025-10 |
| **Uninstall Handler** | ✅ | Implémenté avec nettoyage |
| **Cross-Shop Data Protection** | ✅ | `preventCrossShopDataAccess` actif |
| **HTTPS/TLS** | ✅ | Certificats SSL valides (Gadget) |
| **Permissions/Access Scopes** | ✅ | Configurés dans `settings.gadget.ts` |

---

## 🔴 2. Tests Pré-soumission (À FAIRE)

### 2.1 Installation sur Development Store

**Objectif:** Vérifier que l'installation fonctionne sans erreurs.

**Étapes:**

1. Créer ou utiliser un development store de test
2. Dans Partner Dashboard → Apps → StockEasy → **Test your app** → **Select store**
3. Sélectionner le development store
4. Cliquer sur **Install app**
5. Vérifier que l'écran OAuth de consentement s'affiche correctement

**Vérifications:**
- [ ] L'écran OAuth s'affiche immédiatement après installation
- [ ] Les permissions demandées sont correctes
- [ ] L'app redirige vers l'interface après autorisation
- [ ] Aucune erreur fatale n'apparaît

### 2.2 Test du Flow OAuth

**Objectif:** S'assurer que les URLs et redirections fonctionnent.

**Étapes:**

1. Aller dans Partner Dashboard → Apps → StockEasy → **Configuration**
2. Vérifier la section **URLs** :
   - App URL
   - Allowed redirection URLs
3. Tester chaque URL manuellement

**Vérifications:**
- [ ] App URL redirige vers l'écran OAuth
- [ ] Les redirections fonctionnent correctement
- [ ] Aucune erreur 404, 500, ou 300

### 2.3 Test du Système de Billing

**Objectif:** Vérifier que le billing fonctionne de bout en bout.

**⚠️ IMPORTANT:** Utiliser `"test": true` pendant les tests pour éviter les charges réelles.

**Tests à effectuer:**

1. **Installation avec essai gratuit:**
   - [ ] L'essai gratuit de 14 jours démarre correctement
   - [ ] Le statut `subscriptionStatus` est défini à `"trial"`

2. **Activation de l'abonnement:**
   - [ ] Le callback billing fonctionne après paiement
   - [ ] Le statut passe à `"active"`
   - [ ] Les webhooks `APP_SUBSCRIPTIONS_UPDATE` sont reçus

3. **Changement de plan:**
   - [ ] Le passage d'un plan à un autre fonctionne
   - [ ] Les fonctionnalités s'ajustent selon le plan

4. **Annulation:**
   - [ ] L'annulation fonctionne correctement
   - [ ] Le statut passe à `"cancelled"`
   - [ ] L'accès reste actif jusqu'à la fin de la période payée

**⚠️ AVANT SOUMISSION:** Changer tous les `"test": true` en `"test": false` !

### 2.4 Test de Réinstallation

**Objectif:** Vérifier qu'un marchand peut réinstaller l'app après désinstallation.

**Étapes:**

1. Installer l'app sur un dev store
2. Désinstaller l'app
3. Réinstaller l'app

**Vérifications:**
- [ ] La réinstallation fonctionne sans erreur
- [ ] Les données précédentes sont gérées correctement (ou nettoyées)
- [ ] Le flow OAuth fonctionne à nouveau

### 2.5 Test des Webhooks GDPR

**Objectif:** Vérifier que les webhooks de conformité répondent correctement.

**Webhooks à tester:**

1. **customers/data_request:**
   ```bash
   # Utiliser Shopify CLI pour tester
   shopify app generate webhook
   ```
   - [ ] Le webhook retourne un code 200
   - [ ] Les données client sont correctement identifiées
   - [ ] L'action est complétée dans les 30 jours

2. **customers/redact:**
   - [ ] Le webhook retourne un code 200
   - [ ] Les données client sont supprimées/anonymisées

3. **shop/redact:**
   - [ ] Le webhook retourne un code 200 (48h après désinstallation)
   - [ ] Toutes les données du shop sont supprimées

**Vérifications:**
- [ ] Tous les webhooks vérifient le HMAC Shopify
- [ ] Les webhooks retournent 401 si HMAC invalide
- [ ] Les webhooks gèrent correctement les erreurs

---

## 🟠 3. Assets Visuels (À PRÉPARER)

### 3.1 Icône de Navigation (16x16 SVG)

**Exigence:** Icône pour l'app embedded dans la navigation Shopify admin.

**Spécifications:**
- Format: SVG uniquement
- Dimensions: 16x16 pixels
- Couleur: Monochrome avec fond transparent
- Poids maximum: < 2KB
- Tags SVG autorisés: `circle`, `ellipse`, `g`, `line`, `path`, `rect`, `svg`, `title`
- Interdits: `image`, `script`, `style`, `foreignObject`

**Où l'uploader:**
- Partner Dashboard → Apps → StockEasy → **Configuration**
- Section **App icon** (navigation)

### 3.2 Icône App Store (1200x1200)

**Exigence:** Icône principale pour le listing de l'App Store.

**Spécifications:**
- Format: JPEG ou PNG
- Dimensions: 1200x1200 pixels (ratio 1:1)
- Pas de texte dans l'icône
- Coins carrés (arrondis automatiquement par Shopify)
- Padding autour du logo recommandé
- Fond transparent ou solide

**Où l'uploader:**
- Partner Dashboard → Apps → StockEasy → **App Store Review**
- Section **App icon**

### 3.3 Feature Image/Video (1600x900)

**Exigence:** Image ou vidéo principale pour le listing.

**Spécifications:**
- Dimensions: 1600x900 pixels (ratio 16:9)
- Format image: JPEG ou PNG
- Format vidéo: MP4 (optionnel, recommandé)
- Montre la fonctionnalité principale de l'app
- Design professionnel et attrayant

**Où l'uploader:**
- Partner Dashboard → Apps → StockEasy → **App Store Review**
- Section **Feature media**

### 3.4 Screenshots (3-6 images)

**Exigence:** Captures d'écran montrant les fonctionnalités clés.

**Spécifications:**
- Nombre: 3 à 6 images
- Dimensions: 1600x900 pixels (ratio 16:9)
- Format: JPEG ou PNG
- Montrent différentes fonctionnalités:
  1. Dashboard principal
  2. Synchronisation des stocks
  3. Gestion des commandes fournisseurs
  4. Prédictions IA
  5. Rapports avancés
  6. Configuration des paramètres

**Où l'uploader:**
- Partner Dashboard → Apps → StockEasy → **App Store Review**
- Section **Screenshots**

---

## 🟡 4. Listing App Store (À COMPLÉTER)

Accédez à: **https://partners.shopify.com** → Apps → StockEasy → **App Store Review**

### 4.1 Informations de Base

- [ ] **Nom de l'app:** StockEasy (ou variante approuvée)
- [ ] **Langue principale:** Français (ou Anglais)
- [ ] **Catégorie:** Inventory management / Operations

### 4.2 Description de l'App

**Introduction (court résumé):**
```
StockEasy est une application de gestion d'inventaire intelligente qui synchronise automatiquement vos stocks Shopify avec vos commandes fournisseurs. Utilisez l'IA pour prédire vos besoins en stock et optimiser vos commandes.
```

**Détails complets (description longue):**
```
StockEasy révolutionne la gestion de votre inventaire en automatisant la synchronisation entre Shopify et vos fournisseurs. 

FONCTIONNALITÉS PRINCIPALES:

✅ Synchronisation en temps réel avec Shopify
✅ Gestion complète des commandes fournisseurs
✅ Prédictions IA pour optimiser vos stocks
✅ Dashboard complet avec indicateurs clés
✅ Rapports avancés et analyses détaillées
✅ Support multi-emplacements

L'app utilise des algorithmes d'apprentissage automatique pour analyser vos habitudes de vente et vous recommander les quantités optimales à commander à vos fournisseurs, réduisant ainsi les ruptures de stock et les surstocks.
```

### 4.3 Tarification

- [ ] Plan Basic: 29$/mois (14 jours d'essai gratuit)
- [ ] Décrire clairement ce qui est inclus dans chaque plan
- [ ] Vérifier que la tarification correspond exactement au code

### 4.4 URL de Politique de Confidentialité

**⚠️ OBLIGATOIRE:** L'URL doit être accessible publiquement.

- [ ] Créer/publier une politique de confidentialité
- [ ] Ajouter l'URL dans le listing
- [ ] Vérifier que l'URL fonctionne et est accessible

**Exemple d'URL:** `https://stockeasy-app.gadget.app/privacy-policy`

### 4.5 Informations de Contact

- [ ] **Email de support:** Support email pour les marchands
- [ ] **Email de soumission:** Email pour les communications Shopify (app-submissions@shopify.com)
- [ ] **Contact développeur d'urgence:**
  - Email: [votre email]
  - Téléphone: [votre téléphone]

**⚠️ IMPORTANT:** Ajouter ces emails à votre liste d'expéditeurs autorisés:
- `app-submissions@shopify.com`
- `noreply@shopify.com`
- `app-audits@shopify.com`

### 4.6 Fonctionnalités Clés (Features)

Liste des fonctionnalités à mettre en avant:
- [ ] Synchronisation automatique Shopify
- [ ] Gestion des commandes fournisseurs
- [ ] Prédictions IA
- [ ] Dashboard analytics
- [ ] Rapports personnalisables
- [ ] Support multi-emplacements (selon plan)

---

## 📝 5. Instructions de Test pour les Reviewers

### 5.1 Screencast de Démonstration

**Objectif:** Montrer comment l'app fonctionne en 2-3 minutes.

**Contenu à inclure:**
1. Installation de l'app (20 secondes)
2. Configuration initiale (30 secondes)
3. Synchronisation des stocks (30 secondes)
4. Création d'une commande fournisseur (30 secondes)
5. Visualisation des prédictions IA (30 secondes)
6. Consultation du dashboard (30 secondes)

**Format:** Vidéo MP4, 2-3 minutes maximum, haute qualité

### 5.2 Instructions Pas-à-Pas

Créer un document avec les étapes suivantes:

```
INSTRUCTIONS POUR LES REVIEWERS - StockEasy

1. INSTALLATION
   - Cliquer sur "Install app" depuis le Partner Dashboard
   - Autoriser les permissions demandées
   - Vérifier que l'app se charge sans erreur

2. CONFIGURATION INITIALE
   - Aller dans Settings → Configuration
   - Renseigner les informations du fournisseur (test)
   - Activer la synchronisation Shopify

3. TEST DE SYNCHRONISATION
   - Créer un produit test dans Shopify
   - Vérifier qu'il apparaît dans StockEasy
   - Modifier le stock dans Shopify
   - Vérifier que la modification est détectée

4. TEST DE COMMANDE FOURNISSEUR
   - Aller dans Commandes → Nouvelle commande
   - Sélectionner des produits
   - Générer la commande
   - Vérifier que la commande est créée

5. TEST DES PRÉDICTIONS
   - Aller dans Forecast
   - Vérifier que les prédictions s'affichent
   - Consulter les recommandations IA

6. TEST DU BILLING
   - Vérifier que l'essai gratuit est actif
   - Tester le flow d'activation (avec test: true)
   - Vérifier que l'abonnement se crée correctement

7. TEST DES WEBHOOKS GDPR
   - Utiliser Shopify CLI pour déclencher les webhooks
   - Vérifier que les webhooks répondent avec 200
```

### 5.3 Credentials de Test

Si nécessaire, fournir:
- [ ] Development store de test
- [ ] Compte de test (si requis)
- [ ] Données d'exemple

---

## 🚀 6. Processus de Soumission

### 6.1 Préparation

Avant de soumettre:

1. ✅ Tous les tests pré-soumission sont passés
2. ✅ Tous les assets visuels sont prêts
3. ✅ Le listing est complété
4. ✅ Les instructions de test sont rédigées
5. ✅ Le billing est configuré avec `test: false`
6. ✅ Les webhooks GDPR fonctionnent

### 6.2 Vérifications Automatiques

Sur la page **App Store Review**, Shopify exécute des vérifications automatiques:

1. Cliquer sur **Run automated checks**
2. Corriger toutes les erreurs identifiées
3. Relancer les vérifications jusqu'à ce qu'elles passent toutes

**Vérifications courantes:**
- URLs valides et accessibles
- Webhooks configurés correctement
- Icônes aux bonnes dimensions
- Politique de confidentialité accessible

### 6.3 Soumission

Une fois toutes les vérifications passées:

1. Revoir toutes les informations du listing
2. Vérifier que tout est correct
3. Cliquer sur **Submit your app**
4. Confirmer la soumission

**⚠️ ATTENTION:** 
- Ne soumettez pas une app incomplète ou beta
- Assurez-vous que tous les éléments sont en production
- Vérifiez que `test: false` est configuré dans le billing

---

## ⏱️ 7. Timeline et Processus de Review

### 7.1 Timeline Estimée

| Phase | Durée Estimée | Statut |
|-------|---------------|--------|
| Tests pré-soumission | 1-2 jours | ⏳ À faire |
| Préparation assets visuels | 2-3 jours | ⏳ À faire |
| Compléter le listing | 1 jour | ⏳ À faire |
| **Soumission** | - | ⏳ À faire |
| **Review Shopify** | 5-10 jours ouvrables | ⏳ En attente |

### 7.2 Statuts de Review

Pendant le processus de review, votre app passera par plusieurs statuts:

1. **Draft** → Statut initial, corrections nécessaires
2. **Submitted** → Soumise, en attente de review
3. **Paused** → Problèmes critiques identifiés, corrections requises
4. **Reviewed** → Review en cours, échanges avec reviewer
5. **Published** → ✅ Approuvée et publiée sur l'App Store

### 7.3 Communications

**Emails à surveiller:**
- Confirmation de soumission
- Demandes de clarification
- Résultat de la review

**⚠️ IMPORTANT:** Répondre rapidement (sous 7 jours) aux demandes du reviewer pour éviter les suspensions.

---

## ⚠️ 8. Points d'Attention Critiques

### 8.1 Erreurs Communes à Éviter

| Erreur | Impact | Solution |
|--------|--------|----------|
| App incomplète/beta | Rejet immédiat | Tester complètement avant soumission |
| Billing avec `test: true` | Marchands non facturés | Vérifier `test: false` en production |
| Webhooks GDPR non fonctionnels | Rejet | Tester tous les webhooks |
| URLs invalides | Rejet | Vérifier toutes les URLs |
| Politique de confidentialité manquante | Bloquant | Publier avant soumission |
| Pas de réponse au reviewer (> 7 jours) | Suspension | Surveiller les emails quotidiennement |

### 8.2 Suspensions Temporaires

Vous pouvez être suspendu temporairement si:
- ❌ Ne pas répondre aux emails du reviewer après 2+ échanges
- ❌ Soumettre avec de nouveaux problèmes à chaque fois
- ❌ Refuser les résultats des demandes d'exemption

**Conséquence:** Suspension de la soumission, date de résoumission affichée dans le statut.

---

## 📚 9. Ressources et Documentation

### 9.1 Documentation Officielle Shopify

- [Checklist des exigences](https://shopify.dev/docs/apps/launch/app-requirements-checklist)
- [Guide de préparation à la review](https://shopify.dev/docs/apps/launch/app-store-review/pass-app-review)
- [Processus de review](https://shopify.dev/docs/apps/launch/app-store-review/review-process)
- [Soumettre votre app](https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review)
- [Billing API Documentation](https://shopify.dev/docs/apps/launch/billing)
- [Webhooks GDPR](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)

### 9.2 Documentation Interne

- [Rapport de conformité](./SHOPIFY_APP_STORE_COMPLIANCE_REPORT.md)
- [Guide d'installation testeur](./GUIDE_INSTALLATION_TESTEUR.md)
- [Status du projet](../PROJECT_STATUS.md)

### 9.3 Support

- [Partner Support](https://help.shopify.com/en/partners/about#partner-support)
- [Shopify Community Forums](https://community.shopify.dev/)

---

## ✅ 10. Checklist Finale Avant Soumission

### Technique
- [ ] Installation testée sur dev store frais
- [ ] Flow OAuth fonctionne parfaitement
- [ ] Billing testé et configuré avec `test: false`
- [ ] Tous les webhooks GDPR répondent correctement
- [ ] Réinstallation testée
- [ ] Aucune erreur fatale

### Assets
- [ ] Icône navigation 16x16 SVG uploadée
- [ ] Icône App Store 1200x1200 uploadée
- [ ] Feature image/video 1600x900 préparée
- [ ] 3-6 screenshots 1600x900 capturées

### Listing
- [ ] Description complète rédigée
- [ ] Tarification claire et exacte
- [ ] URL politique de confidentialité ajoutée
- [ ] Contacts (support + développeur) configurés
- [ ] Fonctionnalités listées

### Documentation
- [ ] Screencast de démonstration (2-3 min)
- [ ] Instructions pas-à-pas pour reviewers
- [ ] Credentials de test fournis (si nécessaire)

### Configuration
- [ ] Emails Shopify ajoutés aux expéditeurs autorisés
- [ ] Vérifications automatiques passées
- [ ] Toutes les sections complétées dans Partner Dashboard

---

## 🎯 Prochaines Étapes

1. **PRIORITÉ 1:** Effectuer tous les tests pré-soumission
2. **PRIORITÉ 2:** Préparer les assets visuels
3. **PRIORITÉ 3:** Compléter le listing App Store
4. **PRIORITÉ 4:** Créer le screencast et les instructions
5. **PRIORITÉ 5:** Lancer les vérifications automatiques
6. **PRIORITÉ 6:** Soumettre pour review

---

**Dernière mise à jour:** 3 janvier 2025  
**Prochaine révision:** Après soumission

















