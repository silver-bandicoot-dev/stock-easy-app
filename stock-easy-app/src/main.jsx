// ⚠️ IMPORTANT: Sentry doit être importé EN PREMIER avant tout autre import
// pour capturer toutes les erreurs dès le démarrage de l'application
import './instrument';

import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import App from './App.jsx';
import './index.css';

// Initialize Amplitude Analytics with Session Replay
amplitude.add(sessionReplayPlugin({ sampleRate: 1 }));
amplitude.init('dad8489b4fbfe833403d655314e9525e', { autocapture: true, serverZone: 'EU' });

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
