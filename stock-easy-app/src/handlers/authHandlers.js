// ============================================
// HANDLERS AUTH - Extraites de Stockeasy.jsx
// PHASE 12 : Handlers Utilitaires Auth
// ============================================

import { toast } from 'sonner';

/**
 * PHASE 12 : Handler pour la déconnexion
 * @param {Function} logout - Fonction de déconnexion depuis useAuth
 * @param {Function} navigate - Fonction de navigation depuis react-router-dom
 */
export const handleLogout = async (logout, navigate) => {
  try {
    await logout();
    navigate('/login');
    toast.success('Déconnexion réussie');
  } catch (error) {
    toast.error('Erreur lors de la déconnexion');
  }
};

