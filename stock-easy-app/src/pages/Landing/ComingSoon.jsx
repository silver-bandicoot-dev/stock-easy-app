import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Bell, Check, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import './Landing.css';

const ComingSoon = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Enregistrer l'email dans Supabase
      const { error: insertError } = await supabase
        .from('waitlist')
        .insert({ 
          email: email.toLowerCase().trim(),
          source: 'coming_soon',
          metadata: {
            referrer: document.referrer || null,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });
      
      if (insertError) {
        // Si l'email existe déjà, on considère ça comme un succès
        if (insertError.code === '23505') {
          setIsSubmitted(true);
        } else {
          throw insertError;
        }
      } else {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Waitlist signup error:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Logo component matching the app
  const Logo = ({ size = 56 }) => (
    <div className="flex items-center justify-center gap-3">
      <div style={{ width: size, height: size }}>
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
      <div className="w-px h-10 bg-[#191919] opacity-30" />
      <span className="text-2xl brand-font text-[#191919]">stockeasy</span>
    </div>
  );

  const features = [
    "Prévisions de stock par IA",
    "Synchronisation Shopify temps réel",
    "Alertes anti-rupture intelligentes",
  ];

  return (
    <div className="landing-page min-h-screen flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-[#E5E4DF]/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-tl from-[#E5E4DF]/40 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="max-w-lg w-full text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <Logo />
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E5E4DF] mb-8"
          >
            <Sparkles size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-[#191919]">
              Lancement imminent
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-5xl font-semibold text-[#191919] leading-tight mb-6"
          >
            La gestion de stock Shopify,{' '}
            <span className="relative">
              réinventée
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M2 6C50 2 150 2 198 6" stroke="#191919" strokeWidth="3" strokeLinecap="round" opacity="0.2"/>
              </svg>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-[#191919]/60 mb-8 max-w-md mx-auto"
          >
            Soyez parmi les premiers à découvrir stockeasy. 
            Inscrivez-vous pour un accès prioritaire.
          </motion.p>

          {/* Email Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-10"
          >
            {!isSubmitted ? (
              <div className="max-w-md mx-auto">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#191919]/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#E5E4DF] bg-white text-[#191919] placeholder:text-[#191919]/40 focus:outline-none focus:border-[#191919]/30 focus:ring-2 focus:ring-[#191919]/5 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary px-6 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Envoi...
                      </span>
                    ) : (
                      <>
                        M'inscrire
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-sm text-[#DC2626]"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]"
              >
                <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center">
                  <Check size={18} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#059669]">Vous êtes inscrit !</p>
                  <p className="text-sm text-[#059669]/70">Nous vous préviendrons au lancement.</p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-3"
          >
            <p className="text-xs text-[#191919]/40 uppercase tracking-wider mb-4">
              Ce qui vous attend
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E5E4DF]"
                >
                  <Check size={14} className="text-[#10B981]" />
                  <span className="text-sm text-[#191919]/70">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Shopify Partner Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12 flex items-center justify-center gap-2"
          >
            <img src="/logos/shopify.png" alt="Shopify" className="w-5 h-5 object-contain opacity-50" />
            <span className="text-xs text-[#191919]/40">Shopify Partner</span>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-[#E5E4DF]">
        <p className="text-sm text-[#191919]/40">
          © {new Date().getFullYear()} stockeasy • contact@stockeasy.app
        </p>
      </footer>
    </div>
  );
};

export default ComingSoon;

