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
    console.log('🔍 Vérification du companyId pour:', currentUser.email);
    
    // Charger l'utilisateur depuis Firestore
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('❌ Utilisateur non trouvé dans Firestore');
      
      // Créer l'utilisateur dans Firestore
      const newCompanyRef = await addDoc(collection(db, 'companies'), {
        name: currentUser.displayName + ' Company' || 'My Company',
        defaultLanguage: 'fr',
        createdAt: new Date(),
        industry: null,
        logo: null
      });
      
      await setDoc(userRef, {
        email: currentUser.email,
        firstName: currentUser.displayName?.split(' ')[0] || 'Prénom',
        lastName: currentUser.displayName?.split(' ')[1] || 'Nom',
        companyId: newCompanyRef.id,
        role: 'admin',
        profilePhoto: currentUser.photoURL || null,
        preferredLanguage: 'fr',
        emailVerified: currentUser.emailVerified,
        createdAt: new Date()
      });
      
      console.log('✅ Utilisateur et company créés');
      return newCompanyRef.id;
    }

    const userData = userSnap.data();
    
    // Vérifier si companyId existe
    if (!userData.companyId) {
      console.log('⚠️ Pas de companyId, création d\'une company...');
      
      // Créer une nouvelle company
      const companyRef = await addDoc(collection(db, 'companies'), {
        name: (userData.firstName || 'User') + ' Company',
        defaultLanguage: userData.preferredLanguage || 'fr',
        createdAt: new Date(),
        industry: null,
        logo: null
      });
      
      console.log('✅ Company créée:', companyRef.id);
      
      // Ajouter le companyId à l'utilisateur
      await setDoc(userRef, { companyId: companyRef.id }, { merge: true });
      
      console.log('✅ companyId ajouté à l\'utilisateur');
      return companyRef.id;
    } else {
      console.log('✅ companyId existe déjà:', userData.companyId);
      return userData.companyId;
    }
  } catch (error) {
    console.error('❌ Erreur ensureUserHasCompany:', error);
    return null;
  }
};

export default function UserProfile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const storage = getStorage();
  
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
        // S'assurer que l'utilisateur a un companyId
        await ensureUserHasCompany(currentUser);
        
        // Puis charger les données
        await loadUserData();
      }
    };
    
    initializeUser();
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) return;
    
    try {
      // Charger les données utilisateur
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const user = { id: userSnap.id, ...userSnap.data() };
        setUserData(user);
        
        // Initialiser les champs du formulaire
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setLanguage(user.preferredLanguage || 'fr');
        setPhotoPreview(user.profilePhoto);
        
        // Charger les données de l'entreprise si companyId existe
        if (user.companyId) {
          const companyRef = doc(db, 'companies', user.companyId);
          const companySnap = await getDoc(companyRef);
          
          if (companySnap.exists()) {
            setCompanyData({ id: companySnap.id, ...companySnap.data() });
          }
          
          // Charger les membres de l'équipe
          await loadTeamMembers(user.companyId);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (companyId) => {
    try {
      const teamQuery = query(
        collection(db, 'users'),
        where('companyId', '==', companyId)
      );
      
      const teamSnapshot = await getDocs(teamQuery);
      const members = teamSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !userData) return;
    
    setSaving(true);
    try {
      const updates = {};
      
      if (firstName !== userData.firstName) updates.firstName = firstName;
      if (lastName !== userData.lastName) updates.lastName = lastName;
      if (language !== userData.preferredLanguage) updates.preferredLanguage = language;
      
      // Upload de la photo si une nouvelle photo a été sélectionnée
      if (photoFile) {
        const photoURL = await handlePhotoUpload();
        if (photoURL) {
          updates.profilePhoto = photoURL;
        }
      }
      
      // Mettre à jour les données dans Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, updates);
      
      // Mettre à jour la langue de l'application
      i18n.changeLanguage(language);
      
      // Réinitialiser le fichier photo après sauvegarde
      setPhotoFile(null);
      
      // Recharger les données
      await loadUserData();
      
      toast.success('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Erreur lors de la sauvegarde du profil');
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
      toast.error('Erreur lors de l\'upload de la photo');
      return null;
    }
  };

  // Fonction pour envoyer une invitation
  const handleSendInvite = async () => {
    if (!inviteForm.firstName || !inviteForm.lastName || !inviteForm.email) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!userData?.companyId) {
      toast.error('Erreur: Pas de companyId');
      return;
    }

    setSendingInvite(true);
    try {
      // Créer l'invitation dans Firestore
      await addDoc(collection(db, 'invitations'), {
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        email: inviteForm.email,
        role: inviteForm.role,
        companyId: userData.companyId,
        invitedBy: currentUser.uid,
        invitedByName: `${userData.firstName} ${userData.lastName}`,
        companyName: companyData?.name || 'StockEasy',
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
      });

      toast.success(`Invitation envoyée à ${inviteForm.email} !`);
      
      // Réinitialiser le formulaire
      setInviteForm({
        firstName: '',
        lastName: '',
        email: '',
        role: 'user'
      });
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  // Vérifier si des modifications ont été faites
  const hasChanges = () => {
    if (!userData) return false;
    
    return (
      firstName !== userData.firstName ||
      lastName !== userData.lastName ||
      language !== userData.preferredLanguage ||
      photoFile !== null
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-[#EF1C43] text-white';
      case 'manager':
        return 'bg-[#666663] text-white';
      default:
        return 'bg-[#666663] text-white';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'manager':
        return <Award className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  // Fonction pour devenir admin
  const handleUpgradeToAdmin = async () => {
    if (!currentUser || !userData) return;
    
    setUpgradingToAdmin(true);
    try {
      const userRef = doc(db, 'users', userData.id);
      await updateDoc(userRef, {
        role: 'admin',
        updatedAt: new Date().toISOString()
      });
      
      // Mettre à jour le state local
      setUserData(prev => ({ ...prev, role: 'admin' }));
      toast.success('🎉 Vous êtes maintenant administrateur !');
    } catch (error) {
      console.error('Erreur upgrade admin:', error);
      toast.error('Erreur lors de l\'attribution du rôle admin');
    } finally {
      setUpgradingToAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#666663] font-medium">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header avec navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 px-4 py-2 bg-white text-[#666663] hover:text-[#191919] hover:bg-gray-50 transition-all duration-200 rounded-lg shadow-sm border border-[#E5E4DF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour au tableau de bord</span>
            </button>
            
            <div className="text-right">
              <h1 className="text-3xl lg:text-4xl font-bold text-[#191919]">
                Mon Profil
              </h1>
              <p className="text-[#666663] mt-1">Gérez vos informations personnelles</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne principale - Informations personnelles */}
            <div className="lg:col-span-2 space-y-6">
              {/* Carte Photo et Informations principales */}
              <div className="bg-white rounded-lg shadow-lg border border-[#E5E4DF] overflow-hidden">
                <div className="bg-black p-6">
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
                    <div className="flex-1 text-white">
                      <h2 className="text-xl font-bold mb-1">
                        {userData?.firstName} {userData?.lastName}
                      </h2>
                      <p className="text-gray-300 mb-3">{currentUser?.email}</p>
                      
                      {/* Badge de rôle */}
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm ${getRoleBadgeColor(userData?.role)}`}>
                          {getRoleIcon(userData?.role)}
                          {userData?.role || 'user'}
                        </span>
                        
                        {userData?.role !== 'admin' && (
                          <button
                            onClick={handleUpgradeToAdmin}
                            disabled={upgradingToAdmin}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium border border-white/30"
                          >
                            <Crown className="w-4 h-4" />
                            {upgradingToAdmin ? 'Mise à jour...' : 'Devenir Admin'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulaire d'édition */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-[#191919] mb-6 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-black" />
                    Informations personnelles
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Prénom */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#666663]">
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

                    {/* Nom */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#666663]">
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

                    {/* Email (readonly) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#666663]">
                        <Mail className="inline w-4 h-4 mr-2" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={currentUser?.email || ''}
                        disabled
                        className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg bg-[#FAFAF7] text-[#666663] cursor-not-allowed"
                      />
                    </div>

                    {/* Langue */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#666663]">
                        <Globe className="inline w-4 h-4 mr-2" />
                        Langue préférée
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>

                  {/* Bouton de sauvegarde - Affiché uniquement si des modifications ont été faites */}
                  {hasChanges() && (
                    <div className="flex justify-end mt-6">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-3 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                      >
                        {saving ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Carte Entreprise */}
              {companyData && (
                <div className="bg-white rounded-lg shadow-lg border border-[#E5E4DF] p-6">
                  <h3 className="text-lg font-bold text-[#191919] mb-6 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-black" />
                    Informations entreprise
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#666663] mb-2">
                        Nom de l'entreprise
                      </label>
                      <p className="text-lg font-medium text-[#191919]">{companyData.name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-[#666663] mb-2">
                        Langue par défaut
                      </label>
                      <p className="text-lg font-medium text-[#191919]">{companyData.defaultLanguage?.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              )}
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
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                      {userData?.profilePhoto ? (
                        <img 
                          src={userData.profilePhoto} 
                          alt="You" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-white" />
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
                  {teamMembers.filter(member => member.id !== userData?.id).map((member) => (
                    <div key={member.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-[#E5E4DF]">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#666663] flex items-center justify-center">
                        {member.profilePhoto ? (
                          <img 
                            src={member.profilePhoto} 
                            alt={member.firstName} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#191919]">
                          {member.firstName} {member.lastName}
                        </p>
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
  );
}