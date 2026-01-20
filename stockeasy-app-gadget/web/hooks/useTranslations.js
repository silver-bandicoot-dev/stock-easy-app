import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { translations } from '../locales';

const SUPPORTED_LANGUAGES = ['fr', 'en', 'es'];
const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'stockeasy_shopify_lang';

/**
 * Safe localStorage access for iframe context
 */
const safeStorage = {
  getItem: (key) => {
    try {
      // Check if we're in a secure context first
      if (typeof window === 'undefined') return null;
      if (!window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      // SecurityError in cross-origin iframe
      console.warn('localStorage not available:', e.message);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window === 'undefined') return;
      if (!window.localStorage) return;
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage not available:', e.message);
    }
  }
};

/**
 * Detect the best language to use
 * Priority: localStorage > Shopify locale > navigator language > default
 */
const detectLanguage = () => {
  // 1. Check localStorage (safe)
  const stored = safeStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
    return stored;
  }

  // 2. Try to get Shopify locale from shopify global
  try {
    if (typeof window !== 'undefined' && window.shopify?.config?.locale) {
      const shopifyLang = window.shopify.config.locale.split('-')[0];
      if (SUPPORTED_LANGUAGES.includes(shopifyLang)) {
        return shopifyLang;
      }
    }
  } catch (e) {
    // shopify not available
  }

  // 3. Check navigator language (safe)
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const navLang = navigator.language.split('-')[0];
      if (SUPPORTED_LANGUAGES.includes(navLang)) {
        return navLang;
      }
    }
  } catch (e) {
    // navigator not available
  }

  // 4. Default
  return DEFAULT_LANGUAGE;
};

/**
 * Interpolate variables in translation string
 * e.g., "{{count}} items" with {count: 5} => "5 items"
 */
const interpolate = (str, vars) => {
  if (!str || typeof str !== 'string') return str;
  if (!vars || Object.keys(vars).length === 0) return str;
  
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
};

/**
 * Hook for translations in Stockeasy Shopify App
 * Fixed to avoid React #310 error with useCallback dependencies
 */
export const useTranslations = () => {
  const [language, setLanguage] = useState(() => {
    // Initialize synchronously to avoid hydration mismatch
    try {
      return detectLanguage();
    } catch (e) {
      return DEFAULT_LANGUAGE;
    }
  });

  // Save language preference (safe)
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  // Get current translations - use ref to avoid circular dependencies
  const currentTranslations = useMemo(() => {
    return translations[language] || translations[DEFAULT_LANGUAGE];
  }, [language]);

  // Store translations in ref for stable access in callbacks
  const translationsRef = useRef(currentTranslations);
  translationsRef.current = currentTranslations;

  // Translation function - stable reference using ref
  const t = useCallback((key, vars) => {
    const value = translationsRef.current[key];
    
    if (value === undefined) {
      console.warn(`Translation missing: ${key}`);
      return key;
    }
    
    return interpolate(value, vars);
  }, []); // No dependencies - uses ref for stable access

  // Change language
  const changeLanguage = useCallback((newLang) => {
    if (SUPPORTED_LANGUAGES.includes(newLang)) {
      setLanguage(newLang);
    }
  }, []);

  // Format time ago with translations - stable reference
  const formatTimeAgo = useCallback((date) => {
    const trans = translationsRef.current;
    
    if (!date) return trans.never || 'Never';
    
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return trans.justNow || 'Just now';
    if (seconds < 3600) {
      const count = Math.floor(seconds / 60);
      return interpolate(trans.minutesAgo, { count }) || `${count} min ago`;
    }
    if (seconds < 86400) {
      const count = Math.floor(seconds / 3600);
      return interpolate(trans.hoursAgo, { count }) || `${count}h ago`;
    }
    const count = Math.floor(seconds / 86400);
    return interpolate(trans.daysAgo, { count }) || `${count} day(s) ago`;
  }, []); // No dependencies - uses ref for stable access

  return {
    t,
    language,
    changeLanguage,
    formatTimeAgo,
    supportedLanguages: SUPPORTED_LANGUAGES
  };
};

export default useTranslations;
