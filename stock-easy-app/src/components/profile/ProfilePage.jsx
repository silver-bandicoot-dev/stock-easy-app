import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Camera, Mail, Globe, Users, Save, 
  Crown, UserPlus, X, Upload, Building2, Trash2, RefreshCw,
  Copy, Check, Clock, AlertCircle, Shield, Key
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabaseClient';
import {
  getCurrentUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  getCurrentUserCompany,
  updateCompany,
  getTeamMembers,
  inviteTeamMember,
  getPendingInvitations,
  revokeInvitation,
  removeTeamMember,
  deleteTeamMember
} from '../../services/companyService';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Style d'avatar sobre et cohérent avec l'application
const AVATAR_STYLE = 'from-[#191919] to-[#444444]';

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // States
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('fr');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Company states
  const [companyName, setCompanyName] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  
  // Invitation states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  
  // Confirmation modal states
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDoubleConfirmModal, setShowDoubleConfirmModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  
  // Original values
  const [originalValues, setOriginalValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    language: 'fr',
    photoUrl: null,
    companyName: '',
    companyIndustry: ''
  });

  const [copiedToken, setCopiedToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Charger les données
  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (currentUser) {
      try {
        setLoading(true);
        
        // Charger le profil utilisateur (nécessaire pour connaître le rôle)
        const { data: profileData, error: profileError } = await getCurrentUserProfile();
        
        if (profileError) {
          throw profileError;
        }

        if (profileData) {
          setUserData(profileData);
          setFirstName(profileData.first_name || profileData.firstName || '');
          setLastName(profileData.last_name || profileData.lastName || '');
          setEmail(profileData.email || currentUser?.email || '');
          setLanguage(profileData.language || 'fr');
          setPhotoPreview(profileData.photo_url || profileData.photoUrl);
          
          setOriginalValues(prev => ({
            ...prev,
            firstName: profileData.first_name || profileData.firstName || '',
            lastName: profileData.last_name || profileData.lastName || '',
            email: profileData.email || currentUser?.email || '',
            language: profileData.language || 'fr',
            photoUrl: profileData.photo_url || profileData.photoUrl
          }));
        } else if (currentUser) {
          setEmail(currentUser.email || '');
        }
        
        // Utiliser les données de l'entreprise déjà chargées via la jointure dans getCurrentUserProfile
        // pour éviter un appel supplémentaire
        const company = profileData?.company;
        if (company) {
          setCompanyData(company);
          setCompanyName(company.name || '');
          setCompanyIndustry(company.description || '');
          
          setOriginalValues(prev => ({
            ...prev,
            companyName: company.name || '',
            companyIndustry: company.description || ''
          }));
        } else if (profileData?.company_id) {
          // Si la jointure n'a pas fonctionné, charger l'entreprise séparément
          const { data: companyData, error: companyError } = await getCurrentUserCompany();
          if (!companyError && companyData) {
            setCompanyData(companyData);
            setCompanyName(companyData.name || '');
            setCompanyIndustry(companyData.description || '');
            
            setOriginalValues(prev => ({
              ...prev,
              companyName: companyData.name || '',
              companyIndustry: companyData.description || ''
            }));
          }
        }
        
        // Charger les données en parallèle pour améliorer les performances
        const isAdmin = profileData?.role === 'owner' || profileData?.role === 'admin';
        
        const [membersResult, invitationsResult] = await Promise.allSettled([
          getTeamMembers(),
          isAdmin ? getPendingInvitations() : Promise.resolve({ data: [], error: null })
        ]);
        
        // Traiter les résultats des membres de l'équipe
        if (membersResult.status === 'fulfilled') {
          const { data: members, error: membersError } = membersResult.value;
          if (!membersError) {
            setTeamMembers(Array.isArray(members) ? members : []);
          }
        } else if (membersResult.status === 'rejected') {
          console.error('Erreur lors du chargement des membres:', membersResult.reason);
        }
        
        // Traiter les résultats des invitations (si admin/owner)
        if (invitationsResult.status === 'fulfilled' && isAdmin) {
          const { data: invitations, error: invError } = invitationsResult.value;
          if (!invError) {
            setPendingInvitations(Array.isArray(invitations) ? invitations : []);
          }
        } else if (invitationsResult.status === 'rejected' && isAdmin) {
          console.error('Erreur lors du chargement des invitations:', invitationsResult.reason);
        }
        
      } catch (error) {
        console.error('Erreur chargement données:', error);
        toast.error('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5 Mo');
        return;
      }
      
      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    
    try {
      let photoUrl = userData?.photo_url || userData?.photoUrl;
      const trimmedEmail = email.trim();
      const emailChanged = trimmedEmail !== (originalValues.email || '');
      
      // Upload photo si nécessaire
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          photoUrl = await uploadProfilePhoto(photoFile);
          toast.success('Photo de profil mise à jour !');
        } catch (error) {
          console.error('Erreur upload photo:', error);
          toast.error('Erreur lors de l\'upload de la photo');
        } finally {
          setUploadingPhoto(false);
        }
        setShowPasswordForm(false);
      }
      
      // Mettre à jour l'email si nécessaire
      if (emailChanged) {
        const { data: emailData, error: emailError } = await supabase.auth.updateUser({
          email: trimmedEmail
        });

        if (emailError) {
          console.error('Erreur mise à jour email:', emailError);
          toast.error(emailError.message || 'Erreur lors de la mise à jour de l\'email');
          setEmail(originalValues.email || '');
        } else {
          setEmail(trimmedEmail);
          setOriginalValues(prev => ({
            ...prev,
            email: trimmedEmail
          }));
          toast.success('Adresse email mise à jour. Vérifiez votre boîte mail pour confirmer la nouvelle adresse.');
        }
      }

      // Mettre à jour le profil
      await updateUserProfile({
        first_name: firstName,
        last_name: lastName,
        language,
        photo_url: photoUrl || undefined
      });
      
      // Mettre à jour l'entreprise si modifiée et si owner
      if (userData?.role === 'owner' && companyData) {
        if (companyName !== originalValues.companyName || companyIndustry !== originalValues.companyIndustry) {
          await updateCompany(companyData.id, {
            name: companyName,
            description: companyIndustry || null
          });
        }
      }
      
      setPhotoFile(null);
      await loadData();
      toast.success('Profil mis à jour avec succès !');
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    const trimmedPassword = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirm) {
      toast.error('Veuillez saisir et confirmer le nouveau mot de passe');
      return;
    }

    if (trimmedPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: trimmedPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Mot de passe mis à jour avec succès');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erreur mise à jour mot de passe:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await inviteTeamMember(inviteEmail, inviteRole);
      
      if (error) throw error;
      
      toast.success(`Invitation envoyée à ${inviteEmail} !`, {
        description: 'Le collaborateur recevra un email avec un lien d\'invitation'
      });
      
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      
      await loadData();
    } catch (error) {
      console.error('Erreur invitation:', error);
      toast.error(error.message || 'Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    try {
      await revokeInvitation(invitationId);
      toast.success('Invitation révoquée');
      await loadData();
    } catch (error) {
      console.error('Erreur révocation:', error);
      toast.error('Erreur lors de la révocation');
    }
  };

  const handleRemoveMemberClick = (memberId, memberName) => {
    // Utiliser l'email comme fallback si le nom est vide ou null
    const member = teamMembers.find(m => m.id === memberId);
    const displayName = memberName && memberName.trim() !== '' && !memberName.includes('null')
      ? memberName
      : (member?.email || 'ce membre');
    
    setMemberToDelete({ id: memberId, name: displayName });
    setShowDeleteConfirmModal(true);
  };

  const handleFirstConfirm = () => {
    setShowDeleteConfirmModal(false);
    setShowDoubleConfirmModal(true);
  };

  const handleFinalConfirm = async () => {
    if (!memberToDelete) return;

    const memberName = memberToDelete.name;
    setShowDoubleConfirmModal(false);
    
    console.log('🔍 handleFinalConfirm: Début de la suppression de', memberToDelete.id);
    
    try {
      const { data, error } = await deleteTeamMember(memberToDelete.id);
      
      console.log('🔍 handleFinalConfirm: Résultat de deleteTeamMember:', { data, error });
      
      if (error) {
        // Extraire le message d'erreur de manière sécurisée
        const errorMessage = error?.message || error?.error || error?.toString() || 'Erreur lors de la suppression du membre';
        throw new Error(errorMessage);
      }

      // Fermer la modale et réinitialiser l'état
      setMemberToDelete(null);
      
      // Recharger les données d'abord
      await loadData();
      
      // Utiliser setTimeout avec un délai minimal pour éviter les warnings React
      setTimeout(() => {
        toast.success(`${memberName} a été supprimé définitivement de l'équipe`, {
          description: 'Le compte utilisateur a été supprimé avec succès'
        });
      }, 100);
    } catch (error) {
      console.error('Erreur suppression membre:', error);
      
      // Fermer la modale et réinitialiser l'état
      setMemberToDelete(null);
      
      // Extraire le message d'erreur de manière sécurisée
      const errorMessage = error?.message || error?.error || error?.toString() || 'Erreur lors de la suppression du membre';
      
      // Utiliser setTimeout avec un délai minimal pour éviter les warnings React
      setTimeout(() => {
        toast.error(errorMessage);
      }, 100);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setShowDoubleConfirmModal(false);
    setMemberToDelete(null);
  };

  const copyInvitationLink = (token) => {
    const link = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('Lien copié dans le presse-papier');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const hasChanges = () => {
    return (
      firstName !== originalValues.firstName ||
      lastName !== originalValues.lastName ||
      email.trim() !== (originalValues.email || '') ||
      language !== originalValues.language ||
      photoFile !== null ||
      (userData?.role === 'owner' && (
        companyName !== originalValues.companyName ||
        companyIndustry !== originalValues.companyIndustry
      ))
    );
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) return firstName.charAt(0).toUpperCase();
    return currentUser?.email?.charAt(0).toUpperCase() || '?';
  };

  const ROLE_CONFIG = {
    owner: { label: 'Administrateur', icon: Crown, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    admin: { label: 'Administrateur', icon: Crown, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    member: { label: 'Membre', icon: User, color: 'bg-gray-100 text-gray-700 border-gray-200' }
  };

  const getRoleBadge = (role, size = 'default') => {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.member;
    const Icon = config.icon;
    const sizeClasses = size === 'compact'
      ? 'px-2 py-0.5 text-xs'
      : 'px-3 py-1 text-sm';

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.color} ${sizeClasses}`}>
        <Icon className={size === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-[#191919] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-[#191919]">Chargement...</p>
        </motion.div>
      </div>
    );
  }

  const isAdmin = userData?.role === 'owner' || userData?.role === 'admin';

  return (
    <motion.div 
      className="max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header de page - Style cohérent avec Settings */}
      <motion.div variants={cardVariants} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#191919]">Mon Profil</h1>
            <p className="text-sm text-[#6B7177] mt-0.5">
              Gérez vos informations personnelles, votre entreprise et votre équipe
            </p>
          </div>
          
          {/* Bouton sauvegarder - Style cohérent avec l'app */}
          <AnimatePresence>
            {hasChanges() && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                onClick={handleSaveProfile}
                disabled={saving || uploadingPhoto}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#191919] text-white font-medium hover:bg-[#2A2A2A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhoto ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{uploadingPhoto ? 'Upload...' : saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profil Personnel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Carte Profil */}
          <motion.div 
            variants={cardVariants}
            className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-5 md:p-6"
          >
            <h2 className="text-lg font-semibold text-[#191919] mb-5">Informations personnelles</h2>
            
            {/* Photo et infos principales */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6 pb-6 border-b border-[#E5E4DF]">
              <div className="relative group">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-[#FAFAF7]"
                  />
                ) : (
                  <div className={`w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br ${AVATAR_STYLE} rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold ring-4 ring-[#FAFAF7]`}>
                    {getInitials()}
                  </div>
                )}
                
                <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-[#FAFAF7] transition-colors border border-[#E5E4DF]">
                  <Camera className="w-4 h-4 text-[#191919]" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-[#191919] mb-1">
                  {firstName && lastName ? `${firstName} ${lastName}` : 'Votre nom'}
                </h3>
                <p className="text-[#666663] flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4" />
                  {email || currentUser?.email}
                </p>
                {userData?.role && getRoleBadge(userData.role)}
              </div>
            </div>

              {/* Formulaire */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#191919] mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#191919]/10 focus:border-[#191919] bg-white transition-all"
                      placeholder="Votre prénom"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#191919] mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#191919]/10 focus:border-[#191919] bg-white transition-all"
                      placeholder="Votre nom"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#191919] mb-2">
                      Adresse email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#191919]/10 focus:border-[#191919] bg-white transition-all"
                      placeholder="email@exemple.com"
                      required
                    />
                    <p className="text-xs text-[#666663] mt-2">
                      Toute modification nécessitera une confirmation par email.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#191919] mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#666663]" />
                      Langue de l'interface
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#191919]/10 focus:border-[#191919] bg-white transition-all"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Carte Sécurité - Mot de passe */}
            <motion.div 
              variants={cardVariants}
              className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-5 md:p-6"
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#191919]">Sécurité</h2>
                  <p className="text-sm text-[#666663]">Gérez votre mot de passe</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(prev => !prev)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    showPasswordForm 
                      ? 'bg-[#191919] text-white' 
                      : 'bg-white text-[#191919] border border-[#E5E4DF] hover:bg-[#FAFAF7]'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  {showPasswordForm ? 'Annuler' : 'Modifier'}
                </button>
              </div>
              
              <AnimatePresence>
                {showPasswordForm ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#191919] mb-2">
                          Nouveau mot de passe
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#191919]/10 focus:border-[#191919] bg-white transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#191919] mb-2">
                          Confirmer le mot de passe
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#191919]/10 focus:border-[#191919] bg-white transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    
                    {/* Password strength indicator */}
                    {newPassword && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#E5E4DF] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              newPassword.length >= 12 ? 'w-full bg-green-500' :
                              newPassword.length >= 8 ? 'w-2/3 bg-yellow-500' :
                              'w-1/3 bg-red-500'
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          newPassword.length >= 12 ? 'text-green-600' :
                          newPassword.length >= 8 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {newPassword.length >= 12 ? 'Fort' : newPassword.length >= 8 ? 'Moyen' : 'Faible'}
                        </span>
                      </div>
                    )}
                    
                    <button
                      onClick={handleUpdatePassword}
                      disabled={
                        updatingPassword ||
                        !newPassword.trim() ||
                        newPassword.trim().length < 8 ||
                        newPassword.trim() !== confirmPassword.trim()
                      }
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#191919] text-white font-medium hover:bg-[#2A2A2A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingPassword ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Mettre à jour le mot de passe
                        </>
                      )}
                    </button>
                    <p className="text-xs text-[#666663]">
                      Utilisez au moins 8 caractères. Après modification, vous devrez vous reconnecter sur vos autres appareils.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 bg-[#FAFAF7] rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#191919]">Mot de passe actif</p>
                      <p className="text-xs text-[#666663]">Votre mot de passe est sécurisé</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>

            {/* Carte Entreprise */}
            {companyData && (
              <motion.div 
                variants={cardVariants}
                className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-5 md:p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-[#191919] flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Mon entreprise
                    </h2>
                    <p className="text-sm text-[#666663]">Informations partagées avec votre équipe</p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAFAF7] border border-[#E5E4DF] text-sm text-[#191919]">
                    <Users className="w-4 h-4" />
                    {teamMembers.length} {teamMembers.length > 1 ? 'collaborateurs' : 'collaborateur'}
                  </div>
                </div>

                {userData?.role === 'owner' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#191919] mb-2">
                        Nom de l'entreprise *
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#191919]/10 focus:border-[#191919] bg-white transition-all"
                        placeholder="Nom de votre entreprise"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#191919] mb-2">
                        Secteur d'activité
                      </label>
                      <input
                        type="text"
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#191919]/10 focus:border-[#191919] bg-white transition-all"
                        placeholder="Ex: E-commerce, Distribution, etc."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-[#E5E4DF] rounded-lg bg-[#FAFAF7]">
                      <p className="text-xs font-medium text-[#666663] uppercase tracking-wide">
                        Nom de l'entreprise
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#191919]">
                        {companyData.name || 'Non renseigné'}
                      </p>
                    </div>
                    <div className="p-4 border border-[#E5E4DF] rounded-lg bg-[#FAFAF7]">
                      <p className="text-xs font-medium text-[#666663] uppercase tracking-wide">
                        Secteur d'activité
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#191919]">
                        {companyData.description || 'Non renseigné'}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Colonne droite - Équipe et Invitations */}
          <div className="space-y-5">
            <motion.div 
              variants={cardVariants}
              className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base md:text-lg font-semibold text-[#191919] flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Équipe
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#666663]">{teamMembers.length} {teamMembers.length > 1 ? 'membres' : 'membre'}</span>
                  {isAdmin && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="p-2 hover:bg-[#FAFAF7] rounded-lg transition-colors"
                      title="Inviter un membre"
                    >
                      <UserPlus className="w-4 h-4 text-[#191919]" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-[#666663] text-center py-4">
                    Aucun membre d'équipe
                  </p>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-[#FAFAF7] rounded-lg hover:bg-[#E5E4DF] transition-colors">
                      <div className="relative">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.firstName}
                            className="w-10 h-10 rounded-full object-cover border border-[#E5E4DF]"
                          />
                        ) : (
                          <div className={`w-10 h-10 bg-gradient-to-br ${AVATAR_STYLE} rounded-full flex items-center justify-center text-white text-sm font-bold border border-[#E5E4DF]`}>
                            {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-[#191919] truncate">
                            {member.firstName} {member.lastName}
                          </p>
                          {getRoleBadge(member.role, 'compact')}
                        </div>
                        <p className="text-xs text-[#666663] truncate">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && member.role !== 'owner' && member.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              const displayName = (member.firstName && member.lastName)
                                ? `${member.firstName} ${member.lastName}`
                                : (member.firstName || member.lastName || member.email || 'ce membre');
                              handleRemoveMemberClick(member.id, displayName);
                            }}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors group"
                            title="Supprimer définitivement ce membre"
                          >
                            <X className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Invitations en attente (admin/owner uniquement) */}
            {isAdmin && pendingInvitations.length > 0 && (
              <motion.div 
                variants={cardVariants}
                className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-5"
              >
                <h3 className="text-base md:text-lg font-semibold text-[#191919] mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Invitations en attente
                </h3>
                
                <div className="space-y-3">
                  {pendingInvitations.map((inv) => (
                    <div key={inv.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#191919] truncate">{inv.email}</p>
                            {getRoleBadge(inv.role, 'compact')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors shrink-0"
                          title="Révoquer"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                      <button
                        onClick={() => copyInvitationLink(inv.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 rounded text-xs font-medium transition-colors"
                      >
                        {copiedToken === inv.id ? (
                          <>
                            <Check className="w-3 h-3 text-green-600" />
                            Copié !
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copier le lien
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Modal d'invitation */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#191919]">Inviter un collaborateur</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-[#FAFAF7] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#191919] mb-2">
                  Adresse email *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#191919]"
                  placeholder="email@exemple.com"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#191919] mb-2">
                  Rôle
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#191919] bg-white"
                >
                  <option value="member">Membre</option>
                  <option value="admin">Administrateur</option>
                </select>
                <p className="text-xs text-[#666663] mt-2">
                  {inviteRole === 'admin' 
                    ? 'Les administrateurs peuvent gérer l\'équipe et inviter d\'autres membres.'
                    : 'Les membres peuvent consulter et modifier les données de l\'entreprise.'
                  }
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-3 border border-[#E5E4DF] rounded-lg font-medium hover:bg-[#FAFAF7] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex-1 px-4 py-3 bg-[#191919] text-white rounded-lg font-medium hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {inviting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Envoyer l'invitation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression - Première étape */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={handleCancelDelete}
        title="⚠️ Confirmation de suppression"
        size="medium"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancelDelete}
              className="px-4 py-2 border border-[#E5E4DF] rounded-lg font-medium hover:bg-[#FAFAF7] transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleFirstConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Continuer
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-[#191919] mb-2">
                Vous êtes sur le point de supprimer définitivement le compte de <span className="text-red-600">{memberToDelete?.name}</span>
              </p>
              <p className="text-sm text-[#666663] mb-4">
                Cette action est <strong>irréversible</strong> et supprimera :
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-[#666663] mb-4">
                <li>Le profil utilisateur</li>
                <li>Toutes les données associées</li>
                <li>L'accès à l'application</li>
              </ul>
              <p className="text-sm font-medium text-[#191919]">
                Êtes-vous absolument sûr de vouloir continuer ?
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modale de confirmation de suppression - Deuxième étape (double confirmation) */}
      <Modal
        isOpen={showDoubleConfirmModal}
        onClose={handleCancelDelete}
        title="🔴 Dernière confirmation"
        size="small"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancelDelete}
              className="px-4 py-2 border border-[#E5E4DF] rounded-lg font-medium hover:bg-[#FAFAF7] transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleFinalConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer définitivement
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-[#191919] mb-2">
                Dernière confirmation
              </p>
              <p className="text-sm text-[#666663]">
                Vous êtes sur le point de supprimer définitivement <span className="font-semibold text-red-600">{memberToDelete?.name}</span>.
              </p>
              <p className="text-sm font-medium text-red-600 mt-3">
                Cette action ne peut pas être annulée.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default ProfilePage;

