import React, { useState, useRef, useEffect } from 'react';
import { Mail, ShoppingBag, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { useStockContext } from '../../contexts/StockDataContext';

// Options pour les emails
const emailOptions = [
  {
    value: 'gmail',
    label: 'Gmail',
    logo: '/logos/gmail.webp',
    url: 'https://workspace.google.com/marketplace',
  },
  {
    value: 'outlook',
    label: 'Microsoft Outlook',
    logo: '/logos/outlook.png',
    url: 'https://appsource.microsoft.com/',
  },
];

// Options pour les plateformes e-commerce
const commerceOptions = [
  {
    value: 'shopify',
    label: 'Shopify',
    logo: '/logos/shopify.png',
    url: 'https://apps.shopify.com/',
  },
  {
    value: 'woocommerce',
    label: 'WooCommerce',
    logo: '/logos/woocommerce.png',
    url: 'https://woocommerce.com/products/',
  },
  {
    value: 'bigcommerce',
    label: 'BigCommerce',
    logo: '/logos/bigcommerce.png',
    url: 'https://www.bigcommerce.com/apps/',
  },
];

// Composant Select personnalisé avec logos
const IntegrationSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder,
  isConnected = false,
  connectedValue = null,
  productCount = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.value === value);
  const connectedOption = options.find(opt => opt.value === connectedValue);
  
  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  // Si connecté, afficher un état verrouillé
  if (isConnected && connectedOption) {
    return (
      <div className="relative" ref={selectRef}>
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white border border-emerald-200 overflow-hidden p-2">
            <img 
              src={connectedOption.logo} 
              alt={connectedOption.label}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[#191919]">
                {connectedOption.label}
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 rounded-full text-[10px] uppercase tracking-wide text-emerald-700 font-medium">
                <Check className="w-3 h-3" />
                Connecté
              </span>
            </div>
            <p className="text-sm text-emerald-600 mt-0.5">
              {productCount} produits synchronisés
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={selectRef}>
      {/* Bouton principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
          ${isOpen 
            ? 'border-[#191919] bg-white shadow-lg' 
            : 'border-[#E5E4DF] bg-[#FAFAF7] hover:border-[#BDBDB8] hover:bg-white'
          }
        `}
      >
        {selectedOption ? (
          <>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white border border-[#E5E4DF] overflow-hidden p-2">
              <img 
                src={selectedOption.logo} 
                alt={selectedOption.label}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <span className="text-base font-semibold text-[#191919]">
                {selectedOption.label}
              </span>
              <p className="text-xs text-[#666663] mt-0.5">
                Sélectionné
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#E5E4DF]/50 border border-dashed border-[#BDBDB8]">
              <span className="text-[#8A8A86] text-lg">?</span>
            </div>
            <div className="flex-1">
              <span className="text-base font-medium text-[#666663]">
                {placeholder}
              </span>
              <p className="text-xs text-[#8A8A86] mt-0.5">
                Cliquez pour choisir
              </p>
            </div>
          </>
        )}
        <ChevronDown 
          className={`w-5 h-5 text-[#666663] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-[#E5E4DF] shadow-xl overflow-hidden">
          <div className="p-2">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                    ${isSelected 
                      ? 'bg-[#191919] text-white' 
                      : 'hover:bg-[#FAFAF7]'
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden p-1.5
                    ${isSelected ? 'bg-white' : 'bg-white border border-[#E5E4DF]'}
                  `}>
                    <img 
                      src={option.logo} 
                      alt={option.label}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-[#191919]'}`}>
                      {option.label}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
          
          {/* Lien vers le store */}
          {selectedOption && (
            <div className="border-t border-[#E5E4DF] p-2">
              <a
                href={selectedOption.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg text-sm text-[#666663] hover:bg-[#FAFAF7] hover:text-[#191919] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Voir sur le store officiel</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const IntegrationsSettings = () => {
  const { products, loading } = useStockContext();
  
  // États pour les sélections
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedCommerce, setSelectedCommerce] = useState(null);
  
  // Déterminer si connecté à une plateforme commerce (basé sur la présence de produits synchronisés)
  const isCommerceConnected = !loading && products && products.length > 0;
  
  // Si connecté via Shopify, définir la sélection par défaut
  useEffect(() => {
    if (isCommerceConnected) {
      setSelectedCommerce('shopify');
    }
  }, [isCommerceConnected]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h2 className="text-xl font-bold text-[#191919] mb-1">Intégrations</h2>
        <p className="text-sm text-[#666663] max-w-2xl">
          Connectez Stockeasy à vos outils existants. Choisissez <strong>une plateforme e‑commerce</strong> pour 
          synchroniser vos produits et <strong>un service email</strong> pour envoyer des notifications directement 
          depuis votre compte.
        </p>
        <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="w-2 h-2 bg-amber-400 rounded-full" />
          <p className="text-xs text-amber-700">
            Ces intégrations sont en cours de déploiement. En attendant, vous pouvez préparer votre configuration.
          </p>
        </div>
      </div>

      {/* Plateforme E-commerce */}
      <section className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#FAFAF7] flex items-center justify-center border border-[#E5E4DF]">
            <ShoppingBag className="w-5 h-5 text-[#191919]" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[#191919]">Plateforme E-commerce</h3>
            <p className="text-xs text-[#666663]">
              Synchronisez vos produits et commandes depuis votre boutique en ligne
            </p>
          </div>
          {isCommerceConnected && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">Actif</span>
            </div>
          )}
        </div>
        
        <IntegrationSelect
          options={commerceOptions}
          value={selectedCommerce}
          onChange={setSelectedCommerce}
          placeholder="Choisir une plateforme"
          isConnected={isCommerceConnected}
          connectedValue="shopify"
          productCount={products?.length || 0}
        />
      </section>

      {/* Service Email */}
      <section className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#FAFAF7] flex items-center justify-center border border-[#E5E4DF]">
            <Mail className="w-5 h-5 text-[#191919]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#191919]">Service Email</h3>
            <p className="text-xs text-[#666663]">
              Envoyez des notifications et alertes depuis votre messagerie
            </p>
          </div>
        </div>
        
        <IntegrationSelect
          options={emailOptions}
          value={selectedEmail}
          onChange={setSelectedEmail}
          placeholder="Choisir un service email"
        />
      </section>

      {/* Résumé de configuration */}
      {(selectedCommerce || selectedEmail) && (
        <div className="bg-[#FAFAF7] rounded-xl border border-[#E5E4DF] p-5">
          <h4 className="text-sm font-semibold text-[#191919] mb-3">Résumé de votre configuration</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#666663]">Plateforme E-commerce</span>
              <span className="font-medium text-[#191919]">
                {selectedCommerce 
                  ? commerceOptions.find(o => o.value === selectedCommerce)?.label 
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#666663]">Service Email</span>
              <span className="font-medium text-[#191919]">
                {selectedEmail 
                  ? emailOptions.find(o => o.value === selectedEmail)?.label 
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


