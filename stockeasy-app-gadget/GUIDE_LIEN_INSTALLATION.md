# 🔗 Guide Rapide : Générer un Lien d'Installation

Ce guide explique comment générer rapidement un lien d'installation pour permettre à un testeur d'installer l'application StockEasy.

---

## 🚀 Méthode Rapide (Recommandée)

### Étape 1 : Vérifier l'environnement

```bash
cd stockeasy-app-gadget

# Vérifier quelle configuration est active
yarn shopify:info
```

### Étape 2 : Utiliser l'environnement de développement

```bash
# Basculer vers la configuration de développement
yarn shopify:config:use:development

# Vérifier les informations de l'app
yarn shopify:info
```

Cela affichera :
- Le `client_id` de l'application
- L'URL de l'application
- Les informations de configuration

### Étape 3 : Générer le lien d'installation

Le lien d'installation suit ce format :

```
https://partners.shopify.com/[PARTNER_ID]/apps/[APP_ID]/test
```

**Pour obtenir le lien** :

1. Allez sur [partners.shopify.com](https://partners.shopify.com)
2. Connectez-vous avec votre compte Shopify Partner
3. Allez dans **Apps**
4. Trouvez votre app (recherchez par `client_id` ou nom)
5. Cliquez sur l'app
6. Allez dans **"Test your app"** ou **"Overview"**
7. Copiez le lien d'installation

**Alternative** : Utilisez le `client_id` pour construire le lien :

```
https://admin.shopify.com/store/[STORE_NAME]/apps/[CLIENT_ID]/install
```

---

## 📋 Informations de Configuration Actuelle

### Environnement de Développement

- **Client ID** : `3e35969018e75cd4e60e339d1318a6b9`
- **Nom** : `stockeasy-app-development`
- **URL** : `https://stockeasy-app--development.gadget.app/`

### Environnement de Production

- **Client ID** : `17cb240cc35aedce49ed32a877805a83`
- **Nom** : `stockeasy-app`
- **URL** : `https://stockeasy-app.gadget.app/api/shopify/install-or-render`

---

## 🎯 Méthode Alternative : Via Shopify CLI

### Option 1 : Générer un lien de test

```bash
# Avec la configuration de développement active
shopify app generate extension

# Ou directement
shopify app dev --reset
```

### Option 2 : Créer un lien d'installation personnalisé

```bash
# Obtenir les informations de l'app
shopify app info

# Cela affichera toutes les informations nécessaires
```

---

## 🔧 Commandes Utiles

```bash
# Basculer vers développement
yarn shopify:config:use:development

# Basculer vers production
yarn shopify:config:use:production

# Déployer en développement
yarn shopify:deploy:development

# Déployer en production
yarn shopify:deploy:production

# Voir les informations de l'app
yarn shopify:info

# Démarrer le mode développement local
yarn shopify:dev
```

---

## 📝 Template de Message pour le Testeur

Voici un template de message que vous pouvez envoyer au testeur :

```
Bonjour [Nom du testeur],

Merci de tester l'application StockEasy ! Voici les instructions pour l'installer :

🔗 Lien d'installation :
[COLLER LE LIEN ICI]

📋 Instructions :
1. Cliquez sur le lien ci-dessus
2. Connectez-vous à votre store Shopify
3. Autorisez l'installation de l'application
4. Attendez la synchronisation initiale (quelques minutes)

📚 Guide complet :
Consultez le guide détaillé : docs/guides/GUIDE_INSTALLATION_TESTEUR.md

🐛 Problèmes ?
Contactez-moi avec le message d'erreur exact et une capture d'écran si possible.

Merci pour votre aide !
```

---

## ✅ Checklist avant de Partager le Lien

- [ ] L'application est déployée (dev ou prod)
- [ ] La configuration est correcte
- [ ] Le lien d'installation fonctionne
- [ ] Les permissions sont correctement configurées
- [ ] Le guide pour le testeur est prêt

---

## 🎉 C'est Prêt !

Une fois le lien généré, partagez-le avec le testeur et suivez le guide `GUIDE_INSTALLATION_TESTEUR.md` pour les instructions détaillées.


