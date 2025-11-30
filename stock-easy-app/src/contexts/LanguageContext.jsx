import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { changeLanguage, getCurrentLanguage, SUPPORTED_LANGUAGES } from '../config/i18n';

const LanguageContext = createContext(null);

// Valeurs par défaut pour utilisation en dehors du provider
const defaultContextValue = {
  currentLanguage: getCurrentLanguage(),
  setLanguage: (languageCode) => changeLanguage(languageCode),
  isChanging: false,
  supportedLanguages: SUPPORTED_LANGUAGES,
  getCurrentLanguageInfo: () => SUPPORTED_LANGUAGES.find(l => l.code === getCurrentLanguage()) || SUPPORTED_LANGUAGES[0]
};

export const LanguageProvider = ({ children }) => {
  const { i18n: i18nInstance } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [isChanging, setIsChanging] = useState(false);

  // Mettre à jour l'état local quand i18n change
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLanguage(lng);
      // Mettre à jour l'attribut lang du document HTML
      document.documentElement.lang = lng;
    };

    i18nInstance.on('languageChanged', handleLanguageChanged);
    
    // Initialiser l'attribut lang
    document.documentElement.lang = currentLanguage;

    return () => {
      i18nInstance.off('languageChanged', handleLanguageChanged);
    };
  }, [i18nInstance, currentLanguage]);

  // Changer la langue
  const setLanguage = useCallback(async (languageCode) => {
    if (languageCode === currentLanguage) return true;
    
    setIsChanging(true);
    try {
      const success = changeLanguage(languageCode);
      if (success) {
        setCurrentLanguage(languageCode);
      }
      return success;
    } finally {
      setIsChanging(false);
    }
  }, [currentLanguage]);

  // Obtenir les informations de la langue actuelle
  const getCurrentLanguageInfo = useCallback(() => {
    return SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  }, [currentLanguage]);

  const value = {
    currentLanguage,
    setLanguage,
    isChanging,
    supportedLanguages: SUPPORTED_LANGUAGES,
    getCurrentLanguageInfo
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  // Si pas de contexte, retourner les valeurs par défaut (fonctionnel sans provider)
  if (!context) {
    console.warn('useLanguage: No LanguageProvider found, using default values');
    return defaultContextValue;
  }
  return context;
};

export default LanguageContext;

