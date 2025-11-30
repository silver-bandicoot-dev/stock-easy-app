/**
 * SentryErrorBoundary - Composant Error Boundary intégré avec Sentry
 * 
 * Capture les erreurs React et les envoie à Sentry avec un fallback UI.
 * Utilise l'ErrorBoundary de Sentry avec une UI personnalisée.
 */

import React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Composant fallback affiché en cas d'erreur
 */
const ErrorFallback = ({ error, resetError }) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center">
        {/* Icône d'erreur */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-white mb-3">
          Oups, quelque chose s'est mal passé
        </h1>

        {/* Message */}
        <p className="text-slate-400 mb-6">
          Une erreur inattendue s'est produite. Notre équipe a été notifiée et travaille à résoudre le problème.
        </p>

        {/* Détails de l'erreur (mode développement) */}
        {import.meta.env.DEV && error && (
          <div className="mb-6 p-4 bg-slate-900/50 rounded-lg text-left">
            <p className="text-sm font-mono text-red-400 break-all">
              {error.message || error.toString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError || handleReload}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          
          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </div>

        {/* Lien support */}
        <p className="mt-8 text-sm text-slate-500">
          Le problème persiste ?{' '}
          <a 
            href="mailto:support@stockeasy.app" 
            className="text-emerald-400 hover:text-emerald-300 underline"
          >
            Contactez le support
          </a>
        </p>
      </div>
    </div>
  );
};

/**
 * SentryErrorBoundary - Wrapper autour de Sentry.ErrorBoundary
 * avec une UI personnalisée pour StockEasy
 */
const SentryErrorBoundary = ({ children, fallback }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={fallback || (({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} />
      ))}
      beforeCapture={(scope) => {
        scope.setTag('boundary', 'app-root');
      }}
      onError={(error, componentStack, eventId) => {
        console.error('Error captured by SentryErrorBoundary:', {
          error,
          componentStack,
          eventId,
        });
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

/**
 * RouteErrorBoundary - Error Boundary pour React Router
 * À utiliser avec errorElement dans les routes
 */
export const RouteErrorBoundary = () => {
  // Hook de React Router pour récupérer l'erreur
  const error = React.useMemo(() => {
    // En mode développement, on peut avoir accès à l'erreur via window
    return window.__ROUTE_ERROR__ || new Error('Une erreur de navigation s\'est produite');
  }, []);

  React.useEffect(() => {
    // Envoyer l'erreur à Sentry
    Sentry.captureException(error, {
      tags: {
        boundary: 'route',
      },
    });
  }, [error]);

  return <ErrorFallback error={error} />;
};

export default SentryErrorBoundary;

