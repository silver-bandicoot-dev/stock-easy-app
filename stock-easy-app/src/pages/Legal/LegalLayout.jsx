import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const LegalLayout = ({ children, title, lastUpdated }) => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[#E5E4DF] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#191919]/60 hover:text-[#191919] transition-colors"
          >
            <ArrowLeft size={16} />
            {t('legal.backToHome', 'Retour à l\'accueil')}
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-[#E5E4DF] p-8 md:p-12">
          {/* Header */}
          <div className="mb-8 pb-8 border-b border-[#E5E4DF]">
            <h1 className="text-3xl md:text-4xl font-bold text-[#191919] mb-4">
              {title}
            </h1>
            {lastUpdated && (
              <p className="text-sm text-[#191919]/50">
                {t('legal.lastUpdated', 'Dernière mise à jour')} : {lastUpdated}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-neutral max-w-none">
            {children}
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 p-6 bg-white rounded-xl border border-[#E5E4DF]">
          <p className="text-sm text-[#191919]/60 mb-4">
            {t('legal.otherDocuments', 'Autres documents légaux')} :
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/legal/terms"
              className="text-sm text-[#191919] hover:underline"
            >
              {t('legal.terms', 'Conditions Générales d\'Utilisation')}
            </Link>
            <Link
              to="/legal/privacy"
              className="text-sm text-[#191919] hover:underline"
            >
              {t('legal.privacy', 'Politique de Confidentialité')}
            </Link>
            <Link
              to="/legal/notices"
              className="text-sm text-[#191919] hover:underline"
            >
              {t('legal.notices', 'Mentions Légales')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalLayout;
