import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Composant de redirection pour la route /profile
 * Redirige vers l'application principale avec l'onglet profil activé
 * 
 * Ce composant assure la rétrocompatibilité pour :
 * - Les bookmarks existants
 * - Les liens partagés par email
 * - Les anciennes références vers /profile
 */
const ProfileRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Rediriger vers l'app principale avec l'onglet profil
    // L'état 'targetTab' sera capté par StockEasy pour ouvrir le bon onglet
    navigate('/', { 
      replace: true, 
      state: { targetTab: 'profile' } 
    });
  }, [navigate]);

  // Afficher un message pendant la redirection (très bref)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#191919] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium text-[#191919]">Redirection...</p>
      </div>
    </div>
  );
};

export default ProfileRedirect;

