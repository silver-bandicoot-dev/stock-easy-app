import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CTA = () => {
  const { t } = useTranslation();
  
  const benefits = [
    t('landing.cta.benefits.freeTrial', "14 jours d'essai gratuit"),
    t('landing.cta.benefits.multilingualSupport', "Support FR, EN, ES"),
    t('landing.cta.benefits.easyCancel', "Annulation en 1 clic"),
  ];

  return (
    <section className="landing-section bg-white">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card p-10 md:p-16 text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAFAF7] border border-[#E5E4DF] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-sm text-[#191919]/70">
              {t('landing.cta.badge', 'Rejoignez 500+ marchands Shopify')}
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-semibold text-[#191919] mb-4">
            {t('landing.cta.title', 'Prêt à optimiser votre gestion de stock ?')}
          </h2>

          {/* Subheadline */}
          <p className="text-lg text-[#191919]/60 mb-8 max-w-md mx-auto">
            {t('landing.cta.subtitle', "Commencez votre essai gratuit aujourd'hui.")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <motion.a
              href="https://apps.shopify.com/stockeasy"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary text-base px-8 py-4"
            >
              <img 
                src="/logos/shopify-white.svg" 
                alt="Shopify" 
                className="w-5 h-5 object-contain"
              />
              {t('landing.cta.installButton', 'Installer sur Shopify')}
              <ArrowRight size={18} />
            </motion.a>
            <a
              href="mailto:contact@stockeasy.app"
              className="btn-secondary text-base px-8 py-4"
            >
              {t('landing.cta.contactButton', 'Nous contacter')}
            </a>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <Check size={16} className="text-[#10B981]" />
                <span className="text-sm text-[#191919]/60">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
