import React from 'react';
import { Mail, ShoppingBag, Check } from 'lucide-react';
import { useStockContext } from '../../contexts/StockDataContext';

const integrations = [
  {
    categoryKey: 'mail',
    label: 'Mail',
    icon: Mail,
    description: 'Connectez vos messageries pour envoyer les emails directement depuis Stockeasy.',
    items: [
      {
        name: 'Gmail',
        type: 'gmail',
        logo: '/logos/gmail.webp',
        officialName: 'Gmail',
        url: 'https://workspace.google.com/marketplace',
      },
      {
        name: 'Outlook',
        type: 'outlook',
        logo: '/logos/outlook.png',
        officialName: 'Microsoft Outlook',
        url: 'https://appsource.microsoft.com/',
      },
    ],
  },
  {
    categoryKey: 'commerce',
    label: 'Commerce Platform',
    icon: ShoppingBag,
    description: 'Connectez vos plateformes e‑commerce pour synchroniser commandes et produits.',
    items: [
      {
        name: 'Shopify',
        type: 'shopify',
        logo: '/logos/shopify.png',
        officialName: 'Shopify',
        url: 'https://apps.shopify.com/',
      },
      {
        name: 'WooCommerce',
        type: 'woocommerce',
        logo: '/logos/woocommerce.png',
        officialName: 'WooCommerce',
        url: 'https://woocommerce.com/products/',
      },
      {
        name: 'BigCommerce',
        type: 'bigcommerce',
        logo: '/logos/bigcommerce.png',
        officialName: 'BigCommerce',
        url: 'https://www.bigcommerce.com/apps/',
      },
    ],
  },
];

export const IntegrationsSettings = () => {
  const { products, loading } = useStockContext();
  
  // Déterminer si connecté à une plateforme commerce (basé sur la présence de produits synchronisés)
  const isCommerceConnected = !loading && products && products.length > 0;

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h2 className="text-xl font-bold text-[#191919] mb-1">Intégrations</h2>
        <p className="text-sm text-[#666663] max-w-2xl">
          Connectez Stockeasy à vos outils existants (messagerie, e‑commerce) pour automatiser les flux de
          données et envoyer les emails directement depuis vos comptes Gmail / Outlook.
        </p>
        <p className="text-xs text-[#8A8A86] mt-3">
          Ces intégrations sont en cours de déploiement. En attendant, les cartes ci‑dessous vous redirigent vers les
          stores officiels pour préparer l'installation de l'app Stockeasy.
        </p>
      </div>

      {/* Categories */}
      {integrations.map((category) => {
        const Icon = category.icon;
        const isCommerce = category.categoryKey === 'commerce';
        
        return (
          <section
            key={category.categoryKey}
            className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FAFAF7] flex items-center justify-center border border-[#E5E4DF]">
                  <Icon className="w-5 h-5 text-[#191919]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#191919]">{category.label}</h3>
                  <p className="text-xs text-[#666663]">{category.description}</p>
                </div>
              </div>
              
              {/* Badge de connexion pour la section Commerce */}
              {isCommerce && isCommerceConnected && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-emerald-700">Connecté</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((item) => {
                // Pour la section commerce, marquer Shopify comme connecté si des produits existent
                const isItemConnected = isCommerce && isCommerceConnected && item.type === 'shopify';
                const hasLogo = item.logo;
                
                return (
                  <div
                    key={item.type}
                    className={`
                      group flex items-center gap-3 p-3 rounded-xl border transition-colors text-left
                      ${isItemConnected 
                        ? 'border-emerald-200 bg-emerald-50/50' 
                        : 'border-[#E5E4DF] bg-[#FAFAF7] hover:bg-white hover:border-[#191919] cursor-pointer'
                      }
                    `}
                    onClick={!isItemConnected ? () => window.open(item.url, '_blank', 'noopener,noreferrer') : undefined}
                    role={isItemConnected ? undefined : "button"}
                    tabIndex={isItemConnected ? undefined : 0}
                  >
                    {/* Logo - Image ou Lettre */}
                    {hasLogo ? (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-[#E5E4DF] overflow-hidden p-1.5">
                        <img 
                          src={item.logo} 
                          alt={`${item.officialName} logo`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-lg ${item.highlightColor}`}
                        aria-hidden="true"
                      >
                        {item.logoText}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#191919] truncate">
                          {item.officialName}
                        </span>
                        {isItemConnected ? (
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-600 font-medium">
                            <Check className="w-3 h-3" />
                            Connecté
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wide text-[#8A8A86] group-hover:text-[#191919]">
                            Bientôt
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#666663] mt-0.5 truncate">
                        {isItemConnected 
                          ? `${products.length} produits synchronisés`
                          : `Installer l'app Stockeasy sur ${item.name}`
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};


