import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { toast } from 'sonner';

const SupabaseResetPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast.error(t('auth.resetError'));
      } else {
        setEmailSent(true);
        toast.success(t('auth.emailSent'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#191919] mb-2">{t('auth.emailSent')}</h2>
            <p className="text-[#6B7280]">
              {t('auth.checkYourInbox')}
            </p>
          </div>

          <Link
            to="/login"
            className="inline-block bg-[#191919] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2D2D2D] transition"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#191919] mb-2">{t('auth.forgotPasswordTitle')}</h1>
          <p className="text-[#6B7280]">
            {t('auth.forgotPasswordDescription')}
          </p>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#191919] text-white py-3 rounded-lg font-medium hover:bg-[#2D2D2D] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('auth.sending') : t('auth.sendResetLink')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-[#191919] hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SupabaseResetPassword;

