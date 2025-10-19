import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      profile: {
        title: 'Mon Profil',
        personalInfo: 'Informations personnelles',
        preferences: 'Préférences',
        company: 'Mon Entreprise',
        team: 'Mon Équipe',
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Email',
        role: 'Rôle',
        language: 'Langue',
        photo: 'Photo de profil',
        changePhoto: 'Changer la photo',
        companyName: 'Nom de l\'entreprise',
        teamMembers: 'membres',
        inviteUser: 'Inviter un utilisateur',
        saveChanges: 'Sauvegarder les modifications',
        saving: 'Enregistrement...',
        success: 'Modifications enregistrées avec succès',
        error: 'Erreur lors de l\'enregistrement',
        uploadError: 'Erreur lors du téléchargement de la photo'
      }
    }
  },
  en: {
    translation: {
      profile: {
        title: 'My Profile',
        personalInfo: 'Personal Information',
        preferences: 'Preferences',
        company: 'My Company',
        team: 'My Team',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        role: 'Role',
        language: 'Language',
        photo: 'Profile Photo',
        changePhoto: 'Change Photo',
        companyName: 'Company Name',
        teamMembers: 'members',
        inviteUser: 'Invite User',
        saveChanges: 'Save Changes',
        saving: 'Saving...',
        success: 'Changes saved successfully',
        error: 'Error saving changes',
        uploadError: 'Error uploading photo'
      }
    }
  },
  es: {
    translation: {
      profile: {
        title: 'Mi Perfil',
        personalInfo: 'Información Personal',
        preferences: 'Preferencias',
        company: 'Mi Empresa',
        team: 'Mi Equipo',
        firstName: 'Nombre',
        lastName: 'Apellido',
        email: 'Correo',
        role: 'Rol',
        language: 'Idioma',
        photo: 'Foto de Perfil',
        changePhoto: 'Cambiar Foto',
        companyName: 'Nombre de la Empresa',
        teamMembers: 'miembros',
        inviteUser: 'Invitar Usuario',
        saveChanges: 'Guardar Cambios',
        saving: 'Guardando...',
        success: 'Cambios guardados exitosamente',
        error: 'Error al guardar cambios',
        uploadError: 'Error al subir la foto'
      }
    }
  },
  de: {
    translation: {
      profile: {
        title: 'Mein Profil',
        personalInfo: 'Persönliche Informationen',
        preferences: 'Einstellungen',
        company: 'Meine Firma',
        team: 'Mein Team',
        firstName: 'Vorname',
        lastName: 'Nachname',
        email: 'E-Mail',
        role: 'Rolle',
        language: 'Sprache',
        photo: 'Profilbild',
        changePhoto: 'Foto Ändern',
        companyName: 'Firmenname',
        teamMembers: 'Mitglieder',
        inviteUser: 'Benutzer Einladen',
        saveChanges: 'Änderungen Speichern',
        saving: 'Speichern...',
        success: 'Änderungen erfolgreich gespeichert',
        error: 'Fehler beim Speichern',
        uploadError: 'Fehler beim Hochladen des Fotos'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

