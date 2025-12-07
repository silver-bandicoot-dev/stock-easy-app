import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, TrendingUp, BarChart3, Mail } from 'lucide-react';

const Solution = () => {
  const { t } = useTranslation();

  const solutions = [
    {
      title: t('landing.solution.neverLoseASale.title'),
      subtitle: t('landing.solution.neverLoseASale.subtitle'),
      description: t('landing.solution.neverLoseASale.description'),
      benefits: [
        t('landing.solution.neverLoseASale.benefit1'),
        t('landing.solution.neverLoseASale.benefit2'),
        t('landing.solution.neverLoseASale.benefit3')
      ],
      color: 'green',
      visualType: 'prediction'
    },
    {
      title: t('landing.solution.freeCashFlow.title'),
      subtitle: t('landing.solution.freeCashFlow.subtitle'),
      description: t('landing.solution.freeCashFlow.description'),
      benefits: [
        t('landing.solution.freeCashFlow.benefit1'),
        t('landing.solution.freeCashFlow.benefit2'),
        t('landing.solution.freeCashFlow.benefit3')
      ],
      color: 'blue',
      visualType: 'dashboard'
    },
    {
      title: t('landing.solution.saveTime.title'),
      subtitle: t('landing.solution.saveTime.subtitle'),
      description: t('landing.solution.saveTime.description'),
      benefits: [
        t('landing.solution.saveTime.benefit1'),
        t('landing.solution.saveTime.benefit2'),
        t('landing.solution.saveTime.benefit3'),
        t('landing.solution.saveTime.benefit4')
      ],
      color: 'purple',
      visualType: 'supplier'
    }
  ];

  return (
    <section className="landing-section bg-[#FAFAF7]">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-[#191919]">
            {t('landing.solution.title')}
          </h2>
          <p className="text-lg text-[#191919]/60 max-w-2xl mx-auto">
            {t('landing.solution.subtitle')}
          </p>
        </motion.div>

        {/* Solutions Blocks */}
        <div className="space-y-24">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Content */}
              <div className={`space-y-6 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                {/* Subtitle */}
                <div className="text-xs font-medium text-[#191919]/40 tracking-wider uppercase">
                  {solution.subtitle}
                </div>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-semibold text-[#191919]">
                  {solution.title}
                </h3>

                {/* Description */}
                <p className="text-[#191919]/60 leading-relaxed text-lg">
                  {solution.description}
                </p>

                {/* Benefits List */}
                <ul className="space-y-3">
                  {solution.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        solution.color === 'green' ? 'bg-[#ECFDF5]' :
                        solution.color === 'blue' ? 'bg-[#EFF6FF]' :
                        'bg-[#F3E8FF]'
                      }`}>
                        <Check 
                          size={12} 
                          strokeWidth={3}
                          className={
                            solution.color === 'green' ? 'text-[#059669]' :
                            solution.color === 'blue' ? 'text-[#2563EB]' :
                            'text-[#7C3AED]'
                          }
                        />
                      </div>
                      <span className="text-[#191919]/70">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual Mockup */}
              <div className={`relative ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                {solution.visualType === 'prediction' && (
                  <div className="card p-6 shadow-lg">
                    <div className="mb-4">
                      <h4 className="font-semibold text-[#191919] mb-1">
                        {t('landing.solution.visual.predictions.title')}
                      </h4>
                      <p className="text-xs text-[#191919]/50">
                        {t('landing.solution.visual.predictions.subtitle')}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { product: 'T-Shirt Blanc', days: 7, status: 'critical' },
                        { product: 'Jean Slim Blue', days: 15, status: 'warning' },
                        { product: 'Sneakers Classic', days: 28, status: 'good' }
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="p-3 rounded-lg border border-[#E5E4DF] hover:border-[#191919]/20 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm text-[#191919]">{item.product}</div>
                              <div className="text-xs text-[#191919]/50">
                                {t('landing.solution.visual.predictions.stockout', { days: item.days })}
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs ${
                              item.status === 'critical' ? 'bg-[#FEF2F2] text-[#DC2626]' :
                              item.status === 'warning' ? 'bg-[#FEF3C7] text-[#D97706]' :
                              'bg-[#ECFDF5] text-[#059669]'
                            }`}>
                              {item.days}j
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Floating badge */}
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="absolute -top-3 -right-3 bg-white px-3 py-2 rounded-lg border border-[#E5E4DF] shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-[#10B981]" />
                        <span className="text-xs font-medium text-[#191919]">IA Active</span>
                      </div>
                    </motion.div>
                  </div>
                )}

                {solution.visualType === 'dashboard' && (
                  <div className="card p-6 shadow-lg">
                    <h4 className="font-semibold text-[#191919] mb-4">
                      {t('landing.solution.visual.rotation.title')}
                    </h4>
                    
                    <div className="space-y-3">
                      {[
                        { category: 'Vêtements', rotation: 85, value: '24 500 €', trend: 'up' },
                        { category: 'Accessoires', rotation: 62, value: '8 200 €', trend: 'up' },
                        { category: 'Chaussures', rotation: 41, value: '15 800 €', trend: 'down' }
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="p-4 rounded-lg border border-[#E5E4DF]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[#191919]">{item.category}</span>
                            <span className="text-sm text-[#191919]/60">{item.value}</span>
                          </div>
                          <div className="relative h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${item.rotation}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                              className={`h-full rounded-full ${
                                item.rotation > 70 ? 'bg-[#10B981]' :
                                item.rotation > 50 ? 'bg-[#F59E0B]' :
                                'bg-[#EF4444]'
                              }`}
                            />
                          </div>
                          <div className="mt-1 text-xs text-[#191919]/50">
                            {t('landing.solution.visual.rotation.rotationRate', { rate: item.rotation })}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Floating badge */}
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="absolute -top-3 -right-3 bg-white px-3 py-2 rounded-lg border border-[#E5E4DF] shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 size={14} className="text-[#2563EB]" />
                        <span className="text-xs font-medium text-[#191919]">
                          {t('landing.solution.visual.rotation.realTime')}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                )}

                {solution.visualType === 'supplier' && (
                  <div className="card p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-[#191919]">
                          {t('landing.solution.visual.supplier.title')}
                        </h4>
                        <p className="text-xs text-[#191919]/50">
                          {t('landing.solution.visual.supplier.subtitle')}
                        </p>
                      </div>
                      <Mail size={20} className="text-[#191919]/40" />
                    </div>

                    {/* Email Preview */}
                    <div className="bg-[#FAFAF7] rounded-lg border border-[#E5E4DF] p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#191919]/40">{t('landing.solution.visual.supplier.to')}:</span>
                        <span className="text-[#191919]">commandes@fournisseurpro.fr</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#191919]/40">{t('landing.solution.visual.supplier.subject')}:</span>
                        <span className="text-[#191919] font-medium">
                          {t('landing.solution.visual.supplier.orderNumber')}
                        </span>
                      </div>
                      <div className="h-px bg-[#E5E4DF]" />
                      <div className="space-y-2 text-xs text-[#191919]/60">
                        <p>{t('landing.solution.visual.supplier.greeting')}</p>
                        <p className="font-medium text-[#191919]">
                          {t('landing.solution.visual.supplier.products')}
                        </p>
                        <div className="bg-white rounded p-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>• T-Shirt Blanc (SKU-1234)</span>
                            <span className="font-medium">× 50</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Jean Slim (SKU-5678)</span>
                            <span className="font-medium">× 30</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating badge */}
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="absolute -bottom-3 -right-3 bg-white px-3 py-2 rounded-lg border border-[#E5E4DF] shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-[#10B981]" />
                        <span className="text-xs font-medium text-[#191919]">
                          {t('landing.solution.visual.supplier.sent')}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Solution;

