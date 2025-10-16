/**
 * Configuration de l'API Google Apps Script
 * 
 * L'URL de l'API est stockée dans les variables d'environnement (.env)
 * pour faciliter le déploiement sur différents environnements.
 */

export const API_URL = import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbzeloLj-PTcTcx5kgxDyCh6iGXXB0cHzug_vsiMCpEDqxlZou7WjjmqqIiPB9PEXzOF/exec';

// Configuration supplémentaire si nécessaire
export const API_CONFIG = {
  timeout: 30000, // 30 secondes
  retryAttempts: 3,
  retryDelay: 1000, // 1 seconde
};

export default API_URL;
