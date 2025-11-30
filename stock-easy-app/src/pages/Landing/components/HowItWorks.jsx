import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Download, Link2, Settings, Rocket, Check, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const { t } = useTranslation();
  
  const steps = [
    {
      number: "1",
      icon: Download,
      title: t('landing.howItWorks.steps.install.title', "Installez l'app"),
      description: t('landing.howItWorks.steps.install.description', "Installez stockeasy depuis le Shopify App Store en un clic."),
      time: "30 sec",
    },
    {
      number: "2",
      icon: Link2,
      title: t('landing.howItWorks.steps.connect.title', "Connectez votre boutique"),
      description: t('landing.howItWorks.steps.connect.description', "Autorisez l'accès à votre boutique Shopify. Nous importons votre catalogue produits automatiquement."),
      time: "2 min",
    },
    {
      number: "3",
      icon: Settings,
      title: t('landing.howItWorks.steps.configure.title', "Configurez vos alertes"),
      description: t('landing.howItWorks.steps.configure.description', "Définissez vos seuils et canaux de notification."),
      time: "5 min",
    },
    {
      number: "4",
      icon: Rocket,
      title: t('landing.howItWorks.steps.launch.title', "Laissez l'IA travailler"),
      description: t('landing.howItWorks.steps.launch.description', "Recevez vos premières recommandations sous 24h."),
      time: "Auto",
    },
  ];

  const benefits = [
    t('landing.howItWorks.benefits.freeTrial', "14 jours d'essai gratuit"),
    t('landing.howItWorks.benefits.multilingualSupport', "Support en français, anglais et espagnol"),
  ];

  return (
    <section id="how-it-works" className="landing-section bg-[#FAFAF7]">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge badge-neutral mb-4">{t('landing.navbar.howItWorks', 'Comment ça marche')}</span>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            {t('landing.howItWorks.title', 'Connecté à votre boutique Shopify en 2 min')}
          </h2>
          <p className="text-[#191919]/60 max-w-lg mx-auto">
            {t('landing.howItWorks.subtitle', "Simple, rapide, efficace. Pas besoin d'être technique.")}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="card p-6 text-center h-full">
                {/* Number */}
                <div className="w-8 h-8 rounded-full bg-[#191919] text-white font-semibold text-sm flex items-center justify-center mx-auto mb-4">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-[#FAFAF7] border border-[#E5E4DF] flex items-center justify-center mx-auto mb-4">
                  <step.icon size={28} className="text-[#191919]" />
                </div>

                {/* Title */}
                <h3 className="font-semibold text-[#191919] mb-2">{step.title}</h3>

                {/* Description */}
                <p className="text-sm text-[#191919]/60 mb-4">
                  {step.number === "2" 
                    ? "Autorisez l'accès à votre boutique Shopify. Nous importons votre catalogue produits automatiquement."
                    : step.description}
                </p>

                {/* Time */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAFAF7] border border-[#E5E4DF]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-xs text-[#191919]/60">{step.time}</span>
                </div>
              </div>

              {/* Arrow connector (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight size={18} className="text-[#191919]/20" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex flex-wrap items-center gap-6">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <Check size={16} className="text-[#10B981]" />
                <span className="text-sm text-[#191919]/70">{benefit}</span>
              </div>
            ))}
          </div>

          <a
            href="https://apps.shopify.com/stockeasy"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary whitespace-nowrap"
          >
            <img 
              src="/logos/shopify-white.svg" 
              alt="Shopify" 
              className="w-4 h-4 object-contain"
            />
            {t('landing.howItWorks.cta', 'Commencer maintenant')}
            <ArrowRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
