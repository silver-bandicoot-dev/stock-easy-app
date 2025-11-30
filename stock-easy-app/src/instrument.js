/**
 * Sentry Initialization - StockEasy
 * 
 * Ce fichier doit être importé EN PREMIER dans main.jsx
 * avant tout autre import pour capturer toutes les erreurs.
 * 
 * Configuration:
 * - Error Monitoring: Capture automatique des erreurs
 * - Performance Tracing: Monitoring des performances
 * - Session Replay: Replay des sessions avec erreurs
 * - React Router v7 Integration: Tracing des navigations
 */

import * as Sentry from "@sentry/react";
import React from "react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";

// Vérifier si on est en production ou si le DSN est configuré
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PRODUCTION = import.meta.env.PROD;
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || (IS_PRODUCTION ? 'production' : 'development');

// Initialiser Sentry seulement si le DSN est configuré
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environnement (production, staging, development)
    environment: ENVIRONMENT,
    
    // Version de l'application (peut être configuré via CI/CD)
    release: import.meta.env.VITE_APP_VERSION || 'stockeasy@1.0.0',
    
    // Envoyer les PII (informations personnelles) pour le debugging
    sendDefaultPii: true,

    integrations: [
      // Intégration React Router v7 pour le tracing des navigations
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      
      // Session Replay pour reproduire les erreurs
      Sentry.replayIntegration({
        // Masquer tous les textes par défaut pour la confidentialité
        maskAllText: false,
        // Bloquer tous les médias par défaut
        blockAllMedia: false,
      }),
      
      // Feedback utilisateur intégré (optionnel)
      Sentry.feedbackIntegration({
        colorScheme: "system",
        showBranding: false,
        buttonLabel: "Signaler un bug",
        submitButtonLabel: "Envoyer",
        cancelButtonLabel: "Annuler",
        formTitle: "Signaler un problème",
        nameLabel: "Nom",
        namePlaceholder: "Votre nom",
        emailLabel: "Email",
        emailPlaceholder: "votre@email.com",
        messageLabel: "Décrivez le problème",
        messagePlaceholder: "Que s'est-il passé ?",
        successMessageText: "Merci pour votre retour !",
      }),
    ],

    // Performance Monitoring
    // Échantillonnage des traces en production (10% pour réduire les coûts)
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

    // URLs pour lesquelles propager les traces (API backend)
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/.*\.supabase\.co/,
      /^https:\/\/stockeasy\./,
    ],

    // Session Replay
    // Capturer 10% des sessions normales
    replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 0.0,
    // Capturer 100% des sessions avec erreur
    replaysOnErrorSampleRate: 1.0,

    // Filtrer les erreurs non pertinentes
    beforeSend(event, hint) {
      // Ignorer les erreurs de réseau temporaires
      const error = hint.originalException;
      if (error && error.message) {
        // Ignorer les erreurs d'annulation de requête
        if (error.message.includes('AbortError') || 
            error.message.includes('cancelled') ||
            error.message.includes('The user aborted')) {
          return null;
        }
        
        // Ignorer les erreurs de ChunkLoadError (problèmes de cache)
        if (error.message.includes('ChunkLoadError') ||
            error.message.includes('Loading chunk')) {
          return null;
        }
      }
      
      return event;
    },

    // Ajouter des tags personnalisés
    initialScope: {
      tags: {
        app: 'stockeasy-frontend',
      },
    },
  });

  console.log(`[Sentry] Initialized in ${ENVIRONMENT} mode`);
} else {
  console.log('[Sentry] Not initialized - VITE_SENTRY_DSN not configured');
}

// Exporter Sentry pour utilisation dans l'application
export { Sentry };

