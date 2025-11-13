import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { acceptInvitation } from '../../services/companyService';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Mail, ArrowRight, Loader } from 'lucide-react';

const AcceptInvitation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [status, setStatus] = useState('checking'); // 'checking', 'valid', 'invalid', 'accepted'
  const [error, setError] = useState(null);
  const token = searchParams.get('token');

  useEffect(() => {
    // Vérifier que le token existe
    if (!token) {
      setStatus('invalid');
      setError('Aucun token d\'invitation fourni');
      setLoading(false);
      return;
    }

    // Si l'utilisateur n'est pas connecté, le rediriger vers la page de connexion
    if (!currentUser) {
      setLoading(false);
      setStatus('login_required');
      return;
    }

    // Marquer le token comme valide (la vraie validation se fait lors de l'acceptation)
    setStatus('valid');
    setLoading(false);
  }, [token, currentUser]);

  const handleAccept = async () => {
    if (!token || !currentUser) return;

    setAccepting(true);
    try {
      const { data, error: acceptError } = await acceptInvitation(token);
      
      if (acceptError || !data.success) {
        throw new Error(data?.error || acceptError?.message || 'Erreur lors de l\'acceptation');
      }

      setStatus('accepted');
      toast.success('Bienvenue dans l\'équipe ! 🎉', {
        description: 'Vous faites maintenant partie de l\'entreprise'
      });

      // Rediriger vers le tableau de bord après 2 secondes
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Erreur acceptation invitation:', error);
      setError(error.message);
      setStatus('invalid');
      toast.error(error.message);
    } finally {
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    // Sauvegarder le token pour revenir après connexion
    sessionStorage.setItem('invitation_token', token);
    navigate(`/login?redirect=/accept-invitation?token=${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#191919] animate-spin mx-auto mb-4" />
          <p className="text-lg text-[#191919]">Vérification de l'invitation...</p>
        </div>
      </div>
    );
  }

  if (status === 'login_required') {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl border border-[#E5E4DF] p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#191919] mb-2">Invitation reçue</h1>
            <p className="text-[#666663]">
              Connectez-vous ou créez un compte pour rejoindre l'équipe
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-[#191919] text-white py-3 rounded-lg font-semibold hover:bg-[#2A2A2A] transition-colors flex items-center justify-center gap-2"
          >
            Se connecter
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl border border-[#E5E4DF] p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#191919] mb-2">Invitation invalide</h1>
            <p className="text-[#666663] mb-6">
              {error || 'Cette invitation n\'est plus valide ou a expiré.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#191919] text-white py-3 rounded-lg font-semibold hover:bg-[#2A2A2A] transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl border border-[#E5E4DF] p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#191919] mb-2">Bienvenue ! 🎉</h1>
            <p className="text-[#666663] mb-6">
              Vous faites maintenant partie de l'équipe. Redirection en cours...
            </p>
            <div className="flex justify-center">
              <Loader className="w-8 h-8 text-[#191919] animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Status = 'valid'
  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-[#E5E4DF] p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#191919] mb-2">Rejoindre l'équipe</h1>
          <p className="text-[#666663]">
            Vous avez été invité(e) à rejoindre une équipe sur Stock Easy
          </p>
        </div>

        <div className="bg-[#FAFAF7] rounded-lg p-4 mb-6">
          <p className="text-sm text-[#666663] mb-1">Compte connecté</p>
          <p className="text-[#191919] font-medium">{currentUser?.email}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-[#191919] text-white py-3 rounded-lg font-semibold hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {accepting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Acceptation en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Accepter l'invitation
              </>
            )}
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full border border-[#E5E4DF] py-3 rounded-lg font-semibold hover:bg-[#FAFAF7] transition-colors"
          >
            Annuler
          </button>
        </div>

        <p className="text-xs text-[#666663] text-center mt-6">
          En acceptant, vous aurez accès aux données et aux fonctionnalités de l'entreprise
        </p>
      </div>
    </div>
  );
};

export default AcceptInvitation;

