import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const SEOUpdater = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Update Title
    document.title = t('seo.title');

    // Update Meta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('seo.description'));
    }

    // Update Open Graph Title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', t('seo.title'));
    }

    // Update Open Graph Description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', t('seo.description'));
    }
    
    // Update Open Graph Locale
    const localeMap = {
        'fr': 'fr_FR',
        'en': 'en_US',
        'es': 'es_ES'
    };
    const currentLocale = localeMap[i18n.language] || i18n.language;
    
    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
        ogLocale = document.createElement('meta');
        ogLocale.setAttribute('property', 'og:locale');
        document.head.appendChild(ogLocale);
    }
    ogLocale.setAttribute('content', currentLocale);

    // Update Meta Keywords
    const keywords = t('seo.keywords', '');
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }

    // Update HTML lang attribute
    document.documentElement.lang = i18n.language;

  }, [t, i18n.language]);

  return null;
};

export default SEOUpdater;

