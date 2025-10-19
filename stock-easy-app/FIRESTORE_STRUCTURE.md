# Structure Firestore pour Stock Easy

## Collections principales

### 1. Collection `users`
Contient les informations de tous les utilisateurs.

```javascript
users/{userId} = {
  // Informations personnelles
  firstName: string,           // Prénom
  lastName: string,            // Nom
  displayName: string,         // Nom complet
  email: string,               // Email (unique)
  photoURL: string | null,     // URL de la photo de profil
  
  // Paramètres
  language: string,            // 'fr' | 'en' | 'es' | 'de'
  role: string,                // 'user' | 'manager' | 'admin'
  
  // Relations
  companyId: string | null,    // ID de l'entreprise
  
  // Métadonnées
  createdAt: timestamp,        // Date de création
  updatedAt: timestamp         // Date de dernière modification
}
```

**Exemple:**
```javascript
{
  firstName: "Jean",
  lastName: "Dupont",
  displayName: "Jean Dupont",
  email: "jean.dupont@example.com",
  photoURL: "https://storage.googleapis.com/...",
  language: "fr",
  role: "admin",
  companyId: "company123",
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-20T14:45:00.000Z"
}
```

### 2. Collection `companies`
Contient les informations des entreprises.

```javascript
companies/{companyId} = {
  name: string,                // Nom de l'entreprise
  description: string,         // Description
  logo: string | null,         // URL du logo
  
  // Métadonnées
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // Paramètres
  settings: {
    defaultLanguage: string,
    timezone: string,
    // ... autres paramètres
  }
}
```

**Exemple:**
```javascript
{
  name: "Entreprise ABC",
  description: "Leader de la distribution",
  logo: "https://storage.googleapis.com/...",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-15T10:00:00.000Z",
  settings: {
    defaultLanguage: "fr",
    timezone: "Europe/Paris"
  }
}
```

### 3. Collection `notifications`
Contient les notifications des utilisateurs.

```javascript
notifications/{notificationId} = {
  userId: string,              // ID de l'utilisateur
  title: string,               // Titre de la notification
  message: string,             // Message
  type: string,                // 'info' | 'success' | 'warning' | 'error'
  read: boolean,               // Lu ou non
  
  // Métadonnées
  createdAt: timestamp
}
```

**Exemple:**
```javascript
{
  userId: "user123",
  title: "Stock faible",
  message: "Le produit XYZ a un stock inférieur au seuil",
  type: "warning",
  read: false,
  createdAt: "2024-01-20T14:30:00.000Z"
}
```

## Règles de sécurité Firestore

Ajoutez ces règles dans Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonction helper pour vérifier l'authentification
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Fonction helper pour vérifier si c'est le propriétaire
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Fonction helper pour vérifier le rôle admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Collection users
    match /users/{userId} {
      // Lecture: tous les users authentifiés peuvent lire tous les profils
      allow read: if isAuthenticated();
      
      // Écriture: seulement son propre profil ou admin
      allow write: if isOwner(userId) || isAdmin();
    }
    
    // Collection companies
    match /companies/{companyId} {
      // Lecture: tous les users authentifiés
      allow read: if isAuthenticated();
      
      // Écriture: seulement les admins
      allow write: if isAdmin();
    }
    
    // Collection notifications
    match /notifications/{notificationId} {
      // Lecture: seulement ses propres notifications
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      
      // Création: n'importe qui peut créer (pour système)
      allow create: if isAuthenticated();
      
      // Mise à jour: seulement ses propres notifications
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
      
      // Suppression: seulement ses propres notifications
      allow delete: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
    }
  }
}
```

## Configuration Storage (pour les photos de profil)

Règles de sécurité pour Firebase Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId}/{allPaths=**} {
      // Permettre la lecture à tous les utilisateurs authentifiés
      allow read: if request.auth != null;
      
      // Permettre l'upload seulement pour son propre dossier
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Indexation recommandée

Pour optimiser les performances, créez ces index dans Firebase Console:

### Index pour notifications
- Collection: `notifications`
- Champs: 
  - `userId` (Ascending)
  - `read` (Ascending)
  - `createdAt` (Descending)

### Index pour users par company
- Collection: `users`
- Champs:
  - `companyId` (Ascending)
  - `role` (Ascending)

## Initialisation des données de test

Pour tester, vous pouvez créer manuellement ces documents dans Firestore:

### 1. Créer une entreprise (optionnel)
Dans la collection `companies`, ajouter un document avec ID `company123`:
```javascript
{
  name: "Ma Super Entreprise",
  description: "Une entreprise de test",
  logo: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  settings: {
    defaultLanguage: "fr",
    timezone: "Europe/Paris"
  }
}
```

### 2. Mettre à jour votre profil utilisateur
Après inscription, mettez à jour votre document dans `users/{votre-uid}`:
```javascript
{
  // ... champs existants
  companyId: "company123",  // Ajouter ceci pour lier à l'entreprise
  role: "admin"             // Changer en admin si nécessaire
}
```

## Requêtes courantes

### Récupérer tous les membres d'une équipe
```javascript
const q = query(
  collection(db, 'users'), 
  where('companyId', '==', companyId)
);
const snapshot = await getDocs(q);
```

### Récupérer les notifications non lues
```javascript
const q = query(
  collection(db, 'notifications'),
  where('userId', '==', currentUser.uid),
  where('read', '==', false),
  orderBy('createdAt', 'desc')
);
const snapshot = await getDocs(q);
```

## Notes importantes

- ⚠️ N'oubliez pas d'activer Firestore Database dans la console Firebase
- ⚠️ N'oubliez pas d'activer Firebase Storage pour les photos de profil
- ⚠️ Les règles de sécurité sont essentielles pour protéger vos données
- ✅ Testez toujours en mode test avant de passer en production

