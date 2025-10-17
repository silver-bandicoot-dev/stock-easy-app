# 🔧 GUIDE DE DÉPLOIEMENT CORRECT - VERCEL

## ⚠️ PROBLÈME IDENTIFIÉ

Vercel déploie depuis **la racine du repo** au lieu du dossier **`stock-easy-app/`** !

C'est pourquoi vous ne voyez pas les fonctionnalités Phase 4.

---

## ✅ SOLUTION EN 3 ÉTAPES

### ÉTAPE 1 : Aller dans les paramètres Vercel

1. Allez sur https://vercel.com
2. Ouvrez votre projet **stock-easy-app**
3. Cliquez sur **"Settings"** (en haut)

### ÉTAPE 2 : Configurer le Root Directory

1. Dans le menu de gauche, cliquez sur **"General"**
2. Scrollez jusqu'à **"Root Directory"**
3. Cliquez sur **"Edit"**
4. Entrez : **`stock-easy-app`**
5. Cliquez sur **"Save"**

### ÉTAPE 3 : Redéployer

1. Allez dans l'onglet **"Deployments"**
2. Trouvez le dernier déploiement
3. Cliquez sur les **3 points** (...)
4. Cliquez sur **"Redeploy"**
5. Cochez **"Use existing Build Cache"** = OFF
6. Cliquez sur **"Redeploy"**

⏱️ **Temps : 2-3 minutes**

---

## 📋 CONFIGURATION COMPLÈTE VERCEL

Vérifiez que ces paramètres sont corrects :

### General Settings

```
Root Directory: stock-easy-app
```

### Build & Development Settings

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Development Command: npm run dev
```

### Environment Variables

```
VITE_API_URL = https://script.google.com/macros/s/VOTRE_ID/exec
```

---

## 🎯 CE QUI VA CHANGER

Après le redéploiement avec `stock-easy-app` comme Root Directory, vous verrez :

### ✨ Nouvelles fonctionnalités visibles :

1. **OrderModal** - Cliquez sur "Nouvelle commande"
2. **Drag & Drop Kanban** - Dans la vue Commandes
3. **Export CSV/Excel/PDF** - Boutons d'export
4. **Onboarding interactif** - Au premier chargement
5. **Raccourcis clavier** - Appuyez sur `?` pour voir
6. **Widget de feedback** - Bouton en bas à droite
7. **Dashboard Analytics** - Graphiques et KPIs
8. **PWA** - Installable sur mobile/desktop
9. **Animations** - Transitions fluides partout
10. **Actions en masse** - Sélection multiple de produits

---

## 🔍 COMMENT VÉRIFIER

### 1. Vérifiez la structure déployée

Après redéploiement, dans les logs Vercel vous devriez voir :

```
✓ Root Directory: stock-easy-app
✓ Building with Vite
✓ Installing dependencies from stock-easy-app/package.json
```

### 2. Testez les fonctionnalités Phase 4

Ouvrez votre URL Vercel et testez :

- **Appuyez sur `?`** → Modal d'aide raccourcis apparaît ✅
- **Appuyez sur `Ctrl + K`** → Focus sur recherche ✅
- **Regardez en bas à droite** → Widget feedback ✅
- **Allez sur Commandes** → Drag & Drop Kanban ✅

### 3. Vérifiez le PWA

1. Ouvrez DevTools > Application > Service Workers
2. Vous devriez voir le Service Worker actif ✅

---

## 🚨 SI ÇA NE FONCTIONNE TOUJOURS PAS

### Option A : Recréer le projet Vercel

1. **Supprimez le projet** actuel sur Vercel
2. **Créez un nouveau projet**
3. **Importez le repo GitHub**
4. **Configurez dès le début :**
   - Root Directory : `stock-easy-app`
   - Framework : Vite
5. **Déployez**

### Option B : Déployer via CLI

```bash
cd /workspace/stock-easy-app

# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer (depuis le dossier stock-easy-app)
vercel

# Puis en production
vercel --prod
```

---

## 📊 CHECKLIST DE VÉRIFICATION

- [ ] Root Directory = `stock-easy-app` dans Settings
- [ ] Framework = Vite
- [ ] Build Command = `npm run build`
- [ ] Output Directory = `dist`
- [ ] Variable VITE_API_URL configurée
- [ ] Redéploiement effectué
- [ ] Raccourci `?` fonctionne
- [ ] Widget feedback visible
- [ ] Service Worker actif

---

## 🎯 RÉSULTAT ATTENDU

Après configuration correcte, votre application Vercel aura :

### 📱 URL Structure
```
https://votre-app.vercel.app
  ├── / (Dashboard avec Phase 4)
  ├── /orders (Kanban Drag & Drop)
  ├── /analytics (Graphiques)
  └── Service Worker actif
```

### ✨ Fonctionnalités Phase 4 actives
- ✅ 15 nouveaux composants
- ✅ PWA offline
- ✅ Drag & Drop
- ✅ Exports avancés
- ✅ Onboarding
- ✅ Raccourcis clavier
- ✅ Analytics
- ✅ Error tracking

---

## 💡 ASTUCE

Pour éviter ce genre de problème à l'avenir :

1. **Toujours déployer depuis le dossier de l'app**
2. **Vérifier le Root Directory** dans les settings
3. **Tester en local** avant : `npm run build && npm run preview`

---

## 📞 BESOIN D'AIDE ?

Si après avoir suivi ces étapes, ça ne fonctionne toujours pas :

1. Partagez les **logs de build** Vercel
2. Partagez la **configuration** des Settings
3. Testez le build en local : `cd stock-easy-app && npm run build`

---

**Suivez ces étapes et votre Phase 4 sera visible ! 🚀**
