import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

/**
 * Composant de sélection de langue
 * @param {Object} props
 * @param {string} props.variant - 'dropdown' | 'inline' | 'compact' | 'buttons'
 * @param {string} props.theme - 'light' | 'dark'
 * @param {boolean} props.showFlag - Afficher le drapeau emoji
 * @param {boolean} props.showLabel - Afficher le label de la langue
 * @param {string} props.className - Classes CSS supplémentaires
 */
const LanguageSwitcher = ({ 
  variant = 'dropdown', 
  theme = 'light',
  showFlag = true,
  showLabel = true,
  className = ''
}) => {
  const { currentLanguage, setLanguage, supportedLanguages, isChanging } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = supportedLanguages.find(l => l.code === currentLanguage) || supportedLanguages[0];

  const handleLanguageChange = async (code) => {
    await setLanguage(code);
    setIsOpen(false);
  };

  // Styles selon le thème
  const themeStyles = {
    light: {
      button: 'bg-white border-[#E5E4DF] hover:bg-[#FAFAF7] text-[#191919]',
      dropdown: 'bg-white border-[#E5E4DF]',
      item: 'hover:bg-[#FAFAF7] text-[#191919]',
      itemActive: 'bg-[#FAFAF7]'
    },
    dark: {
      button: 'bg-[#191919]/90 border-[#333] hover:bg-[#2A2A2A] text-white',
      dropdown: 'bg-[#191919] border-[#333]',
      item: 'hover:bg-[#2A2A2A] text-white',
      itemActive: 'bg-[#2A2A2A]'
    }
  };

  const styles = themeStyles[theme];

  // Variant: Boutons en ligne
  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isChanging}
            className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
              currentLanguage === lang.code
                ? theme === 'light' 
                  ? 'bg-[#191919] text-white' 
                  : 'bg-white text-[#191919]'
                : styles.item
            } border ${styles.button.includes('border') ? '' : 'border-transparent'}`}
          >
            {showFlag && <span className="mr-1.5">{lang.flag}</span>}
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Variant: Compact (juste le code langue)
  if (variant === 'compact') {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isChanging}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all ${styles.button}`}
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">{currentLanguage.toUpperCase()}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute right-0 mt-2 min-w-[120px] rounded-lg border shadow-lg py-1 z-50 ${styles.dropdown}`}
            >
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${styles.item} ${
                    currentLanguage === lang.code ? styles.itemActive : ''
                  }`}
                >
                  {showFlag && <span>{lang.flag}</span>}
                  <span className="flex-1 text-left">{lang.code.toUpperCase()}</span>
                  {currentLanguage === lang.code && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Variant: Inline (pour les formulaires)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && (
          <label className="text-sm text-[#666663] flex items-center gap-1.5">
            <Globe className="w-4 h-4" />
            {t('profile.language')}
          </label>
        )}
        <select
          value={currentLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={isChanging}
          className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#191919]/10 transition-all ${
            theme === 'light' 
              ? 'bg-white border-[#E5E4DF] text-[#191919]' 
              : 'bg-[#2A2A2A] border-[#444] text-white'
          }`}
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {showFlag ? `${lang.flag} ` : ''}{lang.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Variant: Dropdown (par défaut)
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${styles.button}`}
      >
        <Globe className="w-4 h-4" />
        {showFlag && <span>{currentLang.flag}</span>}
        {showLabel && <span className="text-sm font-medium">{currentLang.name}</span>}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 mt-2 min-w-[160px] rounded-lg border shadow-lg py-1 z-50 ${styles.dropdown}`}
          >
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${styles.item} ${
                  currentLanguage === lang.code ? styles.itemActive : ''
                }`}
              >
                {showFlag && <span className="text-base">{lang.flag}</span>}
                <span className="flex-1 text-left font-medium">{lang.name}</span>
                {currentLanguage === lang.code && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;

