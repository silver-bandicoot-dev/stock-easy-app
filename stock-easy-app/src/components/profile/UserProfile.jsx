/**
 * @deprecated Ce composant est déprécié.
 * Utilisez ProfilePage à la place pour une meilleure expérience utilisateur.
 * 
 * Ce fichier sera supprimé dans une version future.
 * 
 * Migration : import ProfilePage from './ProfilePage';
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { 
  User, Camera, Mail, Globe, Briefcase, Users, Save, ArrowLeft, 
  Crown, UserPlus, X, Upload
} from 'lucide-react';
import {
  getCurrentUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  getTeamMembers,
  ensureUserCompany
} from '../../services/profileService';

/**
 * @deprecated Utilisez ProfilePage à la place
 */
const UserProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // States
  const [userData, setUserData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [language, setLanguage] = useState('fr');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Original values to track changes
  const [originalValues, setOriginalValues] = useState({
    firstName: '',
    lastName: '',
    language: 'fr',
    photoUrl: null
  });

  // Charger les données utilisateur
  useEffect(() => {
    const initializeUser = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          
          // S'assurer que l'utilisateur a une entreprise
          await ensureUserCompany();
          
          // Charger le profil utilisateur
          const { data: profileData, error: profileError } = await getCurrentUserProfile();
          
          if (profileError) {
            throw profileError;
          }

          if (profileData) {
            setUserData(profileData);
            setFirstName(profileData.firstName || '');
            setLastName(profileData.lastName || '');
            setLanguage(profileData.language || 'fr');
            setPhotoPreview(profileData.photoUrl);
            
            setOriginalValues({
              firstName: profileData.firstName || '',
              lastName: profileData.lastName || '',
              language: profileData.language || 'fr',
              photoUrl: profileData.photoUrl
            });
          }
          
          // Charger les membres de l'équipe
          const { data: membersData, error: membersError } = await getTeamMembers();
          if (membersError) {
            throw membersError;
          }
          setTeamMembers(Array.isArray(membersData) ? membersData : []);
          
        } catch (error) {
          console.error('Erreur initialisation utilisateur:', error);
          toast.error('Erreur lors du chargement du profil');
        } finally {
          setLoading(false);
        }
      }
    };

    initializeUser();
  }, [currentUser]);

  // Gestion du changement de langue
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5 Mo');
        return;
      }
      
      setPhotoFile(file);
      
      // Prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      let photoUrl = userData?.photoUrl;
      
      // Upload de la photo si nécessaire
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          photoUrl = await uploadProfilePhoto(photoFile);
          toast.success('Photo de profil uploadée !');
        } catch (error) {
          console.error('Erreur upload photo:', error);
          toast.error('Erreur lors de l\'upload de la photo');
          // Continuer quand même avec les autres modifications
        } finally {
          setUploadingPhoto(false);
        }
      }
      
      // Mettre à jour le profil
      await updateUserProfile({
        firstName,
        lastName,
        language,
        photoUrl: photoUrl || undefined
      });
      
      // Recharger le profil
      const { data: updatedProfile, error: updatedProfileError } = await getCurrentUserProfile();
      if (updatedProfileError) {
        throw updatedProfileError;
      }
      if (updatedProfile) {
        setUserData(updatedProfile);
        setOriginalValues({
          firstName: updatedProfile.firstName || '',
          lastName: updatedProfile.lastName || '',
          language: updatedProfile.language || 'fr',
          photoUrl: updatedProfile.photoUrl
        });
      }
      
      setPhotoFile(null);
      toast.success('Profil mis à jour avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return (
      firstName !== originalValues.firstName ||
      lastName !== originalValues.lastName ||
      language !== originalValues.language ||
      photoFile !== null
    );
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) return firstName.charAt(0).toUpperCase();
    return currentUser?.email?.charAt(0).toUpperCase() || '?';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-[#191919]">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app')}
              className="p-2 hover:bg-[#E5E4DF] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#E5E4DF] flex items-center justify-center text-sm font-semibold text-[#191919]">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-[#191919] leading-snug">
                  Mon profil
                </h1>
                <p className="text-sm text-[#666663]">
                  {firstName || lastName
                    ? `${firstName} ${lastName}`.trim()
                    : currentUser?.email || ''}
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges() || saving || uploadingPhoto}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              hasChanges() && !saving && !uploadingPhoto
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-5 h-5" />
            {uploadingPhoto ? 'Upload photo...' : saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-8">
            {/* Photo de profil */}
            <div className="flex items-start gap-6 mb-8 pb-8 border-b border-[#E5E4DF]">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {getInitials()}
                  </div>
                )}
                
                <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors border border-[#E5E4DF]">
                  <Camera className="w-4 h-4 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#191919] mb-1">
                  {firstName && lastName ? `${firstName} ${lastName}` : 'Votre nom'}
                </h2>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {currentUser?.email}
                </p>
                {userData?.role && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {userData.role === 'owner' && <Crown className="w-4 h-4" />}
                    {userData.role === 'owner' ? 'Propriétaire' : 
                     userData.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-[#191919] mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Votre prénom"
                    required
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-[#191919] mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-[#191919] mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Langue de l'interface
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </div>

          {/* Team Members Card */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#191919] flex items-center gap-2">
                <Users className="w-5 h-5" />
                Équipe
              </h3>
              <span className="text-sm text-gray-500">{Array.isArray(teamMembers) ? teamMembers.length : 0} membres</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Array.isArray(teamMembers) && teamMembers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun membre d'équipe
                </p>
              ) : (
                Array.isArray(teamMembers) ? teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#191919] truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                    {member.role === 'owner' && (
                      <Crown className="w-4 h-4 text-yellow-500 shrink-0" />
                    )}
                  </div>
                )) : null
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>✨ Nouveau :</strong> Votre profil est maintenant hébergé sur Supabase ! 
            Les photos sont stockées de manière sécurisée et les données sont synchronisées en temps réel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
