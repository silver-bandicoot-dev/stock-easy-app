import React from 'react';
import { Mail, ShoppingBag, Boxes } from 'lucide-react';

const integrations = [
  {
    categoryKey: 'mail',
    label: 'Mail',
    icon: Mail,
    description: 'Connectez vos messageries pour envoyer les emails directement depuis StockEasy.',
    items: [
      {
        name: 'Gmail',
        type: 'gmail',
        logoText: 'G',
        officialName: 'Gmail',
        highlightColor: 'bg-[#EA4335]',
        url: 'https://workspace.google.com/marketplace', // TODO: à remplacer par l’URL exacte de l’app StockEasy
      },
      {
        name: 'Outlook',
        type: 'outlook',
        logoText: 'O',
        officialName: 'Microsoft Outlook',
        highlightColor: 'bg-[#0078D4]',
        url: 'https://appsource.microsoft.com/', // TODO: à remplacer par l’URL exacte de l’app StockEasy
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
        logoText: 'S',
        officialName: 'Shopify',
        highlightColor: 'bg-[#96BF48]',
        url: 'https://apps.shopify.com/', // TODO: URL spécifique à StockEasy
      },
      {
        name: 'WooCommerce',
        type: 'woocommerce',
        logoText: 'W',
        officialName: 'WooCommerce',
        highlightColor: 'bg-[#96588A]',
        url: 'https://woocommerce.com/products/', // TODO: URL spécifique à StockEasy
      },
    ],
  },
  {
    categoryKey: 'erp',
    label: 'ERP',
    icon: Boxes,
    description: 'Reliez vos ERP pour partager les données de stock, achats et comptabilité.',
    items: [
      {
        name: 'NetSuite',
        type: 'netsuite',
        logoText: 'N',
        officialName: 'Oracle NetSuite',
        highlightColor: 'bg-[#1F4D90]',
        url: 'https://www.netsuite.com/portal/products/cloud-apps.shtml', // TODO
      },
      {
        name: 'Holded',
        type: 'holded',
        logoText: 'H',
        officialName: 'Holded',
        highlightColor: 'bg-[#2D7EF7]',
        url: 'https://apps.holded.com/', // TODO
      },
    ],
  },
];

export const IntegrationsSettings = () => {
  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h2 className="text-xl font-bold text-[#191919] mb-1">Intégrations</h2>
        <p className="text-sm text-[#666663] max-w-2xl">
          Connectez StockEasy à vos outils existants (messagerie, e‑commerce, ERP) pour automatiser les flux de
          données et envoyer les emails directement depuis vos comptes Gmail / Outlook.
        </p>
        <p className="text-xs text-[#8A8A86] mt-3">
          Ces intégrations sont en cours de déploiement. En attendant, les cartes ci‑dessous vous redirigent vers les
          stores officiels pour préparer l’installation de l’app StockEasy.
        </p>
      </div>

      {/* Categories */}
      {integrations.map((category) => {
        const Icon = category.icon;
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-[#E5E4DF] bg-[#FAFAF7] hover:bg-white hover:border-[#191919] transition-colors text-left"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-lg ${item.highlightColor}`}
                    aria-hidden="true"
                  >
                    {item.logoText}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#191919] truncate">
                        {item.officialName}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-[#8A8A86] group-hover:text-[#191919]">
                        Bientôt
                      </span>
                    </div>
                    <p className="text-xs text-[#666663] mt-0.5 truncate">
                      Installer l’app StockEasy sur {item.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};


