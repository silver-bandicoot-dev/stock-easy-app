import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CTA = () => {
  const { t } = useTranslation();
  
  const benefits = [
    t('landing.cta.benefits.quickSetup'),
    t('landing.cta.benefits.multilingualSupport')
  ];

  return (
    <section className="landing-section bg-gradient-to-br from-[#191919] to-[#2a2a2a] text-white">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          {/* Badge avec urgence */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6">
            <span className="text-sm text-white/90">
              {t('landing.cta.urgencyBadge')}
            </span>
          </div>

          {/* Headline avec urgence */}
          <h2 className="text-3xl md:text-5xl font-semibold mb-4 text-white !text-white" style={{ color: '#FFFFFF' }}>
            {t('landing.cta.title')}
          </h2>

          {/* Subheadline */}
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>

          {/* CTA Principal */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <motion.a
              href="https://apps.shopify.com/stockeasy"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl text-lg"
            >
              <img 
                src="/logos/shopify-white.svg" 
                alt="Shopify" 
                className="w-5 h-5 object-contain"
              />
              {t('landing.cta.mainButton')}
              <ArrowRight size={20} />
            </motion.a>
            
            {/* Trust indicators sous le bouton */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <Check size={16} className="text-[#10B981]" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
