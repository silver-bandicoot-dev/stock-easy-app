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
      
      // Feedback utilisateur - Design StockEasy (sobre et professionnel)
      Sentry.feedbackIntegration({
        colorScheme: "light",
        showBranding: false,
        // Bouton discret avec icône seule
        triggerLabel: "",
        // Textes en français
        formTitle: "Signaler un problème",
        submitButtonLabel: "Envoyer",
        cancelButtonLabel: "Annuler",
        nameLabel: "Nom",
        namePlaceholder: "Votre nom (optionnel)",
        emailLabel: "Email", 
        emailPlaceholder: "votre@email.com",
        messageLabel: "Description",
        messagePlaceholder: "Décrivez le problème rencontré...",
        successMessageText: "Merci pour votre retour !",
        // Formulaire simplifié
        showName: false,
        showEmail: true,
        isNameRequired: false,
        isEmailRequired: false,
        // Thème StockEasy - Sobre, neutre, professionnel
        themeLight: {
          // Bouton noir élégant
          background: "#0F172A",          // neutral-900 (noir)
          backgroundHover: "#1E293B",     // neutral-800
          foreground: "#F8FAFC",          // neutral-50 (blanc)
          border: "#0F172A",              // neutral-900
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(15,23,42,0.15)",
          // Formulaire
          formBorderRadius: "12px",
          formContentBackgroundColor: "#FFFFFF",
          submitBackground: "#4F46E5",    // primary-600 (indigo)
          submitBackgroundHover: "#4338CA", // primary-700
          submitForeground: "#FFFFFF",
          submitBorder: "#4F46E5",
          cancelBackground: "transparent",
          cancelBackgroundHover: "#F1F5F9",
          cancelForeground: "#64748B",
          cancelBorder: "#E2E8F0",
          inputBackground: "#FFFFFF",
          inputForeground: "#0F172A",     // neutral-900
          inputBorder: "#CBD5E1",         // neutral-300
          inputBorderFocus: "#6366F1",    // primary-500
          inputOutlineFocus: "rgba(99, 102, 241, 0.2)",
          formBorderColor: "#E2E8F0",
          formSentryLogoColor: "#94A3B8", // neutral-400
        },
        themeDark: {
          // Bouton (même style sobre en dark)
          background: "#1E293B",          // neutral-800
          backgroundHover: "#334155",     // neutral-700
          foreground: "#94A3B8",          // neutral-400
          border: "#334155",              // neutral-700
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          // Formulaire dark
          formBorderRadius: "12px",
          formContentBackgroundColor: "#0F172A",
          submitBackground: "#6366F1",    // primary-500
          submitBackgroundHover: "#4F46E5",
          submitForeground: "#FFFFFF",
          submitBorder: "#6366F1",
          cancelBackground: "transparent",
          cancelBackgroundHover: "#1E293B",
          cancelForeground: "#94A3B8",
          cancelBorder: "#334155",
          inputBackground: "#1E293B",
          inputForeground: "#F8FAFC",
          inputBorder: "#334155",
          inputBorderFocus: "#818CF8",
          inputOutlineFocus: "rgba(129, 140, 248, 0.2)",
          formBorderColor: "#334155",
          formSentryLogoColor: "#475569",
        },
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

