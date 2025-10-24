import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register new user
  const signup = async (email, password, displayName, additionalData = {}) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    await updateProfile(userCredential.user, {
      displayName: displayName
    });

    // Split displayName into firstName and lastName if not provided
    const [firstName, ...lastNameParts] = displayName.split(' ');
    const lastName = lastNameParts.join(' ');

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      displayName: displayName,
      firstName: additionalData.firstName || firstName,
      lastName: additionalData.lastName || lastName,
      email: email,
      createdAt: new Date().toISOString(),
      role: additionalData.role || 'user',
      language: additionalData.language || 'fr',
      companyId: additionalData.companyId || null,
      photoURL: additionalData.photoURL || null,
      ...additionalData
    });

    return userCredential;
  };

  // Login user
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout user
  const logout = () => {
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Get user data from Firestore
  const getUserData = async (uid) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Get additional user data from Firestore de manière asynchrone
        getUserData(user.uid).then((userData) => {
          setCurrentUser({
            ...user,
            ...userData
          });
          setLoading(false);
        }).catch((error) => {
          console.error('Erreur lors du chargement des données utilisateur:', error);
          // En cas d'erreur, utiliser seulement les données Firebase
          setCurrentUser(user);
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    getUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

