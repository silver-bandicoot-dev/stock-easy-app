/**
 * CookieBanner - Bannière de consentement aux cookies (RGPD)
 * 
 * Design moderne et élégant, conforme aux bonnes pratiques UX:
 * - Apparaît en bas de l'écran
 * - Options claires: Accepter tout, Refuser, Personnaliser
 * - Animation fluide d'entrée/sortie
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Settings, Shield, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from '../../contexts/CookieConsentContext';

const CookieBanner = () => {
  const { t } = useTranslation();
  const { showBanner, acceptAll, rejectAll, openPreferences } = useCookieConsent();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E4DF] overflow-hidden">
              {/* Header avec icône */}
              <div className="bg-gradient-to-r from-[#191919] to-[#2D2D2D] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Cookie className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {t('cookies.banner.title', 'Nous respectons votre vie privée')}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {t('cookies.banner.subtitle', 'Gérez vos préférences de cookies')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6">
                <p className="text-[#666663] text-sm leading-relaxed mb-6">
                  {t('cookies.banner.description', 
                    "Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. Les cookies essentiels sont nécessaires au fonctionnement du site. Vous pouvez accepter tous les cookies, les refuser ou personnaliser vos choix."
                  )}
                </p>

                {/* Résumé des catégories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  <div className="flex items-start gap-2 p-3 bg-[#F0FDF4] rounded-lg border border-[#BBF7D0]">
                    <Shield className="w-4 h-4 text-[#16A34A] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#166534]">
                        {t('cookies.categories.essential.name', 'Essentiels')}
                      </p>
                      <p className="text-xs text-[#166534]/70">
                        {t('cookies.categories.essential.shortDesc', 'Toujours actifs')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-[#FEF3C7] rounded-lg border border-[#FDE68A]">
                    <Cookie className="w-4 h-4 text-[#D97706] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#92400E]">
                        {t('cookies.categories.analytics.name', 'Analytiques')}
                      </p>
                      <p className="text-xs text-[#92400E]/70">
                        {t('cookies.categories.analytics.shortDesc', 'Monitoring & erreurs')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-[#EFF6FF] rounded-lg border border-[#BFDBFE]">
                    <Settings className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#1E40AF]">
                        {t('cookies.categories.preferences.name', 'Préférences')}
                      </p>
                      <p className="text-xs text-[#1E40AF]/70">
                        {t('cookies.categories.preferences.shortDesc', 'Langue & devise')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={rejectAll}
                    className="flex-1 px-4 py-3 text-sm font-medium text-[#666663] bg-[#FAFAF7] hover:bg-[#E5E4DF] border border-[#E5E4DF] rounded-xl transition-colors"
                  >
                    {t('cookies.banner.rejectAll', 'Refuser tout')}
                  </button>
                  <button
                    onClick={openPreferences}
                    className="flex-1 px-4 py-3 text-sm font-medium text-[#191919] bg-white hover:bg-[#FAFAF7] border border-[#191919] rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {t('cookies.banner.customize', 'Personnaliser')}
                  </button>
                  <button
                    onClick={acceptAll}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-[#191919] hover:bg-[#2D2D2D] rounded-xl transition-colors"
                  >
                    {t('cookies.banner.acceptAll', 'Accepter tout')}
                  </button>
                </div>

                {/* Lien vers la politique */}
                <p className="text-center text-xs text-[#666663] mt-4">
                  {t('cookies.banner.learnMore', 'En savoir plus dans notre')}{' '}
                  <a 
                    href="/legal/cookies" 
                    className="text-[#191919] underline hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('cookies.banner.cookiePolicy', 'Politique de Cookies')}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;

