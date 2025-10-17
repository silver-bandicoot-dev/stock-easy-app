# Configuration de déploiement Vercel pour Stock-Easy-App

## Changements effectués

### Problème résolu
L'erreur `Command "cd stock-easy-app && npm install" exited with 1` était causée par :
1. Un `package.json` à la racine du workspace qui interférait avec le déploiement
2. Une mauvaise configuration du Root Directory dans Vercel

### Solutions appliquées
✅ Suppression du `package.json` et `node_modules` à la racine
✅ Déplacement du `vercel.json` dans le dossier `stock-easy-app`
✅ Simplification de la configuration Vercel

## Configuration Vercel requise

### Dans le Dashboard Vercel, configurez :

1. **Root Directory**: `stock-easy-app`
2. **Framework Preset**: Vite
3. **Build Command**: `npm run build` (détection automatique)
4. **Output Directory**: `dist` (détection automatique)
5. **Install Command**: `npm install` (détection automatique)

### Ou via les Project Settings :

1. Allez dans **Settings** → **General**
2. Trouvez la section **Root Directory**
3. Définissez la valeur à : `stock-easy-app`
4. Cliquez sur **Save**

## Structure du projet

```
/workspace
├── stock-easy-app/          ← Root Directory Vercel
│   ├── src/
│   ├── dist/                ← Output du build
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json
└── (autres fichiers docs)
```

## Vérification

Le build a été testé avec succès :
```
✓ dist/index.html          0.49 kB
✓ dist/assets/*.css       31.72 kB
✓ dist/assets/*.js       422.95 kB
```

## Déploiement

Une fois le Root Directory configuré dans Vercel :
1. Vercel détectera automatiquement le framework Vite
2. Les commandes d'installation et de build seront exécutées dans le bon répertoire
3. Le déploiement devrait réussir sans erreur

## Troubleshooting

Si l'erreur persiste :
1. Vérifiez que le Root Directory est bien configuré à `stock-easy-app`
2. Vérifiez que la branche déployée contient les derniers changements
3. Essayez un redéploiement manuel depuis le dashboard
