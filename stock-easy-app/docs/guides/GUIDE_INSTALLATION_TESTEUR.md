# 🧪 Guide d'Installation pour Testeurs - StockEasy App

Ce guide explique comment permettre à un testeur d'installer et tester l'application StockEasy sur son store Shopify.

---

## 📋 Vue d'ensemble

L'application StockEasy est une application Shopify intégrée via Gadget. Pour permettre à un testeur d'installer l'application, vous avez **deux options** :

1. **Environnement de développement** (recommandé pour les tests)
2. **Environnement de production** (pour les tests finaux)

---

## 🎯 Option 1 : Installation via l'Environnement de Développement

### Avantages
- ✅ Idéal pour les tests et le développement
- ✅ Permet de tester les nouvelles fonctionnalités
- ✅ Ne nécessite pas de soumission à l'App Store Shopify

### Prérequis
- Le testeur doit avoir un **store Shopify de développement** (gratuit)
- Ou un store Shopify existant où il peut installer des apps de développement

### Étapes pour le Développeur

#### 1. Vérifier la configuration de développement

Assurez-vous que l'environnement de développement est configuré :

```bash
cd stockeasy-app-gadget
```

Vérifiez le fichier `shopify.app.development.toml` :
- `client_id` : ID de l'application de développement
- `application_url` : URL de l'application Gadget (dev)
- `redirect_urls` : URLs de callback configurées

#### 2. Déployer l'application de développement

```bash
# Utiliser la configuration de développement
yarn shopify:config:use:development

# Déployer l'application
yarn shopify:deploy:development
```

#### 3. Générer un lien d'installation

Vous pouvez générer un lien d'installation de deux façons :

**Méthode A : Via Shopify CLI**

```bash
# Générer un lien d'installation
shopify app generate extension

# Ou créer un lien d'installation direct
shopify app info
```

**Méthode B : Via le Partner Dashboard Shopify**

1. Allez sur [partners.shopify.com](https://partners.shopify.com)
2. Connectez-vous avec votre compte Shopify Partner
3. Allez dans **Apps** → Sélectionnez votre app de développement
4. Allez dans **Test your app**
5. Copiez le **Installation URL**

Le lien ressemblera à :
```
https://partners.shopify.com/[PARTNER_ID]/apps/[APP_ID]/test
```

#### 4. Partager le lien avec le testeur

Envoyez au testeur :
- Le lien d'installation
- Les instructions ci-dessous (section "Pour le Testeur")

---

## 🎯 Option 2 : Installation via l'Environnement de Production

### Avantages
- ✅ Environnement stable et final
- ✅ Prêt pour la production

### Prérequis
- L'application doit être déployée en production
- L'application doit être publiée ou partagée avec le testeur

### Étapes pour le Développeur

#### 1. Vérifier la configuration de production

```bash
cd stockeasy-app-gadget
```

Vérifiez le fichier `shopify.app.toml` :
- `client_id` : ID de l'application de production
- `application_url` : URL de l'application Gadget (production)

#### 2. Déployer l'application en production

```bash
# Utiliser la configuration de production
yarn shopify:config:use:production

# Déployer l'application
yarn shopify:deploy:production
```

#### 3. Générer un lien d'installation

**Via le Partner Dashboard Shopify** :

1. Allez sur [partners.shopify.com](https://partners.shopify.com)
2. Connectez-vous avec votre compte Shopify Partner
3. Allez dans **Apps** → Sélectionnez votre app de production
4. Si l'app est publiée : le testeur peut l'installer depuis l'App Store
5. Si l'app est privée : créez un lien de partage dans les paramètres de l'app

---

## 👤 Pour le Testeur : Instructions d'Installation

### Étape 1 : Préparer votre Store Shopify

1. **Créer un store de développement** (si vous n'en avez pas) :
   - Allez sur [partners.shopify.com](https://partners.shopify.com)
   - Créez un compte Partner (gratuit)
   - Créez un store de développement

2. **Ou utiliser un store existant** :
   - Assurez-vous d'avoir les permissions d'administrateur
   - Note : L'installation d'une app de développement peut nécessiter des permissions spéciales

### Étape 2 : Installer l'Application

1. **Cliquez sur le lien d'installation** fourni par le développeur

2. **Connectez-vous** à votre store Shopify si nécessaire

3. **Autorisez l'application** :
   - Lisez les permissions demandées
   - Cliquez sur **"Installer l'application"** ou **"Install app"**

4. **Attendez la redirection** :
   - Vous serez redirigé vers l'application StockEasy
   - La première installation peut prendre quelques secondes

### Étape 3 : Vérifier l'Installation

Une fois installée, vous devriez :

- ✅ Voir l'application dans votre admin Shopify (Apps → StockEasy)
- ✅ Pouvoir accéder à l'interface StockEasy
- ✅ Voir vos produits Shopify synchronisés

### Étape 4 : Première Utilisation

1. **Synchronisation initiale** :
   - L'application va synchroniser vos produits et commandes
   - Cela peut prendre quelques minutes selon le nombre de produits

2. **Configuration** :
   - Configurez vos paramètres de base
   - Ajoutez vos fournisseurs
   - Configurez vos entrepôts

3. **Test des fonctionnalités** :
   - Testez la gestion des stocks
   - Testez les prévisions ML
   - Testez la génération de commandes

---

## 🔧 Permissions Requises

L'application StockEasy nécessite les permissions suivantes :

- ✅ `read_products` - Lire les produits
- ✅ `write_products` - Modifier les produits
- ✅ `read_orders` - Lire les commandes
- ✅ `read_inventory` - Lire les niveaux de stock
- ✅ `write_inventory` - Modifier les niveaux de stock
- ✅ `write_locations` - Gérer les emplacements
- ✅ `write_orders` - Créer/modifier les commandes

Ces permissions sont nécessaires pour :
- Synchroniser les produits et stocks
- Créer des commandes de réapprovisionnement
- Mettre à jour les niveaux de stock

---

## 🐛 Dépannage

### Problème : Le lien d'installation ne fonctionne pas

**Solutions** :
1. Vérifiez que vous êtes connecté au bon compte Shopify
2. Vérifiez que vous avez les permissions d'administrateur
3. Contactez le développeur pour vérifier que l'app est bien déployée

### Problème : Erreur lors de l'installation

**Solutions** :
1. Vérifiez que votre store est actif
2. Vérifiez que vous avez un plan Shopify valide (même gratuit)
3. Essayez de vider le cache de votre navigateur
4. Contactez le développeur avec le message d'erreur exact

### Problème : L'application ne se charge pas après installation

**Solutions** :
1. Vérifiez votre connexion internet
2. Attendez quelques minutes (première synchronisation)
3. Essayez de vous déconnecter et reconnecter
4. Contactez le développeur

### Problème : Les produits ne se synchronisent pas

**Solutions** :
1. Vérifiez que vous avez des produits dans votre store
2. Attendez quelques minutes (synchronisation en cours)
3. Essayez de forcer une synchronisation depuis l'interface
4. Vérifiez les logs dans la console du navigateur (F12)

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez ce guide** pour les solutions courantes
2. **Contactez le développeur** avec :
   - Le message d'erreur exact
   - Les étapes pour reproduire le problème
   - Une capture d'écran si possible

---

## ✅ Checklist de Test

Une fois l'application installée, testez les fonctionnalités suivantes :

### Fonctionnalités de Base
- [ ] L'application se charge correctement
- [ ] Les produits sont synchronisés
- [ ] Les commandes sont synchronisées
- [ ] L'interface est responsive (mobile/desktop)

### Gestion des Stocks
- [ ] Les niveaux de stock sont corrects
- [ ] Les alertes de stock bas fonctionnent
- [ ] Les calculs de surstock sont corrects

### Prévisions ML
- [ ] Les prévisions de demande s'affichent
- [ ] Les prévisions semblent cohérentes
- [ ] Les KPIs ML sont calculés

### Commandes
- [ ] La génération de commandes fonctionne
- [ ] Les commandes sont créées dans Shopify
- [ ] Les emails de réclamation sont générés

### Paramètres
- [ ] Les paramètres peuvent être modifiés
- [ ] Les fournisseurs peuvent être ajoutés
- [ ] Les entrepôts peuvent être configurés

---

## 🔐 Sécurité et Confidentialité

- ✅ L'application respecte les politiques de Shopify
- ✅ Les données sont sécurisées et isolées par store
- ✅ Aucune donnée n'est partagée entre stores
- ✅ Les webhooks sont sécurisés

---

## 📝 Notes Importantes

1. **Environnement de développement** :
   - Les données peuvent être réinitialisées
   - Certaines fonctionnalités peuvent être en cours de développement
   - Les performances peuvent varier

2. **Environnement de production** :
   - Environnement stable et final
   - Toutes les fonctionnalités sont disponibles
   - Performances optimisées

3. **Données de test** :
   - Utilisez des données de test si possible
   - Évitez d'utiliser des données de production sensibles
   - Faites des sauvegardes si nécessaire

---

## 🎉 Prêt à Tester !

Suivez les instructions ci-dessus et commencez à tester l'application StockEasy. N'hésitez pas à faire des retours détaillés sur votre expérience !

**Dernière mise à jour** : Janvier 2025

