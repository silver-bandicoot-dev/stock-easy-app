import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Pricing = () => {
  const { t } = useTranslation();

  const basicFeatures = [
    t('landing.pricing.features.unlimitedSkus', "SKUs illimités"),
    t('landing.pricing.features.realTimeSync', "Sync Shopify temps réel"),
    t('landing.pricing.features.supplierOrders', "Gestion complète des commandes fournisseurs"),
    t('landing.pricing.features.fullDashboard', "Dashboard complet"),
    t('landing.pricing.features.aiPredictions', "Prédictions IA"),
    t('landing.pricing.features.advancedReports', "Rapports avancés"),
    t('landing.pricing.features.oneLocation', "1 emplacement de sync des stocks"),
  ];

  const proFeatures = [
    t('landing.pricing.features.allBasicFeatures', "Toutes les fonctionnalités du Plan Basic"),
    t('landing.pricing.features.threeLocations', "3 emplacements de sync des stocks"),
  ];

  // Vert Spotify
  const spotifyGreen = '#1DB954';

  return (
    <section id="pricing" className="landing-section bg-[#FAFAF7] overflow-hidden">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#191919] text-white text-xs font-medium mb-6">
            <Zap size={12} style={{ color: spotifyGreen }} />
            {t('landing.navbar.pricing', 'Tarifs')}
          </span>
          <h2 className="text-3xl md:text-5xl font-semibold mb-4 text-[#191919]">
            {t('landing.pricing.title', 'Simple et transparent')}
          </h2>
          <p className="text-[#191919]/50 max-w-md mx-auto text-lg">
            {t('landing.pricing.subtitle', "Un seul plan avec toutes les fonctionnalités dont vous avez besoin")}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          
          {/* Plan Basic - Principal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#191919] to-[#2a2a2a] rounded-2xl transform group-hover:scale-[1.02] transition-transform duration-300" />
            <div className="relative bg-gradient-to-b from-[#191919] to-[#252525] rounded-2xl p-8 h-full border border-[#333]">
              
              {/* Badge */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: spotifyGreen }} />
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: spotifyGreen }}>
                    {t('landing.pricing.available', 'Disponible maintenant')}
                  </span>
                </div>
              </div>

              {/* Header */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#FFFFFF' }}>Basic</h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {t('landing.pricing.plans.basic.description', "Tout ce qu'il faut pour gérer votre inventaire")}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">29</span>
                  <span className="text-2xl font-medium text-white/70">$</span>
                  <span className="text-white/40 ml-2">{t('landing.pricing.perMonth', '/mois')}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {basicFeatures.map((feature, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${spotifyGreen}20` }}>
                      <Check size={11} style={{ color: spotifyGreen }} strokeWidth={3} />
                    </div>
                    <span className="text-white/80 text-sm">
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="https://apps.shopify.com/stockeasy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-all bg-white text-[#191919]"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = spotifyGreen;
                  e.currentTarget.style.boxShadow = `0 10px 40px ${spotifyGreen}40`;
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.color = '#191919';
                }}
              >
                {t('landing.pricing.plans.basic.cta', 'Commencer maintenant')}
                <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>

          {/* Plan Pro - Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl p-8 h-full border border-[#E5E4DF] overflow-hidden">
              
              {/* Subtle pattern background */}
              <div className="absolute inset-0 opacity-[0.03]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#191919" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              <div className="relative z-10">
                {/* Badge */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-[#191919]/40" />
                    <span className="text-[#191919]/40 text-xs font-medium uppercase tracking-wider">
                      {t('landing.pricing.comingSoon', 'En développement')}
                    </span>
                  </div>
                </div>

                {/* Header */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-[#191919] mb-2">Pro</h3>
                  <p className="text-[#191919]/50 text-sm">
                    {t('landing.pricing.plans.pro.description', "Pour les marchands multi-emplacements")}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-[#191919]">69</span>
                    <span className="text-2xl font-medium text-[#191919]/50">$</span>
                    <span className="text-[#191919]/30 ml-2">{t('landing.pricing.perMonth', '/mois')}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#E5E4DF] mb-8" />

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {proFeatures.map((feature, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-[#191919]/5 flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-[#191919]/60" strokeWidth={3} />
                      </div>
                      <span className="text-[#191919]/70 text-sm">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                {/* Coming Soon Box */}
                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E5E4DF]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#191919]/5 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#191919]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 6v6l4 2" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#191919]/70">
                        {t('landing.pricing.plans.pro.comingSoonMessage', 'Bientôt disponible')}
                      </p>
                      <p className="text-xs text-[#191919]/40">
                        Nous y travaillons activement
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-[#191919]/50"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{t('landing.pricing.benefits.quickSetup', 'Installation en 2 minutes')}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{t('landing.pricing.benefits.supportIncluded', 'Support inclus')}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{t('landing.pricing.benefits.cancelAnytime', 'Annulation à tout moment')}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
