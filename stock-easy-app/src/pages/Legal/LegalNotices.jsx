import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft, Building2, Mail, Globe, Shield } from 'lucide-react';
import SEOUpdater from '../../components/common/SEOUpdater';

const LegalNotices = () => {
  const { t } = useTranslation();

  const sections = [
    {
      icon: Building2,
      title: t('legal.notices.editor.title', "1. Éditeur du site"),
      content: [
        {
          label: t('legal.notices.editor.company', "Dénomination sociale"),
          value: "StockEasy SAS"
        },
        {
          label: t('legal.notices.editor.legalForm', "Forme juridique"),
          value: "Société par Actions Simplifiée (SAS)"
        },
        {
          label: t('legal.notices.editor.capital', "Capital social"),
          value: "10 000 €"
        },
        {
          label: t('legal.notices.editor.address', "Siège social"),
          value: "Paris, France"
        },
        {
          label: t('legal.notices.editor.rcs', "Numéro RCS"),
          value: "Paris B XXX XXX XXX"
        },
        {
          label: t('legal.notices.editor.vat', "Numéro TVA intracommunautaire"),
          value: "FR XX XXX XXX XXX"
        },
        {
          label: t('legal.notices.editor.director', "Directeur de la publication"),
          value: "Représentant légal de StockEasy SAS"
        }
      ]
    },
    {
      icon: Mail,
      title: t('legal.notices.contact.title', "2. Contact"),
      content: [
        {
          label: t('legal.notices.contact.email', "Email"),
          value: "contact@stockeasy.app",
          isLink: true,
          href: "mailto:contact@stockeasy.app"
        },
        {
          label: t('legal.notices.contact.website', "Site web"),
          value: "https://stockeasy.app",
          isLink: true,
          href: "https://stockeasy.app"
        }
      ]
    },
    {
      icon: Globe,
      title: t('legal.notices.hosting.title', "3. Hébergement"),
      content: [
        {
          label: t('legal.notices.hosting.provider', "Hébergeur"),
          value: "Vercel Inc."
        },
        {
          label: t('legal.notices.hosting.address', "Adresse"),
          value: "340 S Lemon Ave #4133, Walnut, CA 91789, USA"
        },
        {
          label: t('legal.notices.hosting.website', "Site web"),
          value: "https://vercel.com",
          isLink: true,
          href: "https://vercel.com"
        }
      ]
    },
    {
      icon: Shield,
      title: t('legal.notices.dataProtection.title', "4. Protection des données"),
      content: [
        {
          label: t('legal.notices.dataProtection.dpo', "Délégué à la protection des données"),
          value: "contact@stockeasy.app",
          isLink: true,
          href: "mailto:contact@stockeasy.app"
        },
        {
          label: t('legal.notices.dataProtection.policy', "Politique de confidentialité"),
          value: t('legal.notices.dataProtection.policyLink', "Consulter notre politique de confidentialité"),
          isLink: true,
          href: "/legal/privacy"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <SEOUpdater 
        title={t('legal.notices.seo.title', "Mentions Légales | StockEasy")}
        description={t('legal.notices.seo.description', "Mentions légales et informations juridiques de StockEasy, solution de gestion de stock pour Shopify.")}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-[#191919] to-[#252525] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft size={20} />
            {t('legal.backToHome', "Retour à l'accueil")}
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t('legal.notices.title', "Mentions Légales")}
            </h1>
            <p className="text-white/70 text-lg">
              {t('legal.notices.subtitle', "Informations légales et identification de l'éditeur du site")}
            </p>
            <p className="text-white/50 text-sm mt-4">
              {t('legal.lastUpdated', "Dernière mise à jour")}: {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-[#E5E4DF] overflow-hidden">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-8 ${index !== sections.length - 1 ? 'border-b border-[#E5E4DF]' : ''}`}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#1DB954]/10 flex items-center justify-center flex-shrink-0">
                  <section.icon size={24} className="text-[#1DB954]" />
                </div>
                <h2 className="text-2xl font-semibold text-[#191919] mt-2">
                  {section.title}
                </h2>
              </div>

              <div className="space-y-4 ml-16">
                {section.content.map((item, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-start gap-2">
                    <span className="text-[#191919]/60 font-medium min-w-[200px]">
                      {item.label}:
                    </span>
                    {item.isLink ? (
                      <a 
                        href={item.href} 
                        className="text-[#1DB954] hover:underline"
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-[#191919]">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Legal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 p-6 bg-white rounded-xl border border-[#E5E4DF]"
        >
          <h3 className="text-lg font-semibold text-[#191919] mb-4">
            {t('legal.notices.intellectual.title', "5. Propriété intellectuelle")}
          </h3>
          <p className="text-[#191919]/70 leading-relaxed mb-4">
            {t('legal.notices.intellectual.content', "L'ensemble du contenu de ce site (structure, textes, logos, images, vidéos, etc.) est la propriété exclusive de StockEasy SAS, sauf mention contraire. Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces différents éléments est strictement interdite sans l'accord écrit de StockEasy SAS.")}
          </p>
          <p className="text-[#191919]/70 leading-relaxed">
            {t('legal.notices.intellectual.trademark', "Les marques et logos présents sur le site sont des marques déposées de StockEasy SAS ou de leurs propriétaires respectifs.")}
          </p>
        </motion.div>

        {/* Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 p-6 bg-white rounded-xl border border-[#E5E4DF]"
        >
          <h3 className="text-lg font-semibold text-[#191919] mb-4">
            {t('legal.notices.credits.title', "6. Crédits")}
          </h3>
          <p className="text-[#191919]/70 leading-relaxed">
            {t('legal.notices.credits.design', "Design et développement : StockEasy Team")}
          </p>
          <p className="text-[#191919]/70 leading-relaxed mt-2">
            {t('legal.notices.credits.icons', "Icônes : Lucide Icons")}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LegalNotices;

