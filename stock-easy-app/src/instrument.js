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

// Constantes de configuration
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PRODUCTION = import.meta.env.PROD;
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || (IS_PRODUCTION ? 'production' : 'development');

// Routes publiques où Sentry ne doit pas être actif (landing, coming soon, pages légales)
const PUBLIC_ROUTES = ['/', '/preview', '/legal/', '/login', '/forgot-password', '/confirm-email'];

/**
 * Vérifie si l'URL actuelle est une page publique (sans Sentry)
 */
const isPublicRoute = () => {
  const path = window.location.pathname;
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route));
};

/**
 * État global pour suivre si Sentry est activé
 */
let sentryInitialized = false;

/**
 * Vérifie si l'utilisateur a donné son consentement via Cookiebot
 */
const hasAnalyticsConsent = () => {
  return window.Cookiebot && window.Cookiebot.consent && window.Cookiebot.consent.statistics;
};

/**
 * Initialise Sentry avec la configuration complète
 */
const initializeSentry = () => {
  if (sentryInitialized || !SENTRY_DSN) return;
  
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environnement (production, staging, development)
    environment: ENVIRONMENT,
    
    // Version de l'application (peut être configuré via CI/CD)
    release: import.meta.env.VITE_APP_VERSION || 'stockeasy@1.0.0',
    
    // Envoyer les PII (informations personnelles) pour le debugging
    sendDefaultPii: true,

    // Activer Sentry sauf sur les pages publiques
    enabled: !isPublicRoute(),

    integrations: [
      // Intégration React Router v7 pour le tracing des navigations
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      
      // Session Replay pour reproduire les erreurs - SEULEMENT avec consentement Cookiebot
      // Le replay est activé dynamiquement selon le consentement
      ...(hasAnalyticsConsent() ? [
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        })
      ] : []),
      
      // Feedback utilisateur - Design StockEasy
      Sentry.feedbackIntegration({
        // Ne pas injecter automatiquement le bouton sur les pages publiques
        autoInject: !isPublicRoute(),
        colorScheme: "light",
        showBranding: false,
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
        showName: false,
        showEmail: true,
        isNameRequired: false,
        isEmailRequired: false,
        // Thème StockEasy - Sobre, neutre, professionnel
        themeLight: {
          background: "#0F172A",
          backgroundHover: "#1E293B",
          foreground: "#F8FAFC",
          border: "#0F172A",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(15,23,42,0.15)",
          formBorderRadius: "12px",
          formContentBackgroundColor: "#FFFFFF",
          submitBackground: "#4F46E5",
          submitBackgroundHover: "#4338CA",
          submitForeground: "#FFFFFF",
          submitBorder: "#4F46E5",
          cancelBackground: "transparent",
          cancelBackgroundHover: "#F1F5F9",
          cancelForeground: "#64748B",
          cancelBorder: "#E2E8F0",
          inputBackground: "#FFFFFF",
          inputForeground: "#0F172A",
          inputBorder: "#CBD5E1",
          inputBorderFocus: "#6366F1",
          inputOutlineFocus: "rgba(99, 102, 241, 0.2)",
          formBorderColor: "#E2E8F0",
          formSentryLogoColor: "#94A3B8",
        },
        themeDark: {
          background: "#1E293B",
          backgroundHover: "#334155",
          foreground: "#94A3B8",
          border: "#334155",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          formBorderRadius: "12px",
          formContentBackgroundColor: "#0F172A",
          submitBackground: "#6366F1",
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

    // Performance Monitoring - Échantillonnage conditionnel
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

    // URLs pour lesquelles propager les traces (API backend)
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/.*\.supabase\.co/,
      /^https:\/\/stockeasy\./,
    ],

    // Session Replay - Échantillonnage conditionnel (seulement si consentement Cookiebot)
    replaysSessionSampleRate: hasAnalyticsConsent() ? (IS_PRODUCTION ? 0.1 : 0.0) : 0.0,
    replaysOnErrorSampleRate: hasAnalyticsConsent() ? 1.0 : 0.0,

    // Filtrer les erreurs non pertinentes et les pages publiques
    beforeSend(event, hint) {
      // Ne pas envoyer sur les pages publiques
      if (isPublicRoute()) {
        return null;
      }
      
      // Ignorer les erreurs de réseau temporaires
      const error = hint.originalException;
      if (error && error.message) {
        if (error.message.includes('AbortError') || 
            error.message.includes('cancelled') ||
            error.message.includes('The user aborted')) {
          return null;
        }
        
        if (error.message.includes('ChunkLoadError') ||
            error.message.includes('Loading chunk')) {
          return null;
        }
      }
      
      return event;
    },

    // Filtrer les transactions (tracing) des pages publiques
    beforeSendTransaction(event) {
      if (isPublicRoute()) {
        return null;
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

  sentryInitialized = true;
  
  const replayStatus = hasAnalyticsConsent() ? 'enabled (with consent)' : 'disabled (no consent)';
  console.log(`[Sentry] Initialized in ${ENVIRONMENT} mode - Session Replay: ${replayStatus}`);
};

// Initialiser Sentry si le DSN est configuré
if (SENTRY_DSN) {
  // Initialiser immédiatement ou attendre Cookiebot
  if (window.Cookiebot) {
    initializeSentry();
  } else {
    // Attendre que Cookiebot soit chargé
    window.addEventListener('CookiebotOnLoad', initializeSentry);
  }
  
  // Écouter les changements de consentement pour mettre à jour Sentry
  window.addEventListener('CookiebotOnAccept', () => {
    if (window.Cookiebot.consent.statistics && !sentryInitialized) {
      initializeSentry();
    }
  });
} else {
  console.log('[Sentry] Not initialized - VITE_SENTRY_DSN not configured');
}

// Exporter Sentry pour utilisation dans l'application
export { Sentry };
