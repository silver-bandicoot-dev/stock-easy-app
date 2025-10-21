# 🔒 Guide de Sécurité - Stock Easy App

**Dernière mise à jour** : Octobre 2025

---

## 📊 État de Sécurité Actuel

### ✅ **Protections Actives**

| Mesure de Sécurité | Statut | Description |
|---------------------|--------|-------------|
| **HTTPS/SSL** | ✅ Actif | Certificats automatiques via Vercel |
| **Variables d'environnement** | ✅ Actif | API URL stockée en .env (non committée) |
| **Headers de sécurité** | ✅ Actif | Fournis par Vercel (CSP, HSTS, etc.) |
| **Protection XSS** | ✅ Actif | React échappe automatiquement les données |
| **Protection DDoS** | ✅ Actif | Edge Network Vercel |
| **Validation des entrées** | ⚠️ Basique | Validation minimale (à améliorer) |
| **Rate Limiting** | ❌ Absent | À implémenter |
| **Authentification** | ⚠️ Externe | Géré par Google Apps Script |

---

## 🚨 Vulnérabilités Connues

### Dépendances NPM (16 vulnérabilités)

#### Risque Faible (Environnement de développement uniquement)

**Packages affectés** :
- `esbuild` / `vite` - Utilisés uniquement en développement
- Impact : ⚠️ **Faible** en production (pas utilisés)

#### Risque Moyen (Dépendances indirectes)

**Packages affectés** :
- `@tensorflow/tfjs-vis` → `d3-color`, `node-fetch`, `glamor`
- `react-mentions` → `@babel/runtime`

**Impact** : 🟡 **Moyen**
- Vulnérabilités ReDoS (Regular Expression Denial of Service)
- Fuite potentielle de headers sécurisés

**Action recommandée** :
```bash
# Option 1 : Accepter le risque (vulnérabilités dans visualisations ML uniquement)
# Ces packages sont côté client, impact limité

# Option 2 : Forcer la mise à jour (risque de breaking changes)
npm audit fix --force
# Puis tester exhaustivement l'application
```

---

## 🛡️ Mesures de Protection Implémentées

### 1️⃣ **Protection API URL**

✅ **Avant** (non sécurisé) :
```javascript
export const API_URL = 'https://script.google.com/macros/s/xxx/exec'; // ❌ Exposé
```

✅ **Après** (sécurisé) :
```javascript
export const API_URL = import.meta.env.VITE_API_URL; // ✅ Variable d'environnement
if (!API_URL) throw new Error('Missing VITE_API_URL');
```

**Avantages** :
- ✅ URL jamais committée sur GitHub
- ✅ Rotation facile en cas de compromission
- ✅ Différentes URLs par environnement (dev/staging/prod)

### 2️⃣ **Fichier .gitignore**

```gitignore
# Variables d'environnement sensibles
.env
.env.local
.env.production

# Logs et cache
*.log
node_modules/
```

### 3️⃣ **Variables d'Environnement Vercel**

**Configuration Production** :
- Dashboard : https://vercel.com/settings/environment-variables
- Variables définies :
  - `VITE_API_URL` : URL Google Apps Script production

---

## 🔐 Recommandations de Sécurité

### Priorité 🔴 HAUTE (À faire immédiatement)

#### 1. **Configurer Vercel Environment Variables**

```bash
# Via Dashboard Vercel :
# 1. Aller dans Project Settings > Environment Variables
# 2. Ajouter VITE_API_URL avec votre URL Google Apps Script
# 3. Scope: Production, Preview, Development
```

#### 2. **Activer les Headers de Sécurité**

Créer `vercel.json` à la racine :
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

#### 3. **Valider les Entrées Utilisateur**

Installer une bibliothèque de validation :
```bash
npm install zod
```

Exemple d'utilisation :
```javascript
import { z } from 'zod';

const supplierSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  leadTimeDays: z.number().int().min(1).max(365),
  moq: z.number().int().min(1)
});

// Valider avant envoi API
try {
  const validated = supplierSchema.parse(supplierFormData);
  // ✅ Données validées, peut envoyer à l'API
} catch (error) {
  // ❌ Données invalides
  toast.error('Données invalides');
}
```

### Priorité 🟠 MOYENNE (Dans les 2 semaines)

#### 4. **Implémenter Rate Limiting Côté Backend**

Dans Google Apps Script :
```javascript
// Cache pour tracker les requêtes
const cache = CacheService.getScriptCache();

function rateLimit(userIdentifier) {
  const key = `rate_${userIdentifier}`;
  const count = cache.get(key) || 0;
  
  if (count > 100) { // Max 100 requêtes/heure
    throw new Error('Rate limit exceeded');
  }
  
  cache.put(key, parseInt(count) + 1, 3600); // Expire dans 1h
}
```

#### 5. **Logger les Actions Critiques**

Ajouter des logs pour :
- Modifications de stock importantes
- Créations/suppressions de fournisseurs
- Changements de paramètres critiques

```javascript
function logSecurityEvent(action, details) {
  console.log(`[SECURITY] ${new Date().toISOString()} - ${action}`, details);
  // Optionnel : Envoyer à un service de monitoring (Sentry, LogRocket)
}
```

#### 6. **Ajouter une Authentification Forte**

Options :
- **Firebase Auth** (recommandé)
- **Auth0**
- **NextAuth.js**

```bash
npm install firebase
```

### Priorité 🟡 BASSE (Nice to have)

#### 7. **Monitoring et Alertes**

Intégrer un service de monitoring :
```bash
npm install @sentry/react
```

Configuration :
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "VOTRE_DSN_SENTRY",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

#### 8. **Backup Automatique**

- Exporter les données quotidiennement
- Stocker dans Google Drive ou AWS S3
- Retention : 30 jours minimum

#### 9. **Tests de Sécurité**

```bash
# Scanner de vulnérabilités
npm install -D snyk
npx snyk test

# Analyse du code
npm install -D eslint-plugin-security
```

---

## 🚀 Checklist de Sécurité

### Avant Chaque Déploiement

- [ ] Variables d'environnement configurées dans Vercel
- [ ] `.env` dans `.gitignore`
- [ ] Aucun secret committé dans le code
- [ ] `npm audit` exécuté et vulnérabilités critiques corrigées
- [ ] Build réussi sans erreur
- [ ] Tests de sécurité passés

### Mensuellement

- [ ] Mise à jour des dépendances : `npm update`
- [ ] Audit de sécurité : `npm audit`
- [ ] Revue des logs d'erreurs
- [ ] Vérification des accès API
- [ ] Rotation des secrets si nécessaire

### Annuellement

- [ ] Audit de sécurité complet par un expert
- [ ] Mise à jour de la documentation de sécurité
- [ ] Formation de l'équipe sur les bonnes pratiques
- [ ] Test de restauration depuis backup

---

## 📞 En Cas d'Incident de Sécurité

### Procédure d'Urgence

1. **Identifier la Menace**
   - Type d'attaque ?
   - Données compromises ?
   - Étendue de l'impact ?

2. **Contenir**
   - Désactiver l'API Google Apps Script temporairement
   - Révoquer les tokens/clés compromis
   - Isoler les systèmes affectés

3. **Communiquer**
   - Informer les utilisateurs si données personnelles affectées
   - Notifier l'équipe technique
   - Documenter l'incident

4. **Corriger**
   - Patcher la vulnérabilité
   - Changer tous les secrets
   - Tester la correction

5. **Analyser**
   - Post-mortem : Comment cela s'est produit ?
   - Actions préventives à mettre en place
   - Mettre à jour ce document

### Contacts d'Urgence

- **Google Apps Script** : https://support.google.com/
- **Vercel Support** : https://vercel.com/support
- **ANSSI (France)** : https://www.cert.ssi.gouv.fr/

---

## 📚 Ressources et Documentation

### Guides de Sécurité

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://react.dev/reference/security)
- [Vercel Security](https://vercel.com/docs/security)

### Outils Recommandés

- **Snyk** : Scanner de vulnérabilités
- **Sentry** : Monitoring d'erreurs
- **1Password/Bitwarden** : Gestion de secrets
- **Have I Been Pwned** : Vérifier les emails compromis

---

## ✅ Résumé

### Ce Qui Est Sécurisé

✅ Infrastructure (Vercel, HTTPS, CDN)  
✅ Code source (pas d'injection, React sécurisé)  
✅ Variables d'environnement (API URL protégée)  
✅ Protection DDoS de base  

### Ce Qui Nécessite Attention

⚠️ Vulnérabilités dans dépendances (@tensorflow/tfjs-vis)  
⚠️ Pas de rate limiting robuste  
⚠️ Validation d'entrées basique  
⚠️ Authentification à renforcer  

### Niveau de Risque Global

🟢 **ACCEPTABLE** pour un MVP/Production initiale

**Recommandation** : Implémenter les corrections Priorité HAUTE dans les 2 semaines.

---

**Maintenu par** : Équipe Stock Easy  
**Prochaine revue** : Novembre 2025

