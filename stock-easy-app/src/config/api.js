/**
 * Configuration de l'API Google Apps Script
 * 
 * ⚠️ IMPORTANT: L'URL de l'API devrait être définie dans les variables d'environnement
 * Le fallback est conservé temporairement pour le développement
 * TODO: Retirer le fallback avant le prochain déploiement production
 */

// Utiliser la variable d'environnement ou fallback temporaire
export const API_URL = import.meta.env.VITE_API_URL || 
  'https://script.google.com/macros/s/AKfycbwbALeqnxjjE2rMooRQLvd_BJeJzmFbDLDMNiameT-wzWVHHwRSUdPTQAPt7NzRpgl4/exec';

// Avertissement si on utilise le fallback
if (!import.meta.env.VITE_API_URL) {
  console.warn('⚠️ VITE_API_URL non définie, utilisation du fallback');
  console.warn('🔧 Recommandation: Créez un fichier .env avec VITE_API_URL=votre_url');
}

// Configuration de sécurité API
export const API_CONFIG = {
  timeout: 30000, // 30 secondes
  retryAttempts: 3,
  retryDelay: 1000, // 1 seconde
  // Headers de sécurité (si supporté par Google Apps Script)
  headers: {
    'Content-Type': 'application/json',
  }
};

export default API_URL;
