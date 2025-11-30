import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Pricing = () => {
  const { t } = useTranslation();
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Basic",
      description: t('landing.pricing.plans.basic.description', "Pour débuter"),
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        { text: t('landing.pricing.features.oneLocation', "1 emplacement de sync"), included: true },
        { text: t('landing.pricing.features.skus500', "Jusqu'à 500 SKUs"), included: true },
        { text: t('landing.pricing.features.emailAlerts', "Alertes par email"), included: true },
        { text: t('landing.pricing.features.realTimeSync', "Sync Shopify temps réel"), included: true },
        { text: t('landing.pricing.features.basicDashboard', "Dashboard basique"), included: true },
        { text: t('landing.pricing.features.aiPredictions', "Prédictions IA"), included: false },
        { text: t('landing.pricing.features.advancedReports', "Rapports avancés"), included: false },
        { text: t('landing.pricing.features.prioritySupport', "Support prioritaire"), included: false },
      ],
      cta: t('landing.pricing.plans.basic.cta', "Commencer gratuitement"),
      popular: false,
    },
    {
      name: "Pro",
      description: t('landing.pricing.plans.pro.description', "Pour les marchands en croissance"),
      monthlyPrice: 29,
      annualPrice: 24,
      features: [
        { text: t('landing.pricing.features.threeLocations', "3 emplacements de sync"), included: true },
        { text: t('landing.pricing.features.skus5000', "Jusqu'à 5,000 SKUs"), included: true },
        { text: t('landing.pricing.features.multiChannelAlerts', "Alertes multi-canaux"), included: true },
        { text: t('landing.pricing.features.realTimeSync', "Sync Shopify temps réel"), included: true },
        { text: t('landing.pricing.features.fullDashboard', "Dashboard complet"), included: true },
        { text: t('landing.pricing.features.aiPredictions', "Prédictions IA"), included: true },
        { text: t('landing.pricing.features.advancedReports', "Rapports avancés"), included: true },
        { text: t('landing.pricing.features.prioritySupport', "Support prioritaire"), included: false },
      ],
      cta: t('landing.pricing.plans.pro.cta', "Essayer 14 jours gratuit"),
      popular: true,
    },
    {
      name: "Plus",
      description: t('landing.pricing.plans.plus.description', "Pour les entreprises"),
      monthlyPrice: 79,
      annualPrice: 66,
      features: [
        { text: t('landing.pricing.features.fifteenLocations', "15 emplacements de sync"), included: true },
        { text: t('landing.pricing.features.unlimitedSkus', "SKUs illimités"), included: true },
        { text: t('landing.pricing.features.multiChannelAlerts', "Alertes multi-canaux"), included: true },
        { text: t('landing.pricing.features.realTimeSync', "Sync Shopify temps réel"), included: true },
        { text: t('landing.pricing.features.fullDashboard', "Dashboard complet"), included: true },
        { text: t('landing.pricing.features.advancedAiPredictions', "Prédictions IA avancées"), included: true },
        { text: t('landing.pricing.features.customReports', "Rapports personnalisés"), included: true },
        { text: t('landing.pricing.features.prioritySupport247', "Support prioritaire 24/7"), included: true },
      ],
      cta: t('landing.pricing.plans.plus.cta', "Contacter les ventes"),
      popular: false,
    },
  ];

  const faqs = [
    {
      question: t('landing.pricing.faqs.changePlan.question', "Puis-je changer de plan à tout moment ?"),
      answer: t('landing.pricing.faqs.changePlan.answer', "Oui, vous pouvez upgrader ou downgrader à tout moment.")
    },
    {
      question: t('landing.pricing.faqs.hiddenFees.question', "Y a-t-il des frais cachés ?"),
      answer: t('landing.pricing.faqs.hiddenFees.answer', "Non, le prix affiché est le prix final.")
    },
    {
      question: t('landing.pricing.faqs.freeTrial.question', "Comment fonctionne l'essai gratuit ?"),
      answer: t('landing.pricing.faqs.freeTrial.answer', "14 jours d'accès au plan Pro, sans carte bancaire.")
    },
  ];

  return (
    <section id="pricing" className="landing-section bg-[#FAFAF7]">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="badge badge-neutral mb-4">{t('landing.navbar.pricing', 'Tarifs')}</span>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            {t('landing.pricing.title', 'Un plan pour chaque étape')}
          </h2>
          <p className="text-[#191919]/60 max-w-lg mx-auto mb-8">
            {t('landing.pricing.subtitle', "Commencez gratuitement, évoluez quand vous êtes prêt")}
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center p-1 rounded-lg bg-white border border-[#E5E4DF]">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                !isAnnual ? 'bg-[#191919] text-white' : 'text-[#191919]/60'
              }`}
            >
              {t('landing.pricing.monthly', 'Mensuel')}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                isAnnual ? 'bg-[#191919] text-white' : 'text-[#191919]/60'
              }`}
            >
              {t('landing.pricing.yearly', 'Annuel')}
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                isAnnual ? 'bg-white/20' : 'bg-[#ECFDF5] text-[#059669]'
              }`}>
                -17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="px-3 py-1 bg-[#191919] text-white text-xs font-medium rounded-full">
                    {t('landing.pricing.popular', 'Le plus populaire')}
                  </div>
                </div>
              )}

              <div className={`card p-6 h-full ${plan.popular ? 'pricing-popular' : ''}`}>
                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-[#191919] mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#191919]/50">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl font-semibold text-[#191919]">
                      {isAnnual ? plan.annualPrice : plan.monthlyPrice}€
                    </span>
                    <span className="text-[#191919]/50 mb-1">{t('landing.pricing.perMonth', '/mois')}</span>
                  </div>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-[#191919]/40 mt-1">
                      {t('landing.pricing.billedAnnually', 'Facturé annuellement')}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check size={16} className="text-[#10B981] flex-shrink-0" />
                      ) : (
                        <X size={16} className="text-[#191919]/20 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-[#191919]/70' : 'text-[#191919]/30'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="https://apps.shopify.com/stockeasy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all ${
                    plan.popular
                      ? 'bg-[#191919] text-white hover:bg-[#2D2D2D]'
                      : 'bg-[#FAFAF7] text-[#191919] border border-[#E5E4DF] hover:bg-[#F0F0ED]'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h3 className="text-lg font-semibold text-[#191919] text-center mb-6">
            {t('landing.pricing.faqTitle', 'Questions fréquentes')}
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="card p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle size={18} className="text-[#191919]/40 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-[#191919] mb-1">{faq.question}</h4>
                    <p className="text-sm text-[#191919]/60">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
