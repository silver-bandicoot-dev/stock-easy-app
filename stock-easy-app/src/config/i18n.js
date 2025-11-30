import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import des fichiers de traduction
import frTranslation from '../locales/fr/translation.json';
import enTranslation from '../locales/en/translation.json';
import esTranslation from '../locales/es/translation.json';

// Langues supportées
export const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

// Clé de stockage local pour la langue
const LANGUAGE_STORAGE_KEY = 'stockeasy_language';

// Récupérer la langue sauvegardée ou détecter automatiquement
const getInitialLanguage = () => {
  // 1. Vérifier le localStorage (préférence utilisateur)
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (savedLanguage && SUPPORTED_LANGUAGES.some(l => l.code === savedLanguage)) {
    return savedLanguage;
  }

  // 2. Détecter la langue du navigateur
  const browserLanguage = navigator.language?.split('-')[0] || 'fr';
  if (SUPPORTED_LANGUAGES.some(l => l.code === browserLanguage)) {
    return browserLanguage;
  }

  // 3. Langue par défaut
  return 'fr';
};

const resources = {
  fr: { translation: frTranslation },
  en: { translation: enTranslation },
  es: { translation: esTranslation }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Fonction pour changer la langue et la persister
export const changeLanguage = (languageCode) => {
  if (SUPPORTED_LANGUAGES.some(l => l.code === languageCode)) {
    i18n.changeLanguage(languageCode);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    // Mettre à jour l'attribut lang du document HTML
    document.documentElement.lang = languageCode;
    return true;
  }
  return false;
};

// Fonction pour obtenir la langue actuelle
export const getCurrentLanguage = () => i18n.language;

// Fonction pour obtenir les infos de la langue actuelle
export const getCurrentLanguageInfo = () => {
  return SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];
};

export default i18n;
