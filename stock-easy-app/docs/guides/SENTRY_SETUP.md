# Configuration de Sentry pour StockEasy

## Vue d'ensemble

Sentry est configuré pour StockEasy avec les fonctionnalités suivantes :
- **Error Monitoring** : Capture automatique des erreurs JavaScript et React
- **Performance Tracing** : Monitoring des performances et des navigations
- **Session Replay** : Replay vidéo des sessions avec erreurs (100% des erreurs)
- **User Feedback** : Widget intégré pour les retours utilisateurs

## Installation

Le SDK Sentry est déjà installé (`@sentry/react`). Les fichiers de configuration sont :

- `src/instrument.js` - Initialisation de Sentry (importé en premier dans main.jsx)
- `src/main.jsx` - Point d'entrée avec les hooks d'erreur React 18+
- `src/App.jsx` - Routes instrumentées avec `SentryRoutes`
- `src/components/common/SentryErrorBoundary.jsx` - Error Boundary personnalisé

## Configuration

### 1. Créer le projet Sentry

1. Allez sur [sentry.io](https://sentry.io) ou votre instance Sentry
2. Créez un nouveau projet React dans l'organisation **rogue-commerce-labs**
3. Nommez-le `stockeasy`
4. Récupérez le DSN dans **Settings > Projects > stockeasy > Client Keys (DSN)**

### 2. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Sentry Configuration
VITE_SENTRY_DSN=https://your-key@de.sentry.io/your-project-id

# Environnement (production, staging, development)
VITE_ENVIRONMENT=development

# Version de l'application (optionnel)
VITE_APP_VERSION=1.0.0
```

### 3. Configuration Vercel (Production)

Ajoutez les variables d'environnement dans les paramètres Vercel :

| Variable | Description | Environnement |
|----------|-------------|---------------|
| `VITE_SENTRY_DSN` | DSN Sentry | Production, Preview |
| `VITE_ENVIRONMENT` | `production` ou `staging` | Production, Preview |
| `VITE_APP_VERSION` | Version (ex: `1.2.3`) | Production, Preview |

## Fonctionnalités

### Error Monitoring

Les erreurs sont automatiquement capturées et envoyées à Sentry. Vous pouvez aussi capturer des erreurs manuellement :

```javascript
import * as Sentry from '@sentry/react';

// Capturer une erreur
Sentry.captureException(error);

// Capturer un message
Sentry.captureMessage('Un événement important s\'est produit');
```

### Contexte utilisateur

Le contexte utilisateur est automatiquement enrichi. Pour ajouter des informations :

```javascript
import * as Sentry from '@sentry/react';

// Définir l'utilisateur connecté
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Effacer à la déconnexion
Sentry.setUser(null);
```

### Breadcrumbs (fil d'Ariane)

Ajoutez des breadcrumbs pour le contexte :

```javascript
import * as Sentry from '@sentry/react';

Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'Utilisateur a cliqué sur sync',
  level: 'info',
});
```

### Performance Monitoring

Les transactions sont automatiquement créées pour :
- Changements de route (navigation)
- Requêtes HTTP vers Supabase

Pour mesurer des opérations spécifiques :

```javascript
import * as Sentry from '@sentry/react';

Sentry.startSpan(
  { op: 'function', name: 'syncProducts' },
  async (span) => {
    await syncProducts();
    // Le span est automatiquement terminé
  }
);
```

### Session Replay

En production :
- 10% des sessions sont enregistrées
- 100% des sessions avec erreur sont enregistrées

En développement, le replay est désactivé.

### User Feedback Widget

Un bouton "Signaler un bug" est disponible. Les utilisateurs peuvent :
- Signaler un problème
- Ajouter leur nom et email
- Décrire le problème

## Dashboard Sentry

### Accès

- **URL** : https://rogue-commerce-labs.sentry.io
- **Région** : EU (de.sentry.io)

### Vues utiles

1. **Issues** : Liste des erreurs groupées
2. **Performance** : Métriques de performance
3. **Replays** : Sessions enregistrées
4. **Releases** : Suivi des versions
5. **User Feedback** : Retours utilisateurs

## Taux d'échantillonnage

| Fonctionnalité | Development | Production |
|----------------|-------------|------------|
| Error Capture | 100% | 100% |
| Tracing | 100% | 10% |
| Session Replay | 0% | 10% |
| Replay on Error | 100% | 100% |

## Filtrage des erreurs

Les erreurs suivantes sont ignorées :
- `AbortError` (requêtes annulées)
- `ChunkLoadError` (problèmes de cache/lazy loading)
- Erreurs temporaires de réseau

## Source Maps (Recommandé)

Pour avoir des stack traces lisibles en production, configurez l'upload des source maps :

```bash
npx @sentry/wizard@latest -i sourcemaps
```

Cela configurera automatiquement Vite pour uploader les source maps à chaque build.

## Vérification

Pour vérifier que Sentry fonctionne :

1. Démarrez l'application en développement
2. Ouvrez la console - vous devriez voir `[Sentry] Initialized in development mode`
3. Ajoutez temporairement un bouton de test :

```jsx
<button onClick={() => { throw new Error('Test Sentry'); }}>
  Test Sentry
</button>
```

4. Cliquez et vérifiez que l'erreur apparaît dans Sentry

## Troubleshooting

### Sentry ne capture pas les erreurs

1. Vérifiez que `VITE_SENTRY_DSN` est défini
2. Vérifiez la console pour les messages Sentry
3. Vérifiez que le DSN est correct (format: `https://key@host/project-id`)

### Les source maps ne fonctionnent pas

1. Exécutez `npx @sentry/wizard@latest -i sourcemaps`
2. Vérifiez que les source maps sont uploadées dans Sentry > Settings > Source Maps

### Performance dégradée

Réduisez les taux d'échantillonnage dans `instrument.js` :
- `tracesSampleRate: 0.05` (5%)
- `replaysSessionSampleRate: 0.05` (5%)

