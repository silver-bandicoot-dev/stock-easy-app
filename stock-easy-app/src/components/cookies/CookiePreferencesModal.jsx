/**
 * CookiePreferencesModal - Modal de gestion granulaire des cookies
 * 
 * Permet à l'utilisateur de:
 * - Voir les détails de chaque catégorie de cookies
 * - Activer/désactiver chaque catégorie individuellement
 * - Sauvegarder ses préférences personnalisées
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Cookie, Settings, BarChart3, Globe, Check, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCookieConsent, COOKIE_CATEGORIES } from '../../contexts/CookieConsentContext';

// Configuration des catégories avec détails
const getCategoryConfig = (t) => [
  {
    id: COOKIE_CATEGORIES.ESSENTIAL,
    name: t('cookies.categories.essential.name', 'Cookies Essentiels'),
    icon: Shield,
    color: 'emerald',
    bgColor: 'bg-[#F0FDF4]',
    borderColor: 'border-[#BBF7D0]',
    iconColor: 'text-[#16A34A]',
    textColor: 'text-[#166534]',
    description: t('cookies.categories.essential.description', 
      "Ces cookies sont nécessaires au fonctionnement du site. Ils permettent de maintenir votre session connectée, de mémoriser vos choix de navigation et d'assurer la sécurité de votre compte."
    ),
    details: [
      t('cookies.categories.essential.details.auth', 'Authentification et session utilisateur'),
      t('cookies.categories.essential.details.security', 'Sécurité et protection CSRF'),
      t('cookies.categories.essential.details.navigation', 'État de navigation'),
    ],
    required: true,
  },
  {
    id: COOKIE_CATEGORIES.ANALYTICS,
    name: t('cookies.categories.analytics.name', 'Cookies Analytiques'),
    icon: BarChart3,
    color: 'amber',
    bgColor: 'bg-[#FEF3C7]',
    borderColor: 'border-[#FDE68A]',
    iconColor: 'text-[#D97706]',
    textColor: 'text-[#92400E]',
    description: t('cookies.categories.analytics.description',
      "Ces cookies nous aident à comprendre comment vous utilisez l'application, à détecter les erreurs et à améliorer les performances. Ils sont gérés par Sentry, notre outil de monitoring."
    ),
    details: [
      t('cookies.categories.analytics.details.errors', 'Détection et rapport d\'erreurs'),
      t('cookies.categories.analytics.details.performance', 'Monitoring des performances'),
      t('cookies.categories.analytics.details.replay', 'Replay de session (en cas d\'erreur)'),
    ],
    required: false,
  },
  {
    id: COOKIE_CATEGORIES.PREFERENCES,
    name: t('cookies.categories.preferences.name', 'Cookies de Préférences'),
    icon: Settings,
    color: 'blue',
    bgColor: 'bg-[#EFF6FF]',
    borderColor: 'border-[#BFDBFE]',
    iconColor: 'text-[#2563EB]',
    textColor: 'text-[#1E40AF]',
    description: t('cookies.categories.preferences.description',
      "Ces cookies mémorisent vos préférences personnelles comme la langue, la devise et vos paramètres d'affichage pour vous offrir une expérience personnalisée."
    ),
    details: [
      t('cookies.categories.preferences.details.language', 'Langue de l\'interface'),
      t('cookies.categories.preferences.details.currency', 'Devise préférée'),
      t('cookies.categories.preferences.details.display', 'Préférences d\'affichage'),
    ],
    required: false,
  },
];

// Composant Toggle Switch
const ToggleSwitch = ({ enabled, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`
      relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
      transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#191919] focus:ring-offset-2
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${enabled ? 'bg-[#191919]' : 'bg-[#E5E4DF]'}
    `}
  >
    <span
      className={`
        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
        transition duration-200 ease-in-out
        ${enabled ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
  </button>
);

// Composant Catégorie
const CategoryCard = ({ category, enabled, onChange, expanded, onToggleExpand }) => {
  const Icon = category.icon;
  
  return (
    <div className={`rounded-xl border ${category.borderColor} ${category.bgColor} overflow-hidden`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/50`}>
              <Icon className={`w-5 h-5 ${category.iconColor}`} />
            </div>
            <div>
              <h4 className={`font-medium ${category.textColor}`}>
                {category.name}
              </h4>
              {category.required && (
                <span className="text-xs text-[#666663]">
                  Toujours actifs
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {category.required ? (
              <div className="flex items-center gap-1.5 text-xs text-[#16A34A] bg-white/70 px-2 py-1 rounded-full">
                <Check className="w-3.5 h-3.5" />
                <span>Requis</span>
              </div>
            ) : (
              <ToggleSwitch
                enabled={enabled}
                onChange={onChange}
                disabled={category.required}
              />
            )}
          </div>
        </div>
      </div>

      {/* Détails (expandable) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-sm text-[#666663] mb-3">
                  {category.description}
                </p>
                <ul className="space-y-1.5">
                  {category.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-[#666663]">
                      <div className={`w-1.5 h-1.5 rounded-full ${category.iconColor.replace('text-', 'bg-')}`} />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CookiePreferencesModal = () => {
  const { t } = useTranslation();
  const { showPreferences, closePreferences, consent, savePreferences, acceptAll, rejectAll } = useCookieConsent();
  
  // État local pour les préférences en cours d'édition
  const [preferences, setPreferences] = useState({
    [COOKIE_CATEGORIES.ANALYTICS]: false,
    [COOKIE_CATEGORIES.PREFERENCES]: false,
  });
  
  // État pour l'expansion des catégories
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Synchroniser avec le consentement actuel à l'ouverture
  useEffect(() => {
    if (showPreferences) {
      setPreferences({
        [COOKIE_CATEGORIES.ANALYTICS]: consent.categories[COOKIE_CATEGORIES.ANALYTICS] || false,
        [COOKIE_CATEGORIES.PREFERENCES]: consent.categories[COOKIE_CATEGORIES.PREFERENCES] || false,
      });
    }
  }, [showPreferences, consent.categories]);

  const categories = getCategoryConfig(t);

  const handleToggleCategory = (categoryId, value) => {
    setPreferences(prev => ({
      ...prev,
      [categoryId]: value,
    }));
  };

  const handleSave = () => {
    savePreferences(preferences);
  };

  const handleToggleExpand = (categoryId) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  };

  return (
    <AnimatePresence>
      {showPreferences && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={closePreferences}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-[9999] flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#191919] to-[#2D2D2D] px-6 py-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Cookie className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {t('cookies.preferences.title', 'Préférences de cookies')}
                      </h3>
                      <p className="text-white/70 text-sm">
                        {t('cookies.preferences.subtitle', 'Gérez vos choix par catégorie')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closePreferences}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Contenu scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Info */}
                <div className="flex items-start gap-3 p-3 bg-[#F0F9FF] rounded-lg border border-[#BAE6FD] mb-6">
                  <Info className="w-5 h-5 text-[#0284C7] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#0369A1]">
                    {t('cookies.preferences.info', 
                      "Cliquez sur chaque catégorie pour voir les détails. Les cookies essentiels ne peuvent pas être désactivés car ils sont nécessaires au fonctionnement de l'application."
                    )}
                  </p>
                </div>

                {/* Catégories */}
                <div className="space-y-3">
                  {categories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      enabled={category.required || preferences[category.id]}
                      onChange={(value) => handleToggleCategory(category.id, value)}
                      expanded={expandedCategory === category.id}
                      onToggleExpand={() => handleToggleExpand(category.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Footer avec actions */}
              <div className="border-t border-[#E5E4DF] p-4 bg-[#FAFAF7] shrink-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={rejectAll}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-[#666663] hover:text-[#191919] hover:bg-[#E5E4DF] rounded-xl transition-colors"
                  >
                    {t('cookies.preferences.rejectAll', 'Tout refuser')}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-[#191919] bg-white hover:bg-[#FAFAF7] border border-[#191919] rounded-xl transition-colors"
                  >
                    {t('cookies.preferences.saveChoices', 'Enregistrer mes choix')}
                  </button>
                  <button
                    onClick={acceptAll}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#191919] hover:bg-[#2D2D2D] rounded-xl transition-colors"
                  >
                    {t('cookies.preferences.acceptAll', 'Tout accepter')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CookiePreferencesModal;

