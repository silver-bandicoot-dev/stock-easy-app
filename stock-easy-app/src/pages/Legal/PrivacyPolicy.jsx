import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Database, 
  Lock, 
  Eye, 
  UserCheck, 
  Globe,
  Shield,
  Clock,
  Mail,
  FileText
} from 'lucide-react';
import SEOUpdater from '../../components/common/SEOUpdater';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  const sections = [
    {
      icon: FileText,
      title: t('legal.privacy.intro.title', "1. Introduction"),
      content: t('legal.privacy.intro.content', "Chez StockEasy, nous prenons la protection de vos données personnelles très au sérieux. Cette politique de confidentialité explique quelles données nous collectons, pourquoi nous les collectons, comment nous les utilisons et quels sont vos droits. Cette politique s'applique à tous les utilisateurs de la plateforme StockEasy.")
    },
    {
      icon: UserCheck,
      title: t('legal.privacy.controller.title', "2. Responsable du traitement"),
      content: t('legal.privacy.controller.content', "Le responsable du traitement de vos données personnelles est StockEasy SAS, société par actions simplifiée au capital de 10 000€, dont le siège social est situé à Paris, France. Pour toute question relative à la protection de vos données, vous pouvez nous contacter à : contact@stockeasy.app")
    },
    {
      icon: Database,
      title: t('legal.privacy.data.title', "3. Données collectées"),
      subsections: [
        {
          subtitle: t('legal.privacy.data.account.title', "3.1. Données de compte"),
          items: [
            t('legal.privacy.data.account.items.0', "Informations Shopify : nom de la boutique, email, ID Shopify"),
            t('legal.privacy.data.account.items.1', "Données de profil : nom, prénom, adresse email, numéro de téléphone (optionnel)"),
            t('legal.privacy.data.account.items.2', "Informations de facturation : détails de paiement gérés par Shopify")
          ]
        },
        {
          subtitle: t('legal.privacy.data.business.title', "3.2. Données commerciales"),
          items: [
            t('legal.privacy.data.business.items.0', "Catalogue produits : SKU, noms, descriptions, images, prix, quantités en stock"),
            t('legal.privacy.data.business.items.1', "Historique des commandes : détails des commandes, dates, quantités, clients"),
            t('legal.privacy.data.business.items.2', "Données fournisseurs : noms, contacts, délais de livraison, SKU fournisseur"),
            t('legal.privacy.data.business.items.3', "Paramètres de gestion : seuils d'alerte, multiplicateurs de sécurité, préférences")
          ]
        },
        {
          subtitle: t('legal.privacy.data.usage.title', "3.3. Données d'utilisation"),
          items: [
            t('legal.privacy.data.usage.items.0', "Logs de connexion : adresses IP, dates et heures de connexion, type de navigateur"),
            t('legal.privacy.data.usage.items.1', "Données d'interaction : pages visitées, fonctionnalités utilisées, temps passé"),
            t('legal.privacy.data.usage.items.2', "Données techniques : type d'appareil, système d'exploitation, résolution d'écran"),
            t('legal.privacy.data.usage.items.3', "Données de performance : temps de chargement, erreurs, bugs")
          ]
        },
        {
          subtitle: t('legal.privacy.data.cookies.title', "3.4. Cookies et technologies similaires"),
          content: t('legal.privacy.data.cookies.content', "Nous utilisons des cookies et technologies similaires pour améliorer votre expérience. Pour plus d'informations, consultez notre politique de cookies.")
        }
      ]
    },
    {
      icon: Eye,
      title: t('legal.privacy.purposes.title', "4. Finalités du traitement"),
      subsections: [
        {
          subtitle: t('legal.privacy.purposes.service.title', "4.1. Fourniture du service"),
          items: [
            t('legal.privacy.purposes.service.items.0', "Synchronisation avec Shopify et gestion de votre inventaire"),
            t('legal.privacy.purposes.service.items.1', "Calcul de prévisions de stock par intelligence artificielle"),
            t('legal.privacy.purposes.service.items.2', "Génération de rapports et d'analyses"),
            t('legal.privacy.purposes.service.items.3', "Gestion des commandes fournisseurs"),
            t('legal.privacy.purposes.service.items.4', "Envoi d'alertes et de notifications")
          ]
        },
        {
          subtitle: t('legal.privacy.purposes.improvement.title', "4.2. Amélioration du service"),
          items: [
            t('legal.privacy.purposes.improvement.items.0', "Analyse de l'utilisation pour améliorer l'interface et les fonctionnalités"),
            t('legal.privacy.purposes.improvement.items.1', "Optimisation des algorithmes de prévision"),
            t('legal.privacy.purposes.improvement.items.2', "Détection et correction des bugs"),
            t('legal.privacy.purposes.improvement.items.3', "Développement de nouvelles fonctionnalités")
          ]
        },
        {
          subtitle: t('legal.privacy.purposes.communication.title', "4.3. Communication"),
          items: [
            t('legal.privacy.purposes.communication.items.0', "Support client et assistance technique"),
            t('legal.privacy.purposes.communication.items.1', "Informations sur les mises à jour et nouvelles fonctionnalités"),
            t('legal.privacy.purposes.communication.items.2', "Communications marketing (avec votre consentement)"),
            t('legal.privacy.purposes.communication.items.3', "Enquêtes de satisfaction")
          ]
        },
        {
          subtitle: t('legal.privacy.purposes.legal.title', "4.4. Obligations légales"),
          items: [
            t('legal.privacy.purposes.legal.items.0', "Respect des obligations comptables et fiscales"),
            t('legal.privacy.purposes.legal.items.1', "Réponse aux demandes des autorités compétentes"),
            t('legal.privacy.purposes.legal.items.2', "Prévention de la fraude et sécurisation du service")
          ]
        }
      ]
    },
    {
      icon: Scale,
      title: t('legal.privacy.legal.title', "5. Base légale du traitement"),
      content: t('legal.privacy.legal.content', "Nous traitons vos données sur les bases légales suivantes : Exécution du contrat : traitement nécessaire à la fourniture de nos services. Intérêt légitime : amélioration du service, sécurité, prévention de la fraude. Consentement : marketing, cookies non essentiels. Obligations légales : conformité réglementaire, obligations comptables.")
    },
    {
      icon: Globe,
      title: t('legal.privacy.sharing.title', "6. Partage des données"),
      subsections: [
        {
          subtitle: t('legal.privacy.sharing.providers.title', "6.1. Prestataires de services"),
          content: t('legal.privacy.sharing.providers.content', "Nous partageons vos données avec des prestataires tiers de confiance : Shopify (plateforme e-commerce), Vercel (hébergement), Supabase (base de données), Sentry (monitoring d'erreurs), Services d'emailing pour les notifications. Ces prestataires sont contractuellement tenus de protéger vos données et ne peuvent les utiliser qu'aux fins pour lesquelles nous les partageons.")
        },
        {
          subtitle: t('legal.privacy.sharing.transfers.title', "6.2. Transferts internationaux"),
          content: t('legal.privacy.sharing.transfers.content', "Certains de nos prestataires peuvent être situés en dehors de l'Union Européenne. Dans ce cas, nous nous assurons que des garanties appropriées sont en place (clauses contractuelles types, Privacy Shield, etc.).")
        },
        {
          subtitle: t('legal.privacy.sharing.legal.title', "6.3. Obligations légales"),
          content: t('legal.privacy.sharing.legal.content', "Nous pouvons divulguer vos données si requis par la loi ou en réponse à une demande légale (assignation, mandat de perquisition, etc.).")
        }
      ]
    },
    {
      icon: Lock,
      title: t('legal.privacy.security.title', "7. Sécurité des données"),
      content: t('legal.privacy.security.content', "Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données : Chiffrement des données en transit (HTTPS/TLS) et au repos. Contrôle d'accès strict et authentification multi-facteurs pour nos équipes. Surveillance continue et détection des intrusions. Sauvegardes régulières et plan de reprise d'activité. Audits de sécurité périodiques. Tests de pénétration réguliers.")
    },
    {
      icon: Clock,
      title: t('legal.privacy.retention.title', "8. Durée de conservation"),
      subsections: [
        {
          subtitle: t('legal.privacy.retention.active.title', "8.1. Compte actif"),
          content: t('legal.privacy.retention.active.content', "Vos données sont conservées tant que votre compte est actif et pendant la durée nécessaire à la fourniture de nos services.")
        },
        {
          subtitle: t('legal.privacy.retention.closed.title', "8.2. Compte clôturé"),
          content: t('legal.privacy.retention.closed.content', "Après la clôture de votre compte, vos données sont conservées pendant 30 jours pour permettre une éventuelle récupération. Passé ce délai, vos données sont définitivement supprimées.")
        },
        {
          subtitle: t('legal.privacy.retention.legal.title', "8.3. Obligations légales"),
          content: t('legal.privacy.retention.legal.content', "Certaines données peuvent être conservées plus longtemps pour répondre à nos obligations légales (comptables, fiscales, etc.), généralement 5 à 10 ans selon la législation applicable.")
        }
      ]
    },
    {
      icon: UserCheck,
      title: t('legal.privacy.rights.title', "9. Vos droits"),
      subsections: [
        {
          subtitle: t('legal.privacy.rights.list.title', "9.1. Droits RGPD"),
          content: t('legal.privacy.rights.list.content', "Conformément au RGPD, vous disposez des droits suivants : Droit d'accès : obtenir une copie de vos données personnelles. Droit de rectification : corriger vos données inexactes ou incomplètes. Droit à l'effacement : demander la suppression de vos données. Droit à la limitation : limiter le traitement de vos données. Droit à la portabilité : recevoir vos données dans un format structuré. Droit d'opposition : vous opposer au traitement de vos données. Droit de retirer votre consentement à tout moment.")
        },
        {
          subtitle: t('legal.privacy.rights.exercise.title', "9.2. Exercice de vos droits"),
          content: t('legal.privacy.rights.exercise.content', "Pour exercer vos droits, contactez-nous à : contact@stockeasy.app. Nous répondrons à votre demande dans un délai d'un mois. En cas de difficulté, vous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés).")
        }
      ]
    },
    {
      icon: UserCheck,
      title: t('legal.privacy.minors.title', "10. Données des mineurs"),
      content: t('legal.privacy.minors.content', "StockEasy est un service destiné aux professionnels. Nous ne collectons pas sciemment de données personnelles de personnes de moins de 18 ans. Si vous apprenez qu'un mineur nous a fourni des données personnelles, veuillez nous contacter immédiatement.")
    },
    {
      icon: FileText,
      title: t('legal.privacy.changes.title', "11. Modifications de la politique"),
      content: t('legal.privacy.changes.content', "Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications seront communiquées par email et via notre plateforme. La date de dernière mise à jour est indiquée en haut de cette page. Votre utilisation continue du service après notification constitue votre acceptation des modifications.")
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <SEOUpdater 
        title={t('legal.privacy.seo.title', "Politique de Confidentialité | StockEasy")}
        description={t('legal.privacy.seo.description', "Découvrez comment StockEasy protège vos données personnelles et respecte votre vie privée conformément au RGPD.")}
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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#1DB954]/20 flex items-center justify-center">
                <Shield size={24} className="text-[#1DB954]" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                {t('legal.privacy.title', "Politique de Confidentialité")}
              </h1>
            </div>
            <p className="text-white/70 text-lg">
              {t('legal.privacy.subtitle', "Comment nous collectons, utilisons et protégeons vos données personnelles")}
            </p>
            <p className="text-white/50 text-sm mt-4">
              {t('legal.lastUpdated', "Dernière mise à jour")}: {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* RGPD Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <Shield size={24} className="text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                {t('legal.privacy.rgpd.title', "Conformité RGPD")}
              </h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                {t('legal.privacy.rgpd.content', "Cette politique de confidentialité est conforme au Règlement Général sur la Protection des Données (RGPD) de l'Union Européenne. Vos données sont traitées de manière transparente, sécurisée et dans le respect de vos droits.")}
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
              transition={{ duration: 0.5, delay: index * 0.03 }}
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
                  <p className="text-[#191919]/70 leading-relaxed whitespace-pre-line">
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
                        {subsection.content && (
                          <p className="text-[#191919]/70 leading-relaxed whitespace-pre-line">
                            {subsection.content}
                          </p>
                        )}
                        {subsection.items && (
                          <ul className="space-y-2 mt-3">
                            {subsection.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="flex items-start gap-2">
                                <span className="text-[#1DB954] mt-1.5">•</span>
                                <span className="text-[#191919]/70">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
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
          <div className="flex items-start gap-3">
            <Mail size={24} className="text-[#1DB954] flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-[#191919] mb-2">
                {t('legal.privacy.contact.title', "Questions sur vos données?")}
              </h3>
              <p className="text-[#191919]/70 leading-relaxed mb-3">
                {t('legal.privacy.contact.content', "Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous :")}
              </p>
              <a 
                href="mailto:contact@stockeasy.app" 
                className="inline-flex items-center gap-2 text-[#1DB954] hover:underline font-medium"
              >
                <Mail size={16} />
                contact@stockeasy.app
              </a>
            </div>
          </div>
        </motion.div>

        {/* CNIL Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-4 p-6 bg-gray-50 border border-gray-200 rounded-xl"
        >
          <p className="text-sm text-gray-600 leading-relaxed">
            {t('legal.privacy.cnil.content', "En cas de litige, vous avez le droit d'introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) : www.cnil.fr")}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
