import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQ = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: t('landing.faq.items.compatibility.question'),
      answer: t('landing.faq.items.compatibility.answer')
    },
    {
      question: t('landing.faq.items.setupTime.question'),
      answer: t('landing.faq.items.setupTime.answer')
    },
    {
      question: t('landing.faq.items.afterTrial.question'),
      answer: t('landing.faq.items.afterTrial.answer')
    },
    {
      question: t('landing.faq.items.dataSecurity.question'),
      answer: t('landing.faq.items.dataSecurity.answer')
    },
    {
      question: t('landing.faq.items.importSuppliers.question'),
      answer: t('landing.faq.items.importSuppliers.answer')
    },
    {
      question: t('landing.faq.items.aiAccuracy.question'),
      answer: t('landing.faq.items.aiAccuracy.answer')
    },
    {
      question: t('landing.faq.items.cancellation.question'),
      answer: t('landing.faq.items.cancellation.answer')
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
            {t('landing.faq.title')}
          </h2>
          <p className="text-lg text-[#191919]/60 max-w-2xl mx-auto">
            {t('landing.faq.subtitle')}
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#FAFAF7] transition-colors"
              >
                <h3 className="font-semibold text-[#191919] pr-4">
                  {faq.question}
                </h3>
                <ChevronDown
                  size={20}
                  className={`text-[#191919]/40 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5 text-[#191919]/70 leading-relaxed">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* CTA Below FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-[#191919]/60 mb-4">
            {t('landing.faq.stillHaveQuestions')}
          </p>
          <a
            href="mailto:contact@stockeasy.app"
            className="btn-secondary"
          >
            {t('landing.faq.contactUs')}
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;

