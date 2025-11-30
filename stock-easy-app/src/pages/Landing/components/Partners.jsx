import { motion } from 'framer-motion';

const Partners = () => {
  const trustedBy = [
    'Entreprises e-commerce',
    'Retailers multi-canaux',
    'Marques DTC',
    'Dropshippers',
    'Grossistes',
    'Marketplaces',
  ];

  return (
    <section className="py-10 bg-white border-y border-[#E5E4DF]">
      <div className="landing-container">
        {/* Main Integration - Shopify */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center"
        >
          <p className="text-sm text-[#191919]/50 uppercase tracking-wider mb-8">
            Intégration principale
          </p>
          
          <div className="flex items-center gap-6 mb-8">
            <img 
              src="/logos/shopify.png" 
              alt="Shopify" 
              className="w-16 h-16 object-contain"
            />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-[#191919]">Shopify</span>
                <span className="badge badge-success">Disponible</span>
              </div>
              <p className="text-sm text-[#191919]/50 mt-1">
                Synchronisation bidirectionnelle complète
              </p>
            </div>
          </div>

          <a
            href="https://apps.shopify.com/stockeasy"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <img 
              src="/logos/shopify-white.svg" 
              alt="Shopify" 
              className="w-4 h-4 object-contain"
            />
            Voir sur Shopify App Store
          </a>
        </motion.div>

        {/* Trusted By Marquee */}
        <div className="relative mt-8 pt-8 border-t border-[#E5E4DF]">
          <div className="absolute left-0 top-12 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-12 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
          
          <div className="overflow-hidden py-4">
            <div className="flex marquee-track">
              {[...trustedBy, ...trustedBy].map((item, index) => (
                <div key={index} className="flex items-center gap-3 mx-6 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#191919]/20" />
                  <span className="text-sm text-[#191919]/50">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
