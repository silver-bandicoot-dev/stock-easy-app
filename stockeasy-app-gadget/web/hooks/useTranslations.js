import { useState, useEffect, useCallback } from 'react';
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
      if (typeof window === 'undefined') return null;
      if (!window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window === 'undefined') return;
      if (!window.localStorage) return;
      window.localStorage.setItem(key, value);
    } catch (e) {
      // ignore
    }
  }
};

/**
 * Detect the best language to use
 */
const detectLanguage = () => {
  // 1. Check localStorage
  const stored = safeStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
    return stored;
  }

  // 2. Try Shopify locale
  try {
    if (typeof window !== 'undefined' && window.shopify?.config?.locale) {
      const shopifyLang = window.shopify.config.locale.split('-')[0];
      if (SUPPORTED_LANGUAGES.includes(shopifyLang)) {
        return shopifyLang;
      }
    }
  } catch (e) {}

  // 3. Check navigator language
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const navLang = navigator.language.split('-')[0];
      if (SUPPORTED_LANGUAGES.includes(navLang)) {
        return navLang;
      }
    }
  } catch (e) {}

  return DEFAULT_LANGUAGE;
};

/**
 * Interpolate variables in translation string
 */
const interpolate = (str, vars) => {
  if (!str || typeof str !== 'string') return str;
  if (!vars || Object.keys(vars).length === 0) return str;
  
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
};

/**
 * SIMPLIFIED Hook for translations - React 19 compatible
 * Removed useMemo and useRef to avoid React #310 error
 */
export const useTranslations = () => {
  const [language, setLanguage] = useState(detectLanguage);

  // Save language preference
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  // Get current translations directly (no memoization needed for this simple lookup)
  const currentTranslations = translations[language] || translations[DEFAULT_LANGUAGE];

  // Translation function - include language in deps to update when language changes
  const t = useCallback((key, vars) => {
    const trans = translations[language] || translations[DEFAULT_LANGUAGE];
    const value = trans[key];
    
    if (value === undefined) {
      console.warn(`Translation missing: ${key}`);
      return key;
    }
    
    return interpolate(value, vars);
  }, [language]);

  // Change language
  const changeLanguage = useCallback((newLang) => {
    if (SUPPORTED_LANGUAGES.includes(newLang)) {
      setLanguage(newLang);
    }
  }, []);

  // Format time ago
  const formatTimeAgo = useCallback((date) => {
    const trans = translations[language] || translations[DEFAULT_LANGUAGE];
    
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
  }, [language]);

  return {
    t,
    language,
    changeLanguage,
    formatTimeAgo,
    supportedLanguages: SUPPORTED_LANGUAGES
  };
};

export default useTranslations;
