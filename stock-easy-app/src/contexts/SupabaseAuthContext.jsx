import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const SupabaseAuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session actuelle au chargement
    const checkSession = async () => {
      try {
        // Récupérer la session depuis le storage
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error);
          setCurrentUser(null);
        } else if (session) {
          // Vérifier si le token est toujours valide
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at > now) {
            setCurrentUser(session.user);
          } else {
            // Tenter de rafraîchir le token
            const { data: { session: refreshedSession }, error: refreshError } = 
              await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('Erreur lors du rafraîchissement de la session:', refreshError);
              setCurrentUser(null);
            } else {
              setCurrentUser(refreshedSession?.user ?? null);
            }
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la session:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setCurrentUser(session?.user ?? null);
        } else {
          setCurrentUser(session?.user ?? null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Connexion
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { user: null, error };
    }
  };

  // Inscription
  const signup = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/confirm-email`,
        },
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return { user: null, error };
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      return { error: null };
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      return { error };
    }
  };

  // Réinitialisation du mot de passe
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erreur de réinitialisation:', error);
      return { error };
    }
  };

  // Mise à jour du mot de passe
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erreur de mise à jour du mot de passe:', error);
      return { error };
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export default SupabaseAuthContext;

