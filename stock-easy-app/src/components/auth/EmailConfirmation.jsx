import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { Logo } from '../ui/Logo';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Récupérer les paramètres de l'URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const tokenHash = searchParams.get('token_hash');

        console.log('🔐 Paramètres de confirmation:', { token, type, tokenHash });

        // Si c'est une confirmation d'email standard
        if (type === 'signup' || type === 'email') {
          // Vérifier la session actuelle
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Erreur session:', sessionError);
          }

          // Si l'utilisateur a un token dans l'URL, essayer de vérifier l'email
          if (token && tokenHash) {
            try {
              const { data, error } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: 'email'
              });

              if (error) {
                console.error('❌ Erreur vérification OTP:', error);
                // Si l'email est déjà confirmé, c'est OK
                if (error.message?.includes('already confirmed') || error.message?.includes('already verified')) {
                  setStatus('success');
                  setMessage('Votre adresse email est déjà confirmée.');
                } else {
                  throw error;
                }
              } else {
                setStatus('success');
                setMessage('Votre adresse email a été confirmée avec succès !');
              }
            } catch (verifyError) {
              // Si la vérification échoue mais que l'utilisateur est déjà confirmé, c'est OK
              if (verifyError.message?.includes('already confirmed') || verifyError.message?.includes('already verified')) {
                setStatus('success');
                setMessage('Votre adresse email est déjà confirmée.');
              } else {
                // Vérifier si l'utilisateur est déjà connecté et confirmé
                if (session?.user?.email_confirmed_at) {
                  setStatus('success');
                  setMessage('Votre adresse email est déjà confirmée.');
                } else {
                  throw verifyError;
                }
              }
            }
          } else {
            // Pas de token dans l'URL, vérifier si l'utilisateur est déjà confirmé
            if (session?.user?.email_confirmed_at) {
              setStatus('success');
              setMessage('Votre adresse email est déjà confirmée.');
            } else {
              // Attendre un peu pour voir si Supabase met à jour la session
              await new Promise(resolve => setTimeout(resolve, 1000));
              const { data: { session: newSession } } = await supabase.auth.getSession();
              if (newSession?.user?.email_confirmed_at) {
                setStatus('success');
                setMessage('Votre adresse email a été confirmée avec succès !');
              } else {
                setStatus('error');
                setMessage('Impossible de confirmer votre email. Le lien peut être invalide ou expiré.');
              }
            }
          }
        } else {
          // Type de confirmation non reconnu
          setStatus('error');
          setMessage('Type de confirmation non reconnu.');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la confirmation:', error);
        setStatus('error');
        setMessage('Une erreur est survenue lors de la confirmation de votre email.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams]);

  // Rediriger vers login après 3 secondes si succès
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Votre adresse email a été confirmée. Vous pouvez maintenant vous connecter.' 
          } 
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="large" showText={true} theme="light" />
          </div>
        </div>

        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#191919] mb-4"></div>
            <p className="text-[#6B7280]">Vérification de votre email en cours...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#191919] mb-2">
              Email confirmé !
            </h2>
            <p className="text-[#6B7280] mb-6">{message}</p>
            <p className="text-sm text-[#6B7280]">
              Redirection vers la page de connexion dans quelques secondes...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#191919] mb-2">
              Erreur de confirmation
            </h2>
            <p className="text-[#6B7280] mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#191919] text-white py-3 rounded-lg font-medium hover:bg-[#2D2D2D] transition"
            >
              Aller à la page de connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmation;

