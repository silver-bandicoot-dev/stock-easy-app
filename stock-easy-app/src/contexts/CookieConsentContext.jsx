/**
 * CookieConsentContext - Gestion du consentement aux cookies (RGPD)
 * 
 * Ce contexte gère:
 * - Le stockage du consentement utilisateur
 * - L'activation/désactivation des services tiers (Sentry)
 * - L'affichage de la bannière de consentement
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Clé de stockage localStorage
const CONSENT_STORAGE_KEY = 'stockeasy_cookie_consent';
const CONSENT_VERSION = '1.0'; // Incrémenter si la politique change

// Catégories de cookies
export const COOKIE_CATEGORIES = {
  ESSENTIAL: 'essential',      // Toujours actifs (auth, session)
  ANALYTICS: 'analytics',      // Sentry, monitoring
  PREFERENCES: 'preferences',  // Langue, devise, thème
};

// État par défaut (aucun consentement donné)
const DEFAULT_CONSENT = {
  version: CONSENT_VERSION,
  timestamp: null,
  hasConsented: false,
  categories: {
    [COOKIE_CATEGORIES.ESSENTIAL]: true,     // Toujours true
    [COOKIE_CATEGORIES.ANALYTICS]: false,
    [COOKIE_CATEGORIES.PREFERENCES]: false,
  }
};

const CookieConsentContext = createContext(null);

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

export const CookieConsentProvider = ({ children }) => {
  const [consent, setConsent] = useState(DEFAULT_CONSENT);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le consentement depuis localStorage au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Vérifier si la version du consentement est à jour
        if (parsed.version === CONSENT_VERSION && parsed.hasConsented) {
          setConsent(parsed);
          setShowBanner(false);
        } else {
          // Version obsolète ou pas de consentement, afficher la bannière
          setShowBanner(true);
        }
      } else {
        // Aucun consentement stocké, afficher la bannière
        setShowBanner(true);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement du consentement cookies:', error);
      setShowBanner(true);
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder le consentement dans localStorage
  const saveConsent = useCallback((newConsent) => {
    const consentData = {
      ...newConsent,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      hasConsented: true,
    };
    
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
      setConsent(consentData);
      setShowBanner(false);
      setShowPreferences(false);
      
      // Déclencher un événement personnalisé pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consentData }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du consentement:', error);
    }
  }, []);

  // Accepter tous les cookies
  const acceptAll = useCallback(() => {
    saveConsent({
      categories: {
        [COOKIE_CATEGORIES.ESSENTIAL]: true,
        [COOKIE_CATEGORIES.ANALYTICS]: true,
        [COOKIE_CATEGORIES.PREFERENCES]: true,
      }
    });
  }, [saveConsent]);

  // Refuser tous les cookies (sauf essentiels)
  const rejectAll = useCallback(() => {
    saveConsent({
      categories: {
        [COOKIE_CATEGORIES.ESSENTIAL]: true,
        [COOKIE_CATEGORIES.ANALYTICS]: false,
        [COOKIE_CATEGORIES.PREFERENCES]: false,
      }
    });
  }, [saveConsent]);

  // Sauvegarder les préférences personnalisées
  const savePreferences = useCallback((categories) => {
    saveConsent({
      categories: {
        [COOKIE_CATEGORIES.ESSENTIAL]: true, // Toujours actif
        ...categories,
      }
    });
  }, [saveConsent]);

  // Vérifier si une catégorie est acceptée
  const hasConsent = useCallback((category) => {
    if (category === COOKIE_CATEGORIES.ESSENTIAL) return true;
    return consent.categories[category] === true;
  }, [consent.categories]);

  // Ouvrir le modal de préférences
  const openPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  // Fermer le modal de préférences
  const closePreferences = useCallback(() => {
    setShowPreferences(false);
  }, []);

  // Révoquer le consentement (réafficher la bannière)
  const revokeConsent = useCallback(() => {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      setConsent(DEFAULT_CONSENT);
      setShowBanner(true);
    } catch (error) {
      console.error('Erreur lors de la révocation du consentement:', error);
    }
  }, []);

  const value = {
    // État
    consent,
    showBanner,
    showPreferences,
    isLoaded,
    
    // Actions
    acceptAll,
    rejectAll,
    savePreferences,
    hasConsent,
    openPreferences,
    closePreferences,
    revokeConsent,
    
    // Constantes
    COOKIE_CATEGORIES,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export default CookieConsentContext;

