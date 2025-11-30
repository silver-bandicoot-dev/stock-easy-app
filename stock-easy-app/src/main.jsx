// ⚠️ IMPORTANT: Sentry doit être importé EN PREMIER avant tout autre import
// pour capturer toutes les erreurs dès le démarrage de l'application
import './instrument';

import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.jsx';
import './index.css';

// Créer le root avec les hooks d'erreur Sentry pour React 18+
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container, {
  // Callback appelé quand une erreur non catchée est lancée
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.error('Uncaught error:', error, errorInfo.componentStack);
  }),
  // Callback appelé quand React catch une erreur dans un ErrorBoundary
  onCaughtError: Sentry.reactErrorHandler(),
  // Callback appelé quand React récupère automatiquement d'erreurs
  onRecoverableError: Sentry.reactErrorHandler(),
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
