import { Twitter, Linkedin, Mail, Heart } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    product: {
      title: "Produit",
      links: [
        { name: "Fonctionnalités", href: "#features" },
        { name: "Tarifs", href: "#pricing" },
        { name: "Intégrations", href: "#" },
      ]
    },
    resources: {
      title: "Ressources",
      links: [
        { name: "Documentation", href: "#" },
        { name: "Guide de démarrage", href: "#" },
        { name: "Blog", href: "#" },
      ]
    },
    company: {
      title: "Entreprise",
      links: [
        { name: "À propos", href: "#" },
        { name: "Contact", href: "mailto:contact@stockeasy.app" },
      ]
    },
    legal: {
      title: "Légal",
      links: [
        { name: "Confidentialité", href: "#" },
        { name: "CGU", href: "#" },
      ]
    },
  };

  const socialLinks = [
    { icon: Twitter, href: "#", name: "Twitter" },
    { icon: Linkedin, href: "#", name: "LinkedIn" },
    { icon: Mail, href: "mailto:contact@stockeasy.app", name: "Email" },
  ];

  // Logo component matching the app
  const Logo = () => (
    <div className="flex items-center justify-center gap-2">
      <div style={{ width: 36, height: 36 }}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          style={{ transform: 'scaleY(-1)' }}
        >
          <path d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z" fill="rgba(0, 0, 0, 0.8)" stroke="#191919" strokeWidth="1.5" />
          <path d="M50 15 L15 35 L15 65 L50 45 Z" fill="rgba(0, 0, 0, 0.6)" stroke="#191919" strokeWidth="1.5" />
          <path d="M50 15 L85 35 L85 65 L50 45 Z" fill="rgba(0, 0, 0, 0.9)" stroke="#191919" strokeWidth="1.5" />
          <line x1="50" y1="15" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5" />
          <line x1="15" y1="35" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5" />
          <line x1="85" y1="35" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
      <div className="w-px h-6 bg-[#191919] opacity-30" />
      <span className="text-lg brand-font text-[#191919]">stockeasy</span>
    </div>
  );

  return (
    <footer className="bg-[#FAFAF7] border-t border-[#E5E4DF] pt-16 pb-8">
      <div className="landing-container">
        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Logo />
            <p className="text-sm text-[#191919]/50 mt-4 max-w-xs">
              La gestion de stock intelligente pour les marchands Shopify.
            </p>
            
            {/* Shopify Partner */}
            <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-white border border-[#E5E4DF] w-fit">
              <img src="/logos/shopify.png" alt="Shopify" className="w-5 h-5 object-contain" />
              <span className="text-xs text-[#191919]/60">Shopify Partner</span>
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-medium text-[#191919] mb-3 text-sm">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-[#191919]/50 hover:text-[#191919] transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#E5E4DF] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#191919]/50">
            <span>© {new Date().getFullYear()} stockeasy</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Fait avec <Heart size={12} className="text-rose-500" fill="currentColor" /> en France
            </span>
          </div>

          {/* Social */}
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="w-9 h-9 rounded-lg bg-white border border-[#E5E4DF] flex items-center justify-center text-[#191919]/50 hover:text-[#191919] hover:border-[#191919]/20 transition-all"
                aria-label={social.name}
              >
                <social.icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
