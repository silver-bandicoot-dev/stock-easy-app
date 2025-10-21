import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuration Firebase
// Les valeurs sont chargées depuis les variables d'environnement (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Vérification de la configuration
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'demo-api-key') {
  console.warn('⚠️ Firebase non configuré correctement');
  console.warn('🔧 Vérifiez votre fichier .env avec les variables VITE_FIREBASE_*');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (optionnel, uniquement si measurementId est défini)
export const analytics = firebaseConfig.measurementId ? getAnalytics(app) : null;

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app;

