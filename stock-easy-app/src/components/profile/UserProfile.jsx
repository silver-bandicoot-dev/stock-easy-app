import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { User, Camera, Mail, Globe, Briefcase, Users, UserPlus, Save, ArrowLeft, Shield } from 'lucide-react';

export default function UserProfile() {
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const storage = getStorage();
  
  // States
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [language, setLanguage] = useState('fr');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Charger les données utilisateur
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Charger les données utilisateur depuis Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData(data);
        
        // Initialiser les champs du formulaire
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setLanguage(data.language || 'fr');
        setPhotoPreview(data.photoURL || null);
        
        // Charger les données de l'entreprise si l'utilisateur en a une
        if (data.companyId) {
          await loadCompanyData(data.companyId);
          await loadTeamMembers(data.companyId);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyData = async (companyId) => {
    try {
      const companyRef = doc(db, 'companies', companyId);
      const companySnap = await getDoc(companyRef);
      
      if (companySnap.exists()) {
        setCompanyData(companySnap.data());
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const loadTeamMembers = async (companyId) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('companyId', '==', companyId));
      const querySnapshot = await getDocs(q);
      
      const members = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUser.uid) {
          members.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Préparer les données à mettre à jour
      const updates = {
        firstName,
        lastName,
        language,
        displayName: `${firstName} ${lastName}`,
        updatedAt: new Date().toISOString()
      };
      
      // Upload de la photo si une nouvelle photo a été sélectionnée
      if (photoFile) {
        const photoURL = await handlePhotoUpload();
        if (photoURL) {
          updates.photoURL = photoURL;
        }
      }
      
      // Mettre à jour les données dans Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, updates);
      
      // Mettre à jour la langue de l'application
      i18n.changeLanguage(language);
      
      // Recharger les données
      await loadUserData();
      
      toast.success(t('profile.success'));
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error(t('profile.error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return null;
    
    try {
      // Créer une référence unique pour la photo
      const storageRef = ref(storage, `profile-photos/${currentUser.uid}/${Date.now()}_${photoFile.name}`);
      
      // Upload du fichier
      const snapshot = await uploadBytes(storageRef, photoFile);
      
      // Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(t('profile.uploadError'));
      return null;
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-[#EF1C43] text-white';
      case 'manager':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour au tableau de bord</span>
        </button>

        {/* Header */}
        <h1 className="text-3xl font-bold text-black mb-8">{t('profile.title')}</h1>

        {/* Section 1: Photo et infos principales */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-6">{t('profile.personalInfo')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Photo de profil */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full cursor-pointer hover:bg-gray-800 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">{t('profile.changePhoto')}</p>
            </div>

            {/* Informations */}
            <div className="md:col-span-2 space-y-4">
              {/* Prénom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.firstName')}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Jean"
                />
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.lastName')}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Dupont"
                />
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  {t('profile.email')}
                </label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Rôle (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="inline w-4 h-4 mr-2" />
                  {t('profile.role')}
                </label>
                <span className={`inline-block px-4 py-2 rounded-lg font-medium capitalize ${getRoleBadgeColor(userData?.role)}`}>
                  {userData?.role || 'user'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Préférences */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">
            <Globe className="inline w-5 h-5 mr-2" />
            {t('profile.preferences')}
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.language')}
            </label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                i18n.changeLanguage(e.target.value);
              }}
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="de">🇩🇪 Deutsch</option>
            </select>
          </div>
        </div>

        {/* Section 3: Mon Entreprise */}
        {userData?.companyId && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4">
              <Briefcase className="inline w-5 h-5 mr-2" />
              {t('profile.company')}
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">{t('profile.companyName')}</p>
              <p className="text-lg font-semibold text-black">
                {companyData?.name || 'Non disponible'}
              </p>
              {companyData?.description && (
                <p className="text-sm text-gray-600 mt-2">{companyData.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Mon Équipe */}
        {userData?.companyId && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">
                <Users className="inline w-5 h-5 mr-2" />
                {t('profile.team')} ({teamMembers.length + 1} {t('profile.teamMembers')})
              </h2>
              {userData?.role === 'admin' && (
                <button 
                  onClick={() => toast.info('Fonctionnalité à venir')}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  {t('profile.inviteUser')}
                </button>
              )}
            </div>
            
            {/* Liste des membres */}
            <div className="space-y-3">
              {/* Current User */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-black">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                    {firstName?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-black">
                      {firstName && lastName ? `${firstName} ${lastName}` : currentUser?.displayName || 'Vous'}
                      <span className="text-sm text-gray-500 ml-2">(Vous)</span>
                    </p>
                    <p className="text-sm text-gray-600">{currentUser?.email}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(userData?.role)}`}>
                  {userData?.role || 'user'}
                </span>
              </div>

              {/* Team Members */}
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center font-semibold">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.displayName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        member.firstName?.charAt(0)?.toUpperCase() || member.email?.charAt(0)?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-black">
                        {member.firstName && member.lastName 
                          ? `${member.firstName} ${member.lastName}` 
                          : member.displayName || 'Utilisateur'}
                      </p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(member.role)}`}>
                    {member.role || 'user'}
                  </span>
                </div>
              ))}
            </div>

            {teamMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Vous êtes le seul membre de votre équipe pour le moment</p>
              </div>
            )}
          </div>
        )}

        {/* Bouton Sauvegarder */}
        <div className="flex justify-end">
          <button 
            onClick={handleSaveChanges}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? t('profile.saving') : t('profile.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
}

