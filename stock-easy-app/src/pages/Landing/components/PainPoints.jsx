import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Wallet, TimerOff } from 'lucide-react';

const PainPoints = () => {
  const { t } = useTranslation();

  const painPoints = [
    {
      icon: AlertTriangle,
      title: t('landing.painPoints.stockouts.title'),
      description: t('landing.painPoints.stockouts.description'),
      color: 'red'
    },
    {
      icon: Wallet,
      title: t('landing.painPoints.overstock.title'),
      description: t('landing.painPoints.overstock.description'),
      color: 'orange'
    },
    {
      icon: TimerOff,
      title: t('landing.painPoints.timeWasted.title'),
      description: t('landing.painPoints.timeWasted.description'),
      color: 'blue'
    }
  ];

  return (
    <section className="landing-section bg-white">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-[#191919]">
            {t('landing.painPoints.title')}
          </h2>
          <p className="text-lg text-[#191919]/60 max-w-2xl mx-auto">
            {t('landing.painPoints.subtitle')}
          </p>
        </motion.div>

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {painPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="card p-8 text-center hover:shadow-lg transition-shadow"
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-xl mx-auto mb-6 flex items-center justify-center bg-[#FAFAF7] border border-[#E5E4DF]">
                <point.icon 
                  size={28} 
                  className="text-[#191919]"
                />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-[#191919] mb-4">
                {point.title}
              </h3>

              {/* Description */}
              <p className="text-[#191919]/60 leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPoints;

