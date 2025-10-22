import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { 
  User, Camera, Mail, Globe, Briefcase, Users, Save, ArrowLeft, 
  Crown, Edit3, UserPlus, X
} from 'lucide-react';

// Fonction pour s'assurer que l'utilisateur a un companyId
const ensureUserHasCompany = async (currentUser) => {
  if (!currentUser) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.companyId) {
        return userData.companyId;
      }
    }

    // Si pas de companyId, créer une entreprise par défaut
    const companyData = {
      name: 'Mon Entreprise',
      description: 'Description de votre entreprise',
      createdAt: new Date(),
      ownerId: currentUser.uid,
      members: [currentUser.uid]
    };

    const companyRef = await addDoc(collection(db, 'companies'), companyData);
    
    // Mettre à jour l'utilisateur avec le companyId
    await updateDoc(doc(db, 'users', currentUser.uid), {
      companyId: companyRef.id
    });

    return companyRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de l\'entreprise:', error);
    return null;
  }
};

const UserProfile = () => {
  const { currentUser, userData: authUserData } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // States
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upgradingToAdmin, setUpgradingToAdmin] = useState(false);
  
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
    language: 'fr'
  });
  
  // Invitation modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user'
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  // Charger les données utilisateur
  useEffect(() => {
    const initializeUser = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          
          // S'assurer que l'utilisateur a un companyId
          const companyId = await ensureUserHasCompany(currentUser);
          
          // Charger les données utilisateur
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const user = userDoc.data();
            setUserData(user);
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setLanguage(user.language || 'fr');
            setPhotoPreview(user.profilePhoto || null);
            
            // Sauvegarder les valeurs originales
            setOriginalValues({
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              language: user.language || 'fr'
            });
          }

          // Charger les données de l'entreprise
          if (companyId) {
            const companyDoc = await getDoc(doc(db, 'companies', companyId));
            if (companyDoc.exists()) {
              setCompanyData(companyDoc.data());
            }

            // Charger les membres de l'équipe
            const membersQuery = query(
              collection(db, 'users'),
              where('companyId', '==', companyId)
            );
            const membersSnapshot = await getDocs(membersQuery);
            const members = membersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setTeamMembers(members);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des données:', error);
          toast.error('Erreur lors du chargement des données');
        } finally {
          setLoading(false);
        }
      }
    };

    initializeUser();
  }, [currentUser]);

  // Fonctions utilitaires
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="w-3 h-3" />;
      case 'manager': return <Briefcase className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  // Fonction pour détecter les changements
  const hasChanges = () => {
    return (
      firstName !== originalValues.firstName ||
      lastName !== originalValues.lastName ||
      language !== originalValues.language ||
      photoFile !== null
    );
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Gestion de la photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile || !currentUser) return;

    try {
      const storage = getStorage();
      const photoRef = ref(storage, `profile-photos/${currentUser.uid}`);
      await uploadBytes(photoRef, photoFile);
      const downloadURL = await getDownloadURL(photoRef);
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        profilePhoto: downloadURL
      });
      
      setUserData(prev => ({ ...prev, profilePhoto: downloadURL }));
      toast.success('Photo de profil mise à jour');
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast.error('Erreur lors de l\'upload de la photo');
    }
  };

  // Sauvegarde des données
  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      
      const updateData = {
        firstName,
        lastName,
        language
      };

      await updateDoc(doc(db, 'users', currentUser.uid), updateData);
      
      setUserData(prev => ({ ...prev, ...updateData }));
      
      // Mettre à jour les valeurs originales
      setOriginalValues({
        firstName,
        lastName,
        language
      });
      
      // Réinitialiser le fichier photo
      setPhotoFile(null);
      
      // Changer la langue si nécessaire
      if (language !== i18n.language) {
        i18n.changeLanguage(language);
      }
      
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Gestion de l'invitation
  const handleSendInvite = async () => {
    if (!userData?.companyId || !inviteForm.email) return;

    try {
      setSendingInvite(true);
      
      const invitationData = {
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        email: inviteForm.email,
        role: inviteForm.role,
        companyId: userData.companyId,
        invitedBy: currentUser.uid,
        invitedByName: `${userData.firstName} ${userData.lastName}`,
        companyName: companyData?.name || 'Mon Entreprise',
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
      };

      await addDoc(collection(db, 'invitations'), invitationData);
      
      // Réinitialiser le formulaire
      setInviteForm({
        firstName: '',
        lastName: '',
        email: '',
        role: 'user'
      });
      
      setShowInviteModal(false);
      toast.success('Invitation envoyée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', error);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header simplifié */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-[#191919]">
            Mon Profil
          </h1>
          <p className="text-[#666663] mt-1">Gérez vos informations personnelles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale - Informations personnelles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carte Photo et Informations principales */}
            <div className="bg-white rounded-lg shadow-lg border border-[#E5E4DF] overflow-hidden">
              <div className="bg-black p-6">
                <div className="flex items-start justify-between gap-6">
                  {/* Section gauche - Photo et infos utilisateur */}
                  <div className="flex items-center gap-6">
                    {/* Photo de profil */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shadow-lg border-2 border-white">
                        {photoPreview ? (
                          <img 
                            src={photoPreview} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <User className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <Camera className="w-3 h-3 text-gray-600" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Informations utilisateur */}
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {firstName} {lastName}
                      </h2>
                      <p className="text-gray-300 mb-3">{currentUser?.email}</p>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadgeColor(userData?.role)}`}>
                        {getRoleIcon(userData?.role)}
                        {userData?.role || 'user'}
                      </span>
                    </div>
                  </div>

                  {/* Section droite - Informations de l'entreprise */}
                  {companyData && (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Briefcase className="w-4 h-4 text-gray-300" />
                        <span className="text-sm font-medium text-gray-300">
                          {companyData.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Carte Informations personnelles */}
            <div className="bg-white rounded-lg shadow-lg border border-[#E5E4DF] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#191919] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-black" />
                  Informations personnelles
                </h3>
                {hasChanges() && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Sauvegarder
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#666663] mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                    placeholder="Votre prénom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#666663] mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#666663] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#666663] mb-2">
                    Langue préférée
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                  >
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="de">🇩🇪 Deutsch</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Colonne latérale - Équipe */}
          <div className="space-y-6">
            {/* Carte Équipe */}
            <div className="bg-white rounded-lg shadow-lg border border-[#E5E4DF] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#191919] flex items-center gap-2">
                    <Users className="w-4 h-4 text-black" />
                    Équipe
                  </h3>
                  <span className="bg-[#FAFAF7] text-[#666663] px-3 py-1 rounded-lg text-sm font-semibold border border-[#E5E4DF]">
                    {teamMembers.length + 1}
                  </span>
                </div>
                
                {/* Bouton Inviter - Affiché uniquement si admin */}
                {userData?.role === 'admin' && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-medium"
                  >
                    <UserPlus className="w-4 h-4" />
                    Inviter
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Vous */}
                <div className="flex items-center gap-4 p-4 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                    {userData?.profilePhoto ? (
                      <img 
                        src={userData.profilePhoto} 
                        alt="You" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#191919]">Vous</p>
                    <p className="text-sm text-[#666663]">{currentUser?.email}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(userData?.role)}`}>
                    {getRoleIcon(userData?.role)}
                    {userData?.role || 'user'}
                  </span>
                </div>

                {/* Autres membres */}
                {teamMembers.filter(member => member.id !== currentUser?.uid).map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-[#E5E4DF]">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                      {member.profilePhoto ? (
                        <img 
                          src={member.profilePhoto} 
                          alt={member.firstName} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#191919]">{member.firstName} {member.lastName}</p>
                      <p className="text-sm text-[#666663]">{member.email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                      {member.role || 'user'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal d'invitation */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#E5E4DF]">
                <h3 className="text-xl font-bold text-[#191919] flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Inviter un collaborateur
                </h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-[#666663] hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#666663] mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#666663] mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#666663] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#666663] mb-2">
                    Rôle
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E5E4DF]">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-[#666663] hover:text-black transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={sendingInvite}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                >
                  {sendingInvite ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Envoyer l'invitation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;