# Composant UserProfile

## 📋 Vue d'ensemble

Le composant `UserProfile` est une page de profil utilisateur complète et moderne qui permet aux utilisateurs de gérer leurs informations personnelles, leurs préférences et de visualiser leur équipe.

## ✨ Fonctionnalités

### 1. 👤 Informations personnelles
- **Photo de profil** : Upload et preview en temps réel
- **Prénom & Nom** : Champs éditables
- **Email** : Affichage en lecture seule
- **Rôle** : Badge coloré selon le rôle (admin/manager/user)

### 2. 🌍 Préférences
- **Sélecteur de langue** : 4 langues disponibles
  - 🇫🇷 Français
  - 🇬🇧 English
  - 🇪🇸 Español
  - 🇩🇪 Deutsch
- La langue change immédiatement dans l'interface

### 3. 🏢 Mon Entreprise
- Affichage du nom de l'entreprise
- Description de l'entreprise
- Visible uniquement si l'utilisateur appartient à une entreprise

### 4. 👥 Mon Équipe
- Liste de tous les membres de l'équipe
- Affichage de la photo de profil, nom et rôle de chaque membre
- Badge "Vous" pour identifier l'utilisateur actuel
- Compteur du nombre de membres
- Bouton "Inviter un utilisateur" (visible pour les admins seulement)

### 5. 💾 Sauvegarde
- Bouton "Sauvegarder les modifications"
- Indicateur de chargement pendant la sauvegarde
- Messages toast de confirmation/erreur

## 🎨 Design

### Palette de couleurs
- **Principal** : Noir (#000000)
- **Fond** : Beige clair (#FAFAF7)
- **Cartes** : Blanc (#FFFFFF)
- **Texte** : Noir (#191919) et gris
- **Admin** : Rouge (#EF1C43)
- **Manager** : Bleu (#3B82F6)
- **User** : Gris (#6B7280)

### Composants UI
- Cards avec ombre (shadow-lg)
- Boutons avec hover effects
- Input avec focus ring
- Badges colorés selon le rôle
- Upload photo avec icône caméra
- Responsive design (mobile-first)

## 🔧 Utilisation

### Import
```jsx
import UserProfile from './components/profile/UserProfile';
```

### Intégration dans les routes
```jsx
<Route 
  path="/profile" 
  element={
    <ProtectedRoute>
      <UserProfile />
    </ProtectedRoute>
  } 
/>
```

## 📊 Structure des données

### userData (Firestore `users` collection)
```javascript
{
  firstName: string,
  lastName: string,
  displayName: string,
  email: string,
  photoURL: string | null,
  language: 'fr' | 'en' | 'es' | 'de',
  role: 'user' | 'manager' | 'admin',
  companyId: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### companyData (Firestore `companies` collection)
```javascript
{
  name: string,
  description: string,
  logo: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔐 Sécurité

### Permissions
- ✅ Chaque utilisateur peut modifier **uniquement** son propre profil
- ✅ Les admins peuvent voir le bouton "Inviter un utilisateur"
- ✅ Les emails sont en lecture seule (pas modifiables)
- ✅ Les rôles sont en lecture seule (pas modifiables par l'utilisateur)

### Validation
- Les photos sont uploadées dans Firebase Storage avec le UID de l'utilisateur
- Les données sont validées côté client avant l'envoi
- Firestore Rules protègent les données côté serveur

## 🌐 Internationalisation (i18n)

### Langues supportées
- Français (fr) - par défaut
- Anglais (en)
- Espagnol (es)
- Allemand (de)

### Changer de langue
```javascript
i18n.changeLanguage('en'); // Change vers l'anglais
```

### Ajouter une nouvelle traduction
Éditez le fichier `src/config/i18n.js` :
```javascript
const resources = {
  fr: { translation: { profile: { ... } } },
  en: { translation: { profile: { ... } } },
  // Ajoutez ici votre nouvelle langue
  it: { 
    translation: { 
      profile: {
        title: 'Il Mio Profilo',
        // ... autres traductions
      } 
    } 
  }
};
```

## 📸 Upload de photo

### Format accepté
- Images uniquement (image/*)
- Stockage dans Firebase Storage
- Path : `profile-photos/{userId}/{timestamp}_{filename}`

### Preview
- Preview instantanée avant sauvegarde
- Utilise FileReader API pour la preview locale

## 🔄 Flux de données

### Chargement initial
1. Récupération des données utilisateur depuis Firestore
2. Si `companyId` existe, chargement des données entreprise
3. Chargement des membres de l'équipe (même `companyId`)
4. Mise à jour des states et affichage

### Sauvegarde
1. Validation des champs
2. Upload de la photo (si nouvelle photo)
3. Mise à jour du document Firestore
4. Changement de langue dans l'app
5. Rechargement des données
6. Affichage du toast de confirmation

## 🎯 Points d'amélioration futurs

- [ ] Crop/resize automatique des photos
- [ ] Changement de mot de passe
- [ ] Vérification email
- [ ] 2FA (Two-Factor Authentication)
- [ ] Historique des modifications
- [ ] Export des données (RGPD)
- [ ] Suppression de compte
- [ ] Notifications par email
- [ ] Intégration calendrier pour timezone

## 🐛 Debug

### Problèmes courants

#### Photo ne s'upload pas
- Vérifier que Firebase Storage est activé
- Vérifier les règles de sécurité Storage
- Vérifier la taille du fichier (< 5MB recommandé)

#### Équipe ne se charge pas
- Vérifier que `companyId` existe dans le profil utilisateur
- Vérifier l'index Firestore (companyId)
- Vérifier les règles Firestore

#### Langue ne change pas
- Vérifier que i18n est importé dans App.jsx
- Vérifier la console pour les erreurs de traduction
- Recharger la page après changement

## 📝 Logs

Pour activer les logs de debug :
```javascript
// Dans UserProfile.jsx, décommenter :
console.log('User data:', userData);
console.log('Company data:', companyData);
console.log('Team members:', teamMembers);
```

## 🤝 Contribution

Pour contribuer au composant UserProfile :
1. Créez une branche feature
2. Ajoutez vos modifications
3. Testez sur mobile et desktop
4. Créez une PR avec description détaillée

## 📄 License

Ce composant fait partie de Stock Easy App.

