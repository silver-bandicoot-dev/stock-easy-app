import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

/**
 * SetupPassword - Page pour configurer le mot de passe après une invitation Shopify
 * 
 * Flow:
 * 1. L'utilisateur clique sur le lien d'invitation (contient token_hash dans le hash)
 * 2. On valide le token via verifyOtp - ceci connecte automatiquement l'utilisateur
 * 3. L'utilisateur crée son mot de passe
 * 4. On met à jour le mot de passe et on marque password_configured: true
 * 5. Redirection vers /app
 */
const SetupPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [shopName, setShopName] = useState('');

  // Validation du mot de passe
  const passwordMinLength = 8;
  const passwordsMatch = password === confirmPassword;
  const passwordValid = password.length >= passwordMinLength;
  const canSubmit = passwordValid && passwordsMatch && !submitting;

  // Vérifier le token au chargement de la page
  useEffect(() => {
    const verifyInvitationToken = async () => {
      try {
        // Extraire les paramètres du hash de l'URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const tokenHash = hashParams.get('token_hash');
        const type = hashParams.get('type');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');

        // Vérifier s'il y a une erreur dans l'URL
        if (errorCode) {
          console.error('Token error:', errorCode, errorDescription);
          setTokenError(errorDescription || t('auth.invalidToken'));
          setLoading(false);
          return;
        }

        // Vérifier si on a les paramètres nécessaires
        if (!tokenHash || type !== 'invite') {
          // Peut-être que l'utilisateur est déjà connecté via le lien
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // L'utilisateur est déjà connecté
            setUserEmail(session.user.email);
            setShopName(session.user.user_metadata?.shop_name || '');
            
            // Vérifier si le mot de passe est déjà configuré
            if (session.user.user_metadata?.password_configured) {
              toast.info(t('auth.passwordAlreadyConfigured'));
              navigate('/app');
              return;
            }
            
            setTokenVerified(true);
            setLoading(false);
            return;
          }
          
          setTokenError(t('auth.invalidInvitationLink'));
          setLoading(false);
          return;
        }

        // Valider le token d'invitation
        console.log('Verifying invitation token...');
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'invite'
        });

        if (error) {
          console.error('Token verification error:', error);
          
          // Messages d'erreur personnalisés
          if (error.message.includes('expired')) {
            setTokenError(t('auth.tokenExpired'));
          } else if (error.message.includes('already')) {
            setTokenError(t('auth.tokenAlreadyUsed'));
          } else {
            setTokenError(error.message);
          }
          setLoading(false);
          return;
        }

        // Token valide - l'utilisateur est maintenant connecté
        console.log('Token verified, user authenticated:', data.user?.email);
        setUserEmail(data.user?.email || '');
        setShopName(data.user?.user_metadata?.shop_name || '');
        setTokenVerified(true);
        
        // Nettoyer l'URL (supprimer le hash avec le token)
        window.history.replaceState(null, '', window.location.pathname);
        
      } catch (error) {
        console.error('Unexpected error during token verification:', error);
        setTokenError(t('auth.genericError'));
      } finally {
        setLoading(false);
      }
    };

    verifyInvitationToken();
  }, [navigate, t]);

  // Soumettre le nouveau mot de passe
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canSubmit) return;
    
    setSubmitting(true);

    try {
      // Mettre à jour le mot de passe
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password
      });

      if (passwordError) {
        console.error('Password update error:', passwordError);
        toast.error(t('auth.passwordUpdateError'));
        setSubmitting(false);
        return;
      }

      // Marquer le mot de passe comme configuré dans les metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { password_configured: true }
      });

      if (metadataError) {
        console.warn('Could not update metadata:', metadataError);
        // Non bloquant - on continue quand même
      }

      toast.success(t('auth.passwordConfigured'));
      
      // Rediriger vers l'application
      navigate('/app');
      
    } catch (error) {
      console.error('Error setting password:', error);
      toast.error(t('auth.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#191919] mx-auto mb-4"></div>
          <p className="text-[#6B7280]">{t('auth.verifyingToken')}</p>
        </div>
      </div>
    );
  }

  // Erreur de token
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#191919] mb-2">{t('auth.invitationError')}</h2>
            <p className="text-[#6B7280] mb-4">{tokenError}</p>
            <p className="text-sm text-[#9CA3AF]">
              {t('auth.contactSupport')}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/login"
              className="inline-block w-full bg-[#191919] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2D2D2D] transition"
            >
              {t('auth.backToLogin')}
            </Link>
            <a
              href="mailto:support@stockeasy.app"
              className="inline-block w-full border border-[#E5E7EB] text-[#191919] px-6 py-3 rounded-lg font-medium hover:bg-[#F9FAFB] transition"
            >
              {t('auth.contactUs')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire de création de mot de passe
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          {/* Logo Stockeasy */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              style={{ transform: 'scaleY(-1)' }}
            >
              <path d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z" fill="rgba(0, 0, 0, 0.8)" stroke="#191919" strokeWidth="1.5"/>
              <path d="M50 15 L15 35 L15 65 L50 45 Z" fill="rgba(0, 0, 0, 0.6)" stroke="#191919" strokeWidth="1.5"/>
              <path d="M50 15 L85 35 L85 65 L50 45 Z" fill="rgba(0, 0, 0, 0.9)" stroke="#191919" strokeWidth="1.5"/>
            </svg>
            <span className="text-2xl font-bold text-[#191919]">stockeasy</span>
          </div>
          
          <h1 className="text-3xl font-bold text-[#191919] mb-2">
            {t('auth.welcomeTitle')}
          </h1>
          <p className="text-[#6B7280]">
            {t('auth.createPasswordDescription')}
          </p>
          
          {/* Afficher l'email et la boutique */}
          {(userEmail || shopName) && (
            <div className="mt-4 p-3 bg-[#F3F4F6] rounded-lg">
              {userEmail && (
                <p className="text-sm text-[#4B5563]">
                  <span className="font-medium">{t('auth.email')}:</span> {userEmail}
                </p>
              )}
              {shopName && (
                <p className="text-sm text-[#4B5563]">
                  <span className="font-medium">{t('auth.shop')}:</span> {shopName}
                </p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#191919] mb-2">
              {t('auth.newPassword')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={passwordMinLength}
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition"
              placeholder={t('auth.passwordPlaceholder')}
            />
            {password && !passwordValid && (
              <p className="mt-1 text-sm text-red-500">
                {t('auth.passwordMinLength', { count: passwordMinLength })}
              </p>
            )}
          </div>

          {/* Confirmation du mot de passe */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#191919] mb-2">
              {t('auth.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition"
              placeholder={t('auth.confirmPasswordPlaceholder')}
            />
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-sm text-red-500">
                {t('auth.passwordsMustMatch')}
              </p>
            )}
          </div>

          {/* Indicateur de force du mot de passe */}
          {password && (
            <div className="space-y-2">
              <div className="flex gap-1">
                <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${password.length >= 10 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${password.length >= 12 && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${password.length >= 12 && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              </div>
              <p className="text-xs text-[#6B7280]">
                {t('auth.passwordStrengthHint')}
              </p>
            </div>
          )}

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[#191919] text-white py-3 rounded-lg font-medium hover:bg-[#2D2D2D] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t('auth.configuring') : t('auth.configurePassword')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#6B7280]">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-[#191919] font-medium hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupPassword;
