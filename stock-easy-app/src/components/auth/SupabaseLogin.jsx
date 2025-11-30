import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { Logo } from '../ui/Logo';

const SupabaseLogin = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Afficher le message de confirmation d'email si présent
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message, {
        duration: 5000
      });
      // Nettoyer l'état pour éviter de réafficher le message
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user, error } = await login(email, password);

      if (error) {
        let errorMessage = t('auth.loginError');
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = t('auth.invalidCredentials');
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = t('auth.emailNotConfirmed');
        }
        toast.error(errorMessage);
      } else if (user) {
        navigate('/app');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="large" showText={true} theme="light" />
          </div>
          <p className="text-[#6B7280]">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#191919] mb-2">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition"
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#191919] mb-2">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-sm text-[#191919] hover:underline"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#191919] text-white py-3 rounded-lg font-medium hover:bg-[#2D2D2D] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('auth.loggingIn') : t('auth.loginButton')}
          </button>
        </form>

      </div>
    </div>
  );
};

export default SupabaseLogin;

