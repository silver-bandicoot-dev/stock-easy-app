# 🔍 Diagnostic du Problème de Déploiement Vercel

## 📋 État Actuel

### ✅ Ce qui fonctionne
- **Build local** : Le build fonctionne correctement (`npm run build` réussit)
- **Configuration Git** : Le projet est connecté à GitHub (`silver-bandicoot-dev/stock-easy-app`)
- **Structure du projet** : Le dossier `stock-easy-app/` contient tous les fichiers nécessaires
- **vercel.json** : Présent et correctement configuré avec les rewrites

### ⚠️ Problèmes identifiés
1. **Aucun dossier `.vercel`** : Le projet n'est pas encore lié à Vercel via CLI
2. **Projet non trouvé dans Vercel** : Le projet n'apparaît pas dans la liste des projets Vercel via MCP
3. **Root Directory** : Doit être configuré à `stock-easy-app` dans les paramètres Vercel

## 🔧 Solutions

### Solution 1 : Configuration via Dashboard Vercel (Recommandé)

1. **Connecter le repository GitHub**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur **"Add New Project"**
   - Sélectionnez le repository `silver-bandicoot-dev/stock-easy-app`
   - Cliquez sur **"Import"**

2. **Configurer le Root Directory**
   - Dans les paramètres du projet, allez dans **Settings** → **General**
   - Trouvez la section **Root Directory**
   - Définissez la valeur à : `stock-easy-app`
   - Cliquez sur **Save**

3. **Vérifier les autres paramètres**
   - **Framework Preset** : `Vite` (détection automatique)
   - **Build Command** : `npm run build` (détection automatique)
   - **Output Directory** : `dist` (détection automatique)
   - **Install Command** : `npm install` (détection automatique)

4. **Ajouter les variables d'environnement**
   - Allez dans **Settings** → **Environment Variables**
   - Ajoutez :
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Sélectionnez **Production**, **Preview**, et **Development**
   - Cliquez **Save**

5. **Déployer**
   - Cliquez sur **Deploy** ou faites un push sur la branche `main`

### Solution 2 : Configuration via Vercel CLI

1. **Installer Vercel CLI** (si pas déjà fait)
   ```bash
   npm i -g vercel
   ```

2. **Se connecter à Vercel**
   ```bash
   cd /Users/orioncorp/stock-easy-app/stock-easy-app
   vercel login
   ```

3. **Lier le projet**
   ```bash
   vercel link
   ```
   - Répondez aux questions :
     - **Set up and deploy?** → `Y`
     - **Which scope?** → Sélectionnez votre compte
     - **Link to existing project?** → `N` (première fois) ou `Y` (si existe)
     - **What's your project's name?** → `stock-easy-app`

4. **Configurer le Root Directory**
   ```bash
   vercel --cwd stock-easy-app
   ```
   Ou via le dashboard après le lien.

5. **Déployer**
   ```bash
   vercel --prod
   ```

### Solution 3 : Ajouter rootDirectory dans vercel.json (Alternative)

Si le projet est déjà lié mais que le Root Directory pose problème, vous pouvez ajouter cette configuration dans `vercel.json` à la racine du repository (pas dans `stock-easy-app/`).

Créer un `vercel.json` à la racine :
```json
{
  "rootDirectory": "stock-easy-app"
}
```

**Note** : Cette approche fonctionne mieux si le projet est déjà lié à Vercel.

## 🐛 Erreurs Courantes et Solutions

### Erreur : "Command 'cd stock-easy-app && npm install' exited with 1"
**Cause** : Root Directory non configuré ou mal configuré  
**Solution** : Configurer le Root Directory à `stock-easy-app` dans les paramètres Vercel

### Erreur : "No files in the deployment"
**Cause** : Output Directory incorrect ou build qui échoue  
**Solution** : Vérifier que le Output Directory est `dist` et que le build fonctionne localement

### Erreur : Variables d'environnement non trouvées
**Cause** : Variables non configurées dans Vercel  
**Solution** : Ajouter toutes les variables `VITE_*` dans **Settings** → **Environment Variables**

### Erreur : 404 sur les routes React Router
**Cause** : Rewrites non configurés  
**Solution** : Le `vercel.json` est déjà correctement configuré avec les rewrites

## ✅ Checklist de Vérification

Avant de déployer, vérifiez :

- [ ] Le build fonctionne localement : `npm run build`
- [ ] Le Root Directory est configuré à `stock-easy-app` dans Vercel
- [ ] Les variables d'environnement sont configurées dans Vercel
- [ ] Le Framework Preset est détecté comme `Vite`
- [ ] Le Output Directory est `dist`
- [ ] Le repository GitHub est connecté à Vercel
- [ ] Les commits sont poussés sur GitHub

## 📞 Prochaines Étapes

1. **Si le projet n'existe pas encore sur Vercel** :
   - Utilisez la Solution 1 (Dashboard) pour créer le projet
   - Configurez le Root Directory
   - Ajoutez les variables d'environnement
   - Déployez

2. **Si le projet existe déjà sur Vercel** :
   - Vérifiez les paramètres du projet
   - Assurez-vous que le Root Directory est `stock-easy-app`
   - Vérifiez les logs de déploiement pour identifier l'erreur exacte
   - Utilisez `mcp_vercel_get_deployment_build_logs` pour voir les erreurs détaillées

## 🔍 Vérification via MCP Vercel

Pour vérifier les déploiements et les erreurs :

1. **Lister les projets** : Utiliser `mcp_vercel_list_projects`
2. **Voir les déploiements** : Utiliser `mcp_vercel_list_deployments` avec le projectId
3. **Voir les logs** : Utiliser `mcp_vercel_get_deployment_build_logs` avec le deploymentId

## 📝 Notes

- Le `vercel.json` actuel dans `stock-easy-app/` est correct pour les rewrites
- Le Root Directory doit être configuré dans les **paramètres du projet Vercel**, pas dans `vercel.json`
- Si vous créez un `vercel.json` à la racine du repository, il peut spécifier `rootDirectory: "stock-easy-app"`

