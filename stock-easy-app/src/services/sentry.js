import * as Sentry from '@sentry/react';

export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay(),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
};

// Helper pour logger des erreurs custom
export const logError = (error, context = {}) => {
  console.error(error);
  
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: { custom: context }
    });
  }
};
