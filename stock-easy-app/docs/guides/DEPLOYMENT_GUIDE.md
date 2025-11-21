# 🚀 Guide de Déploiement - Stock Easy App

## 📋 Prérequis

- ✅ Compte Vercel (gratuit sur vercel.com)
- ✅ Firebase configuré avec les credentials
- ✅ Code pushé sur GitHub
- ✅ Vercel CLI installé (déjà fait)

---

## 🎯 Option 1 : Déploiement via Vercel CLI (Recommandé)

### Étape 1 : Se connecter à Vercel

```bash
cd /Users/orioncorp/stock-easy-app/stock-easy-app
vercel login
```

### Étape 2 : Déployer

```bash
vercel
```

Lors de la première exécution, répondez aux questions :

- **Set up and deploy?** → `Y`
- **Which scope?** → Sélectionnez votre compte
- **Link to existing project?** → `N` (première fois) ou `Y` (si existe)
- **What's your project's name?** → `stock-easy-app`
- **In which directory is your code located?** → `./` (déjà dans le bon dossier)
- **Override settings?** → `N`

### Étape 3 : Déployer en production

```bash
vercel --prod
```

---

## 🎯 Option 2 : Déploiement via Dashboard Vercel + GitHub

### Étape 1 : Connecter le repository

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New Project"**
3. Sélectionnez le repository `silver-bandicoot-dev/stock-easy-app`
4. Cliquez sur **"Import"**

### Étape 2 : Configurer le projet

Dans la configuration du projet :

**Root Directory** :
```
stock-easy-app
```

**Framework Preset** :
```
Vite
```

**Build Command** :
```
npm run build
```

**Output Directory** :
```
dist
```

**Install Command** :
```
npm install
```

### Étape 3 : Ajouter les variables d'environnement

Cliquez sur **"Environment Variables"** et ajoutez :

```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

⚠️ **Important** : Copiez les valeurs depuis votre fichier `.env` local !

### Étape 4 : Déployer

Cliquez sur **"Deploy"**

---

## 🔐 Configuration des variables d'environnement

### Via CLI (après premier déploiement)

```bash
# Ajouter une variable
vercel env add VITE_FIREBASE_API_KEY

# Lister les variables
vercel env ls

# Supprimer une variable
vercel env rm VITE_FIREBASE_API_KEY
```

### Via Dashboard

1. Allez dans votre projet sur Vercel
2. **Settings** → **Environment Variables**
3. Ajoutez chaque variable une par une
4. Sélectionnez **Production**, **Preview**, et **Development**
5. Cliquez **Save**

---

## 📋 Checklist des variables d'environnement

Assurez-vous d'avoir configuré toutes ces variables :

- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`

---

## 🔄 Redéploiement

### Déploiement automatique (GitHub)

Si vous avez connecté GitHub :
- Chaque push sur `main` → déploiement automatique en production
- Chaque push sur une autre branche → déploiement preview

### Déploiement manuel (CLI)

```bash
# Redéployer en production
vercel --prod

# Créer un déploiement preview
vercel
```

---

## 🌐 Domaine personnalisé (Optionnel)

### Ajouter un domaine

1. **Settings** → **Domains**
2. Cliquez **"Add"**
3. Entrez votre domaine (ex: `stock-easy.com`)
4. Suivez les instructions pour configurer les DNS

### Domaine Vercel gratuit

Par défaut, votre app sera accessible sur :
```
https://stock-easy-app.vercel.app
```

Ou un nom généré automatiquement.

---

## 🔧 Configuration Firebase pour Production

### 1. Configurer le domaine Vercel dans Firebase

1. Firebase Console → **Authentication**
2. **Settings** → **Authorized domains**
3. Ajoutez votre domaine Vercel :
   ```
   stock-easy-app.vercel.app
   ```
   ou votre domaine personnalisé

### 2. Règles Firestore

Assurez-vous que vos règles Firestore sont en mode **production** :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Voir FIRESTORE_STRUCTURE.md pour les règles complètes
  }
}
```

### 3. Règles Storage

Pour les photos de profil :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📊 Monitoring et Logs

### Voir les logs de déploiement

```bash
vercel logs
```

### Voir les logs en temps réel

```bash
vercel logs --follow
```

### Analytics (Dashboard)

1. Allez dans votre projet sur Vercel
2. **Analytics** → Voir les statistiques de trafic
3. **Speed Insights** → Performances

---

## 🐛 Troubleshooting

### Build échoue

**Problème** : Erreur lors du build
**Solution** :
1. Vérifiez que le build fonctionne localement : `npm run build`
2. Vérifiez les logs Vercel pour l'erreur exacte
3. Assurez-vous que toutes les dépendances sont dans `package.json`

### Variables d'environnement non reconnues

**Problème** : Firebase ne se connecte pas
**Solution** :
1. Vérifiez que toutes les variables commencent par `VITE_`
2. Redéployez après avoir ajouté les variables
3. Vérifiez dans le dashboard que les variables sont bien définies

### Erreur 404 sur les routes

**Problème** : Routes React Router ne fonctionnent pas
**Solution** : Le fichier `vercel.json` est déjà configuré avec les rewrites corrects

### Erreur CORS Firebase

**Problème** : Erreurs CORS avec Firebase
**Solution** :
1. Ajoutez votre domaine Vercel dans Firebase Console
2. **Authentication** → **Settings** → **Authorized domains**

---

## ✅ Vérification post-déploiement

Après le déploiement, testez :

- [ ] La page de login s'affiche
- [ ] L'inscription fonctionne
- [ ] La connexion fonctionne
- [ ] Le routing fonctionne (pas d'erreur 404)
- [ ] Les notifications fonctionnent
- [ ] Le profil utilisateur s'affiche
- [ ] L'upload de photo fonctionne
- [ ] Le changement de langue fonctionne
- [ ] La déconnexion fonctionne

---

## 🎉 Commandes rapides

```bash
# Déployer en production
vercel --prod

# Voir le statut
vercel ls

# Voir les logs
vercel logs

# Ouvrir le projet dans le browser
vercel open

# Voir les déploiements
vercel deployments

# Rollback vers un déploiement précédent
vercel rollback [deployment-url]
```

---

## 📞 Support

- **Vercel Docs** : https://vercel.com/docs
- **Firebase Docs** : https://firebase.google.com/docs
- **Vite Docs** : https://vitejs.dev

---

## 🎯 Prêt à déployer !

Choisissez votre méthode et lancez le déploiement ! 🚀

**Recommandation** : Utilisez l'Option 2 (Dashboard + GitHub) pour la première fois, c'est plus visuel et permet de bien configurer les variables d'environnement.

