import { motion } from 'framer-motion';
import { ArrowRight, Package, TrendingUp, Zap, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { t } = useTranslation();

  const stats = [
    { value: '40%', label: t('landing.hero.stats.reduction') },
    { value: '3h', label: t('landing.hero.stats.timeSaved') },
    // { value: '500+', label: t('landing.hero.stats.activeMerchants') }, - Temporairement retiré, sera réintégré plus tard
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16">
      <div className="landing-container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E4DF]"
            >
              <span className="accent-dot" />
              <span className="text-sm text-[#191919]/70">
                {t('landing.hero.badge')}
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
              {t('landing.hero.title')}{' '}
              <span className="text-[#191919]">{t('landing.hero.titleHighlight')}</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-[#191919]/60 leading-relaxed max-w-md">
              {t('landing.hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <motion.a
                href="https://apps.shopify.com/stockeasy"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary text-base px-6 py-3"
              >
                <img 
                  src="/logos/shopify-white.svg" 
                  alt="Shopify" 
                  className="w-5 h-5 object-contain"
                />
                {t('landing.hero.cta')}
                <ArrowRight size={18} />
              </motion.a>
              <a href="#how-it-works" className="btn-secondary text-base px-6 py-3">
                {t('landing.hero.demo')}
              </a>
            </div>

            {/* Trust indicators - Temporairement caché, sera réintégré plus tard */}
            {/* <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {['M', 'S', 'T', 'J'].map((letter, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-[#E5E4DF] border-2 border-[#FAFAF7] flex items-center justify-center text-xs font-medium text-[#191919]"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-[#191919]/60">{t('landing.hero.merchants')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-amber-500">★★★★★</span>
                <span className="text-sm text-[#191919]/60">4.9/5</span>
              </div>
            </div> */}
          </motion.div>

          {/* Right Content - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Main Dashboard Card - Matching app design */}
            <div className="relative bg-white rounded-xl border border-[#E5E4DF] p-6 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-[#191919]">{t('landing.hero.dashboardPreview.welcome')}</h3>
                  <p className="text-sm text-[#191919]/50">{t('landing.hero.dashboardPreview.overview')}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="text-xs text-[#059669] font-medium">{t('landing.hero.dashboardPreview.synced')}</span>
                </div>
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FCA5A5] bg-[#FEF2F2] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <span className="text-xs text-[#DC2626] font-medium">3 {t('landing.hero.dashboardPreview.skuToOrder')}</span>
              </div>

              {/* KPI Cards - Matching app pastel style */}
              <div className="text-sm text-[#191919]/60 mb-3">{t('landing.hero.dashboardPreview.indicators')}</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('landing.hero.dashboardPreview.skuAvailability'), value: '86%', color: 'orange' },
                  { label: t('landing.hero.dashboardPreview.inventoryValue'), value: '29 300,00 €', color: 'green' },
                  { label: t('landing.hero.dashboardPreview.investmentRequired'), value: '4 000,00 €', color: 'blue' },
                  { label: t('landing.hero.dashboardPreview.toOrder'), value: '3', color: 'purple' },
                ].map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className={`p-4 rounded-lg border kpi-${kpi.color}`}
                  >
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs text-[#191919]/60">{kpi.label}</span>
                    </div>
                    <div className="text-xl font-semibold text-[#191919]">{kpi.value}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-[#10B981]">↗ 0.0%</span>
                      <span className="text-xs text-[#191919]/40">{t('landing.hero.dashboardPreview.vsLastWeek')}</span>
                    </div>
                    {/* Mini chart line */}
                    <div className="mt-2 h-8 flex items-end gap-0.5">
                      {[40, 55, 45, 60, 50, 65, 70].map((h, j) => (
                        <div 
                          key={j} 
                          className={`flex-1 rounded-t ${
                            kpi.color === 'orange' ? 'bg-[#FDBA74]' :
                            kpi.color === 'green' ? 'bg-[#86EFAC]' :
                            kpi.color === 'blue' ? 'bg-[#93C5FD]' :
                            'bg-[#D8B4FE]'
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-white px-3 py-2 rounded-lg border border-[#E5E4DF] shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-500" />
                <span className="text-xs font-medium text-[#191919]">{t('landing.hero.dashboardPreview.aiActive')}</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-[#E5E4DF]"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-semibold text-[#191919] stat-number">
                {stat.value}
              </div>
              <div className="text-sm text-[#191919]/50 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
