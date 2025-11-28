import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Error Boundary - Capture les erreurs React et affiche un fallback élégant
 * 
 * Usage:
 * <ErrorBoundary section="Dashboard">
 *   <DashboardTab />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log l'erreur (pourrait être envoyé à un service de monitoring)
    console.error(`🔴 ErrorBoundary [${this.props.section || 'Unknown'}]:`, error);
    console.error('Component Stack:', errorInfo?.componentStack);
    
    // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, section, fallback, minimal } = this.props;

    if (hasError) {
      // Si un fallback personnalisé est fourni, l'utiliser
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback({ error, errorInfo, retry: this.handleRetry })
          : fallback;
      }

      // Version minimale (pour les petites sections)
      if (minimal) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Erreur dans {section || 'cette section'}
              </span>
              <button
                onClick={this.handleRetry}
                className="ml-auto text-xs underline hover:no-underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        );
      }

      // Version complète (par défaut)
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-[400px] flex items-center justify-center p-8"
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#E5E4DF] overflow-hidden">
            {/* Header avec gradient */}
            <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Oups ! Une erreur est survenue</h2>
                  <p className="text-red-100 text-sm">
                    {section ? `Section: ${section}` : 'Erreur inattendue'}
                  </p>
                </div>
              </div>
            </div>

            {/* Corps */}
            <div className="p-6 space-y-4">
              <p className="text-[#666663] text-sm">
                Quelque chose s'est mal passé. Vous pouvez essayer de recharger cette section 
                ou retourner à l'accueil.
              </p>

              {/* Message d'erreur (en dev uniquement) */}
              {import.meta.env.DEV && error && (
                <details className="bg-[#FAFAF7] rounded-lg p-3 text-xs">
                  <summary className="cursor-pointer text-[#666663] font-medium flex items-center gap-2">
                    <Bug className="w-3 h-3" />
                    Détails techniques (dev only)
                  </summary>
                  <pre className="mt-2 p-2 bg-red-50 text-red-600 rounded overflow-auto max-h-32">
                    {error.toString()}
                    {errorInfo?.componentStack && (
                      <span className="text-red-400">{errorInfo.componentStack}</span>
                    )}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#191919] text-white rounded-lg font-medium hover:bg-[#333] transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réessayer
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#E5E4DF] text-[#191919] rounded-lg font-medium hover:bg-[#d5d4cf] transition-colors"
                >
                  <Home className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;

