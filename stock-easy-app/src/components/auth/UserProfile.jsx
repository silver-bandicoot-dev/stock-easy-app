import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { User as UserIcon, Mail, Calendar, ArrowLeft, LogOut, Shield } from 'lucide-react';

const UserProfile = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour au tableau de bord</span>
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-black to-gray-800 p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {currentUser?.displayName || 'Utilisateur'}
                </h1>
                <p className="text-gray-200 mt-1">
                  {currentUser?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[#191919] mb-6">Informations du profil</h2>
            
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Mail className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="text-lg font-medium text-[#191919]">
                    {currentUser?.email || 'Non disponible'}
                  </p>
                </div>
              </div>

              {/* Display Name */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <UserIcon className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Nom</p>
                  <p className="text-lg font-medium text-[#191919]">
                    {currentUser?.displayName || 'Non renseigné'}
                  </p>
                </div>
              </div>

              {/* Account Creation Date */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Membre depuis</p>
                  <p className="text-lg font-medium text-[#191919]">
                    {formatDate(currentUser?.createdAt)}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Shield className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Rôle</p>
                  <p className="text-lg font-medium text-[#191919] capitalize">
                    {currentUser?.role || 'Utilisateur'}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-8"></div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#191919] mb-4">Actions</h3>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full bg-[#EF1C43] text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-5 h-5" />
                <span>{loading ? 'Déconnexion...' : 'Se déconnecter'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Pour modifier vos informations, contactez l'administrateur</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

