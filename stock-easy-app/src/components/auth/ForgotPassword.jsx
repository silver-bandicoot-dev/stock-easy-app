import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast.success('Email de réinitialisation envoyé !');
    } catch (error) {
      console.error('Reset password error:', error);
      let errorMessage = 'Erreur lors de l\'envoi de l\'email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cet email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#191919] mb-2">Stock Easy</h1>
          <p className="text-gray-600">Réinitialisation du mot de passe</p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Link
            to="/login"
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour à la connexion</span>
          </Link>

          <h2 className="text-2xl font-bold text-[#191919] mb-4">
            Mot de passe oublié ?
          </h2>
          <p className="text-gray-600 mb-6">
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {emailSent ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                Un email de réinitialisation a été envoyé à <strong>{email}</strong>. 
                Vérifiez votre boîte de réception et suivez les instructions.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Envoi en cours...</span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Envoyer le lien</span>
                  </>
                )}
              </button>
            </form>
          )}

          {emailSent && (
            <button
              onClick={() => setEmailSent(false)}
              className="w-full mt-4 text-black hover:underline"
            >
              Renvoyer l'email
            </button>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          © 2024 Stock Easy. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

