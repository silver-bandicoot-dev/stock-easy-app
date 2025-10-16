import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'                    // ← NOUVELLE APP
// import StockEasy from './StockEasy.jsx'     // ← Ancienne (commentée)
import './index.css'
import { testApiConnection, validateDataStructure } from './utils/testApi'

// Test de connexion API au démarrage
testApiConnection().then(result => {
  if (result.success) {
    console.log('✅ API connectée avec succès');
    
    // Valider la structure des données
    validateDataStructure(result.data);
    
    console.log('\n📊 Résumé des données:');
    console.log(`   Produits: ${result.summary.products}`);
    console.log(`   Commandes: ${result.summary.orders}`);
    console.log(`   Fournisseurs: ${result.summary.suppliers}`);
  } else {
    console.error('⚠️ Échec de la connexion API:', result.error);
    console.warn('L\'application va démarrer en mode hors-ligne');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
