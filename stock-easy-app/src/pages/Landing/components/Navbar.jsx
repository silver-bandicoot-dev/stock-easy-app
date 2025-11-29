import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, LogIn } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Fonctionnalités', href: '#features' },
    { name: 'Comment ça marche', href: '#how-it-works' },
    { name: 'Témoignages', href: '#testimonials' },
    { name: 'Tarifs', href: '#pricing' },
  ];

  // Logo component matching the app's Logo.jsx
  const Logo = ({ size = 48 }) => (
    <div className="flex items-center justify-center gap-2">
      {/* Cube 3D SVG (retourné verticalement comme dans l'app) */}
      <div style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          style={{ transform: 'scaleY(-1)' }}
        >
          {/* Face avant */}
          <path
            d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z"
            fill="rgba(0, 0, 0, 0.8)"
            stroke="#191919"
            strokeWidth="1.5"
          />
          {/* Face gauche (plus sombre) */}
          <path
            d="M50 15 L15 35 L15 65 L50 45 Z"
            fill="rgba(0, 0, 0, 0.6)"
            stroke="#191919"
            strokeWidth="1.5"
          />
          {/* Face droite */}
          <path
            d="M50 15 L85 35 L85 65 L50 45 Z"
            fill="rgba(0, 0, 0, 0.9)"
            stroke="#191919"
            strokeWidth="1.5"
          />
          {/* Arêtes internes pour effet 3D */}
          <line x1="50" y1="15" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5" />
          <line x1="15" y1="35" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5" />
          <line x1="85" y1="35" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
      {/* Séparateur vertical fin */}
      <div className="w-px h-8 bg-[#191919] opacity-30" />
      {/* Texte de marque */}
      <span className="text-xl brand-font text-[#191919] -translate-y-0.5">
        stockeasy
      </span>
    </div>
  );

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#FAFAF7]/95 backdrop-blur-md border-b border-[#E5E4DF]' 
            : 'bg-transparent'
        }`}
      >
        <div className="landing-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#" className="flex items-center">
              <Logo size={40} />
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm text-[#191919]/70 hover:text-[#191919] transition-colors duration-200"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <a href="/login" className="btn-ghost">
                Log In
              </a>
              <a
                href="https://apps.shopify.com/stockeasy"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <img 
                  src="/logos/shopify.png" 
                  alt="Shopify" 
                  className="w-4 h-4 object-contain"
                />
                Installer sur Shopify
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#191919]"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 md:hidden pt-16"
          >
            <div className="absolute inset-0 bg-[#FAFAF7]" />
            <div className="relative p-6 space-y-2">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between py-4 text-[#191919] border-b border-[#E5E4DF]"
                >
                  {link.name}
                  <ChevronRight size={18} className="text-[#191919]/40" />
                </motion.a>
              ))}
              
              <div className="pt-6 space-y-3">
                <a href="/login" className="btn-secondary w-full justify-center">
                  Log In
                </a>
                <a
                  href="https://apps.shopify.com/stockeasy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center"
                >
                  <img 
                    src="/logos/shopify.png" 
                    alt="Shopify" 
                    className="w-4 h-4 object-contain"
                  />
                  Installer sur Shopify
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
