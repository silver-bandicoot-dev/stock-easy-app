import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  FileText, 
  UserCheck, 
  CreditCard, 
  Shield, 
  AlertCircle,
  Scale,
  RefreshCw
} from 'lucide-react';
import SEOUpdater from '../../components/common/SEOUpdater';

const TermsOfService = () => {
  const { t } = useTranslation();

  const sections = [
    {
      icon: FileText,
      title: t('legal.terms.object.title', "1. Objet"),
      content: t('legal.terms.object.content', "Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation de la plateforme Stockeasy, ainsi que les services proposés. En accédant à notre plateforme et en l'utilisant, vous acceptez sans réserve les présentes CGU.")
    },
    {
      icon: UserCheck,
      title: t('legal.terms.access.title', "2. Accès aux services"),
      subsections: [
        {
          subtitle: t('legal.terms.access.registration.title', "2.1. Inscription"),
          content: t('legal.terms.access.registration.content', "L'utilisation de Stockeasy nécessite la création d'un compte via Shopify. Vous vous engagez à fournir des informations exactes et à les maintenir à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion.")
        },
        {
          subtitle: t('legal.terms.access.eligibility.title', "2.2. Conditions d'éligibilité"),
          content: t('legal.terms.access.eligibility.content', "Stockeasy est destiné aux professionnels et aux entreprises utilisant Shopify pour leur activité de commerce électronique. Vous devez avoir la capacité juridique de contracter et d'utiliser nos services.")
        },
        {
          subtitle: t('legal.terms.access.shopify.title', "2.3. Intégration Shopify"),
          content: t('legal.terms.access.shopify.content', "Notre service nécessite une connexion à votre boutique Shopify. En installant l'application, vous autorisez Stockeasy à accéder aux données nécessaires au fonctionnement du service (produits, inventaire, commandes). Cette autorisation peut être révoquée à tout moment depuis votre interface Shopify.")
        }
      ]
    },
    {
      icon: Shield,
      title: t('legal.terms.services.title', "3. Description des services"),
      subsections: [
        {
          subtitle: t('legal.terms.services.features.title', "3.1. Fonctionnalités principales"),
          content: t('legal.terms.services.features.content', "Stockeasy propose une solution de gestion de stock incluant : synchronisation en temps réel avec Shopify, prévisions de stock par intelligence artificielle, gestion des commandes fournisseurs, alertes de rupture de stock, rapports et analyses avancées, gestion multi-emplacements (selon votre plan d'abonnement).")
        },
        {
          subtitle: t('legal.terms.services.availability.title', "3.2. Disponibilité"),
          content: t('legal.terms.services.availability.content', "Nous nous efforçons de maintenir un service disponible 24h/24, 7j/7. Toutefois, des interruptions peuvent survenir pour maintenance, mises à jour ou cas de force majeure. Nous nous engageons à minimiser ces interruptions et à vous en informer dans la mesure du possible.")
        }
      ]
    },
    {
      icon: CreditCard,
      title: t('legal.terms.pricing.title', "4. Tarification et paiement"),
      subsections: [
        {
          subtitle: t('legal.terms.pricing.plans.title', "4.1. Plans d'abonnement"),
          content: t('legal.terms.pricing.plans.content', "Stockeasy propose différents plans d'abonnement (Basic, Pro, Plus) avec des fonctionnalités adaptées. Les tarifs sont indiqués en USD et sont susceptibles de modification. Toute modification tarifaire sera communiquée avec un préavis de 30 jours.")
        },
        {
          subtitle: t('legal.terms.pricing.billing.title', "4.2. Facturation"),
          content: t('legal.terms.pricing.billing.content', "Les abonnements sont facturés mensuellement via Shopify. Le paiement est prélevé automatiquement au début de chaque période de facturation. En cas de défaut de paiement, l'accès au service peut être suspendu.")
        },
        {
          subtitle: t('legal.terms.pricing.trial.title', "4.3. Période d'essai"),
          content: t('legal.terms.pricing.trial.content', "Une période d'essai gratuite peut être proposée aux nouveaux utilisateurs. À l'issue de cette période, votre abonnement sera automatiquement activé sauf résiliation de votre part.")
        }
      ]
    },
    {
      icon: RefreshCw,
      title: t('legal.terms.cancellation.title', "5. Résiliation et remboursement"),
      subsections: [
        {
          subtitle: t('legal.terms.cancellation.rights.title', "5.1. Droit de résiliation"),
          content: t('legal.terms.cancellation.rights.content', "Vous pouvez résilier votre abonnement à tout moment depuis votre interface Shopify ou en nous contactant. La résiliation prendra effet à la fin de votre période de facturation en cours. Aucun remboursement au prorata ne sera effectué pour la période en cours.")
        },
        {
          subtitle: t('legal.terms.cancellation.suspension.title', "5.2. Suspension par Stockeasy"),
          content: t('legal.terms.cancellation.suspension.content', "Nous nous réservons le droit de suspendre ou de résilier votre accès en cas de violation des présentes CGU, d'utilisation frauduleuse, ou de non-paiement.")
        },
        {
          subtitle: t('legal.terms.cancellation.data.title', "5.3. Conservation des données"),
          content: t('legal.terms.cancellation.data.content', "Après résiliation, vos données seront conservées pendant 30 jours pour vous permettre de les récupérer. Passé ce délai, vos données seront définitivement supprimées de nos systèmes.")
        }
      ]
    },
    {
      icon: AlertCircle,
      title: t('legal.terms.obligations.title', "6. Obligations de l'utilisateur"),
      subsections: [
        {
          subtitle: t('legal.terms.obligations.usage.title', "6.1. Usage conforme"),
          content: t('legal.terms.obligations.usage.content', "Vous vous engagez à utiliser Stockeasy conformément à sa destination et à ne pas : tenter d'accéder à des systèmes informatiques non autorisés, perturber le fonctionnement du service, utiliser le service à des fins illégales ou frauduleuses, transmettre des virus ou codes malveillants, revendre ou redistribuer l'accès au service.")
        },
        {
          subtitle: t('legal.terms.obligations.data.title', "6.2. Responsabilité des données"),
          content: t('legal.terms.obligations.data.content', "Vous êtes responsable de l'exactitude et de la qualité des données que vous importez dans Stockeasy. Nous ne pouvons être tenus responsables des erreurs ou inexactitudes dans vos données sources.")
        }
      ]
    },
    {
      icon: Scale,
      title: t('legal.terms.liability.title', "7. Limitation de responsabilité"),
      subsections: [
        {
          subtitle: t('legal.terms.liability.service.title', "7.1. Service fourni \"en l'état\""),
          content: t('legal.terms.liability.service.content', "Stockeasy est fourni \"en l'état\" et \"selon disponibilité\". Nous ne garantissons pas que le service sera exempt d'erreurs ou ininterrompu. Nous nous efforçons de fournir des prévisions précises, mais celles-ci sont basées sur des algorithmes et ne constituent pas une garantie.")
        },
        {
          subtitle: t('legal.terms.liability.damages.title', "7.2. Limitation des dommages"),
          content: t('legal.terms.liability.damages.content', "Dans toute la mesure permise par la loi, notre responsabilité totale envers vous pour tout dommage résultant de l'utilisation ou de l'impossibilité d'utiliser Stockeasy est limitée au montant que vous avez payé pour le service au cours des 12 derniers mois.")
        },
        {
          subtitle: t('legal.terms.liability.indirect.title', "7.3. Dommages indirects"),
          content: t('legal.terms.liability.indirect.content', "Nous ne serons en aucun cas responsables des dommages indirects, accessoires, spéciaux ou consécutifs, y compris mais sans s'y limiter, la perte de profits, de données, ou d'opportunités commerciales.")
        }
      ]
    },
    {
      icon: Shield,
      title: t('legal.terms.intellectual.title', "8. Propriété intellectuelle"),
      content: t('legal.terms.intellectual.content', "Tous les droits de propriété intellectuelle relatifs à Stockeasy (logiciels, algorithmes, interface, contenus) nous appartiennent. Vous conservez tous les droits sur vos données. En utilisant nos services, vous nous accordez une licence limitée pour traiter vos données uniquement dans le but de fournir nos services.")
    },
    {
      icon: FileText,
      title: t('legal.terms.modifications.title', "9. Modifications des CGU"),
      content: t('legal.terms.modifications.content', "Nous nous réservons le droit de modifier les présentes CGU à tout moment. Les modifications seront communiquées par email et via notre plateforme. Votre utilisation continue du service après notification constitue votre acceptation des CGU modifiées.")
    },
    {
      icon: Scale,
      title: t('legal.terms.law.title', "10. Droit applicable et juridiction"),
      content: t('legal.terms.law.content', "Les présentes CGU sont régies par le droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents.")
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <SEOUpdater 
        title={t('legal.terms.seo.title', "Conditions Générales d'Utilisation | Stockeasy")}
        description={t('legal.terms.seo.description', "Consultez les conditions générales d'utilisation de Stockeasy, plateforme de gestion de stock pour Shopify.")}
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
              {t('legal.terms.title', "Conditions Générales d'Utilisation")}
            </h1>
            <p className="text-white/70 text-lg">
              {t('legal.terms.subtitle', "Modalités d'utilisation de la plateforme Stockeasy")}
            </p>
            <p className="text-white/50 text-sm mt-4">
              {t('legal.lastUpdated', "Dernière mise à jour")}: {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">
                {t('legal.terms.notice.title', "Information importante")}
              </h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                {t('legal.terms.notice.content', "En utilisant Stockeasy, vous acceptez d'être lié par ces conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.")}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="bg-white rounded-2xl border border-[#E5E4DF] overflow-hidden">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
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

              <div className="ml-16">
                {section.content && (
                  <p className="text-[#191919]/70 leading-relaxed">
                    {section.content}
                  </p>
                )}

                {section.subsections && (
                  <div className="space-y-6">
                    {section.subsections.map((subsection, idx) => (
                      <div key={idx}>
                        <h3 className="font-semibold text-[#191919] mb-3">
                          {subsection.subtitle}
                        </h3>
                        <p className="text-[#191919]/70 leading-relaxed">
                          {subsection.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 p-6 bg-white rounded-xl border border-[#E5E4DF]"
        >
          <h3 className="text-lg font-semibold text-[#191919] mb-4">
            {t('legal.terms.contact.title', "Questions?")}
          </h3>
          <p className="text-[#191919]/70 leading-relaxed mb-4">
            {t('legal.terms.contact.content', "Si vous avez des questions concernant ces conditions générales d'utilisation, n'hésitez pas à nous contacter :")}
          </p>
          <a 
            href="mailto:contact@stockeasy.app" 
            className="text-[#1DB954] hover:underline font-medium"
          >
            contact@stockeasy.app
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;
